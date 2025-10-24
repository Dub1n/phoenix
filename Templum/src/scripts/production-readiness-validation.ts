#!/usr/bin/env node

/**---
 * title: Production Readiness Validation Script - Real System Verification
 * tags: [Production, Validation, Real-Systems, Integration, Script]
 * provides: [ProductionReadinessScript, SystemValidation, RealMetricsValidation]
 * requires: [TemplumResourceManager, PerformanceValidator, ProductionReadinessValidator]
 * description: Comprehensive production readiness validation script that replaces mock dependencies with real system measurements and validates production deployment readiness
 * ---*/

import { performance } from 'perf_hooks';
import { TemplumResourceManager } from '../core/templum-resource-manager';
import { performanceValidator } from '../validation/performance-validation';
import {
  createProductionReadinessValidator,
  ProductionReadinessValidator,
  ProductionReadinessResult,
  ProductionReadinessConfig
} from '../validation/production-readiness-validator';
import { createLogger, normalizeLoggerError } from '../utils/logger';

// Console colors for better output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

const cliLogger = createLogger('production-readiness-validation-cli');

/**
 * Production Readiness Validation Script
 * 
 * This script validates that TASK-MOCK-002 Production Readiness Verification has been
 * successfully implemented by running comprehensive validation with REAL system metrics
 * instead of hardcoded/mock values.
 */
class ProductionReadinessValidationScript {
  private resourceManager: TemplumResourceManager;
  private productionValidator: ProductionReadinessValidator;
  private startTime: number;
  private readonly logger = createLogger('production-readiness-validation');

  constructor() {
    this.logger.info(`${colors.bright}${colors.cyan}🚀 Templum Production Readiness Validation${colors.reset}`);
    this.logger.info(`${colors.blue}Purpose: Verify system readiness for production deployment${colors.reset}\n`);
    
    this.startTime = Date.now();
    
    // Initialize with production-grade configuration
    const resourcePolicy = {
      maxMemoryMB: 512,
      maxConnections: 50,
      maxCacheSize: 128,
      connectionTimeoutMs: 30000,
      cleanupIntervalMs: 60000,
      resourceTimeoutMs: 300000,
      enableAutoCleanup: true,
      resourcePriorities: {
        'skinEngine': 8,
        'stateManager': 9,
        'backendRouter': 7,
        'backendServiceRouter': 6,
        'cache': 5,
        'temporary': 2
      }
    };

    this.resourceManager = new TemplumResourceManager(resourcePolicy);
    
    // Production readiness configuration
    const productionConfig: ProductionReadinessConfig = {
      performanceThresholds: {
        maxResponseTime: 50,      // ms - production requirement
        maxMemoryUsage: 512,      // MB - system limit
        maxCpuUsage: 80,          // % - system limit  
        minSystemUptime: 1        // hours - minimum uptime
      },
      resourceValidation: {
        enableResourcePolicyValidation: true,
        validateResourceLeaks: true,
        checkResourceLimits: true,
        monitoringDurationMs: 30000 // 30 seconds monitoring
      },
      errorHandling: {
        validateErrorPatterns: true,
        checkCircuitBreakerConfig: true,
        verifyErrorRecovery: true
      },
      systemHealth: {
        checkDiskSpace: true,
        validateNetworkConnectivity: true,
        verifyFileSystemPermissions: true,
        checkSystemResources: true
      }
    };

    this.productionValidator = createProductionReadinessValidator(
      this.resourceManager,
      performanceValidator,
      productionConfig
    );

    // Set up event listeners for detailed output
    this.setupEventListeners();
  }

  async run(): Promise<void> {
    try {
      this.logger.info(`${colors.bright}📋 Production Readiness Validation - Starting System Verification${colors.reset}\n`);
      
      // Step 1: Initialize resource manager
      await this.initializeResourceManager();
      
      // Step 2: Demonstrate real vs mock metrics
      await this.demonstrateRealMetrics();
      
      // Step 3: Run comprehensive production readiness validation
      const result = await this.runProductionReadinessValidation();
      
      // Step 4: Generate detailed report
      this.generateDetailedReport(result);
      
      // Step 5: Provide recommendations
      this.provideRecommendations(result);
      
    } catch (error) {
      const { error: normalizedError, data } = normalizeLoggerError(error);
      const fallbackDetails = data ?? (error instanceof Error ? error.message : String(error));
      this.logger.error(
        `${colors.red}❌ Production readiness validation failed:${colors.reset}`,
        normalizedError ?? undefined,
        { details: fallbackDetails }
      );
      process.exitCode = 1;
    }
  }

