"use strict";
/**---
 * title: [Session Manager - Core Service Module]
 * tags: [Core, Service, Session-Management, Audit]
 * provides: [SessionManager Class, Session Lifecycle, State Validation, Metrics, Cleanup]
 * requires: [Zod, UUID, EventEmitter, AuditLogger, Workflow Types]
 * description: [Manages interactive and command sessions with lifecycle control, schema validation, auditing, automatic cleanup, and metrics tracking.]
 * ---*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const uuid_1 = require("uuid");
const events_1 = require("events");
const workflow_1 = require("../types/workflow");
const audit_logger_1 = require("../utils/audit-logger");
class SessionManager extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.sessions = new Map();
        this.config = {
            maxConcurrentSessions: 3,
            sessionTimeoutMs: 3600000, // 1 hour
            persistentStorage: false,
            auditLogging: true,
            ...config
        };
        if (this.config.auditLogging) {
            this.auditLogger = new audit_logger_1.AuditLogger('session-manager');
        }
        this.startCleanupProcess();
        this.setupEventListeners();
    }
    /**
     * Create a new session with comprehensive state tracking
     */
    async createSession(mode, initialContext) {
        // Check session limits
        if (this.sessions.size >= this.config.maxConcurrentSessions) {
            await this.cleanupExpiredSessions();
            if (this.sessions.size >= this.config.maxConcurrentSessions) {
                throw new Error(`Maximum concurrent sessions (${this.config.maxConcurrentSessions}) exceeded`);
            }
        }
        const sessionId = (0, uuid_1.v4)();
        const sessionState = {
            sessionId,
            startTime: new Date(),
            mode,
            status: 'active',
            context: initialContext || {},
            metrics: {
                commandsExecuted: 0,
                tokensUsed: 0,
                errorsEncountered: 0,
                phaseTransitions: 0
            }
        };
        // Validate session state
        const validatedState = workflow_1.SessionStateSchema.parse(sessionState);
        this.sessions.set(sessionId, validatedState);
        // Audit logging
        await this.auditLogger?.logEvent('session_created', {
            sessionId,
            mode,
            timestamp: new Date().toISOString(),
            totalActiveSessions: this.sessions.size
        });
        // Emit event
        this.emit('sessionCreated', { sessionId, mode, timestamp: new Date() });
        return sessionId;
    }
    /**
     * Get session state with validation
     */
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        // Check if session is expired
        if (this.isSessionExpired(session)) {
            this.removeSession(sessionId);
            return null;
        }
        return { ...session }; // Return copy to prevent mutations
    }
    /**
     * Update session state with validation
     */
    async updateSession(sessionId, updates) {
        const existingSession = this.sessions.get(sessionId);
        if (!existingSession) {
            return false;
        }
        // Create updated session
        const updatedSession = { ...existingSession, ...updates };
        // Validate updated state
        try {
            const validatedSession = workflow_1.SessionStateSchema.parse(updatedSession);
            this.sessions.set(sessionId, validatedSession);
            // Audit logging
            await this.auditLogger?.logEvent('session_updated', {
                sessionId,
                updates: Object.keys(updates),
                timestamp: new Date().toISOString()
            });
            // Emit event
            this.emit('sessionUpdated', { sessionId, updates, timestamp: new Date() });
            return true;
        }
        catch (error) {
            await this.auditLogger?.logEvent('session_update_failed', {
                sessionId,
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
            return false;
        }
    }
    /**
     * Update session metrics
     */
    async updateSessionMetrics(sessionId, metricsUpdate) {
        const session = this.getSession(sessionId);
        if (!session) {
            return false;
        }
        const currentMetrics = session.metrics || {
            commandsExecuted: 0,
            tokensUsed: 0,
            errorsEncountered: 0,
            phaseTransitions: 0
        };
        const updatedMetrics = {
            ...currentMetrics,
            ...metricsUpdate
        };
        return this.updateSession(sessionId, { metrics: updatedMetrics });
    }
    /**
     * Set current phase for session
     */
    async setSessionPhase(sessionId, phase) {
        const success = await this.updateSession(sessionId, { currentPhase: phase });
        if (success) {
            // Increment phase transitions counter
            const session = this.getSession(sessionId);
            if (session?.metrics) {
                await this.updateSessionMetrics(sessionId, {
                    phaseTransitions: session.metrics.phaseTransitions + 1
                });
            }
        }
        return success;
    }
    /**
     * Complete session
     */
    async completeSession(sessionId, success = true) {
        const session = this.getSession(sessionId);
        if (!session) {
            return false;
        }
        const endTime = new Date();
        const status = success ? 'completed' : 'failed';
        const updated = await this.updateSession(sessionId, {
            status,
            endTime
        });
        if (updated) {
            // Audit logging
            await this.auditLogger?.logEvent('session_completed', {
                sessionId,
                status,
                duration: endTime.getTime() - session.startTime.getTime(),
                metrics: session.metrics,
                timestamp: endTime.toISOString()
            });
            // Emit event
            this.emit('sessionCompleted', {
                sessionId,
                status,
                duration: endTime.getTime() - session.startTime.getTime(),
                timestamp: endTime
            });
            // Schedule cleanup
            setTimeout(() => this.removeSession(sessionId), 5000);
        }
        return updated;
    }
    /**
     * Remove session
     */
    removeSession(sessionId) {
        const existed = this.sessions.delete(sessionId);
        if (existed) {
            this.emit('sessionRemoved', { sessionId, timestamp: new Date() });
        }
        return existed;
    }
    /**
     * Get all active sessions
     */
    getActiveSessions() {
        return Array.from(this.sessions.values()).filter(session => session.status === 'active' && !this.isSessionExpired(session));
    }
    /**
     * Get sessions by mode
     */
    getSessionsByMode(mode) {
        return Array.from(this.sessions.values()).filter(session => session.mode === mode && !this.isSessionExpired(session));
    }
    /**
     * Get session statistics
     */
    getSessionStats() {
        const sessions = Array.from(this.sessions.values());
        const completedSessions = sessions.filter(s => s.status === 'completed');
        const activeSessions = sessions.filter(s => s.status === 'active');
        const failedSessions = sessions.filter(s => s.status === 'failed');
        const totalDuration = completedSessions.reduce((acc, session) => {
            if (session.endTime) {
                return acc + (session.endTime.getTime() - session.startTime.getTime());
            }
            return acc;
        }, 0);
        const totalTokens = sessions.reduce((acc, session) => {
            return acc + (session.metrics?.tokensUsed || 0);
        }, 0);
        return {
            totalSessions: sessions.length,
            activeSessions: activeSessions.length,
            completedSessions: completedSessions.length,
            failedSessions: failedSessions.length,
            averageDuration: completedSessions.length > 0 ? totalDuration / completedSessions.length : 0,
            totalTokensUsed: totalTokens
        };
    }
    /**
     * Check if session is expired
     */
    isSessionExpired(session) {
        const now = Date.now();
        const sessionAge = now - session.startTime.getTime();
        return sessionAge > this.config.sessionTimeoutMs;
    }
    /**
     * Clean up expired sessions
     */
    async cleanupExpiredSessions() {
        const expiredSessions = [];
        for (const [sessionId, session] of this.sessions.entries()) {
            if (this.isSessionExpired(session)) {
                expiredSessions.push(sessionId);
            }
        }
        for (const sessionId of expiredSessions) {
            await this.auditLogger?.logEvent('session_expired', {
                sessionId,
                timestamp: new Date().toISOString()
            });
            this.removeSession(sessionId);
        }
        if (expiredSessions.length > 0) {
            this.emit('sessionsCleanedUp', {
                count: expiredSessions.length,
                sessionIds: expiredSessions,
                timestamp: new Date()
            });
        }
    }
    /**
     * Start cleanup process
     */
    startCleanupProcess() {
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpiredSessions();
        }, 60000); // Run cleanup every minute
    }
    /**
     * Setup event listeners for monitoring
     */
    setupEventListeners() {
        this.on('sessionCreated', ({ sessionId, mode }) => {
            console.log(`Session created: ${sessionId} (${mode})`);
        });
        this.on('sessionCompleted', ({ sessionId, status, duration }) => {
            console.log(`Session ${sessionId} ${status} (${duration}ms)`);
        });
        this.on('sessionsCleanedUp', ({ count }) => {
            console.log(`Cleaned up ${count} expired sessions`);
        });
    }
    /**
     * Graceful shutdown
     */
    async shutdown() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        // Complete any active sessions
        const activeSessions = this.getActiveSessions();
        for (const session of activeSessions) {
            await this.completeSession(session.sessionId, false);
        }
        // Final audit log
        await this.auditLogger?.logEvent('session_manager_shutdown', {
            timestamp: new Date().toISOString(),
            finalStats: this.getSessionStats()
        });
        this.removeAllListeners();
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=session-manager.js.map