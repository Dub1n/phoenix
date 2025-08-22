/**---
 * title: [Haruspex Debug CLI - Agent Interface]
 * tags: [CLI, Debugging, Agent-Interface, Real-Time]
 * provides: [HaruspexCLI, DebugCommands, StateInspection, InteractiveControl]
 * requires: [IPC Protocol, Commander.js, Inquirer.js]
 * description: [Command-line interface for real-time debugging and interaction with Haruspex extension]
 * ---*/

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import CliTable3 from 'cli-table3';
import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { HaruspexIPCClient } from './ipc-client';

export interface CLIConfig {
  workspacePath?: string;
  autoConnect?: boolean;
  watchMode?: boolean;
  outputFormat?: 'json' | 'table' | 'pretty';
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface CommandContext {
  client: HaruspexIPCClient;
  config: CLIConfig;
  outputFormat: 'json' | 'table' | 'pretty';
}

/**
 * Haruspex Debug CLI - External agent interface to Haruspex extension
 * 
 * Provides comprehensive debugging and interaction capabilities:
 * - Real-time state inspection
 * - Interactive command execution
 * - Live event monitoring
 * - Batch operations
 * - Automated debugging flows
 */
export class HaruspexCLI extends EventEmitter {
  private program: Command;
  private client: HaruspexIPCClient;
  private config: CLIConfig;
  private isConnected = false;
  private watchMode = false;

  constructor(config: CLIConfig = {}) {
    super();
    
    this.config = {
      autoConnect: true,
      outputFormat: 'pretty',
      logLevel: 'info',
      ...config
    };
    
    this.client = new HaruspexIPCClient(config.workspacePath);
    this.program = new Command();
    
    this.setupCommands();
    this.setupEventHandlers();
  }

