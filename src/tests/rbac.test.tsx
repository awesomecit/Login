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
function HookTestComponent({ requiredRole, exactMatch }: { requiredRole: UserRole | string; exactMatch?: boolean }) {
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
      expect(isUserRole('superadmin')).toBe(true);
      expect(isUserRole('admin')).toBe(true);
      expect(isUserRole('operator')).toBe(true);
      expect(isUserRole('member')).toBe(true);
      expect(isUserRole('guest')).toBe(true);
      expect(isUserRole('invalid_role')).toBe(false);
      expect(isUserRole(null)).toBe(false);
      expect(isUserRole(123)).toBe(false);
    });

    it('ranks roles hierarchically in ROLE_HIERARCHY (superadmin > admin > operator > member > guest)', () => {
      expect(ROLE_HIERARCHY.superadmin).toBeGreaterThan(ROLE_HIERARCHY.admin);
      expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.operator);
      expect(ROLE_HIERARCHY.operator).toBeGreaterThan(ROLE_HIERARCHY.member);
      expect(ROLE_HIERARCHY.member).toBeGreaterThan(ROLE_HIERARCHY.guest);
      expect(ROLE_RANKS).toBe(ROLE_HIERARCHY);
    });

    it('normalizes roles and handles member as default user', () => {
      expect(normalizeRole('admin')).toBe('admin');
      expect(normalizeRole('superadmin')).toBe('superadmin');
      expect(normalizeRole('operator')).toBe('operator');
      expect(normalizeRole('member')).toBe('member');
      expect(normalizeRole('user')).toBe('member');
      expect(normalizeRole('guest')).toBe('guest');
      expect(normalizeRole(null)).toBe('guest');
    });

    it('allows admin hierarchical access to member and guest levels', () => {
      expect(isRoleAuthorized('admin', 'admin')).toBe(true);
      expect(isRoleAuthorized('admin', 'member')).toBe(true);
      expect(isRoleAuthorized('admin', 'guest')).toBe(true);
    });

    it('allows member access to member and guest, but denies admin', () => {
      expect(isRoleAuthorized('member', 'admin')).toBe(false);
      expect(isRoleAuthorized('member', 'member')).toBe(true);
      expect(isRoleAuthorized('member', 'guest')).toBe(true);
    });

    it('restricts guest to guest only', () => {
      expect(isRoleAuthorized('guest', 'admin')).toBe(false);
      expect(isRoleAuthorized('guest', 'member')).toBe(false);
      expect(isRoleAuthorized('guest', 'guest')).toBe(true);
    });

    it('respects exactMatch when specified', () => {
      expect(isRoleAuthorized('admin', 'member', true)).toBe(false);
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
      expect(screen.getByTestId('currentRole').textContent).toBe('member');
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
        <RoleGuard requiredRole="member">
          <div>Members Area</div>
        </RoleGuard>
      );

      expect(container.firstChild).toBeNull();
    });
  });
});
