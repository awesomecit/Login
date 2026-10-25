import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SessionTimeoutModal } from '../components/SessionTimeoutModal.tsx';
import { store } from '../lib/store.ts';

describe('Automatic Session Timeout & Warning Modal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    store.setLanguage('it');
    store.setUser({
      uid: 'user_timeout_test',
      email: 'timeout@example.com',
      displayName: 'Timeout User',
      providerId: 'google.com',
      registeredAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      role: 'member',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders modal with formatted countdown and warning message when open in Italian', () => {
    const handleExtend = vi.fn();
    const handleSignOut = vi.fn();

    render(
      <SessionTimeoutModal
        isOpen={true}
        secondsRemaining={119}
        totalWarningSeconds={120}
        onExtend={handleExtend}
        onSignOut={handleSignOut}
      />
    );

    // Modal elements in Italian
    expect(screen.getByText('Avviso di Inattività')).toBeDefined();
    expect(screen.getByText('01:59')).toBeDefined();
    expect(screen.getByText('Rimani Connesso')).toBeDefined();
    expect(screen.getByText('Disconnetti Adesso')).toBeDefined();
  });

  it('renders modal in English when interface language is English', () => {
    store.setLanguage('en');
    const handleExtend = vi.fn();
    const handleSignOut = vi.fn();

    render(
      <SessionTimeoutModal
        isOpen={true}
        secondsRemaining={119}
        totalWarningSeconds={120}
        onExtend={handleExtend}
        onSignOut={handleSignOut}
      />
    );

    // Modal elements in English
    expect(screen.getByText('Inactivity Warning')).toBeDefined();
    expect(screen.getByText('01:59')).toBeDefined();
    expect(screen.getByText('Stay Logged In')).toBeDefined();
    expect(screen.getByText('Sign Out Now')).toBeDefined();
  });

  it('calls onExtend when stay logged in button is clicked', () => {
    const handleExtend = vi.fn();
    const handleSignOut = vi.fn();

    render(
      <SessionTimeoutModal
        isOpen={true}
        secondsRemaining={90}
        totalWarningSeconds={120}
        onExtend={handleExtend}
        onSignOut={handleSignOut}
      />
    );

    const stayLoggedInBtn = screen.getByText('Rimani Connesso');
    fireEvent.click(stayLoggedInBtn);
    expect(handleExtend).toHaveBeenCalledTimes(1);
    expect(handleSignOut).not.toHaveBeenCalled();
  });

  it('calls onSignOut when sign out button is clicked', () => {
    const handleExtend = vi.fn();
    const handleSignOut = vi.fn();

    render(
      <SessionTimeoutModal
        isOpen={true}
        secondsRemaining={45}
        totalWarningSeconds={120}
        onExtend={handleExtend}
        onSignOut={handleSignOut}
      />
    );

    const signOutBtn = screen.getByText('Disconnetti Adesso');
    fireEvent.click(signOutBtn);
    expect(handleSignOut).toHaveBeenCalledTimes(1);
    expect(handleExtend).not.toHaveBeenCalled();
  });

  it('does not render when isOpen is false', () => {
    const handleExtend = vi.fn();
    const handleSignOut = vi.fn();

    const { container } = render(
      <SessionTimeoutModal
        isOpen={false}
        secondsRemaining={120}
        totalWarningSeconds={120}
        onExtend={handleExtend}
        onSignOut={handleSignOut}
      />
    );

    expect(container.firstChild).toBeNull();
  });
});
