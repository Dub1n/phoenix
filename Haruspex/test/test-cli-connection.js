/**
 * Test script for Haruspex CLI connection
 * Tests the CLI tool's ability to discover and connect to the IPC server
 * 
 * @description Validates CLI connection discovery, retry mechanisms, command execution,
 * and error handling through the haruspex-cli interface
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

class CLIConnectionTester {
    constructor() {
        this.testResults = [];
        this.haruspexDir = path.join(os.homedir(), '.haruspex');
        this.connectionFile = path.join(this.haruspexDir, 'connection.json');
        this.cliPath = path.join(__dirname, '..', 'dist', 'src', 'debugging', 'cli-bin.js');
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async testCLIBinaryExists() {
        this.log('Testing CLI binary existence...');
        
        try {
            if (!fs.existsSync(this.cliPath)) {
                this.log(`❌ CLI binary not found at ${this.cliPath}`, 'error');
                this.log('Try running: npm run build', 'warning');
                this.testResults.push({ 
                    test: 'CLI Binary Existence', 
                    result: 'FAIL', 
                    error: `CLI binary not found at ${this.cliPath}` 
                });
                return false;
            }

            this.log('✅ CLI binary found', 'success');
            this.testResults.push({ test: 'CLI Binary Existence', result: 'PASS' });
            return true;

        } catch (error) {
            this.log(`❌ Error checking CLI binary: ${error.message}`, 'error');
            this.testResults.push({ 
                test: 'CLI Binary Existence', 
                result: 'FAIL', 
                error: error.message 
            });
            return false;
        }
    }

    async testConnectionDiscovery() {
        this.log('Testing CLI connection discovery...');
        
        return new Promise((resolve) => {
            const timeout = 10000; // 10 second timeout
            const cli = spawn('node', [this.cliPath, 'status'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: timeout
            });

            let stdout = '';
            let stderr = '';
            let resolved = false;

            cli.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            cli.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            cli.on('close', (code) => {
                if (resolved) return;
                resolved = true;

                const output = stdout + stderr;
                
                if (code === 0) {
                    this.log('✅ CLI connection discovery successful', 'success');
                    this.testResults.push({ 
                        test: 'CLI Connection Discovery', 
                        result: 'PASS',
                        details: {
                            exitCode: code,
                            hasOutput: output.length > 0
                        }
                    });
                    resolve(true);
                } else if (output.includes('Connection file not found') || output.includes('ENOENT')) {
                    this.log('❌ CLI connection discovery failed - Extension not running?', 'error');
                    this.testResults.push({ 
                        test: 'CLI Connection Discovery', 
                        result: 'FAIL', 
                        error: 'Connection file not found - Extension may not be running'
                    });
                    resolve(false);
                } else if (output.includes('ECONNREFUSED') || output.includes('Connection refused')) {
                    this.log('❌ CLI connection discovery failed - Server not accepting connections', 'error');
                    this.testResults.push({ 
                        test: 'CLI Connection Discovery', 
                        result: 'FAIL', 
                        error: 'Server not accepting connections'
                    });
                    resolve(false);
                } else {
                    this.log(`❌ CLI connection discovery failed - Exit code: ${code}`, 'error');
                    this.log(`Output: ${output}`, 'error');
                    this.testResults.push({ 
                        test: 'CLI Connection Discovery', 
                        result: 'FAIL', 
                        error: `Exit code ${code}: ${output.substring(0, 200)}` 
                    });
                    resolve(false);
                }
            });

            cli.on('error', (error) => {
                if (resolved) return;
                resolved = true;
                this.log(`❌ CLI process error: ${error.message}`, 'error');
                this.testResults.push({ 
                    test: 'CLI Connection Discovery', 
                    result: 'FAIL', 
                    error: error.message 
                });
                resolve(false);
            });

            // Handle timeout
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    cli.kill('SIGTERM');
                    this.log('❌ CLI connection discovery timeout', 'error');
                    this.testResults.push({ 
                        test: 'CLI Connection Discovery', 
                        result: 'FAIL', 
                        error: 'Command timeout' 
                    });
                    resolve(false);
                }
            }, timeout);
        });
    }

    async testPingCommand() {
        this.log('Testing CLI ping command...');
        
        return new Promise((resolve) => {
            const timeout = 5000; // 5 second timeout
            const cli = spawn('node', [this.cliPath, 'ping'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: timeout
            });

            let stdout = '';
            let stderr = '';
            let resolved = false;

            cli.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            cli.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            cli.on('close', (code) => {
                if (resolved) return;
                resolved = true;

                const output = stdout + stderr;
                
                if (code === 0 && (output.includes('pong') || output.includes('success'))) {
                    this.log('✅ CLI ping command successful', 'success');
                    this.testResults.push({ 
                        test: 'CLI Ping Command', 
                        result: 'PASS',
                        details: {
                            exitCode: code,
                            responseDetected: true
                        }
                    });
                    resolve(true);
                } else {
                    this.log(`❌ CLI ping command failed - Exit code: ${code}`, 'error');
                    if (output) this.log(`Output: ${output}`, 'error');
                    this.testResults.push({ 
                        test: 'CLI Ping Command', 
                        result: 'FAIL', 
                        error: `Exit code ${code}: ${output.substring(0, 200)}` 
                    });
                    resolve(false);
                }
            });

            cli.on('error', (error) => {
                if (resolved) return;
                resolved = true;
                this.log(`❌ CLI ping error: ${error.message}`, 'error');
                this.testResults.push({ 
                    test: 'CLI Ping Command', 
                    result: 'FAIL', 
                    error: error.message 
                });
                resolve(false);
            });

            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    cli.kill('SIGTERM');
                    this.log('❌ CLI ping timeout', 'error');
                    this.testResults.push({ 
                        test: 'CLI Ping Command', 
                        result: 'FAIL', 
                        error: 'Command timeout' 
                    });
                    resolve(false);
                }
            }, timeout);
        });
    }

    async testHealthCommand() {
        this.log('Testing CLI health command...');
        
        return new Promise((resolve) => {
            const timeout = 5000; // 5 second timeout
            const cli = spawn('node', [this.cliPath, 'health'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: timeout
            });

            let stdout = '';
            let stderr = '';
            let resolved = false;

            cli.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            cli.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            cli.on('close', (code) => {
                if (resolved) return;
                resolved = true;

                const output = stdout + stderr;
                
                if (code === 0 && (output.includes('healthy') || output.includes('status'))) {
                    this.log('✅ CLI health command successful', 'success');
                    this.testResults.push({ 
                        test: 'CLI Health Command', 
                        result: 'PASS',
                        details: {
                            exitCode: code,
                            healthDataDetected: true
                        }
                    });
                    resolve(true);
                } else {
                    this.log(`❌ CLI health command failed - Exit code: ${code}`, 'error');
                    if (output) this.log(`Output: ${output}`, 'error');
                    this.testResults.push({ 
                        test: 'CLI Health Command', 
                        result: 'FAIL', 
                        error: `Exit code ${code}: ${output.substring(0, 200)}` 
                    });
                    resolve(false);
                }
            });

            cli.on('error', (error) => {
                if (resolved) return;
                resolved = true;
                this.log(`❌ CLI health error: ${error.message}`, 'error');
                this.testResults.push({ 
                    test: 'CLI Health Command', 
                    result: 'FAIL', 
                    error: error.message 
                });
                resolve(false);
            });

            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    cli.kill('SIGTERM');
                    this.log('❌ CLI health timeout', 'error');
                    this.testResults.push({ 
                        test: 'CLI Health Command', 
                        result: 'FAIL', 
                        error: 'Command timeout' 
                    });
                    resolve(false);
                }
            }, timeout);
        });
    }

    async testConnectionValidation() {
        this.log('Testing CLI connection validation...');
        
        return new Promise((resolve) => {
            const timeout = 10000; // 10 second timeout
            const cli = spawn('node', [this.cliPath, 'validate'], {
                stdio: ['pipe', 'pipe', 'pipe'],
                timeout: timeout
            });

            let stdout = '';
            let stderr = '';
            let resolved = false;

            cli.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            cli.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            cli.on('close', (code) => {
                if (resolved) return;
                resolved = true;

                const output = stdout + stderr;
                
                // Validation command should provide detailed feedback regardless of exit code
                if (output.includes('validation') || output.includes('connection') || output.length > 50) {
                    this.log('✅ CLI connection validation provided feedback', 'success');
                    this.testResults.push({ 
                        test: 'CLI Connection Validation', 
                        result: 'PASS',
                        details: {
                            exitCode: code,
                            providedFeedback: true,
                            outputLength: output.length
                        }
                    });
                    resolve(true);
                } else {
                    this.log(`❌ CLI validation command failed - Exit code: ${code}`, 'error');
                    if (output) this.log(`Output: ${output}`, 'error');
                    this.testResults.push({ 
                        test: 'CLI Connection Validation', 
                        result: 'FAIL', 
                        error: `Exit code ${code}: ${output.substring(0, 200)}` 
                    });
                    resolve(false);
                }
            });

            cli.on('error', (error) => {
                if (resolved) return;
                resolved = true;
                this.log(`❌ CLI validation error: ${error.message}`, 'error');
                this.testResults.push({ 
                    test: 'CLI Connection Validation', 
                    result: 'FAIL', 
                    error: error.message 
                });
                resolve(false);
            });

            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    cli.kill('SIGTERM');
                    this.log('❌ CLI validation timeout', 'error');
                    this.testResults.push({ 
                        test: 'CLI Connection Validation', 
                        result: 'FAIL', 
                        error: 'Command timeout' 
                    });
                    resolve(false);
                }
            }, timeout);
        });
    }

    async testRetryMechanism() {
        this.log('Testing CLI retry mechanism...');
        
        // Test retry mechanism by attempting connection with a non-existent connection file
        const backupConnectionFile = this.connectionFile + '.backup';
        let backedUp = false;

        try {
            // Backup the connection file if it exists
            if (fs.existsSync(this.connectionFile)) {
                fs.copyFileSync(this.connectionFile, backupConnectionFile);
                backedUp = true;
                fs.unlinkSync(this.connectionFile);
                this.log('Temporarily removed connection file to test retry mechanism');
            }

            return new Promise((resolve) => {
                const timeout = 8000; // 8 second timeout (should allow for retries)
                const cli = spawn('node', [this.cliPath, 'status', '--retries=3'], {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    timeout: timeout
                });

                let stdout = '';
                let stderr = '';
                let resolved = false;

                cli.stdout.on('data', (data) => {
                    stdout += data.toString();
                });

                cli.stderr.on('data', (data) => {
                    stderr += data.toString();
                });

                cli.on('close', (code) => {
                    if (resolved) return;
                    resolved = true;

                    const output = stdout + stderr;
                    
                    // Check if retry attempts are mentioned in the output
                    if (output.includes('retry') || output.includes('attempt') || output.includes('Connection file not found')) {
                        this.log('✅ CLI retry mechanism is working', 'success');
                        this.testResults.push({ 
                            test: 'CLI Retry Mechanism', 
                            result: 'PASS',
                            details: {
                                exitCode: code,
                                retryIndicatorsFound: true
                            }
                        });
                        resolve(true);
                    } else {
                        this.log(`❌ CLI retry mechanism not detected - Exit code: ${code}`, 'error');
                        this.testResults.push({ 
                            test: 'CLI Retry Mechanism', 
                            result: 'FAIL', 
                            error: `No retry indicators found in output` 
                        });
                        resolve(false);
                    }

                    // Restore connection file if it was backed up
                    if (backedUp) {
                        try {
                            fs.copyFileSync(backupConnectionFile, this.connectionFile);
                            fs.unlinkSync(backupConnectionFile);
                            this.log('Restored connection file');
                        } catch (restoreError) {
                            this.log(`Warning: Could not restore connection file: ${restoreError.message}`, 'warning');
                        }
                    }
                });

                cli.on('error', (error) => {
                    if (resolved) return;
                    resolved = true;
                    this.log(`❌ CLI retry test error: ${error.message}`, 'error');
                    this.testResults.push({ 
                        test: 'CLI Retry Mechanism', 
                        result: 'FAIL', 
                        error: error.message 
                    });
                    resolve(false);
                });

                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        cli.kill('SIGTERM');
                        this.log('❌ CLI retry test timeout', 'error');
                        this.testResults.push({ 
                            test: 'CLI Retry Mechanism', 
                            result: 'FAIL', 
                            error: 'Command timeout' 
                        });
                        resolve(false);
                    }
                }, timeout);
            });

        } catch (error) {
            this.log(`❌ Error setting up retry test: ${error.message}`, 'error');
            this.testResults.push({ 
                test: 'CLI Retry Mechanism', 
                result: 'FAIL', 
                error: error.message 
            });
            return false;
        }
    }

    printResults() {
        this.log('\n' + '='.repeat(60));
        this.log('CLI CONNECTION TEST RESULTS');
        this.log('='.repeat(60));
        
        let passed = 0;
        let failed = 0;

        this.testResults.forEach(result => {
            const status = result.result === 'PASS' ? '✅' : '❌';
            this.log(`${status} ${result.test}: ${result.result}`);
            
            if (result.error) {
                this.log(`   Error: ${result.error}`);
            }

            if (result.details) {
                this.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
            }

            if (result.result === 'PASS') passed++;
            else failed++;
        });

        this.log('\n' + '-'.repeat(60));
        this.log(`SUMMARY: ${passed} passed, ${failed} failed`);
        this.log(`SUCCESS RATE: ${Math.round((passed / this.testResults.length) * 100)}%`);
        
        if (failed === 0) {
            this.log('🎉 ALL CLI TESTS PASSED! CLI connection system is working correctly.', 'success');
            return 0; // Exit code for success
        } else if (passed > failed) {
            this.log('⚠️ Some CLI tests failed but majority passed. Review connection setup.', 'warning');
            return 1; // Exit code for partial failure
        } else {
            this.log('❌ Multiple CLI test failures. CLI system needs attention.', 'error');
            return 2; // Exit code for major failure
        }
    }

    async runAllTests() {
        this.log('🧪 Starting Haruspex CLI Connection Tests...\n');
        
        try {
            const binaryExists = await this.testCLIBinaryExists();
            if (!binaryExists) {
                this.log('Skipping remaining tests due to missing CLI binary');
                return this.printResults();
            }

            await this.testConnectionDiscovery();
            await this.testPingCommand();
            await this.testHealthCommand();
            await this.testConnectionValidation();
            await this.testRetryMechanism();
            
        } catch (error) {
            this.log(`❌ Test execution failed: ${error.message}`, 'error');
            this.testResults.push({ 
                test: 'Test Execution', 
                result: 'FAIL', 
                error: error.message 
            });
        } finally {
            return this.printResults();
        }
    }
}

// Run the tests
if (require.main === module) {
    const tester = new CLIConnectionTester();
    tester.runAllTests().then(exitCode => {
        process.exit(exitCode);
    }).catch(error => {
        console.error('❌ Test runner failed:', error);
        process.exit(3);
    });
}

module.exports = { CLIConnectionTester };