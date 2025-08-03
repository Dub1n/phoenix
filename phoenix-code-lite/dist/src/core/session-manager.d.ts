import { EventEmitter } from 'events';
import { SessionState } from '../types/workflow';
export interface SessionManagerConfig {
    maxConcurrentSessions: number;
    sessionTimeoutMs: number;
    persistentStorage: boolean;
    auditLogging: boolean;
}
export declare class SessionManager extends EventEmitter {
    private sessions;
    private config;
    private auditLogger?;
    private cleanupInterval?;
    constructor(config?: Partial<SessionManagerConfig>);
    /**
     * Create a new session with comprehensive state tracking
     */
    createSession(mode: 'standalone' | 'integrated', initialContext?: Record<string, any>): Promise<string>;
    /**
     * Get session state with validation
     */
    getSession(sessionId: string): SessionState | null;
    /**
     * Update session state with validation
     */
    updateSession(sessionId: string, updates: Partial<SessionState>): Promise<boolean>;
    /**
     * Update session metrics
     */
    updateSessionMetrics(sessionId: string, metricsUpdate: Partial<SessionState['metrics']>): Promise<boolean>;
    /**
     * Set current phase for session
     */
    setSessionPhase(sessionId: string, phase: string): Promise<boolean>;
    /**
     * Complete session
     */
    completeSession(sessionId: string, success?: boolean): Promise<boolean>;
    /**
     * Remove session
     */
    removeSession(sessionId: string): boolean;
    /**
     * Get all active sessions
     */
    getActiveSessions(): SessionState[];
    /**
     * Get sessions by mode
     */
    getSessionsByMode(mode: 'standalone' | 'integrated'): SessionState[];
    /**
     * Get session statistics
     */
    getSessionStats(): {
        totalSessions: number;
        activeSessions: number;
        completedSessions: number;
        failedSessions: number;
        averageDuration: number;
        totalTokensUsed: number;
    };
    /**
     * Check if session is expired
     */
    private isSessionExpired;
    /**
     * Clean up expired sessions
     */
    private cleanupExpiredSessions;
    /**
     * Start cleanup process
     */
    private startCleanupProcess;
    /**
     * Setup event listeners for monitoring
     */
    private setupEventListeners;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=session-manager.d.ts.map