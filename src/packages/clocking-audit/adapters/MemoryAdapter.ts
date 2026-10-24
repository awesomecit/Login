import { AuditAdapter, AuditEvent, SessionInfo } from '../types.ts';

export class MemoryAuditAdapter implements AuditAdapter {
  public readonly name = 'MemoryAdapter';
  private events: AuditEvent[] = [];
  private sessions: SessionInfo[] = [];
  private maxItems = 500;

  public async recordEvent(event: AuditEvent): Promise<void> {
    this.events.unshift(event);
    if (this.events.length > this.maxItems) {
      this.events = this.events.slice(0, this.maxItems);
    }
  }

  public async recordSession(session: SessionInfo): Promise<void> {
    const idx = this.sessions.findIndex((s) => s.sessionId === session.sessionId);
    if (idx >= 0) {
      this.sessions[idx] = session;
    } else {
      this.sessions.unshift(session);
    }
  }

  public getEvents(): AuditEvent[] {
    return [...this.events];
  }

  public getSessions(): SessionInfo[] {
    return [...this.sessions];
  }

  public clear(): void {
    this.events = [];
    this.sessions = [];
  }

  public exportJson(): string {
    return JSON.stringify({ events: this.events, sessions: this.sessions }, null, 2);
  }
}
