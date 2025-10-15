/**
 * @fileoverview Enhanced MCP Integration with Visual Feedback Loops
 * 
 * date: 2025-09-13T103229Z
 * name: enhanced-mcp-integration
 * TASK-ID: ["TASK-MCP-009"]
 * category: mcp-enhanced-integration
 * status: ["[~]"]
 * patterns: ["integration-orchestration", "visual-error-handling", "comprehensive-monitoring"]
 * components: ["enhanced-mcp-integration", "error-recovery-system", "integration-validator"]
 * dependencies: ["visual-feedback-system", "real-time-monitor", "cli-mcp-server", "health-monitor"]
 * tags: ["mcp-integration", "error-handling", "visual-feedback", "integration-robustness"]
 * 
 * Provides enhanced MCP integration with comprehensive visual feedback including:
 * - Integrated visual error handling and recovery
 * - Enhanced MCP tool registration with visual validation
 * - Comprehensive integration robustness with visual monitoring
 * - Real-time communication stability tracking
 * - Progressive error recovery with visual feedback
 * 
 * @author VDL Vault Execution Agent
 * @since 2025-09-13
 */
import { EventDrivenComponent } from '../../utils/event-bus-adapter';
import type { TypedEventMap } from '../../utils/event-utils';
import { CLIMCPServer, MCPRequest, MCPResponse } from './cli-mcp-server';
import { VisualFeedbackSystem } from './visual-feedback-system';
import { RealTimeMonitor } from './real-time-monitor';
import { MCPHealthMonitor } from './health-monitor';
import { ProgressiveTimeoutManager } from './progressive-timeout-manager';
import { PTYManager } from './pty-manager';
import { AsyncUtils } from '../../utils/async-utils';
import { createMCPDiagnostics } from './mcp-diagnostics';

export interface EnhancedMCPConfig {
  enableVisualFeedback: boolean;
  enableRealTimeMonitoring: boolean;
  enableErrorRecovery: boolean;
  enableValidationFeedback: boolean;
  autoStartMonitoring: boolean;
  integrationValidation: {
    enableToolRegistration: boolean;
    enableCommunicationStability: boolean;
    enablePerformanceValidation: boolean;
    enableErrorHandling: boolean;
  };
}

export interface IntegrationStatus {
  status: 'initializing' | 'ready' | 'degraded' | 'error' | 'recovering';
  timestamp: number;
  components: {
    mcpServer: 'ready' | 'error' | 'initializing';
    visualFeedback: 'ready' | 'error' | 'initializing';
    realTimeMonitor: 'ready' | 'error' | 'initializing';
    healthMonitor: 'ready' | 'error' | 'initializing';
    timeoutManager: 'ready' | 'error' | 'initializing';
  };
  validations: ValidationStatus[];
  metrics: IntegrationMetrics;
}

export interface ValidationStatus {
  operation: string;
  status: 'passed' | 'failed' | 'in_progress';
  duration: number;
  timestamp: number;
  details?: any;
  error?: string;
}

export interface IntegrationMetrics {
  uptime: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  toolRegistrationSuccessRate: number;
  communicationStability: number;
  errorRecoveryCount: number;
  lastValidation: number;
}

export interface ErrorRecoveryResult {
  success: boolean;
  strategy: string;
  duration: number;
  details: any;
  timestamp: number;
}

interface EnhancedMCPIntegrationEvents extends TypedEventMap {
  'integration-ready': (status: IntegrationStatus) => void;
}

/**
 * Enhanced MCP Integration System
 * 
 * Provides comprehensive MCP integration with visual feedback loops including:
 * - Orchestrated component initialization with visual progress
 * - Enhanced error handling with recovery strategies
 * - Real-time validation with visual feedback
 * - Integration robustness monitoring with visual indicators
 * - Progressive error recovery with visual status updates
 */
export class EnhancedMCPIntegration extends EventDrivenComponent<EnhancedMCPIntegrationEvents> {
  private static instanceCounter = 0;
  private config: EnhancedMCPConfig;
  
  // Core components
  private mcpServer: CLIMCPServer;
  private ptyManager: PTYManager;
  private timeoutManager: ProgressiveTimeoutManager;
  private healthMonitor: MCPHealthMonitor;
  private visualFeedback: VisualFeedbackSystem;
  private realTimeMonitor: RealTimeMonitor;
  
