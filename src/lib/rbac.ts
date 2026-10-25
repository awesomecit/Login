import React from 'react';
import { UserPermissionV1, UserRoleV1, UserProfile } from './types.ts';
import { useAuthStore } from './store.ts';

/**
 * 1. Definizione dei ruoli utente standard
 */
export type UserRole = 'admin' | 'user' | 'guest';

export const USER_ROLES: readonly UserRole[] = ['admin', 'user', 'guest'] as const;

/**
 * 2. Definizione della gerarchia: admin > user > guest
 * admin (3): accesso globale a tutte le sezioni
 * user  (2): accesso alle funzionalità membro e guest
 * guest (1): accesso di sola lettura per risorse base
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  user: 2,
  guest: 1,
};

/** Alias per compatibilità con test esistenti */
export const ROLE_RANKS = ROLE_HIERARCHY;

export const BOOTSTRAPPED_ADMIN_EMAILS: readonly string[] = [
  'awesome.cit.dev@gmail.com',
];

/**
 * 3. Type Guard per verificare se un valore è un UserRole valido
 */
export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && (USER_ROLES as readonly string[]).includes(value);
}

/**
 * Normalizza qualsiasi variante o alias di ruolo nel trio standard (admin, user, guest)
 */
export function normalizeRole(role?: string | null): UserRole {
  if (!role) return 'guest';
  const clean = role.toLowerCase().trim();
  if (clean === 'admin' || clean === 'superadmin') return 'admin';
  if (clean === 'guest') return 'guest';
  // 'member', 'operator', 'user' mappano allo standard 'user'
  return 'user';
}

/**
 * 4. Funzione helper per determinare se il ruolo garantisce l'accesso richiesto
 * Valutazione gerarchica di default: admin (3) >= user (2) >= guest (1)
 * Con exactMatch: true, richiede corrispondenza esatta senza ereditarietà
 */
export function hasRequiredRole(
  currentRole: unknown,
  requiredRole: UserRole,
  exactMatch = false
): boolean {
  const normalized = normalizeRole(typeof currentRole === 'string' ? currentRole : null);
  if (exactMatch) {
    return normalized === requiredRole;
  }
  return ROLE_HIERARCHY[normalized] >= ROLE_HIERARCHY[requiredRole];
}

/** Alias per retrocompatibilità */
export const isRoleAuthorized = hasRequiredRole;

export interface UseRoleAccessOptions {
  /** Se true, richiede corrispondenza esatta invece del controllo gerarchico */
  exactMatch?: boolean;
}

export interface RoleAccessResult {
  /** Indica se l'utente possiede l'autorizzazione per il ruolo richiesto */
  hasAccess: boolean;
  /** Ruolo normalizzato corrente ('admin' | 'user' | 'guest') */
  currentRole: UserRole;
  /** Ruolo grezzo registrato nel profilo utente */
  rawRole: string | undefined;
  /** Flag di comodo per verificare se l'utente è amministratore */
  isAdmin: boolean;
  /** Flag di comodo per verificare se l'utente è un utente standard o superiore */
  isUser: boolean;
  /** Flag di comodo per verificare se l'utente ha solo permessi guest */
  isGuest: boolean;
  /** Profilo utente corrente dallo store */
  user: UserProfile | null;
  /** Metodo per verificare dinamicamente altri ruoli */
  isAuthorizedFor: (role: UserRole, exact?: boolean) => boolean;
}

/**
 * Hook React per proteggere e condizionare componenti e azioni basandosi
 * sul ruolo dell'utente memorizzato nello store Firebase
 */
export function useRoleAccess(
  requiredRole: UserRole = 'guest',
  options?: UseRoleAccessOptions
): RoleAccessResult {
  const { user, isDebugMode } = useAuthStore();
  const currentRole = normalizeRole(user?.role);
  const hasAccess =
    isDebugMode || hasRequiredRole(user?.role, requiredRole, options?.exactMatch);

  const isAuthorizedFor = (role: UserRole, exact = false): boolean => {
    if (isDebugMode) return true;
    return hasRequiredRole(user?.role, role, exact);
  };

  return {
    hasAccess,
    currentRole,
    rawRole: user?.role,
    isAdmin: currentRole === 'admin',
    isUser: currentRole === 'user' || currentRole === 'admin',
    isGuest: currentRole === 'guest',
    user,
    isAuthorizedFor,
  };
}

