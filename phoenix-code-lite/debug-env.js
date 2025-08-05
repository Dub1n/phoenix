#!/usr/bin/env node

// Simple script to debug environment variables when run by logue
console.log('=== Environment Debug ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('JEST_WORKER_ID:', process.env.JEST_WORKER_ID);
console.log('VITEST_WORKER_ID:', process.env.VITEST_WORKER_ID);
console.log('process.argv:', process.argv);

// Test our detection functions
const { isTestEnvironment, isLogueChildProcess } = require('./dist/src/utils/test-utils');
console.log('isTestEnvironment():', isTestEnvironment());
console.log('isLogueChildProcess():', isLogueChildProcess());

console.log('Should exit:', !isTestEnvironment() || isLogueChildProcess());
console.log('=== End Debug ===');

// Exit with code 0
process.exit(0);