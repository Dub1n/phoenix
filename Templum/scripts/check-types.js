/**---
 * title: [TypeScript Compilation Checker - Pre-commit Validation]
 * tags: [Testing, TypeScript, Validation, Pre-commit]
 * provides: [TypeScript Compilation Check, Error Reporting]
 * requires: [Node.js, TypeScript]
 * description: [Validates TypeScript compilation for pre-commit hooks]
 * ---*/

const { execSync } = require('child_process');
const { createScriptRuntime } = require('./utils/script-runtime');

const runtime = createScriptRuntime('scripts:check-types');
const { logger, handleError, setExitCode } = runtime;

/**
 * Check TypeScript compilation without emitting files
 */
function checkTypeScript() {
  logger.info('📝 Checking TypeScript compilation...');

  try {
    execSync('npx tsc --noEmit', {
      stdio: 'inherit',
      cwd: process.cwd(),
    });

    logger.info('✅ TypeScript compilation passed');
    return true;
  } catch (error) {
    handleError(error, 'scripts:check-types.compile', {
      command: 'npx tsc --noEmit',
    });
    logger.warn('❌ TypeScript compilation failed');
    logger.warn('Please fix compilation errors before committing.');
    return false;
  }
}

// CLI interface
if (require.main === module) {
  const success = checkTypeScript();
  setExitCode(success ? 0 : 1);
}

module.exports = { checkTypeScript };
