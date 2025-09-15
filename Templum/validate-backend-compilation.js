#!/usr/bin/env node

/**
 * Backend Service Compilation Validation Script
 * TASK: EXECUTION-BACKEND-005 - Integrated validation for backend compilation
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Target directories for validation
const TARGET_DIRS = ['src/backend', 'src/observability', 'src/registry'];

console.log('🔍 Starting Backend Service Compilation Validation...');
console.log('================================================');

// Function to get all TypeScript files in target directories
function getTargetFiles() {
  const files = [];
  TARGET_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
      const dirFiles = fs.readdirSync(dir)
        .filter(file => file.endsWith('.ts'))
        .map(file => path.join(dir, file));
      files.push(...dirFiles);
    }
  });
  return files;
}

// Function to run TypeScript compilation check
function runCompilationCheck() {
  try {
    console.log('🔧 Running TypeScript compilation check...');
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
    return { success: true, errors: [] };
  } catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || error.message;
    
    // Filter for only our target directories
    const relevantErrors = output.split('\n')
      .filter(line => TARGET_DIRS.some(dir => line.includes(dir)))
      .filter(line => line.trim().length > 0);
    
    return { 
      success: relevantErrors.length === 0, 
      errors: relevantErrors,
      allErrors: output.split('\n').filter(line => line.includes('error'))
    };
  }
}

// Function to validate individual backend services
function validateBackendServices() {
  const results = {};
  const targetFiles = getTargetFiles();
  
  console.log(`📁 Found ${targetFiles.length} TypeScript files in target directories`);
  
  targetFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      results[file] = {
        exists: true,
        hasContent: content.length > 0,
        hasExports: content.includes('export'),
        hasImports: content.includes('import'),
        lineCount: content.split('\n').length,
        hasTasks: content.includes('TASK-ID') || content.includes('TODO:'),
        hasValidation: content.includes('validation') || content.includes('Validation')
      };
    } else {
      results[file] = { exists: false };
    }
  });
  
  return results;
}

// Function to check backend service integration
function checkBackendIntegration() {
  const integrationChecks = {
    serviceDiscovery: fs.existsSync('src/backend/service-discovery.ts'),
    backendRouter: fs.existsSync('src/backend/backend-service-router.ts'),
    dependencyResolver: fs.existsSync('src/backend/backend-dependency-resolver.ts'),
    observabilitySystem: fs.existsSync('src/observability/templum-observability-system.ts'),
    registryComponents: fs.existsSync('src/registry/pcl-command-registry.ts')
  };
  
  return integrationChecks;
}

// Main validation execution
function main() {
  const results = {
    timestamp: new Date().toISOString(),
    compilationCheck: runCompilationCheck(),
    serviceValidation: validateBackendServices(),
    integrationCheck: checkBackendIntegration(),
    targetDirectories: TARGET_DIRS,
    totalFiles: getTargetFiles().length
  };
  
  // Display results
  console.log('\n📊 Validation Results:');
  console.log('=====================');
  
  console.log(`✅ Target Files: ${results.totalFiles}`);
  console.log(`${results.compilationCheck.success ? '✅' : '❌'} Compilation: ${results.compilationCheck.success ? 'PASSED' : 'FAILED'}`);
  
  if (!results.compilationCheck.success && results.compilationCheck.errors.length > 0) {
    console.log('🚨 Backend Compilation Errors:');
    results.compilationCheck.errors.forEach(error => console.log(`   ${error}`));
  }
  
  console.log('\n🔗 Integration Status:');
  Object.entries(results.integrationCheck).forEach(([key, value]) => {
    console.log(`${value ? '✅' : '❌'} ${key}: ${value ? 'Found' : 'Missing'}`);
  });
  
  const successCount = Object.values(results.serviceValidation).filter(r => r.exists && r.hasContent).length;
  console.log(`\n📁 Service Files: ${successCount}/${results.totalFiles} valid`);
  
  // Write detailed results to file
  fs.writeFileSync('backend-validation-results.json', JSON.stringify(results, null, 2));
  console.log('\n💾 Detailed results saved to: backend-validation-results.json');
  
  return results;
}

if (require.main === module) {
  main();
}

module.exports = { main, validateBackendServices, runCompilationCheck };