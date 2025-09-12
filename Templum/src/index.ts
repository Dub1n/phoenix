/**---
 * title: [Templum Main Entry Point - Universal Interface Orchestrator]
 * tags: [Entry-Point, CLI, Main, Orchestration]
 * provides: [Main Application Entry, CLI Interface, Core Initialization]
 * requires: [TemplumCore, CLI Arguments, Configuration]
 * description: [Main entry point for Templum universal interface orchestrator application]
 * ---*/

import { TemplumCore } from './core/templum-core';
import { TemplumConfiguration } from './types/templum-types';

/**
 * Main entry point for Templum Universal Interface Orchestrator
 */
export async function main(): Promise<void> {
  console.log('🌟 Templum Universal Interface Orchestrator v1.0.0');
  console.log('Universal interface orchestrator for multi-backend services');

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
    
    console.log('🔧 Initializing Templum Core Engine...');
    await templumCore.initialize();

    // Display system status
    const systemStatus = templumCore.getSystemStatus();
    console.log('✅ Templum Core Engine initialized successfully');
    console.log(`📊 Supported interfaces: ${templumCore.getSupportedInterfaces().join(', ')}`);
    console.log(`🎨 Loaded skins: ${systemStatus.coreEngine.loadedSkins.length}`);
    console.log(`🔗 Active interfaces: ${systemStatus.coreEngine.activeInterfaces.length}`);

    // TASK-CLI-004: Headless Service - CLI interface now runs in separate process
    console.log('🔧 Running in headless service mode...');
    console.log('💡 Use "templum" command to access CLI interface');
    
    // Register service for CLI discovery (IPC-based service registration)
    await templumCore.registerForCliDiscovery();

    // Setup graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down Templum...');
      await templumCore.shutdown();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down Templum...');
      await templumCore.shutdown();
      process.exit(0);
    });

    console.log('🚀 Templum headless service is ready! Use "templum" command for CLI access. Press Ctrl+C to exit.');
    
    // Keep the process running
    process.stdin.resume();

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Failed to start Templum:', errorMessage);
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
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
