/**
 * Core type definitions for the Google SSO Authentication Portal
 */

export type Language = 'it' | 'en';

export type AuthMode = 'signin' | 'signup';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

import type { UserRoleV1, UserPermissionV1 } from '../packages/contracts/v1/userContract.ts';

export type { UserRoleV1, UserPermissionV1 };

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  providerId: string;
  registeredAt: string;
  lastLoginAt: string;
  role?: UserRoleV1;
  permissions?: UserPermissionV1[];
}

export interface StructuredLog {
  id: string;
  timestamp: string;
  level: LogLevel;
  context: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  duration?: number;
}

export interface HttpRequestOptions extends RequestInit {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
  logContext?: string;
}

export interface HttpResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  latencyMs: number;
  url: string;
}

export interface HttpErrorDetails {
  message: string;
  status?: number;
  statusText?: string;
  latencyMs?: number;
  url?: string;
  originalError?: unknown;
}
