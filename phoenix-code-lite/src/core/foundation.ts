/**---
 * title: [Core Foundation - Phase 1 Infrastructure]
 * tags: [Core, Infrastructure, Session-Management, Mode-Management]
 * provides: [CoreFoundation Class, CoreConfigSchema, SystemState Tracking, Initialization & Shutdown APIs]
 * requires: [SessionManager, ModeManager, AuditLogger, Zod, Test-Utils]
 * description: [Provides foundational infrastructure for Phoenix Code Lite including session management, dual-mode control, system monitoring, and lifecycle coordination.]
 * ---*/

import { z } from 'zod';
import { SessionManager } from './session-manager';
import { ModeManager } from './mode-manager';
import { AuditLogger } from '../utils/audit-logger';
import { safeExit } from '../utils/test-utils';

// Core system configuration schema
export const CoreConfigSchema = z.object({
  system: z.object({
    name: z.string().default('Phoenix Code Lite'),
    version: z.string().default('1.0.0'),
    environment: z.enum(['development', 'production', 'test']).default('development'),
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info')
  }),
  session: z.object({
    maxConcurrentSessions: z.number().min(1).max(10).default(3),
    sessionTimeoutMs: z.number().min(60000).default(3600000), // 1 hour
    persistentStorage: z.boolean().default(false),
    auditLogging: z.boolean().default(true)
  }),
  mode: z.object({
    defaultMode: z.enum(['standalone', 'integrated']).default('standalone'),
    allowModeSwitching: z.boolean().default(true),
    autoDetectIntegration: z.boolean().default(true)
  }),
  performance: z.object({
    maxMemoryUsage: z.number().min(100).default(500), // MB
    gcInterval: z.number().min(30000).default(300000), // 5 minutes
    metricsCollection: z.boolean().default(true)
  })
});

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
export class CoreFoundation {
  private config: CoreConfig;
  private sessionManager: SessionManager;
  private modeManager: ModeManager;
  private auditLogger: AuditLogger;
  private systemState: SystemState;
  private initialized: boolean = false;
  private performanceMetrics: {
    requestTimes: number[];
    totalRequests: number;
    errors: number;
  } = {
    requestTimes: [],
    totalRequests: 0,
    errors: 0
  };
  private monitoringIntervals: NodeJS.Timeout[] = [];

  constructor(config?: Partial<CoreConfig>) {
    // Parse and validate configuration
    this.config = CoreConfigSchema.parse(config || {});
    
    // Initialize core components
    this.auditLogger = new AuditLogger('core-foundation');
    this.modeManager = new ModeManager(this.config.mode.defaultMode);
    this.sessionManager = new SessionManager({
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
  private initializeSystemState(): SystemState {
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
  public async initialize(): Promise<boolean> {
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

      console.log('^ Phoenix Code Lite Core Foundation initialized successfully');
      return true;

    } catch (error) {
      await this.auditLogger.logEvent('core_foundation_init_failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });

      console.error('✗ Core Foundation initialization failed:', error);
      return false;
    }
  }

  /**
   * Validate system requirements
   */
  private async validateSystemRequirements(): Promise<void> {
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
      console.warn(`⚠  Memory usage (${Math.round(totalMemory / 1024 / 1024)}MB) exceeds configured limit (${maxMemoryMB}MB)`);
    }

    // Validate file system access
    try {
      const fs = await import('fs/promises');
      await fs.access('./');
    } catch (error) {
      throw new Error('File system access validation failed');
    }
  }

  /**
   * Initialize all components
   */
  private async initializeComponents(): Promise<void> {
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
  private async autoDetectIntegrationMode(): Promise<void> {
    try {
      // Check for Claude Code SDK availability
      await import('@anthropic-ai/claude-code');
      
      // Check for API key
      if (process.env.ANTHROPIC_API_KEY) {
        console.log('∞ Claude Code SDK detected, switching to integrated mode');
        await this.modeManager.switchMode('integrated');
        this.systemState.mode = 'integrated';
      }
    } catch (error) {
      // Stay in standalone mode
      console.log('📱 Running in standalone mode');
    }
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
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
  private setupSystemMonitoring(): void {
    if (!this.config.performance.metricsCollection) {
      return;
    }

    // Update system state every 30 seconds
    const stateInterval = setInterval(() => {
      this.updateSystemState();
    }, 30000);
    this.monitoringIntervals.push(stateInterval);

    // Garbage collection monitoring
    const gcInterval = setInterval(() => {
      if (global.gc) {
        global.gc();
      }
    }, this.config.performance.gcInterval);
    this.monitoringIntervals.push(gcInterval);
  }

  /**
   * Update system state
   */
  private updateSystemState(): void {
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
  private calculateAverageResponseTime(): number {
    if (this.performanceMetrics.requestTimes.length === 0) {
      return 0;
    }

    const sum = this.performanceMetrics.requestTimes.reduce((a, b) => a + b, 0);
    return sum / this.performanceMetrics.requestTimes.length;
  }

  /**
   * Record performance metrics
   */
  public recordRequest(responseTime: number, isError: boolean = false): void {
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
  private async handleCriticalError(type: string, error: any): Promise<void> {
    await this.auditLogger.logEvent('critical_error', {
      type,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      systemState: this.systemState,
      timestamp: new Date().toISOString()
    });

    console.error(`⚡ Critical Error (${type}):`, error);
    
    // Attempt graceful recovery
    try {
      await this.gracefulShutdown();
    } catch (shutdownError) {
      console.error('Failed to shutdown gracefully:', shutdownError);
      process.exit(1);
    }
  }

  /**
   * Get system status
   */
  public getSystemStatus(): {
    status: 'healthy' | 'warning' | 'critical';
    details: SystemState;
    components: {
      sessionManager: 'online' | 'offline';
      modeManager: 'online' | 'offline';
      auditLogger: 'online' | 'offline';
    };
  } {
    const memoryUsagePercent = (this.systemState.memoryUsage.heapUsed / (this.config.performance.maxMemoryUsage * 1024 * 1024)) * 100;
    const errorRate = this.systemState.performance.errorRate;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    
    if (memoryUsagePercent > 90 || errorRate > 0.1) {
      status = 'critical';
    } else if (memoryUsagePercent > 75 || errorRate > 0.05) {
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
  public getComponents(): {
    sessionManager: SessionManager;
    modeManager: ModeManager;
    auditLogger: AuditLogger;
  } {
    return {
      sessionManager: this.sessionManager,
      modeManager: this.modeManager,
      auditLogger: this.auditLogger
    };
  }

  /**
   * Graceful shutdown
   */
  public async gracefulShutdown(): Promise<void> {
    console.log('⇔ Initiating graceful shutdown...');

    try {
      // Clear monitoring intervals
      this.monitoringIntervals.forEach(interval => clearInterval(interval));
      this.monitoringIntervals = [];

      // Shutdown components
      await this.sessionManager.shutdown();
      await this.modeManager.shutdown();

      // Final audit log
      await this.auditLogger.logEvent('core_foundation_shutdown', {
        uptime: this.systemState.uptime,
        finalState: this.systemState,
        timestamp: new Date().toISOString()
      });

      // Destroy audit logger to clear intervals and flush buffer
      await this.auditLogger.destroy();

      console.log('✓ Phoenix Code Lite shutdown completed');
      
      safeExit(0);

    } catch (error) {
      console.error('✗ Error during shutdown:', error);
      
      safeExit(1);
    }
  }

  /**
   * Check if system is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get configuration
   */
  public getConfig(): CoreConfig {
    return { ...this.config };
  }
}
