#!/usr/bin/env node

import { setupCLI } from './cli/args';
import { CoreFoundation } from './core/foundation';
import { ConfigManager } from './core/config-manager';
import { ErrorHandler } from './core/error-handler';
import { ClaudeCodeClient } from './claude/client';
import { AuditLogger } from './utils/audit-logger';
import { CommandFactory } from './cli/factories/command-factory';
import { InteractiveSession } from './cli/interactive/interactive-session';
import { ClaudeClientAdapter } from './cli/adapters/claude-client-adapter';
import { ConfigManagerAdapter } from './cli/adapters/config-manager-adapter';
import { AuditLoggerAdapter } from './cli/adapters/audit-logger-adapter';
import { IConfigManager } from './cli/interfaces/config-manager';
import { IAuditLogger } from './cli/interfaces/audit-logger';
import { IClaudeClient } from './cli/interfaces/claude-client';
import { IFileSystem } from './cli/interfaces/file-system';
import { FileSystem } from './utils/file-system';
import chalk from 'chalk';

/**
 * Phoenix Code Lite - Dependency Injection Architecture
 * 
 * This is the main entry point that uses dependency injection patterns
 * to create a more testable and maintainable CLI architecture.
 */

let coreFoundation: CoreFoundation;
let configManager: ConfigManager;
let errorHandler: ErrorHandler;

async function initializeCore(): Promise<boolean> {
  try {
    console.log(chalk.blue.bold('🔥 Phoenix Code Lite - Phase 1 Initialization'));
    console.log(chalk.gray('═'.repeat(60)));
    
    // Initialize error handler first
    errorHandler = new ErrorHandler();
    console.log(chalk.green('✅ Error Handler initialized'));
    
    // Initialize configuration manager
    configManager = new ConfigManager();
    const configInitialized = await configManager.initialize();
    
    if (!configInitialized) {
      throw new Error('Configuration initialization failed');
    }
    console.log(chalk.green('✅ Configuration Manager initialized'));
    
    // Initialize core foundation with configuration
    const config = configManager.getConfig();
    coreFoundation = new CoreFoundation(config);
    const coreInitialized = await coreFoundation.initialize();
    
    if (!coreInitialized) {
      throw new Error('Core foundation initialization failed');
    }
    console.log(chalk.green('✅ Core Foundation initialized'));
    
    console.log(chalk.gray('═'.repeat(60)));
    console.log(chalk.green.bold('🚀 Phase 1 Core Infrastructure Ready'));
    console.log();
    
    return true;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(chalk.red('❌ Core initialization failed:'), errorMsg);
    return false;
  }
}

async function shutdown(): Promise<void> {
  console.log(chalk.yellow('\n🔄 Initiating graceful shutdown...'));
  
  try {
    if (configManager) {
      await configManager.shutdown();
      console.log(chalk.green('✅ Configuration Manager shutdown'));
    }
    
    if (errorHandler) {
      await errorHandler.shutdown();
      console.log(chalk.green('✅ Error Handler shutdown'));
    }
    
    if (coreFoundation) {
      await coreFoundation.gracefulShutdown();
    }
    
    console.log(chalk.green('✅ Graceful shutdown completed'));
    
  } catch (error) {
    console.error(chalk.red('❌ Shutdown error:'), error);
    
    // Use safeExit to handle test environments properly
    const { safeExit } = await import('./utils/test-utils');
    safeExit(1);
  }
}

async function createDependencies(): Promise<{
  configManager: IConfigManager;
  auditLogger: IAuditLogger;
  claudeClient: IClaudeClient;
  fileSystem: IFileSystem;
}> {
  // Create real dependencies
  const realConfigManager = configManager;
  const realAuditLogger = new AuditLogger('main-process');
  const realClaudeClient = new ClaudeCodeClient();
  const realFileSystem = new FileSystem();

  // Create adapters
  const configAdapter = new ConfigManagerAdapter(realConfigManager);
  const auditAdapter = new AuditLoggerAdapter(realAuditLogger);
  const claudeAdapter = new ClaudeClientAdapter(realClaudeClient);

  return {
    configManager: configAdapter,
    auditLogger: auditAdapter,
    claudeClient: claudeAdapter,
    fileSystem: realFileSystem
  };
}

async function main() {
  try {
    // Initialize Phase 1 core infrastructure
    const initialized = await initializeCore();
    
    if (!initialized) {
      console.error(chalk.red('❌ Failed to initialize core infrastructure'));
      process.exit(1);
    }
    
    // Setup graceful shutdown handlers
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', async (error) => {
      if (errorHandler) {
        await errorHandler.handleError(error, {
          source: 'main-process',
          category: 'system' as any,
          severity: 'critical' as any
        });
      }
      await shutdown();
    });
    
    // Create dependencies using dependency injection
    const dependencies = await createDependencies();
    
    // Create command factory with real dependencies
    const commandFactory = new CommandFactory(
      dependencies.configManager,
      dependencies.auditLogger,
      dependencies.claudeClient,
      dependencies.fileSystem
    );

    // Handle command line arguments
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      // Interactive mode
      const session = new InteractiveSession(
        commandFactory,
        dependencies.auditLogger,
        dependencies.configManager
      );
      await session.start();
    } else {
      // Command mode
      const command = args[0];
      const commandArgs = args.slice(1);

      switch (command) {
        case 'config':
          const configCmd = commandFactory.createConfigCommand();
          await configCmd.execute(commandArgs);
          break;
        case 'help':
          const helpCmd = commandFactory.createHelpCommand();
          await helpCmd.execute(commandArgs);
          break;
        case 'version':
          const versionCmd = commandFactory.createVersionCommand();
          await versionCmd.execute(commandArgs);
          break;
        case 'generate':
          // For generate command, we need to parse options
          const program = setupCLI();
          await program.parseAsync(process.argv);
          break;
        case 'init':
          const initCmd = commandFactory.createInitCommand();
          await initCmd.execute(commandArgs);
          break;
        default:
          console.log(`Unknown command: ${command}`);
          console.log('Use "help" for available commands');
          process.exit(1);
      }
    }

    // Clean shutdown
    await dependencies.auditLogger.destroy();
    const { safeExit } = await import('./utils/test-utils');
    safeExit(0);
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    
    if (errorHandler) {
      await errorHandler.handleError(error as Error, {
        source: 'main-process',
        category: 'system' as any,
        severity: 'high' as any
      });
    }
    
    console.error(chalk.red('Phoenix-Code-Lite failed:'), errorMsg);
    await shutdown();
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { 
  setupCLI, 
  CoreFoundation, 
  ConfigManager, 
  ErrorHandler 
}; 