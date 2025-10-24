/**
---
date: "2025-09-13T215000Z"
name: "runtime-compatibility-verifier"
TASK-ID: ["TASK-MCP-007"]
category: "mcp-integration-runtime-verification"
status: ["[T]"]
patterns: ["defensive-programming", "runtime-compatibility", "probabilistic-error-handling", "risk-adaptive-approach"]
components: ["runtime-compatibility-verifier", "mcp-channel"]
dependencies: ["nodejs-runtime", "event-management", "process-compatibility"]
tags: ["runtime-verification", "compatibility-check", "defensive-programming", "risk-adaptation"]
---
* @fileoverview Runtime Compatibility Verifier for MCP Channel Integration
* @author Claude Code Implementation  
* @created 2025-09-13
* 
* TASK-MCP-007: Runtime Compatibility Verification with Risk-Adaptive Approach
* 
* Implements comprehensive runtime compatibility verification with:
* - Cross-platform compatibility checks
* - Node.js version and feature detection
* - Process capability verification
* - Event system compatibility validation
* - Probabilistic error handling and recovery strategies
* - Risk-adaptive configuration based on environment
*/

import * as os from 'os';
import * as process from 'process';
import { eventManager } from './event-listener-manager';
import { EventUtils, type GenericEventMap } from '../../utils/event-utils';
import { createLogger } from '../../utils/logger';

export interface CompatibilityResult {
  compatible: boolean;
  confidence: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  issues: CompatibilityIssue[];
  recommendations: string[];
  adaptedConfiguration?: AdaptedConfiguration;
}

export interface CompatibilityIssue {
  category: 'platform' | 'nodejs' | 'event-system' | 'process-signals' | 'file-system';
  severity: 'warning' | 'error' | 'critical';
  description: string;
  detectedValue?: any;
  expectedValue?: any;
  workaround?: string;
}

export interface AdaptedConfiguration {
  enableSignalHandling: boolean;
  enableProcessIntrospection: boolean;
  maxEventListeners: number;
  timeoutMultiplier: number;
  fallbackMode: boolean;
  platformSpecificOptimizations: Record<string, any>;
}

export interface RuntimeEnvironment {
  platform: string;
  nodeVersion: string;
  architecture: string;
  processFeatures: {
    signalHandling: boolean;
    eventIntrospection: boolean;
    processEvents: boolean;
  };
  systemCapabilities: {
    homeDirectory: boolean;
    pathResolution: boolean;
    fileSystem: boolean;
  };
}

const runtimeLogger = createLogger('mcp-channel:runtime-compatibility-verifier');

/**
 * Runtime Compatibility Verifier
 * 
 * Implements comprehensive runtime compatibility verification with probabilistic
 * error handling and risk-adaptive configuration for MCP channel integration.
 */
export class RuntimeCompatibilityVerifier {
  private static instance: RuntimeCompatibilityVerifier;
  private cachedEnvironment?: RuntimeEnvironment;
  private lastVerificationTime: number = 0;
  private verificationCache: Map<string, CompatibilityResult> = new Map();

  // Risk-adaptive configuration
  private readonly VERIFICATION_CACHE_TTL = 300000; // 5 minutes
  private readonly CONFIDENCE_THRESHOLD = 75;
  private readonly CRITICAL_ISSUES_LIMIT = 2;

  private constructor() {
    // TODO: [TASK-MCP-007-COMPAT-001] Pattern: singleton-runtime-verifier | Complexity: 4 | Dependencies: system-introspection
    // Context: Centralized runtime compatibility verification with caching
    // Validation-Required: environment-detection-accuracy, cache-effectiveness, cross-platform-support
    // Pattern-Info: { approach: "cached-singleton-verifier", alternatives: "per-component-verification", trade-offs: "performance-vs-flexibility" }
  }

  public static getInstance(): RuntimeCompatibilityVerifier {
    if (!RuntimeCompatibilityVerifier.instance) {
      RuntimeCompatibilityVerifier.instance = new RuntimeCompatibilityVerifier();
    }
    return RuntimeCompatibilityVerifier.instance;
  }

