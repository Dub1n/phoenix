/**---
tags: [Integration, Testing, CLI, Interactive, Logue]
provides: [Interactive CLI Test Suite, CLI Integration Testing Infrastructure]
requires: [Logue Library, Phoenix CLI, Jest Test Framework]
---*/

import logue from 'logue';
import { enhancedLogue } from '../../src/utils/logue-wrapper';
import { beforeAll, describe, test, expect } from '@jest/globals';
import path from 'path';

describe('Interactive CLI Tests - Phase 1', () => {
  const CLI_PATH = path.join(__dirname, '../../dist/src/index.js');
  
  beforeAll(async () => {
    // Ensure CLI is built and ready for testing
    const fs = await import('fs');
    const cliExists = fs.existsSync(CLI_PATH);
    if (!cliExists) {
      throw new Error(`CLI not found at ${CLI_PATH}. Run 'npm run build' first.`);
    }
    
    // Set NODE_ENV=test for all CLI child processes
    // This tells the CLI to use safeExit() and not call process.exit()
    process.env.NODE_ENV = 'test';
  });
  
  afterAll(() => {
    // Clean up environment
    delete process.env.NODE_ENV;
  });

  test('config command displays configuration', async () => {
    console.log('Testing CLI config command with enhanced logue...');
    
    const app = enhancedLogue('node', [CLI_PATH, 'config', '--show']);
    
    // Wait for expected text
    await app.waitFor('Phoenix Code Lite Configuration');
    console.log('✓ Found expected text in CLI output');
    
    console.log('About to call enhanced app.end()...');
    
    // Enhanced logue handles cleanup automatically
    const result = await app.end();
    
    console.log('✓ Enhanced app.end() completed successfully!');
    console.log('CLI Result:', {
      status: result.status,
      stdout: result.stdout.substring(0, 300) + '...'
    });
    
    expect(app.stdout).toContain('Configuration');
  }, 30000);

  test('help command displays available commands', async () => {
    console.log('Testing CLI help command with logue...');
    
    const app = logue('node', [CLI_PATH, 'help']);
    
    await app.waitFor('Usage:');
    console.log('✓ Found Usage text in help output');
    
    const result = await app.end();
    
    console.log('Help Result:', {
      stdout: result.stdout.substring(0, 300) + '...'
    });
    
    expect(app.stdout).toContain('Usage:');
    expect(app.stdout).toContain('Commands:');
  }, 25000);

  test('version command displays version info', async () => {
    console.log('Testing CLI version command with logue...');
    
    const app = logue('node', [CLI_PATH, '--version']);
    
    await app.waitFor('1.0.0');
    console.log('✓ Found version number in output');
    
    const result = await app.end();
    
    console.log('Version Result:', {
      stdout: result.stdout.substring(0, 300) + '...'
    });
    
    expect(app.stdout).toContain('1.0.0');
  }, 25000);
});