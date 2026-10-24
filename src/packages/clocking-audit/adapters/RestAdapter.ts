import { AuditAdapter, AuditEvent, SessionInfo } from '../types.ts';

export interface RestAuditAdapterConfig {
  endpointUrl: string;
  getAuthToken?: () => string | Promise<string | null> | null;
  customHeaders?: Record<string, string>;
  timeoutMs?: number;
}

export class RestAuditAdapter implements AuditAdapter {
  public readonly name = 'RestAuditAdapter';
  private config: RestAuditAdapterConfig;

  constructor(config: RestAuditAdapterConfig) {
    this.config = config;
  }

  public async recordEvent(event: AuditEvent): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Client-Timestamp': new Date().toISOString(),
      ...(this.config.customHeaders || {}),
    };

    if (this.config.getAuthToken) {
      const token = await this.config.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs || 8000);

    try {
      const res = await fetch(this.config.endpointUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(event),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Audit REST endpoint responded with status ${res.status}`);
      }
    } finally {
      clearTimeout(timer);
    }
  }

  public async recordSession(session: SessionInfo): Promise<void> {
    const sessionUrl = `${this.config.endpointUrl}/sessions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.config.customHeaders || {}),
    };

    if (this.config.getAuthToken) {
      const token = await this.config.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    try {
      await fetch(sessionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(session),
      });
    } catch {
      // Ignorato se endpoint secondario non disponibile
    }
  }
}
