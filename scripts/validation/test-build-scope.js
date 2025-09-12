#!/usr/bin/env node

/**
 * Test script for build validator scope functionality
 * Tests different scope patterns to verify optimization behavior
 */

import { BuildValidator } from './src/validators/build-validator.js';

function testScopeAnalysis() {
  const validator = new BuildValidator();
  
  console.log('Testing Build Validator Scope Analysis:');
  console.log('=====================================\n');

  // Test 1: Empty scope (should default to full validation)
  console.log('Test 1: Empty scope');
  const emptyScope = validator.analyzeScopeForBuildRelevance(null);
  console.log('- Result:', emptyScope);
  console.log('- Should require all tests:', 
    emptyScope.requiresBuild && emptyScope.requiresTypeChecking && 
    emptyScope.requiresDependencyCheck && emptyScope.requiresArtifactCheck);
  console.log();

  // Test 2: JSON-only scope (should skip most tests)
  console.log('Test 2: JSON-only scope');
  const jsonScope = validator.analyzeScopeForBuildRelevance({
    patterns: ['*.json', 'data/*.json']
  });
  console.log('- Result:', jsonScope);
  console.log('- Should have no relevant files:', jsonScope.hasNoRelevantFiles);
  console.log();

  // Test 3: TypeScript files scope
  console.log('Test 3: TypeScript files scope');
  const tsScope = validator.analyzeScopeForBuildRelevance({
    patterns: ['src/**/*.ts', 'lib/*.ts']
  });
  console.log('- Result:', tsScope);
  console.log('- Should require all tests:', 
    tsScope.requiresBuild && tsScope.requiresTypeChecking && tsScope.requiresArtifactCheck);
  console.log();

  // Test 4: Package.json scope
  console.log('Test 4: Package.json scope');
  const packageScope = validator.analyzeScopeForBuildRelevance({
    patterns: ['package.json']
  });
  console.log('- Result:', packageScope);
  console.log('- Should require all tests:', 
    packageScope.requiresBuild && packageScope.requiresDependencyCheck);
  console.log();

  // Test 5: Mixed scope
  console.log('Test 5: Mixed scope with optimizations');
  const mixedScope = validator.analyzeScopeForBuildRelevance({
    patterns: ['dist/**/*.js', '*.md']
  });
  console.log('- Result:', mixedScope);
  console.log('- Should have some optimizations:', mixedScope.optimizations.length > 0);
  console.log();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testScopeAnalysis();
}