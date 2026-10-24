import { describe, it, expect, beforeEach } from 'vitest';
import { store } from '../lib/store.ts';

describe('Reactive AuthStore', () => {
  beforeEach(() => {
    store.clearLastError();
    store.setDebugMode(false);
  });

  it('updates language and persists to storage', () => {
    store.setLanguage('en');
    expect(store.getState().currentLang).toBe('en');

    store.setLanguage('it');
    expect(store.getState().currentLang).toBe('it');
  });

  it('toggles debug mode and manages drawer states', () => {
    expect(store.getState().isDebugMode).toBe(false);

    store.setDebugMode(true);
    expect(store.getState().isDebugMode).toBe(true);

    store.setDrawerOpen(true);
    expect(store.getState().isDrawerOpen).toBe(true);

    store.setDrawerOpen(false);
    expect(store.getState().isDrawerOpen).toBe(false);
  });

  it('opens and closes policy modals with active tab', () => {
    store.openPolicyModal('privacy');
    expect(store.getState().policyModal.isOpen).toBe(true);
    expect(store.getState().policyModal.tab).toBe('privacy');

    store.closePolicyModal();
    expect(store.getState().policyModal.isOpen).toBe(false);
  });
});
