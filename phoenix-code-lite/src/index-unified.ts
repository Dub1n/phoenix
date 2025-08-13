#!/usr/bin/env node

/**---
 * title: [Phoenix Code Lite - Unified Architecture Entry Point]
 * tags: [Core, Infrastructure, Entry-Point, Unified-Architecture]
 * provides: [Unified CLI Bootstrap, Legacy Mode Bridge, Core Initialization, Unified CLI Launcher]
 * requires: [CoreFoundation, ConfigManager, ErrorHandler, unified-cli, CLI Args]
 * description: [Entry point for running Phoenix Code Lite with the unified architecture, including fallback to legacy initialization; coordinates core setup and unified CLI execution.]
 * ---*/

import { setupCLI } from './cli/args';
import { CoreFoundation } from './core/foundation';
import { ConfigManager } from './core/config-manager';
import { ErrorHandler } from './core/error-handler';
import { runUnifiedCLI, initializeUnifiedPhoenixCLI } from './unified-cli';
import chalk from 'chalk';

let coreFoundation: CoreFoundation;
let configManager: ConfigManager;
let errorHandler: ErrorHandler;

async function initializeCore(): Promise<boolean> {
  try {
    const args = process.argv.slice(2);
    const useUnified = args.includes('--unified') || args.includes('--new-architecture');
    
    if (!useUnified) {
      // Only show initialization messages for legacy mode
      if (args.length > 0) {
        console.log(chalk.blue.bold('* Phoenix Code Lite - Core Infrastructure'));
        console.log(chalk.gray('Legacy Mode with Core Foundation'));
        console.log(chalk.gray('═'.repeat(60)));
      }
      
      // Initialize error handler first
      errorHandler = new ErrorHandler();
      if (args.length > 0) {
        console.log(chalk.green('✓ Error Handler initialized'));
      }
      
      // Initialize configuration manager
      configManager = new ConfigManager();
      const configInitialized = await configManager.initialize();
      
      if (!configInitialized) {
        throw new Error('Configuration initialization failed');
      }
      console.log(chalk.green('✓ Configuration Manager initialized'));
      
      // Initialize core foundation with configuration
      const config = configManager.getConfig();
      coreFoundation = new CoreFoundation(config);
      const coreInitialized = await coreFoundation.initialize();
      
      if (!coreInitialized) {
        throw new Error('Core foundation initialization failed');
      }
      console.log(chalk.green('✓ Core Foundation initialized'));
      
      // Setup configuration change handler
      configManager.onConfigChange('core-foundation', (newConfig) => {
        console.log(chalk.yellow('⇔ Configuration changed, updating core systems...'));
      });
      
      console.log(chalk.gray('═'.repeat(60)));
      console.log(chalk.green.bold('^ Core Infrastructure Ready (Legacy Mode)'));
      console.log();
    }
    
    return true;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(chalk.red('✗ Core initialization failed:'), errorMsg);
    return false;
  }
}

async function shutdown(): Promise<void> {
  console.log(chalk.yellow('\n⇔ Initiating graceful shutdown...'));
  
  try {
    if (configManager) {
      await configManager.shutdown();
      console.log(chalk.green('✓ Configuration Manager shutdown'));
    }
    
    if (errorHandler) {
      await errorHandler.shutdown();
      console.log(chalk.green('✓ Error Handler shutdown'));
    }
    
    if (coreFoundation) {
      await coreFoundation.gracefulShutdown();
    }
    
    console.log(chalk.green('✓ Graceful shutdown completed'));
    
  } catch (error) {
    console.error(chalk.red('✗ Shutdown error:'), error);
    
    const { safeExit } = await import('./utils/test-utils');
    safeExit(1);
  }
}

async function main() {
  try {
    const args = process.argv.slice(2);
    
    // Check for unified architecture flags
    const useLegacy = args.includes('--legacy') || args.includes('--old-architecture');
    const showHelp = args.includes('--help') || args.includes('-h');
    
    if (showHelp && !useLegacy) {
      showMainHelp();
      return;
    }
    
    if (useLegacy) {
      // Use legacy architecture
      const initialized = await initializeCore();
      
      if (!initialized) {
        console.error(chalk.red('✗ Failed to initialize core infrastructure'));
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
      
      if (args.length === 0) {
        // Start persistent CLI session with core foundation access
        const { CLISession } = await import('./cli/session');
        const session = new CLISession();
        
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
        
        await shutdown();
        
        const { safeExit } = await import('./utils/test-utils');
        safeExit(0);
      }
      return;
    }
    
    // Use unified architecture (default)
    console.log(chalk.blue.bold('* Phoenix Code Lite - Unified Architecture'));
    console.log(chalk.gray('Decoupled CLI with seamless mode switching'));
    console.log(chalk.gray('═'.repeat(60)));
    
    // Parse unified CLI specific flags
    let initialMode: 'interactive' | 'command' = 'interactive';
    let debugMode = false;
    
    if (args.includes('--command-mode') || args.includes('-c')) {
      initialMode = 'command';
    }
    
    if (args.includes('--debug') || args.includes('-d')) {
      debugMode = true;
    }
    
    // Initialize unified CLI (uses settings-based configuration)
    await initializeUnifiedPhoenixCLI();
    return;
    
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

function showMainHelp(): void {
  console.log(chalk.blue.bold('* Phoenix Code Lite - Entry Point Selection'));
  console.log(chalk.gray('Choose between Legacy and Unified Architecture'));
  console.log();
  console.log(chalk.yellow('Legacy Mode (Default):'));
  console.log('  npm start                    Start interactive session with legacy architecture');
  console.log('  npm start [command] [args]   Run command with legacy CLI');
  console.log();
  console.log(chalk.yellow('Unified Mode (Experimental):'));
  console.log('  npm start --unified          Start with new unified architecture');
  console.log('  npm start --unified -i       Start in interactive mode');
  console.log('  npm start --unified -c       Start in command mode');
  console.log('  npm start --unified -d       Start with debug mode');
  console.log();
  console.log(chalk.yellow('Architecture Comparison:'));
  console.log(chalk.green('  Legacy Mode:'));
  console.log('    • Existing implementation with scattered menu definitions');
  console.log('    • Mode-specific interaction handling');
  console.log('    • Command processing mixed with UI concerns');
  console.log();
  console.log(chalk.blue('  Unified Mode:'));
  console.log('    • Decoupled menu definitions work with all interaction modes');
  console.log('    • Seamless switching between interactive and command modes');
  console.log('    • Clean separation of concerns with unified command registry');
  console.log('    • Skins system ready for domain-specific customization');
  console.log();
  console.log(chalk.gray('The unified architecture is the future - test it with --unified flag'));
}

if (require.main === module) {
  main();
}

export { 
  setupCLI, 
  CoreFoundation, 
  ConfigManager, 
  ErrorHandler,
  initializeUnifiedPhoenixCLI 
};
