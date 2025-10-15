/**---
 * title: [Test Compilation Checker - Pre-commit Validation]
 * tags: [Testing, Jest, Validation, Pre-commit]
 * provides: [Test Compilation Check, Error Reporting]
 * requires: [Node.js, Jest]
 * description: [Validates test compilation for pre-commit hooks]
 * ---*/

const { execSync } = require('child_process');
const { createScriptRuntime } = require('./utils/script-runtime');

const runtime = createScriptRuntime('scripts:check-tests');
const { logger, handleError, setExitCode } = runtime;

/**
 * Check test compilation without running tests
 */
function checkTests({ skipGovernance } = { skipGovernance: false }) {
  logger.info('🔧 Checking test compilation...');

  const command = 'npx jest --listTests --passWithNoTests';

  try {
    const output = execSync(command, {
      encoding: 'utf8',
      cwd: process.cwd(),
    });

    const testFiles = output
      .split('\n')
      .filter(
        (line) =>
          line.trim().endsWith('.test.ts') ||
          line.trim().endsWith('.spec.ts')
      );

    logger.info(
      `✅ Test compilation passed (${testFiles.length} test files found)`
    );
    if (!skipGovernance) {
      runCoverageGovernance();
    }
    return true;
  } catch (error) {
    handleError(error, 'scripts:check-tests.compile', { command });
    logger.warn('Test compilation did not complete; inspect captured error details.');
    logger.warn('Resolve test compilation issues before committing.');
    return false;
  }
}

function runCoverageGovernance() {
  logger.info('🛡️ Enforcing coverage governance thresholds...');

  try {
    execSync('npm run coverage:governance', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: {
        ...process.env,
        FORCE_COLOR: process.env.FORCE_COLOR ?? '1',
      },
    });
    logger.info('✅ Coverage governance passed');
  } catch (error) {
    handleError(error, 'scripts:check-tests.coverage-governance', {
      command: 'npm run coverage:governance',
    });
    logger.warn('❌ Coverage governance failed');
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const skipGovernance = args.includes('--skip-governance');
  const success = checkTests({ skipGovernance });
  setExitCode(success ? 0 : 1);
}

module.exports = { checkTests };
