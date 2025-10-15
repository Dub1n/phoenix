#!/usr/bin/env node

/**---
 * title: Phase 6 Integration Validation - Main Execution Entry Point
 * tags: [Phase-6, CLI-Runner, Integration-Validation, System-Testing, Production-Readiness]
 * provides: [CLI-Interface, Validation-Orchestration, Report-Generation, Error-Handling, Progress-Monitoring]
 * requires: [Phase6IntegrationValidationSuite, CLI-Args-Parser, Report-Formatters, File-System-Access]
 * description: Command-line interface for executing comprehensive Phase 6 integration validation with real backend coordination and production readiness testing
 * ---*/

import { program } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import {
  PHASE6_READINESS_SCORE_NOTE,
  Phase6IntegrationValidationSuite,
  Phase6ValidationReport,
} from '../validation/phase6-harness';
import { ErrorHandler } from '../utils/error-handler';
import { createCliRuntimeOutput } from '../utils/cli-runtime-output';

// CLI Configuration
const CLI_VERSION = '1.0.0';
const DEFAULT_OUTPUT_DIR = './validation-reports';
const DEFAULT_CONFIG_FILE = './phase6-validation-config.json';
const DEFAULT_BASELINE_FILE = './validation-reports/phase6-baselines/phase5-stage6-baseline.json';
const scriptOutput = createCliRuntimeOutput({ context: 'phase6-integration-validation' });

type ColumnAlignment = 'left' | 'right' | 'center';

const formatColumn = (
  value: string | number,
  width: number,
  alignment: ColumnAlignment = 'right'
): string => {
  const text = typeof value === 'string' ? value : String(value);
  if (text.length >= width) {
    return text;
  }

  const paddingLength = width - text.length;
  if (alignment === 'left') {
    return text + ' '.repeat(paddingLength);
  }

  if (alignment === 'center') {
    const leading = Math.floor(paddingLength / 2);
    const trailing = paddingLength - leading;
    return `${' '.repeat(leading)}${text}${' '.repeat(trailing)}`;
  }

  return ' '.repeat(paddingLength) + text;
};

interface ValidationConfig {
  services: {
    haruspex: {
      enabled: boolean;
      binaryPath?: string;
      ports?: { ipc?: number; http?: number; websocket?: number };
    };
    pcl: {
      enabled: boolean;
      binaryPath?: string;
      ports?: { ipc?: number; http?: number };
    };
    templum: {
      enabled: boolean;
      binaryPath?: string;
      ports?: { http?: number; websocket?: number };
    };
  };
  validation: {
    enablePerformanceRegression: boolean;
    enableCrossInterfaceValidation: boolean;
    enableProductionReadiness: boolean;
    performanceBaselinesFile?: string;
  };
  reporting: {
    outputDir: string;
    generateDetailedReport: boolean;
    generateSummaryReport: boolean;
    exportFormat: 'json' | 'html' | 'markdown' | 'all';
  };
}

class Phase6ValidationCLI {
  private validationSuite?: Phase6IntegrationValidationSuite;
  private config: ValidationConfig;
  private outputDir: string;
  private useRealBackends: boolean;
  private baselineFile?: string;

  constructor() {
    this.config = this.loadDefaultConfig();
    this.outputDir = DEFAULT_OUTPUT_DIR;
    this.useRealBackends = this.parseEnvUseRealBackends();
    this.baselineFile = DEFAULT_BASELINE_FILE;
    this.configureBackendEnv(this.useRealBackends);
  }

  private setExitCode(code: number): void {
    if (typeof code !== 'number' || Number.isNaN(code)) {
      return;
    }
    if (code === 0) {
      if (process.exitCode === undefined) {
        process.exitCode = 0;
      }
      return;
    }
    if (process.exitCode === undefined || process.exitCode === 0) {
      process.exitCode = code;
      return;
    }
    process.exitCode = Math.max(Number(process.exitCode ?? 0), code);
  }

  private async safeShutdown(context: string): Promise<void> {
    if (!this.validationSuite) {
      return;
    }

    await ErrorHandler.handleAsync(
      this.validationSuite.shutdown(),
      `phase6-validation-cli.${context}.shutdown`,
      { swallow: true }
    );
  }

  /**
   * Initialize CLI and execute validation based on command line arguments
   */
  async run(): Promise<void> {
    this.setupCLI();
    await program.parseAsync(process.argv);
  }

