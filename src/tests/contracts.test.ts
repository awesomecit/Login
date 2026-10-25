import { describe, it, expect } from 'vitest';
import {
  UserIdentitySchemaV1,
  UserSessionSchemaV1,
  UserDetailResourceContractV1,
  uiContractRegistry,
} from '../packages/contracts/index.ts';

describe('V1 Zod Contracts Registry', () => {
  it('validates correct user identity payload', () => {
    const validUser = {
      uid: 'user_12345',
      email: 'test@example.com',
      emailVerified: true,
      displayName: 'Mario Rossi',
      providerId: 'google.com',
      registeredAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const res = UserIdentitySchemaV1.safeParse(validUser);
    expect(res.success).toBe(true);
  });

  it('rejects invalid email in user identity payload', () => {
    const invalidUser = {
      uid: 'user_12345',
      email: 'not-an-email',
      displayName: 'Mario Rossi',
      providerId: 'google.com',
      registeredAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };

    const res = UserIdentitySchemaV1.safeParse(invalidUser);
    expect(res.success).toBe(false);
  });

  it('validates complete UserDetailResourceContractV1', () => {
    const fullResource = {
      version: 'v1',
      identity: {
        uid: 'user_999',
        email: 'dev@nexus.corp',
        emailVerified: true,
        displayName: 'Dev User',
        registeredAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
      session: {
        sessionId: 'sess_123',
        userId: 'user_999',
        email: 'dev@nexus.corp',
        startedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        durationSeconds: 120,
        heartbeatCount: 2,
        status: 'active',
      },
      access: {
        role: 'member',
        permissions: ['users:read', 'resources:read', 'audit:read'],
        assignedResourcesCount: 1,
        mfaEnabled: true,
      },
    };

    const res = UserDetailResourceContractV1.safeParse(fullResource);
    expect(res.success).toBe(true);
  });

  it('provides registered UI contracts in uiContractRegistry', () => {
    const contract = uiContractRegistry.get('user-detail-view');
    expect(contract).toBeDefined();
    expect(contract?.version).toBe('v1');
    expect(contract?.requiredApis.length).toBeGreaterThan(0);
  });
});
