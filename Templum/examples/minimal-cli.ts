#!/usr/bin/env node

/**
 * title: [Minimal Templum CLI - Direct Backend Testing]
 * tags: [CLI, Testing, Minimal-Implementation, Backend-Integration]
 * provides: [Direct-Command-Execution, Backend-Discovery, Simple-Interface]
 * requires: [HTTP-Backend, Service-Discovery, Command-Routing]
 * description: [Simple CLI for directly testing Templum backend integration without full Templum complexity]
 */

import * as http from 'http';
import { program } from 'commander';

/**
 * Simple HTTP client for backend communication
 */
class MinimalBackendClient {
  constructor(private baseUrl: string = 'http://localhost:3001') {}

  /**
   * Make HTTP request to backend
   */
  private async makeRequest(method: string, path: string, data?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: method,
        headers: {
          'Content-Type': 'application/json'
        }
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const response = JSON.parse(body);
            resolve(response);
          } catch (error) {
            reject(new Error(`Invalid JSON response: ${body}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * Get backend health status
   */
  async getHealth(): Promise<any> {
    return this.makeRequest('GET', '/health');
  }

  /**
   * Get backend skin definition
   */
  async getSkinDefinition(): Promise<any> {
    return this.makeRequest('GET', '/getSkinDefinition');
  }

  /**
   * Execute a command on the backend
   */
  async executeCommand(command: string, args: Record<string, any> = {}): Promise<any> {
    return this.makeRequest('POST', '/executeCommand', { command, args });
  }
}

/**
 * CLI Helper functions
 */
function formatResult(result: any): string {
  if (typeof result === 'string') {
    return result;
  }
  
  if (result && typeof result === 'object') {
    return JSON.stringify(result, null, 2);
  }
  
  return String(result);
}

function displaySuccess(message: string, data?: any): void {
  console.log(`✅ ${message}`);
  if (data) {
    console.log(formatResult(data));
  }
}

function displayError(message: string, error?: any): void {
  console.error(`❌ ${message}`);
  if (error) {
    console.error(`   ${error.message || error}`);
  }
}

/**
 * CLI Commands
 */
async function runHealthCheck(): Promise<void> {
  const client = new MinimalBackendClient();
  
  try {
    console.log('🔍 Checking backend health...');
    const health = await client.getHealth();
    displaySuccess('Backend is healthy!', health);
  } catch (error) {
    displayError('Backend health check failed', error);
    process.exit(1);
  }
}

async function runDiscovery(): Promise<void> {
  const client = new MinimalBackendClient();
  
  try {
    console.log('🔍 Discovering backend capabilities...');
    const skinDef = await client.getSkinDefinition();
    
    console.log(`\n📋 Backend: ${skinDef.name} v${skinDef.version}`);
    console.log(`📝 Description: ${skinDef.description}`);
    console.log('\n🔧 Available Commands:');
    
    Object.entries(skinDef.commands || {}).forEach(([id, cmd]: [string, any]) => {
      console.log(`  • ${cmd.label} (${id})`);
      console.log(`    ${cmd.description}`);
      
      if (cmd.parameters && cmd.parameters.length > 0) {
        console.log('    Parameters:');
        cmd.parameters.forEach((param: any) => {
          const required = param.required ? '*' : '';
          const defaultVal = param.defaultValue ? ` (default: ${param.defaultValue})` : '';
          console.log(`      - ${param.name}${required}: ${param.type} - ${param.description}${defaultVal}`);
        });
      }
      console.log('');
    });
    
  } catch (error) {
    displayError('Backend discovery failed', error);
    process.exit(1);
  }
}

async function runHelloCommand(name?: string): Promise<void> {
  const client = new MinimalBackendClient();
  
  try {
    console.log('👋 Saying hello...');
    const args = name ? { name } : {};
    const response = await client.executeCommand('example.hello', args);
    
    if (response.success) {
      displaySuccess('Command executed successfully!');
      console.log(`💬 ${response.result.message}`);
      console.log(`🕒 ${response.result.timestamp}`);
      console.log(`🔗 Backend: ${response.result.backend}`);
    } else {
      displayError('Command execution failed', response.error);
      process.exit(1);
    }
  } catch (error) {
    displayError('Failed to execute hello command', error);
    process.exit(1);
  }
}

async function runStatusCommand(): Promise<void> {
  const client = new MinimalBackendClient();
  
  try {
    console.log('📊 Getting backend status...');
    const response = await client.executeCommand('example.status');
    
    if (response.success) {
      displaySuccess('Status retrieved successfully!');
      const status = response.result;
      
      console.log(`\n📈 Backend Status:`);
      console.log(`   Status: ${status.status}`);
      console.log(`   Uptime: ${status.uptime}s`);
      console.log(`   Requests: ${status.requests}`);
      
      if (status.lastCommand) {
        console.log(`   Last Command: ${status.lastCommand.command} (${new Date(status.lastCommand.timestamp).toLocaleString()})`);
      }
      
      if (status.memoryUsage) {
        const mb = (bytes: number) => Math.round(bytes / 1024 / 1024 * 100) / 100;
        console.log(`   Memory: ${mb(status.memoryUsage.rss)}MB RSS, ${mb(status.memoryUsage.heapUsed)}MB Heap`);
      }
    } else {
      displayError('Command execution failed', response.error);
      process.exit(1);
    }
  } catch (error) {
    displayError('Failed to execute status command', error);
    process.exit(1);
  }
}

/**
 * Interactive mode
 */
async function runInteractiveMode(): Promise<void> {
  console.log('🎮 Interactive Mode - Templum Minimal CLI');
  console.log('Type commands or "exit" to quit\n');
  
  const client = new MinimalBackendClient();
  
  // Test connection first
  try {
    await client.getHealth();
    console.log('✅ Connected to backend at http://localhost:3001\n');
  } catch (error) {
    displayError('Cannot connect to backend. Make sure it\'s running at http://localhost:3001', error);
    return;
  }
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  const prompt = () => {
    rl.question('templum> ', async (input: string) => {
      const trimmed = input.trim().toLowerCase();
      
      if (trimmed === 'exit' || trimmed === 'quit') {
        console.log('👋 Goodbye!');
        rl.close();
        return;
      }
      
      if (trimmed === 'help') {
        console.log('\nAvailable commands:');
        console.log('  hello [name]  - Say hello (optionally with name)');
        console.log('  status        - Get backend status');
        console.log('  health        - Check backend health');
        console.log('  discover      - Show backend capabilities');
        console.log('  help          - Show this help');
        console.log('  exit          - Quit interactive mode\n');
        prompt();
        return;
      }
      
      const [command, ...argParts] = trimmed.split(' ');
      const argString = argParts.join(' ');
      
      try {
        switch (command) {
          case 'hello':
            await runHelloCommand(argString || undefined);
            break;
          case 'status':
            await runStatusCommand();
            break;
          case 'health':
            await runHealthCheck();
            break;
          case 'discover':
            await runDiscovery();
            break;
          default:
            console.log(`❓ Unknown command: ${command}. Type "help" for available commands.`);
            break;
        }
      } catch (error) {
        displayError(`Command failed: ${command}`, error);
      }
      
      console.log(''); // Add spacing
      prompt();
    });
  };
  
  prompt();
}

/**
 * CLI Program Setup
 */
program
  .name('templum-minimal')
  .description('Minimal CLI for testing Templum backend integration')
  .version('1.0.0');

program
  .command('health')
  .description('Check backend health')
  .action(runHealthCheck);

program
  .command('discover')
  .description('Discover backend capabilities')
  .action(runDiscovery);

program
  .command('hello')
  .description('Execute hello command')
  .argument('[name]', 'Name to greet')
  .action(runHelloCommand);

program
  .command('status')
  .description('Get backend status')
  .action(runStatusCommand);

program
  .command('interactive')
  .alias('i')
  .description('Start interactive mode')
  .action(runInteractiveMode);

// Default to interactive mode if no command specified
if (process.argv.length <= 2) {
  runInteractiveMode();
} else {
  program.parse();
}