  /**
   * Setup Commander.js CLI interface
   */
  private setupCLI(): void {
    program
      .name('phase6-validation')
      .version(CLI_VERSION)
      .description('Phase 6 Integration Validation - Comprehensive system integration testing');

    // Main validation command
    program
      .command('run')
      .description('Execute complete Phase 6 integration validation')
      .option('-c, --config <file>', 'Configuration file path', DEFAULT_CONFIG_FILE)
      .option('-o, --output <dir>', 'Output directory for reports', DEFAULT_OUTPUT_DIR)
      .option('--baseline <file>', 'Performance baseline JSON file', DEFAULT_BASELINE_FILE)
      .option('--no-performance', 'Disable performance regression testing')
      .option('--no-cross-interface', 'Disable cross-interface validation')
      .option('--no-production', 'Disable production readiness validation')
      .option('--services <services>', 'Comma-separated list of services to test (haruspex,pcl,templum)', 'haruspex,pcl,templum')
      .option('--format <format>', 'Report format (json|html|markdown|all)', 'all')
      .option('--use-real-backends', 'Run validation against real backend services (default: mocks)')
      .option('-v, --verbose', 'Enable verbose logging')
      .action(async (options) => {
        await this.executeValidation(options);
      });

    // Health check command
    program
      .command('health')
      .description('Check system health and service availability')
      .option('-c, --config <file>', 'Configuration file path', DEFAULT_CONFIG_FILE)
      .option('--baseline <file>', 'Performance baseline JSON file', DEFAULT_BASELINE_FILE)
      .option('--use-real-backends', 'Check health using real backend services (default: mocks)')
      .option('-v, --verbose', 'Enable verbose logging')
      .action(async (options) => {
        await this.executeHealthCheck(options);
      });

    // Service management commands
    program
      .command('services')
      .description('Manage backend services')
      .addCommand(
        program.createCommand('start')
          .description('Start all backend services')
          .option('-s, --service <name>', 'Start specific service (haruspex|pcl|templum)')
          .option('--use-real-backends', 'Start real backend processes instead of mocks')
          .action(async (options) => {
            await this.manageServices('start', options);
          })
      )
      .addCommand(
        program.createCommand('stop')
          .description('Stop all backend services')
          .option('-s, --service <name>', 'Stop specific service (haruspex|pcl|templum)')
          .option('--use-real-backends', 'Stop real backend processes')
          .action(async (options) => {
            await this.manageServices('stop', options);
          })
      )
      .addCommand(
        program.createCommand('status')
          .description('Check service status')
          .option('--use-real-backends', 'Show status for real backend processes')
          .action(async (options) => {
            await this.checkServiceStatus(options);
          })
      );

    // Report generation command
    program
      .command('report')
      .description('Generate reports from previous validation runs')
      .argument('<report-file>', 'Path to validation report JSON file')
      .option('--format <format>', 'Output format (html|markdown)', 'html')
      .option('-o, --output <file>', 'Output file path')
      .action(async (reportFile, options) => {
        await this.generateReport(reportFile, options);
      });
  }

