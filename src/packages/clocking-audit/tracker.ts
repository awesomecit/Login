import {
  AuditAdapter,
  AuditEvent,
  AuditEventType,
  AuditStatus,
  AuditTrackerOptions,
  SessionInfo,
} from './types.ts';

export class SessionAuditTracker {
  private adapter: AuditAdapter;
  private currentSession: SessionInfo | null = null;
  private heartbeatTimer: any = null;
  private options: AuditTrackerOptions;

  constructor(options: AuditTrackerOptions) {
    this.options = options;
    this.adapter = options.adapter;
  }

  public setAdapter(adapter: AuditAdapter): void {
    this.adapter = adapter;
  }

  public async trackEvent(
    eventType: AuditEventType,
    status: AuditStatus = 'success',
    metadata?: Record<string, unknown>,
    userId?: string,
    email?: string
  ): Promise<AuditEvent> {
    const activeUid = userId || this.currentSession?.userId || 'anonymous';
    const activeEmail = email || this.currentSession?.email || 'unauthenticated';

    const event: AuditEvent = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: activeUid,
      email: activeEmail,
      eventType,
      timestamp: new Date().toISOString(),
      status,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 300) : undefined,
      metadata,
    };

    try {
      await this.adapter.recordEvent(event);
    } catch (err) {
      console.warn(`[AuditTracker] Failed to record event via ${this.adapter.name}:`, err);
    }

    return event;
  }

  public startSession(userId: string, email: string): SessionInfo {
    this.endSession(); // Close previous if open

    const now = new Date().toISOString();
    const session: SessionInfo = {
      sessionId: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId,
      email,
      startedAt: now,
      lastActiveAt: now,
    };

    this.currentSession = session;
    this.trackEvent('session_start', 'success', { sessionId: session.sessionId }, userId, email);

    if (this.options.enableHeartbeat) {
      const intervalSec = this.options.heartbeatIntervalSeconds || 60;
      this.heartbeatTimer = setInterval(() => {
        this.beat();
      }, intervalSec * 1000);
    }

    return session;
  }

  public beat(): void {
    if (!this.currentSession) return;
    this.currentSession.lastActiveAt = new Date().toISOString();
    const startMs = new Date(this.currentSession.startedAt).getTime();
    const nowMs = Date.now();
    this.currentSession.durationSeconds = Math.round((nowMs - startMs) / 1000);

    this.trackEvent(
      'session_heartbeat',
      'success',
      {
        sessionId: this.currentSession.sessionId,
        durationSeconds: this.currentSession.durationSeconds,
      },
      this.currentSession.userId,
      this.currentSession.email
    );

    if (this.adapter.recordSession) {
      this.adapter.recordSession(this.currentSession);
    }
  }

  public endSession(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    if (this.currentSession) {
      this.currentSession.endedAt = new Date().toISOString();
      const startMs = new Date(this.currentSession.startedAt).getTime();
      const endMs = new Date(this.currentSession.endedAt).getTime();
      this.currentSession.durationSeconds = Math.round((endMs - startMs) / 1000);

      this.trackEvent(
        'session_end',
        'success',
        {
          sessionId: this.currentSession.sessionId,
          totalDurationSeconds: this.currentSession.durationSeconds,
        },
        this.currentSession.userId,
        this.currentSession.email
      );

      if (this.adapter.recordSession) {
        this.adapter.recordSession(this.currentSession);
      }

      this.currentSession = null;
    }
  }

  public getActiveSession(): SessionInfo | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }
}