  /**
   * Setup CLI commands and options
   */
  private setupCommands(): void {
    this.program
      .name('haruspex-debug')
      .description('Haruspex Extension Debug CLI - Real-time debugging and interaction')
      .version('1.0.0')
      .option('-w, --workspace <path>', 'workspace directory path')
      .option('-f, --format <format>', 'output format (json|table|pretty)', 'pretty')
      .option('-v, --verbose', 'verbose logging')
      .option('--no-auto-connect', 'disable automatic connection')
      .hook('preAction', async (thisCommand) => {
        // Global setup before any command
        await this.initializeConnection(thisCommand.opts());
      });

    // Connection Management Commands
    this.program
      .command('connect')
      .description('Connect to Haruspex extension')
      .option('-w, --workspace <path>', 'workspace directory path')
      .option('--timeout <ms>', 'connection timeout in milliseconds', '5000')
      .action(async (options) => {
        await this.connectCommand(options);
      });

    this.program
      .command('disconnect')
      .description('Disconnect from Haruspex extension')
      .action(async () => {
        await this.disconnectCommand();
      });

    this.program
      .command('ping')
      .description('Test connection to Haruspex extension')
      .action(async () => {
        await this.pingCommand();
      });

    // Status and Information Commands
    this.program
      .command('status')
      .description('Get comprehensive Haruspex status')
      .option('-j, --json', 'output as JSON')
      .option('-w, --watch', 'watch mode - continuous updates')
      .action(async (options) => {
        await this.statusCommand(options);
      });

    this.program
      .command('health')
      .description('Get health status and metrics')
      .option('-j, --json', 'output as JSON')
      .option('-d, --detailed', 'show detailed health information')
      .action(async (options) => {
        await this.healthCommand(options);
      });

    this.program
      .command('debug-info')
      .description('Get comprehensive debug information')
      .option('-j, --json', 'output as JSON')
      .option('-e, --export <file>', 'export to file')
      .action(async (options) => {
        await this.debugInfoCommand(options);
      });

    this.program
      .command('metrics')
      .description('Get performance metrics')
      .option('-j, --json', 'output as JSON')
      .option('-c, --component <name>', 'specific component metrics')
      .action(async (options) => {
        await this.metricsCommand(options);
      });

    // Data Refresh Commands
    this.program
      .command('refresh')
      .description('Refresh all Haruspex data')
      .option('-c, --component <name>', 'refresh specific component')
      .option('-w, --wait', 'wait for completion')
      .action(async (options) => {
        await this.refreshCommand(options);
      });

    // Command Execution
    this.program
      .command('exec <command>')
      .description('Execute Haruspex command')
      .option('-a, --args <args...>', 'command arguments')
      .option('-o, --options <json>', 'command options as JSON')
      .option('-t, --timeout <ms>', 'execution timeout', '30000')
      .action(async (command, options) => {
        await this.execCommand(command, options);
      });

    // Event Monitoring
    this.program
      .command('watch')
      .description('Watch for real-time events')
      .option('-e, --events <types...>', 'event types to watch', ['all'])
      .option('-f, --filter <json>', 'event filters as JSON')
      .option('-d, --duration <seconds>', 'watch duration in seconds')
      .action(async (options) => {
        await this.watchCommand(options);
      });

    // Interactive Commands
    this.program
      .command('interactive')
      .alias('i')
      .description('Start interactive debugging session')
      .action(async () => {
        await this.interactiveCommand();
      });

    // Diagnostic Commands
    this.program
      .command('diagnose')
      .description('Run comprehensive diagnostics')
      .option('-r, --report <file>', 'save diagnostic report to file')
      .option('-f, --fix', 'attempt to fix identified issues')
      .action(async (options) => {
        await this.diagnoseCommand(options);
      });

    // Workspace Analysis (PCL Integration)
    this.program
      .command('analyze-workspace')
      .description('Analyze workspace using PCL integration')
      .option('-p, --path <path>', 'specific path to analyze')
      .option('-j, --json', 'output as JSON')
      .action(async (options) => {
        await this.analyzeWorkspaceCommand(options);
      });

    // TDD Execution (PCL Integration)
    this.program
      .command('run-tdd <task>')
      .description('Execute TDD workflow using PCL integration')
      .option('-t, --turns <number>', 'maximum TDD turns', '3')
      .option('-o, --options <json>', 'TDD options as JSON')
      .action(async (task, options) => {
        await this.runTDDCommand(task, options);
      });

    // Connection Testing Commands  
    this.program
      .command('test-connection')
      .description('Test connection with comprehensive diagnostics')
      .option('-j, --json', 'output as JSON')
      .option('-v, --verbose', 'verbose output')
      .action(async (options) => {
        await this.testConnectionCommand(options);
      });

    this.program
      .command('validate')
      .description('Validate connection and basic functionality')
      .action(async () => {
        await this.validateCommand();
      });

    // Utility Commands
    this.program
      .command('config')
      .description('Show or modify CLI configuration')
      .option('-s, --set <key=value>', 'set configuration value')
      .option('-g, --get <key>', 'get configuration value')
      .option('-l, --list', 'list all configuration')
      .action(async (options) => {
        await this.configCommand(options);
      });
  }

  /**
   * Setup event handlers for IPC client
   */
  private setupEventHandlers(): void {
    this.client.on('connected', () => {
      this.isConnected = true;
      this.log('Connected to Haruspex extension', 'info');
    });

    this.client.on('disconnected', () => {
      this.isConnected = false;
      this.log('Disconnected from Haruspex extension', 'warn');
    });

    this.client.on('error', (error) => {
      this.log(`Connection error: ${error.message}`, 'error');
    });

    this.client.on('state_change', (event) => {
      if (this.watchMode) {
        this.displayStateChange(event);
      }
    });

    this.client.on('health_change', (event) => {
      if (this.watchMode) {
        this.displayHealthChange(event);
      }
    });
  }

  /**
   * Initialize connection based on global options
   */
  private async initializeConnection(options: any): Promise<void> {
    if (options.workspace) {
      this.config.workspacePath = options.workspace;
      this.client.setWorkspacePath(options.workspace);
    }

    if (options.format) {
      this.config.outputFormat = options.format;
    }

    if (options.verbose) {
      this.config.logLevel = 'debug';
    }

    if (this.config.autoConnect && options.autoConnect !== false) {
      try {
        await this.client.connect();
      } catch (error) {
        this.log(`Auto-connect failed: ${error instanceof Error ? error.message : error}`, 'warn');
        this.log('Use "haruspex-debug connect" to manually connect', 'info');
      }
    }
  }

  // Command Implementations

