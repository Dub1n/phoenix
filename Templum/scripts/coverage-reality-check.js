/**---
 * title: [Coverage Reality Check - Coverage Validation and Monitoring]
 * tags: [Testing, Coverage, Validation, Monitoring]
 * provides: [Coverage Reality Checks, Threshold Validation, Coverage Monitoring]
 * requires: [Node.js, Jest, Coverage Reports]
 * description: [Validates actual test coverage against realistic expectations and prevents coverage degradation]
 * ---*/

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class CoverageRealityCheck {
    constructor() {
        this.thresholds = {
            // Realistic thresholds for a developing project
            statements: 60,  // 60% statement coverage minimum
            branches: 50,    // 50% branch coverage minimum
            functions: 65,   // 65% function coverage minimum
            lines: 60        // 60% line coverage minimum
        };
        
        this.coverageFile = path.join(process.cwd(), 'coverage/coverage-summary.json');
        this.historyFile = path.join(process.cwd(), '.coverage-history.json');
    }

    /**
     * Run coverage reality check
     */
    async runRealityCheck() {
        console.log('📊 Running Coverage Reality Check...\n');
        
        try {
            // Generate fresh coverage report
            await this.generateCoverage();
            
            // Analyze coverage results
            const coverageData = await this.analyzeCoverage();
            
            // Check against thresholds
            const thresholdResults = this.checkThresholds(coverageData);
            
            // Track coverage history
            await this.trackCoverageHistory(coverageData);
            
            // Generate coverage report
            this.generateCoverageReport(coverageData, thresholdResults);
            
            return thresholdResults.passed;
        } catch (error) {
            console.error('❌ Coverage reality check failed:', error.message);
            return false;
        }
    }

    /**
     * Generate coverage report with Jest
     */
    async generateCoverage() {
        console.log('🔍 Generating coverage report...');
        
        try {
            execSync('npm run test:coverage -- --passWithNoTests', { 
                stdio: 'pipe',
                cwd: process.cwd()
            });
            console.log('✅ Coverage report generated');
        } catch (error) {
            // Coverage might still be generated even if some tests fail
            if (fs.existsSync(this.coverageFile)) {
                console.log('⚠️  Coverage report generated with test failures');
            } else {
                throw new Error('Failed to generate coverage report');
            }
        }
    }

    /**
     * Analyze coverage data from Jest output
     */
    async analyzeCoverage() {
        if (!fs.existsSync(this.coverageFile)) {
            throw new Error('Coverage summary file not found');
        }
        
        const coverageData = JSON.parse(fs.readFileSync(this.coverageFile, 'utf8'));
        return coverageData.total;
    }

    /**
     * Check coverage against realistic thresholds
     */
    checkThresholds(coverageData) {
        const results = {
            passed: true,
            checks: {}
        };
        
        Object.entries(this.thresholds).forEach(([metric, threshold]) => {
            const actual = coverageData[metric]?.pct || 0;
            const passed = actual >= threshold;
            
            results.checks[metric] = {
                actual,
                threshold,
                passed,
                status: passed ? 'PASS' : 'FAIL'
            };
            
            if (!passed) {
                results.passed = false;
            }
        });
        
        return results;
    }

    /**
     * Track coverage history for trend analysis
     */
    async trackCoverageHistory(coverageData) {
        let history = [];
        
        if (fs.existsSync(this.historyFile)) {
            history = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
        }
        
        const entry = {
            timestamp: new Date().toISOString(),
            coverage: {
                statements: coverageData.statements?.pct || 0,
                branches: coverageData.branches?.pct || 0,
                functions: coverageData.functions?.pct || 0,
                lines: coverageData.lines?.pct || 0
            }
        };
        
        history.push(entry);
        
        // Keep only last 50 entries to prevent file bloat
        if (history.length > 50) {
            history = history.slice(-50);
        }
        
        fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2));
    }

    /**
     * Analyze coverage trends
     */
    analyzeTrends() {
        if (!fs.existsSync(this.historyFile)) {
            return { trend: 'no-history', message: 'No coverage history available' };
        }
        
        const history = JSON.parse(fs.readFileSync(this.historyFile, 'utf8'));
        
        if (history.length < 2) {
            return { trend: 'insufficient-data', message: 'Insufficient data for trend analysis' };
        }
        
        const latest = history[history.length - 1];
        const previous = history[history.length - 2];
        
        const avgChange = Object.keys(this.thresholds).reduce((sum, metric) => {
            return sum + (latest.coverage[metric] - previous.coverage[metric]);
        }, 0) / Object.keys(this.thresholds).length;
        
        if (avgChange > 1) {
            return { trend: 'improving', message: `Coverage improving (+${avgChange.toFixed(1)}%)` };
        } else if (avgChange < -1) {
            return { trend: 'declining', message: `Coverage declining (${avgChange.toFixed(1)}%)` };
        } else {
            return { trend: 'stable', message: 'Coverage stable' };
        }
    }

    /**
     * Generate and display coverage report
     */
    generateCoverageReport(coverageData, thresholdResults) {
        console.log('\n📋 Coverage Reality Check Report');
        console.log('==================================');
        
        Object.entries(thresholdResults.checks).forEach(([metric, result]) => {
            const icon = result.passed ? '✅' : '❌';
            console.log(`${icon} ${metric.toUpperCase()}: ${result.actual}% (threshold: ${result.threshold}%)`);
        });
        
        // Show trend analysis
        const trends = this.analyzeTrends();
        console.log(`📈 Trend: ${trends.message}`);
        
        console.log(`\n${thresholdResults.passed ? '✅' : '❌'} Overall: ${thresholdResults.passed ? 'PASSED' : 'FAILED'}`);
        
        if (!thresholdResults.passed) {
            console.log('\n💡 Coverage Reality Check Tips:');
            console.log('  - Focus on testing critical business logic first');
            console.log('  - Add tests for new features before marking tasks complete');
            console.log('  - Consider integration tests for complex workflows');
            console.log('  - Remember: Quality over quantity in test coverage');
        }
    }

    /**
     * Set realistic coverage thresholds based on project state
     */
    setRealisticThresholds(projectPhase = 'development') {
        switch (projectPhase) {
            case 'initial':
                this.thresholds = { statements: 30, branches: 25, functions: 35, lines: 30 };
                break;
            case 'development':
                this.thresholds = { statements: 60, branches: 50, functions: 65, lines: 60 };
                break;
            case 'pre-production':
                this.thresholds = { statements: 80, branches: 70, functions: 85, lines: 80 };
                break;
            case 'production':
                this.thresholds = { statements: 90, branches: 80, functions: 90, lines: 90 };
                break;
        }
        console.log(`📊 Coverage thresholds set for ${projectPhase} phase`);
    }
}

// CLI interface
async function main() {
    const command = process.argv[2];
    const checker = new CoverageRealityCheck();
    
    switch (command) {
        case 'check':
        case undefined:
            const passed = await checker.runRealityCheck();
            process.exit(passed ? 0 : 1);
            break;
            
        case 'set-thresholds':
            const phase = process.argv[3] || 'development';
            checker.setRealisticThresholds(phase);
            console.log('Use this in your package.json scripts or CI/CD pipeline');
            break;
            
        default:
            console.log('Usage: node scripts/coverage-reality-check.js [check|set-thresholds <phase>]');
            console.log('  check           - Run coverage reality check (default)');
            console.log('  set-thresholds  - Show how to set thresholds for project phase');
            console.log('                   phases: initial, development, pre-production, production');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { CoverageRealityCheck };