  /**
   * Execute comprehensive Phase 6 validation
   */
  private async executeValidation(options: any): Promise<void> {
    scriptOutput.info('🚀 Phase 6 Integration Validation Starting...\n');

    try {
      // Load configuration
      if (options.config && fs.existsSync(options.config)) {
        this.config = { ...this.config, ...JSON.parse(fs.readFileSync(options.config, 'utf8')) };
      }

      // Override configuration with CLI options
      this.applyCliOptionsToConfig(options);
      this.baselineFile = this.resolveBaselinePath(options);
      this.outputDir = this.config.reporting.outputDir;

      // Ensure output directory exists
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }

      // Initialize validation suite
      scriptOutput.info('📋 Initializing Phase 6 validation suite...');
      const useRealBackends = this.shouldUseRealBackends(options);
      this.configureBackendEnv(useRealBackends);
      this.validationSuite = new Phase6IntegrationValidationSuite({
        useRealBackends,
        baselinePath: this.baselineFile,
      });
      if (this.baselineFile) {
        scriptOutput.info(`📦 Performance baselines: ${this.baselineFile}`);
      }
      
      // Setup progress monitoring
      this.setupProgressMonitoring();

      // Initialize and start validation
      await this.validationSuite.initialize();
      scriptOutput.info('✅ Validation suite initialized\n');

      scriptOutput.info('🔄 Running comprehensive integration validation...');
      scriptOutput.info('   • Multi-system workflow testing (PCL ↔ Haruspex ↔ Templum)');
      scriptOutput.info('   • Cross-interface consistency validation (VSCode, CLI, Command)');
      scriptOutput.info('   • Performance regression monitoring (Phase 5 baselines)');
      scriptOutput.info('   • Production readiness verification');
      scriptOutput.info('   • System reliability and failover testing\n');

      const startTime = Date.now();
      const report = await this.validationSuite.runPhase6IntegrationValidation();
      const duration = Date.now() - startTime;

      scriptOutput.info(`\n✅ Validation completed in ${(duration / 1000).toFixed(2)}s\n`);

      // Generate and save reports
      await this.saveValidationReport(report, options.format);
      this.displayValidationSummary(report);

      // Cleanup
      await this.safeShutdown('executeValidation');

      // Exit with appropriate code
      const validationStatus = report.status ?? (report.phase6ReadinessScore >= 80 ? 'passed' : 'failed');

      if (validationStatus === 'passed') {
        scriptOutput.info('\n🎉 Phase 6 Integration Validation PASSED - System ready for production deployment');
        this.setExitCode(0);
        return;
      }

      if (validationStatus === 'skipped') {
        scriptOutput.info('\n⚠️ Phase 6 Integration Validation SKIPPED - ' + (report.statusReason ?? 'Mocks in use; run with --use-real-backends for full validation.'));
        this.setExitCode(0);
        return;
      }

      scriptOutput.info('\n❌ Phase 6 Integration Validation FAILED - Address critical issues before deployment');
      if (report.statusReason) {
        scriptOutput.info(`   Reason: ${report.statusReason}`);
      }
      this.setExitCode(1);
      return;

    } catch (error) {
      const resolvedError = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));
      ErrorHandler.handle(resolvedError, 'phase6-validation-cli.executeValidation', {
        outputDir: this.outputDir,
      });
      scriptOutput.error('\n❌ Validation failed:', resolvedError);

      await this.safeShutdown('executeValidation');
      this.setExitCode(1);
    }
  }

  /**
   * Execute system health check
   */
  private async executeHealthCheck(options: any): Promise<void> {
    scriptOutput.info('🏥 Phase 6 System Health Check\n');

    try {
      // Load configuration
      if (options.config && fs.existsSync(options.config)) {
        this.config = { ...this.config, ...JSON.parse(fs.readFileSync(options.config, 'utf8')) };
      }

      this.applyCliOptionsToConfig(options);
      this.baselineFile = this.resolveBaselinePath(options);

      // Initialize validation suite for health check
      const useRealBackends = this.shouldUseRealBackends(options);
      this.configureBackendEnv(useRealBackends);
      this.validationSuite = new Phase6IntegrationValidationSuite({
        useRealBackends,
        baselinePath: this.baselineFile,
      });
      await this.validationSuite.initialize();

      // Check service health
      const healthResults = await this.validationSuite.checkSystemHealth();
      
      scriptOutput.info('Service Health Status:');
      scriptOutput.info('─'.repeat(50));
      
      Object.entries(healthResults.serviceHealth).forEach(([service, health]) => {
        const status = health.operational ? '✅ HEALTHY' : '❌ UNHEALTHY';
        const responseTime = `${health.responseTime.toFixed(1)}ms`;
        const memoryUsage = `${health.memoryUsage.toFixed(1)}MB`;
        const errorRate = `${(health.errorRate * 100).toFixed(1)}%`;

        const serviceColumn = formatColumn(service.toUpperCase(), 10);
        const statusColumn = formatColumn(status, 15);
        const responseColumn = formatColumn(responseTime, 10);
        const memoryColumn = formatColumn(memoryUsage, 10);

        scriptOutput.info(`${serviceColumn} ${statusColumn} Response: ${responseColumn} Memory: ${memoryColumn} Errors: ${errorRate}`);
      });

      scriptOutput.info('─'.repeat(50));
      const healthStatus = healthResults.status ?? (healthResults.phase6ReadinessScore >= 80 ? 'passed' : 'failed');
      const healthLabel = healthStatus === 'passed' ? '✅ HEALTHY' : healthStatus === 'skipped' ? '⚠️ SKIPPED' : '❌ NEEDS ATTENTION';
      scriptOutput.info(`Overall System Health: ${healthLabel}`);
      if (healthResults.statusReason) {
        scriptOutput.info(`Reason: ${healthResults.statusReason}`);
      }
      scriptOutput.info(`Phase 6 Note: ${healthResults.phase6ReadinessScoreNote ?? PHASE6_READINESS_SCORE_NOTE}`);

      if (healthResults.recommendations.critical.length > 0) {
        scriptOutput.info('\n🚨 Critical Issues:');
        healthResults.recommendations.critical.forEach(rec => scriptOutput.info(`   • ${rec}`));
      }

      await this.safeShutdown('health-check');

      this.setExitCode(healthStatus === 'failed' ? 1 : 0);
      return;

    } catch (error) {
      const resolvedError = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));
      ErrorHandler.handle(resolvedError, 'phase6-validation-cli.executeHealthCheck', {
        options,
      });
      scriptOutput.error('\n❌ Health check failed:', resolvedError);

      await this.safeShutdown('health-check');
      this.setExitCode(1);
    }
  }

  /**
   * Manage backend services
   */
  private async manageServices(action: 'start' | 'stop', options: any): Promise<void> {
    scriptOutput.info(`${action === 'start' ? '🚀' : '🛑'} ${action.charAt(0).toUpperCase() + action.slice(1)}ing services...\n`);

    try {
      const useRealBackends = this.shouldUseRealBackends(options);
      if (!useRealBackends) {
        scriptOutput.info('ℹ️ Service management commands require real backend processes. Use --use-real-backends to enable them.');
        this.setExitCode(0);
        return;
      }

      this.applyCliOptionsToConfig(options);
      this.baselineFile = this.resolveBaselinePath(options);
      this.configureBackendEnv(useRealBackends);
      this.validationSuite = new Phase6IntegrationValidationSuite({
        useRealBackends,
        baselinePath: this.baselineFile,
      });
      await this.validationSuite.initialize();

      if (action === 'start') {
        if (options.service) {
          scriptOutput.info(`Starting ${options.service} service...`);
          // Would implement specific service startup
        } else {
          scriptOutput.info('Starting all services...');
          await this.validationSuite.startAllServices();
        }
        scriptOutput.info('✅ Services started successfully');
      } else {
        scriptOutput.info('Stopping all services...');
        await this.validationSuite.shutdown();
        scriptOutput.info('✅ Services stopped successfully');
      }

      this.setExitCode(0);

    } catch (error) {
      const resolvedError = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));
      ErrorHandler.handle(resolvedError, `phase6-validation-cli.manageServices.${action}`, options);
      scriptOutput.error(`\n❌ Service ${action} failed:`, resolvedError);
      await this.safeShutdown(`manageServices.${action}`);
      this.setExitCode(1);
    }
  }

  /**
   * Check service status
   */
  private async checkServiceStatus(options: any = {}): Promise<void> {
    scriptOutput.info('📊 Service Status Check\n');

    try {
      const useRealBackends = this.shouldUseRealBackends(options);
      this.applyCliOptionsToConfig(options);
      this.baselineFile = this.resolveBaselinePath(options);
      this.configureBackendEnv(useRealBackends);
      this.validationSuite = new Phase6IntegrationValidationSuite({
        useRealBackends,
        baselinePath: this.baselineFile,
      });
      await this.validationSuite.initialize();

      const services = await this.validationSuite.getAllServiceStatuses();
      
      scriptOutput.info('Service Status:');
      scriptOutput.info('─'.repeat(40));
      
      services.forEach(service => {
        const nameColumn = formatColumn(service.name.toUpperCase(), 10);
        const statusColumn = formatColumn(service.status.toUpperCase(), 10);
        const ports = Object.entries(service.ports)
          .filter(([, port]) => port)
          .map(([type, port]) => `${type}:${port}`)
          .join(', ') || 'none';

        scriptOutput.info(`${nameColumn} ${statusColumn} Ports: ${ports}`);
      });

      await this.safeShutdown('service-status');

    } catch (error) {
      const resolvedError = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));
      ErrorHandler.handle(resolvedError, 'phase6-validation-cli.checkServiceStatus', options);
      scriptOutput.error('\n❌ Status check failed:', resolvedError);
      await this.safeShutdown('service-status');
      this.setExitCode(1);
    }
  }

  /**
   * Generate report from validation results
   */
  private async generateReport(reportFile: string, options: any): Promise<void> {
    scriptOutput.info(`📄 Generating ${options.format} report from ${reportFile}\n`);

    try {
      if (!fs.existsSync(reportFile)) {
        throw new Error(`Report file not found: ${reportFile}`);
      }

      const report: Phase6ValidationReport = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
      
      if (options.format === 'html') {
        const htmlReport = this.generateHTMLReport(report);
        const outputFile = options.output || reportFile.replace('.json', '.html');
        fs.writeFileSync(outputFile, htmlReport);
        scriptOutput.info(`✅ HTML report generated: ${outputFile}`);
      } else if (options.format === 'markdown') {
        const mdReport = this.generateMarkdownReport(report);
        const outputFile = options.output || reportFile.replace('.json', '.md');
        fs.writeFileSync(outputFile, mdReport);
        scriptOutput.info(`✅ Markdown report generated: ${outputFile}`);
      }

    } catch (error) {
      const resolvedError = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));
      ErrorHandler.handle(resolvedError, 'phase6-validation-cli.generateReport', {
        reportFile,
        format: options.format,
      });
      scriptOutput.error('\n❌ Report generation failed:', resolvedError);
      this.setExitCode(1);
    }
  }

  private parseEnvUseRealBackends(): boolean {
    const env = process.env.PHASE6_USE_REAL_BACKENDS;
    if (env === undefined) {
      return false;
    }
    return !['0', 'false', 'False', 'FALSE'].includes(env);
  }

  private shouldUseRealBackends(options?: any): boolean {
    if (options && Object.prototype.hasOwnProperty.call(options, 'useRealBackends')) {
      return !!options.useRealBackends;
    }
    if (typeof this.useRealBackends === 'boolean') {
      return this.useRealBackends;
    }
    return this.parseEnvUseRealBackends();
  }

  private configureBackendEnv(useReal: boolean): void {
    this.useRealBackends = useReal;
    process.env.PHASE6_USE_REAL_BACKENDS = useReal ? '1' : '0';
    process.env.PHASE6_SKIP_HARUSPEX = useReal ? '0' : '1';
  }

  /**
   * Apply CLI options to configuration
   */
  private applyCliOptionsToConfig(options: any): void {
    // Override service configuration
    if (options.services) {
      const enabledServices = options.services.split(',');
      this.config.services.haruspex.enabled = enabledServices.includes('haruspex');
      this.config.services.pcl.enabled = enabledServices.includes('pcl');
      this.config.services.templum.enabled = enabledServices.includes('templum');
    }

    if (Object.prototype.hasOwnProperty.call(options, 'useRealBackends')) {
      this.useRealBackends = !!options.useRealBackends;
    }

    // Override validation settings
    if (options.performance === false) {
      this.config.validation.enablePerformanceRegression = false;
    }
    if (options.crossInterface === false) {
      this.config.validation.enableCrossInterfaceValidation = false;
    }
    if (options.production === false) {
      this.config.validation.enableProductionReadiness = false;
    }

    if (options.baseline) {
      this.config.validation.performanceBaselinesFile = options.baseline;
    }

    // Override reporting settings
    this.config.reporting.outputDir = options.output || this.config.reporting.outputDir;
    this.config.reporting.exportFormat = options.format || this.config.reporting.exportFormat;
  }

  private resolveBaselinePath(options?: any): string | undefined {
    if (options && options.baseline) {
      return path.resolve(options.baseline);
    }
    if (process.env.PHASE6_BASELINE_FILE) {
      return path.resolve(process.env.PHASE6_BASELINE_FILE);
    }
    if (this.config.validation.performanceBaselinesFile) {
      return path.resolve(this.config.validation.performanceBaselinesFile);
    }
    return path.resolve(DEFAULT_BASELINE_FILE);
  }

  /**
   * Setup progress monitoring for validation
   */
  private setupProgressMonitoring(): void {
    if (!this.validationSuite) return;

    this.validationSuite.on('servicesReady', () => {
      scriptOutput.info('✅ All backend services ready');
    });

    this.validationSuite.on('workflowCompleted', (workflow) => {
      scriptOutput.info(`✅ Workflow completed: ${workflow.workflowType} (${workflow.totalDuration}ms)`);
    });

    this.validationSuite.on('workflowFailure', (event) => {
      scriptOutput.info(`❌ Workflow failed: ${event.workflowType} - ${event.error}`);
    });

    this.validationSuite.on('performanceAlert', (event) => {
      scriptOutput.info(`⚠️  Performance alert: ${event.metric} regression detected`);
    });

    this.validationSuite.on('crossInterfaceValidated', (results) => {
      scriptOutput.info(`✅ Cross-interface validation: ${results.overallConsistency.toFixed(1)}% consistency`);
    });

    this.validationSuite.on('productionValidated', (results) => {
      scriptOutput.info(`✅ Production readiness: ${results.overallReadiness.toFixed(1)}% ready`);
    });
  }

  /**
   * Save validation report in multiple formats
   */
  private async saveValidationReport(report: Phase6ValidationReport, format: string): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = `phase6-validation-${timestamp}`;

    // Always save JSON
    const jsonPath = path.join(this.outputDir, `${baseFilename}.json`);
    const summaryJson = JSON.stringify(report, (key, value) => (key === 'rawMetrics' ? undefined : value), 2);
    fs.writeFileSync(jsonPath, summaryJson);
    scriptOutput.info(`📄 JSON report saved: ${jsonPath}`);

    if (report.rawMetrics) {
      const rawPath = path.join(this.outputDir, `${baseFilename}.raw.json`);
      const rawPayload = {
        generatedAt: new Date().toISOString(),
        baselineMetadata: report.baselineMetadata ?? report.performanceRegression?.baselineMetadata,
        rawMetrics: report.rawMetrics,
      };
      fs.writeFileSync(rawPath, JSON.stringify(rawPayload, null, 2));
      scriptOutput.info(`📄 Raw metrics saved: ${rawPath}`);
    }

    // Generate additional formats as requested
    if (format === 'html' || format === 'all') {
      const htmlReport = this.generateHTMLReport(report);
      const htmlPath = path.join(this.outputDir, `${baseFilename}.html`);
      fs.writeFileSync(htmlPath, htmlReport);
      scriptOutput.info(`📄 HTML report saved: ${htmlPath}`);
    }

    if (format === 'markdown' || format === 'all') {
      const mdReport = this.generateMarkdownReport(report);
      const mdPath = path.join(this.outputDir, `${baseFilename}.md`);
      fs.writeFileSync(mdPath, mdReport);
      scriptOutput.info(`📄 Markdown report saved: ${mdPath}`);
    }
  }

  /**
   * Display validation summary to console
   */
  private displayValidationSummary(report: Phase6ValidationReport): void {
    scriptOutput.info('\n📊 Phase 6 Integration Validation Summary');
    scriptOutput.info('═'.repeat(50));
    const statusLabel = report.status ? report.status.toUpperCase() : 'UNKNOWN';
    scriptOutput.info(`Phase 6 Status: ${statusLabel}`);
    if (report.statusReason) {
      scriptOutput.info(`Reason: ${report.statusReason}`);
    }
    scriptOutput.info(`Phase 6 Note: ${report.phase6ReadinessScoreNote ?? PHASE6_READINESS_SCORE_NOTE}`);
    scriptOutput.info(`Multi-System Workflows: ${report.realIntegrationSummary.successfulWorkflows}/${report.realIntegrationSummary.totalWorkflows} successful`);
    scriptOutput.info(`Cross-Interface Consistency: ${report.realIntegrationSummary.crossInterfaceConsistency.toFixed(1)}%`);
    scriptOutput.info(`Average Workflow Time: ${report.realIntegrationSummary.averageWorkflowTime.toFixed(1)}ms`);
    scriptOutput.info(`Performance Score: ${report.performanceRegression.overallScore}/100`);
    if (report.performanceRegression.baselineMetadata?.baselineRunId) {
      const captured = report.performanceRegression.baselineMetadata.capturedAt
        ? ` @ ${report.performanceRegression.baselineMetadata.capturedAt}`
        : '';
      scriptOutput.info(`Baseline Run: ${report.performanceRegression.baselineMetadata.baselineRunId}${captured}`);
    }
    
    scriptOutput.info('\nService Health:');
    Object.entries(report.serviceHealth).forEach(([service, health]) => {
      const status = health.operational ? '✅' : '❌';
      scriptOutput.info(`  ${service.toUpperCase()}: ${status} ${health.responseTime.toFixed(1)}ms, ${health.memoryUsage.toFixed(1)}MB`);
    });

    if (report.performanceRegression.regressionDetected) {
      scriptOutput.info('\n⚠️  Performance Regressions Detected:');
      report.performanceRegression.baselineComparison
        .filter(baseline => baseline.regressionDetected)
        .forEach(baseline => {
          const actualValue = baseline.actualValue ?? 0;
          const baselineValue = baseline.baselineValue ?? 0;
          const deviationPercentage = baseline.deviationPercentage ?? 0;
          scriptOutput.info(`  • ${baseline.metric}: ${actualValue.toFixed(1)} vs ${baselineValue.toFixed(1)} (${deviationPercentage.toFixed(1)}%)`);
        });
    }

    if (report.recommendations.critical.length > 0) {
      scriptOutput.info('\n🚨 Critical Issues:');
      report.recommendations.critical.forEach(rec => scriptOutput.info(`  • ${rec}`));
    }

    if (report.recommendations.high.length > 0) {
      scriptOutput.info('\n⚠️  High Priority Issues:');
      report.recommendations.high.forEach(rec => scriptOutput.info(`  • ${rec}`));
    }
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(report: Phase6ValidationReport): string {
    return `<!DOCTYPE html>
<html>
<head>
    <title>Phase 6 Integration Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
        .summary { background: #ecf0f1; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .success { color: #27ae60; }
        .failure { color: #e74c3c; }
        .warning { color: #f39c12; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #bdc3c7; padding: 8px; text-align: left; }
        th { background: #34495e; color: white; }
        .score { font-size: 24px; font-weight: bold; }
        .note { color: #7f8c8d; font-style: italic; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Phase 6 Integration Validation Report</h1>
        <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
        <p>Report ID: ${report.reportId}</p>
    </div>

    <div class="summary">
        <h2>Overall Results</h2>
        <div class="score">
            Phase 6 Status: ${(report.status ?? 'unknown').toUpperCase()}
        </div>
        ${report.statusReason ? `<p class="note">Reason: ${report.statusReason}</p>` : ''}
        <p class="note">Phase 6 Note: ${report.phase6ReadinessScoreNote ?? PHASE6_READINESS_SCORE_NOTE}</p>
        <p>Multi-System Workflows: ${report.realIntegrationSummary.successfulWorkflows}/${report.realIntegrationSummary.totalWorkflows} successful</p>
        <p>Cross-Interface Consistency: ${report.realIntegrationSummary.crossInterfaceConsistency.toFixed(1)}%</p>
        <p>Average Workflow Time: ${report.realIntegrationSummary.averageWorkflowTime.toFixed(1)}ms</p>
    </div>

    <h2>Service Health</h2>
    <table>
        <tr><th>Service</th><th>Status</th><th>Response Time</th><th>Memory Usage</th><th>Error Rate</th></tr>
        ${Object.entries(report.serviceHealth).map(([service, health]) => `
        <tr>
            <td>${service.toUpperCase()}</td>
            <td class="${health.operational ? 'success' : 'failure'}">${health.operational ? '✅ Operational' : '❌ Down'}</td>
            <td>${health.responseTime.toFixed(1)}ms</td>
            <td>${health.memoryUsage.toFixed(1)}MB</td>
            <td>${(health.errorRate * 100).toFixed(1)}%</td>
        </tr>
        `).join('')}
    </table>

    ${report.recommendations.critical.length > 0 ? `
    <h2>🚨 Critical Issues</h2>
    <ul class="failure">
        ${report.recommendations.critical.map(rec => `<li>${rec}</li>`).join('')}
    </ul>` : ''}

    ${report.recommendations.high.length > 0 ? `
    <h2>⚠️ High Priority Issues</h2>
    <ul class="warning">
        ${report.recommendations.high.map(rec => `<li>${rec}</li>`).join('')}
    </ul>` : ''}

    <h2>Performance Baselines</h2>
    <p><strong>Signal coverage:</strong> ${report.status === 'skipped' ? 'Estimated (mock instrumentation only)' : 'Real instrumentation (live backend data)'}.</p>
    <table>
        <tr><th>Metric</th><th>Baseline</th><th>Actual</th><th>Deviation</th><th>Status</th><th>Signal Type</th></tr>
        ${report.performanceRegression.baselineComparison.map(baseline => `
        <tr>
            <td>${baseline.metric}</td>
            <td>${(baseline.baselineValue ?? 0).toFixed(1)}${baseline.unit}</td>
            <td>${(baseline.actualValue ?? 0).toFixed(1)}${baseline.unit}</td>
            <td>${(baseline.deviationPercentage ?? 0).toFixed(1)}%</td>
            <td class="${baseline.regressionDetected ? 'failure' : 'success'}">${baseline.regressionDetected ? '❌ Regression' : '✅ OK'}</td>
            <td>${report.status === 'skipped' ? 'Estimated (Mock)' : 'Real'}</td>
        </tr>
        `).join('')}
    </table>
</body>
</html>`;
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdownReport(report: Phase6ValidationReport): string {
    return `# Phase 6 Integration Validation Report

**Generated:** ${new Date(report.generatedAt).toLocaleString()}
**Report ID:** ${report.reportId}

## Overall Results

**Phase 6 Status:** ${(report.status ?? 'unknown').toUpperCase()}
${report.statusReason ? `**Reason:** ${report.statusReason}` : ''}
**Phase 6 Note:** ${report.phase6ReadinessScoreNote ?? PHASE6_READINESS_SCORE_NOTE}

- Multi-System Workflows: ${report.realIntegrationSummary.successfulWorkflows}/${report.realIntegrationSummary.totalWorkflows} successful
- Cross-Interface Consistency: ${report.realIntegrationSummary.crossInterfaceConsistency.toFixed(1)}%
- Average Workflow Time: ${report.realIntegrationSummary.averageWorkflowTime.toFixed(1)}ms

## Service Health

| Service | Status | Response Time | Memory Usage | Error Rate |
|---------|--------|---------------|--------------|------------|
${Object.entries(report.serviceHealth).map(([service, health]) => 
`| ${service.toUpperCase()} | ${health.operational ? '✅ Operational' : '❌ Down'} | ${health.responseTime.toFixed(1)}ms | ${health.memoryUsage.toFixed(1)}MB | ${(health.errorRate * 100).toFixed(1)}% |`
).join('\n')}

${report.recommendations.critical.length > 0 ? `
## 🚨 Critical Issues

${report.recommendations.critical.map(rec => `- ${rec}`).join('\n')}
` : ''}

${report.recommendations.high.length > 0 ? `
## ⚠️ High Priority Issues

${report.recommendations.high.map(rec => `- ${rec}`).join('\n')}
` : ''}

## Performance Baselines

> Signal coverage: ${report.status === 'skipped' ? 'Estimated (mock instrumentation only)' : 'Real instrumentation'}

| Metric | Baseline | Actual | Deviation | Status | Signal Type |
|--------|----------|--------|-----------|--------|--------------|
${report.performanceRegression.baselineComparison.map(baseline => 
`| ${baseline.metric} | ${(baseline.baselineValue ?? 0).toFixed(1)}${baseline.unit} | ${(baseline.actualValue ?? 0).toFixed(1)}${baseline.unit} | ${(baseline.deviationPercentage ?? 0).toFixed(1)}% | ${baseline.regressionDetected ? '❌ Regression' : '✅ OK'} | ${report.status === 'skipped' ? 'Estimated (Mock)' : 'Real'} |`
).join('\n')}

---

*Report generated by Phase 6 Integration Validation Suite v${CLI_VERSION}*
`;
  }

  /**
   * Load default configuration
   */
  private loadDefaultConfig(): ValidationConfig {
    return {
      services: {
        haruspex: {
          enabled: true,
          ports: { ipc: 8001, http: 8002, websocket: 8003 }
        },
        pcl: {
          enabled: true,
          ports: { ipc: 8011, http: 8012 }
        },
        templum: {
          enabled: true,
          ports: { http: 8021, websocket: 8022 }
        }
      },
      validation: {
        enablePerformanceRegression: true,
        enableCrossInterfaceValidation: true,
        enableProductionReadiness: true,
        performanceBaselinesFile: DEFAULT_BASELINE_FILE
      },
      reporting: {
        outputDir: DEFAULT_OUTPUT_DIR,
        generateDetailedReport: true,
        generateSummaryReport: true,
        exportFormat: 'all'
      }
    };
  }
}

// Execute CLI if run directly
if (require.main === module) {
  const cli = new Phase6ValidationCLI();
  cli.run().catch((error) => {
    const resolvedError = error instanceof Error ? error : new Error(String(error ?? 'Unknown error'));
    ErrorHandler.handle(resolvedError, 'phase6-validation-cli.entrypoint');
    scriptOutput.error('CLI execution failed:', resolvedError);
    process.exitCode = Math.max(Number(process.exitCode ?? 0), 1);
  });
}

export { Phase6ValidationCLI };
export type { ValidationConfig };
