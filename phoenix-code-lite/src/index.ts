#!/usr/bin/env node

import { setupCLI } from './cli/args';

async function main() {
  try {
    const program = setupCLI();
    await program.parseAsync(process.argv);
  } catch (error) {
    console.error('Phoenix-Code-Lite failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { setupCLI };