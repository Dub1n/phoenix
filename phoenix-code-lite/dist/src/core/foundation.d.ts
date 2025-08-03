import { z } from 'zod';
import { SessionManager } from './session-manager';
import { ModeManager } from './mode-manager';
import { AuditLogger } from '../utils/audit-logger';
/**
 * Core Foundation - Phase 1 Infrastructure
 *
 * This module provides the foundational infrastructure for Phoenix Code Lite,
 * implementing session management, dual mode architecture, and core services.
 */
export declare const CoreConfigSchema: z.ZodObject<{
    system: z.ZodObject<{
        name: z.ZodDefault<z.ZodString>;
        version: z.ZodDefault<z.ZodString>;
        environment: z.ZodDefault<z.ZodEnum<{
            production: "production";
            test: "test";
            development: "development";
        }>>;
        logLevel: z.ZodDefault<z.ZodEnum<{
            error: "error";
            warn: "warn";
            info: "info";
            debug: "debug";
        }>>;
    }, z.core.$strip>;
    session: z.ZodObject<{
        maxConcurrentSessions: z.ZodDefault<z.ZodNumber>;
        sessionTimeoutMs: z.ZodDefault<z.ZodNumber>;
        persistentStorage: z.ZodDefault<z.ZodBoolean>;
        auditLogging: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>;
    mode: z.ZodObject<{
        defaultMode: z.ZodDefault<z.ZodEnum<{
            standalone: "standalone";
            integrated: "integrated";
        }>>;
        allowModeSwitching: z.ZodDefault<z.ZodBoolean>;
        autoDetectIntegration: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>;
    performance: z.ZodObject<{
        maxMemoryUsage: z.ZodDefault<z.ZodNumber>;
        gcInterval: z.ZodDefault<z.ZodNumber>;
        metricsCollection: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>;
}, z.core.$strip>;
export type CoreConfig = z.infer<typeof CoreConfigSchema>;
/**
 * Core system state tracking
 */
export interface SystemState {
    initialized: boolean;
    startTime: Date;
    uptime: number;
    mode: 'standalone' | 'integrated';
    sessionsActive: number;
    memoryUsage: {
        heapUsed: number;
        heapTotal: number;
        external: number;
        rss: number;
    };
    performance: {
        averageResponseTime: number;
        totalRequests: number;
        errorRate: number;
    };
}
/**
 * Core Foundation Class
 *
 * Manages the core infrastructure components including session management,
 * mode management, and system monitoring.
 */
export declare class CoreFoundation {
    private config;
    private sessionManager;
    private modeManager;
    private auditLogger;
    private systemState;
    private initialized;
    private performanceMetrics;
    constructor(config?: Partial<CoreConfig>);
    /**
     * Initialize system state
     */
    private initializeSystemState;
    /**
     * Initialize the core foundation
     */
    initialize(): Promise<boolean>;
    /**
     * Validate system requirements
     */
    private validateSystemRequirements;
    /**
     * Initialize all components
     */
    private initializeComponents;
    /**
     * Auto-detect if we should use integrated mode
     */
    private autoDetectIntegrationMode;
    /**
     * Setup event listeners
     */
    private setupEventListeners;
    /**
     * Setup system monitoring
     */
    private setupSystemMonitoring;
    /**
     * Update system state
     */
    private updateSystemState;
    /**
     * Calculate average response time
     */
    private calculateAverageResponseTime;
    /**
     * Record performance metrics
     */
    recordRequest(responseTime: number, isError?: boolean): void;
    /**
     * Handle critical errors
     */
    private handleCriticalError;
    /**
     * Get system status
     */
    getSystemStatus(): {
        status: 'healthy' | 'warning' | 'critical';
        details: SystemState;
        components: {
            sessionManager: 'online' | 'offline';
            modeManager: 'online' | 'offline';
            auditLogger: 'online' | 'offline';
        };
    };
    /**
     * Get core components
     */
    getComponents(): {
        sessionManager: SessionManager;
        modeManager: ModeManager;
        auditLogger: AuditLogger;
    };
    /**
     * Graceful shutdown
     */
    gracefulShutdown(): Promise<void>;
    /**
     * Check if system is initialized
     */
    isInitialized(): boolean;
    /**
     * Get configuration
     */
    getConfig(): CoreConfig;
}
//# sourceMappingURL=foundation.d.ts.map