#!/usr/bin/env node
/**
 * Speed-optimized test compilation checker
 * Performs fast TypeScript compilation verification for test framework
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runTestCompileCheck() {
  console.log('🚀 Starting speed-optimized test compilation check...');
  
  const startTime = Date.now();
  
  // Check if incremental build info exists
  const buildInfoPath = './.tsbuildinfo.test';
  const hasIncrementalInfo = fs.existsSync(buildInfoPath);
  
  console.log(`📊 Incremental build info: ${hasIncrementalInfo ? 'Available' : 'Not found'}`);
  
  return new Promise((resolve, reject) => {
    exec('npx tsc --project tsconfig.test.json', (error, stdout, stderr) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (error) {
        console.error('❌ Test compilation failed:');
        console.error(stderr);
        reject({
          success: false,
          duration,
          errors: stderr,
          incremental: hasIncrementalInfo
        });
      } else {
        console.log(`✅ Test compilation successful in ${duration}ms`);
        if (stdout.trim()) {
          console.log('Output:', stdout);
        }
        resolve({
          success: true,
          duration,
          output: stdout,
          incremental: hasIncrementalInfo
        });
      }
    });
  });
}

if (require.main === module) {
  runTestCompileCheck()
    .then(result => {
      console.log('📋 Compilation Result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Compilation failed:', error);
      process.exit(1);
    });
}

module.exports = { runTestCompileCheck };