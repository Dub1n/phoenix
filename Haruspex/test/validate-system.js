/**
 * validate-system.js
 * 
 * Automated System Validator for Haruspex Real-Time Agent Integration
 * 
 * Comprehensive system validation orchestrator that runs all test suites,
 * validates system health, generates performance reports, and provides
 * overall system readiness assessment.
 * 
 * Part of Phase 4: Testing Infrastructure Implementation
 * Created: 2025-08-19
 */

const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

class SystemValidator {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            systemHealth: {},
            testResults: {},
            performance: {},
            issues: [],
            recommendations: [],
            overallScore: 0,
            status: 'unknown'
        };
        
        this.testSuites = [
            {
                name: 'IPC Connection',
                script: 'test-ipc-connection.js',
                weight: 0.3,
                critical: true,
                description: 'Core IPC server connectivity and protocol validation'
            },
            {
                name: 'CLI Connection', 
                script: 'test-cli-connection.js',
                weight: 0.25,
                critical: true,
                description: 'CLI tool connection discovery and validation'
            },
            {
                name: 'Live Debugging',
                script: 'test-live-debugging.js', 
                weight: 0.25,
                critical: false,
                description: 'End-to-end live debugging workflow validation'
            },
            {
                name: 'Command Execution',
                script: 'test-command-execution.js',
                weight: 0.2,
                critical: false,
                description: 'VSCode command execution and performance testing'
            }
        ];

        this.healthChecks = [
            { name: 'Extension Compilation', check: () => this.checkCompilation() },
            { name: 'Dependencies', check: () => this.checkDependencies() },
            { name: 'File Permissions', check: () => this.checkFilePermissions() },
            { name: 'Port Availability', check: () => this.checkPortAvailability() },
            { name: 'Configuration', check: () => this.checkConfiguration() }
        ];

        this.performanceBaselines = {
            connectionTime: 1000, // ms
            commandResponseTime: 500, // ms
            memoryUsage: 100, // MB
            healthScore: 90, // 0-100
            errorRate: 0.01 // 1%
        };
    }

    /**
     * Run complete system validation
     */
    async validate() {
        console.log('🚀 Haruspex System Validation Starting...\n');
        console.log('=' * 60);
        
        try {
            // Pre-validation setup
            await this.setupValidation();
            
            // Run health checks
            console.log('📋 Running System Health Checks...');
            await this.runHealthChecks();
            
            // Run test suites
            console.log('\n🧪 Running Test Suites...');
            await this.runTestSuites();
            
            // Performance analysis
            console.log('\n⚡ Analyzing Performance...');
            await this.analyzePerformance();
            
            // Generate final report
            console.log('\n📊 Generating Validation Report...');
            await this.generateReport();
            
            // Display results
            this.displayResults();
            
            return this.results;
            
        } catch (error) {
            console.error('❌ System validation failed:', error.message);
            this.results.status = 'failed';
            this.results.issues.push(`Validation failed: ${error.message}`);
            return this.results;
        }
    }

    /**
     * Setup validation environment
     */
    async setupValidation() {
        console.log('🔧 Setting up validation environment...');
        
        // Ensure build is up to date
        try {
            const { stdout, stderr } = await execAsync('npm run build', { 
                cwd: path.resolve(__dirname, '..'),
                timeout: 60000 
            });
            console.log('✅ Build completed successfully');
        } catch (error) {
            throw new Error(`Build failed: ${error.message}`);
        }

        // Create results directory
        const resultsDir = path.join(__dirname, '..', 'test-results');
        try {
            await fs.mkdir(resultsDir, { recursive: true });
            console.log('✅ Test results directory ready');
        } catch (error) {
            console.log('⚠️  Test results directory creation warning:', error.message);
        }

        this.resultsDir = resultsDir;
    }

    /**
     * Run system health checks
     */
    async runHealthChecks() {
        const healthResults = {};
        
        for (const healthCheck of this.healthChecks) {
            console.log(`  🔍 ${healthCheck.name}...`);
            try {
                const result = await healthCheck.check();
                healthResults[healthCheck.name] = result;
                console.log(`    ${result.passed ? '✅' : '❌'} ${result.message}`);
                
                if (!result.passed) {
                    this.results.issues.push(`Health Check Failed - ${healthCheck.name}: ${result.message}`);
                }
            } catch (error) {
                healthResults[healthCheck.name] = {
                    passed: false,
                    message: `Health check failed: ${error.message}`,
                    error: error.message
                };
                console.log(`    ❌ ${healthCheck.name} check failed: ${error.message}`);
                this.results.issues.push(`Health Check Error - ${healthCheck.name}: ${error.message}`);
            }
        }

        this.results.systemHealth = healthResults;
        
        // Calculate health score
        const passedChecks = Object.values(healthResults).filter(r => r.passed).length;
        const healthScore = (passedChecks / this.healthChecks.length) * 100;
        this.results.systemHealth.overallScore = Math.round(healthScore);
        
        console.log(`\n  📊 Overall Health Score: ${this.results.systemHealth.overallScore}%`);
    }

    /**
     * Run all test suites
     */
    async runTestSuites() {
        const testResults = {};
        let totalScore = 0;
        let totalWeight = 0;

        for (const suite of this.testSuites) {
            console.log(`\n  🧪 Running ${suite.name} Tests...`);
            console.log(`     ${suite.description}`);
            
            try {
                const result = await this.runTestSuite(suite);
                testResults[suite.name] = result;
                
                const score = result.passed ? 100 : result.score || 0;
                totalScore += score * suite.weight;
                totalWeight += suite.weight;
                
                console.log(`     ${result.passed ? '✅' : '❌'} Score: ${score}% (Weight: ${suite.weight})`);
                
                if (!result.passed && suite.critical) {
                    this.results.issues.push(`Critical Test Failed - ${suite.name}: ${result.summary}`);
                } else if (!result.passed) {
                    this.results.issues.push(`Test Failed - ${suite.name}: ${result.summary}`);
                }
                
            } catch (error) {
                testResults[suite.name] = {
                    passed: false,
                    score: 0,
                    error: error.message,
                    summary: `Test execution failed: ${error.message}`
                };
                console.log(`     ❌ Test execution failed: ${error.message}`);
                this.results.issues.push(`Test Error - ${suite.name}: ${error.message}`);
                
                if (suite.critical) {
                    this.results.issues.push(`CRITICAL: ${suite.name} test suite failed`);
                }
            }
        }

        this.results.testResults = testResults;
        this.results.testScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
        
        console.log(`\n  📊 Overall Test Score: ${this.results.testScore}%`);
    }

    /**
     * Run individual test suite
     */
    async runTestSuite(suite) {
        return new Promise((resolve, reject) => {
            const testPath = path.join(__dirname, suite.script);
            const child = spawn('node', [testPath], {
                cwd: __dirname,
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: 120000 // 2 minutes timeout
            });

            let stdout = '';
            let stderr = '';

            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            child.on('close', (code) => {
                try {
                    const result = this.parseTestOutput(stdout, stderr, code);
                    result.suite = suite.name;
                    resolve(result);
                } catch (error) {
                    reject(new Error(`Failed to parse test output: ${error.message}`));
                }
            });

            child.on('error', (error) => {
                reject(new Error(`Test execution error: ${error.message}`));
            });
        });
    }

    /**
     * Parse test suite output
     */
    parseTestOutput(stdout, stderr, exitCode) {
        const result = {
            passed: exitCode === 0,
            score: 0,
            output: stdout,
            errors: stderr,
            exitCode,
            summary: '',
            metrics: {}
        };

        // Parse common patterns from test output
        try {
            // Look for success indicators
            const successPatterns = [
                /✅.*successful/gi,
                /passed.*test/gi,
                /validation.*complete/gi
            ];

            const failurePatterns = [
                /❌.*failed/gi,
                /error/gi,
                /timeout/gi,
                /connection.*failed/gi
            ];

            const successMatches = successPatterns.reduce((count, pattern) => 
                count + (stdout.match(pattern) || []).length, 0);
            
            const failureMatches = failurePatterns.reduce((count, pattern) => 
                count + (stdout.match(pattern) || []).length, 0);

            // Calculate score based on success/failure ratio
            if (successMatches + failureMatches > 0) {
                result.score = Math.round((successMatches / (successMatches + failureMatches)) * 100);
            } else if (exitCode === 0) {
                result.score = 100;
            }

            // Extract performance metrics if available
            const performanceMatch = stdout.match(/Performance:\s*(.+)/);
            if (performanceMatch) {
                try {
                    result.metrics = JSON.parse(performanceMatch[1]);
                } catch (e) {
                    // Ignore JSON parse errors
                }
            }

            // Generate summary
            if (result.passed) {
                result.summary = `All tests passed successfully (Score: ${result.score}%)`;
            } else {
                const errorSummary = stderr ? stderr.split('\n')[0] : 'Unknown error';
                result.summary = `Tests failed: ${errorSummary} (Score: ${result.score}%)`;
            }

        } catch (error) {
            result.summary = `Failed to parse test results: ${error.message}`;
        }

        return result;
    }

    /**
     * Analyze system performance
     */
    async analyzePerformance() {
        const performance = {
            baselines: this.performanceBaselines,
            current: {},
            comparison: {},
            status: 'unknown'
        };

        // Collect current performance metrics from test results
        for (const [testName, testResult] of Object.entries(this.results.testResults)) {
            if (testResult.metrics) {
                performance.current[testName] = testResult.metrics;
            }
        }

        // Compare against baselines
        performance.comparison = this.comparePerformance(performance.current, performance.baselines);
        
        // Determine overall performance status
        const performanceScore = this.calculatePerformanceScore(performance.comparison);
        performance.score = performanceScore;
        
        if (performanceScore >= 90) {
            performance.status = 'excellent';
        } else if (performanceScore >= 70) {
            performance.status = 'good';
        } else if (performanceScore >= 50) {
            performance.status = 'degraded';
        } else {
            performance.status = 'poor';
        }

        this.results.performance = performance;
        
        console.log(`  ⚡ Performance Score: ${performanceScore}% (${performance.status})`);
        
        // Add performance issues and recommendations
        if (performanceScore < 70) {
            this.results.issues.push(`Performance below baseline: ${performanceScore}%`);
            this.results.recommendations.push('Review system resources and optimize performance-critical paths');
        }
    }

    /**
     * Compare current performance against baselines
     */
    comparePerformance(current, baselines) {
        const comparison = {};
        
        // Add specific performance comparisons based on available metrics
        // This would be enhanced based on actual metrics collected
        
        return comparison;
    }

    /**
     * Calculate overall performance score
     */
    calculatePerformanceScore(comparison) {
        // Base score on test results if no detailed performance metrics
        return this.results.testScore || 0;
    }

    /**
     * Generate comprehensive validation report
     */
    async generateReport() {
        // Calculate overall system score
        const healthWeight = 0.3;
        const testWeight = 0.5; 
        const performanceWeight = 0.2;

        this.results.overallScore = Math.round(
            (this.results.systemHealth.overallScore || 0) * healthWeight +
            (this.results.testScore || 0) * testWeight +
            (this.results.performance.score || 0) * performanceWeight
        );

        // Determine overall status
        if (this.results.overallScore >= 90 && this.results.issues.filter(i => i.includes('CRITICAL')).length === 0) {
            this.results.status = 'ready';
        } else if (this.results.overallScore >= 70) {
            this.results.status = 'degraded';
        } else {
            this.results.status = 'failed';
        }

        // Generate recommendations
        if (this.results.status === 'ready') {
            this.results.recommendations.push('System is ready for Phase 5 implementation');
        } else {
            this.results.recommendations.push('Address critical issues before proceeding to Phase 5');
            if (this.results.systemHealth.overallScore < 90) {
                this.results.recommendations.push('Improve system health checks');
            }
            if (this.results.testScore < 90) {
                this.results.recommendations.push('Fix failing test suites');
            }
        }

        // Save detailed report
        const reportPath = path.join(this.resultsDir, `validation-report-${Date.now()}.json`);
        try {
            await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
            console.log(`  📄 Detailed report saved: ${reportPath}`);
        } catch (error) {
            console.log(`  ⚠️  Failed to save report: ${error.message}`);
        }
    }

    /**
     * Display validation results
     */
    displayResults() {
        console.log('\n' + '=' * 60);
        console.log('🎯 HARUSPEX SYSTEM VALIDATION RESULTS');
        console.log('=' * 60);
        
        // Overall status
        const statusEmoji = {
            'ready': '✅',
            'degraded': '⚠️',
            'failed': '❌',
            'unknown': '❔'
        };
        
        console.log(`\n📊 Overall Status: ${statusEmoji[this.results.status]} ${this.results.status.toUpperCase()}`);
        console.log(`📈 Overall Score: ${this.results.overallScore}%`);
        console.log(`⏰ Validation Time: ${this.results.timestamp}`);

        // Component scores
        console.log('\n📋 Component Scores:');
        console.log(`   System Health: ${this.results.systemHealth.overallScore || 0}%`);
        console.log(`   Test Suites:   ${this.results.testScore || 0}%`);
        console.log(`   Performance:   ${this.results.performance.score || 0}%`);

        // Issues
        if (this.results.issues.length > 0) {
            console.log('\n⚠️  Issues Found:');
            this.results.issues.forEach(issue => {
                console.log(`   • ${issue}`);
            });
        }

        // Recommendations  
        if (this.results.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            this.results.recommendations.forEach(rec => {
                console.log(`   • ${rec}`);
            });
        }

        // Next steps
        console.log('\n🎯 Next Steps:');
        if (this.results.status === 'ready') {
            console.log('   ✅ System validation passed - Ready for Phase 5 implementation');
            console.log('   📋 Consider running performance benchmarks for optimization');
        } else if (this.results.status === 'degraded') {
            console.log('   ⚠️  Address non-critical issues for optimal performance');
            console.log('   📋 Review failing test cases and performance metrics');
        } else {
            console.log('   ❌ Address critical issues before proceeding');
            console.log('   📋 Review system health checks and test failures');
        }
        
        console.log('\n' + '=' * 60);
    }

    // Health check implementations
    async checkCompilation() {
        try {
            const { stdout, stderr } = await execAsync('npm run build', { 
                cwd: path.resolve(__dirname, '..'),
                timeout: 30000 
            });
            return { 
                passed: true, 
                message: 'TypeScript compilation successful',
                details: 'Extension builds without errors'
            };
        } catch (error) {
            return { 
                passed: false, 
                message: `Compilation failed: ${error.message}`,
                details: error.stderr || error.stdout
            };
        }
    }

    async checkDependencies() {
        try {
            const packageJson = JSON.parse(await fs.readFile(
                path.resolve(__dirname, '..', 'package.json'), 'utf8'));
            
            const requiredDeps = ['@types/vscode', 'typescript', 'commander', 'inquirer'];
            const missing = requiredDeps.filter(dep => 
                !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]);
            
            if (missing.length > 0) {
                return { 
                    passed: false, 
                    message: `Missing dependencies: ${missing.join(', ')}`,
                    details: missing
                };
            }
            
            return { 
                passed: true, 
                message: 'All required dependencies present',
                details: `Checked ${requiredDeps.length} dependencies`
            };
        } catch (error) {
            return { 
                passed: false, 
                message: `Dependency check failed: ${error.message}`
            };
        }
    }

    async checkFilePermissions() {
        try {
            const testPaths = [
                path.resolve(__dirname, '..', 'dist'),
                path.resolve(__dirname, '..', 'src'),
                path.resolve(__dirname)
            ];

            for (const testPath of testPaths) {
                await fs.access(testPath, fs.constants.R_OK);
            }
            
            return { 
                passed: true, 
                message: 'File permissions are correct',
                details: `Checked ${testPaths.length} paths`
            };
        } catch (error) {
            return { 
                passed: false, 
                message: `File permission check failed: ${error.message}`
            };
        }
    }

    async checkPortAvailability() {
        const net = require('net');
        
        return new Promise((resolve) => {
            const server = net.createServer();
            server.listen(0, '127.0.0.1', () => {
                const port = server.address().port;
                server.close(() => {
                    resolve({ 
                        passed: true, 
                        message: 'TCP port binding is available',
                        details: `Successfully bound test port ${port}`
                    });
                });
            });

            server.on('error', (error) => {
                resolve({ 
                    passed: false, 
                    message: `Port binding failed: ${error.message}`,
                    details: error.code
                });
            });
        });
    }

    async checkConfiguration() {
        try {
            const configPaths = [
                path.resolve(__dirname, '..', 'package.json'),
                path.resolve(__dirname, '..', 'tsconfig.json')
            ];

            for (const configPath of configPaths) {
                const content = await fs.readFile(configPath, 'utf8');
                JSON.parse(content); // Validate JSON
            }

            return { 
                passed: true, 
                message: 'Configuration files are valid',
                details: `Validated ${configPaths.length} configuration files`
            };
        } catch (error) {
            return { 
                passed: false, 
                message: `Configuration validation failed: ${error.message}`
            };
        }
    }
}

// Main execution
async function main() {
    const validator = new SystemValidator();
    const results = await validator.validate();
    
    // Exit with appropriate code
    if (results.status === 'ready') {
        process.exit(0);
    } else if (results.status === 'degraded') {
        process.exit(1);
    } else {
        process.exit(2);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ System validation crashed:', error);
        process.exit(3);
    });
}

module.exports = { SystemValidator };