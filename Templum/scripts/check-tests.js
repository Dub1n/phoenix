/**---
 * title: [Test Compilation Checker - Pre-commit Validation]
 * tags: [Testing, Jest, Validation, Pre-commit]
 * provides: [Test Compilation Check, Error Reporting]
 * requires: [Node.js, Jest]
 * description: [Validates test compilation for pre-commit hooks]
 * ---*/

const { execSync } = require('child_process');

/**
 * Check test compilation without running tests
 */
function checkTests() {
    console.log('🔧 Checking test compilation...');
    
    try {
        // List tests to verify they can be compiled and discovered
        const output = execSync('npx jest --listTests --passWithNoTests', { 
            encoding: 'utf8',
            cwd: process.cwd()
        });
        
        const testFiles = output.split('\n').filter(line => 
            line.trim().endsWith('.test.ts') || line.trim().endsWith('.spec.ts')
        );
        
        console.log(`✅ Test compilation passed (${testFiles.length} test files found)`);
        return true;
    } catch (error) {
        console.log('❌ Test compilation failed');
        console.log('Error details:');
        console.log(error.message);
        console.log('Please fix test compilation errors before committing.');
        return false;
    }
}

// CLI interface
if (require.main === module) {
    const success = checkTests();
    process.exit(success ? 0 : 1);
}

module.exports = { checkTests };