  private async connectCommand(options: any): Promise<void> {
    try {
      if (options.workspace) {
        this.client.setWorkspacePath(options.workspace);
      }

      const timeout = parseInt(options.timeout) || 5000;
      await this.client.connect();
      
      this.output('Connected to Haruspex extension successfully', 'success');
      
      // Show initial status
      const status = await this.client.getStatus();
      this.displayStatus(status, { json: false });
      
    } catch (error) {
      this.output(`Connection failed: ${error instanceof Error ? error.message : error}`, 'error');
      process.exit(1);
    }
  }

  private async disconnectCommand(): Promise<void> {
    if (!this.isConnected) {
      this.output('Not connected to Haruspex extension', 'warn');
      return;
    }

    await this.client.disconnect();
    this.output('Disconnected from Haruspex extension', 'info');
  }

  private async pingCommand(): Promise<void> {
    if (!this.ensureConnected()) return;

    try {
      const startTime = Date.now();
      await this.client.ping();
      const duration = Date.now() - startTime;
      
      this.output(`Pong! Response time: ${duration}ms`, 'success');
    } catch (error) {
      this.output(`Ping failed: ${error instanceof Error ? error.message : error}`, 'error');
    }
  }

  private async statusCommand(options: any): Promise<void> {
    if (!this.ensureConnected()) return;

    try {
      if (options.watch) {
        this.startStatusWatch();
        return;
      }

      const status = await this.client.getStatus();
      this.displayStatus(status, options);
      
    } catch (error) {
      this.output(`Status command failed: ${error instanceof Error ? error.message : error}`, 'error');
    }
  }

  private async healthCommand(options: any): Promise<void> {
    if (!this.ensureConnected()) return;

    try {
      const health = await this.client.getHealth();
      this.displayHealth(health, options);
      
    } catch (error) {
      this.output(`Health command failed: ${error instanceof Error ? error.message : error}`, 'error');
    }
  }

  private async debugInfoCommand(options: any): Promise<void> {
    if (!this.ensureConnected()) return;

    try {
      const debugInfo = await this.client.getDebugInfo();
      
      if (options.export) {
        fs.writeFileSync(options.export, JSON.stringify(debugInfo, null, 2));
        this.output(`Debug info exported to ${options.export}`, 'success');
      }
      
      this.displayDebugInfo(debugInfo, options);
      
    } catch (error) {
      this.output(`Debug info command failed: ${error instanceof Error ? error.message : error}`, 'error');
    }
  }

  private async metricsCommand(options: any): Promise<void> {
    if (!this.ensureConnected()) return;

    try {
      const metrics = await this.client.getMetrics();
      this.displayMetrics(metrics, options);
      
    } catch (error) {
      this.output(`Metrics command failed: ${error instanceof Error ? error.message : error}`, 'error');
    }
  }

  private async refreshCommand(options: any): Promise<void> {
    if (!this.ensureConnected()) return;

    try {
      this.output('Refreshing Haruspex data...', 'info');
      
      const result = await this.client.refreshData();
      
      if (result.success) {
        this.output(`Refresh completed in ${result.duration}ms`, 'success');
        this.output(`Refreshed: ${result.refreshed.join(', ')}`, 'info');
        
        if (result.errors.length > 0) {
          this.output(`Errors: ${result.errors.join(', ')}`, 'warn');
        }
      } else {
        this.output('Refresh failed', 'error');
        if (result.errors.length > 0) {
          result.errors.forEach((error: string) => this.output(`  ${error}`, 'error'));
        }
      }
      
    } catch (error) {
      this.output(`Refresh command failed: ${error instanceof Error ? error.message : error}`, 'error');
    }
  }

  private async execCommand(command: string, options: any): Promise<void> {
    if (!this.ensureConnected()) return;

    try {
      const args = options.args || [];
      const cmdOptions = options.options ? JSON.parse(options.options) : {};
      const timeout = parseInt(options.timeout) || 30000;
      
      this.output(`Executing command: ${command}`, 'info');
      
      const result = await this.client.executeCommand({
        command,
        args,
        options: cmdOptions
      }, timeout);
      
      if (result.success) {
        this.output(`Command completed in ${result.duration}ms`, 'success');
        if (result.result) {
          this.displayResult(result.result);
        }
      } else {
        this.output(`Command failed: ${result.error}`, 'error');
      }
      
    } catch (error) {
      this.output(`Execute command failed: ${error instanceof Error ? error.message : error}`, 'error');
    }
  }

