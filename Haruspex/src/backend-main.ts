/**---
 * title: [Haruspex 2.1 Backend Service - Standalone Entry Point]
 * tags: [Backend, Main, Entry-Point, Templum-Compatible, Pure-Backend]
 * provides: [Standalone-Backend-Service, Templum-Integration, Independent-Runtime]
 * requires: [HaruspexBackendService, Configuration, Node-Runtime]
 * description: [Standalone entry point for Haruspex 2.1 backend service, designed for Templum integration and pure backend operation without VSCode dependencies]
 * ---*/

import { HaruspexBackendService } from './haruspex-backend-service';
import { HaruspexServiceConfig } from './api/types/api-contracts';

/**
 * Default configuration for Haruspex 2.1 Backend Service
 * Optimized for Templum compatibility and standalone operation
 */
const defaultConfig: HaruspexServiceConfig = {
  // API Gateway configuration - HTTP-first for Templum compatibility
  api: {
    http: {
      port: parseInt(process.env.HARUSPEX_HTTP_PORT || '3002'),
      cors: true,
      rateLimit: {
        requests: 1000,
        windowMs: 60000 // 1 minute
      }
    },
    websocket: {
      port: parseInt(process.env.HARUSPEX_WS_PORT || '3003'),
      heartbeat: 30000,
      maxClients: 100
    },
    ipc: {
      port: parseInt(process.env.HARUSPEX_IPC_PORT || '3001'),
      timeout: 30000,
      maxConnections: 50
    }
  },

  // Analysis configuration
  analysis: {
    maxConcurrentAnalyses: 10,
    timeoutMs: 30000,
    cacheEnabled: true,
    cacheTtlMs: 3600000 // 1 hour
  },

  // Prediction configuration
  prediction: {
    modelsPath: process.env.HARUSPEX_MODELS_PATH || './models',
    confidenceThreshold: 0.7,
    maxPredictionTime: 15000
  },

  // Diagnostics and monitoring
  diagnostics: {
    healthCheckInterval: 30000, // 30 seconds
    metricsRetention: 86400000, // 24 hours
    alertThresholds: {
      memoryUsageMB: 512,
      responseTimeMs: 5000,
      errorRate: 0.1
    }
  }
};

/**
 * Parse command line arguments for configuration overrides
 */
function parseCommandLineArgs(): Partial<HaruspexServiceConfig> {
  const args = process.argv.slice(2);
  const config: Partial<HaruspexServiceConfig> = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--port':
      case '-p':
        if (args[i + 1]) {
          if (!config.api) {
            config.api = {
              http: { port: 0, cors: false, rateLimit: { requests: 0, windowMs: 0 } },
              websocket: { port: 0, heartbeat: 0, maxClients: 0 },
              ipc: { port: 0, timeout: 0, maxConnections: 0 }
            };
          }
          if (!config.api.http) {
            config.api.http = { port: 0, cors: false, rateLimit: { requests: 0, windowMs: 0 } };
          }
          config.api.http.port = parseInt(args[i + 1]);
          i++; // Skip next argument as it's the value
        }
        break;
      case '--ws-port':
        if (args[i + 1]) {
          if (!config.api) {
            config.api = {
              http: { port: 0, cors: false, rateLimit: { requests: 0, windowMs: 0 } },
              websocket: { port: 0, heartbeat: 0, maxClients: 0 },
              ipc: { port: 0, timeout: 0, maxConnections: 0 }
            };
          }
          if (!config.api.websocket) {
            config.api.websocket = { port: 0, heartbeat: 0, maxClients: 0 };
          }
          config.api.websocket.port = parseInt(args[i + 1]);
          i++;
        }
        break;
      case '--ipc-port':
        if (args[i + 1]) {
          if (!config.api) {
            config.api = {
              http: { port: 0, cors: false, rateLimit: { requests: 0, windowMs: 0 } },
              websocket: { port: 0, heartbeat: 0, maxClients: 0 },
              ipc: { port: 0, timeout: 0, maxConnections: 0 }
            };
          }
          if (!config.api.ipc) {
            config.api.ipc = { port: 0, timeout: 0, maxConnections: 0 };
          }
          config.api.ipc.port = parseInt(args[i + 1]);
          i++;
        }
        break;
    }
  }

  return config;
}

