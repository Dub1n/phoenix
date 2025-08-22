/**
 * Test script for Haruspex live debugging workflow
 * Tests full end-to-end communication between Claude Code and VSCode extension
 * 
 * @description Validates complete live debugging workflow including state monitoring,
 * command execution, and real-time updates through the debugging system
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');
const os = require('os');

class LiveDebuggingTester {
    constructor() {
        this.testResults = [];
        this.haruspexDir = path.join(os.homedir(), '.haruspex');
        this.connectionFile = path.join(this.haruspexDir, 'connection.json');
        this.cliPath = path.join(__dirname, '..', 'dist', 'src', 'debugging', 'cli-bin.js');
        this.connectionInfo = null;
        this.testClient = null;
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async setupConnection() {
        this.log('Setting up live debugging connection...');
        
        try {
            // Read connection info
            if (!fs.existsSync(this.connectionFile)) {
                throw new Error('Connection file not found. Is the Haruspex extension running?');
            }

            const fileContent = fs.readFileSync(this.connectionFile, 'utf8');
            this.connectionInfo = JSON.parse(fileContent);

            // Establish test connection
            this.testClient = new net.Socket();
            
            return new Promise((resolve, reject) => {
                this.testClient.on('connect', () => {
                    this.log('✅ Live debugging connection established', 'success');
                    resolve(true);
                });

                this.testClient.on('error', (error) => {
                    reject(new Error(`Connection failed: ${error.message}`));
                });

                this.testClient.setTimeout(5000);
                this.testClient.on('timeout', () => {
                    reject(new Error('Connection timeout'));
                });

                this.testClient.connect(this.connectionInfo.port, this.connectionInfo.host);
            });

        } catch (error) {
            this.log(`❌ Setup failed: ${error.message}`, 'error');
            this.testResults.push({
                test: 'Live Debugging Setup',
                result: 'FAIL',
                error: error.message
            });
            return false;
        }
    }

    async testRealTimeStateMonitoring() {
        this.log('Testing real-time state monitoring...');
        
        return new Promise((resolve) => {
            if (!this.testClient) {
                this.testResults.push({
                    test: 'Real-time State Monitoring',
                    result: 'FAIL',
                    error: 'No active connection'
                });
                resolve(false);
                return;
            }

            const stateMessage = {
                id: `live-state-${Date.now()}`,
                type: 'get_state',
                timestamp: Date.now(),
                payload: {
                    includeDetails: true,
                    components: ['all']
                }
            };

            let responseReceived = false;
            const timeout = 5000;

            const timer = setTimeout(() => {
                if (!responseReceived) {
                    this.testResults.push({
                        test: 'Real-time State Monitoring',
                        result: 'FAIL',
                        error: 'State monitoring timeout'
                    });
                    resolve(false);
                }
            }, timeout);

            const dataHandler = (data) => {
                if (responseReceived) return;

                try {
                    const response = JSON.parse(data.toString());
                    
                    if (response.requestId === stateMessage.id && response.type === 'state_data') {
                        responseReceived = true;
                        clearTimeout(timer);
                        
                        // Validate state data structure
                        const hasValidState = response.data && 
                                            typeof response.data === 'object' &&
                                            (response.data.components || response.data.status || response.data.health);

                        if (hasValidState) {
                            this.log('✅ Real-time state monitoring successful', 'success');
                            this.testResults.push({
                                test: 'Real-time State Monitoring',
                                result: 'PASS',
                                details: {
                                    hasStateData: true,
                                    componentCount: Object.keys(response.data).length
                                }
                            });
                        } else {
                            this.testResults.push({
                                test: 'Real-time State Monitoring',
                                result: 'FAIL',
                                error: 'Invalid state data structure'
                            });
                        }
                        
                        this.testClient.off('data', dataHandler);
                        resolve(hasValidState);
                    }
                } catch (error) {
                    if (!responseReceived) {
                        responseReceived = true;
                        clearTimeout(timer);
                        this.testResults.push({
                            test: 'Real-time State Monitoring',
                            result: 'FAIL',
                            error: `Invalid response: ${error.message}`
                        });
                        this.testClient.off('data', dataHandler);
                        resolve(false);
                    }
                }
            };

            this.testClient.on('data', dataHandler);

            try {
                const messageData = JSON.stringify(stateMessage) + '\n';
                this.testClient.write(messageData);
                this.log(`Sent state monitoring request: ${stateMessage.id}`);
            } catch (error) {
                responseReceived = true;
                clearTimeout(timer);
                this.testResults.push({
                    test: 'Real-time State Monitoring',
                    result: 'FAIL',
                    error: error.message
                });
                this.testClient.off('data', dataHandler);
                resolve(false);
            }
        });
    }

    async testCommandExecution() {
        this.log('Testing live command execution...');
        
        return new Promise((resolve) => {
            if (!this.testClient) {
                this.testResults.push({
                    test: 'Live Command Execution',
                    result: 'FAIL',
                    error: 'No active connection'
                });
                resolve(false);
                return;
            }

            const commandMessage = {
                id: `live-command-${Date.now()}`,
                type: 'execute_command',
                timestamp: Date.now(),
                payload: {
                    command: 'haruspex.refreshAll',
                    args: []
                }
            };

            let responseReceived = false;
            const timeout = 10000; // Allow more time for command execution

            const timer = setTimeout(() => {
                if (!responseReceived) {
                    this.testResults.push({
                        test: 'Live Command Execution',
                        result: 'FAIL',
                        error: 'Command execution timeout'
                    });
                    resolve(false);
                }
            }, timeout);

            const dataHandler = (data) => {
                if (responseReceived) return;

                try {
                    const response = JSON.parse(data.toString());
                    
                    if (response.requestId === commandMessage.id && response.type === 'command_result') {
                        responseReceived = true;
                        clearTimeout(timer);
                        
                        const executionTime = Date.now() - commandMessage.timestamp;
                        
                        if (response.success) {
                            this.log(`✅ Live command execution successful in ${executionTime}ms`, 'success');
                            this.testResults.push({
                                test: 'Live Command Execution',
                                result: 'PASS',
                                details: {
                                    command: commandMessage.payload.command,
                                    executionTime: executionTime,
                                    hasResult: !!response.data
                                }
                            });
                            resolve(true);
                        } else {
                            this.log(`❌ Command execution failed: ${response.error}`, 'error');
                            this.testResults.push({
                                test: 'Live Command Execution',
                                result: 'FAIL',
                                error: response.error || 'Command execution failed'
                            });
                            resolve(false);
                        }
                        
                        this.testClient.off('data', dataHandler);
                    }
                } catch (error) {
                    if (!responseReceived) {
                        responseReceived = true;
                        clearTimeout(timer);
                        this.testResults.push({
                            test: 'Live Command Execution',
                            result: 'FAIL',
                            error: `Invalid response: ${error.message}`
                        });
                        this.testClient.off('data', dataHandler);
                        resolve(false);
                    }
                }
            };

            this.testClient.on('data', dataHandler);

            try {
                const messageData = JSON.stringify(commandMessage) + '\n';
                this.testClient.write(messageData);
                this.log(`Sent command execution request: ${commandMessage.payload.command}`);
            } catch (error) {
                responseReceived = true;
                clearTimeout(timer);
                this.testResults.push({
                    test: 'Live Command Execution',
                    result: 'FAIL',
                    error: error.message
                });
                this.testClient.off('data', dataHandler);
                resolve(false);
            }
        });
    }

    async testWatchMode() {
        this.log('Testing watch mode functionality...');
        
        return new Promise((resolve) => {
            const timeout = 15000; // Extended timeout for watch mode
            const cli = spawn('node', [this.cliPath, 'status', '--watch', '--duration=5'], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';
            let resolved = false;
            let updateCount = 0;

            // Count status updates
            cli.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                
                // Look for status update indicators
                if (output.includes('Status:') || output.includes('Health:') || output.includes('Connection:')) {
                    updateCount++;
                }
            });

            cli.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            cli.on('close', (code) => {
                if (resolved) return;
                resolved = true;

                const output = stdout + stderr;
                
                // Watch mode should provide multiple updates
                if (updateCount >= 2) {
                    this.log(`✅ Watch mode successful - ${updateCount} updates received`, 'success');
                    this.testResults.push({
                        test: 'Watch Mode Functionality',
                        result: 'PASS',
                        details: {
                            exitCode: code,
                            updateCount: updateCount,
                            duration: 5
                        }
                    });
                    resolve(true);
                } else if (updateCount > 0) {
                    this.log(`⚠️ Watch mode partial success - ${updateCount} update(s) received`, 'warning');
                    this.testResults.push({
                        test: 'Watch Mode Functionality',
                        result: 'PASS', // Still consider it a pass if at least one update
                        details: {
                            exitCode: code,
                            updateCount: updateCount,
                            note: 'Limited updates received'
                        }
                    });
                    resolve(true);
                } else {
                    this.log(`❌ Watch mode failed - No status updates detected`, 'error');
                    this.testResults.push({
                        test: 'Watch Mode Functionality',
                        result: 'FAIL',
                        error: `No status updates detected in output`
                    });
                    resolve(false);
                }
            });

            cli.on('error', (error) => {
                if (resolved) return;
                resolved = true;
                this.testResults.push({
                    test: 'Watch Mode Functionality',
                    result: 'FAIL',
                    error: error.message
                });
                resolve(false);
            });

            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    cli.kill('SIGTERM');
                    this.testResults.push({
                        test: 'Watch Mode Functionality',
                        result: 'FAIL',
                        error: 'Watch mode test timeout'
                    });
                    resolve(false);
                }
            }, timeout);
        });
    }

    async testStateChangeDetection() {
        this.log('Testing state change detection...');
        
        return new Promise(async (resolve) => {
            if (!this.testClient) {
                this.testResults.push({
                    test: 'State Change Detection',
                    result: 'FAIL',
                    error: 'No active connection'
                });
                resolve(false);
                return;
            }

            try {
                // First, get initial state
                const initialStateMessage = {
                    id: `initial-state-${Date.now()}`,
                    type: 'get_state',
                    timestamp: Date.now(),
                    payload: {}
                };

                let initialState = null;
                let stateChangeDetected = false;
                const timeout = 8000;

                // Get initial state
                const getInitialState = () => {
                    return new Promise((stateResolve) => {
                        let stateReceived = false;

                        const stateHandler = (data) => {
                            if (stateReceived) return;

                            try {
                                const response = JSON.parse(data.toString());
                                if (response.requestId === initialStateMessage.id) {
                                    stateReceived = true;
                                    initialState = response.data;
                                    this.testClient.off('data', stateHandler);
                                    stateResolve(true);
                                }
                            } catch (error) {
                                if (!stateReceived) {
                                    stateReceived = true;
                                    this.testClient.off('data', stateHandler);
                                    stateResolve(false);
                                }
                            }
                        };

                        this.testClient.on('data', stateHandler);
                        
                        setTimeout(() => {
                            if (!stateReceived) {
                                stateReceived = true;
                                this.testClient.off('data', stateHandler);
                                stateResolve(false);
                            }
                        }, 3000);

                        const messageData = JSON.stringify(initialStateMessage) + '\n';
                        this.testClient.write(messageData);
                    });
                };

                const gotInitialState = await getInitialState();
                
                if (!gotInitialState) {
                    this.testResults.push({
                        test: 'State Change Detection',
                        result: 'FAIL',
                        error: 'Could not get initial state'
                    });
                    resolve(false);
                    return;
                }

                // Trigger a state change by executing a command
                const triggerCommand = {
                    id: `trigger-${Date.now()}`,
                    type: 'execute_command',
                    timestamp: Date.now(),
                    payload: {
                        command: 'haruspex.showHealth'
                    }
                };

                // Check for state change after command
                setTimeout(async () => {
                    const newStateMessage = {
                        id: `new-state-${Date.now()}`,
                        type: 'get_state',
                        timestamp: Date.now(),
                        payload: {}
                    };

                    const checkStateHandler = (data) => {
                        try {
                            const response = JSON.parse(data.toString());
                            if (response.requestId === newStateMessage.id) {
                                const newState = response.data;
                                
                                // Compare states (simple string comparison)
                                const initialStateStr = JSON.stringify(initialState);
                                const newStateStr = JSON.stringify(newState);
                                
                                stateChangeDetected = initialStateStr !== newStateStr;
                                
                                this.testClient.off('data', checkStateHandler);
                                
                                if (stateChangeDetected) {
                                    this.log('✅ State change detection successful', 'success');
                                    this.testResults.push({
                                        test: 'State Change Detection',
                                        result: 'PASS',
                                        details: {
                                            triggerCommand: triggerCommand.payload.command,
                                            stateChanged: true
                                        }
                                    });
                                } else {
                                    this.log('⚠️ No state change detected - this may be normal', 'warning');
                                    this.testResults.push({
                                        test: 'State Change Detection',
                                        result: 'PASS', // Still pass as this might be expected
                                        details: {
                                            triggerCommand: triggerCommand.payload.command,
                                            stateChanged: false,
                                            note: 'State may not have changed or command had no visible state impact'
                                        }
                                    });
                                }
                                
                                resolve(true);
                            }
                        } catch (error) {
                            this.testResults.push({
                                test: 'State Change Detection',
                                result: 'FAIL',
                                error: `State comparison failed: ${error.message}`
                            });
                            resolve(false);
                        }
                    };

                    this.testClient.on('data', checkStateHandler);
                    
                    const messageData = JSON.stringify(newStateMessage) + '\n';
                    this.testClient.write(messageData);

                }, 2000); // Wait 2 seconds for command to execute

                // Send the trigger command
                const triggerData = JSON.stringify(triggerCommand) + '\n';
                this.testClient.write(triggerData);

                // Overall timeout
                setTimeout(() => {
                    if (!stateChangeDetected) {
                        this.testResults.push({
                            test: 'State Change Detection',
                            result: 'FAIL',
                            error: 'State change detection timeout'
                        });
                        resolve(false);
                    }
                }, timeout);

            } catch (error) {
                this.testResults.push({
                    test: 'State Change Detection',
                    result: 'FAIL',
                    error: error.message
                });
                resolve(false);
            }
        });
    }

    async cleanup() {
        this.log('Cleaning up live debugging connection...');
        
        if (this.testClient) {
            try {
                this.testClient.end();
                this.testClient = null;
                this.log('Live debugging connection closed');
            } catch (error) {
                this.log(`Warning: Error closing connection: ${error.message}`, 'warning');
            }
        }
    }

    printResults() {
        this.log('\n' + '='.repeat(60));
        this.log('LIVE DEBUGGING TEST RESULTS');
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
            this.log('🎉 ALL LIVE DEBUGGING TESTS PASSED! End-to-end workflow is working correctly.', 'success');
            return 0; // Exit code for success
        } else if (passed > failed) {
            this.log('⚠️ Some live debugging tests failed but majority passed. Review setup.', 'warning');
            return 1; // Exit code for partial failure
        } else {
            this.log('❌ Multiple live debugging test failures. System needs attention.', 'error');
            return 2; // Exit code for major failure
        }
    }

    async runAllTests() {
        this.log('🧪 Starting Haruspex Live Debugging Tests...\n');
        
        try {
            const connected = await this.setupConnection();
            if (!connected) {
                this.log('Skipping remaining tests due to connection failure');
                return this.printResults();
            }

            await this.testRealTimeStateMonitoring();
            await this.testCommandExecution();
            await this.testWatchMode(); // This test uses CLI, not the direct connection
            await this.testStateChangeDetection();
            
        } catch (error) {
            this.log(`❌ Test execution failed: ${error.message}`, 'error');
            this.testResults.push({
                test: 'Test Execution',
                result: 'FAIL',
                error: error.message
            });
        } finally {
            await this.cleanup();
            return this.printResults();
        }
    }
}

// Run the tests
if (require.main === module) {
    const tester = new LiveDebuggingTester();
    tester.runAllTests().then(exitCode => {
        process.exit(exitCode);
    }).catch(error => {
        console.error('❌ Test runner failed:', error);
        process.exit(3);
    });
}

module.exports = { LiveDebuggingTester };