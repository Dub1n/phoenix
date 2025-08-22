#!/usr/bin/env node

/**---
 * title: [Haruspex Debug CLI Binary - Command Line Entry Point]
 * tags: [CLI, Binary, Entry-Point, Agent-Interface]
 * provides: [CLI Binary, Command Execution, Process Management]
 * requires: [Haruspex CLI, Node.js Runtime]
 * description: [Command-line binary entry point for Haruspex agent debugging interface]
 * ---*/

import { HaruspexCLI } from './haruspex-cli';

/**
 * Main CLI entry point
 * 
 * Provides command-line interface for external agents to debug and interact
 * with Haruspex extension in real-time.
 */
async function main(): Promise<void> {
  // Create CLI instance
  const cli = new HaruspexCLI({
    autoConnect: process.argv.includes('--no-auto-connect') ? false : true,
    outputFormat: process.argv.includes('--json') ? 'json' : 'pretty',
    logLevel: process.argv.includes('--verbose') ? 'debug' : 'info'
  });

  // Setup error handling
  process.on('uncaughtException', async (error) => {
    console.error('Uncaught exception:', error);
    await cli.cleanup();
    process.exit(1);
  });

  process.on('unhandledRejection', async (reason) => {
    console.error('Unhandled rejection:', reason);
    await cli.cleanup();
    process.exit(1);
  });

  // Setup graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\\nReceived SIGINT, shutting down gracefully...');
    await cli.cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.log('\\nReceived SIGTERM, shutting down gracefully...');
    await cli.cleanup();
    process.exit(0);
  });

  try {
    // Run CLI with provided arguments
    await cli.run(process.argv);
  } catch (error) {
    console.error('CLI error:', error instanceof Error ? error.message : error);
    await cli.cleanup();
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  main().catch(async (error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}