  private async watchCommand(options: any): Promise<void> {
    if (!this.ensureConnected()) return;

    try {
      const eventTypes = options.events || ['all'];
      const filters = options.filter ? JSON.parse(options.filter) : {};
      const duration = options.duration ? parseInt(options.duration) * 1000 : undefined;
      
      this.output(`Starting event watch for: ${eventTypes.join(', ')}`, 'info');
      this.watchMode = true;
      
      await this.client.subscribeToEvents(eventTypes, filters);
      
      if (duration) {
        setTimeout(async () => {
          await this.client.unsubscribeFromEvents(eventTypes);
          this.watchMode = false;
          this.output('Watch mode ended', 'info');
          process.exit(0);
        }, duration);
      } else {
        this.output('Press Ctrl+C to stop watching', 'info');
        process.on('SIGINT', async () => {
          await this.client.unsubscribeFromEvents(eventTypes);
          this.watchMode = false;
          this.output('\\nWatch mode ended', 'info');
          process.exit(0);
        });
      }
      
    } catch (error) {
      this.output(`Watch command failed: ${error instanceof Error ? error.message : error}`, 'error');
    }
  }

  private async interactiveCommand(): Promise<void> {
    if (!this.ensureConnected()) return;

    this.output('Starting interactive debugging session...', 'info');
    this.output('Type "help" for available commands, "exit" to quit', 'info');

    while (true) {
      try {
        const { command } = await inquirer.prompt([
          {
            type: 'input',
            name: 'command',
            message: 'haruspex-debug>',
            validate: (input: string) => input.trim().length > 0 || 'Please enter a command'
          }
        ]);

        const trimmedCommand = command.trim();
        
        if (trimmedCommand === 'exit' || trimmedCommand === 'quit') {
          break;
        }
        
        if (trimmedCommand === 'help') {
          this.showInteractiveHelp();
          continue;
        }

        // Parse and execute command
        await this.executeInteractiveCommand(trimmedCommand);
        
      } catch (error) {
        if (error instanceof Error && error.message.includes('User force closed')) {
          break;
        }
        this.output(`Error: ${error instanceof Error ? error.message : error}`, 'error');
      }
    }

    this.output('Interactive session ended', 'info');
  }

  private async diagnoseCommand(options: any): Promise<void> {
    if (!this.ensureConnected()) return;

    try {
      this.output('Running comprehensive diagnostics...', 'info');
      
      const debugInfo = await this.client.getDebugInfo();
      const health = await this.client.getHealth();
      const metrics = await this.client.getMetrics();
      
      const report = this.generateDiagnosticReport(debugInfo, health, metrics);
      
      if (options.report) {
        fs.writeFileSync(options.report, JSON.stringify(report, null, 2));
        this.output(`Diagnostic report saved to ${options.report}`, 'success');
      }
      
      this.displayDiagnosticReport(report);
      
      if (options.fix) {
        await this.attemptAutomaticFixes(report);
      }
      
    } catch (error) {
      this.output(`Diagnose command failed: ${error instanceof Error ? error.message : error}`, 'error');
    }
  }

  private async analyzeWorkspaceCommand(options: any): Promise<void> {
    if (!this.ensureConnected()) return;

    try {
      const result = await this.client.executeCommand({
        command: 'haruspex.analyzeWorkspace',
        args: options.path ? [options.path] : []
      });
      
      if (result.success) {
        this.displayWorkspaceAnalysis(result.result, options);
      } else {
        this.output(`Workspace analysis failed: ${result.error}`, 'error');
      }
      
    } catch (error) {
      this.output(`Analyze workspace failed: ${error instanceof Error ? error.message : error}`, 'error');
    }
  }

  private async runTDDCommand(task: string, options: any): Promise<void> {
    if (!this.ensureConnected()) return;

    try {
      const turns = parseInt(options.turns) || 3;
      const tddOptions = options.options ? JSON.parse(options.options) : {};
      
      this.output(`Starting TDD workflow for: ${task}`, 'info');
      
      const result = await this.client.executeCommand({
        command: 'haruspex.runTDD',
        args: [task, turns],
        options: tddOptions
      });
      
      if (result.success) {
        this.displayTDDResult(result.result);
      } else {
        this.output(`TDD execution failed: ${result.error}`, 'error');
      }
      
    } catch (error) {
      this.output(`TDD command failed: ${error instanceof Error ? error.message : error}`, 'error');
    }
  }

