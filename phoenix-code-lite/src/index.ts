#!/usr/bin/env node

import { setupCLI } from './cli/args';
import { CoreFoundation } from './core/foundation';
import { ConfigManager } from './core/config-manager';
import { ErrorHandler } from './core/error-handler';
import chalk from 'chalk';

/**
 * Phoenix Code Lite - Phase 1 Core Infrastructure
 * 
 * This is the main entry point that initializes the core foundation
 * including session management, dual mode architecture, configuration
 * management, and comprehensive error handling.
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
    
    // Setup configuration change handler
    configManager.onConfigChange('core-foundation', (newConfig) => {
      console.log(chalk.yellow('🔄 Configuration changed, updating core systems...'));
      // In a real implementation, you might restart components or apply changes
    });
    
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
    
    // Check if running in interactive mode (no arguments or just the executable)
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      // Start persistent CLI session with core foundation access
      const { CLISession } = await import('./cli/session');
      const session = new CLISession();
      
      // Provide access to core components through session context
      session.updateContext({
        data: {
          coreFoundation,
          configManager,
          errorHandler,
          systemStatus: coreFoundation.getSystemStatus()
        }
      });
      
      await session.start();
    } else {
      // Use traditional command-line mode
      const program = setupCLI();
      await program.parseAsync(process.argv);
      
      // Clean up resources before exit in non-interactive mode
      // This ensures timers and event listeners are properly disposed
      await shutdown();
      
      // Exit after command completion and cleanup
      // Use safeExit to handle test environments properly
      const { safeExit } = await import('./utils/test-utils');
      safeExit(0);
    }
    
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