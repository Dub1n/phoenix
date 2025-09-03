/**
 * Minimal Templum Backend Example
 * A simple HTTP-based backend that demonstrates Templum integration
 * 
 * This backend is TRULY SELF-CONTAINED - no external configuration required!
 * Templum will automatically discover this backend via port scanning on port 3001.
 * 
 * This backend implements the minimal requirements for Templum integration:
 * 1. Skin definition endpoint (/getSkinDefinition) - tells Templum how to integrate
 * 2. Command execution endpoint (/executeCommand) - handles all commands
 * 3. Health check endpoint (/health) - for service discovery and monitoring
 * 
 * ENHANCED DISCOVERY: Auto-registers with Templum's enhanced discovery system.
 * - Creates service file at ~/.templum/services/minimal-example-{pid}.json  
 * - Works on ANY PORT (not limited to scan ports)
 * - Auto-cleanup when process exits
 * - Fallback to port scanning if auto-registration fails
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const app = express();

// Use any available port - the enhanced discovery system will find us!
const port = process.env.PORT || 3004;

// Enable JSON parsing
app.use(express.json());

// Add CORS headers for browser compatibility
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

/**
 * Skin Definition - tells Templum how to integrate with this backend
 * This follows the UniversalSkinDefinition schema from Templum 1.2
 */
const SKIN_DEFINITION = {
  // Metadata structure expected by TemplumCore
  metadata: {
    id: "minimal-example",
    name: "Minimal Example Backend", 
    version: "1.0.0",
    description: "A minimal backend demonstrating Templum integration",
    compatibleInterfaces: ["cli", "vscode", "command"],
    backend: "minimal-example"
  },
  
  // Backend configuration for Templum's connection factory
  backendConfig: {
    service: "minimal-example",
    protocol: "http",
    endpoint: `http://localhost:${port}`,
    authentication: {
      type: "none"
    },
    capabilities: ["getSkinDefinition", "executeCommand", "health"],
    timeout: 5000
  },
  
  // Commands this backend provides
  commands: {
    "example.hello": {
      id: "example.hello",
      label: "Say Hello",
      description: "Returns a personalized hello message",
      parameters: [
        {
          name: "name",
          type: "string",
          description: "Name to greet (optional)",
          required: false,
          defaultValue: "World"
        }
      ]
    },
    "example.status": {
      id: "example.status",
      label: "Get Status", 
      description: "Returns the current backend status",
      parameters: []
    }
  },
  
  // UI definitions for different interfaces
  views: {
    treeViews: [{
      id: "exampleTree",
      name: "Example Backend",
      contextValue: "example",
      description: "Minimal example backend services"
    }]
  },
  
  // Menu structure for CLI interface
  menus: {
    main: {
      title: "Minimal Example",
      description: "Simple backend for testing Templum integration",
      items: [
        {
          label: "Say Hello",
          command: "example.hello",
          description: "Get a hello message"
        },
        {
          label: "Check Status",
          command: "example.status", 
          description: "View backend status"
        }
      ]
    }
  }
};

/**
 * Backend state for demonstration
 */
let backendState = {
  startTime: Date.now(),
  requestCount: 0,
  lastCommand: null
};

