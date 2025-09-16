import { EventEmitter } from 'events';
import { createLogger, Logger } from './logger';
import { handleAsync } from './error-handler';
import { withTimeout, retry as asyncRetry, TIMEOUTS } from './async-utils';

type ProtocolType = 'ipc' | 'http' | 'https' | 'websocket' | 'custom';

type ProtocolStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
export interface ProtocolMessage<TPayload = unknown> {
  type: string;
  payload: TPayload;
  correlationId?: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

export interface ProtocolMessageValidationIssue {
  type: 'missing-field' | 'invalid-type' | 'security' | 'size' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  suggestion?: string;
}

export interface ProtocolMessageValidationResult {
  isValid: boolean;
  confidence: number; // 0-1
  issues: ProtocolMessageValidationIssue[];
}

export interface ProtocolConfig {
  type: ProtocolType;
  id?: string;
  connection: {
    host?: string;
    port?: number;
    path?: string;
    secure?: boolean;
    maxConnections?: number;
  };
  timeoutMs?: number;
  retries?: number;
  autoReconnect?: boolean;
  idleTimeoutMs?: number;
  validator?: ProtocolMessageValidator;
  allowedMessageTypes?: string[];
  metadata?: Record<string, unknown>;
}

export interface ProtocolState {
  id: string;
  type: ProtocolType;
  status: ProtocolStatus;
  connectedAt?: number;
  lastMessageAt?: number;
  lastErrorAt?: number;
  reconnectAttempts: number;
  configuration: ProtocolConfig;
}

export interface ProtocolMetrics {
  sent: number;
  received: number;
  successful: number;
  failed: number;
  reconnects: number;
  disconnects: number;
  averageLatencyMs: number;
  maxLatencyMs: number;
  lastLatencyMs: number;
  uptimeMs: number;
}

export interface ProtocolConfidence {
  score: number; // 0-1
  classification: 'excellent' | 'good' | 'fair' | 'poor';
  factors: {
    successRate: number;
    latency: number;
    stability: number;
    availability: number;
  };
  recommendations: string[];
}

export interface ProtocolDiagnostics {
  state: ProtocolState;
  metrics: ProtocolMetrics;
  confidence: ProtocolConfidence;
  activeConnections: number;
  queueDepth: number;
}

export interface ProtocolTransport<TMessage = ProtocolMessage> {
  id: string;
  type: ProtocolType;
  send(message: TMessage): Promise<void>;
  close(code?: number, reason?: string): Promise<void>;
  isConnected(): boolean;
  on?(event: 'message' | 'error' | 'close', listener: (...args: any[]) => void): void;
  off?(event: 'message' | 'error' | 'close', listener: (...args: any[]) => void): void;
}

export interface ProtocolAdapter {
  type: ProtocolType | 'custom';
  name: string;
  connect(config: ProtocolConfig): Promise<ProtocolTransport>;
}

export type ProtocolMessageValidator = (
  message: ProtocolMessage,
  config: ProtocolConfig
) => ProtocolMessageValidationResult;

interface PendingMessage {
  message: ProtocolMessage;
  resolve: () => void;
  reject: (error: unknown) => void;
  attempts: number;
  createdAt: number;
}

const DEFAULT_VALIDATOR: ProtocolMessageValidator = (message, config) => {
  const issues: ProtocolMessageValidationIssue[] = [];
  let confidence = 1;

  if (!message) {
    issues.push({
      type: 'missing-field',
      severity: 'critical',
      message: 'Message payload is missing'
    });
    return { isValid: false, confidence: 0, issues };
  }

  if (typeof message.type !== 'string' || message.type.trim().length === 0) {
    issues.push({
      type: 'missing-field',
      severity: 'high',
      message: 'Message type must be a non-empty string',
      suggestion: 'Provide semantic message type identifiers'
    });
    confidence *= 0.2;
  }

  if (config.allowedMessageTypes && !config.allowedMessageTypes.includes(message.type)) {
    issues.push({
      type: 'security',
      severity: 'critical',
      message: `Message type "${message.type}" is not allowed`,
      suggestion: 'Register message types explicitly before sending'
    });
    confidence *= 0.1;
  }

  if (message.payload === undefined) {
    issues.push({
      type: 'missing-field',
      severity: 'medium',
      message: 'Message payload should not be undefined'
    });
    confidence *= 0.8;
  }

  if (typeof message.payload === 'string' && message.payload.length > 32768) {
    issues.push({
      type: 'size',
      severity: 'medium',
      message: 'Payload exceeds recommended size of 32KB',
      suggestion: 'Consider streaming large payloads or chunking content'
    });
    confidence *= 0.7;
  }

  return {
    isValid: issues.length === 0,
    confidence,
    issues
  };
};

const DEFAULT_CONFIG: Pick<ProtocolConfig, 'timeoutMs' | 'retries' | 'autoReconnect' | 'idleTimeoutMs'> = {
  timeoutMs: TIMEOUTS.NORMAL,
  retries: 3,
  autoReconnect: true,
  idleTimeoutMs: 60_000
};

const createId = (prefix: string): string => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export class ProtocolSession extends EventEmitter {
  readonly id: string;
  readonly type: ProtocolType;

  private readonly logger: Logger;
  private readonly config: ProtocolConfig;
  private readonly adapter: ProtocolAdapter;
  private transport: ProtocolTransport;
  private status: ProtocolStatus = 'connecting';
  private readonly metrics: ProtocolMetrics = {
    sent: 0,
    received: 0,
    successful: 0,
    failed: 0,
    reconnects: 0,
    disconnects: 0,
    averageLatencyMs: 0,
    maxLatencyMs: 0,
    lastLatencyMs: 0,
    uptimeMs: 0
  };
  private readonly state: ProtocolState;
  private readonly pendingQueue: PendingMessage[] = [];
  private idleTimer?: NodeJS.Timeout;
  private isShuttingDown = false;
  private readonly validator: ProtocolMessageValidator;

  constructor(adapter: ProtocolAdapter, transport: ProtocolTransport, config: ProtocolConfig, logger: Logger) {
    super();
    this.id = config.id ?? transport.id ?? createId(`protocol-${config.type}`);
    this.type = config.type;
    this.adapter = adapter;
    this.transport = transport;
    this.logger = logger.child({ context: `protocol:${this.type}`, connectionId: this.id });
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      connection: {
        maxConnections: 5,
        ...config.connection
      }
    };
    this.validator = config.validator ?? DEFAULT_VALIDATOR;
    this.state = {
      id: this.id,
      type: this.type,
      status: 'connecting',
      reconnectAttempts: 0,
      configuration: this.config
    };
    this.attachTransport(transport);
    this.setStatus('connected');
  }

