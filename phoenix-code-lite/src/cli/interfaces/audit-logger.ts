export interface AuditMetrics {
  totalLogs: number;
  errorCount: number;
  lastLogTime: Date;
}

export interface IAuditLogger {
  log(level: 'info' | 'warn' | 'error' | 'debug', message: string, metadata?: any): void;
  flush(): Promise<void>;
  destroy(): Promise<void>;
  getMetrics(): Promise<AuditMetrics>;
} 