  private async configCommand(options: any): Promise<void> {
    if (options.list) {
      this.displayConfig();
    } else if (options.get) {
      this.displayConfigValue(options.get);
    } else if (options.set) {
      this.setConfigValue(options.set);
    } else {
      this.displayConfig();
    }
  }

  // New Phase 2 command implementations
  
  private async testConnectionCommand(options: any): Promise<void> {
    this.output('Running comprehensive connection test...', 'info');
    
    try {
      if (!this.isConnected) {
        this.output('Not connected. Attempting to connect first...', 'info');
        await this.client.connect({ timeout: 10000, retryAttempts: 2 });
      }
      
      const testResult = await this.client.testConnection();
      
      if (options.json) {
        console.log(JSON.stringify(testResult, null, 2));
        return;
      }
      
      console.log(`\n${chalk.bold('Connection Test Results')}`);
      console.log(`Connected: ${testResult.connected ? '✅' : '❌'}`);
      console.log(`Ping Test: ${testResult.pingSuccess ? '✅' : '❌'}`);
      console.log(`Status Test: ${testResult.statusSuccess ? '✅' : '❌'}`);
      console.log(`Health Test: ${testResult.healthSuccess ? '✅' : '❌'}`);
      
      if (testResult.errors.length > 0) {
        console.log(`\n${chalk.red('Errors:')}`);
        testResult.errors.forEach(error => {
          console.log(`  ${chalk.red('•')} ${error}`);
        });
      }
      
      const allTestsPassed = testResult.connected && testResult.pingSuccess && 
                           testResult.statusSuccess && testResult.healthSuccess;
      
      if (allTestsPassed) {
        this.output('All connection tests passed! ✅', 'success');
      } else {
        this.output('Some connection tests failed. Check errors above.', 'error');
      }
      
    } catch (error) {
      this.output(`Connection test failed: ${error instanceof Error ? error.message : error}`, 'error');
    }
  }

  private async validateCommand(): Promise<void> {
    this.output('Validating Haruspex debug connection...', 'info');
    
    try {
      if (!this.isConnected) {
        await this.client.connect();
      }
      
      const isValid = await this.client.validateConnection();
      
      if (isValid) {
        this.output('Connection validation successful! ✅', 'success');
      } else {
        this.output('Connection validation failed ❌', 'error');
      }
      
    } catch (error) {
      this.output(`Validation failed: ${error instanceof Error ? error.message : error}`, 'error');
    }
  }

  // Helper Methods

  private ensureConnected(): boolean {
    if (!this.isConnected) {
      this.output('Not connected to Haruspex extension. Use "connect" command first.', 'error');
      return false;
    }
    return true;
  }

  private async startStatusWatch(): Promise<void> {
    this.output('Starting status watch mode... Press Ctrl+C to stop', 'info');
    this.watchMode = true;

    const updateStatus = async () => {
      if (!this.watchMode) return;
      
      try {
        const status = await this.client.getStatus();
        console.clear();
        this.output(`Haruspex Status - ${new Date().toLocaleTimeString()}`, 'info');
        this.displayStatus(status, { json: false });
      } catch (error) {
        this.output(`Status update failed: ${error}`, 'error');
      }
      
      if (this.watchMode) {
        setTimeout(updateStatus, 2000);
      }
    };

    process.on('SIGINT', () => {
      this.watchMode = false;
      this.output('\\nStatus watch ended', 'info');
      process.exit(0);
    });

    await updateStatus();
  }

  private displayStatus(status: any, options: any): void {
    if (options.json) {
      console.log(JSON.stringify(status, null, 2));
      return;
    }

    const table = new CliTable3({
      head: ['Component', 'Status', 'Details'],
      style: { head: ['cyan'] }
    });

    table.push(
      ['Extension', status.debugInfo.activation.activated ? '✅ Active' : '❌ Inactive', 
       `${status.debugInfo.activation.activationDuration || 0}ms`],
      ['Engine', status.debugInfo.engine.initialized ? '✅ Ready' : '❌ Failed', 
       status.debugInfo.engine.health],
      ['Workspace', status.debugInfo.workspace.hasWorkspaceFolder ? '✅ Found' : '❌ Missing', 
       status.debugInfo.workspace.workspaceRoot || 'None'],
      ['Health', this.getHealthIcon(status.health.overall), 
       `${status.health.metrics?.totalOperations || 0} ops`],
      ['PCL Integration', status.pclIntegration ? '✅ Available' : '❌ Unavailable', '']
    );

    console.log(table.toString());
  }

