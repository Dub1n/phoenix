"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreFoundation = exports.CoreConfigSchema = void 0;
const zod_1 = require("zod");
const session_manager_1 = require("./session-manager");
const mode_manager_1 = require("./mode-manager");
const audit_logger_1 = require("../utils/audit-logger");
/**
 * Core Foundation - Phase 1 Infrastructure
 *
 * This module provides the foundational infrastructure for Phoenix Code Lite,
 * implementing session management, dual mode architecture, and core services.
 */
// Core system configuration schema
exports.CoreConfigSchema = zod_1.z.object({
    system: zod_1.z.object({
        name: zod_1.z.string().default('Phoenix Code Lite'),
        version: zod_1.z.string().default('1.0.0'),
        environment: zod_1.z.enum(['development', 'production', 'test']).default('development'),
        logLevel: zod_1.z.enum(['debug', 'info', 'warn', 'error']).default('info')
    }),
    session: zod_1.z.object({
        maxConcurrentSessions: zod_1.z.number().min(1).max(10).default(3),
        sessionTimeoutMs: zod_1.z.number().min(60000).default(3600000), // 1 hour
        persistentStorage: zod_1.z.boolean().default(false),
        auditLogging: zod_1.z.boolean().default(true)
    }),
    mode: zod_1.z.object({
        defaultMode: zod_1.z.enum(['standalone', 'integrated']).default('standalone'),
        allowModeSwitching: zod_1.z.boolean().default(true),
        autoDetectIntegration: zod_1.z.boolean().default(true)
    }),
    performance: zod_1.z.object({
        maxMemoryUsage: zod_1.z.number().min(100).default(500), // MB
        gcInterval: zod_1.z.number().min(30000).default(300000), // 5 minutes
        metricsCollection: zod_1.z.boolean().default(true)
    })
});
/**
 * Core Foundation Class
 *
 * Manages the core infrastructure components including session management,
 * mode management, and system monitoring.
 */
