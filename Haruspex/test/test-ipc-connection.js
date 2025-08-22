/**
 * Test script for Haruspex IPC server connection
 * Tests the core IPC communication infrastructure
 * 
 * @description Validates IPC server startup, TCP binding, connection file creation,
 * and basic message exchange functionality
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const os = require('os');

class IPCConnectionTester {
    constructor() {
        this.testResults = [];
        this.connectionInfo = null;
        this.testClient = null;
        this.haruspexDir = path.join(os.homedir(), '.haruspex');
        this.connectionFile = path.join(this.haruspexDir, 'connection.json');
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${prefix} [${timestamp}] ${message}`);
    }

    async testConnectionFileExists() {
        this.log('Testing connection file existence...');
        
        try {
            if (!fs.existsSync(this.connectionFile)) {
                this.log('❌ Connection file not found. Is the Haruspex extension running?', 'error');
                this.testResults.push({ 
                    test: 'Connection File Existence', 
                    result: 'FAIL', 
                    error: 'Connection file not found at ' + this.connectionFile 
                });
                return false;
            }

            this.log('✅ Connection file found', 'success');
            this.testResults.push({ test: 'Connection File Existence', result: 'PASS' });
            return true;

        } catch (error) {
            this.log(`❌ Error checking connection file: ${error.message}`, 'error');
            this.testResults.push({ 
                test: 'Connection File Existence', 
                result: 'FAIL', 
                error: error.message 
            });
            return false;
        }
    }

    async testConnectionFileFormat() {
        this.log('Testing connection file format...');
        
        try {
            const fileContent = fs.readFileSync(this.connectionFile, 'utf8');
            this.connectionInfo = JSON.parse(fileContent);

            // Validate required fields
            const requiredFields = ['host', 'port', 'timestamp'];
            const missingFields = requiredFields.filter(field => !this.connectionInfo[field]);
            
            if (missingFields.length > 0) {
                throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
            }

            // Validate port is a number
            if (typeof this.connectionInfo.port !== 'number' || this.connectionInfo.port <= 0) {
                throw new Error(`Invalid port number: ${this.connectionInfo.port}`);
            }

            // Validate host is a string
            if (typeof this.connectionInfo.host !== 'string' || this.connectionInfo.host.length === 0) {
                throw new Error(`Invalid host: ${this.connectionInfo.host}`);
            }

            // Check if connection is not too old (within 1 hour)
            const age = Date.now() - this.connectionInfo.timestamp;
            const maxAge = 60 * 60 * 1000; // 1 hour
            
            if (age > maxAge) {
                this.log(`⚠️ Connection file is ${Math.round(age/1000/60)} minutes old`, 'warning');
            }

            this.log(`✅ Connection file format valid - Host: ${this.connectionInfo.host}, Port: ${this.connectionInfo.port}`, 'success');
            this.testResults.push({ 
                test: 'Connection File Format', 
                result: 'PASS',
                details: {
                    host: this.connectionInfo.host,
                    port: this.connectionInfo.port,
                    age: Math.round(age/1000)
                }
            });
            return true;

        } catch (error) {
            this.log(`❌ Connection file format error: ${error.message}`, 'error');
            this.testResults.push({ 
                test: 'Connection File Format', 
                result: 'FAIL', 
                error: error.message 
            });
            return false;
        }
    }

    async testTCPConnection() {
        this.log('Testing TCP connection...');
        
        return new Promise((resolve) => {
            if (!this.connectionInfo) {
                this.log('❌ No connection info available', 'error');
                this.testResults.push({ 
                    test: 'TCP Connection', 
                    result: 'FAIL', 
                    error: 'No connection info available' 
                });
                resolve(false);
                return;
            }

            const client = new net.Socket();
            const timeout = 5000; // 5 second timeout
            let connected = false;

            client.setTimeout(timeout);

            client.on('connect', () => {
                connected = true;
                this.log('✅ TCP connection successful', 'success');
                this.testResults.push({ 
                    test: 'TCP Connection', 
                    result: 'PASS',
                    details: {
                        host: this.connectionInfo.host,
                        port: this.connectionInfo.port
                    }
                });
                this.testClient = client;
                resolve(true);
            });

            client.on('error', (error) => {
                if (!connected) {
                    this.log(`❌ TCP connection failed: ${error.message}`, 'error');
                    this.testResults.push({ 
                        test: 'TCP Connection', 
                        result: 'FAIL', 
                        error: error.message 
                    });
                    resolve(false);
                }
            });

            client.on('timeout', () => {
                if (!connected) {
                    this.log('❌ TCP connection timeout', 'error');
                    this.testResults.push({ 
                        test: 'TCP Connection', 
                        result: 'FAIL', 
                        error: 'Connection timeout' 
                    });
                    client.destroy();
                    resolve(false);
                }
            });

            try {
                client.connect(this.connectionInfo.port, this.connectionInfo.host);
            } catch (error) {
                this.log(`❌ Failed to initiate connection: ${error.message}`, 'error');
                this.testResults.push({ 
                    test: 'TCP Connection', 
                    result: 'FAIL', 
                    error: error.message 
                });
                resolve(false);
            }
        });
    }

    async testPingPong() {
        this.log('Testing ping/pong message exchange...');
        
        return new Promise((resolve) => {
            if (!this.testClient) {
                this.log('❌ No active connection for ping test', 'error');
                this.testResults.push({ 
                    test: 'Ping/Pong Exchange', 
                    result: 'FAIL', 
                    error: 'No active connection' 
                });
                resolve(false);
                return;
            }

            const pingMessage = {
                id: `test-ping-${Date.now()}`,
                type: 'ping',
                timestamp: Date.now(),
                payload: null
            };

            let responseReceived = false;
            const timeout = 3000; // 3 second timeout

            const timer = setTimeout(() => {
                if (!responseReceived) {
                    this.log('❌ Ping response timeout', 'error');
                    this.testResults.push({ 
                        test: 'Ping/Pong Exchange', 
                        result: 'FAIL', 
                        error: 'Response timeout' 
                    });
                    resolve(false);
                }
            }, timeout);

            this.testClient.on('data', (data) => {
                if (responseReceived) return;

                try {
                    const response = JSON.parse(data.toString());
                    
                    if (response.requestId === pingMessage.id && response.type === 'pong') {
                        responseReceived = true;
                        clearTimeout(timer);
                        
                        const responseTime = Date.now() - pingMessage.timestamp;
                        this.log(`✅ Ping/pong successful - Response time: ${responseTime}ms`, 'success');
                        this.testResults.push({ 
                            test: 'Ping/Pong Exchange', 
                            result: 'PASS',
                            details: {
                                responseTime: responseTime,
                                messageId: pingMessage.id
                            }
                        });
                        resolve(true);
                    }
                } catch (error) {
                    if (!responseReceived) {
                        responseReceived = true;
                        clearTimeout(timer);
                        this.log(`❌ Invalid response format: ${error.message}`, 'error');
                        this.testResults.push({ 
                            test: 'Ping/Pong Exchange', 
                            result: 'FAIL', 
                            error: `Invalid response: ${error.message}` 
                        });
                        resolve(false);
                    }
                }
            });

            this.testClient.on('error', (error) => {
                if (!responseReceived) {
                    responseReceived = true;
                    clearTimeout(timer);
                    this.log(`❌ Connection error during ping: ${error.message}`, 'error');
                    this.testResults.push({ 
                        test: 'Ping/Pong Exchange', 
                        result: 'FAIL', 
                        error: error.message 
                    });
                    resolve(false);
                }
            });

            try {
                const messageData = JSON.stringify(pingMessage) + '\n';
                this.testClient.write(messageData);
                this.log(`Sent ping message: ${pingMessage.id}`);
            } catch (error) {
                responseReceived = true;
                clearTimeout(timer);
                this.log(`❌ Failed to send ping: ${error.message}`, 'error');
                this.testResults.push({ 
                    test: 'Ping/Pong Exchange', 
                    result: 'FAIL', 
                    error: error.message 
                });
                resolve(false);
            }
        });
    }

    async testHealthCheck() {
        this.log('Testing health check endpoint...');
        
        return new Promise((resolve) => {
            if (!this.testClient) {
                this.log('❌ No active connection for health check', 'error');
                this.testResults.push({ 
                    test: 'Health Check', 
                    result: 'FAIL', 
                    error: 'No active connection' 
                });
                resolve(false);
                return;
            }

            const healthMessage = {
                id: `test-health-${Date.now()}`,
                type: 'get_health',
                timestamp: Date.now(),
                payload: null
            };

            let responseReceived = false;
            const timeout = 3000;

            const timer = setTimeout(() => {
                if (!responseReceived) {
                    this.log('❌ Health check timeout', 'error');
                    this.testResults.push({ 
                        test: 'Health Check', 
                        result: 'FAIL', 
                        error: 'Health check timeout' 
                    });
                    resolve(false);
                }
            }, timeout);

            const dataHandler = (data) => {
                if (responseReceived) return;

                try {
                    const response = JSON.parse(data.toString());
                    
                    if (response.requestId === healthMessage.id && response.type === 'health_status') {
                        responseReceived = true;
                        clearTimeout(timer);
                        
                        this.log(`✅ Health check successful - Status: ${response.success ? 'healthy' : 'unhealthy'}`, 'success');
                        this.testResults.push({ 
                            test: 'Health Check', 
                            result: 'PASS',
                            details: {
                                healthy: response.success,
                                data: response.data
                            }
                        });
                        
                        // Remove the data handler to prevent interference with future tests
                        this.testClient.off('data', dataHandler);
                        resolve(true);
                    }
                } catch (error) {
                    if (!responseReceived) {
                        responseReceived = true;
                        clearTimeout(timer);
                        this.log(`❌ Invalid health response: ${error.message}`, 'error');
                        this.testResults.push({ 
                            test: 'Health Check', 
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
                const messageData = JSON.stringify(healthMessage) + '\n';
                this.testClient.write(messageData);
                this.log(`Sent health check: ${healthMessage.id}`);
            } catch (error) {
                responseReceived = true;
                clearTimeout(timer);
                this.log(`❌ Failed to send health check: ${error.message}`, 'error');
                this.testResults.push({ 
                    test: 'Health Check', 
                    result: 'FAIL', 
                    error: error.message 
                });
                this.testClient.off('data', dataHandler);
                resolve(false);
            }
        });
    }

    async cleanup() {
        this.log('Cleaning up test connection...');
        
        if (this.testClient) {
            try {
                this.testClient.end();
                this.testClient = null;
                this.log('Test client connection closed');
            } catch (error) {
                this.log(`Warning: Error closing test client: ${error.message}`, 'warning');
            }
        }
    }

    printResults() {
        this.log('\n' + '='.repeat(60));
        this.log('IPC CONNECTION TEST RESULTS');
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
            this.log('🎉 ALL IPC TESTS PASSED! Core IPC communication is working correctly.', 'success');
            return 0; // Exit code for success
        } else if (passed > failed) {
            this.log('⚠️ Some tests failed but majority passed. Check connection setup.', 'warning');
            return 1; // Exit code for partial failure
        } else {
            this.log('❌ Multiple test failures. IPC system needs attention.', 'error');
            return 2; // Exit code for major failure
        }
    }

    async runAllTests() {
        this.log('🧪 Starting Haruspex IPC Connection Tests...\n');
        
        try {
            const fileExists = await this.testConnectionFileExists();
            if (!fileExists) {
                this.log('Skipping remaining tests due to missing connection file');
                return this.printResults();
            }

            const validFormat = await this.testConnectionFileFormat();
            if (!validFormat) {
                this.log('Skipping remaining tests due to invalid connection file');
                return this.printResults();
            }

            const connected = await this.testTCPConnection();
            if (!connected) {
                this.log('Skipping remaining tests due to connection failure');
                return this.printResults();
            }

            await this.testPingPong();
            await this.testHealthCheck();
            
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
    const tester = new IPCConnectionTester();
    tester.runAllTests().then(exitCode => {
        process.exit(exitCode);
    }).catch(error => {
        console.error('❌ Test runner failed:', error);
        process.exit(3);
    });
}

module.exports = { IPCConnectionTester };