/**---
 * title: [TypeScript Compilation Checker - Pre-commit Validation]
 * tags: [Testing, TypeScript, Validation, Pre-commit]
 * provides: [TypeScript Compilation Check, Error Reporting]
 * requires: [Node.js, TypeScript]
 * description: [Validates TypeScript compilation for pre-commit hooks]
 * ---*/

const { execSync } = require('child_process');

/**
 * Check TypeScript compilation without emitting files
 */
function checkTypeScript() {
    console.log('📝 Checking TypeScript compilation...');
    
    try {
        execSync('npx tsc --noEmit', { 
            stdio: 'inherit',
            cwd: process.cwd()
        });
        
        console.log('✅ TypeScript compilation passed');
        return true;
    } catch (error) {
        console.log('❌ TypeScript compilation failed');
        console.log('Please fix compilation errors before committing.');
        return false;
    }
}

// CLI interface
if (require.main === module) {
    const success = checkTypeScript();
    process.exit(success ? 0 : 1);
}

module.exports = { checkTypeScript };