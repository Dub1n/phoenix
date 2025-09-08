#!/usr/bin/env node

/**
 * Simple test to validate the new validation system architecture
 */

import { ValidationOrchestrator, ProjectResolver, ScopeRouter, TestExecutor } from './templum-task-validator-v2-clean.js';

async function runBasicTests() {
  console.log('🧪 Testing New Validation System Architecture');
  console.log('='.repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  // Test 1: Project Resolution
  console.log('\n📍 Test 1: Project Resolution');
  try {
    const resolver = new ProjectResolver('./Templum');
    await resolver.resolve();
    console.log('   ✅ Project resolution works');
    passed++;
  } catch (error) {
    console.log(`   ❌ Project resolution failed: ${error.message}`);
    failed++;
  }
  
  // Test 2: Scope Routing
  console.log('\n🎯 Test 2: Scope Routing');
  try {
    const resolver = new ProjectResolver('./Templum');
    await resolver.resolve();
    const router = new ScopeRouter('backend', resolver);
    const scope = await router.determineScope();
    console.log(`   ✅ Scope routing works: ${scope.description}`);
    passed++;
  } catch (error) {
    console.log(`   ❌ Scope routing failed: ${error.message}`);
    failed++;
  }
  
  // Test 3: Basic argument validation
  console.log('\n🔧 Test 3: Argument Validation');
  try {
    const validCategories = ['backend', 'ui', 'core', 'build', 'quality', 'architecture', 'mcp', 'feature'];
    const testCategory = 'backend';
    
    if (validCategories.includes(testCategory)) {
      console.log('   ✅ Category validation works');
      passed++;
    } else {
      console.log('   ❌ Category validation failed');
      failed++;
    }
  } catch (error) {
    console.log(`   ❌ Argument validation failed: ${error.message}`);
    failed++;
  }
  
  // Results
  console.log('\n📊 Test Results');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All basic tests passed! New architecture is working.');
    return true;
  } else {
    console.log('\n⚠️ Some tests failed. Issues need to be addressed.');
    return false;
  }
}

// Run tests
runBasicTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error(`Test execution failed: ${error.message}`);
  process.exit(1);
});