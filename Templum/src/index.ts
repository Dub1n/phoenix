/**---
 * title: [Templum Main Entry Point - Universal Interface Orchestrator]
 * tags: [Entry-Point, CLI, Main, Orchestration]
 * provides: [Main Application Entry, CLI Interface, Core Initialization]
 * requires: [TemplumCore, CLI Arguments, Configuration]
 * description: [Main entry point for Templum universal interface orchestrator application]
 * ---*/

import { TemplumCore } from './core/templum-core';
import { TemplumConfiguration } from './types/templum-types';
import { createLogger, normalizeLoggerError } from './utils/logger';

const templumLogger = createLogger('templum-main');

/**
 * Main entry point for Templum Universal Interface Orchestrator
 */
export async function main(): Promise<void> {
  templumLogger.info('Templum Universal Interface Orchestrator v1.0.0 starting');
  templumLogger.info('Universal interface orchestrator for multi-backend services');

  try {
    // Initialize configuration
    const config: TemplumConfiguration = {
      maxConcurrentSessions: 10,
      sessionTimeoutMs: 3600000, // 1 hour
      enableHealthMonitoring: true,
      performanceMetrics: true,
      backendDiscovery: {
        enabled: true,
        interval: 30000
      }
    };

    // Create and initialize Templum Core
    const templumCore = new TemplumCore(config);
    
    templumLogger.info('Initializing Templum Core Engine');
    await templumCore.initialize();

    // Display system status
    const systemStatus = templumCore.getSystemStatus();
    templumLogger.info('Templum Core Engine initialized successfully', {
      supportedInterfaces: templumCore.getSupportedInterfaces(),
      loadedSkinCount: systemStatus.coreEngine.loadedSkins.length,
      activeInterfaceCount: systemStatus.coreEngine.activeInterfaces.length
    });

    // TASK-CLI-004: Headless Service - CLI interface now runs in separate process
    templumLogger.info('Running in headless service mode', {
      accessInstructions: 'Use "templum" command to access CLI interface'
    });
    
    // Register service for CLI discovery (IPC-based service registration)
    await templumCore.registerForCliDiscovery();

    // Setup graceful shutdown
    process.on('SIGINT', async () => {
      templumLogger.warn('Shutting down Templum due to SIGINT');
      await templumCore.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      templumLogger.warn('Shutting down Templum due to SIGTERM');
      await templumCore.shutdown();
      process.exit(0);
    });

    templumLogger.info('Templum headless service is ready', {
      instructions: 'Use "templum" command for CLI access. Press Ctrl+C to exit.'
    });
    
    // Keep the process running
    process.stdin.resume();

  } catch (error) {
    const { error: normalizedError, data } = normalizeLoggerError(error);
    templumLogger.error('Failed to start Templum', normalizedError, data);
    process.exit(1);
  }
}

// Export the main classes for library usage
export { TemplumCore } from './core/templum-core';
export * from './types/templum-types';
/* export * from './agents'; */

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    const { error: normalizedError, data } = normalizeLoggerError(error);
    templumLogger.error('Fatal error while executing main', normalizedError, data);
    process.exit(1);
  });
}