  getStatus(): ProtocolStatus {
    return this.status;
  }

  getState(): ProtocolState {
    return { ...this.state };
  }

  getMetrics(): ProtocolMetrics {
    return { ...this.metrics };
  }

  async send<T>(message: ProtocolMessage<T>): Promise<void> {
    if (this.isShuttingDown) {
      throw new Error('Protocol session is shutting down');
    }

    const validation = this.validator(message, this.config);
    if (!validation.isValid) {
      const error = new Error(`Invalid protocol message: ${validation.issues.map(issue => issue.message).join('; ')}`);
      this.metrics.failed += 1;
      this.state.lastErrorAt = Date.now();
      this.emit('validationFailed', { message, validation });
      throw error;
    }

    const sendStart = Date.now();
    const timeoutMs = this.config.timeoutMs ?? TIMEOUTS.NORMAL;
    const operation = async () => {
      await withTimeout(this.transport.send({
        ...message,
        timestamp: message.timestamp ?? Date.now()
      }), timeoutMs);
    };

    try {
      await asyncRetry(operation, {
        maxAttempts: this.config.retries ?? DEFAULT_CONFIG.retries,
        onRetry: (error, attempt) => {
          this.logger.warn('Retrying protocol message send', {
            attempt,
            messageType: message.type,
            reason: error instanceof Error ? error.message : String(error)
          });
        }
      });
      this.metrics.sent += 1;
      this.metrics.successful += 1;
      this.metrics.lastLatencyMs = Date.now() - sendStart;
      this.metrics.maxLatencyMs = Math.max(this.metrics.maxLatencyMs, this.metrics.lastLatencyMs);
      this.metrics.averageLatencyMs = this.metrics.averageLatencyMs === 0
        ? this.metrics.lastLatencyMs
        : ((this.metrics.averageLatencyMs * (this.metrics.successful - 1)) + this.metrics.lastLatencyMs) / this.metrics.successful;
      this.state.lastMessageAt = Date.now();
      this.emit('messageSent', { message, latencyMs: this.metrics.lastLatencyMs });
      this.resetIdleTimer();
    } catch (error) {
      this.metrics.sent += 1;
      this.metrics.failed += 1;
      this.state.lastErrorAt = Date.now();
      this.logger.error('Failed to send protocol message', {
        error: error instanceof Error ? error.message : String(error),
        messageType: message.type
      });
      this.emit('sendFailed', { message, error });

      if (this.config.autoReconnect) {
        await this.reconnect('send-failure');
      }

      throw error;
    }
  }

