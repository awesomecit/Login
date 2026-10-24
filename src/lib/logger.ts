import { LogLevel, StructuredLog } from './types.ts';

type LogListener = (logs: StructuredLog[]) => void;

class StructuredLogger {
  private logs: StructuredLog[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 300;

  constructor() {
    this.info('Logger', 'Structured Logger initialized', { environment: 'client' });
  }

  private addLog(level: LogLevel, context: string, message: string, metadata?: Record<string, unknown>) {
    const logItem: StructuredLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    };

    this.logs.unshift(logItem);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console output for standard DevTools
    const consolePrefix = `[${logItem.timestamp}] [${level}] [${context}]:`;
    switch (level) {
      case 'DEBUG':
        console.debug(consolePrefix, message, metadata || '');
        break;
      case 'INFO':
        console.info(consolePrefix, message, metadata || '');
        break;
      case 'WARN':
        console.warn(consolePrefix, message, metadata || '');
        break;
      case 'ERROR':
        console.error(consolePrefix, message, metadata || '');
        break;
    }

    this.notify();
  }

  public debug(context: string, message: string, metadata?: Record<string, unknown>) {
    this.addLog('DEBUG', context, message, metadata);
  }

  public info(context: string, message: string, metadata?: Record<string, unknown>) {
    this.addLog('INFO', context, message, metadata);
  }

  public warn(context: string, message: string, metadata?: Record<string, unknown>) {
    this.addLog('WARN', context, message, metadata);
  }

  public error(context: string, message: string, metadata?: Record<string, unknown>) {
    this.addLog('ERROR', context, message, metadata);
  }

  public getLogs(): StructuredLog[] {
    return [...this.logs];
  }

  public clear(): void {
    this.logs = [];
    this.notify();
  }

  public exportJson(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const current = [...this.logs];
    this.listeners.forEach((listener) => {
      try {
        listener(current);
      } catch (err) {
        console.error('Error in log listener:', err);
      }
    });
  }
}

export const logger = new StructuredLogger();