  // Integration state
  private integrationStatus: IntegrationStatus;
  private validationHistory: ValidationStatus[];
  private errorRecoveryHistory: ErrorRecoveryResult[];
  private startTime: number;
  private isInitialized: boolean = false;
  private isMonitoring: boolean = false;
  private readonly diagnostics = createMCPDiagnostics('enhanced-mcp-integration');

  constructor(config?: Partial<EnhancedMCPConfig>) {
    super(`enhanced-mcp-integration:${EnhancedMCPIntegration.instanceCounter++}`, 40);
    
    this.config = {
      enableVisualFeedback: true,
      enableRealTimeMonitoring: true,
      enableErrorRecovery: true,
      enableValidationFeedback: true,
      autoStartMonitoring: true,
      integrationValidation: {
        enableToolRegistration: true,
        enableCommunicationStability: true,
        enablePerformanceValidation: true,
        enableErrorHandling: true
      },
      ...config
    };

    this.startTime = Date.now();
    this.validationHistory = [];
    this.errorRecoveryHistory = [];

    // Initialize properties to avoid TypeScript errors
    this.mcpServer = null as any;
    this.ptyManager = null as any;
    this.timeoutManager = null as any;
    this.healthMonitor = null as any;
    this.visualFeedback = null as any;
    this.realTimeMonitor = null as any;
    this.integrationStatus = {
      status: 'initializing',
      timestamp: Date.now(),
      components: {
        mcpServer: 'initializing',
        visualFeedback: 'initializing',
        realTimeMonitor: 'initializing',
        healthMonitor: 'initializing',
        timeoutManager: 'initializing'
      },
      validations: [],
      metrics: {
        uptime: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        toolRegistrationSuccessRate: 0,
        communicationStability: 1.0,
        errorRecoveryCount: 0,
        lastValidation: Date.now()
      }
    };

    this.initializeIntegrationStatus();
  }

  /**
   * Initialize enhanced MCP integration with visual feedback
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      throw new Error('Enhanced MCP Integration already initialized');
    }

    try {
      // TODO: [TASK-MCP-009-INTEGRATION-001] Pattern: integration-initialization | Complexity: 8 | Dependencies: component-orchestration,visual-feedback
      // Context: Initialize comprehensive MCP integration with visual feedback and error handling
      // Validation-Required: component-readiness, integration-stability, error-recovery
      // Pattern-Info: { approach: "progressive-initialization", alternatives: "parallel-initialization,sequential", trade-offs: "reliability-vs-speed" }

      // Initialize visual feedback first for progress tracking
      if (this.config.enableVisualFeedback) {
        await this.initializeVisualFeedback();
      }

      // Show initialization progress
      this.showInitializationProgress('Starting Enhanced MCP Integration...', 10);

      // Initialize core components with visual feedback
      await this.initializeCoreComponents();
      
      // Perform integration validation
      if (this.config.integrationValidation) {
        await this.performIntegrationValidation();
      }

      // Start monitoring if enabled
      if (this.config.enableRealTimeMonitoring && this.config.autoStartMonitoring) {
        await this.startRealTimeMonitoring();
      }

      this.isInitialized = true;
      this.updateIntegrationStatus('ready');

      this.visualFeedback?.addIndicator({
        status: 'success',
        message: 'Enhanced MCP Integration initialized successfully',
        details: `Components ready, monitoring ${this.isMonitoring ? 'active' : 'disabled'}`,
        category: 'integration'
      });

      this.emit('integration-ready', this.getIntegrationStatus());

    } catch (error) {
      this.updateIntegrationStatus('error');
      const templumError = this.diagnostics.error('Enhanced MCP Integration initialization failed', error);
      
      if (this.visualFeedback) {
        this.visualFeedback.addIndicator({
          status: 'error',
          message: 'Enhanced MCP Integration initialization failed',
          details: templumError.message,
          category: 'integration'
        });
      }

      throw templumError;
    }
  }

  /**
   * Initialize visual feedback system
   */
  private async initializeVisualFeedback(): Promise<void> {
    this.updateComponentStatus('visualFeedback', 'initializing');
    
    try {
      this.visualFeedback = new VisualFeedbackSystem({
        enableColors: true,
        enableProgressBars: true,
        verbosityLevel: 'standard',
        refreshRate: 1000
      });

      this.updateComponentStatus('visualFeedback', 'ready');
      
      this.visualFeedback.addIndicator({
        status: 'success',
        message: 'Visual feedback system initialized',
        category: 'initialization'
      });

    } catch (error) {
      this.updateComponentStatus('visualFeedback', 'error');
      this.raiseIntegrationError('Visual feedback initialization failed', error, {
        component: 'visualFeedback'
      });
    }
  }

