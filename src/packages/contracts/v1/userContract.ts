import { z } from 'zod';

/**
 * Contratto v1: Dati di identità federata restituiti da Google SSO
 */
export const UserIdentitySchemaV1 = z.object({
  uid: z.string().min(1, 'UID utente obbligatorio').max(128),
  email: z.string().email('Email non valida').max(256),
  emailVerified: z.boolean().default(true),
  displayName: z.string().min(1).max(128),
  photoURL: z.string().url('URL avatar non valido').max(1024).optional(),
  providerId: z.literal('google.com').default('google.com'),
  registeredAt: z.string().datetime({ message: 'Timestamp registrazione in formato ISO obbligatorio' }),
  lastLoginAt: z.string().datetime({ message: 'Timestamp ultimo login in formato ISO obbligatorio' }),
});

export type UserIdentityV1 = z.infer<typeof UserIdentitySchemaV1>;

/**
 * Contratto v1: Metriche di sessione attiva e telemetria di clocking
 */
export const UserSessionSchemaV1 = z.object({
  sessionId: z.string().min(1).max(128),
  userId: z.string().min(1).max(128),
  email: z.string().email().max(256),
  startedAt: z.string().datetime(),
  lastActiveAt: z.string().datetime(),
  durationSeconds: z.number().int().nonnegative().default(0),
  heartbeatCount: z.number().int().nonnegative().default(0),
  status: z.enum(['active', 'idle', 'expired']).default('active'),
  userAgent: z.string().max(512).optional(),
});

export type UserSessionV1 = z.infer<typeof UserSessionSchemaV1>;

/**
 * Contratto v1: Livelli di accesso e permessi applicativi RBAC
 */
export const UserRoleSchemaV1 = z.enum(['superadmin', 'admin', 'operator', 'member', 'guest']);
export type UserRoleV1 = z.infer<typeof UserRoleSchemaV1>;

export const UserPermissionSchemaV1 = z.enum([
  'users:read',
  'users:write',
  'audit:read',
  'audit:export',
  'resources:read',
  'resources:write',
  'system:diagnostics',
]);
export type UserPermissionV1 = z.infer<typeof UserPermissionSchemaV1>;

export const UserResourceAccessSchemaV1 = z.object({
  role: UserRoleSchemaV1.default('member'),
  permissions: z.array(UserPermissionSchemaV1).default(['users:read', 'resources:read', 'audit:read']),
  assignedResourcesCount: z.number().int().nonnegative().default(1),
  mfaEnabled: z.boolean().default(false),
});

export type UserResourceAccessV1 = z.infer<typeof UserResourceAccessSchemaV1>;

/**
 * Contratto v1 completo: aggregato per la risorsa "Dettaglio Utente"
 */
export const UserDetailResourceContractV1 = z.object({
  version: z.literal('v1').default('v1'),
  identity: UserIdentitySchemaV1,
  session: UserSessionSchemaV1.optional(),
  access: UserResourceAccessSchemaV1.default({
    role: 'member',
    permissions: ['users:read', 'resources:read', 'audit:read'],
    assignedResourcesCount: 1,
    mfaEnabled: false,
  }),
});

export type UserDetailResourceV1 = z.infer<typeof UserDetailResourceContractV1>;