  async broadcast<T>(messages: ProtocolMessage<T>[]): Promise<void> {
    for (const message of messages) {
      await this.send(message);
    }
  }

  queue<T>(message: ProtocolMessage<T>): Promise<void> {
    return new Promise((resolve, reject) => {
      this.pendingQueue.push({
        message,
        resolve,
        reject,
        attempts: 0,
        createdAt: Date.now()
      });
      if (this.pendingQueue.length === 1) {
        void this.flushQueue();
      }
    });
  }

  async close(code?: number, reason?: string): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }
    this.isShuttingDown = true;

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = undefined;
    }

    try {
      await this.transport.close(code, reason);
    } finally {
      this.setStatus('disconnected');
      this.removeTransportListeners();
      this.emit('closed', { code, reason });
    }
  }

  getDiagnostics(): ProtocolDiagnostics {
    const confidence = this.calculateConfidence();
    return {
      state: this.getState(),
      metrics: this.getMetrics(),
      confidence,
      activeConnections: 1,
      queueDepth: this.pendingQueue.length
    };
  }

  private async flushQueue(): Promise<void> {
    if (this.pendingQueue.length === 0) {
      return;
    }

    const next = this.pendingQueue[0];
    try {
      await this.send(next.message);
      next.resolve();
    } catch (error) {
      next.attempts += 1;
      if (next.attempts >= (this.config.retries ?? DEFAULT_CONFIG.retries)) {
        next.reject(error);
      } else {
        this.logger.warn('Retrying queued protocol message', {
          attempt: next.attempts,
          messageType: next.message.type
        });
      }
    } finally {
      this.pendingQueue.shift();
      if (this.pendingQueue.length > 0) {
        void this.flushQueue();
      }
    }
  }

  private attachTransport(transport: ProtocolTransport): void {
    this.transport = transport;
    this.metrics.uptimeMs = 0;
    const connectedAt = Date.now();
    this.state.connectedAt = connectedAt;
    this.state.lastMessageAt = undefined;

    if (transport.on) {
      transport.on('message', payload => {
        this.metrics.received += 1;
        this.state.lastMessageAt = Date.now();
        this.emit('messageReceived', payload);
        this.resetIdleTimer();
      });
      transport.on('error', error => {
        this.state.lastErrorAt = Date.now();
        this.metrics.failed += 1;
        this.emit('error', error);
        this.logger.error('Protocol transport error', {
          error: error instanceof Error ? error.message : String(error)
        });
      });
      transport.on('close', () => {
        this.metrics.disconnects += 1;
        this.setStatus('disconnected');
        this.emit('disconnected');
      });
    }

    this.resetIdleTimer();

    const uptimeInterval = setInterval(() => {
      if (this.status === 'disconnected' || this.isShuttingDown) {
        clearInterval(uptimeInterval);
        return;
      }
      this.metrics.uptimeMs = Date.now() - connectedAt;
    }, 1000).unref?.();
  }

  private removeTransportListeners(): void {
    if (!this.transport || !this.transport.off) {
      return;
    }
    this.transport.off('message', () => undefined);
    this.transport.off('error', () => undefined);
    this.transport.off('close', () => undefined);
  }

  private setStatus(status: ProtocolStatus): void {
    if (this.status === status) {
      return;
    }
    this.status = status;
    this.state.status = status;
    this.emit('statusChanged', status);
  }

  private async reconnect(reason: string): Promise<void> {
    if (!this.config.autoReconnect || this.status === 'disconnected') {
      return;
    }

    this.metrics.reconnects += 1;
    this.state.reconnectAttempts += 1;
    this.setStatus('reconnecting');
    this.logger.warn('Reconnecting protocol transport', { reason });

    try {
      const newTransport = await handleAsync(
        this.adapter.connect(this.config),
        'protocol-utils.reconnect'
      );
      this.attachTransport(newTransport);
      this.setStatus('connected');
      this.emit('reconnected');
    } catch (error) {
      this.logger.error('Failed to reconnect protocol transport', {
        error: error instanceof Error ? error.message : String(error)
      });
      this.emit('reconnectFailed', error);
      this.setStatus('disconnected');
    }
  }

  private resetIdleTimer(): void {
    if (!this.config.idleTimeoutMs || this.config.idleTimeoutMs <= 0) {
      return;
    }

    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }

    this.idleTimer = setTimeout(() => {
      this.emit('idle', { idleTimeoutMs: this.config.idleTimeoutMs });
      if (this.config.autoReconnect) {
        void this.reconnect('idle-timeout');
      }
    }, this.config.idleTimeoutMs);
  }

  private calculateConfidence(): ProtocolConfidence {
    const successRate = this.metrics.sent === 0
      ? 1
      : this.metrics.successful / Math.max(1, this.metrics.sent);
    const latencyBudget = this.config.timeoutMs ?? TIMEOUTS.NORMAL;
    const latencyScore = this.metrics.averageLatencyMs === 0
      ? 1
      : Math.max(0, 1 - (this.metrics.averageLatencyMs - latencyBudget) / latencyBudget);
    const stability = Math.max(0, 1 - (this.metrics.reconnects + this.metrics.disconnects) / Math.max(1, this.metrics.sent));
    const availability = this.metrics.uptimeMs === 0
      ? 1
      : Math.min(1, this.metrics.uptimeMs / (60 * 1000));

    let score = (successRate * 0.55) + (latencyScore * 0.2) + (stability * 0.15) + (availability * 0.1);
    score = Math.max(0, Math.min(1, score));

    let classification: ProtocolConfidence['classification'] = 'excellent';
    if (score < 0.85) {
      classification = score >= 0.7 ? 'good' : score >= 0.5 ? 'fair' : 'poor';
    }

    const recommendations: string[] = [];
    if (successRate < 0.9) {
      recommendations.push('Review message validation and retry configuration');
    }
    if (latencyScore < 0.8) {
      recommendations.push('Investigate network latency or adjust timeout configuration');
    }
    if (stability < 0.85) {
      recommendations.push('Check connection stability and auto-reconnect thresholds');
    }
    if (availability < 0.9) {
      recommendations.push('Increase connection uptime or review idle timeout policy');
    }

    return {
      score,
      classification,
      factors: {
        successRate,
        latency: latencyScore,
        stability,
        availability
      },
      recommendations
    };
  }
}