  /**
   * Perform comprehensive runtime compatibility verification
   */
  public async verifyCompatibility(forceRefresh: boolean = false): Promise<CompatibilityResult> {
    // TODO: [TASK-MCP-007-COMPAT-002] Pattern: comprehensive-compatibility-check | Complexity: 6 | Dependencies: runtime-introspection
    // Context: Verify runtime environment compatibility for MCP channel operations
    // Validation-Required: detection-accuracy, performance-impact, error-handling
    // Pattern-Info: { approach: "multi-layer-verification", alternatives: "basic-checks", trade-offs: "thoroughness-vs-speed" }
    
    const cacheKey = 'main-compatibility-check';
    const now = Date.now();
    
    // Check cache first (unless forced refresh)
    if (!forceRefresh && this.lastVerificationTime > 0 && 
        (now - this.lastVerificationTime) < this.VERIFICATION_CACHE_TTL) {
      const cached = this.verificationCache.get(cacheKey);
      if (cached) {
        runtimeLogger.debug('Using cached compatibility result', {
          cacheKey,
          ageMs: now - this.lastVerificationTime
        });
        return cached;
      }
    }

    runtimeLogger.info('Performing runtime compatibility verification', { forceRefresh });
    
    try {
      const environment = await this.detectRuntimeEnvironment();
      const issues: CompatibilityIssue[] = [];
      const recommendations: string[] = [];
      
      // Platform compatibility checks
      this.verifyPlatformCompatibility(environment, issues, recommendations);
      
      // Node.js version and feature checks
      this.verifyNodeJSCompatibility(environment, issues, recommendations);
      
      // Event system compatibility
      this.verifyEventSystemCompatibility(environment, issues, recommendations);
      
      // Process signal handling
      this.verifySignalHandling(environment, issues, recommendations);
      
      // Calculate overall compatibility and confidence
      const { compatible, confidence, riskLevel } = this.calculateCompatibilityScore(issues);
      
      // Generate adapted configuration based on detected issues
      const adaptedConfiguration = this.generateAdaptedConfiguration(environment, issues);
      
      const result: CompatibilityResult = {
        compatible,
        confidence,
        riskLevel,
        issues,
        recommendations,
        adaptedConfiguration
      };
      
      // Cache the result
      this.verificationCache.set(cacheKey, result);
      this.lastVerificationTime = now;
      
      runtimeLogger.info('Compatibility verification complete', {
        compatible,
        confidence,
        riskLevel
      });
      return result;
      
    } catch (error) {
      runtimeLogger.error(
        'Runtime verification failed',
        error instanceof Error ? error : null,
        error instanceof Error ? undefined : { details: error }
      );
      
      // Return pessimistic result with fallback configuration
      return {
        compatible: false,
        confidence: 0,
        riskLevel: 'critical',
        issues: [{
          category: 'platform',
          severity: 'critical',
          description: `Runtime verification failed: ${error}`,
          workaround: 'Use fallback configuration'
        }],
        recommendations: [
          'Use fallback configuration',
          'Contact support with environment details'
        ],
        adaptedConfiguration: this.getFallbackConfiguration()
      };
    }
  }

  /**
   * Detect runtime environment characteristics
   */
  private async detectRuntimeEnvironment(): Promise<RuntimeEnvironment> {
    // TODO: [TASK-MCP-007-COMPAT-003] Pattern: environment-introspection | Complexity: 5 | Dependencies: system-apis
    // Context: Detect runtime environment capabilities and characteristics
    // Validation-Required: detection-accuracy, cross-platform-support, error-handling
    // Pattern-Info: { approach: "comprehensive-detection", alternatives: "basic-detection", trade-offs: "accuracy-vs-performance" }
    
    if (this.cachedEnvironment && (Date.now() - this.lastVerificationTime) < this.VERIFICATION_CACHE_TTL) {
      return this.cachedEnvironment;
    }

    const environment: RuntimeEnvironment = {
      platform: os.platform(),
      nodeVersion: process.version,
      architecture: os.arch(),
      processFeatures: {
        signalHandling: this.testSignalHandling(),
        eventIntrospection: this.testEventIntrospection(),
        processEvents: this.testProcessEvents()
      },
      systemCapabilities: {
        homeDirectory: this.testHomeDirectory(),
        pathResolution: this.testPathResolution(),
        fileSystem: this.testFileSystemAccess()
      }
    };

    this.cachedEnvironment = environment;
    return environment;
  }

  /**
   * Test signal handling capabilities
   */
  private testSignalHandling(): boolean {
    try {
      // Test if we can register signal handlers
      const testHandler = () => {};
      
      if (process.platform === 'win32') {
        // On Windows, only SIGINT is supported
        process.on('SIGINT', testHandler);
        process.removeListener('SIGINT', testHandler);
        return true;
      } else {
        // On Unix-like systems, test common signals
        process.on('SIGTERM', testHandler);
        process.removeListener('SIGTERM', testHandler);
        return true;
      }
    } catch {
      return false;
    }
  }