// Middleware to track requests
app.use((req, res, next) => {
  backendState.requestCount++;
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

/**
 * Health check endpoint - required for service discovery
 */
app.get('/health', (req, res) => {
  const uptime = Date.now() - backendState.startTime;
  res.json({
    status: "healthy",
    service: "minimal-example",
    version: "1.0.0",
    uptime: Math.floor(uptime / 1000),
    timestamp: Date.now(),
    requests: backendState.requestCount
  });
});

/**
 * Skin definition endpoint - tells Templum how to integrate
 * This is called by Templum's service discovery system
 */
app.get('/getSkinDefinition', (req, res) => {
  console.log('Serving skin definition to Templum');
  res.json(SKIN_DEFINITION);
});

/**
 * Command execution endpoint - handles all command requests from Templum
 * This is where the actual backend logic lives
 */
app.post('/executeCommand', (req, res) => {
  const { command, args = {} } = req.body;
  
  console.log(`Executing command: ${command}`, args);
  backendState.lastCommand = { command, args, timestamp: Date.now() };
  
  try {
    switch (command) {
      case 'example.hello':
        const name = args.name || 'World';
        const message = `Hello, ${name}! This is a minimal Templum backend.`;
        
        res.json({
          success: true,
          result: {
            message,
            timestamp: new Date().toISOString(),
            backend: "minimal-example"
          }
        });
        break;
        
      case 'example.status':
        const uptime = Date.now() - backendState.startTime;
        
        res.json({
          success: true,
          result: {
            status: "running",
            uptime: Math.floor(uptime / 1000),
            requests: backendState.requestCount,
            lastCommand: backendState.lastCommand,
            memoryUsage: process.memoryUsage()
          }
        });
        break;
        
      default:
        res.status(400).json({
          success: false,
          error: `Unknown command: ${command}`,
          availableCommands: Object.keys(SKIN_DEFINITION.commands)
        });
        break;
    }
  } catch (error) {
    console.error('Command execution error:', error);
    res.status(500).json({
      success: false,
      error: `Command execution failed: ${error.message}`
    });
  }
});

/**
 * Root endpoint - provides basic info about the backend
 */
app.get('/', (req, res) => {
  res.json({
    service: "minimal-example",
    description: "Minimal Templum Backend Example",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      skinDefinition: "/getSkinDefinition", 
      executeCommand: "/executeCommand"
    },
    templumCompatible: true
  });
});

/**
 * Auto-registration system for enhanced discovery
 */
function autoRegisterService() {
  try {
    // Create services directory in VDL_Vault root (multi-repo shared location)
    // Navigate up from examples/minimal-backend to VDL_Vault root
    const vdlVaultRoot = path.join(__dirname, '..', '..', '..');
    const servicesDir = path.join(vdlVaultRoot, '.templum', 'services');
    if (!fs.existsSync(servicesDir)) {
      fs.mkdirSync(servicesDir, { recursive: true });
    }

    // Create service registration file
    const serviceFile = path.join(servicesDir, `minimal-example-${process.pid}.json`);
    const serviceInfo = {
      id: 'minimal-example',
      name: 'Minimal Example Backend',
      version: '1.0.0',
      pid: process.pid,
      endpoint: `http://localhost:${port}`,
      protocol: 'http',
      health: `http://localhost:${port}/health`,
      capabilities: ['getSkinDefinition', 'executeCommand', 'health'],
      started: Date.now(),
      port: port
    };

    fs.writeFileSync(serviceFile, JSON.stringify(serviceInfo, null, 2));
    console.log(`📝 Auto-registered service: ${serviceFile}`);
    
    // Auto-cleanup on exit
    const cleanup = () => {
      try {
        if (fs.existsSync(serviceFile)) {
          fs.unlinkSync(serviceFile);
          console.log('🗑️ Removed service registration file');
        }
      } catch (error) {
        console.warn('Warning: Could not remove service file:', error.message);
      }
    };

    process.on('exit', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('SIGUSR1', cleanup); // nodemon restart
    process.on('SIGUSR2', cleanup); // nodemon restart

    return serviceFile;
  } catch (error) {
    console.warn('Warning: Auto-registration failed:', error.message);
    console.warn('Templum can still discover this backend via port scanning');
    return null;
  }
}

/**
 * Start the server
 */
app.listen(port, 'localhost', () => {
  console.log('='.repeat(60));
  console.log('🌟 Minimal Templum Backend Started');
  console.log('='.repeat(60));
  console.log(`🚀 Server running at: http://localhost:${port}`);
  console.log(`🔗 Skin Definition: http://localhost:${port}/getSkinDefinition`);
  console.log(`❤️ Health Check: http://localhost:${port}/health`);
  console.log('📋 Available Commands:');
  console.log('  - example.hello (name?: string)');
  console.log('  - example.status');
  console.log('='.repeat(60));
  
  // Auto-register with enhanced discovery system
  const serviceFile = autoRegisterService();
  if (serviceFile) {
    console.log('✨ Enhanced Discovery: AUTO-REGISTERED');
    console.log(`   Service file: ${path.basename(serviceFile)}`);
    console.log('   Templum will discover instantly on ANY PORT!');
  } else {
    console.log('⚠️ Fallback Discovery: PORT SCANNING');
    console.log('   Templum will find via port scanning (limited ports)');
  }
  
  console.log('='.repeat(60));
  console.log('🎯 Ready for Templum integration!');
  console.log('   Start Templum to automatically discover this backend.');
  console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down minimal backend...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down minimal backend...');
  process.exit(0);
});