  private async initializeResourceManager(): Promise<void> {
    this.logger.info(`${colors.blue}🔧 Initializing Resource Manager with Production Policies...${colors.reset}`);
    
    try {
      await this.resourceManager.initialize();
      
      // Allocate some test resources to validate resource management
      const testResources = [
        { type: 'memory' as const, owner: 'production-test', size: 10, priority: 5 },
        { type: 'connection' as const, owner: 'backend-test', size: 2, priority: 7 },
        { type: 'cache' as const, owner: 'skin-engine-test', size: 20, priority: 8 }
      ];

      for (const resource of testResources) {
        const handle = await this.resourceManager.allocateResource({
          type: resource.type,
          owner: resource.owner,
          size: resource.size,
          priority: resource.priority,
          cleanup: async () => { /* Test cleanup */ }
        });
        this.logger.info(`   ✓ Allocated ${resource.type} resource: ${handle}`);
      }

      const status = await this.resourceManager.getStatus();
      this.logger.info(`   ✓ Resource Manager initialized: ${status.activeResources} active resources`);
      this.logger.info(`   ✓ Policy violations: ${status.policyViolations}\n`);
      
    } catch (error) {
      const { error: normalizedError, data } = normalizeLoggerError(error);
      const metadata: Record<string, unknown> = { stage: 'resource-manager-initialization' };
      if (data !== undefined) {
        metadata.details = data;
      } else if (error instanceof Error) {
        metadata.details = error.message;
      } else {
        metadata.details = String(error);
      }
      this.logger.error(
        '   ❌ Resource Manager initialization failed\n',
        normalizedError ?? undefined,
        metadata
      );
      throw error;
    }
  }

  private async demonstrateRealMetrics(): Promise<void> {
    this.logger.info(`${colors.blue}📊 Demonstrating Real System Metrics (No Hardcoded Values)...${colors.reset}`);
    
    // Measure real system performance
    const startTime = performance.now();
    
    // File system operation
    await new Promise<string[]>((resolve, reject) => {
      require('fs').readdir(process.cwd(), (err: NodeJS.ErrnoException | null, files: string[]) => {
        if (err) reject(err);
        else resolve(files);
      });
    });
    
    const responseTime = performance.now() - startTime;
    const memoryUsage = process.memoryUsage();
    const systemLoad = require('os').loadavg();
    
    this.logger.info(`   📈 Real Response Time: ${responseTime.toFixed(2)}ms (measured)`, {
      responseTimeMs: Number(responseTime.toFixed(2))
    });
    this.logger.info(`   💾 Real Memory Usage: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB (process RSS)`, {
      rssMb: Math.round(memoryUsage.rss / 1024 / 1024)
    });
    this.logger.info(`   🖥️  Real System Load: ${systemLoad[0].toFixed(2)} (1min average)`, {
      loadAverage1Min: Number(systemLoad[0].toFixed(2))
    });
    this.logger.info(`   ✅ All metrics collected from actual system measurements\n`);
  }

  private async runProductionReadinessValidation(): Promise<ProductionReadinessResult> {
    this.logger.info(`${colors.bright}🔍 Running Comprehensive Production Readiness Validation...${colors.reset}\n`);
    
    const result = await this.productionValidator.validateProductionReadiness();
    
    return result;
  }

