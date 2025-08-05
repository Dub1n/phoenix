/**---
tags: [Integration, Testing, CLI, Interactive, Comprehensive, Phase2]
provides: [Comprehensive CLI Test Suite, Interactive Session Testing, Menu Navigation Testing]
requires: [Logue Library, Enhanced Logue, Phoenix CLI, Jest Test Framework]
---*/

import logue from 'logue';
import { enhancedLogue } from '../../src/utils/logue-wrapper';
import { beforeAll, describe, test, expect, afterAll } from '@jest/globals';
import path from 'path';

/**
 * Phase 2: Comprehensive CLI Test Suite
 * 
 * This test suite provides complete coverage of Phoenix Code Lite's CLI functionality,
 * including interactive sessions, menu navigation, command interactions, and error handling.
 */
describe('Phase 2: Comprehensive CLI Test Suite', () => {
  const CLI_PATH = path.join(__dirname, '../../dist/src/index.js');
  
  beforeAll(async () => {
    // Ensure CLI is built and ready for testing
    const fs = await import('fs');
    const cliExists = fs.existsSync(CLI_PATH);
    if (!cliExists) {
      throw new Error(`CLI not found at ${CLI_PATH}. Run 'npm run build' first.`);
    }
    
    // Set NODE_ENV=test for all CLI child processes
    process.env.NODE_ENV = 'test';
  });
  
  afterAll(() => {
    // Clean up environment
    delete process.env.NODE_ENV;
  });

  describe('Interactive Session Initialization', () => {
    test('starts interactive CLI session and displays main menu', async () => {
      console.log('Testing interactive session startup...');
      
      const app = enhancedLogue('node', [CLI_PATH]);
      
      // Wait for interactive CLI initialization
      await app.waitFor('Phoenix Code Lite Interactive CLI');
      console.log('✅ Interactive CLI started successfully');
      
      // Wait for main menu to appear
      await app.waitFor('Main Menu');
      console.log('✅ Main menu displayed');
      
      // Send quit command to exit gracefully
      app.input('quit\n');
      
      // Wait for confirmation prompt
      await app.waitFor('Are you sure you want to exit');
      console.log('✅ Exit confirmation prompt appeared');
      
      // Confirm exit
      app.input('y\n');
      
      const result = await app.end();
      
      console.log('Interactive session result:', {
        status: result.status,
        hasMainMenu: result.stdout.includes('Main Menu'),
        hasInteractiveHeader: result.stdout.includes('Phoenix Code Lite Interactive CLI')
      });
      
      expect(result.stdout || app.stdout).toContain('Phoenix Code Lite Interactive CLI');
      expect(result.stdout || app.stdout).toContain('Main Menu');
      expect(result.stdout || app.stdout).toContain('Generate Code');
      expect(result.stdout || app.stdout).toContain('Configuration');
    }, 45000);

    test('displays welcome message and navigation instructions', async () => {
      console.log('Testing welcome message and instructions...');
      
      const app = logue('node', [CLI_PATH]);
      
      await app.waitFor('TDD Workflow Orchestrator');
      console.log('✅ Found TDD workflow description');
      
      // Exit immediately
      app.input('quit\ny\n');
      
      const result = await app.end();
      
      expect(app.stdout).toContain('TDD Workflow Orchestrator');
      expect(app.stdout).toContain('Welcome!');
      expect(app.stdout).toMatch(/Type.*help.*for commands/);
    }, 35000);
  });

  describe('Menu Navigation Patterns', () => {
    test('navigates to configuration menu and back', async () => {
      console.log('Testing navigation to configuration menu...');
      
      const app = enhancedLogue('node', [CLI_PATH]);
      
      // Wait for main menu and navigate to configuration
      await app.waitFor('Main Menu');
      console.log('✅ Main menu loaded');
      
      // Select Configuration (option 2)
      app.input('2\n');
      
      // Wait for configuration menu
      await app.waitFor('Configuration');
      console.log('✅ Configuration menu accessed');
      
      // Navigate back to main menu
      app.input('back\n');
      
      // Wait for main menu to reappear
      await app.waitFor('Main Menu');
      console.log('✅ Successfully navigated back to main menu');
      
      // Exit
      app.input('quit\ny\n');
      
      const result = await app.end();
      
      expect(app.stdout).toContain('Configuration');
      expect(app.stdout).toMatch(/back.*Main Menu/s);
    }, 45000);

    test('tests breadcrumb navigation system', async () => {
      console.log('Testing breadcrumb navigation...');
      
      const app = logue('node', [CLI_PATH]);
      
      await app.waitFor('Main Menu');
      
      // Navigate to Templates
      app.input('3\n');
      
      // Look for breadcrumb navigation
      await app.waitFor('Templates');
      console.log('✅ Templates menu reached');
      
      // Test home command
      app.input('home\n');
      await app.waitFor('Main Menu');
      console.log('✅ Home navigation works');
      
      app.input('quit\ny\n');
      
      const result = await app.end();
      
      expect(app.stdout).toContain('Templates');
      expect(app.stdout).toMatch(/Navigation.*Phoenix Code Lite.*Templates/s);
    }, 40000);
  });

  describe('Configuration Commands', () => {
    test('config --show displays current configuration', async () => {
      console.log('Testing config --show command...');
      
      const app = enhancedLogue('node', [CLI_PATH, 'config', '--show']);
      
      await app.waitFor('Phoenix Code Lite Configuration');
      console.log('✅ Configuration display started');
      
      const result = await app.end();
      
      console.log('Config show result:', {
        status: result.status,
        hasConfiguration: (result.stdout || app.stdout).includes('Configuration')
      });
      
      expect(result.stdout || app.stdout).toContain('Configuration');
      expect(result.stdout || app.stdout).toMatch(/Claude.*Settings|TDD.*Workflow|Framework.*Settings/);
    }, 30000);

    test('config command in interactive mode', async () => {
      console.log('Testing interactive config command...');
      
      const app = logue('node', [CLI_PATH]);
      
      await app.waitFor('Main Menu');
      
      // Use direct config command
      app.input('config\n');
      
      // Wait for configuration options
      await app.waitFor('Configuration');
      console.log('✅ Configuration menu accessed via command');
      
      // Test show command within config context
      app.input('show\n');
      
      // Look for configuration details
      await app.waitFor('Configuration');
      console.log('✅ Configuration details displayed');
      
      app.input('back\nquit\ny\n');
      
      const result = await app.end();
      
      expect(app.stdout).toContain('Configuration');
    }, 45000);
  });

  describe('Generation Workflows', () => {
    test('generate command displays task prompt', async () => {
      console.log('Testing generate command...');
      
      const app = logue('node', [CLI_PATH, 'generate', '--task', 'Create a hello world function']);
      
      // Wait for generation workflow to start
      await app.waitFor('TDD');
      console.log('✅ TDD workflow initiated');
      
      const result = await app.end();
      
      console.log('Generate result:', {
        status: result.status,
        hasWorkflow: (result.stdout || app.stdout).includes('TDD')
      });
      
      expect(result.stdout || app.stdout).toMatch(/TDD|workflow|generate/i);
    }, 30000);

    test('interactive generate workflow', async () => {
      console.log('Testing interactive generate workflow...');
      
      const app = enhancedLogue('node', [CLI_PATH]);
      
      await app.waitFor('Main Menu');
      
      // Select Generate Code (option 1)
      app.input('1\n');
      
      // Wait for generate options
      await app.waitFor('Generate');
      console.log('✅ Generate menu accessed');
      
      // Navigate back and exit
      app.input('back\nquit\ny\n');
      
      const result = await app.end();
      
      expect(app.stdout).toContain('Generate');
    }, 40000);
  });

  describe('Help System Interactions', () => {
    test('help command displays comprehensive help', async () => {
      console.log('Testing help command...');
      
      const app = logue('node', [CLI_PATH, 'help']);
      
      await app.waitFor('Usage:');
      console.log('✅ Help system activated');
      
      const result = await app.end();
      
      console.log('Help result:', {
        status: result.status,
        hasUsage: (result.stdout || app.stdout).includes('Usage:'),
        hasCommands: (result.stdout || app.stdout).includes('Commands:')
      });
      
      expect(result.stdout || app.stdout).toContain('Usage:');
      expect(result.stdout || app.stdout).toContain('Commands:');
      expect(result.stdout || app.stdout).toMatch(/generate|config|init/);
    }, 30000);

    test('interactive help system', async () => {
      console.log('Testing interactive help system...');
      
      const app = logue('node', [CLI_PATH]);
      
      await app.waitFor('Main Menu');
      
      // Use help command in interactive mode
      app.input('help\n');
      
      // Wait for help display
      await app.waitFor('Help System');
      console.log('✅ Interactive help system displayed');
      
      app.input('quit\ny\n');
      
      const result = await app.end();
      
      expect(app.stdout).toContain('Help System');
      expect(app.stdout).toMatch(/Global Commands|Navigation Commands/);
    }, 40000);

    test('context-sensitive help', async () => {
      console.log('Testing context-sensitive help...');
      
      const app = enhancedLogue('node', [CLI_PATH]);
      
      await app.waitFor('Main Menu');
      
      // Navigate to configuration
      app.input('2\n');
      await app.waitFor('Configuration');
      
      // Request help in configuration context
      app.input('help\n');
      
      // Look for context-specific help
      await app.waitFor('Context Commands');
      console.log('✅ Context-sensitive help displayed');
      
      app.input('back\nquit\ny\n');
      
      const result = await app.end();
      
      expect(app.stdout).toContain('Context Commands');
      expect(app.stdout).toContain('Configuration');
    }, 45000);
  });

  describe('Error Handling and Recovery', () => {
    test('handles invalid command gracefully', async () => {
      console.log('Testing invalid command handling...');
      
      const app = logue('node', [CLI_PATH]);
      
      await app.waitFor('Main Menu');
      
      // Enter invalid command
      app.input('invalidcommand\n');
      
      // Wait for error message
      await app.waitFor('Unknown command');
      console.log('✅ Invalid command error displayed');
      
      // Should still be able to use valid commands
      app.input('help\n');
      await app.waitFor('Help System');
      console.log('✅ Recovery successful - help command works');
      
      app.input('quit\ny\n');
      
      const result = await app.end();
      
      expect(app.stdout).toContain('Unknown command');
      expect(app.stdout).toContain('Help System');
    }, 45000);

    test('handles long input validation', async () => {
      console.log('Testing input validation...');
      
      const app = enhancedLogue('node', [CLI_PATH]);
      
      await app.waitFor('Main Menu');
      
      // Enter extremely long input
      const longInput = 'a'.repeat(1500);
      app.input(longInput + '\n');
      
      // Wait for validation error
      await app.waitFor('Invalid input');
      console.log('✅ Input validation error displayed');
      
      // Test recovery
      app.input('help\n');
      await app.waitFor('Help System');
      console.log('✅ Recovery after validation error successful');
      
      app.input('quit\ny\n');
      
      const result = await app.end();
      
      expect(app.stdout).toContain('Invalid input');
      expect(app.stdout).toContain('too long');
    }, 45000);

    test('provides command suggestions for typos', async () => {
      console.log('Testing command suggestions...');
      
      const app = logue('node', [CLI_PATH]);
      
      await app.waitFor('Main Menu');
      
      // Enter command with typo
      app.input('conifg\n');  // typo for 'config'
      
      // Wait for suggestion
      await app.waitFor('Did you mean');
      console.log('✅ Command suggestion displayed');
      
      app.input('quit\ny\n');
      
      const result = await app.end();
      
      expect(app.stdout).toContain('Unknown command');
      expect(app.stdout).toContain('Did you mean');
    }, 40000);
  });

  describe('Command Mode Integration', () => {
    test('version command works correctly', async () => {
      console.log('Testing version command...');
      
      const app = logue('node', [CLI_PATH, '--version']);
      
      await app.waitFor('1.0.0');
      console.log('✅ Version command working');
      
      const result = await app.end();
      
      expect(app.stdout).toContain('1.0.0');
    }, 25000);

    test('init command provides feedback', async () => {
      console.log('Testing init command...');
      
      const app = logue('node', [CLI_PATH, 'init', '--help']);
      
      await app.waitFor('Initialize Phoenix-Code-Lite');
      console.log('✅ Init command help displayed');
      
      const result = await app.end();
      
      expect(app.stdout).toContain('Initialize Phoenix-Code-Lite');
      expect(app.stdout).toMatch(/starter.*enterprise.*performance|template/);
    }, 30000);
  });

  describe('Advanced Functionality', () => {
    test('template command integration', async () => {
      console.log('Testing template command...');
      
      const app = logue('node', [CLI_PATH, 'template']);
      
      // Wait for template system to respond
      await app.waitFor('template');
      console.log('✅ Template command executed');
      
      const result = await app.end();
      
      expect(result.stdout || app.stdout).toMatch(/template/i);
    }, 30000);

    test('wizard command integration', async () => {
      console.log('Testing wizard command...');
      
      const app = enhancedLogue('node', [CLI_PATH, 'wizard']);
      
      // Wait for wizard to start
      await app.waitFor('wizard');
      console.log('✅ Wizard command initiated');
      
      const result = await app.end();
      
      expect(result.stdout || app.stdout).toMatch(/wizard/i);
    }, 30000);
  });
});