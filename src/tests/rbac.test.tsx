import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import {
  UserRole,
  ROLE_HIERARCHY,
  ROLE_RANKS,
  isUserRole,
  hasRequiredRole,
  normalizeRole,
  isRoleAuthorized,
  useRoleAccess,
  RoleGuard,
} from '../lib/rbac.ts';
import { store } from '../lib/store.ts';

// Test harness component for useRoleAccess hook
function HookTestComponent({ requiredRole, exactMatch }: { requiredRole: UserRole; exactMatch?: boolean }) {
  const { hasAccess, currentRole, isAdmin, isUser, isGuest } = useRoleAccess(requiredRole, { exactMatch });
  return (
    <div>
      <span data-testid="hasAccess">{String(hasAccess)}</span>
      <span data-testid="currentRole">{currentRole}</span>
      <span data-testid="isAdmin">{String(isAdmin)}</span>
      <span data-testid="isUser">{String(isUser)}</span>
      <span data-testid="isGuest">{String(isGuest)}</span>
    </div>
  );
}

describe('RBAC Roles, useRoleAccess & RoleGuard', () => {
  beforeEach(() => {
    store.setDebugMode(false);
  });

  describe('isRoleAuthorized & Hierarchy', () => {
    it('validates user roles using isUserRole type guard', () => {
      expect(isUserRole('admin')).toBe(true);
      expect(isUserRole('user')).toBe(true);
      expect(isUserRole('guest')).toBe(true);
      expect(isUserRole('superadmin')).toBe(false);
      expect(isUserRole('invalid_role')).toBe(false);
      expect(isUserRole(null)).toBe(false);
      expect(isUserRole(123)).toBe(false);
    });

    it('ranks roles hierarchically in ROLE_HIERARCHY (admin > user > guest)', () => {
      expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.user);
      expect(ROLE_HIERARCHY.user).toBeGreaterThan(ROLE_HIERARCHY.guest);
      expect(ROLE_RANKS).toBe(ROLE_HIERARCHY);
    });

    it('normalizes roles and handles member as user', () => {
      expect(normalizeRole('admin')).toBe('admin');
      expect(normalizeRole('superadmin')).toBe('admin');
      expect(normalizeRole('member')).toBe('user');
      expect(normalizeRole('user')).toBe('user');
      expect(normalizeRole('guest')).toBe('guest');
      expect(normalizeRole(null)).toBe('guest');
    });

    it('allows admin hierarchical access to user and guest levels', () => {
      expect(isRoleAuthorized('admin', 'admin')).toBe(true);
      expect(isRoleAuthorized('admin', 'user')).toBe(true);
      expect(isRoleAuthorized('admin', 'guest')).toBe(true);
    });

    it('allows user access to user and guest, but denies admin', () => {
      expect(isRoleAuthorized('user', 'admin')).toBe(false);
      expect(isRoleAuthorized('user', 'user')).toBe(true);
      expect(isRoleAuthorized('user', 'guest')).toBe(true);
    });

    it('restricts guest to guest only', () => {
      expect(isRoleAuthorized('guest', 'admin')).toBe(false);
      expect(isRoleAuthorized('guest', 'user')).toBe(false);
      expect(isRoleAuthorized('guest', 'guest')).toBe(true);
    });

    it('respects exactMatch when specified', () => {
      expect(isRoleAuthorized('admin', 'user', true)).toBe(false);
      expect(isRoleAuthorized('admin', 'admin', true)).toBe(true);
    });
  });

  describe('useRoleAccess hook', () => {
    it('returns hasAccess: true and isAdmin: true for admin user', () => {
      store.setUser({
        uid: 'admin_123',
        email: 'awesome.cit.dev@gmail.com',
        displayName: 'Admin User',
        providerId: 'google.com',
        registeredAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        role: 'admin',
      });

      render(<HookTestComponent requiredRole="admin" />);
      expect(screen.getByTestId('hasAccess').textContent).toBe('true');
      expect(screen.getByTestId('currentRole').textContent).toBe('admin');
      expect(screen.getByTestId('isAdmin').textContent).toBe('true');
      expect(screen.getByTestId('isUser').textContent).toBe('true');
      expect(screen.getByTestId('isGuest').textContent).toBe('false');
    });

    it('returns hasAccess: false when standard user requests admin', () => {
      store.setUser({
        uid: 'user_456',
        email: 'standard@example.com',
        displayName: 'Standard User',
        providerId: 'google.com',
        registeredAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        role: 'member',
      });

      render(<HookTestComponent requiredRole="admin" />);
      expect(screen.getByTestId('hasAccess').textContent).toBe('false');
      expect(screen.getByTestId('currentRole').textContent).toBe('user');
      expect(screen.getByTestId('isAdmin').textContent).toBe('false');
      expect(screen.getByTestId('isUser').textContent).toBe('true');
    });
  });

  describe('RoleGuard component', () => {
    it('renders protected children when role is authorized', () => {
      store.setUser({
        uid: 'admin_123',
        email: 'awesome.cit.dev@gmail.com',
        displayName: 'Admin User',
        providerId: 'google.com',
        registeredAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        role: 'admin',
      });

      render(
        <RoleGuard requiredRole="admin">
          <div>Secret Admin Panel</div>
        </RoleGuard>
      );

      expect(screen.getByText('Secret Admin Panel')).toBeDefined();
    });

    it('renders fallback when role is not authorized', () => {
      store.setUser({
        uid: 'user_456',
        email: 'standard@example.com',
        displayName: 'Standard User',
        providerId: 'google.com',
        registeredAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        role: 'member',
      });

      render(
        <RoleGuard
          requiredRole="admin"
          fallback={<div>Access Denied: Admin Required</div>}
        >
          <div>Secret Admin Panel</div>
        </RoleGuard>
      );

      expect(screen.queryByText('Secret Admin Panel')).toBeNull();
      expect(screen.getByText('Access Denied: Admin Required')).toBeDefined();
    });

    it('renders nothing when unauthorized and no fallback provided', () => {
      store.setUser({
        uid: 'guest_789',
        email: 'guest@example.com',
        displayName: 'Guest User',
        providerId: 'google.com',
        registeredAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        role: 'guest',
      });

      const { container } = render(
        <RoleGuard requiredRole="user">
          <div>Members Area</div>
        </RoleGuard>
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