export interface ProtocolUtilsOptions {
  logger?: Logger;
  adapters?: ProtocolAdapter[];
}

export class ProtocolUtils extends EventEmitter {
  private static globalInstance: ProtocolUtils | null = null;

  private readonly logger: Logger;
  private readonly adapters = new Map<ProtocolType, ProtocolAdapter>();
  private readonly sessions = new Map<string, ProtocolSession>();

  constructor(options: ProtocolUtilsOptions = {}) {
    super();
    this.logger = options.logger ?? createLogger('protocol-utils');
    if (options.adapters) {
      for (const adapter of options.adapters) {
        this.registerAdapter(adapter);
      }
    }
  }

  static shared(options: ProtocolUtilsOptions = {}): ProtocolUtils {
    if (!this.globalInstance) {
      this.globalInstance = new ProtocolUtils(options);
    }
    return this.globalInstance;
  }

  registerAdapter(adapter: ProtocolAdapter): void {
    this.adapters.set(adapter.type === 'custom' ? 'custom' : adapter.type, adapter);
    this.logger.debug('Registered protocol adapter', {
      adapter: adapter.name,
      type: adapter.type
    });
  }

  unregisterAdapter(type: ProtocolType): void {
    this.adapters.delete(type);
  }

  async connect(config: ProtocolConfig): Promise<ProtocolSession> {
    const adapter = this.resolveAdapter(config.type);
    if (!adapter) {
      throw new Error(`No protocol adapter registered for type ${config.type}`);
    }

    this.logger.info('Establishing protocol connection', {
      connectionId: config.id,
      type: config.type,
      host: config.connection.host,
      port: config.connection.port
    });

    const transport = await handleAsync(adapter.connect(config), 'protocol-utils.connect');
    const session = new ProtocolSession(adapter, transport, config, this.logger);

    this.sessions.set(session.id, session);
    this.registerSessionEvents(session);

    this.emit('sessionCreated', session);
    return session;
  }

