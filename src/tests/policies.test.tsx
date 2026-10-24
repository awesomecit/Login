import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { StandalonePolicyModal, PolicyConfig } from '../packages/policies/index.ts';

const mockConfig: PolicyConfig = {
  brandName: 'TestApp',
  labels: {
    termsTab: 'Termini di Servizio',
    privacyTab: 'Informativa Privacy',
    closeButton: 'Chiudi',
  },
  terms: {
    title: 'Condizioni Generali di Servizio',
    lastUpdatedText: 'Aggiornato 2026',
    sections: [
      {
        title: 'Sezione 1: Accesso OAuth',
        body: 'Accesso federato con credenziali protette.',
      },
    ],
  },
  privacy: {
    title: 'Informativa sulla Privacy',
    complianceBadge: 'GDPR Verified',
    sections: [
      {
        title: 'Sezione 1: Raccolta Dati Minimi',
        body: 'Trattiamo solo email e nome pubblico.',
      },
    ],
  },
};

describe('StandalonePolicyModal', () => {
  it('renders terms tab by default and shows terms content', () => {
    const handleClose = vi.fn();
    render(
      <StandalonePolicyModal
        isOpen={true}
        activeTab="terms"
        config={mockConfig}
        onClose={handleClose}
      />
    );

    expect(screen.getByText('Condizioni Generali di Servizio')).toBeDefined();
    expect(screen.getByText('Sezione 1: Accesso OAuth')).toBeDefined();
  });

  it('switches to privacy tab on tab click', () => {
    const handleClose = vi.fn();
    const handleTabChange = vi.fn();

    render(
      <StandalonePolicyModal
        isOpen={true}
        activeTab="terms"
        config={mockConfig}
        onClose={handleClose}
        onTabChange={handleTabChange}
      />
    );

    const privacyTabBtn = screen.getByText('Informativa Privacy');
    fireEvent.click(privacyTabBtn);

    expect(screen.getByText('Informativa sulla Privacy')).toBeDefined();
    expect(screen.getByText('Sezione 1: Raccolta Dati Minimi')).toBeDefined();
    expect(screen.getByText('GDPR Verified')).toBeDefined();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    render(
      <StandalonePolicyModal
        isOpen={true}
        config={mockConfig}
        onClose={handleClose}
      />
    );

    const closeBtn = screen.getByText('Chiudi');
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledOnce();
  });
});
