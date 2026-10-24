/**
 * Reusable Session Clocking & Audit Trail Types
 */

export type AuditEventType =
  | 'signin'
  | 'signup'
  | 'signout'
  | 'session_start'
  | 'session_heartbeat'
  | 'session_end'
  | 'policy_view'
  | 'http_call'
  | 'custom';

export type AuditStatus = 'success' | 'failure' | 'warning';

export interface AuditEvent {
  id: string;
  userId: string;
  email: string;
  eventType: AuditEventType;
  timestamp: string;
  status: AuditStatus;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  email: string;
  startedAt: string;
  lastActiveAt: string;
  endedAt?: string;
  durationSeconds?: number;
}

export interface AuditAdapter {
  name: string;
  recordEvent: (event: AuditEvent) => Promise<void>;
  recordSession?: (session: SessionInfo) => Promise<void>;
}

export interface AuditTrackerOptions {
  adapter: AuditAdapter;
  enableHeartbeat?: boolean;
  heartbeatIntervalSeconds?: number;
  autoCollectClientInfo?: boolean;
}
