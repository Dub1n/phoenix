/**---
 * title: [Coverage Governance Runner - Multi-suite Threshold Enforcement]
 * tags: [Testing, Coverage, Validation, Monitoring]
 * provides: [Coverage Governance, Threshold Validation, Coverage Monitoring]
 * requires: [Node.js, Jest, Coverage Reports]
 * description: [Executes unit, backend, and E2E suites with coverage, enforces thresholds, and archives history]
 * ---*/

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { coverageThresholds } = require('./coverage-thresholds');
const { createScriptRuntime } = require('./utils/script-runtime');

const runtime = createScriptRuntime('scripts:coverage-reality-check');
const rootLogger = runtime.logger;

const SUITE_DEFINITIONS = [
  {
    name: 'unit',
    label: 'Unit',
    command: 'npx jest --config jest.config.js --coverage --runInBand',
    summaryPath: 'coverage/unit/coverage-summary.json',
    thresholds: coverageThresholds.unit
  },
  {
    name: 'backend',
    label: 'Backend Integration',
    command: 'npx jest --config jest.backend.config.js --coverage --runInBand',
    summaryPath: 'coverage/backend/coverage-summary.json',
    thresholds: coverageThresholds.backend
  },
  {
    name: 'e2e',
    label: 'E2E',
    command: 'npx jest --config jest.e2e.config.js --coverage --runInBand',
    summaryPath: 'coverage/e2e/coverage-summary.json',
    thresholds: coverageThresholds.e2e
  }
];

const METRICS = ['statements', 'branches', 'functions', 'lines'];

class CoverageRealityCheck {
  constructor(runtimeHandle = runtime) {
    this.runtime = runtimeHandle;
    this.logger = rootLogger.child('runner');
    this.projectRoot = process.cwd();
    this.historyFile = path.join(this.projectRoot, '.coverage-history.json');
    this.suites = SUITE_DEFINITIONS.map((suite) => ({
      ...suite,
      command: suite.command,
      summaryPath: path.join(this.projectRoot, suite.summaryPath)
    }));
  }

  async runRealityCheck() {
    this.logger.info('📊 Running Coverage Governance (unit + backend + e2e)');
    console.log('📊 Running Coverage Governance (unit + backend + e2e)\n');

    try {
      await this.generateCoverage();
      const coverageResults = this.analyzeCoverage();
      const thresholdResults = this.checkThresholds(coverageResults);
      this.trackCoverageHistory(coverageResults);
      this.generateCoverageReport(coverageResults, thresholdResults);
      return thresholdResults.passed;
    } catch (error) {
      this.runtime.handleError(error, 'scripts:coverage-reality-check.run', {
        suites: this.suites.map((suite) => suite.name),
      });
      console.log(
        '❌ Coverage governance failed:',
        error instanceof Error ? error.message : String(error)
      );
      return false;
    }
  }

  async generateCoverage() {
    for (const suite of this.suites) {
      console.log(`🔍 Generating coverage for ${suite.label} suite...`);
      try {
        execSync(suite.command, {
          stdio: 'inherit',
          cwd: this.projectRoot,
          env: {
            ...process.env,
            FORCE_COLOR: process.env.FORCE_COLOR ?? '1'
          }
        });
      } catch (error) {
        if (fs.existsSync(suite.summaryPath)) {
          console.warn(`⚠️  ${suite.label} suite completed with failures, coverage artefact captured for analysis.`);
        } else {
          throw new Error(`Failed to generate coverage for ${suite.label} suite`);
        }
      }
    }
  }

  analyzeCoverage() {
    const suites = this.suites.map((suite) => {
      if (!fs.existsSync(suite.summaryPath)) {
        throw new Error(`Coverage summary missing for ${suite.label} suite at ${suite.summaryPath}`);
      }

      const summary = JSON.parse(fs.readFileSync(suite.summaryPath, 'utf8'));
      return {
        name: suite.name,
        label: suite.label,
        thresholds: suite.thresholds,
        metrics: this.extractMetrics(summary.total)
      };
    });

    return {
      suites,
      aggregate: this.combineSuiteMetrics(suites)
    };
  }

  extractMetrics(totalSummary) {
    const metrics = {};
    METRICS.forEach((metric) => {
      const { total = 0, covered = 0, pct = 0 } = totalSummary[metric] || {};
      metrics[metric] = { total, covered, pct: Number(pct.toFixed(2)) };
    });
    return metrics;
  }

  combineSuiteMetrics(suites) {
    const aggregate = {};

    METRICS.forEach((metric) => {
      const totals = suites.reduce(
        (acc, suite) => {
          const data = suite.metrics[metric];
          return {
            total: acc.total + data.total,
            covered: acc.covered + data.covered
          };
        },
        { total: 0, covered: 0 }
      );

      const pct = totals.total === 0 ? 100 : (totals.covered / totals.total) * 100;
      aggregate[metric] = {
        total: totals.total,
        covered: totals.covered,
        pct: Number(pct.toFixed(2))
      };
    });

    return aggregate;
  }

  checkThresholds(coverageResults) {
    const results = {
      passed: true,
      suites: {},
      aggregate: {}
    };

    coverageResults.suites.forEach((suite) => {
      results.suites[suite.name] = {};

      METRICS.forEach((metric) => {
        const actual = suite.metrics[metric].pct;
        const threshold = suite.thresholds[metric];
        const passed = actual >= threshold;
        results.suites[suite.name][metric] = { actual, threshold, passed };
        if (!passed) {
          results.passed = false;
        }
      });
    });

    results.aggregate = {};
    METRICS.forEach((metric) => {
      const actual = coverageResults.aggregate[metric].pct;
      const threshold = coverageThresholds.aggregate[metric];
      const passed = actual >= threshold;
      results.aggregate[metric] = { actual, threshold, passed };
      if (!passed) {
        results.passed = false;
      }
    });

    return results;
  }

