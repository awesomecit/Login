import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import React from 'react';
import { UserDetailView } from '../components/UserDetailView.tsx';
import { LanguageSelector } from '../components/LanguageSelector.tsx';
import { store } from '../lib/store.ts';

describe('UserDetailView & LanguageSelector Components', () => {
  beforeEach(() => {
    store.setDebugMode(false);
    store.setUser({
      uid: 'user_test_456',
      email: 'alex@example.com',
      displayName: 'Alex Rivers',
      providerId: 'google.com',
      registeredAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      role: 'member',
    });
  });

  it('renders clean non-technical view for standard member', () => {
    render(<UserDetailView />);
    // Standard user sees friendly title
    expect(screen.getByText('Dettaglio Profilo')).toBeDefined();
    expect(screen.getByText('Alex Rivers')).toBeDefined();
    expect(screen.getAllByText('alex@example.com').length).toBeGreaterThan(0);
    expect(screen.getByText('Profilo Personale')).toBeDefined();
    expect(screen.getByText('Sessione & Sicurezza')).toBeDefined();
    expect(screen.getByText('I Miei Permessi')).toBeDefined();

    // Technical tools should NOT be rendered for standard user
    expect(screen.queryByText('Contratti UI & API (Zod)')).toBeNull();
    expect(screen.queryByText(/Heartbeat Test/i)).toBeNull();
    expect(screen.queryByText(/Simulatore di Ruoli RBAC/i)).toBeNull();
  });

  it('renders diagnostic and contract inspection tools for admin or in debug mode', () => {
    cleanup();
    // Simulate admin role or debug mode
    store.setUserRole('admin');

    render(<UserDetailView />);
    expect(screen.getByText('Dettaglio Risorsa Utente')).toBeDefined();
    expect(screen.getByText('Profilo & Identità OAuth')).toBeDefined();
    expect(screen.getByText('Contratti UI & API (Zod)')).toBeDefined();
    expect(screen.getByText(/Heartbeat Test/i)).toBeDefined();
  });

  it('renders LanguageSelector with accessible select dropdown', () => {
    cleanup();
    render(<LanguageSelector />);
    const select = screen.getByLabelText("Seleziona la lingua dell'interfaccia");
    expect(select).toBeDefined();
  });
});