  private displayHealth(health: any, options: any): void {
    if (options.json) {
      console.log(JSON.stringify(health, null, 2));
      return;
    }

    console.log(`\\n${chalk.bold('Haruspex Health Status')}`);
    console.log(`Overall: ${this.getHealthIcon(health.overall)} ${health.overall.toUpperCase()}`);
    
    if (options.detailed && health.components) {
      console.log('\\nComponent Details:');
      Object.entries(health.components).forEach(([component, status]) => {
        console.log(`  ${component}: ${this.getComponentStatusIcon(status as string)} ${status}`);
      });
    }

    if (health.metrics) {
      console.log(`\\nMetrics:`);
      console.log(`  Operations: ${health.metrics.totalOperations} total, ${health.metrics.successfulOperations} successful`);
      console.log(`  Average Response Time: ${health.metrics.averageResponseTime}ms`);
      console.log(`  Failed Operations: ${health.metrics.failedOperations}`);
    }
  }

  private displayDebugInfo(debugInfo: any, options: any): void {
    if (options.json) {
      console.log(JSON.stringify(debugInfo, null, 2));
      return;
    }

    console.log(`\\n${chalk.bold('Debug Information')}`);
    console.log(`Activation: ${debugInfo.activation.activated ? '✅' : '❌'} ${debugInfo.activation.activated ? 'Success' : 'Failed'}`);
    console.log(`Engine: ${debugInfo.engine.initialized ? '✅' : '❌'} ${debugInfo.engine.initialized ? 'Initialized' : 'Failed'}`);
    console.log(`Workspace: ${debugInfo.workspace.hasWorkspaceFolder ? '✅' : '❌'} ${debugInfo.workspace.hasWorkspaceFolder ? 'Found' : 'Missing'}`);
    
    if (debugInfo.workspace.hasWorkspaceFolder) {
      console.log(`  Files: ${debugInfo.workspace.supportedFiles} supported, ${debugInfo.workspace.haruspexFiles} with stubs`);
    }

    if (debugInfo.activation.errors?.length > 0) {
      console.log(`\\n${chalk.red('Activation Errors:')}`);
      debugInfo.activation.errors.forEach((error: string) => {
        console.log(`  ${chalk.red('•')} ${error}`);
      });
    }

    if (debugInfo.activation.warnings?.length > 0) {
      console.log(`\\n${chalk.yellow('Activation Warnings:')}`);
      debugInfo.activation.warnings.forEach((warning: string) => {
        console.log(`  ${chalk.yellow('•')} ${warning}`);
      });
    }
  }

  private displayMetrics(metrics: any, options: any): void {
    if (options.json) {
      console.log(JSON.stringify(metrics, null, 2));
      return;
    }

    if (options.component) {
      const componentMetrics = metrics[options.component];
      if (componentMetrics) {
        console.log(`\\n${chalk.bold(`${options.component.toUpperCase()} Metrics`)}`);
        console.log(JSON.stringify(componentMetrics, null, 2));
      } else {
        this.output(`Component '${options.component}' not found`, 'error');
      }
      return;
    }

    console.log(`\\n${chalk.bold('Performance Metrics')}`);
    
    if (metrics.operations) {
      console.log(`Operations: ${metrics.operations.totalOperations} total, ${metrics.operations.successfulOperations} successful`);
      console.log(`Response Times: avg ${metrics.operations.responseTimes?.length > 0 ? 
        Math.round(metrics.operations.responseTimes.reduce((a: number, b: number) => a + b, 0) / metrics.operations.responseTimes.length) : 0}ms`);
    }

    if (metrics.circuitBreaker) {
      console.log(`Circuit Breaker: ${metrics.circuitBreaker.state}, ${metrics.circuitBreaker.failures} failures`);
    }

    if (metrics.telemetry) {
      console.log(`Telemetry: ${metrics.telemetry.totalEvents} events collected`);
    }
  }

