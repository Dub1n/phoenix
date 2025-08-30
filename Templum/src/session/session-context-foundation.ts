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

import { EventEmitter } from 'events';

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
export class SessionContextFoundation extends EventEmitter {
  private sessions: Map<string, SessionContext> = new Map();
  private activeSession: string | null = null;
  private initialized = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

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
      console.warn(`Session lookup exceeded 10ms baseline: ${lookupTime}ms`);
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
      console.warn(`Session lookup exceeded timeout: ${lookupTime}ms`);
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
      clearInterval(this.cleanupInterval);
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
    this.cleanupInterval = setInterval(() => {
      const cleaned = this.cleanupExpiredSessions();
      if (cleaned > 0) {
        console.debug(`Cleaned up ${cleaned} expired sessions`);
      }
    }, 5 * 60 * 1000);
  }
}