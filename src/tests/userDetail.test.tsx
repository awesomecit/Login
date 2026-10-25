import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
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
    expect(screen.getByText('I Miei Permessi')).toBeDefined();

    // Advanced/Debug view and debug tools should NOT be rendered for standard non-debug user
    expect(screen.queryByText(/Avanzate & Debug/i)).toBeNull();
    expect(screen.queryByText('Contratti UI & API (Zod)')).toBeNull();
    expect(screen.queryByText(/Sicurezza & Sessione/i)).toBeNull();
    expect(screen.queryByText(/Heartbeat Test/i)).toBeNull();
    expect(screen.queryByText(/Simulatore di Ruoli RBAC/i)).toBeNull();
  });

  it('renders conditional Advanced/Debug view for admin or in debug mode', () => {
    cleanup();
    store.setUserRole('admin');
    store.setDebugMode(true);

    render(<UserDetailView />);
    expect(screen.getByText('Dettaglio Risorsa Utente')).toBeDefined();
    expect(screen.getByText('Profilo & Identità OAuth')).toBeDefined();

    // Advanced/Debug tab is visible
    const advancedTab = screen.getByText(/Avanzate & Debug/i);
    expect(advancedTab).toBeDefined();

    // Click into the Advanced / Debug view
    fireEvent.click(advancedTab);

    // Now security telemetry, heartbeat, and contracts inspection tools are accessible
    expect(screen.getAllByText(/Sicurezza & Sessione/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Heartbeat Test/i)).toBeDefined();

    // Switch to contracts sub-tab
    const contractsSubTab = screen.getByText('Contratti UI & API (Zod)');
    expect(contractsSubTab).toBeDefined();
    fireEvent.click(contractsSubTab);
    expect(screen.getByText(/Payload JSON Validato/i)).toBeDefined();
  });

  it('renders LanguageSelector with accessible select dropdown', () => {
    cleanup();
    render(<LanguageSelector />);
    const select = screen.getByLabelText("Seleziona la lingua dell'interfaccia");
    expect(select).toBeDefined();
  });
});