  private displayStateChange(event: any): void {
    const timestamp = new Date(event.timestamp).toLocaleTimeString();
    console.log(`${chalk.blue('[STATE]')} ${timestamp} ${event.component}.${event.property}: ${event.oldValue} → ${event.newValue}`);
  }

  private displayHealthChange(event: any): void {
    const timestamp = new Date(event.timestamp).toLocaleTimeString();
    console.log(`${chalk.green('[HEALTH]')} ${timestamp} ${event.component}: ${event.oldStatus} → ${event.newStatus}`);
  }

  private displayResult(result: any): void {
    if (typeof result === 'object') {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(result);
    }
  }

  private generateDiagnosticReport(debugInfo: any, health: any, metrics: any): any {
    // Implementation for diagnostic report generation
    return {
      timestamp: Date.now(),
      summary: {
        overall: health.overall,
        activated: debugInfo.activation.activated,
        engineReady: debugInfo.engine.initialized,
        hasWorkspace: debugInfo.workspace.hasWorkspaceFolder
      },
      issues: this.identifyIssues(debugInfo, health, metrics),
      recommendations: this.generateRecommendations(debugInfo, health, metrics)
    };
  }

  private identifyIssues(debugInfo: any, health: any, metrics: any): any[] {
    const issues = [];
    
    if (!debugInfo.activation.activated) {
      issues.push({ severity: 'critical', type: 'activation', message: 'Extension not activated' });
    }
    
    if (!debugInfo.engine.initialized) {
      issues.push({ severity: 'critical', type: 'engine', message: 'Core engine not initialized' });
    }
    
    if (!debugInfo.workspace.hasWorkspaceFolder) {
      issues.push({ severity: 'warning', type: 'workspace', message: 'No workspace folder' });
    }
    
    if (health.overall !== 'healthy') {
      issues.push({ severity: 'warning', type: 'health', message: `Health status: ${health.overall}` });
    }
    
    return issues;
  }

  private generateRecommendations(debugInfo: any, health: any, metrics: any): string[] {
    const recommendations = [];
    
    if (!debugInfo.activation.activated) {
      recommendations.push('Check VSCode extension activation and restart if necessary');
    }
    
    if (!debugInfo.workspace.hasWorkspaceFolder) {
      recommendations.push('Open a workspace folder in VSCode');
    }
    
    if (debugInfo.workspace.haruspexFiles === 0) {
      recommendations.push('Run workspace initialization to add Haruspex documentation stubs');
    }
    
    return recommendations;
  }

