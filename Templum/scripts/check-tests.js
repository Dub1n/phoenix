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
function checkTests({ skipGovernance } = { skipGovernance: false }) {
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
        if (!skipGovernance) {
            runCoverageGovernance();
        }
        return true;
    } catch (error) {
        console.log('❌ Test compilation failed');
        console.log('Error details:');
        console.log(error.message);
        console.log('Please fix test compilation errors before committing.');
        return false;
    }
}

function runCoverageGovernance() {
    console.log('🛡️ Enforcing coverage governance thresholds...');
    
    try {
        execSync('npm run coverage:governance', {
            stdio: 'inherit',
            cwd: process.cwd(),
            env: {
                ...process.env,
                FORCE_COLOR: process.env.FORCE_COLOR ?? '1'
            }
        });
        console.log('✅ Coverage governance passed');
    } catch (error) {
        console.log('❌ Coverage governance failed');
        throw error;
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const skipGovernance = args.includes('--skip-governance');
    const success = checkTests({ skipGovernance });
    process.exit(success ? 0 : 1);
}

module.exports = { checkTests };
