/**
 * Session Context Foundation
 * 
 * Minimal session context foundation providing basic session tracking
 * and cross-interface session identification for PCL component integration.
 * 
 * Performance Target: <10ms session context lookup (Phase 2 baseline)
 * Purpose: Enables all subsequent components to access session state without circular dependencies
 * 
 * Generated: 2025-08-21
 */

import {
  EventUtils,
  ScopedEventBus,
  SubscriptionOptions,
  TypedEventMap,
  UnsubscribeFn
} from '../utils/event-utils';
import { createInterval } from '../utils/async-utils';
import { createLogger } from '../utils/logger';

export interface SessionContext {
  sessionId: string;
  activeInterface: string;
  createdAt: Date;
  lastAccessedAt: Date;
  state: Record<string, any>;
  metadata: SessionMetadata;
}

export interface SessionMetadata {
  userId?: string;
  clientInfo?: string;
  preferences?: Record<string, any>;
  capabilities?: string[];
  temporary?: boolean;
}

export interface SessionLookupOptions {
  includeInactive?: boolean;
  includeMetadata?: boolean;
  timeout?: number;
}

/**
 * Foundation component for cross-interface session management
 * Provides minimal session tracking required by all dependent components
 */
interface SessionContextFoundationEvents extends TypedEventMap {
  initialized: () => void;
  sessionCreated: (context: SessionContext) => void;
  activeSessionChanged: (sessionId: string) => void;
  sessionStateUpdated: (sessionId: string, updates: Partial<Record<string, any>>) => void;
  sessionClosed: (sessionId: string) => void;
  interfaceSwitched: (sessionId: string, oldInterface: string, newInterface: string) => void;
  sessionExpired: (sessionId: string) => void;
  cleanup: () => void;
}

type SessionEventKey = Extract<keyof SessionContextFoundationEvents, string>;
type SessionListener = (...args: any[]) => unknown;

export class SessionContextFoundation {
  private static instanceCounter = 0;

  private readonly eventScope: string;
  private readonly events: ScopedEventBus<SessionContextFoundationEvents>;
  private readonly listenerRegistry = new Map<SessionEventKey, Map<SessionListener, UnsubscribeFn>>();
  private sessions: Map<string, SessionContext> = new Map();
  private activeSession: string | null = null;
  private initialized = false;
  private cleanupInterval: ReturnType<typeof createInterval> | null = null;
  private readonly logger = createLogger('session-context-foundation');

  constructor() {
    this.eventScope = `session-context-foundation:${SessionContextFoundation.instanceCounter++}`;
    this.events = EventUtils.createScopedBus<SessionContextFoundationEvents>(this.eventScope, 40);
  }

  emit<K extends SessionEventKey>(
    event: K,
    ...args: Parameters<SessionContextFoundationEvents[K]>
  ): boolean {
    return this.events.emit(event, ...args);
  }

  on<K extends SessionEventKey>(
    event: K,
    listener: SessionContextFoundationEvents[K]
  ): this {
    this.registerListener(event, listener);
    return this;
  }

  addListener<K extends SessionEventKey>(
    event: K,
    listener: SessionContextFoundationEvents[K]
  ): this {
    return this.on(event, listener);
  }

  once<K extends SessionEventKey>(
    event: K,
    listener: SessionContextFoundationEvents[K]
  ): this {
    this.registerListener(event, listener, { once: true });
    return this;
  }

  off<K extends SessionEventKey>(
    event: K,
    listener: SessionContextFoundationEvents[K]
  ): this {
    this.unregisterListener(event, listener);
    return this;
  }

  removeListener<K extends SessionEventKey>(
    event: K,
    listener: SessionContextFoundationEvents[K]
  ): this {
    return this.off(event, listener);
  }

  removeAllListeners(event?: SessionEventKey): this {
    if (event) {
      this.flushListeners(event);
    } else {
      for (const eventName of Array.from(this.listenerRegistry.keys())) {
        this.flushListeners(eventName);
      }
      this.events.cleanup();
    }
    return this;
  }

  listenerCount(event: SessionEventKey): number {
    return this.events.getListenerCount(event);
  }

  eventNames(): SessionEventKey[] {
    return this.events.getEventNames();
  }

  getEventEmitter(): typeof this.events.emitter {
    return this.events.emitter;
  }

  private registerListener<K extends SessionEventKey>(
    event: K,
    listener: SessionContextFoundationEvents[K],
    options?: SubscriptionOptions
  ): void {
    const unsubscribe = EventUtils.subscribe(this.events.emitter, event, listener, {
      context: this.eventScope,
      ...options
    });

    if (!this.listenerRegistry.has(event)) {
      this.listenerRegistry.set(event, new Map());
    }

    this.listenerRegistry.get(event)!.set(listener as SessionListener, unsubscribe);
  }

  private unregisterListener<K extends SessionEventKey>(
    event: K,
    listener: SessionContextFoundationEvents[K]
  ): void {
    const registry = this.listenerRegistry.get(event);
    const unsubscribe = registry?.get(listener as SessionListener);

    if (unsubscribe) {
      unsubscribe();
      registry!.delete(listener as SessionListener);
      if (registry!.size === 0) {
        this.listenerRegistry.delete(event);
      }
    } else {
      this.events.emitter.off(event, listener);
    }
  }

