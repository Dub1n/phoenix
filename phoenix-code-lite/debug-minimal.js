#!/usr/bin/env node

console.log('Minimal test starting...');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JEST_WORKER_ID:', process.env.JEST_WORKER_ID);

// Simple exit test
setTimeout(() => {
  console.log('About to exit...');
  
  if (process.env.JEST_WORKER_ID) {
    console.log('In Jest worker - not exiting');
    return;
  }
  
  console.log('Exiting normally');
  process.exit(0);
}, 1000);