  /**
   * Initialize core MCP components with visual progress
   */
  private async initializeCoreComponents(): Promise<void> {
    const components = [
      { name: 'PTY Manager', key: 'ptyManager', init: () => this.initializePTYManager() },
      { name: 'Timeout Manager', key: 'timeoutManager', init: () => this.initializeTimeoutManager() },
      { name: 'MCP Server', key: 'mcpServer', init: () => this.initializeMCPServer() },
      { name: 'Health Monitor', key: 'healthMonitor', init: () => this.initializeHealthMonitor() },
      { name: 'Real-Time Monitor', key: 'realTimeMonitor', init: () => this.initializeRealTimeMonitor() }
    ];

    let progress = 20;
    const progressStep = 60 / components.length;

    for (const component of components) {
      this.showInitializationProgress(`Initializing ${component.name}...`, progress);
      this.updateComponentStatus(component.key as keyof IntegrationStatus['components'], 'initializing');
      
      try {
        await component.init();
        this.updateComponentStatus(component.key as keyof IntegrationStatus['components'], 'ready');
        
        this.visualFeedback?.addIndicator({
          status: 'success',
          message: `${component.name} initialized`,
          category: 'initialization'
        });

      } catch (error) {
        this.updateComponentStatus(component.key as keyof IntegrationStatus['components'], 'error');
        const templumError = this.diagnostics.error(`${component.name} initialization failed`, error, {
          component: component.key
        });

        this.visualFeedback?.addIndicator({
          status: 'error',
          message: `${component.name} initialization failed`,
          details: templumError.message,
          category: 'initialization'
        });

        throw templumError;
      }

      progress += progressStep;
    }

    this.showInitializationProgress('Core components initialized', 80);
  }

  /**
   * Initialize individual components
   */
  private async initializePTYManager(): Promise<void> {
    this.ptyManager = new PTYManager();
  }

  private async initializeTimeoutManager(): Promise<void> {
    this.timeoutManager = new ProgressiveTimeoutManager();
    
    // Set up event listeners for visual feedback
    this.timeoutManager.on('timeout-adaptation', (data) => {
      this.visualFeedback?.showTimeoutAdaptation(data.level, data.reason, data.duration);
    });

    this.timeoutManager.on('circuit-breaker-state-change', (data) => {
      this.visualFeedback?.showCircuitBreakerStatus(data.state, data.failureRate, data.details);
    });
  }

  private async initializeMCPServer(): Promise<void> {
    this.mcpServer = new CLIMCPServer();
  }

  private async initializeHealthMonitor(): Promise<void> {
    this.healthMonitor = new MCPHealthMonitor(this.mcpServer, this.ptyManager);
  }

  private async initializeRealTimeMonitor(): Promise<void> {
    if (!this.config.enableRealTimeMonitoring) return;
    
    this.realTimeMonitor = new RealTimeMonitor(
      this.visualFeedback,
      this.healthMonitor,
      this.timeoutManager
    );

    // Set up validation recording
    this.realTimeMonitor.on('validation-recorded', (validation) => {
      this.validationHistory.push({
        operation: validation.operation,
        status: validation.success ? 'passed' : 'failed',
        duration: validation.duration,
        timestamp: validation.timestamp,
        details: validation.details
      });
    });
  }

