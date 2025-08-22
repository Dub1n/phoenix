/**
 * stress-test.js
 * 
 * Connection Stress Testing Suite for Haruspex Real-Time Agent Integration
 * 
 * Comprehensive stress testing for:
 * - Rapid connect/disconnect cycles
 * - Concurrent connection handling
 * - High-frequency message sending
 * - Resource exhaustion scenarios
 * - Recovery under extreme load
 * 
 * Part of Phase 4: Testing Infrastructure Implementation
 * Created: 2025-08-19
 */

const { performance } = require('perf_hooks');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const fs = require('fs').promises;
const path = require('path');

class HaruspexStressTest {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            testResults: {},
            systemHealth: {},
            failures: [],
            recommendations: [],
            overallScore: 0,
            status: 'unknown'
        };

        this.stressConfigs = {
            connectionCycling: {
                cycles: 200,
                concurrent: 10,
                delayBetweenCycles: 10, // ms
                timeout: 5000
            },
            concurrentConnections: {
                maxConcurrent: 50,
                rampUpTime: 5000, // ms
                holdTime: 10000, // ms
                rampDownTime: 2000 // ms
            },
            messageFlood: {
                messagesPerSecond: 500,
                duration: 30000, // 30 seconds
                messageSize: 1024,
                concurrent: 20
            },
            resourceExhaustion: {
                memoryTarget: 500 * 1024 * 1024, // 500MB
                connectionTarget: 100,
                timeout: 60000 // 1 minute
            }
        };

        // Import IPC client
        this.IPCClient = null;
        this.initializeClient();
    }

    async initializeClient() {
        try {
            const clientPath = path.resolve(__dirname, '..', 'dist', 'src', 'debugging', 'ipc-client.js');
            const clientModule = require(clientPath);
            this.IPCClient = clientModule.HaruspexIPCClient;
            console.log('✅ IPC Client loaded for stress testing');
        } catch (error) {
            throw new Error(`IPC Client initialization failed: ${error.message}`);
        }
    }

    /**
     * Run comprehensive stress test suite
     */
    async runStressTests() {
        console.log('🔥 Haruspex Connection Stress Test Suite Starting...\n');
        console.log('⚠️  WARNING: This test will create significant system load');
        console.log('=' * 60);
        
        try {
            // Setup stress testing environment
            await this.setupStressTest();
            
            // Run connection cycling stress test
            console.log('\n🔄 Running Connection Cycling Stress Test...');
            await this.stressTestConnectionCycling();
            
            // Run concurrent connection stress test
            console.log('\n🚀 Running Concurrent Connection Stress Test...');
            await this.stressTestConcurrentConnections();
            
            // Run message flood stress test
            console.log('\n📨 Running Message Flood Stress Test...');
            await this.stressTestMessageFlood();
            
            // Run resource exhaustion test
            console.log('\n🧠 Running Resource Exhaustion Test...');
            await this.stressTestResourceExhaustion();
            
            // Analyze stress test results
            console.log('\n📊 Analyzing Stress Test Results...');
            await this.analyzeStressResults();
            
            // Generate stress test report
            await this.generateStressReport();
            
            // Display stress test summary
            this.displayStressSummary();
            
            return this.results;
            
        } catch (error) {
            console.error('❌ Stress test suite failed:', error.message);
            this.results.status = 'failed';
            this.results.failures.push(`Stress test suite failure: ${error.message}`);
            return this.results;
        }
    }

    /**
     * Setup stress testing environment
     */
    async setupStressTest() {
        console.log('🔧 Setting up stress test environment...');
        
        // Verify IPC client availability
        if (!this.IPCClient) {
            throw new Error('IPC Client not available for stress testing');
        }
        
        // Create results directory
        const resultsDir = path.join(__dirname, '..', 'stress-test-results');
        try {
            await fs.mkdir(resultsDir, { recursive: true });
            this.resultsDir = resultsDir;
        } catch (error) {
            console.log('⚠️  Stress test results directory warning:', error.message);
        }
        
        // Record baseline system metrics
        this.baselineMetrics = {
            memory: process.memoryUsage(),
            timestamp: Date.now()
        };
        
        // Warm up system
        console.log('🔥 Warming up system for stress testing...');
        await this.warmupForStress();
        
        console.log('✅ Stress test environment ready');
    }

    /**
     * Warm up system for stress testing
     */
    async warmupForStress() {
        try {
            // Perform initial connections to establish baseline
            const connections = [];
            for (let i = 0; i < 5; i++) {
                const client = new this.IPCClient();
                await client.connect();
                connections.push(client);
            }
            
            // Clean up warmup connections
            await Promise.all(connections.map(client => client.disconnect()));
            
        } catch (error) {
            console.log('⚠️  Stress warmup warning:', error.message);
        }
    }

    /**
     * Stress test connection cycling
     */
    async stressTestConnectionCycling() {
        const config = this.stressConfigs.connectionCycling;
        const testResult = {
            name: 'Connection Cycling',
            config: config,
            cycles: [],
            metrics: {},
            failures: 0,
            startTime: Date.now()
        };

        console.log(`  🔄 Testing ${config.cycles} connection cycles with ${config.concurrent} concurrent connections...`);
        
        const batchSize = config.concurrent;
        const totalBatches = Math.ceil(config.cycles / batchSize);
        
        for (let batch = 0; batch < totalBatches; batch++) {
            const batchStart = performance.now();
            const currentBatchSize = Math.min(batchSize, config.cycles - (batch * batchSize));
            
            if (batch % 10 === 0) {
                console.log(`    Progress: Batch ${batch + 1}/${totalBatches} (${Math.round((batch / totalBatches) * 100)}%)`);
                
                // Memory check every 10 batches
                const currentMemory = process.memoryUsage();
                console.log(`    Memory: ${(currentMemory.rss / 1024 / 1024).toFixed(2)} MB RSS`);
            }

            // Create batch of concurrent connections
            const batchPromises = [];
            for (let i = 0; i < currentBatchSize; i++) {
                batchPromises.push(this.performConnectionCycle());
            }

            try {
                const batchResults = await Promise.allSettled(batchPromises);
                
                // Process batch results
                const batchMetrics = {
                    batchIndex: batch,
                    connectionCount: currentBatchSize,
                    duration: performance.now() - batchStart,
                    successes: 0,
                    failures: 0,
                    errors: []
                };

                batchResults.forEach(result => {
                    if (result.status === 'fulfilled' && result.value.success) {
                        batchMetrics.successes++;
                        testResult.cycles.push(result.value);
                    } else {
                        batchMetrics.failures++;
                        testResult.failures++;
                        
                        const error = result.status === 'rejected' ? result.reason.message : result.value.error;
                        batchMetrics.errors.push(error);
                    }
                });

                // Brief pause between batches to prevent overwhelming
                if (config.delayBetweenCycles > 0) {
                    await this.sleep(config.delayBetweenCycles);
                }
                
            } catch (error) {
                console.log(`    ❌ Batch ${batch} failed: ${error.message}`);
                testResult.failures += currentBatchSize;
            }
        }

        testResult.endTime = Date.now();
        testResult.duration = testResult.endTime - testResult.startTime;

        // Calculate metrics
        const successfulCycles = testResult.cycles.length;
        testResult.metrics = {
            totalCycles: config.cycles,
            successfulCycles: successfulCycles,
            failedCycles: testResult.failures,
            successRate: successfulCycles / config.cycles,
            averageCycleTime: successfulCycles > 0 ? testResult.cycles.reduce((sum, cycle) => sum + cycle.duration, 0) / successfulCycles : 0,
            cyclesPerSecond: successfulCycles / (testResult.duration / 1000)
        };

        this.results.testResults.connectionCycling = testResult;
        
        console.log(`    ✅ Completed: ${successfulCycles}/${config.cycles} cycles (${(testResult.metrics.successRate * 100).toFixed(1)}%)`);
        console.log(`    ⚡ Rate: ${testResult.metrics.cyclesPerSecond.toFixed(2)} cycles/sec`);
    }

    /**
     * Perform single connection cycle
     */
    async performConnectionCycle() {
        const startTime = performance.now();
        const client = new this.IPCClient();
        
        try {
            await client.connect();
            await client.sendMessage({ type: 'ping', timestamp: Date.now() });
            await client.disconnect();
            
            return {
                success: true,
                duration: performance.now() - startTime,
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                success: false,
                duration: performance.now() - startTime,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    /**
     * Stress test concurrent connections
     */
    async stressTestConcurrentConnections() {
        const config = this.stressConfigs.concurrentConnections;
        const testResult = {
            name: 'Concurrent Connections',
            config: config,
            phases: [],
            metrics: {},
            failures: 0,
            startTime: Date.now()
        };

        console.log(`  🚀 Testing up to ${config.maxConcurrent} concurrent connections...`);

        // Phase 1: Ramp up connections
        console.log(`    📈 Ramp up phase (${config.rampUpTime/1000}s)...`);
        const rampUpResult = await this.rampUpConnections(config);
        testResult.phases.push(rampUpResult);

        // Phase 2: Hold connections
        console.log(`    🔒 Hold phase (${config.holdTime/1000}s)...`);
        const holdResult = await this.holdConnections(rampUpResult.connections, config.holdTime);
        testResult.phases.push(holdResult);

        // Phase 3: Ramp down connections
        console.log(`    📉 Ramp down phase (${config.rampDownTime/1000}s)...`);
        const rampDownResult = await this.rampDownConnections(rampUpResult.connections, config.rampDownTime);
        testResult.phases.push(rampDownResult);

        testResult.endTime = Date.now();
        testResult.duration = testResult.endTime - testResult.startTime;

        // Calculate overall metrics
        testResult.metrics = {
            peakConnections: rampUpResult.successfulConnections,
            targetConnections: config.maxConcurrent,
            connectionEfficiency: rampUpResult.successfulConnections / config.maxConcurrent,
            totalErrors: testResult.phases.reduce((sum, phase) => sum + (phase.errors || 0), 0),
            phases: testResult.phases.map(phase => ({
                name: phase.name,
                duration: phase.duration,
                success: phase.success
            }))
        };

        this.results.testResults.concurrentConnections = testResult;
        
        console.log(`    ✅ Peak: ${rampUpResult.successfulConnections}/${config.maxConcurrent} connections`);
        console.log(`    📊 Efficiency: ${(testResult.metrics.connectionEfficiency * 100).toFixed(1)}%`);
    }

    /**
     * Ramp up connections gradually
     */
    async rampUpConnections(config) {
        const startTime = performance.now();
        const connections = [];
        const stepSize = Math.ceil(config.maxConcurrent / 10); // 10 steps
        const stepDelay = config.rampUpTime / 10;
        let successfulConnections = 0;

        for (let step = 0; step < 10; step++) {
            const connectionsToAdd = Math.min(stepSize, config.maxConcurrent - connections.length);
            
            console.log(`      Step ${step + 1}: Adding ${connectionsToAdd} connections (Total: ${connections.length + connectionsToAdd})`);
            
            // Add connections for this step
            const stepPromises = [];
            for (let i = 0; i < connectionsToAdd; i++) {
                stepPromises.push(this.createStressConnection());
            }

            const stepResults = await Promise.allSettled(stepPromises);
            
            stepResults.forEach(result => {
                if (result.status === 'fulfilled' && result.value.success) {
                    connections.push(result.value.client);
                    successfulConnections++;
                } else {
                    console.log(`      ⚠️  Connection failed: ${result.status === 'rejected' ? result.reason.message : result.value.error}`);
                }
            });

            if (step < 9) {
                await this.sleep(stepDelay);
            }
        }

        return {
            name: 'rampUp',
            duration: performance.now() - startTime,
            connections: connections,
            successfulConnections: successfulConnections,
            targetConnections: config.maxConcurrent,
            success: successfulConnections > config.maxConcurrent * 0.8 // 80% success threshold
        };
    }

    /**
     * Create single stress test connection
     */
    async createStressConnection() {
        try {
            const client = new this.IPCClient();
            await client.connect();
            return {
                success: true,
                client: client,
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    /**
     * Hold connections and test stability
     */
    async holdConnections(connections, holdTime) {
        const startTime = performance.now();
        let activeConnections = connections.length;
        let messagesSent = 0;
        let errors = 0;

        console.log(`      🔒 Holding ${activeConnections} connections for ${holdTime/1000}s...`);

        const endTime = startTime + holdTime;
        
        // Periodically send messages through all connections
        while (performance.now() < endTime) {
            const batchPromises = connections.map(async (client, index) => {
                try {
                    await client.sendMessage({ 
                        type: 'ping', 
                        connectionIndex: index,
                        timestamp: Date.now() 
                    });
                    messagesSent++;
                } catch (error) {
                    errors++;
                }
            });

            await Promise.allSettled(batchPromises);
            await this.sleep(1000); // Send messages every second
        }

        return {
            name: 'hold',
            duration: performance.now() - startTime,
            activeConnections: activeConnections,
            messagesSent: messagesSent,
            errors: errors,
            messagesPerSecond: messagesSent / (holdTime / 1000),
            success: errors < messagesSent * 0.1 // Less than 10% error rate
        };
    }

    /**
     * Ramp down connections
     */
    async rampDownConnections(connections, rampDownTime) {
        const startTime = performance.now();
        const stepSize = Math.ceil(connections.length / 5); // 5 steps
        const stepDelay = rampDownTime / 5;
        let disconnected = 0;

        for (let step = 0; step < 5; step++) {
            const endIndex = Math.min((step + 1) * stepSize, connections.length);
            const stepConnections = connections.slice(step * stepSize, endIndex);
            
            console.log(`      Step ${step + 1}: Disconnecting ${stepConnections.length} connections`);
            
            const disconnectPromises = stepConnections.map(client => client.disconnect());
            const results = await Promise.allSettled(disconnectPromises);
            
            disconnected += results.filter(r => r.status === 'fulfilled').length;
            
            if (step < 4) {
                await this.sleep(stepDelay);
            }
        }

        return {
            name: 'rampDown',
            duration: performance.now() - startTime,
            totalConnections: connections.length,
            disconnectedConnections: disconnected,
            success: disconnected >= connections.length * 0.9 // 90% success threshold
        };
    }

    /**
     * Stress test message flooding
     */
    async stressTestMessageFlood() {
        const config = this.stressConfigs.messageFlood;
        const testResult = {
            name: 'Message Flood',
            config: config,
            messages: [],
            metrics: {},
            failures: 0,
            startTime: Date.now()
        };

        console.log(`  📨 Flooding with ${config.messagesPerSecond} msg/sec for ${config.duration/1000}s...`);

        // Create concurrent connections for flooding
        const connections = [];
        for (let i = 0; i < config.concurrent; i++) {
            try {
                const client = new this.IPCClient();
                await client.connect();
                connections.push(client);
            } catch (error) {
                console.log(`    ⚠️  Failed to create flood connection ${i}: ${error.message}`);
            }
        }

        console.log(`    📡 Created ${connections.length}/${config.concurrent} connections for flooding`);

        // Calculate message timing
        const messageInterval = 1000 / config.messagesPerSecond; // ms between messages
        const messagesPerConnection = Math.ceil(config.messagesPerSecond / connections.length);
        
        // Start message flooding
        const floodPromises = connections.map((client, index) => 
            this.floodConnection(client, index, config.duration, messagesPerConnection, config.messageSize)
        );

        const floodResults = await Promise.allSettled(floodPromises);

        // Clean up connections
        await Promise.allSettled(connections.map(client => client.disconnect()));

        testResult.endTime = Date.now();
        testResult.duration = testResult.endTime - testResult.startTime;

        // Process flood results
        let totalMessages = 0;
        let totalErrors = 0;
        
        floodResults.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                totalMessages += result.value.messagesSent;
                totalErrors += result.value.errors;
                testResult.messages.push(...result.value.messages);
            } else {
                console.log(`    ❌ Connection ${index} flood failed: ${result.reason.message}`);
                testResult.failures++;
            }
        });

        testResult.metrics = {
            targetRate: config.messagesPerSecond,
            actualRate: totalMessages / (testResult.duration / 1000),
            totalMessages: totalMessages,
            totalErrors: totalErrors,
            errorRate: totalErrors / (totalMessages + totalErrors),
            efficiency: (totalMessages / (testResult.duration / 1000)) / config.messagesPerSecond
        };

        this.results.testResults.messageFlood = testResult;
        
        console.log(`    📊 Rate: ${testResult.metrics.actualRate.toFixed(2)}/${config.messagesPerSecond} msg/sec`);
        console.log(`    ✅ Messages: ${totalMessages} (${testResult.metrics.errorRate * 100}% error rate)`);
    }

    /**
     * Flood single connection with messages
     */
    async floodConnection(client, connectionIndex, duration, messagesPerSecond, messageSize) {
        const startTime = performance.now();
        const endTime = startTime + duration;
        const messageData = 'x'.repeat(messageSize);
        const messageInterval = 1000 / messagesPerSecond;
        
        const result = {
            connectionIndex: connectionIndex,
            messagesSent: 0,
            errors: 0,
            messages: []
        };

        let lastMessageTime = startTime;

        while (performance.now() < endTime) {
            const now = performance.now();
            
            if (now - lastMessageTime >= messageInterval) {
                try {
                    const messageStart = performance.now();
                    await client.sendMessage({
                        type: 'flood_test',
                        data: messageData,
                        connectionIndex: connectionIndex,
                        messageIndex: result.messagesSent,
                        timestamp: Date.now()
                    });
                    
                    result.messages.push({
                        connectionIndex: connectionIndex,
                        messageIndex: result.messagesSent,
                        responseTime: performance.now() - messageStart,
                        timestamp: Date.now()
                    });
                    
                    result.messagesSent++;
                    lastMessageTime = now;
                    
                } catch (error) {
                    result.errors++;
                }
            } else {
                // Brief pause to prevent CPU spinning
                await this.sleep(1);
            }
        }

        return result;
    }

    /**
     * Stress test resource exhaustion
     */
    async stressTestResourceExhaustion() {
        const config = this.stressConfigs.resourceExhaustion;
        const testResult = {
            name: 'Resource Exhaustion',
            config: config,
            resourceSnapshots: [],
            metrics: {},
            failures: 0,
            startTime: Date.now()
        };

        console.log(`  🧠 Testing resource exhaustion limits...`);
        console.log(`    Target: ${config.memoryTarget / 1024 / 1024}MB memory, ${config.connectionTarget} connections`);

        const connections = [];
        const startMemory = process.memoryUsage();
        
        try {
            // Gradually increase connections and monitor resources
            while (connections.length < config.connectionTarget && 
                   (Date.now() - testResult.startTime) < config.timeout) {
                
                // Create batch of connections
                const batchSize = Math.min(10, config.connectionTarget - connections.length);
                const batchPromises = [];
                
                for (let i = 0; i < batchSize; i++) {
                    batchPromises.push(this.createStressConnection());
                }

                const batchResults = await Promise.allSettled(batchPromises);
                
                batchResults.forEach(result => {
                    if (result.status === 'fulfilled' && result.value.success) {
                        connections.push(result.value.client);
                    } else {
                        testResult.failures++;
                    }
                });

                // Take resource snapshot
                const currentMemory = process.memoryUsage();
                const snapshot = {
                    timestamp: Date.now(),
                    connections: connections.length,
                    memory: {
                        rss: currentMemory.rss,
                        heapUsed: currentMemory.heapUsed,
                        heapTotal: currentMemory.heapTotal,
                        external: currentMemory.external
                    }
                };
                
                testResult.resourceSnapshots.push(snapshot);
                
                if (connections.length % 10 === 0) {
                    console.log(`    📊 Connections: ${connections.length}, Memory: ${(currentMemory.rss / 1024 / 1024).toFixed(2)}MB`);
                }

                // Check if we've hit memory target
                if (currentMemory.rss >= config.memoryTarget) {
                    console.log(`    🎯 Memory target reached: ${(currentMemory.rss / 1024 / 1024).toFixed(2)}MB`);
                    break;
                }

                await this.sleep(100);
            }

            // Hold resources for a moment to test stability
            console.log(`    🔒 Holding ${connections.length} connections...`);
            await this.sleep(5000);

            // Send messages through all connections to test functionality under load
            console.log(`    📨 Testing functionality under resource pressure...`);
            let functionalConnections = 0;
            
            const testPromises = connections.map(async (client) => {
                try {
                    await client.sendMessage({ type: 'ping', timestamp: Date.now() });
                    return true;
                } catch (error) {
                    return false;
                }
            });

            const testResults = await Promise.allSettled(testPromises);
            functionalConnections = testResults.filter(r => r.status === 'fulfilled' && r.value).length;

        } finally {
            // Clean up all connections
            console.log(`    🧹 Cleaning up ${connections.length} connections...`);
            await Promise.allSettled(connections.map(client => client.disconnect()));
        }

        testResult.endTime = Date.now();
        testResult.duration = testResult.endTime - testResult.startTime;

        // Calculate metrics
        const finalMemory = process.memoryUsage();
        const peakMemory = Math.max(...testResult.resourceSnapshots.map(s => s.memory.rss));
        
        testResult.metrics = {
            peakConnections: connections.length,
            targetConnections: config.connectionTarget,
            peakMemory: peakMemory,
            targetMemory: config.memoryTarget,
            memoryGrowth: peakMemory - startMemory.rss,
            functionalConnections: functionalConnections || 0,
            functionalityRate: connections.length > 0 ? functionalConnections / connections.length : 0,
            resourceEfficiency: Math.min(connections.length / config.connectionTarget, peakMemory / config.memoryTarget)
        };

        this.results.testResults.resourceExhaustion = testResult;
        
        console.log(`    📊 Peak: ${connections.length} connections, ${(peakMemory / 1024 / 1024).toFixed(2)}MB memory`);
        console.log(`    ✅ Functional: ${functionalConnections}/${connections.length} connections`);
    }

    /**
     * Analyze stress test results
     */
    async analyzeStressResults() {
        const analysis = {
            overallHealth: 'unknown',
            scores: {},
            criticalIssues: [],
            warnings: [],
            recommendations: []
        };

        // Analyze each test result
        for (const [testName, testResult] of Object.entries(this.results.testResults)) {
            const testAnalysis = this.analyzeTestResult(testName, testResult);
            analysis.scores[testName] = testAnalysis.score;
            
            if (testAnalysis.critical) {
                analysis.criticalIssues.push(...testAnalysis.issues);
            } else {
                analysis.warnings.push(...testAnalysis.issues);
            }
            
            analysis.recommendations.push(...testAnalysis.recommendations);
        }

        // Calculate overall score
        const scores = Object.values(analysis.scores).filter(s => !isNaN(s));
        analysis.overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

        // Determine overall health
        if (analysis.criticalIssues.length > 0) {
            analysis.overallHealth = 'critical';
        } else if (analysis.overallScore < 50) {
            analysis.overallHealth = 'poor';
        } else if (analysis.overallScore < 70) {
            analysis.overallHealth = 'degraded';
        } else if (analysis.overallScore < 90) {
            analysis.overallHealth = 'good';
        } else {
            analysis.overallHealth = 'excellent';
        }

        // System-wide recommendations
        if (analysis.overallHealth === 'critical') {
            analysis.recommendations.push('CRITICAL: System cannot handle expected load - investigation required');
        } else if (analysis.overallHealth === 'poor') {
            analysis.recommendations.push('System performance under stress is poor - optimization needed');
        }

        this.results.systemHealth = analysis;
        this.results.overallScore = analysis.overallScore;
        this.results.status = analysis.overallHealth;
    }

    /**
     * Analyze individual test result
     */
    analyzeTestResult(testName, testResult) {
        const analysis = {
            score: 0,
            issues: [],
            recommendations: [],
            critical: false
        };

        switch (testName) {
            case 'connectionCycling':
                const successRate = testResult.metrics.successRate;
                analysis.score = Math.round(successRate * 100);
                
                if (successRate < 0.8) {
                    analysis.critical = true;
                    analysis.issues.push(`Connection cycling success rate too low: ${(successRate * 100).toFixed(1)}%`);
                    analysis.recommendations.push('Investigate connection reliability issues');
                } else if (successRate < 0.95) {
                    analysis.issues.push(`Connection cycling could be more reliable: ${(successRate * 100).toFixed(1)}%`);
                }
                break;

            case 'concurrentConnections':
                const efficiency = testResult.metrics.connectionEfficiency;
                analysis.score = Math.round(efficiency * 100);
                
                if (efficiency < 0.7) {
                    analysis.critical = true;
                    analysis.issues.push(`Cannot handle concurrent connections: ${(efficiency * 100).toFixed(1)}% efficiency`);
                    analysis.recommendations.push('Review connection limits and server capacity');
                } else if (efficiency < 0.9) {
                    analysis.issues.push(`Concurrent connection efficiency could be improved: ${(efficiency * 100).toFixed(1)}%`);
                }
                break;

            case 'messageFlood':
                const rateEfficiency = testResult.metrics.efficiency;
                analysis.score = Math.round(rateEfficiency * 100);
                
                if (rateEfficiency < 0.5) {
                    analysis.critical = true;
                    analysis.issues.push(`Message throughput too low: ${(rateEfficiency * 100).toFixed(1)}% of target`);
                    analysis.recommendations.push('Optimize message processing and connection handling');
                } else if (rateEfficiency < 0.8) {
                    analysis.issues.push(`Message throughput below target: ${(rateEfficiency * 100).toFixed(1)}%`);
                }
                break;

            case 'resourceExhaustion':
                const functionalRate = testResult.metrics.functionalityRate;
                analysis.score = Math.round(functionalRate * 100);
                
                if (functionalRate < 0.8) {
                    analysis.critical = true;
                    analysis.issues.push(`System functionality degrades under load: ${(functionalRate * 100).toFixed(1)}% functional`);
                    analysis.recommendations.push('Improve resource management and error handling under load');
                } else if (functionalRate < 0.95) {
                    analysis.issues.push(`Some degradation under resource pressure: ${(functionalRate * 100).toFixed(1)}% functional`);
                }
                break;
        }

        return analysis;
    }

    /**
     * Generate stress test report
     */
    async generateStressReport() {
        const reportPath = path.join(this.resultsDir, `stress-test-report-${Date.now()}.json`);
        
        try {
            await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
            console.log(`  📄 Stress test report saved: ${reportPath}`);
        } catch (error) {
            console.log(`  ⚠️  Failed to save stress report: ${error.message}`);
        }
    }

    /**
     * Display stress test summary
     */
    displayStressSummary() {
        console.log('\n' + '=' * 60);
        console.log('🔥 HARUSPEX STRESS TEST RESULTS');
        console.log('=' * 60);

        const statusEmoji = {
            'excellent': '🚀',
            'good': '✅',
            'degraded': '⚠️',
            'poor': '❌',
            'critical': '🚨'
        };

        console.log(`\n📊 Overall Stress Health: ${statusEmoji[this.results.status]} ${this.results.status.toUpperCase()}`);
        console.log(`🎯 Overall Score: ${this.results.overallScore}%`);
        console.log(`⏰ Test Duration: ${this.results.timestamp}`);

        // Test scores
        console.log('\n📋 Stress Test Scores:');
        for (const [testName, score] of Object.entries(this.results.systemHealth.scores)) {
            console.log(`   ${testName}: ${score}%`);
        }

        // Critical issues
        if (this.results.systemHealth.criticalIssues.length > 0) {
            console.log('\n🚨 Critical Issues:');
            this.results.systemHealth.criticalIssues.forEach(issue => {
                console.log(`   • ${issue}`);
            });
        }

        // Warnings
        if (this.results.systemHealth.warnings.length > 0) {
            console.log('\n⚠️  Warnings:');
            this.results.systemHealth.warnings.forEach(warning => {
                console.log(`   • ${warning}`);
            });
        }

        // Recommendations
        if (this.results.systemHealth.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            this.results.systemHealth.recommendations.forEach(rec => {
                console.log(`   • ${rec}`);
            });
        }

        console.log('\n' + '=' * 60);
    }

    /**
     * Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main execution
async function main() {
    const stressTest = new HaruspexStressTest();
    const results = await stressTest.runStressTests();
    
    // Exit with stress-based code
    if (results.status === 'excellent' || results.status === 'good') {
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
        console.error('❌ Stress test suite crashed:', error);
        process.exit(3);
    });
}

module.exports = { HaruspexStressTest };