/**
 * Merge configurations with precedence: CLI args > environment variables > defaults
 */
function createServiceConfig(): HaruspexServiceConfig {
  const cliConfig = parseCommandLineArgs();
  
  // Deep merge configurations
  const mergedConfig = {
    ...defaultConfig,
    ...cliConfig,
    api: {
      ...defaultConfig.api,
      ...cliConfig.api,
      http: {
        ...defaultConfig.api.http,
        ...cliConfig.api?.http
      },
      websocket: {
        ...defaultConfig.api.websocket,
        ...cliConfig.api?.websocket
      },
      ipc: {
        ...defaultConfig.api.ipc,
        ...cliConfig.api?.ipc
      }
    },
    analysis: {
      ...defaultConfig.analysis,
      ...cliConfig.analysis
    },
    prediction: {
      ...defaultConfig.prediction,
      ...cliConfig.prediction
    },
    diagnostics: {
      ...defaultConfig.diagnostics,
      ...cliConfig.diagnostics
    }
  };

  return mergedConfig;
}

/**
 * Setup graceful shutdown handling
 */
function setupGracefulShutdown(backendService: HaruspexBackendService): void {
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    try {
      await backendService.shutdown();
      console.log('Haruspex Backend Service shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Handle various shutdown signals
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGUSR2', () => shutdown('SIGUSR2')); // nodemon restart

  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    shutdown('UNCAUGHT_EXCEPTION');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown('UNHANDLED_REJECTION');
  });
}

/**
 * Main entry point for Haruspex 2.1 Backend Service
 * 
 * This function creates and starts the backend service in standalone mode,
 * compatible with Templum 2.1 orchestrator and independent of VSCode runtime.
 */
async function main(): Promise<void> {
  console.log('🚀 Starting Haruspex 2.1 Backend Service...');
  console.log(`📦 Version: 2.1.0`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔧 Node.js: ${process.version}`);
  console.log(`📍 Working Directory: ${process.cwd()}`);

  try {
    // Create service configuration
    const config = createServiceConfig();
    console.log(`🌐 HTTP Server: http://localhost:${config.api.http.port}`);
    console.log(`🔌 WebSocket Server: ws://localhost:${config.api.websocket.port}`);
    
    // Initialize the backend service
    const backendService = new HaruspexBackendService(config);
    
    // Setup graceful shutdown
    setupGracefulShutdown(backendService);
    
    // Setup service event handlers
    backendService.on('initialized', (event) => {
      console.log(`✅ Service initialized successfully in ${event.initializationTime}ms`);
      console.log(`🎯 Templum Registration: ${backendService.hasUIComponents() ? 'UI Mode' : 'Pure Backend Mode'}`);
      console.log(`📊 API Endpoints: ${backendService.getApiEndpoints().join(', ')}`);
      console.log(`🏥 Health Check: http://localhost:${config.api.http.port}/health`);
      console.log(`🎭 Skin Definition: http://localhost:${config.api.http.port}/getSkinDefinition`);
      console.log(`⚡ Command Execution: http://localhost:${config.api.http.port}/executeCommand`);
      console.log(`\n🎉 Haruspex 2.1 Backend Service is ready for Templum integration!`);
    });

    backendService.on('initializationFailed', (event) => {
      console.error(`❌ Service initialization failed: ${event.error}`);
      process.exit(1);
    });

    backendService.on('statusChanged', (event) => {
      console.log(`📊 Status changed: ${event.previousStatus} → ${event.newStatus}`);
    });

    backendService.on('systemAlert', (alert) => {
      console.warn(`⚠️ System alert:`, alert);
    });

    backendService.on('healthWarning', (warning) => {
      console.warn(`🏥 Health warning: ${warning.type} = ${warning.value} (threshold: ${warning.threshold})`);
    });

    // Start the service
    await backendService.initialize();

  } catch (error) {
    console.error('❌ Failed to start Haruspex Backend Service:', error);
    process.exit(1);
  }
}

// Start the service if this file is run directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

// Export for programmatic use
export { main as startBackendService, defaultConfig };