  private flushListeners(event: SessionEventKey): void {
    const registry = this.listenerRegistry.get(event);
    if (registry) {
      for (const unsubscribe of registry.values()) {
        unsubscribe();
      }
      registry.clear();
      this.listenerRegistry.delete(event);
    }
    this.events.emitter.removeAllListeners(event);
  }

  /**
   * Initialize the session context foundation
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.setupCleanupInterval();
    this.initialized = true;
    this.emit('initialized');
  }

  /**
   * Create a new session context
   */
  async createSession(
    sessionId?: string,
    interfaceType: string = 'cli',
    metadata?: SessionMetadata
  ): Promise<SessionContext> {
    const id = sessionId || this.generateSessionId();
    const now = new Date();

    const context: SessionContext = {
      sessionId: id,
      activeInterface: interfaceType,
      createdAt: now,
      lastAccessedAt: now,
      state: {},
      metadata: metadata || {}
    };

    this.sessions.set(id, context);
    this.emit('sessionCreated', context);

    return context;
  }

  /**
   * Set the currently active session
   * Performance requirement: <10ms lookup time
   */
  setActiveSession(sessionId: string): boolean {
    const startTime = Date.now();
    
    let session = this.sessions.get(sessionId);
    if (!session) {
      // Auto-create session if it doesn't exist for seamless backend integration
      const now = new Date();
      session = {
        sessionId,
        activeInterface: 'cli', // Default interface
        createdAt: now,
        lastAccessedAt: now,
        state: {},
        metadata: {}
      };
      this.sessions.set(sessionId, session);
      this.emit('sessionCreated', session);
    }

    this.activeSession = sessionId;
    session.lastAccessedAt = new Date();
    
    const lookupTime = Date.now() - startTime;
    if (lookupTime > 10) {
      this.logger.warn('Session lookup exceeded baseline', {
        sessionId,
        lookupTimeMs: lookupTime,
        baselineMs: 10
      });
    }

    this.emit('activeSessionChanged', sessionId);
    return true;
  }

  /**
   * Get the currently active session context
   */
  getActiveSession(): SessionContext | null {
    if (!this.activeSession) return null;
    return this.sessions.get(this.activeSession) || null;
  }

  /**
   * Get session by ID with performance monitoring
   */
  getSession(sessionId: string, options: SessionLookupOptions = {}): SessionContext | null {
    const startTime = Date.now();
    
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    // Update last accessed time unless it's an inactive lookup
    if (!options.includeInactive) {
      session.lastAccessedAt = new Date();
    }

    const lookupTime = Date.now() - startTime;
    if (lookupTime > (options.timeout || 10)) {
      this.logger.warn('Session lookup exceeded timeout', {
        sessionId,
        lookupTimeMs: lookupTime,
        timeoutMs: options.timeout || 10
      });
    }

    // Return minimal context unless metadata is requested
    if (!options.includeMetadata) {
      return {
        ...session,
        metadata: {}
      };
    }

    return session;
  }

  /**
   * Update session state for cross-interface coordination
   */
  updateSessionState(sessionId: string, updates: Partial<Record<string, any>>): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.state = { ...session.state, ...updates };
    session.lastAccessedAt = new Date();

    this.emit('sessionStateUpdated', sessionId, updates);
    return true;
  }

  closeSession(sessionId: string): boolean {
    if (!this.sessions.has(sessionId)) {
      return false;
    }

    this.sessions.delete(sessionId);
    if (this.activeSession === sessionId) {
      this.activeSession = null;
    }

    this.emit('sessionClosed', sessionId);
    return true;
  }

  /**
   * Switch active interface for session
   */
  switchInterface(sessionId: string, newInterface: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const oldInterface = session.activeInterface;
    session.activeInterface = newInterface;
    session.lastAccessedAt = new Date();

    this.emit('interfaceSwitched', sessionId, oldInterface, newInterface);
    return true;
  }

  /**
   * Get all sessions (for debugging and monitoring)
   */
  getAllSessions(activeOnly = false): SessionContext[] {
    const sessions = Array.from(this.sessions.values());
    
    if (activeOnly) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      return sessions.filter(session => session.lastAccessedAt > fiveMinutesAgo);
    }

    return sessions;
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(maxAgeMinutes = 30): number {
    const expiryTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
    let cleanedCount = 0;

    for (const [sessionId, session] of Array.from(this.sessions.entries())) {
      if (session.lastAccessedAt < expiryTime) {
        this.sessions.delete(sessionId);
        cleanedCount++;
        this.emit('sessionExpired', sessionId);
      }
    }

    return cleanedCount;
  }

  /**
   * Check if the foundation is properly initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get current session count for monitoring
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.cleanupInterval) {
      this.cleanupInterval.stop();
      this.cleanupInterval = null;
    }

    this.sessions.clear();
    this.activeSession = null;
    this.initialized = false;
    this.removeAllListeners();

    this.emit('cleanup');
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Setup automatic cleanup of expired sessions
   */
  private setupCleanupInterval(): void {
    // Clean up expired sessions every 5 minutes
    this.cleanupInterval = createInterval(() => {
      const cleaned = this.cleanupExpiredSessions();
      if (cleaned > 0) {
        this.logger.debug('Cleaned up expired sessions', { cleaned });
      }
    }, 5 * 60 * 1000, { unref: true });
  }
}