  trackCoverageHistory(coverageResults) {
    let history = [];
    if (fs.existsSync(this.historyFile)) {
      try {
        const raw = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
        if (Array.isArray(raw)) {
          history = raw;
        }
      } catch (error) {
        console.warn('⚠️  Unable to parse existing coverage history, starting fresh.');
      }
    }

    const entry = {
      timestamp: new Date().toISOString(),
      suites: coverageResults.suites.reduce((acc, suite) => {
        acc[suite.name] = this.toHistoryRecord(suite.metrics);
        return acc;
      }, {}),
      aggregate: this.toHistoryRecord(coverageResults.aggregate)
    };

    history.push(entry);

    if (history.length > 50) {
      history = history.slice(-50);
    }

    fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
  }

  toHistoryRecord(metrics) {
    return METRICS.reduce((acc, metric) => {
      const data = metrics[metric];
      acc[metric] = {
        pct: data.pct,
        covered: data.covered,
        total: data.total
      };
      return acc;
    }, {});
  }

  analyzeTrends() {
    if (!fs.existsSync(this.historyFile)) {
      return { trend: 'no-history', message: 'No coverage history available' };
    }

    const history = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
    if (!Array.isArray(history) || history.length < 2) {
      return { trend: 'insufficient-data', message: 'Insufficient data for trend analysis' };
    }

    const latest = history[history.length - 1];
    const previous = history[history.length - 2];
    const latestMetrics = latest.aggregate || latest.coverage;
    const previousMetrics = previous.aggregate || previous.coverage;

    const avgChange =
      METRICS.reduce((sum, metric) => {
        const latestValue = latestMetrics?.[metric]?.pct ?? 0;
        const previousValue = previousMetrics?.[metric]?.pct ?? 0;
        return sum + (latestValue - previousValue);
      }, 0) / METRICS.length;

    if (avgChange > 1) {
      return { trend: 'improving', message: `Coverage improving (+${avgChange.toFixed(1)}%)` };
    } else if (avgChange < -1) {
      return { trend: 'declining', message: `Coverage declining (${avgChange.toFixed(1)}%)` };
    }

    return { trend: 'stable', message: 'Coverage stable' };
  }

  generateCoverageReport(coverageResults, thresholdResults) {
    console.log('\n📋 Coverage Governance Report');
    console.log('==================================');

    coverageResults.suites.forEach((suite) => {
      console.log(`\n${suite.label} suite:`);
      METRICS.forEach((metric) => {
        const status = thresholdResults.suites[suite.name][metric];
        const icon = status.passed ? '✅' : '❌';
        console.log(
          `  ${icon} ${metric.toUpperCase()}: ${status.actual}% (threshold: ${status.threshold}%)`
        );
      });
    });

    console.log('\nAggregate thresholds:');
    METRICS.forEach((metric) => {
      const status = thresholdResults.aggregate[metric];
      const icon = status.passed ? '✅' : '❌';
      console.log(`  ${icon} ${metric.toUpperCase()}: ${status.actual}% (threshold: ${status.threshold}%)`);
    });

    const trends = this.analyzeTrends();
    console.log(`\n📈 Trend: ${trends.message}`);
    console.log(`\n${thresholdResults.passed ? '✅' : '❌'} Overall: ${thresholdResults.passed ? 'PASSED' : 'FAILED'}`);

    if (!thresholdResults.passed) {
      console.log('\n💡 Governance Tips:');
      console.log('  - Strengthen tests at the suite that dipped below threshold.');
      console.log('  - Add integration scenarios covering branching logic.');
      console.log('  - Keep regression suites aligned with coverage expectations.');
    }
  }

  setRealisticThresholds(projectPhase = 'development') {
    switch (projectPhase) {
      case 'initial':
        return console.log(
          'Initial phase guidance -> unit: 40/30/45/40, backend: 25/20/30/25, e2e: 15/10/20/15'
        );
      case 'development':
        return console.log('Development phase thresholds codified in scripts/coverage-thresholds.js');
      case 'pre-production':
        return console.log(
          'Pre-production hint -> target unit ≥85%, backend ≥70%, e2e ≥55%, aggregate ≥85%'
        );
      case 'production':
        return console.log(
          'Production hint -> enforce ≥90% across suites, ensure aggregate ≥92%'
        );
      default:
        return console.log('Unknown phase. Supported phases: initial, development, pre-production, production.');
    }
  }
}

async function main() {
  const command = process.argv[2];
  const checker = new CoverageRealityCheck(runtime);

  switch (command) {
    case 'check':
    case 'governance':
    case undefined: {
      const passed = await checker.runRealityCheck();
      runtime.setExitCode(passed ? 0 : 1);
      break;
    }
    case 'set-thresholds': {
      const phase = process.argv[3] || 'development';
      checker.setRealisticThresholds(phase);
      runtime.setExitCode(0);
      break;
    }
    default: {
      console.log('Usage: node scripts/coverage-reality-check.js [governance|set-thresholds <phase>]');
      runtime.setExitCode(0);
    }
  }
}

if (require.main === module) {
  main().catch((error) => {
    runtime.handleError(error, 'scripts:coverage-reality-check.main');
    runtime.setExitCode(1);
  });
}

module.exports = { CoverageRealityCheck };
