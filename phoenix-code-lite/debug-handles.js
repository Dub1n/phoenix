#!/usr/bin/env node

console.log('=== Process Handle Diagnostic ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JEST_WORKER_ID:', process.env.JEST_WORKER_ID);

// Show what's keeping process alive
process.on('beforeExit', (code) => {
  console.log('⚠️ Process wants to exit but something is keeping it alive');
  console.log('Exit code:', code);
  
  // Log active handles and requests
  if (process._getActiveHandles) {
    const handles = process._getActiveHandles();
    console.log('Active handles:', handles.length);
    handles.forEach((handle, i) => {
      console.log(`  ${i}: ${handle.constructor.name}`);
    });
  }
  
  if (process._getActiveRequests) {
    const requests = process._getActiveRequests();
    console.log('Active requests:', requests.length);
    requests.forEach((req, i) => {
      console.log(`  ${i}: ${req.constructor.name}`);
    });
  }
});

// Run the actual CLI
const { spawn } = require('child_process');
const path = require('path');

const CLI_PATH = path.join(__dirname, 'dist/src/index.js');

console.log('Starting CLI subprocess...');
const child = spawn('node', [CLI_PATH, 'config', '--show'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'test' }
});

child.on('close', (code) => {
  console.log('CLI subprocess closed with code:', code);
  
  setTimeout(() => {
    console.log('Main process should exit now...');
    process.exit(0);
  }, 1000);
});