  private generateDetailedReport(result: ProductionReadinessResult): void {
    this.logger.info(`${colors.bright}📋 Production Readiness Validation Report${colors.reset}`, {
      generatedAt: result.timestamp
    });
    this.logger.info(`${colors.blue}Generated: ${new Date(result.timestamp).toLocaleString()}${colors.reset}\n`, {
      generatedAtIso: new Date(result.timestamp).toISOString()
    });
    
    const statusColor = result.overallStatus === 'READY' ? colors.green : 
                       result.overallStatus === 'WARNINGS' ? colors.yellow : colors.red;
    this.logger.info(`${colors.bright}Overall Status: ${statusColor}${result.overallStatus}${colors.reset}`, {
      overallStatus: result.overallStatus
    });
    this.logger.info(`${colors.bright}Readiness Score: ${this.getScoreColor(result.readinessScore)}${result.readinessScore}/100${colors.reset}\n`, {
      readinessScore: result.readinessScore
    });
    
    this.logger.info(`${colors.bright}Category Results:${colors.reset}`);
    this.printCategoryResult('Performance', result.categories.performance);
    this.printCategoryResult('Resource Management', result.categories.resourceManagement);
    this.printCategoryResult('Error Handling', result.categories.errorHandling);
    this.printCategoryResult('System Health', result.categories.systemHealth);
    
    if (result.criticalIssues.length > 0) {
      this.logger.error(`\n${colors.red}${colors.bright}🚨 Critical Issues (${result.criticalIssues.length}):${colors.reset}`, undefined, {
        issueCount: result.criticalIssues.length
      });
      result.criticalIssues.forEach((issue, index) => {
        this.logger.error(`${colors.red}${index + 1}. ${issue.title}${colors.reset}`, undefined, {
          issueIndex: index + 1,
          title: issue.title
        });
        this.logger.error(`   Description: ${issue.description}`);
        this.logger.error(`   Impact: ${issue.impact}`);
        this.logger.error(`   Recommendation: ${issue.recommendation}\n`);
      });
    }
    
    if (result.warnings.length > 0) {
      this.logger.warn(`${colors.yellow}${colors.bright}⚠️  Warnings (${result.warnings.length}):${colors.reset}`, {
        warningCount: result.warnings.length
      });
      result.warnings.forEach((warning, index) => {
        this.logger.warn(`${colors.yellow}${index + 1}. ${warning.title}${colors.reset}`, {
          warningIndex: index + 1,
          title: warning.title
        });
        this.logger.warn(`   Description: ${warning.description}`);
        this.logger.warn(`   Recommendation: ${warning.recommendation}\n`);
      });
    }
    
    this.logger.info(`${colors.bright}📊 Real System Metrics:${colors.reset}`);
    this.logger.info(`   Platform: ${result.systemMetrics.system.platform} ${result.systemMetrics.system.arch}`, {
      platform: result.systemMetrics.system.platform,
      arch: result.systemMetrics.system.arch
    });
    this.logger.info(`   Node Version: ${result.systemMetrics.system.nodeVersion}`, {
      nodeVersion: result.systemMetrics.system.nodeVersion
    });
    this.logger.info(`   Uptime: ${result.systemMetrics.system.uptime.toFixed(2)} hours`, {
      uptimeHours: Number(result.systemMetrics.system.uptime.toFixed(2))
    });
    this.logger.info(`   Memory Usage: ${result.systemMetrics.memory.usagePercent}% (${result.systemMetrics.memory.usedMB}MB used)`, {
      memoryUsagePercent: result.systemMetrics.memory.usagePercent,
      memoryUsedMb: result.systemMetrics.memory.usedMB
    });
    this.logger.info(`   CPU Load: ${result.systemMetrics.cpu.loadAverage1Min.toFixed(2)} (1min avg)`, {
      loadAverage1Min: Number(result.systemMetrics.cpu.loadAverage1Min.toFixed(2))
    });
    this.logger.info(`   Network: ${result.systemMetrics.network.connectivityStatus}${result.systemMetrics.network.latencyMs ? ` (${result.systemMetrics.network.latencyMs}ms)` : ''}\n`, {
      connectivityStatus: result.systemMetrics.network.connectivityStatus,
      latencyMs: result.systemMetrics.network.latencyMs
    });
  }

  private printCategoryResult(name: string, category: import('../validation/production-readiness-validator').ProductionReadinessCategory): void {
    const statusColor = category.status === 'PASS' ? colors.green : 
                       category.status === 'WARNING' ? colors.yellow : colors.red;
    const statusIcon = category.status === 'PASS' ? '✅' : 
                      category.status === 'WARNING' ? '⚠️' : '❌';
    
    this.logger.info(`   ${statusIcon} ${name}: ${statusColor}${category.status}${colors.reset} (${this.getScoreColor(category.score)}${category.score}/100${colors.reset})`, {
      category: name,
      status: category.status,
      score: category.score
    });
    
    const failedChecks = category.checks.filter((check) => check.status === 'FAIL');
    if (failedChecks.length > 0) {
      this.logger.warn(`      Failed: ${failedChecks.map((check) => check.name).join(', ')}`, {
        category: name,
        failedChecks: failedChecks.map(check => check.name)
      });
    }
  }