  private displayDiagnosticReport(report: any): void {
    console.log(`\\n${chalk.bold('Diagnostic Report')}`);
    console.log(`Generated: ${new Date(report.timestamp).toLocaleString()}`);
    
    console.log(`\\n${chalk.bold('Summary:')}`);
    console.log(`Overall Health: ${this.getHealthIcon(report.summary.overall)} ${report.summary.overall}`);
    console.log(`Extension: ${report.summary.activated ? '✅' : '❌'} ${report.summary.activated ? 'Active' : 'Inactive'}`);
    console.log(`Engine: ${report.summary.engineReady ? '✅' : '❌'} ${report.summary.engineReady ? 'Ready' : 'Not Ready'}`);
    console.log(`Workspace: ${report.summary.hasWorkspace ? '✅' : '❌'} ${report.summary.hasWorkspace ? 'Found' : 'Missing'}`);
    
    if (report.issues.length > 0) {
      console.log(`\\n${chalk.bold('Issues:')}`);
      report.issues.forEach((issue: any) => {
        const icon = issue.severity === 'critical' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵';
        console.log(`  ${icon} ${issue.message}`);
      });
    }
    
    if (report.recommendations.length > 0) {
      console.log(`\\n${chalk.bold('Recommendations:')}`);
      report.recommendations.forEach((rec: string, index: number) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
  }

  private async attemptAutomaticFixes(report: any): Promise<void> {
    console.log(`\\n${chalk.bold('Attempting automatic fixes...')}`);
    
    for (const issue of report.issues) {
      if (issue.type === 'workspace' && !issue.hasWorkspace) {
        console.log('ℹ️  Cannot automatically fix missing workspace - manual action required');
        continue;
      }
      
      // Add more automatic fixes as needed
      console.log(`⚠️  No automatic fix available for: ${issue.message}`);
    }
  }

  private displayWorkspaceAnalysis(analysis: any, options: any): void {
    if (options.json) {
      console.log(JSON.stringify(analysis, null, 2));
      return;
    }

    console.log(`\\n${chalk.bold('Workspace Analysis')}`);
    console.log(`Files: ${analysis.files.length}`);
    console.log(`Languages: ${analysis.languages.join(', ')}`);
    // Add more analysis display logic
  }

  private displayTDDResult(result: any): void {
    console.log(`\\n${chalk.bold('TDD Workflow Result')}`);
    console.log(`Success: ${result.success ? '✅' : '❌'}`);
    console.log(`Artifacts: ${result.artifacts.length}`);
    if (result.qualityScore) {
      console.log(`Quality Score: ${result.qualityScore}`);
    }
    // Add more TDD result display logic
  }

  private showInteractiveHelp(): void {
    console.log(`\\n${chalk.bold('Interactive Commands:')}`);
    console.log('status          - Show current status');
    console.log('health          - Show health information');
    console.log('metrics         - Show performance metrics');
    console.log('refresh         - Refresh all data');
    console.log('diagnose        - Run diagnostics');
    console.log('help            - Show this help');
    console.log('exit/quit       - Exit interactive mode');
  }

  private async executeInteractiveCommand(command: string): Promise<void> {
    const parts = command.split(' ');
    const cmd = parts[0].toLowerCase();
    
    switch (cmd) {
      case 'status':
        await this.statusCommand({ json: false });
        break;
      case 'health':
        await this.healthCommand({ json: false });
        break;
      case 'metrics':
        await this.metricsCommand({ json: false });
        break;
      case 'refresh':
        await this.refreshCommand({});
        break;
      case 'diagnose':
        await this.diagnoseCommand({});
        break;
      default:
        this.output(`Unknown command: ${cmd}. Type "help" for available commands.`, 'warn');
    }
  }

  private displayConfig(): void {
    console.log(`\\n${chalk.bold('CLI Configuration:')}`);
    console.log(`Workspace Path: ${this.config.workspacePath || 'Not set'}`);
    console.log(`Output Format: ${this.config.outputFormat}`);
    console.log(`Log Level: ${this.config.logLevel}`);
    console.log(`Auto Connect: ${this.config.autoConnect}`);
  }

  private displayConfigValue(key: string): void {
    const value = (this.config as any)[key];
    if (value !== undefined) {
      console.log(`${key}: ${value}`);
    } else {
      this.output(`Configuration key '${key}' not found`, 'error');
    }
  }

  private setConfigValue(keyValue: string): void {
    const [key, value] = keyValue.split('=');
    if (!key || value === undefined) {
      this.output('Invalid format. Use key=value', 'error');
      return;
    }
    
    (this.config as any)[key] = value;
    this.output(`Set ${key} = ${value}`, 'success');
  }

  private getHealthIcon(health: string): string {
    switch (health) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'critical': return '❌';
      default: return '❓';
    }
  }

  private getComponentStatusIcon(status: string): string {
    switch (status) {
      case 'operational':
      case 'active':
      case 'monitoring':
      case 'closed':
      case 'compatible':
        return '✅';
      case 'recovering':
      case 'half_open':
      case 'issues':
        return '⚠️';
      case 'failed':
      case 'error':
      case 'stopped':
      case 'open':
        return '❌';
      default:
        return '❓';
    }
  }

  private output(message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info'): void {
    switch (type) {
      case 'success':
        console.log(chalk.green(`✅ ${message}`));
        break;
      case 'warn':
        console.log(chalk.yellow(`⚠️  ${message}`));
        break;
      case 'error':
        console.log(chalk.red(`❌ ${message}`));
        break;
      default:
        console.log(chalk.blue(`ℹ️  ${message}`));
    }
  }

  private log(message: string, level: 'debug' | 'info' | 'warn' | 'error'): void {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const configLevel = levels[this.config.logLevel || 'info'];
    const messageLevel = levels[level];
    
    if (messageLevel >= configLevel) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] ${level.toUpperCase()}: ${message}`);
    }
  }

  /**
   * Run the CLI with provided arguments
   */
  async run(argv: string[] = process.argv): Promise<void> {
    try {
      await this.program.parseAsync(argv);
    } catch (error) {
      this.output(`CLI error: ${error instanceof Error ? error.message : error}`, 'error');
      process.exit(1);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }
}