export interface RoleGuardProps {
  /** Ruolo minimo richiesto per visualizzare il contenuto */
  requiredRole: UserRole;
  /** Se true, richiede corrispondenza esatta senza ereditarietà */
  exactMatch?: boolean;
  /** Contenuto facoltativo di fallback da mostrare se non autorizzato */
  fallback?: React.ReactNode;
  /** Componenti figli protetti */
  children: React.ReactNode;
}

/**
 * Componente dichiarativo RoleGuard per condizionare la renderizzazione
 * di sezioni UI in base al ruolo dell'utente
 */
export function RoleGuard({
  requiredRole,
  exactMatch = false,
  fallback = null,
  children,
}: RoleGuardProps): React.ReactElement | null {
  const { hasAccess } = useRoleAccess(requiredRole, { exactMatch });

  if (!hasAccess) {
    return fallback ? React.createElement(React.Fragment, null, fallback) : null;
  }

  return React.createElement(React.Fragment, null, children);
}

// -------------------------------------------------------------
// Retrocompatibilità con i permessi granulari esistenti
// -------------------------------------------------------------

export const ROLE_PERMISSIONS_MAP: Record<UserRoleV1, UserPermissionV1[]> = {
  superadmin: [
    'users:read',
    'users:write',
    'audit:read',
    'audit:export',
    'resources:read',
    'resources:write',
    'system:diagnostics',
  ],
  admin: [
    'users:read',
    'users:write',
    'audit:read',
    'audit:export',
    'resources:read',
    'resources:write',
    'system:diagnostics',
  ],
  operator: [
    'users:read',
    'audit:read',
    'resources:read',
    'system:diagnostics',
  ],
  member: [
    'users:read',
    'resources:read',
  ],
  guest: [
    'resources:read',
  ],
};

export const ALL_ROLES: readonly UserRoleV1[] = [
  'admin',
  'operator',
  'member',
  'guest',
] as const;

export const ALL_PERMISSIONS: readonly {
  id: UserPermissionV1;
  label: string;
  description: string;
  category: 'users' | 'audit' | 'resources' | 'system';
}[] = [
  {
    id: 'users:read',
    label: 'Lettura Utenti',
    description: 'Visualizzazione dati profilo e identificativi di identità',
    category: 'users',
  },
  {
    id: 'users:write',
    label: 'Modifica Utenti',
    description: 'Aggiornamento attributi profilo e metadati utente',
    category: 'users',
  },
  {
    id: 'audit:read',
    label: 'Lettura Audit Log',
    description: 'Accesso ai registri di sicurezza e telemetria di sessione',
    category: 'audit',
  },
  {
    id: 'audit:export',
    label: 'Export Audit Log',
    description: 'Esportazione log strutturati e tracce di conformità',
    category: 'audit',
  },
  {
    id: 'resources:read',
    label: 'Lettura Risorse',
    description: 'Consultazione risorse cloud e permessi attribuiti',
    category: 'resources',
  },
  {
    id: 'resources:write',
    label: 'Gestione Risorse',
    description: 'Creazione e modifica risorse e contratti applicativi',
    category: 'resources',
  },
  {
    id: 'system:diagnostics',
    label: 'Diagnostica & Test',
    description: 'Accesso a ispezione Zod, simulatore HTTP e heartbeat test',
    category: 'system',
  },
];

export function getDefaultRoleForEmail(email?: string | null): UserRoleV1 {
  if (!email) return 'member';
  const cleanEmail = email.trim().toLowerCase();
  if (BOOTSTRAPPED_ADMIN_EMAILS.includes(cleanEmail)) {
    return 'admin';
  }
  return 'member';
}

export function getPermissionsForRole(role: UserRoleV1): UserPermissionV1[] {
  return ROLE_PERMISSIONS_MAP[role] || ROLE_PERMISSIONS_MAP.member;
}

export function hasUserPermission(
  user: UserProfile | null,
  permission: UserPermissionV1,
  isDebugMode = false
): boolean {
  if (isDebugMode) return true;
  if (!user) return false;
  const role = user.role || getDefaultRoleForEmail(user.email);
  if (role === 'admin' || role === 'superadmin') return true;
  const perms = user.permissions || getPermissionsForRole(role);
  return perms.includes(permission);
}

export function canAccessTestingTools(
  user: UserProfile | null,
  isDebugMode = false
): boolean {
  if (isDebugMode) return true;
  if (!user) return false;
  const role = user.role || getDefaultRoleForEmail(user.email);
  return role === 'admin' || role === 'superadmin' || role === 'operator';
}
