#!/usr/bin/env node

/**
 * Validation System Enhancement Test
 * 
 * Basic tests to verify the new project configuration and report generation features
 * 
 * Date: 2025-09-10
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the enhanced orchestrator
import { EnhancedValidationOrchestrator } from '../src/core/enhanced-orchestrator.js';

/**
 * Test project configuration resolution
 */
async function testProjectConfigResolution() {
  console.log('\n🧪 Testing project configuration resolution...');
  
  try {
    const orchestrator = new EnhancedValidationOrchestrator();
    await orchestrator.initialize();
    
    // Test with existing project (templum)
    try {
      const config = await orchestrator.resolveProjectConfig('templum');
      console.log('✅ Templum project config resolved successfully');
      console.log(`   Report location: ${config.report_location}`);
      console.log(`   Timeout overrides: ${Object.keys(config.timeout_overrides || {}).length} configured`);
    } catch (error) {
      console.log(`ℹ️ Templum config not found (expected): ${error.message}`);
    }
    
    // Test with non-existent project
    try {
      await orchestrator.resolveProjectConfig('nonexistent');
      console.log('❌ Should have failed for non-existent project');
    } catch (error) {
      console.log('✅ Correctly failed for non-existent project');
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

/**
 * Test configuration validation
 */
async function testConfigValidation() {
  console.log('\n🧪 Testing configuration validation...');
  
  try {
    const orchestrator = new EnhancedValidationOrchestrator();
    
    // Test valid config
    const validConfig = {
      version: "3.0.1",
      project: {
        name: "test-project",
        display_name: "Test Project"
      },
      validation: {
        report_location: "../scripts/validation/results",
        timeout_overrides: {
          quality: 120000
        }
      }
    };
    
    const validation = orchestrator.validateProjectConfig(validConfig);
    if (validation.valid) {
      console.log('✅ Valid configuration passed validation');
    } else {
      console.log(`❌ Valid configuration failed: ${validation.errors.join(', ')}`);
    }
    
    // Test invalid config
    const invalidConfig = {
      version: "3.0.1"
      // Missing required fields
    };
    
    const invalidValidation = orchestrator.validateProjectConfig(invalidConfig);
    if (!invalidValidation.valid) {
      console.log('✅ Invalid configuration correctly rejected');
      console.log(`   Errors: ${invalidValidation.errors.join(', ')}`);
    } else {
      console.log('❌ Invalid configuration should have been rejected');
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

/**
 * Test report path resolution
 */
async function testReportPathResolution() {
  console.log('\n🧪 Testing report path resolution...');
  
  try {
    const orchestrator = new EnhancedValidationOrchestrator();
    
    const projectInfo = {
      name: 'test-project',
      path: '/test/path'
    };
    
    const projectConfig = {
      report_location: '../scripts/validation/results'
    };
    
    const reportPath = orchestrator.resolveReportPath(projectInfo, 'quality', projectConfig, 'TEST-001');
    
    console.log('✅ Report path resolved successfully');
    console.log(`   Path: ${reportPath}`);
    
    if (reportPath.includes('TEST-001') && reportPath.includes('quality')) {
      console.log('✅ Report path contains expected task ID and category');
    } else {
      console.log('❌ Report path missing expected components');
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

/**
 * Test report formatting
 */
async function testReportFormatting() {
  console.log('\n🧪 Testing report formatting...');
  
  try {
    const orchestrator = new EnhancedValidationOrchestrator();
    
    const mockResult = {
      status: 'PASS',
      tests: [
        { name: 'Test 1', status: 'PASS', message: 'Passed successfully' },
        { name: 'Test 2', status: 'WARN', message: 'Warning issued' }
      ],
      evidence: ['Evidence 1', 'Evidence 2'],
      errors: [],
      warnings: ['Warning message'],
      duration: 5000,
      taskId: 'TEST-002'
    };
    
    const projectInfo = {
      name: 'test-project',
      path: '/test/path'
    };
    
    const report = orchestrator.formatValidationReport(mockResult, projectInfo, 'quality');
    
    console.log('✅ Report formatted successfully');
    
    if (report.includes('TEST-002') && report.includes('VALIDATION_PASSED')) {
      console.log('✅ Report contains expected task ID and status');
    } else {
      console.log('❌ Report missing expected components');
    }
    
    if (report.includes('Test 1') && report.includes('Test 2')) {
      console.log('✅ Report contains test results');
    } else {
      console.log('❌ Report missing test results');
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

/**
 * Test deep merge functionality
 */
async function testDeepMerge() {
  console.log('\n🧪 Testing deep merge functionality...');
  
  try {
    const orchestrator = new EnhancedValidationOrchestrator();
    
    const defaults = {
      timeout_overrides: {
        quality: 120000,
        architecture: 180000
      },
      reporting: {
        format: 'markdown',
        include_evidence: true
      }
    };
    
    const projectSpecific = {
      timeout_overrides: {
        quality: 150000, // Override
        backend: 200000  // New
      },
      reporting: {
        include_timing: true // New
      }
    };
    
    const merged = orchestrator.deepMerge(defaults, projectSpecific);
    
    console.log('✅ Deep merge completed successfully');
    
    if (merged.timeout_overrides.quality === 150000) {
      console.log('✅ Quality timeout correctly overridden');
    } else {
      console.log('❌ Quality timeout not overridden correctly');
    }
    
    if (merged.timeout_overrides.architecture === 180000) {
      console.log('✅ Architecture timeout preserved from defaults');
    } else {
      console.log('❌ Architecture timeout not preserved');
    }
    
    if (merged.timeout_overrides.backend === 200000) {
      console.log('✅ Backend timeout added from project config');
    } else {
      console.log('❌ Backend timeout not added');
    }
    
    if (merged.reporting.include_evidence === true && merged.reporting.include_timing === true) {
      console.log('✅ Reporting settings merged correctly');
    } else {
      console.log('❌ Reporting settings not merged correctly');
    }
    
  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🚀 Starting Validation System Enhancement Tests');
  console.log('================================================');
  
  await testProjectConfigResolution();
  await testConfigValidation();
  await testReportPathResolution();
  await testReportFormatting();
  await testDeepMerge();
  
  console.log('\n================================================');
  console.log('✅ Validation System Enhancement Tests Completed');
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(error => {
    console.error('💥 Test suite failed:', error.message);
    process.exit(1);
  });
}

export { runTests };
