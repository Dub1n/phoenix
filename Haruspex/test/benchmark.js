/**
 * benchmark.js
 * 
 * Performance Benchmarking Suite for Haruspex Real-Time Agent Integration
 * 
 * Comprehensive performance testing and baseline establishment for:
 * - Connection establishment times
 * - Command execution latencies  
 * - Message throughput rates
 * - Response time distributions
 * - Memory and CPU utilization
 * 
 * Part of Phase 4: Testing Infrastructure Implementation
 * Created: 2025-08-19
 */

const { performance } = require('perf_hooks');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class HaruspexBenchmark {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            benchmarks: {},
            baselines: this.getPerformanceBaselines(),
            analysis: {},
            recommendations: [],
            overallScore: 0
        };

        this.testConfig = {
            connectionTests: {
                iterations: 50,
                timeout: 5000,
                concurrency: 1
            },
            commandTests: {
                iterations: 30,
                timeout: 3000,
                commands: ['ping', 'get_status', 'get_health']
            },
            throughputTests: {
                duration: 10000, // 10 seconds
                messageSize: 1024,
                concurrent: 5
            },
            memoryTests: {
                duration: 30000, // 30 seconds  
                interval: 1000 // 1 second
            }
        };

        // Import IPC client for testing
        this.IPCClient = null;
        this.initializeClient();
    }

    async initializeClient() {
        try {
            const clientPath = path.resolve(__dirname, '..', 'dist', 'src', 'debugging', 'ipc-client.js');
            const clientModule = require(clientPath);
            this.IPCClient = clientModule.HaruspexIPCClient;
            console.log('✅ IPC Client loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load IPC Client:', error.message);
            throw new Error(`IPC Client initialization failed: ${error.message}`);
        }
    }

    /**
     * Run comprehensive benchmark suite
     */
    async runBenchmarks() {
        console.log('⚡ Haruspex Performance Benchmark Suite Starting...\n');
        console.log('=' * 60);
        
        try {
            // Ensure system is ready
            await this.setupBenchmark();
            
            // Run connection benchmarks
            console.log('🔌 Running Connection Benchmarks...');
            await this.benchmarkConnections();
            
            // Run command execution benchmarks
            console.log('\n📋 Running Command Execution Benchmarks...');  
            await this.benchmarkCommands();
            
            // Run throughput benchmarks
            console.log('\n🚀 Running Throughput Benchmarks...');
            await this.benchmarkThroughput();
            
            // Run memory benchmarks
            console.log('\n🧠 Running Memory Usage Benchmarks...');
            await this.benchmarkMemory();
            
            // Analyze results
            console.log('\n📊 Analyzing Performance Results...');
            await this.analyzeResults();
            
            // Generate report
            await this.generateReport();
            
            // Display summary
            this.displaySummary();
            
            return this.results;
            
        } catch (error) {
            console.error('❌ Benchmark suite failed:', error.message);
            throw error;
        }
    }

    /**
     * Setup benchmark environment
     */
    async setupBenchmark() {
        console.log('🔧 Setting up benchmark environment...');
        
        // Verify IPC client is available
        if (!this.IPCClient) {
            throw new Error('IPC Client not available for benchmarking');
        }
        
        // Create results directory
        const resultsDir = path.join(__dirname, '..', 'benchmark-results');
        try {
            await fs.mkdir(resultsDir, { recursive: true });
            this.resultsDir = resultsDir;
        } catch (error) {
            console.log('⚠️  Benchmark results directory warning:', error.message);
        }
        
        // Warm up system
        console.log('🔥 Warming up system...');
        await this.warmupSystem();
        
        console.log('✅ Benchmark environment ready');
    }

    /**
     * Warm up system before benchmarking
     */
    async warmupSystem() {
        try {
            const client = new this.IPCClient();
            
            // Perform a few warm-up connections
            for (let i = 0; i < 3; i++) {
                await client.connect();
                await client.sendMessage({ type: 'ping' });
                await client.disconnect();
            }
        } catch (error) {
            console.log('⚠️  System warmup warning:', error.message);
        }
    }

    /**
     * Benchmark connection establishment
     */
    async benchmarkConnections() {
        const benchmark = {
            name: 'Connection Establishment',
            iterations: this.testConfig.connectionTests.iterations,
            results: [],
            metrics: {}
        };

        console.log(`  🔌 Testing ${benchmark.iterations} connection cycles...`);
        
        const progressInterval = Math.max(1, Math.floor(benchmark.iterations / 10));
        
        for (let i = 0; i < benchmark.iterations; i++) {
            if (i % progressInterval === 0) {
                console.log(`    Progress: ${i}/${benchmark.iterations} (${Math.round(i/benchmark.iterations*100)}%)`);
            }
            
            const result = await this.measureConnectionTime();
            benchmark.results.push(result);
            
            // Brief pause to avoid overwhelming the system
            await this.sleep(50);
        }

        // Calculate metrics
        benchmark.metrics = this.calculateStatistics(
            benchmark.results.map(r => r.connectionTime)
        );
        
        benchmark.metrics.successRate = benchmark.results.filter(r => r.success).length / benchmark.iterations;
        benchmark.metrics.errorRate = 1 - benchmark.metrics.successRate;

        this.results.benchmarks.connections = benchmark;
        
        console.log(`    ✅ Average: ${benchmark.metrics.mean.toFixed(2)}ms`);
        console.log(`    📊 Success Rate: ${(benchmark.metrics.successRate * 100).toFixed(1)}%`);
    }

    /**
     * Measure single connection time
     */
    async measureConnectionTime() {
        const client = new this.IPCClient();
        const startTime = performance.now();
        
        try {
            await client.connect();
            const connectionTime = performance.now() - startTime;
            
            await client.disconnect();
            
            return {
                success: true,
                connectionTime: connectionTime,
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                success: false,
                connectionTime: performance.now() - startTime,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    /**
     * Benchmark command execution
     */
    async benchmarkCommands() {
        const commandBenchmarks = {};
        
        for (const command of this.testConfig.commandTests.commands) {
            console.log(`  📋 Testing ${command} command...`);
            
            const benchmark = {
                command: command,
                iterations: this.testConfig.commandTests.iterations,
                results: [],
                metrics: {}
            };

            for (let i = 0; i < benchmark.iterations; i++) {
                const result = await this.measureCommandTime(command);
                benchmark.results.push(result);
                await this.sleep(30);
            }

            // Calculate metrics
            benchmark.metrics = this.calculateStatistics(
                benchmark.results.filter(r => r.success).map(r => r.executionTime)
            );
            
            benchmark.metrics.successRate = benchmark.results.filter(r => r.success).length / benchmark.iterations;
            
            commandBenchmarks[command] = benchmark;
            
            console.log(`    ⚡ ${command}: ${benchmark.metrics.mean?.toFixed(2) || 'N/A'}ms avg`);
        }

        this.results.benchmarks.commands = commandBenchmarks;
    }

    /**
     * Measure single command execution time
     */
    async measureCommandTime(command) {
        const client = new this.IPCClient();
        
        try {
            await client.connect();
            
            const startTime = performance.now();
            const response = await client.sendMessage({ 
                type: command,
                timestamp: Date.now() 
            });
            const executionTime = performance.now() - startTime;
            
            await client.disconnect();
            
            return {
                success: true,
                executionTime: executionTime,
                responseSize: JSON.stringify(response).length,
                timestamp: Date.now()
            };
        } catch (error) {
            return {
                success: false,
                executionTime: 0,
                error: error.message,
                timestamp: Date.now()
            };
        }
    }

    /**
     * Benchmark message throughput
     */
    async benchmarkThroughput() {
        console.log(`  🚀 Testing message throughput for ${this.testConfig.throughputTests.duration/1000}s...`);
        
        const benchmark = {
            name: 'Message Throughput',
            duration: this.testConfig.throughputTests.duration,
            concurrent: this.testConfig.throughputTests.concurrent,
            results: [],
            metrics: {}
        };

        const startTime = performance.now();
        const endTime = startTime + benchmark.duration;
        let messageCount = 0;
        let errorCount = 0;

        // Create concurrent connections
        const connections = [];
        for (let i = 0; i < benchmark.concurrent; i++) {
            connections.push(new this.IPCClient());
        }

        try {
            // Connect all clients
            await Promise.all(connections.map(client => client.connect()));

            // Send messages continuously for the test duration
            const sendPromises = [];
            
            while (performance.now() < endTime) {
                for (let i = 0; i < connections.length; i++) {
                    const client = connections[i];
                    const promise = client.sendMessage({
                        type: 'ping',
                        data: 'x'.repeat(this.testConfig.throughputTests.messageSize),
                        timestamp: Date.now()
                    }).then(() => {
                        messageCount++;
                    }).catch(() => {
                        errorCount++;
                    });
                    
                    sendPromises.push(promise);
                }
                
                await this.sleep(10);
            }

            // Wait for remaining messages
            await Promise.allSettled(sendPromises);

        } finally {
            // Clean up connections
            await Promise.allSettled(connections.map(client => client.disconnect()));
        }

        const actualDuration = performance.now() - startTime;
        benchmark.metrics = {
            messagesPerSecond: (messageCount / actualDuration) * 1000,
            totalMessages: messageCount,
            errorCount: errorCount,
            errorRate: errorCount / (messageCount + errorCount),
            duration: actualDuration,
            concurrentConnections: benchmark.concurrent
        };

        this.results.benchmarks.throughput = benchmark;
        
        console.log(`    🚀 Throughput: ${benchmark.metrics.messagesPerSecond.toFixed(2)} msg/sec`);
        console.log(`    📊 Total Messages: ${benchmark.metrics.totalMessages}`);
    }

    /**
     * Benchmark memory usage
     */
    async benchmarkMemory() {
        console.log(`  🧠 Monitoring memory usage for ${this.testConfig.memoryTests.duration/1000}s...`);
        
        const benchmark = {
            name: 'Memory Usage',
            duration: this.testConfig.memoryTests.duration,
            samples: [],
            metrics: {}
        };

        const startTime = performance.now();
        const endTime = startTime + benchmark.duration;
        
        // Baseline memory
        const baselineMemory = process.memoryUsage();
        benchmark.baseline = baselineMemory;
        
        // Start background activity (connection cycling)
        const activityPromise = this.runMemoryTestActivity(benchmark.duration);
        
        // Sample memory usage
        while (performance.now() < endTime) {
            const memUsage = process.memoryUsage();
            benchmark.samples.push({
                timestamp: Date.now(),
                rss: memUsage.rss,
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external
            });
            
            await this.sleep(this.testConfig.memoryTests.interval);
        }
        
        await activityPromise;

        // Calculate memory metrics
        const rssValues = benchmark.samples.map(s => s.rss);
        const heapValues = benchmark.samples.map(s => s.heapUsed);
        
        benchmark.metrics = {
            rss: this.calculateStatistics(rssValues),
            heapUsed: this.calculateStatistics(heapValues),
            peakRss: Math.max(...rssValues),
            peakHeap: Math.max(...heapValues),
            memoryLeak: this.detectMemoryLeak(benchmark.samples)
        };

        this.results.benchmarks.memory = benchmark;
        
        console.log(`    🧠 Peak RSS: ${(benchmark.metrics.peakRss / 1024 / 1024).toFixed(2)} MB`);
        console.log(`    📊 Avg Heap: ${(benchmark.metrics.heapUsed.mean / 1024 / 1024).toFixed(2)} MB`);
    }

    /**
     * Run background activity during memory test
     */
    async runMemoryTestActivity(duration) {
        const startTime = performance.now();
        const endTime = startTime + duration;
        
        while (performance.now() < endTime) {
            try {
                const client = new this.IPCClient();
                await client.connect();
                await client.sendMessage({ type: 'get_status' });
                await client.disconnect();
            } catch (error) {
                // Ignore errors during memory testing
            }
            
            await this.sleep(500);
        }
    }

    /**
     * Detect potential memory leaks
     */
    detectMemoryLeak(samples) {
        if (samples.length < 10) return { detected: false };
        
        const firstHalf = samples.slice(0, Math.floor(samples.length / 2));
        const secondHalf = samples.slice(Math.floor(samples.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, s) => sum + s.rss, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, s) => sum + s.rss, 0) / secondHalf.length;
        
        const growthPercent = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        return {
            detected: growthPercent > 10, // 10% growth threshold
            growthPercent: growthPercent,
            details: `Memory grew by ${growthPercent.toFixed(2)}%`
        };
    }

    /**
     * Analyze benchmark results
     */
    async analyzeResults() {
        const analysis = {
            score: 0,
            performance: 'unknown',
            issues: [],
            achievements: []
        };

        const baselines = this.results.baselines;
        
        // Analyze connection performance
        if (this.results.benchmarks.connections) {
            const connBench = this.results.benchmarks.connections;
            if (connBench.metrics.mean <= baselines.connectionTime) {
                analysis.achievements.push('Connection time meets baseline');
            } else {
                analysis.issues.push(`Slow connections: ${connBench.metrics.mean.toFixed(2)}ms vs ${baselines.connectionTime}ms baseline`);
            }
        }

        // Analyze command performance
        if (this.results.benchmarks.commands) {
            for (const [cmd, bench] of Object.entries(this.results.benchmarks.commands)) {
                if (bench.metrics.mean && bench.metrics.mean <= baselines.commandResponseTime) {
                    analysis.achievements.push(`${cmd} command meets performance baseline`);
                } else if (bench.metrics.mean) {
                    analysis.issues.push(`Slow ${cmd} command: ${bench.metrics.mean.toFixed(2)}ms vs ${baselines.commandResponseTime}ms baseline`);
                }
            }
        }

        // Analyze memory usage
        if (this.results.benchmarks.memory) {
            const memBench = this.results.benchmarks.memory;
            const peakMB = memBench.metrics.peakRss / 1024 / 1024;
            
            if (peakMB <= baselines.memoryUsage) {
                analysis.achievements.push('Memory usage within baseline');
            } else {
                analysis.issues.push(`High memory usage: ${peakMB.toFixed(2)}MB vs ${baselines.memoryUsage}MB baseline`);
            }
            
            if (memBench.metrics.memoryLeak.detected) {
                analysis.issues.push(`Potential memory leak detected: ${memBench.metrics.memoryLeak.details}`);
            }
        }

        // Calculate overall score
        const maxScore = 100;
        let score = maxScore;
        score -= analysis.issues.length * 15; // -15 points per issue
        score += Math.min(analysis.achievements.length * 5, 20); // +5 points per achievement, max 20
        
        analysis.score = Math.max(0, score);
        
        // Determine performance level
        if (analysis.score >= 90) {
            analysis.performance = 'excellent';
        } else if (analysis.score >= 70) {
            analysis.performance = 'good';  
        } else if (analysis.score >= 50) {
            analysis.performance = 'degraded';
        } else {
            analysis.performance = 'poor';
        }

        // Generate recommendations
        if (analysis.issues.length > 0) {
            this.results.recommendations.push('Address performance issues identified in analysis');
        }
        if (analysis.score < 70) {
            this.results.recommendations.push('Consider system optimization and resource allocation');
        }
        if (this.results.benchmarks.memory?.metrics.memoryLeak.detected) {
            this.results.recommendations.push('Investigate potential memory leaks in IPC system');
        }

        this.results.analysis = analysis;
        this.results.overallScore = analysis.score;
    }

    /**
     * Generate benchmark report
     */
    async generateReport() {
        const reportPath = path.join(this.resultsDir, `benchmark-report-${Date.now()}.json`);
        
        try {
            await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
            console.log(`  📄 Benchmark report saved: ${reportPath}`);
        } catch (error) {
            console.log(`  ⚠️  Failed to save report: ${error.message}`);
        }
    }

    /**
     * Display benchmark summary
     */
    displaySummary() {
        console.log('\n' + '=' * 60);
        console.log('⚡ HARUSPEX PERFORMANCE BENCHMARK RESULTS');
        console.log('=' * 60);

        // Overall performance
        const perfEmoji = {
            'excellent': '🚀',
            'good': '✅', 
            'degraded': '⚠️',
            'poor': '❌'
        };

        console.log(`\n📊 Overall Performance: ${perfEmoji[this.results.analysis.performance]} ${this.results.analysis.performance.toUpperCase()}`);
        console.log(`🎯 Performance Score: ${this.results.overallScore}%`);
        console.log(`⏰ Benchmark Time: ${this.results.timestamp}`);

        // Key metrics
        console.log('\n📈 Key Performance Metrics:');
        
        if (this.results.benchmarks.connections) {
            const conn = this.results.benchmarks.connections;
            console.log(`   🔌 Connection Time: ${conn.metrics.mean?.toFixed(2) || 'N/A'}ms avg (${(conn.metrics.successRate * 100).toFixed(1)}% success)`);
        }

        if (this.results.benchmarks.throughput) {
            const throughput = this.results.benchmarks.throughput;
            console.log(`   🚀 Throughput: ${throughput.metrics.messagesPerSecond.toFixed(2)} msg/sec`);
        }

        if (this.results.benchmarks.memory) {
            const memory = this.results.benchmarks.memory;
            console.log(`   🧠 Peak Memory: ${(memory.metrics.peakRss / 1024 / 1024).toFixed(2)} MB`);
        }

        // Issues and achievements
        if (this.results.analysis.issues.length > 0) {
            console.log('\n⚠️  Performance Issues:');
            this.results.analysis.issues.forEach(issue => {
                console.log(`   • ${issue}`);
            });
        }

        if (this.results.analysis.achievements.length > 0) {
            console.log('\n✅ Performance Achievements:');
            this.results.analysis.achievements.forEach(achievement => {
                console.log(`   • ${achievement}`);
            });
        }

        // Recommendations
        if (this.results.recommendations.length > 0) {
            console.log('\n💡 Performance Recommendations:');
            this.results.recommendations.forEach(rec => {
                console.log(`   • ${rec}`);
            });
        }

        console.log('\n' + '=' * 60);
    }

    /**
     * Calculate statistical metrics
     */
    calculateStatistics(values) {
        if (values.length === 0) return {};
        
        const sorted = [...values].sort((a, b) => a - b);
        const sum = values.reduce((a, b) => a + b, 0);
        
        return {
            count: values.length,
            mean: sum / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            median: sorted[Math.floor(sorted.length / 2)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)],
            stdDev: this.calculateStdDev(values, sum / values.length)
        };
    }

    /**
     * Calculate standard deviation
     */
    calculateStdDev(values, mean) {
        const squareDiffs = values.map(value => Math.pow(value - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(avgSquareDiff);
    }

    /**
     * Get performance baselines
     */
    getPerformanceBaselines() {
        return {
            connectionTime: 1000, // ms
            commandResponseTime: 500, // ms
            messagesPerSecond: 100,
            memoryUsage: 100, // MB
            errorRate: 0.01, // 1%
            successRate: 0.99 // 99%
        };
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
    const benchmark = new HaruspexBenchmark();
    const results = await benchmark.runBenchmarks();
    
    // Exit with performance-based code
    if (results.overallScore >= 90) {
        process.exit(0); // Excellent
    } else if (results.overallScore >= 70) {
        process.exit(1); // Good but has issues
    } else {
        process.exit(2); // Performance problems
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Benchmark suite crashed:', error);
        process.exit(3);
    });
}

module.exports = { HaruspexBenchmark };