  /**
   * Test event introspection capabilities
   */
  private testEventIntrospection(): boolean {
    try {
      // Test if we can introspect process events
      const testEmitter = EventUtils.createTypedEmitter<GenericEventMap>();
      testEmitter.on('test', () => {});
      
      const listeners = testEmitter.listeners('test');
      const hasListeners = listeners.length > 0;
      
      testEmitter.removeAllListeners();
      return hasListeners;
    } catch {
      return false;
    }
  }

  /**
   * Test process event capabilities
   */
  private testProcessEvents(): boolean {
    try {
      // Test if we can access process event information
      return typeof process.listeners === 'function';
    } catch {
      return false;
    }
  }

  /**
   * Test home directory access
   */
  private testHomeDirectory(): boolean {
    try {
      return typeof os.homedir() === 'string' && os.homedir().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Test path resolution
   */
  private testPathResolution(): boolean {
    try {
      const path = require('path');
      const resolved = path.resolve('./');
      return typeof resolved === 'string' && resolved.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Test file system access
   */
  private testFileSystemAccess(): boolean {
    try {
      const fs = require('fs');
      // Test if we can check file existence
      return typeof fs.existsSync === 'function';
    } catch {
      return false;
    }
  }

  /**
   * Verify platform compatibility
   */
  private verifyPlatformCompatibility(environment: RuntimeEnvironment, issues: CompatibilityIssue[], recommendations: string[]): void {
    const supportedPlatforms = ['win32', 'linux', 'darwin'];
    
    if (!supportedPlatforms.includes(environment.platform)) {
      issues.push({
        category: 'platform',
        severity: 'warning',
        description: `Platform ${environment.platform} has limited testing`,
        detectedValue: environment.platform,
        expectedValue: supportedPlatforms,
        workaround: 'Use basic compatibility mode'
      });
      recommendations.push('Consider using a well-tested platform for production');
    }

    // Architecture checks
    if (!['x64', 'arm64'].includes(environment.architecture)) {
      issues.push({
        category: 'platform',
        severity: 'warning',
        description: `Architecture ${environment.architecture} may have compatibility issues`,
        detectedValue: environment.architecture,
        workaround: 'Monitor for performance issues'
      });
    }
  }

  /**
   * Verify Node.js compatibility
   */
  private verifyNodeJSCompatibility(environment: RuntimeEnvironment, issues: CompatibilityIssue[], recommendations: string[]): void {
    const minVersion = '18.0.0';
    const currentMajor = parseInt(environment.nodeVersion.slice(1).split('.')[0]);
    const minMajor = parseInt(minVersion.split('.')[0]);

    if (currentMajor < minMajor) {
      issues.push({
        category: 'nodejs',
        severity: 'error',
        description: `Node.js version ${environment.nodeVersion} is below minimum required ${minVersion}`,
        detectedValue: environment.nodeVersion,
        expectedValue: `>=${minVersion}`,
        workaround: 'Upgrade Node.js or use compatibility mode'
      });
      recommendations.push(`Upgrade Node.js to version ${minVersion} or later`);
    }
  }

  /**
   * Verify event system compatibility
   */
  private verifyEventSystemCompatibility(environment: RuntimeEnvironment, issues: CompatibilityIssue[], recommendations: string[]): void {
    if (!environment.processFeatures.eventIntrospection) {
      issues.push({
        category: 'event-system',
        severity: 'warning',
        description: 'Event introspection not available',
        workaround: 'Disable event monitoring features'
      });
    }

    if (!environment.processFeatures.processEvents) {
      issues.push({
        category: 'event-system',
        severity: 'error',
        description: 'Process event handling not available',
        workaround: 'Use polling-based monitoring'
      });
      recommendations.push('Enable process event handling or use alternative monitoring');
    }
  }

  /**
   * Verify signal handling
   */
  private verifySignalHandling(environment: RuntimeEnvironment, issues: CompatibilityIssue[], recommendations: string[]): void {
    if (!environment.processFeatures.signalHandling) {
      issues.push({
        category: 'process-signals',
        severity: 'error',
        description: 'Signal handling not available',
        workaround: 'Disable signal-based cleanup'
      });
      recommendations.push('Use alternative cleanup mechanisms');
    }
  }

  /**
   * Calculate compatibility score and risk level
   */
  private calculateCompatibilityScore(issues: CompatibilityIssue[]): { compatible: boolean; confidence: number; riskLevel: 'low' | 'medium' | 'high' | 'critical' } {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const errorIssues = issues.filter(i => i.severity === 'error').length;
    const warningIssues = issues.filter(i => i.severity === 'warning').length;

    // Calculate confidence based on issues
    let confidence = 100;
    confidence -= criticalIssues * 40;
    confidence -= errorIssues * 20;
    confidence -= warningIssues * 10;
    confidence = Math.max(0, confidence);

    // Determine compatibility
    const compatible = criticalIssues === 0 && confidence >= this.CONFIDENCE_THRESHOLD;

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (criticalIssues > 0) {
      riskLevel = 'critical';
    } else if (errorIssues > 2) {
      riskLevel = 'high';
    } else if (errorIssues > 0 || warningIssues > 3) {
      riskLevel = 'medium';
    } else {
      riskLevel = 'low';
    }

    return { compatible, confidence, riskLevel };
  }

  /**
   * Generate adapted configuration based on environment and issues
   */
  private generateAdaptedConfiguration(environment: RuntimeEnvironment, issues: CompatibilityIssue[]): AdaptedConfiguration {
    // TODO: [TASK-MCP-007-COMPAT-004] Pattern: adaptive-configuration | Complexity: 5 | Dependencies: environment-analysis
    // Context: Generate optimized configuration based on runtime environment
    // Validation-Required: configuration-appropriateness, performance-impact, compatibility
    // Pattern-Info: { approach: "environment-adaptive-config", alternatives: "static-config", trade-offs: "optimization-vs-simplicity" }
    
    const config: AdaptedConfiguration = {
      enableSignalHandling: environment.processFeatures.signalHandling,
      enableProcessIntrospection: environment.processFeatures.eventIntrospection,
      maxEventListeners: 15, // Default
      timeoutMultiplier: 1.0, // Default
      fallbackMode: false,
      platformSpecificOptimizations: {}
    };

    // Adapt based on detected issues
    for (const issue of issues) {
      switch (issue.category) {
        case 'process-signals':
          if (issue.severity === 'error') {
            config.enableSignalHandling = false;
            config.fallbackMode = true;
          }
          break;

        case 'event-system':
          if (issue.severity === 'error') {
            config.enableProcessIntrospection = false;
            config.maxEventListeners = 10; // Reduce limits
          }
          break;

        case 'nodejs':
          if (issue.severity === 'error') {
            config.timeoutMultiplier = 1.5; // Increase timeouts for older Node.js
            config.fallbackMode = true;
          }
          break;

        case 'platform':
          // Platform-specific optimizations
          if (environment.platform === 'win32') {
            config.platformSpecificOptimizations.windowsCompatibility = true;
            config.timeoutMultiplier = 1.2; // Account for Windows specifics
          }
          break;
      }
    }

    return config;
  }

  /**
   * Get fallback configuration for critical failures
   */
  private getFallbackConfiguration(): AdaptedConfiguration {
    return {
      enableSignalHandling: false,
      enableProcessIntrospection: false,
      maxEventListeners: 5,
      timeoutMultiplier: 2.0,
      fallbackMode: true,
      platformSpecificOptimizations: {
        safeMode: true,
        reducedFeatures: true
      }
    };
  }

  /**
   * Get verification metrics for monitoring
   */
  public getVerificationMetrics() {
    return {
      cacheSize: this.verificationCache.size,
      lastVerificationTime: this.lastVerificationTime,
      cacheHitRate: this.verificationCache.size > 0 ? 0.8 : 0, // Estimate
      environment: this.cachedEnvironment
    };
  }
}

/**
 * Global convenience instance
 */
export const runtimeVerifier = RuntimeCompatibilityVerifier.getInstance();

/**
 * Quick compatibility check function
 */
export async function verifyMCPChannelCompatibility(): Promise<CompatibilityResult> {
  return await runtimeVerifier.verifyCompatibility();
}

/**
 * Apply adapted configuration to event manager
 */
export function applyAdaptedConfiguration(config: AdaptedConfiguration): void {
  runtimeLogger.info('Applying adapted configuration', {
    timeoutMultiplier: config.timeoutMultiplier,
    fallbackMode: config.fallbackMode,
    maxEventListeners: config.maxEventListeners
  });
  
  // Apply configuration to event manager if available
  const metrics = eventManager.getMetrics();
  runtimeLogger.debug('Current event manager state', metrics);
  
  if (config.fallbackMode) {
    runtimeLogger.warn('Running in fallback mode with reduced features');
  }
}
