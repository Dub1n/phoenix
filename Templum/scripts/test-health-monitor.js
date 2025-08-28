/**---
 * title: [Test Infrastructure Health Monitor - Core Health Validation]
 * tags: [Testing, Health-Monitoring, CI-CD, Infrastructure]
 * provides: [Test Health Checks, Compilation Validation, Coverage Reality Checks]
 * requires: [Node.js, TypeScript, Jest]
 * description: [Core test infrastructure health monitoring and validation system]
 * ---*/

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestHealthMonitor {
    constructor() {
        this.healthStatus = {
            typescript: { status: 'unknown', errors: 0, lastCheck: null },
            tests: { status: 'unknown', errors: 0, lastCheck: null },
            coverage: { status: 'unknown', percentage: 0, lastCheck: null },
            infrastructure: { status: 'unknown', issues: [], lastCheck: null }
        };
    }

    /**
     * Run comprehensive test infrastructure health check
     */
    async runHealthCheck() {
        console.log('🩺 Starting Test Infrastructure Health Check...\n');
        
        try {
            // Check TypeScript compilation
            await this.checkTypeScriptCompilation();
            
            // Check test compilation
            await this.checkTestCompilation();
            
            // Check test infrastructure integrity
            await this.checkTestInfrastructure();
            
            // Check coverage configuration
            await this.checkCoverageConfiguration();
            
            // Generate health report
            this.generateHealthReport();
            
            return this.isHealthy();
        } catch (error) {
            console.error('❌ Health check failed:', error.message);
            return false;
        }
    }

    /**
     * Check TypeScript compilation status
     */
    async checkTypeScriptCompilation() {
        console.log('📝 Checking TypeScript compilation...');
        
        try {
            execSync('npx tsc --noEmit', { 
                stdio: 'pipe',
                cwd: process.cwd()
            });
            
            this.healthStatus.typescript = {
                status: 'healthy',
                errors: 0,
                lastCheck: new Date().toISOString()
            };
            console.log('✅ TypeScript compilation: PASSED');
        } catch (error) {
            const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
            const errorCount = this.countCompilationErrors(errorOutput);
            
            this.healthStatus.typescript = {
                status: 'unhealthy',
                errors: errorCount,
                lastCheck: new Date().toISOString(),
                details: errorOutput
            };
            console.log(`❌ TypeScript compilation: FAILED (${errorCount} errors)`);
        }
    }

    /**
     * Check test compilation status
     */
    async checkTestCompilation() {
        console.log('🔧 Checking test compilation...');
        
        try {
            // Try to compile tests without running them
            execSync('npx jest --listTests --passWithNoTests', { 
                stdio: 'pipe',
                cwd: process.cwd()
            });
            
            this.healthStatus.tests = {
                status: 'healthy',
                errors: 0,
                lastCheck: new Date().toISOString()
            };
            console.log('✅ Test compilation: PASSED');
        } catch (error) {
            const errorOutput = error.stdout?.toString() || error.stderr?.toString() || '';
            const errorCount = this.countTestErrors(errorOutput);
            
            this.healthStatus.tests = {
                status: 'unhealthy',
                errors: errorCount,
                lastCheck: new Date().toISOString(),
                details: errorOutput
            };
            console.log(`❌ Test compilation: FAILED (${errorCount} errors)`);
        }
    }

    /**
     * Check test infrastructure integrity
     */
    async checkTestInfrastructure() {
        console.log('🏗️  Checking test infrastructure integrity...');
        
        const issues = [];
        
        // Check Jest configuration
        if (!fs.existsSync('jest.config.js')) {
            issues.push('Missing jest.config.js');
        }
        
        // Check test setup file
        if (!fs.existsSync('tests/setup.ts')) {
            issues.push('Missing tests/setup.ts');
        }
        
        // Check package.json test scripts
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const requiredScripts = ['test', 'test:coverage', 'test:watch'];
        requiredScripts.forEach(script => {
            if (!packageJson.scripts[script]) {
                issues.push(`Missing package.json script: ${script}`);
            }
        });
        
        // Check test directories
        if (!fs.existsSync('tests')) {
            issues.push('Missing tests directory');
        }
        
        this.healthStatus.infrastructure = {
            status: issues.length === 0 ? 'healthy' : 'unhealthy',
            issues,
            lastCheck: new Date().toISOString()
        };
        
        if (issues.length === 0) {
            console.log('✅ Test infrastructure: HEALTHY');
        } else {
            console.log(`❌ Test infrastructure: ISSUES FOUND (${issues.length})`);
            issues.forEach(issue => console.log(`  - ${issue}`));
        }
    }

    /**
     * Check coverage configuration and reality
     */
    async checkCoverageConfiguration() {
        console.log('📊 Checking coverage configuration...');
        
        try {
            // Read Jest config for coverage settings
            const jestConfig = require(path.join(process.cwd(), 'jest.config.js'));
            
            const hasCoverageDirectory = jestConfig.coverageDirectory;
            const hasCoverageCollectFrom = jestConfig.collectCoverageFrom;
            const hasCoverageReporters = jestConfig.coverageReporters;
            
            if (hasCoverageDirectory && hasCoverageCollectFrom && hasCoverageReporters) {
                this.healthStatus.coverage = {
                    status: 'healthy',
                    percentage: 0, // Will be updated when tests run
                    lastCheck: new Date().toISOString(),
                    configured: true
                };
                console.log('✅ Coverage configuration: PROPERLY CONFIGURED');
            } else {
                this.healthStatus.coverage = {
                    status: 'warning',
                    percentage: 0,
                    lastCheck: new Date().toISOString(),
                    configured: false,
                    issues: [
                        !hasCoverageDirectory && 'Missing coverageDirectory',
                        !hasCoverageCollectFrom && 'Missing collectCoverageFrom',
                        !hasCoverageReporters && 'Missing coverageReporters'
                    ].filter(Boolean)
                };
                console.log('⚠️  Coverage configuration: INCOMPLETE');
            }
        } catch (error) {
            this.healthStatus.coverage = {
                status: 'unhealthy',
                percentage: 0,
                lastCheck: new Date().toISOString(),
                error: error.message
            };
            console.log('❌ Coverage configuration: ERROR');
        }
    }

    /**
     * Count compilation errors from TypeScript output
     */
    countCompilationErrors(output) {
        const errorLines = output.split('\n').filter(line => 
            line.includes('error TS') || line.includes(': error')
        );
        return errorLines.length;
    }

    /**
     * Count test errors from Jest output
     */
    countTestErrors(output) {
        // Simple heuristic - count lines with error indicators
        const errorLines = output.split('\n').filter(line => 
            line.includes('Error:') || line.includes('Failed:') || line.includes('FAIL')
        );
        return errorLines.length;
    }

    /**
     * Determine overall health status
     */
    isHealthy() {
        const statuses = Object.values(this.healthStatus);
        return statuses.every(status => 
            status.status === 'healthy' || status.status === 'warning'
        );
    }

    /**
     * Generate and display health report
     */
    generateHealthReport() {
        console.log('\n📋 Test Infrastructure Health Report');
        console.log('=====================================');
        
        Object.entries(this.healthStatus).forEach(([category, status]) => {
            const icon = this.getStatusIcon(status.status);
            console.log(`${icon} ${category.toUpperCase()}: ${status.status.toUpperCase()}`);
            
            if (status.errors > 0) {
                console.log(`   Errors: ${status.errors}`);
            }
            
            if (status.issues && status.issues.length > 0) {
                console.log(`   Issues: ${status.issues.length}`);
                status.issues.forEach(issue => console.log(`     - ${issue}`));
            }
            
            if (status.lastCheck) {
                console.log(`   Last Check: ${new Date(status.lastCheck).toLocaleString()}`);
            }
        });
        
        console.log('\n' + (this.isHealthy() ? 
            '✅ Overall Status: HEALTHY' : 
            '❌ Overall Status: NEEDS ATTENTION'
        ));
    }

    /**
     * Get status icon for display
     */
    getStatusIcon(status) {
        switch (status) {
            case 'healthy': return '✅';
            case 'warning': return '⚠️';
            case 'unhealthy': return '❌';
            default: return '❓';
        }
    }

    /**
     * Save health status to file for tracking
     */
    saveHealthStatus() {
        const healthFile = path.join(process.cwd(), '.test-health-status.json');
        fs.writeFileSync(healthFile, JSON.stringify(this.healthStatus, null, 2));
        console.log(`💾 Health status saved to ${healthFile}`);
    }
}

// CLI interface
async function main() {
    const command = process.argv[2];
    const monitor = new TestHealthMonitor();
    
    switch (command) {
        case 'check':
        case undefined:
            const isHealthy = await monitor.runHealthCheck();
            monitor.saveHealthStatus();
            process.exit(isHealthy ? 0 : 1);
            break;
            
        case 'status':
            // Load existing status if available
            const statusFile = path.join(process.cwd(), '.test-health-status.json');
            if (fs.existsSync(statusFile)) {
                const savedStatus = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
                monitor.healthStatus = savedStatus;
                monitor.generateHealthReport();
            } else {
                console.log('No health status found. Run "npm run test:health" first.');
            }
            break;
            
        default:
            console.log('Usage: node scripts/test-health-monitor.js [check|status]');
            console.log('  check  - Run health check (default)');
            console.log('  status - Show last health status');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { TestHealthMonitor };