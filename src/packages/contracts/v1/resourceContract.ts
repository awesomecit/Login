import { z } from 'zod';

/**
 * Contratto v1: Singola entità risorsa gestita (es. file, configurazione, database o workspace)
 */
export const ResourceTypeSchemaV1 = z.enum([
  'workspace',
  'database',
  'api_key',
  'audit_log',
  'security_policy',
  'user_profile',
]);
export type ResourceTypeV1 = z.infer<typeof ResourceTypeSchemaV1>;

export const ResourceItemSchemaV1 = z.object({
  id: z.string().min(1).max(128),
  name: z.string().min(1).max(128),
  type: ResourceTypeSchemaV1,
  description: z.string().max(512).optional(),
  ownerId: z.string().min(1).max(128),
  isPublic: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  tags: z.array(z.string().max(32)).max(10).default([]),
  permissions: z.object({
    canRead: z.boolean().default(true),
    canWrite: z.boolean().default(false),
    canDelete: z.boolean().default(false),
    canAdmin: z.boolean().default(false),
  }),
});

export type ResourceItemV1 = z.infer<typeof ResourceItemSchemaV1>;

/**
 * Contratto v1: Filtri e parametri per query risorse
 */
export const ResourceQueryFilterSchemaV1 = z.object({
  type: ResourceTypeSchemaV1.optional(),
  search: z.string().max(100).optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().nonnegative().default(0),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type ResourceQueryFilterV1 = z.infer<typeof ResourceQueryFilterSchemaV1>;
