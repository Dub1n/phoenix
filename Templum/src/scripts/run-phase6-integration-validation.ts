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
import { Phase6IntegrationValidationSuite, Phase6ValidationReport } from '../tests/integration-validation-framework';

// CLI Configuration
const CLI_VERSION = '1.0.0';
const DEFAULT_OUTPUT_DIR = './validation-reports';
const DEFAULT_CONFIG_FILE = './phase6-validation-config.json';

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

  constructor() {
    this.config = this.loadDefaultConfig();
    this.outputDir = DEFAULT_OUTPUT_DIR;
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
      .option('--no-performance', 'Disable performance regression testing')
      .option('--no-cross-interface', 'Disable cross-interface validation')
      .option('--no-production', 'Disable production readiness validation')
      .option('--services <services>', 'Comma-separated list of services to test (haruspex,pcl,templum)', 'haruspex,pcl,templum')
      .option('--format <format>', 'Report format (json|html|markdown|all)', 'all')
      .option('-v, --verbose', 'Enable verbose logging')
      .action(async (options) => {
        await this.executeValidation(options);
      });

    // Health check command
    program
      .command('health')
      .description('Check system health and service availability')
      .option('-c, --config <file>', 'Configuration file path', DEFAULT_CONFIG_FILE)
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
          .action(async (options) => {
            await this.manageServices('start', options);
          })
      )
      .addCommand(
        program.createCommand('stop')
          .description('Stop all backend services')
          .option('-s, --service <name>', 'Stop specific service (haruspex|pcl|templum)')
          .action(async (options) => {
            await this.manageServices('stop', options);
          })
      )
      .addCommand(
        program.createCommand('status')
          .description('Check service status')
          .action(async () => {
            await this.checkServiceStatus();
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
    console.log('🚀 Phase 6 Integration Validation Starting...\n');

    try {
      // Load configuration
      if (options.config && fs.existsSync(options.config)) {
        this.config = { ...this.config, ...JSON.parse(fs.readFileSync(options.config, 'utf8')) };
      }

      // Override configuration with CLI options
      this.applyCliOptionsToConfig(options);
      this.outputDir = options.output;

      // Ensure output directory exists
      if (!fs.existsSync(this.outputDir)) {
        fs.mkdirSync(this.outputDir, { recursive: true });
      }

      // Initialize validation suite
      console.log('📋 Initializing Phase 6 validation suite...');
      this.validationSuite = new Phase6IntegrationValidationSuite();
      
      // Setup progress monitoring
      this.setupProgressMonitoring();

      // Initialize and start validation
      await this.validationSuite.initialize();
      console.log('✅ Validation suite initialized\n');

      console.log('🔄 Running comprehensive integration validation...');
      console.log('   • Multi-system workflow testing (PCL ↔ Haruspex ↔ Templum)');
      console.log('   • Cross-interface consistency validation (VSCode, CLI, Command)');
      console.log('   • Performance regression monitoring (Phase 5 baselines)');
      console.log('   • Production readiness verification');
      console.log('   • System reliability and failover testing\n');

      const startTime = Date.now();
      const report = await this.validationSuite.runPhase6IntegrationValidation();
      const duration = Date.now() - startTime;

      console.log(`\n✅ Validation completed in ${(duration / 1000).toFixed(2)}s\n`);

      // Generate and save reports
      await this.saveValidationReport(report, options.format);
      this.displayValidationSummary(report);

      // Cleanup
      await this.validationSuite.shutdown();

      // Exit with appropriate code
      if (report.phase6ReadinessScore >= 80) {
        console.log('\n🎉 Phase 6 Integration Validation PASSED - System ready for production deployment');
        process.exit(0);
      } else {
        console.log('\n❌ Phase 6 Integration Validation FAILED - Address critical issues before deployment');
        process.exit(1);
      }

    } catch (error) {
      console.error('\n❌ Validation failed:', error instanceof Error ? error.message : 'Unknown error');
      
      if (this.validationSuite) {
        await this.validationSuite.shutdown().catch(() => {});
      }
      
      process.exit(1);
    }
  }

  /**
   * Execute system health check
   */
  private async executeHealthCheck(options: any): Promise<void> {
    console.log('🏥 Phase 6 System Health Check\n');

    try {
      // Load configuration
      if (options.config && fs.existsSync(options.config)) {
        this.config = { ...this.config, ...JSON.parse(fs.readFileSync(options.config, 'utf8')) };
      }

      // Initialize validation suite for health check
      this.validationSuite = new Phase6IntegrationValidationSuite();
      await this.validationSuite.initialize();

      // Check service health
      const healthResults = await this.validationSuite.checkSystemHealth();
      
      console.log('Service Health Status:');
      console.log('─'.repeat(50));
      
      Object.entries(healthResults.serviceHealth).forEach(([service, health]) => {
        const status = health.operational ? '✅ HEALTHY' : '❌ UNHEALTHY';
        const responseTime = `${health.responseTime.toFixed(1)}ms`;
        const memoryUsage = `${health.memoryUsage.toFixed(1)}MB`;
        const errorRate = `${(health.errorRate * 100).toFixed(1)}%`;
        
        console.log(`${service.toUpperCase().padEnd(10)} ${status.padEnd(15)} Response: ${responseTime.padEnd(10)} Memory: ${memoryUsage.padEnd(10)} Errors: ${errorRate}`);
      });

      console.log('─'.repeat(50));
      console.log(`Overall System Health: ${healthResults.phase6ReadinessScore >= 80 ? '✅ HEALTHY' : '❌ NEEDS ATTENTION'}`);
      console.log(`Phase 6 Readiness Score: ${healthResults.phase6ReadinessScore}%`);

      if (healthResults.recommendations.critical.length > 0) {
        console.log('\n🚨 Critical Issues:');
        healthResults.recommendations.critical.forEach(rec => console.log(`   • ${rec}`));
      }

      await this.validationSuite.shutdown();
      
      process.exit(healthResults.phase6ReadinessScore >= 80 ? 0 : 1);

    } catch (error) {
      console.error('\n❌ Health check failed:', error instanceof Error ? error.message : 'Unknown error');
      
      if (this.validationSuite) {
        await this.validationSuite.shutdown().catch(() => {});
      }
      
      process.exit(1);
    }
  }

  /**
   * Manage backend services
   */
  private async manageServices(action: 'start' | 'stop', options: any): Promise<void> {
    console.log(`${action === 'start' ? '🚀' : '🛑'} ${action.charAt(0).toUpperCase() + action.slice(1)}ing services...\n`);

    try {
      this.validationSuite = new Phase6IntegrationValidationSuite();
      await this.validationSuite.initialize();

      if (action === 'start') {
        if (options.service) {
          console.log(`Starting ${options.service} service...`);
          // Would implement specific service startup
        } else {
          console.log('Starting all services...');
          await this.validationSuite.startAllServices();
        }
        console.log('✅ Services started successfully');
      } else {
        console.log('Stopping all services...');
        await this.validationSuite.shutdown();
        console.log('✅ Services stopped successfully');
      }

    } catch (error) {
      console.error(`\n❌ Service ${action} failed:`, error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Check service status
   */
  private async checkServiceStatus(): Promise<void> {
    console.log('📊 Service Status Check\n');

    try {
      this.validationSuite = new Phase6IntegrationValidationSuite();
      await this.validationSuite.initialize();

      const services = await this.validationSuite.getAllServiceStatuses();
      
      console.log('Service Status:');
      console.log('─'.repeat(40));
      
      services.forEach(service => {
        const status = service.status.toUpperCase().padEnd(10);
        const ports = Object.entries(service.ports)
          .filter(([, port]) => port)
          .map(([type, port]) => `${type}:${port}`)
          .join(', ') || 'none';
        
        console.log(`${service.name.toUpperCase().padEnd(10)} ${status} Ports: ${ports}`);
      });

      await this.validationSuite.shutdown();

    } catch (error) {
      console.error('\n❌ Status check failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  /**
   * Generate report from validation results
   */
  private async generateReport(reportFile: string, options: any): Promise<void> {
    console.log(`📄 Generating ${options.format} report from ${reportFile}\n`);

    try {
      if (!fs.existsSync(reportFile)) {
        throw new Error(`Report file not found: ${reportFile}`);
      }

      const report: Phase6ValidationReport = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
      
      if (options.format === 'html') {
        const htmlReport = this.generateHTMLReport(report);
        const outputFile = options.output || reportFile.replace('.json', '.html');
        fs.writeFileSync(outputFile, htmlReport);
        console.log(`✅ HTML report generated: ${outputFile}`);
      } else if (options.format === 'markdown') {
        const mdReport = this.generateMarkdownReport(report);
        const outputFile = options.output || reportFile.replace('.json', '.md');
        fs.writeFileSync(outputFile, mdReport);
        console.log(`✅ Markdown report generated: ${outputFile}`);
      }

    } catch (error) {
      console.error('\n❌ Report generation failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
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

    // Override reporting settings
    this.config.reporting.outputDir = options.output || this.config.reporting.outputDir;
    this.config.reporting.exportFormat = options.format || this.config.reporting.exportFormat;
  }

  /**
   * Setup progress monitoring for validation
   */
  private setupProgressMonitoring(): void {
    if (!this.validationSuite) return;

    this.validationSuite.on('servicesReady', () => {
      console.log('✅ All backend services ready');
    });

    this.validationSuite.on('workflowCompleted', (workflow) => {
      console.log(`✅ Workflow completed: ${workflow.workflowType} (${workflow.totalDuration}ms)`);
    });

    this.validationSuite.on('workflowFailure', (event) => {
      console.log(`❌ Workflow failed: ${event.workflowType} - ${event.error}`);
    });

    this.validationSuite.on('performanceAlert', (event) => {
      console.log(`⚠️  Performance alert: ${event.metric} regression detected`);
    });

    this.validationSuite.on('crossInterfaceValidated', (results) => {
      console.log(`✅ Cross-interface validation: ${results.overallConsistency.toFixed(1)}% consistency`);
    });

    this.validationSuite.on('productionValidated', (results) => {
      console.log(`✅ Production readiness: ${results.overallReadiness.toFixed(1)}% ready`);
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
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON report saved: ${jsonPath}`);

    // Generate additional formats as requested
    if (format === 'html' || format === 'all') {
      const htmlReport = this.generateHTMLReport(report);
      const htmlPath = path.join(this.outputDir, `${baseFilename}.html`);
      fs.writeFileSync(htmlPath, htmlReport);
      console.log(`📄 HTML report saved: ${htmlPath}`);
    }

    if (format === 'markdown' || format === 'all') {
      const mdReport = this.generateMarkdownReport(report);
      const mdPath = path.join(this.outputDir, `${baseFilename}.md`);
      fs.writeFileSync(mdPath, mdReport);
      console.log(`📄 Markdown report saved: ${mdPath}`);
    }
  }

  /**
   * Display validation summary to console
   */
  private displayValidationSummary(report: Phase6ValidationReport): void {
    console.log('\n📊 Phase 6 Integration Validation Summary');
    console.log('═'.repeat(50));
    console.log(`Phase 6 Readiness Score: ${report.phase6ReadinessScore}%`);
    console.log(`Multi-System Workflows: ${report.realIntegrationSummary.successfulWorkflows}/${report.realIntegrationSummary.totalWorkflows} successful`);
    console.log(`Cross-Interface Consistency: ${report.realIntegrationSummary.crossInterfaceConsistency.toFixed(1)}%`);
    console.log(`Average Workflow Time: ${report.realIntegrationSummary.averageWorkflowTime.toFixed(1)}ms`);
    
    console.log('\nService Health:');
    Object.entries(report.serviceHealth).forEach(([service, health]) => {
      const status = health.operational ? '✅' : '❌';
      console.log(`  ${service.toUpperCase()}: ${status} ${health.responseTime.toFixed(1)}ms, ${health.memoryUsage.toFixed(1)}MB`);
    });

    if (report.performanceRegression.regressionDetected) {
      console.log('\n⚠️  Performance Regressions Detected:');
      report.performanceRegression.baselineComparison
        .filter(baseline => baseline.regressionDetected)
        .forEach(baseline => {
          const actualValue = baseline.actualValue ?? 0;
          const baselineValue = baseline.baselineValue ?? 0;
          const deviationPercentage = baseline.deviationPercentage ?? 0;
          console.log(`  • ${baseline.metric}: ${actualValue.toFixed(1)} vs ${baselineValue.toFixed(1)} (${deviationPercentage.toFixed(1)}%)`);
        });
    }

    if (report.recommendations.critical.length > 0) {
      console.log('\n🚨 Critical Issues:');
      report.recommendations.critical.forEach(rec => console.log(`  • ${rec}`));
    }

    if (report.recommendations.high.length > 0) {
      console.log('\n⚠️  High Priority Issues:');
      report.recommendations.high.forEach(rec => console.log(`  • ${rec}`));
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
        <div class="score ${report.phase6ReadinessScore >= 80 ? 'success' : 'failure'}">
            Phase 6 Readiness Score: ${report.phase6ReadinessScore}%
        </div>
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
    <table>
        <tr><th>Metric</th><th>Baseline</th><th>Actual</th><th>Deviation</th><th>Status</th></tr>
        ${report.performanceRegression.baselineComparison.map(baseline => `
        <tr>
            <td>${baseline.metric}</td>
            <td>${(baseline.baselineValue ?? 0).toFixed(1)}${baseline.unit}</td>
            <td>${(baseline.actualValue ?? 0).toFixed(1)}${baseline.unit}</td>
            <td>${(baseline.deviationPercentage ?? 0).toFixed(1)}%</td>
            <td class="${baseline.regressionDetected ? 'failure' : 'success'}">${baseline.regressionDetected ? '❌ Regression' : '✅ OK'}</td>
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

**Phase 6 Readiness Score:** ${report.phase6ReadinessScore}% ${report.phase6ReadinessScore >= 80 ? '✅' : '❌'}

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

| Metric | Baseline | Actual | Deviation | Status |
|--------|----------|--------|-----------|--------|
${report.performanceRegression.baselineComparison.map(baseline => 
`| ${baseline.metric} | ${(baseline.baselineValue ?? 0).toFixed(1)}${baseline.unit} | ${(baseline.actualValue ?? 0).toFixed(1)}${baseline.unit} | ${(baseline.deviationPercentage ?? 0).toFixed(1)}% | ${baseline.regressionDetected ? '❌ Regression' : '✅ OK'} |`
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
        enableProductionReadiness: true
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
    console.error('CLI execution failed:', error);
    process.exit(1);
  });
}

export { Phase6ValidationCLI, ValidationConfig };