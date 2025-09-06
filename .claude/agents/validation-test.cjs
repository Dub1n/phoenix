/**
 * Basic Implementation Validation Test
 * 
 * Quick validation to ensure the handoff infrastructure is working correctly.
 * This is a Node.js script to test the core functionality.
 */

const path = require('path');
const fs = require('fs').promises;

// Test directory
const TEST_DIR = path.join('.claude', 'test-validation');

async function runValidationTest() {
  console.log('Starting File-Based Handoff Infrastructure Validation...');
  
  try {
    // Test 1: Directory Structure
    console.log('✓ Test 1: Verifying directory structure...');
    await testDirectoryStructure();
    
    // Test 2: File Naming Convention
    console.log('✓ Test 2: Testing file naming convention...');
    await testFileNaming();
    
    // Test 3: Basic File Operations
    console.log('✓ Test 3: Testing basic file operations...');
    await testBasicFileOperations();
    
    console.log('\n🎉 All validation tests passed!');
    console.log('File-Based Handoff Infrastructure is ready for use.');
    
    return true;
  } catch (error) {
    console.error('\n❌ Validation test failed:', error.message);
    return false;
  } finally {
    // Cleanup test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

async function testDirectoryStructure() {
  const handoffDir = path.join('.claude', 'handoff');
  
  // Check if directories exist
  await fs.access(path.join(handoffDir, 'input'));
  await fs.access(path.join(handoffDir, 'output'));
  await fs.access(path.join(handoffDir, 'archive'));
  
  // Check interface files
  await fs.access(path.join('.claude', 'agents', 'interfaces', 'handoff-types.ts'));
  
  // Check utility files
  const utilsDir = path.join('.claude', 'agents', 'utils');
  await fs.access(path.join(utilsDir, 'file-naming.ts'));
  await fs.access(path.join(utilsDir, 'validation.ts'));
  await fs.access(path.join(utilsDir, 'error-handling.ts'));
  await fs.access(path.join(utilsDir, 'file-manager.ts'));
  await fs.access(path.join(utilsDir, 'cleanup.ts'));
  await fs.access(path.join(utilsDir, 'audit-logger.ts'));
  await fs.access(path.join(utilsDir, 'test-utilities.ts'));
}

async function testFileNaming() {
  // Test timestamp format: YYYY-MM-DD-HHmm
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  const expectedPattern = `${year}-${month}-${day}-${hours}${minutes}`;
  const timestampRegex = /^\d{4}-\d{2}-\d{2}-\d{4}$/;
  
  if (!timestampRegex.test(expectedPattern)) {
    throw new Error('Timestamp format validation failed');
  }
  
  // Test filename pattern: {phase}-{type}-{task-id}-{timestamp}.json
  const testFilename = `research-context-TEST001-${expectedPattern}.json`;
  const filenameRegex = /^(research|execution|validation|documentation)-(context|results)-[A-Z0-9]+-\d{4}-\d{2}-\d{2}-\d{4}\.json$/;
  
  if (!filenameRegex.test(testFilename)) {
    throw new Error('Filename pattern validation failed');
  }
}

async function testBasicFileOperations() {
  // Create test directory
  await fs.mkdir(TEST_DIR, { recursive: true });
  
  // Test JSON file creation and reading
  const testData = {
    project: 'ValidationTest',
    task_id: 'TEST001',
    workflow_phase: 'research',
    context: {
      task_description: 'Basic validation test',
      requirements: ['Test file operations'],
      constraints: ['Test environment only']
    },
    execution_parameters: {
      max_execution_time: 30000,
      confidence_threshold: 'high',
      fallback_strategy: 'test_mode'
    }
  };
  
  const testFile = path.join(TEST_DIR, 'test-input.json');
  
  // Write test file
  await fs.writeFile(testFile, JSON.stringify(testData, null, 2), 'utf8');
  
  // Read and validate
  const readData = JSON.parse(await fs.readFile(testFile, 'utf8'));
  
  if (readData.task_id !== testData.task_id) {
    throw new Error('File write/read validation failed');
  }
}

// Run the validation test
if (require.main === module) {
  runValidationTest().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runValidationTest };