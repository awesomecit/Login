import { doc, setDoc, Firestore } from 'firebase/firestore';
import { AuditAdapter, AuditEvent, SessionInfo } from '../types.ts';

export class FirestoreAuditAdapter implements AuditAdapter {
  public readonly name = 'FirestoreAuditAdapter';
  private db: Firestore;
  private collectionName: string;

  constructor(db: Firestore, collectionName = 'audit_logs') {
    this.db = db;
    this.collectionName = collectionName;
  }

  public async recordEvent(event: AuditEvent): Promise<void> {
    const docRef = doc(this.db, this.collectionName, event.id);
    await setDoc(docRef, {
      userId: event.userId,
      eventType: event.eventType,
      timestamp: event.timestamp,
      email: event.email,
      status: event.status,
      ...(event.userAgent ? { userAgent: event.userAgent } : {}),
      ...(event.metadata ? { metadata: event.metadata } : {}),
    });
  }

  public async recordSession(session: SessionInfo): Promise<void> {
    try {
      const docRef = doc(this.db, 'sessions', session.sessionId);
      await setDoc(docRef, session, { merge: true });
    } catch {
      // Ignorato se non configurata la collezione sessions
    }
  }
}