  /**
   * Perform comprehensive integration validation
   */
  private async performIntegrationValidation(): Promise<void> {
    this.showInitializationProgress('Running integration validation...', 85);

    const validations = [];

    if (this.config.integrationValidation.enableToolRegistration) {
      validations.push(this.validateToolRegistration());
    }

    if (this.config.integrationValidation.enableCommunicationStability) {
      validations.push(this.validateCommunicationStability());
    }

    if (this.config.integrationValidation.enablePerformanceValidation) {
      validations.push(this.validatePerformance());
    }

    if (this.config.integrationValidation.enableErrorHandling) {
      validations.push(this.validateErrorHandling());
    }

    const results = await Promise.allSettled(validations);
    
    let passedValidations = 0;
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled') {
        passedValidations++;
      } else {
        this.visualFeedback?.addIndicator({
          status: 'error',
          message: 'Integration validation failed',
          details: result.reason instanceof Error ? result.reason.message : String(result.reason),
          category: 'validation'
        });
      }
    }

    const successRate = (passedValidations / validations.length) * 100;
    
    this.visualFeedback?.addIndicator({
      status: successRate >= 80 ? 'success' : successRate >= 60 ? 'warning' : 'error',
      message: `Integration validation completed: ${successRate.toFixed(0)}% success rate`,
      details: `${passedValidations}/${validations.length} validations passed`,
      category: 'validation'
    });

    this.showInitializationProgress('Integration validation completed', 95);
  }

  /**
   * Individual validation methods with visual feedback
   */
  private async validateToolRegistration(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const tools = this.mcpServer.getAvailableTools();
      
      if (tools.length === 0) {
        throw new Error('No MCP tools available');
      }

      // Test tools/list request
      const testRequest: MCPRequest = {
        id: 'validation-' + Date.now(),
        method: 'tools/list'
      };

      const response = await this.mcpServer.handleMCPRequest(testRequest);
      
      if (response.error) {
        throw new Error(`MCP tools/list failed: ${response.error.message}`);
      }

      const duration = Date.now() - startTime;
      
      this.recordValidation({
        operation: 'Tool Registration',
        status: 'passed',
        duration,
        timestamp: startTime,
        details: { toolCount: tools.length, responseTime: duration }
      });

      this.visualFeedback?.showValidationFeedback('Tool Registration', true, duration, {
        toolCount: tools.length
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const templumError = this.diagnostics.error('Tool registration validation failed', error);
      
      this.recordValidation({
        operation: 'Tool Registration',
        status: 'failed',
        duration,
        timestamp: startTime,
        error: templumError.message
      });

      this.visualFeedback?.showValidationFeedback('Tool Registration', false, duration, {
        error: templumError.message
      });

      throw templumError;
    }
  }

  private async validateCommunicationStability(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const healthStatus = await this.healthMonitor.performHealthCheck();
      
      if (healthStatus.status === 'unhealthy') {
        throw new Error('Health check indicates unhealthy system');
      }

      const stability = healthStatus.metrics.communicationStability;
      if (stability < 0.8) {
        throw new Error(`Communication stability below threshold: ${(stability * 100).toFixed(1)}%`);
      }

      const duration = Date.now() - startTime;
      
      this.recordValidation({
        operation: 'Communication Stability',
        status: 'passed',
        duration,
        timestamp: startTime,
        details: { stability: stability, healthStatus: healthStatus.status }
      });

      this.visualFeedback?.showValidationFeedback('Communication Stability', true, duration, {
        stability: `${(stability * 100).toFixed(1)}%`
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const templumError = this.diagnostics.error('Communication stability validation failed', error);
      
      this.recordValidation({
        operation: 'Communication Stability',
        status: 'failed',
        duration,
        timestamp: startTime,
        error: templumError.message
      });

      this.visualFeedback?.showValidationFeedback('Communication Stability', false, duration, {
        error: templumError.message
      });
      throw templumError;
    }
  }

  private async validatePerformance(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const metrics = this.healthMonitor.getPerformanceMetrics();
      
      if (metrics.averageResponseTime > 200) {
        throw new Error(`Average response time too high: ${metrics.averageResponseTime}ms`);
      }

      const duration = Date.now() - startTime;
      
      this.recordValidation({
        operation: 'Performance Validation',
        status: 'passed',
        duration,
        timestamp: startTime,
        details: { averageResponseTime: metrics.averageResponseTime, requestCount: metrics.requestCount }
      });

      this.visualFeedback?.showValidationFeedback('Performance Validation', true, duration, metrics);

    } catch (error) {
      const duration = Date.now() - startTime;
      const templumError = this.diagnostics.error('Performance validation failed', error);
      
      this.recordValidation({
        operation: 'Performance Validation',
        status: 'failed',
        duration,
        timestamp: startTime,
        error: templumError.message
      });

      this.visualFeedback?.showValidationFeedback('Performance Validation', false, duration, {
        error: templumError.message
      });
      throw templumError;
    }
  }

  private async validateErrorHandling(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Test error handling with invalid request
      const invalidRequest: MCPRequest = {
        id: 'error-test-' + Date.now(),
        method: 'invalid-method'
      };

      const response = await this.mcpServer.handleMCPRequest(invalidRequest);
      
      if (!response.error) {
        throw new Error('Expected error response but got success');
      }

      if (response.error.code !== -32003) { // INVALID_ACTION
        throw new Error(`Unexpected error code: ${response.error.code}`);
      }

      const duration = Date.now() - startTime;
      
      this.recordValidation({
        operation: 'Error Handling',
        status: 'passed',
        duration,
        timestamp: startTime,
        details: { errorCode: response.error.code, errorMessage: response.error.message }
      });

      this.visualFeedback?.showValidationFeedback('Error Handling', true, duration, {
        errorCode: response.error.code
      });

    } catch (error) {
      const duration = Date.now() - startTime;
      const templumError = this.diagnostics.error('Error handling validation failed', error);
      
      this.recordValidation({
        operation: 'Error Handling',
        status: 'failed',
        duration,
        timestamp: startTime,
        error: templumError.message
      });

      this.visualFeedback?.showValidationFeedback('Error Handling', false, duration, {
        error: templumError.message
      });
      throw templumError;
    }
  }

  /**
   * Start real-time monitoring with visual feedback
   */
  async startRealTimeMonitoring(): Promise<void> {
    if (!this.realTimeMonitor) {
      throw new Error('Real-time monitor not initialized');
    }

    if (this.isMonitoring) {
      this.visualFeedback?.addIndicator({
        status: 'warning',
        message: 'Real-time monitoring already active',
        category: 'monitoring'
      });
      return;
    }

    this.realTimeMonitor.startMonitoring();
    this.isMonitoring = true;

    this.visualFeedback?.addIndicator({
      status: 'success',
      message: 'Real-time monitoring started',
      category: 'monitoring'
    });
  }

  /**
   * Stop real-time monitoring
   */
  stopRealTimeMonitoring(): void {
    if (!this.isMonitoring || !this.realTimeMonitor) {
      return;
    }

    this.realTimeMonitor.stopMonitoring();
    this.isMonitoring = false;

    this.visualFeedback?.addIndicator({
      status: 'info',
      message: 'Real-time monitoring stopped',
      category: 'monitoring'
    });
  }

  /**
   * Handle MCP request with enhanced error handling and visual feedback
   */
  async handleMCPRequest(request: MCPRequest): Promise<MCPResponse> {
    const startTime = Date.now();
    
    try {
      if (!this.isInitialized) {
        throw new Error('Enhanced MCP Integration not initialized');
      }

      // Record request attempt
      if (this.realTimeMonitor) {
        this.realTimeMonitor.recordValidation(`MCP Request: ${request.method}`, true, 0);
      }

      const response = await this.mcpServer.handleMCPRequest(request);
      const duration = Date.now() - startTime;

      // Record successful request
      if (this.realTimeMonitor) {
        this.realTimeMonitor.recordValidation(
          `MCP Request: ${request.method}`,
          !response.error,
          duration,
          { method: request.method, hasError: !!response.error }
        );
      }

      return response;

    } catch (error) {
      const duration = Date.now() - startTime;
      const templumError = this.diagnostics.error('Enhanced MCP request handling failed', error, {
        method: request.method
      });

      // Record failed request
      if (this.realTimeMonitor) {
        this.realTimeMonitor.recordValidation(
          `MCP Request: ${request.method}`,
          false,
          duration,
          { error: templumError.message }
        );
      }

      // Attempt error recovery if enabled
      if (this.config.enableErrorRecovery) {
        const recovery = await this.attemptErrorRecovery(templumError, request);
        if (recovery.success) {
          return recovery.details.response;
        }
      }

      throw templumError;
    }
  }

  /**
   * Attempt error recovery with visual feedback
   */
  private async attemptErrorRecovery(error: any, request: MCPRequest): Promise<ErrorRecoveryResult> {
    const startTime = Date.now();
    
    this.visualFeedback?.addIndicator({
      status: 'warning',
      message: 'Attempting error recovery...',
      details: this.getErrorMessage(error),
      category: 'error-recovery'
    });

    try {
      // TODO: [TASK-MCP-009-RECOVERY-001] Pattern: error-recovery-strategies | Complexity: 6 | Dependencies: circuit-breaker,timeout-management
      // Context: Implement progressive error recovery strategies with visual feedback
      // Validation-Required: recovery-effectiveness, fallback-mechanisms, recovery-time
      // Pattern-Info: { approach: "progressive-recovery", alternatives: "immediate-retry,exponential-backoff", trade-offs: "recovery-speed-vs-stability" }

      let strategy: string = 'unknown';
      let success = false;
      let recoveryResponse: MCPResponse | null = null;

      // Strategy 1: Simple retry for transient errors
      if (this.isTransientError(error)) {
        strategy = 'simple-retry';
        
        await AsyncUtils.sleep(1000); // 1 second delay
        
        try {
          recoveryResponse = await this.mcpServer.handleMCPRequest(request);
          success = !recoveryResponse.error;
        } catch (retryError) {
          // Continue to next strategy
        }
      }

      // Strategy 2: Circuit breaker reset for communication errors
      if (!success && this.isCommunicationError(error)) {
        strategy = 'circuit-breaker-reset';
        
        // This would trigger circuit breaker reset in timeout manager
        this.timeoutManager.resetCircuitBreaker();
        
        await AsyncUtils.sleep(2000); // 2 second delay
        
        try {
          recoveryResponse = await this.mcpServer.handleMCPRequest(request);
          success = !recoveryResponse.error;
        } catch (resetError) {
          // Continue to next strategy
        }
      }

      // Strategy 3: Component restart for severe errors
      if (!success && this.isSevereError(error)) {
        strategy = 'component-restart';
        
        try {
          await this.restartComponents();
          recoveryResponse = await this.mcpServer.handleMCPRequest(request);
          success = !recoveryResponse.error;
        } catch (restartError) {
          strategy = 'restart-failed';
        }
      }

      const duration = Date.now() - startTime;
      
      const result: ErrorRecoveryResult = {
        success,
        strategy: strategy!,
        duration,
        details: { response: recoveryResponse, originalError: error },
        timestamp: startTime
      };

      this.errorRecoveryHistory.push(result);

      if (success) {
        this.visualFeedback?.addIndicator({
          status: 'success',
          message: `Error recovery successful using ${strategy}`,
          details: `Recovery time: ${duration}ms`,
          category: 'error-recovery'
        });
      } else {
        this.visualFeedback?.addIndicator({
          status: 'error',
          message: `Error recovery failed with ${strategy}`,
          details: `Attempted recovery for ${duration}ms`,
          category: 'error-recovery'
        });
      }

      return result;

    } catch (recoveryError) {
      const duration = Date.now() - startTime;
      
      const result: ErrorRecoveryResult = {
        success: false,
        strategy: 'recovery-error',
        duration,
        details: { recoveryError, originalError: error },
        timestamp: startTime
      };

      this.errorRecoveryHistory.push(result);

      this.visualFeedback?.addIndicator({
        status: 'error',
        message: 'Error recovery process failed',
        details: recoveryError instanceof Error ? recoveryError.message : String(recoveryError),
        category: 'error-recovery'
      });

      return result;
    }
  }

  /**
   * Helper methods for error classification
   */
  private isTransientError(error: any): boolean {
    if (error instanceof Error) {
      return error.message.includes('timeout') || 
             error.message.includes('connection') ||
             error.message.includes('network');
    }
    return false;
  }

  private isCommunicationError(error: any): boolean {
    if (error instanceof Error) {
      return error.message.includes('circuit breaker') ||
             error.message.includes('communication') ||
             error.message.includes('stability');
    }
    return false;
  }

  private isSevereError(error: any): boolean {
    if (error instanceof Error) {
      return error.message.includes('internal') ||
             error.message.includes('critical') ||
             error.message.includes('system');
    }
    return false;
  }

  /**
   * Restart components for error recovery
   */
  private async restartComponents(): Promise<void> {
    this.visualFeedback?.addIndicator({
      status: 'warning',
      message: 'Restarting components for error recovery',
      category: 'error-recovery'
    });

    // This is a simplified restart - in reality would be more sophisticated
    this.updateIntegrationStatus('recovering');
    
    await AsyncUtils.sleep(3000); // Simulate restart time
    
    this.updateIntegrationStatus('ready');
  }

  /**
   * Utility methods
   */
  
  private showInitializationProgress(message: string, percentage: number): void {
    if (this.visualFeedback) {
      this.visualFeedback.showProgress({
        current: percentage,
        total: 100,
        label: message,
        showPercentage: true
      });
    }
  }

  private recordValidation(validation: ValidationStatus): void {
    this.validationHistory.push(validation);
    
    // Keep history manageable
    if (this.validationHistory.length > 100) {
      this.validationHistory.shift();
    }
  }

  private initializeIntegrationStatus(): void {
    this.integrationStatus = {
      status: 'initializing',
      timestamp: Date.now(),
      components: {
        mcpServer: 'initializing',
        visualFeedback: 'initializing',
        realTimeMonitor: 'initializing',
        healthMonitor: 'initializing',
        timeoutManager: 'initializing'
      },
      validations: [],
      metrics: {
        uptime: 0,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        toolRegistrationSuccessRate: 0,
        communicationStability: 1.0,
        errorRecoveryCount: 0,
        lastValidation: 0
      }
    };
  }

  private updateIntegrationStatus(status: IntegrationStatus['status']): void {
    this.integrationStatus.status = status;
    this.integrationStatus.timestamp = Date.now();
    
    // Update metrics
    this.integrationStatus.metrics.uptime = Date.now() - this.startTime;
    this.integrationStatus.metrics.errorRecoveryCount = this.errorRecoveryHistory.length;
    this.integrationStatus.metrics.lastValidation = this.validationHistory.length > 0 ? 
      this.validationHistory[this.validationHistory.length - 1].timestamp : 0;
  }

  private updateComponentStatus(
    component: keyof IntegrationStatus['components'], 
    status: IntegrationStatus['components'][keyof IntegrationStatus['components']]
  ): void {
    this.integrationStatus.components[component] = status;
  }

  /**
   * Get current integration status
   */
  getIntegrationStatus(): IntegrationStatus {
    return {
      ...this.integrationStatus,
      validations: [...this.validationHistory.slice(-10)] // Last 10 validations
    };
  }

  /**
   * Get integration statistics
   */
  getIntegrationStats(): {
    isInitialized: boolean;
    isMonitoring: boolean;
    uptime: number;
    validations: number;
    errorRecoveries: number;
    successRate: number;
  } {
    const successfulValidations = this.validationHistory.filter(v => v.status === 'passed').length;
    const successRate = this.validationHistory.length > 0 ? 
      (successfulValidations / this.validationHistory.length) * 100 : 0;

    return {
      isInitialized: this.isInitialized,
      isMonitoring: this.isMonitoring,
      uptime: Date.now() - this.startTime,
      validations: this.validationHistory.length,
      errorRecoveries: this.errorRecoveryHistory.length,
      successRate
    };
  }

  private raiseIntegrationError(message: string, error: unknown, context?: Record<string, unknown>): never {
    const templumError = this.diagnostics.error(message, error, context);
    throw templumError;
  }

  private getErrorMessage(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in (error as Record<string, unknown>)) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
      if (message !== undefined && message !== null) {
        return String(message);
      }
    }
    return String(error);
  }

  /**
   * Cleanup integration resources
   */
  async cleanup(): Promise<void> {
    this.stopRealTimeMonitoring();
    
    if (this.healthMonitor) {
      this.healthMonitor.cleanup?.();
    }
    
    if (this.mcpServer) {
      this.mcpServer.cleanup();
    }
    
    if (this.ptyManager) {
      this.ptyManager.cleanup();
    }
    
    if (this.visualFeedback) {
      this.visualFeedback.cleanup();
    }

    this.isInitialized = false;
    
    this.visualFeedback?.addIndicator({
      status: 'info',
      message: 'Enhanced MCP Integration cleaned up',
      category: 'system'
    });

    this.removeAllListeners();
  }
}

/**
 * Create enhanced MCP integration with default configuration
 */
export function createEnhancedMCPIntegration(config?: Partial<EnhancedMCPConfig>): EnhancedMCPIntegration {
  return new EnhancedMCPIntegration(config);
}
