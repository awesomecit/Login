import { describe, it, expect } from 'vitest';
import { SessionAuditTracker } from '../packages/clocking-audit/tracker.ts';
import { MemoryAuditAdapter } from '../packages/clocking-audit/adapters/MemoryAdapter.ts';

describe('SessionAuditTracker & Clocking', () => {
  it('records individual audit events with metadata and user agent', async () => {
    const adapter = new MemoryAuditAdapter();
    const tracker = new SessionAuditTracker({
      adapter,
      enableHeartbeat: false,
    });

    const event = await tracker.trackEvent('signin', 'success', { provider: 'google.com' }, 'usr_123', 'test@example.com');

    expect(event.eventType).toBe('signin');
    expect(event.status).toBe('success');
    expect(event.userId).toBe('usr_123');
    expect(event.email).toBe('test@example.com');
    expect(adapter.getEvents()).toHaveLength(1);
    expect(adapter.getEvents()[0]?.metadata?.provider).toBe('google.com');
  });

  it('manages sessions and computes active clocking duration', () => {
    const adapter = new MemoryAuditAdapter();
    const tracker = new SessionAuditTracker({
      adapter,
      enableHeartbeat: false,
    });

    const session = tracker.startSession('usr_456', 'session@example.com');
    expect(session.userId).toBe('usr_456');
    expect(session.sessionId).toBeDefined();

    tracker.beat();
    expect(tracker.getActiveSession()?.durationSeconds).toBeDefined();

    tracker.endSession();
    expect(tracker.getActiveSession()).toBeNull();

    // Checked events recorded (session_start, session_heartbeat, session_end)
    const events = adapter.getEvents();
    const eventTypes = events.map((e) => e.eventType);
    expect(eventTypes).toContain('session_start');
    expect(eventTypes).toContain('session_heartbeat');
    expect(eventTypes).toContain('session_end');
  });
});