  getSession(id: string): ProtocolSession | undefined {
    return this.sessions.get(id);
  }

  getSessions(): ProtocolSession[] {
    return [...this.sessions.values()];
  }

  async closeSession(id: string, code?: number, reason?: string): Promise<void> {
    const session = this.sessions.get(id);
    if (!session) {
      return;
    }

    await session.close(code, reason);
    this.sessions.delete(id);
    this.emit('sessionClosed', { id, code, reason });
  }

  async broadcast<T>(message: ProtocolMessage<T>): Promise<void> {
    for (const session of this.sessions.values()) {
      if (session.getStatus() === 'connected') {
        await session.send(message);
      }
    }
  }

  getDiagnostics(): ProtocolDiagnostics[] {
    return [...this.sessions.values()].map(session => session.getDiagnostics());
  }

  cleanup(): void {
    for (const session of this.sessions.values()) {
      void session.close();
    }
    this.sessions.clear();
  }

  private resolveAdapter(type: ProtocolType): ProtocolAdapter | undefined {
    const adapter = this.adapters.get(type) ?? this.adapters.get('custom' as ProtocolType);
    if (!adapter) {
      this.logger.error('No protocol adapter registered', { type });
    }
    return adapter;
  }

  private registerSessionEvents(session: ProtocolSession): void {
    const cleanup = () => {
      this.sessions.delete(session.id);
      this.emit('sessionDisposed', session.id);
    };
    session.once('closed', cleanup);
    session.once('disconnected', cleanup);
  }
}

export const protocolUtils = ProtocolUtils.shared();
export const registerProtocolAdapter = (adapter: ProtocolAdapter): void => {
  protocolUtils.registerAdapter(adapter);
};

export const connectProtocol = (config: ProtocolConfig): Promise<ProtocolSession> => {
  return protocolUtils.connect(config);
};

export const getProtocolDiagnostics = (): ProtocolDiagnostics[] => {
  return protocolUtils.getDiagnostics();
};