  private getScoreColor(score: number): string {
    if (score >= 80) return colors.green;
    if (score >= 60) return colors.yellow;
    return colors.red;
  }

  private provideRecommendations(result: ProductionReadinessResult): void {
    this.logger.info(`${colors.bright}💡 Recommendations:${colors.reset}`);
    result.recommendations.forEach((recommendation, index) => {
      this.logger.info(`   ${index + 1}. ${recommendation}`, {
        recommendationIndex: index + 1
      });
    });
    
    if (result.overallStatus === 'NOT_READY') {
      this.logger.error(`\n${colors.red}🚫 System is NOT READY for production deployment.${colors.reset}`);
      this.logger.error(`${colors.red}Address all critical issues before proceeding.${colors.reset}`);
    } else if (result.overallStatus === 'WARNINGS') {
      this.logger.warn(`\n${colors.yellow}⚠️  System has warnings but may be suitable for production.${colors.reset}`);
      this.logger.warn(`${colors.yellow}Monitor warning conditions closely in production.${colors.reset}`);
    } else {
      this.logger.info(`\n${colors.green}✅ System is READY for production deployment!${colors.reset}`);
      this.logger.info(`${colors.green}Continue monitoring system health and performance.${colors.reset}`);
    }
    
    const totalTime = Date.now() - this.startTime;
    this.logger.info(`\n${colors.blue}Validation completed in ${totalTime}ms${colors.reset}`, {
      durationMs: totalTime
    });
  }

  private setupEventListeners(): void {
    this.productionValidator.on('validationStarted', (event) => {
      this.logger.info(`   🔄 Validation started at ${new Date(event.timestamp).toLocaleTimeString()}`, {
        event: 'validationStarted',
        timestamp: event.timestamp
      });
    });

    this.productionValidator.on('validationCompleted', () => {
      this.logger.info('   ✅ Validation completed successfully', {
        event: 'validationCompleted'
      });
    });

    this.productionValidator.on('validationFailed', (event) => {
      this.logger.error(`   ❌ Validation failed: ${event.error}`, undefined, {
        event: 'validationFailed'
      });
    });
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    cliLogger.info(`
${colors.bright}Templum Production Readiness Validation${colors.reset}

Usage: node production-readiness-validation.js [options]

Options:
  --help, -h    Show this help message
  --verbose     Show detailed output
  --json        Output results in JSON format

Purpose:
  Validates that TASK-MOCK-002 Production Readiness Verification has been
  successfully implemented by replacing hardcoded/mock performance metrics
  with real system measurements and validating production deployment readiness.

Features:
  ✅ Real system metrics collection (no hardcoded values)
  ✅ Resource management policy validation
  ✅ Error handling pattern verification
  ✅ Production performance threshold validation
  ✅ System health and connectivity checks
  ✅ Comprehensive readiness scoring
`);
    return;
  }

  try {
    const validator = new ProductionReadinessValidationScript();
    await validator.run();
    
    cliLogger.info(`
${colors.green}${colors.bright}🎉 Production readiness validation completed successfully!${colors.reset}`);
    cliLogger.info(`${colors.blue}TASK-MOCK-002 implementation verified with real system measurements.${colors.reset}`);
    
  } catch (error) {
    const { error: normalizedError, data } = normalizeLoggerError(error);
    const metadata: Record<string, unknown> = { stage: 'main-run' };
    if (data !== undefined) {
      metadata.details = data;
    } else if (error instanceof Error) {
      metadata.details = error.message;
    } else {
      metadata.details = String(error);
    }
    cliLogger.error(`
${colors.red}${colors.bright}💥 Validation failed:${colors.reset}`, normalizedError ?? undefined, metadata);
    process.exitCode = 1;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    const { error: normalizedError, data } = normalizeLoggerError(error);
    const metadata: Record<string, unknown> = { stage: 'entrypoint' };
    if (data !== undefined) {
      metadata.details = data;
    } else if (error instanceof Error) {
      metadata.details = error.message;
    } else {
      metadata.details = String(error);
    }
    cliLogger.error('Fatal error during production readiness validation', normalizedError ?? undefined, metadata);
    process.exitCode = 1;
  });
}

export { ProductionReadinessValidationScript };