class CoreFoundation {
    constructor(config) {
        this.initialized = false;
        this.performanceMetrics = {
            requestTimes: [],
            totalRequests: 0,
            errors: 0
        };
        // Parse and validate configuration
        this.config = exports.CoreConfigSchema.parse(config || {});
        // Initialize core components
        this.auditLogger = new audit_logger_1.AuditLogger('core-foundation');
        this.modeManager = new mode_manager_1.ModeManager(this.config.mode.defaultMode);
        this.sessionManager = new session_manager_1.SessionManager({
            maxConcurrentSessions: this.config.session.maxConcurrentSessions,
            sessionTimeoutMs: this.config.session.sessionTimeoutMs,
            persistentStorage: this.config.session.persistentStorage,
            auditLogging: this.config.session.auditLogging
        });
        // Initialize system state
        this.systemState = this.initializeSystemState();
        // Setup monitoring
        this.setupSystemMonitoring();
    }
    /**
     * Initialize system state
     */
    initializeSystemState() {
        const memUsage = process.memoryUsage();
        return {
            initialized: false,
            startTime: new Date(),
            uptime: 0,
            mode: this.config.mode.defaultMode,
            sessionsActive: 0,
            memoryUsage: {
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external,
                rss: memUsage.rss
            },
            performance: {
                averageResponseTime: 0,
                totalRequests: 0,
                errorRate: 0
            }
        };
    }
    /**
     * Initialize the core foundation
     */
    async initialize() {
        if (this.initialized) {
            return true;
        }
        try {
            // Log initialization start
            await this.auditLogger.logEvent('core_foundation_init_start', {
                config: this.config,
                timestamp: new Date().toISOString()
            });
            // Validate system requirements
            await this.validateSystemRequirements();
            // Initialize components
            await this.initializeComponents();
            // Setup event listeners
            this.setupEventListeners();
            // Mark as initialized
            this.initialized = true;
            this.systemState.initialized = true;
            // Log successful initialization
            await this.auditLogger.logEvent('core_foundation_initialized', {
                mode: this.modeManager.getCurrentMode().mode,
                systemState: this.systemState,
                timestamp: new Date().toISOString()
            });
            console.log('🚀 Phoenix Code Lite Core Foundation initialized successfully');
            return true;
        }
        catch (error) {
            await this.auditLogger.logEvent('core_foundation_init_failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date().toISOString()
            });
            console.error('❌ Core Foundation initialization failed:', error);
            return false;
        }
    }
    /**
     * Validate system requirements
     */
    async validateSystemRequirements() {
        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        if (majorVersion < 18) {
            throw new Error(`Node.js 18+ required, current version: ${nodeVersion}`);
        }
        // Check available memory
        const totalMemory = process.memoryUsage().rss;
        const maxMemoryMB = this.config.performance.maxMemoryUsage;
        if (totalMemory > maxMemoryMB * 1024 * 1024) {
            console.warn(`⚠️  Memory usage (${Math.round(totalMemory / 1024 / 1024)}MB) exceeds configured limit (${maxMemoryMB}MB)`);
        }
        // Validate file system access
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await fs.access('./');
        }
        catch (error) {
            throw new Error('File system access validation failed');
        }
    }
    /**
     * Initialize all components
     */
    async initializeComponents() {
        // Components are already initialized in constructor
        // This method can be extended for additional initialization logic
        // Auto-detect integration mode if enabled
        if (this.config.mode.autoDetectIntegration) {
            await this.autoDetectIntegrationMode();
        }
    }
    /**
     * Auto-detect if we should use integrated mode
     */
    async autoDetectIntegrationMode() {
        try {
            // Check for Claude Code SDK availability
            await Promise.resolve().then(() => __importStar(require('@anthropic-ai/claude-code')));
            // Check for API key
            if (process.env.ANTHROPIC_API_KEY) {
                console.log('🔗 Claude Code SDK detected, switching to integrated mode');
                await this.modeManager.switchMode('integrated');
                this.systemState.mode = 'integrated';
            }
        }
        catch (error) {
            // Stay in standalone mode
            console.log('📱 Running in standalone mode');
        }
    }
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Session manager events
        this.sessionManager.on('sessionCreated', () => {
            this.updateSystemState();
        });
        this.sessionManager.on('sessionCompleted', () => {
            this.updateSystemState();
        });
        // Process events
        process.on('uncaughtException', async (error) => {
            await this.handleCriticalError('uncaught_exception', error);
        });
        process.on('unhandledRejection', async (reason) => {
            await this.handleCriticalError('unhandled_rejection', reason);
        });
        // Graceful shutdown
        process.on('SIGINT', () => this.gracefulShutdown());
        process.on('SIGTERM', () => this.gracefulShutdown());
    }
    /**
     * Setup system monitoring
     */
    setupSystemMonitoring() {
        if (!this.config.performance.metricsCollection) {
            return;
        }
        // Update system state every 30 seconds
        setInterval(() => {
            this.updateSystemState();
        }, 30000);
        // Garbage collection monitoring
        setInterval(() => {
            if (global.gc) {
                global.gc();
            }
        }, this.config.performance.gcInterval);
    }
    /**
     * Update system state
     */
    updateSystemState() {
        const memUsage = process.memoryUsage();
        const activeSessions = this.sessionManager.getActiveSessions();
        this.systemState = {
            ...this.systemState,
            uptime: Date.now() - this.systemState.startTime.getTime(),
            sessionsActive: activeSessions.length,
            memoryUsage: {
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external,
                rss: memUsage.rss
            },
            performance: {
                averageResponseTime: this.calculateAverageResponseTime(),
                totalRequests: this.performanceMetrics.totalRequests,
                errorRate: this.performanceMetrics.totalRequests > 0
                    ? this.performanceMetrics.errors / this.performanceMetrics.totalRequests
                    : 0
            }
        };
    }
    /**
     * Calculate average response time
     */
    calculateAverageResponseTime() {
        if (this.performanceMetrics.requestTimes.length === 0) {
            return 0;
        }
        const sum = this.performanceMetrics.requestTimes.reduce((a, b) => a + b, 0);
        return sum / this.performanceMetrics.requestTimes.length;
    }
    /**
     * Record performance metrics
     */
    recordRequest(responseTime, isError = false) {
        this.performanceMetrics.totalRequests++;
        this.performanceMetrics.requestTimes.push(responseTime);
        if (isError) {
            this.performanceMetrics.errors++;
        }
        // Keep only last 1000 response times for memory efficiency
        if (this.performanceMetrics.requestTimes.length > 1000) {
            this.performanceMetrics.requestTimes = this.performanceMetrics.requestTimes.slice(-1000);
        }
    }
    /**
     * Handle critical errors
     */
    async handleCriticalError(type, error) {
        await this.auditLogger.logEvent('critical_error', {
            type,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            systemState: this.systemState,
            timestamp: new Date().toISOString()
        });
        console.error(`🚨 Critical Error (${type}):`, error);
        // Attempt graceful recovery
        try {
            await this.gracefulShutdown();
        }
        catch (shutdownError) {
            console.error('Failed to shutdown gracefully:', shutdownError);
            process.exit(1);
        }
    }
    /**
     * Get system status
     */
    getSystemStatus() {
        const memoryUsagePercent = (this.systemState.memoryUsage.heapUsed / (this.config.performance.maxMemoryUsage * 1024 * 1024)) * 100;
        const errorRate = this.systemState.performance.errorRate;
        let status = 'healthy';
        if (memoryUsagePercent > 90 || errorRate > 0.1) {
            status = 'critical';
        }
        else if (memoryUsagePercent > 75 || errorRate > 0.05) {
            status = 'warning';
        }
        return {
            status,
            details: { ...this.systemState },
            components: {
                sessionManager: 'online',
                modeManager: 'online',
                auditLogger: 'online'
            }
        };
    }
    /**
     * Get core components
     */
    getComponents() {
        return {
            sessionManager: this.sessionManager,
            modeManager: this.modeManager,
            auditLogger: this.auditLogger
        };
    }
    /**
     * Graceful shutdown
     */
    async gracefulShutdown() {
        console.log('🔄 Initiating graceful shutdown...');
        try {
            // Shutdown components
            await this.sessionManager.shutdown();
            await this.modeManager.shutdown();
            // Final audit log
            await this.auditLogger.logEvent('core_foundation_shutdown', {
                uptime: this.systemState.uptime,
                finalState: this.systemState,
                timestamp: new Date().toISOString()
            });
            console.log('✅ Phoenix Code Lite shutdown completed');
            process.exit(0);
        }
        catch (error) {
            console.error('❌ Error during shutdown:', error);
            process.exit(1);
        }
    }
    /**
     * Check if system is initialized
     */
    isInitialized() {
        return this.initialized;
    }
    /**
     * Get configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
exports.CoreFoundation = CoreFoundation;
//# sourceMappingURL=foundation.js.map