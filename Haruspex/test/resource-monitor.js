/**---
- title: [Resource Monitor - Comprehensive Testing]
- tags: [haruspex, testing, performance, memory, resource_monitoring]
- provides: [resource_monitoring, memory_leak_detection, extended_session_monitoring, resource_usage_analysis]
- requires: [../src/debugging/ipc-client.js, ../src/debugging/ipc-protocol.js]
- description: [Extended session monitoring and resource leak detection for IPC server and client operations]
---*/

const { HaruspexIPCClient } = require('../dist/src/debugging/ipc-client.js');

/**
 * Resource Monitor - Extended Session Monitoring and Leak Detection
 * 
 * This component provides comprehensive resource monitoring including:
 * - Memory usage tracking over extended periods
 * - Connection leak detection  
 * - Resource cleanup validation
 * - Performance degradation monitoring
 * - Long-term system stability assessment
 */
class ResourceMonitor {
    constructor(options = {}) {
        this.sessionDuration = options.sessionDuration || 30 * 60 * 1000; // 30 minutes default
        this.samplingInterval = options.samplingInterval || 10000; // 10 seconds
        this.memoryThreshold = options.memoryThreshold || 150 * 1024 * 1024; // 150MB
        this.connectionThreshold = options.connectionThreshold || 50; // Max connections
        this.stabilityWindowSize = options.stabilityWindowSize || 10; // Samples for trend analysis
        
        this.results = {
            startTime: null,
            endTime: null,
            duration: 0,
            samplesCollected: 0,
            memoryTrend: [],
            connectionTrend: [],
            performanceTrend: [],
            leaksDetected: [],
            degradationEvents: [],
            stabilityScore: 0,
            resourceEfficiency: 0,
            overallHealth: 'unknown'
        };
        
        this.isRunning = false;
        this.baselineMemory = null;
        this.sampleCount = 0;
        this.monitoringTimer = null;
    }

    /**
     * Start extended resource monitoring session
     */
    async startMonitoring() {
        console.log('🔍 Starting Resource Monitor - Extended Session Monitoring');
        console.log(`📊 Session Duration: ${this.sessionDuration / 1000}s`);
        console.log(`⏱️  Sampling Interval: ${this.samplingInterval / 1000}s`);
        console.log(`💾 Memory Threshold: ${Math.round(this.memoryThreshold / 1024 / 1024)}MB`);
        console.log();
        
        this.results.startTime = new Date();
        this.isRunning = true;
        this.sampleCount = 0;
        
        // Establish baseline
        await this.collectBaseline();
        
        // Start monitoring loop
        return new Promise((resolve) => {
            this.monitoringTimer = setInterval(async () => {
                await this.collectSample();
                
                // Check if session duration reached
                if (Date.now() - this.results.startTime.getTime() >= this.sessionDuration) {
                    await this.stopMonitoring();
                    resolve(this.results);
                }
            }, this.samplingInterval);
        });
    }

    /**
     * Collect baseline resource measurements
     */
    async collectBaseline() {
        console.log('📊 Collecting baseline measurements...');
        
        const processMemory = process.memoryUsage();
        this.baselineMemory = {
            rss: processMemory.rss,
            heapUsed: processMemory.heapUsed,
            heapTotal: processMemory.heapTotal,
            external: processMemory.external
        };
        
        console.log(`💾 Baseline Memory - RSS: ${Math.round(this.baselineMemory.rss / 1024 / 1024)}MB, Heap: ${Math.round(this.baselineMemory.heapUsed / 1024 / 1024)}MB`);
        console.log('✅ Baseline established');
        console.log();
    }

    /**
     * Collect resource usage sample
     */
    async collectSample() {
        this.sampleCount++;
        const timestamp = Date.now();
        const processMemory = process.memoryUsage();
        
        // Test IPC connection health
        const connectionHealth = await this.testConnectionHealth();
        
        // Create sample data
        const sample = {
            timestamp,
            sampleNumber: this.sampleCount,
            memory: {
                rss: processMemory.rss,
                heapUsed: processMemory.heapUsed,
                heapTotal: processMemory.heapTotal,
                external: processMemory.external,
                deltaFromBaseline: {
                    rss: processMemory.rss - this.baselineMemory.rss,
                    heapUsed: processMemory.heapUsed - this.baselineMemory.heapUsed,
                    heapTotal: processMemory.heapTotal - this.baselineMemory.heapTotal,
                    external: processMemory.external - this.baselineMemory.external
                }
            },
            connections: connectionHealth,
            performance: await this.measurePerformance()
        };
        
        // Store sample
        this.results.memoryTrend.push(sample.memory);
        this.results.connectionTrend.push(sample.connections);
        this.results.performanceTrend.push(sample.performance);
        this.results.samplesCollected++;
        
        // Analyze for leaks and degradation
        await this.analyzeSample(sample);
        
        // Log progress
        if (this.sampleCount % 5 === 0) {
            this.logProgress(sample);
        }
    }

    /**
     * Test connection health and resource usage
     */
    async testConnectionHealth() {
        const startTime = Date.now();
        const client = new HaruspexIPCClient();
        
        try {
            // Test connection
            await client.connect();
            const response = await client.sendMessage({
                type: 'get_status',
                payload: null
            });
            
            const endTime = Date.now();
            
            return {
                success: true,
                responseTime: endTime - startTime,
                clientCount: response.data?.clientCount || 0,
                uptime: response.data?.uptime || 0,
                connectionEstablished: true
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message,
                responseTime: -1,
                clientCount: -1,
                uptime: -1,
                connectionEstablished: false
            };
        } finally {
            try {
                await client.disconnect();
            } catch (e) {
                // Ignore disconnect errors
            }
        }
    }

    /**
     * Measure performance metrics
     */
    async measurePerformance() {
        const startTime = process.hrtime.bigint();
        
        // Perform standard operations
        const operations = [
            () => JSON.stringify({large: 'data'.repeat(1000)}),
            () => JSON.parse('{"test": "data", "number": 123}'),
            () => Math.sqrt(Math.random() * 1000000),
            () => 'test string'.repeat(100).indexOf('string')
        ];
        
        operations.forEach(op => op());
        
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to ms
        
        return {
            operationTime: duration,
            cpuUsage: process.cpuUsage(),
            timestamp: Date.now()
        };
    }

    /**
     * Analyze sample for leaks and degradation
     */
    async analyzeSample(sample) {
        // Check for memory leaks
        const memoryIncrease = sample.memory.deltaFromBaseline.rss;
        if (memoryIncrease > this.memoryThreshold) {
            const leak = {
                timestamp: sample.timestamp,
                type: 'memory_leak',
                severity: memoryIncrease > this.memoryThreshold * 2 ? 'critical' : 'warning',
                details: {
                    memoryIncrease,
                    rssTotal: sample.memory.rss,
                    heapIncrease: sample.memory.deltaFromBaseline.heapUsed
                }
            };
            
            this.results.leaksDetected.push(leak);
            console.log(`⚠️  Memory leak detected: ${Math.round(memoryIncrease / 1024 / 1024)}MB increase`);
        }
        
        // Check for connection leaks
        if (sample.connections.clientCount > this.connectionThreshold) {
            const leak = {
                timestamp: sample.timestamp,
                type: 'connection_leak',
                severity: 'warning',
                details: {
                    connectionCount: sample.connections.clientCount,
                    threshold: this.connectionThreshold
                }
            };
            
            this.results.leaksDetected.push(leak);
            console.log(`⚠️  Connection leak detected: ${sample.connections.clientCount} connections`);
        }
        
        // Check for performance degradation
        if (this.results.performanceTrend.length > this.stabilityWindowSize) {
            const recentSamples = this.results.performanceTrend.slice(-this.stabilityWindowSize);
            const averageTime = recentSamples.reduce((sum, s) => sum + s.operationTime, 0) / recentSamples.length;
            const baselineTime = this.results.performanceTrend[0].operationTime;
            
            if (averageTime > baselineTime * 2) {
                const degradation = {
                    timestamp: sample.timestamp,
                    type: 'performance_degradation',
                    severity: averageTime > baselineTime * 3 ? 'critical' : 'warning',
                    details: {
                        currentAverage: averageTime,
                        baseline: baselineTime,
                        degradationFactor: averageTime / baselineTime
                    }
                };
                
                this.results.degradationEvents.push(degradation);
                console.log(`⚠️  Performance degradation: ${Math.round(averageTime / baselineTime * 100)}% of baseline`);
            }
        }
    }

    /**
     * Log monitoring progress
     */
    logProgress(sample) {
        const elapsed = Math.round((Date.now() - this.results.startTime.getTime()) / 1000);
        const memoryMB = Math.round(sample.memory.rss / 1024 / 1024);
        const heapMB = Math.round(sample.memory.heapUsed / 1024 / 1024);
        const deltaMB = Math.round(sample.memory.deltaFromBaseline.rss / 1024 / 1024);
        
        console.log(`📊 Sample ${this.sampleCount} (${elapsed}s) - Memory: ${memoryMB}MB (Δ${deltaMB > 0 ? '+' : ''}${deltaMB}MB), Heap: ${heapMB}MB, Performance: ${sample.performance.operationTime.toFixed(2)}ms`);
    }

    /**
     * Stop monitoring and generate final report
     */
    async stopMonitoring() {
        console.log('\n🏁 Stopping Resource Monitor...');
        
        this.isRunning = false;
        this.results.endTime = new Date();
        this.results.duration = this.results.endTime.getTime() - this.results.startTime.getTime();
        
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
        }
        
        // Calculate final scores
        await this.calculateFinalScores();
        
        // Generate report
        this.generateFinalReport();
        
        console.log('✅ Resource monitoring complete');
        return this.results;
    }

    /**
     * Calculate stability and efficiency scores
     */
    async calculateFinalScores() {
        // Stability score (0-100)
        let stabilityScore = 100;
        
        // Deduct for memory leaks
        const memoryLeaks = this.results.leaksDetected.filter(l => l.type === 'memory_leak');
        stabilityScore -= memoryLeaks.length * 15;
        
        // Deduct for connection leaks
        const connectionLeaks = this.results.leaksDetected.filter(l => l.type === 'connection_leak');
        stabilityScore -= connectionLeaks.length * 10;
        
        // Deduct for performance degradation
        stabilityScore -= this.results.degradationEvents.length * 20;
        
        this.results.stabilityScore = Math.max(0, stabilityScore);
        
        // Resource efficiency (0-100)
        const avgMemoryIncrease = this.results.memoryTrend.reduce((sum, m) => sum + m.deltaFromBaseline.rss, 0) / this.results.memoryTrend.length;
        const efficiencyScore = Math.max(0, 100 - (avgMemoryIncrease / this.memoryThreshold * 100));
        this.results.resourceEfficiency = Math.round(efficiencyScore);
        
        // Overall health assessment
        if (this.results.stabilityScore >= 80 && this.results.resourceEfficiency >= 70) {
            this.results.overallHealth = 'excellent';
        } else if (this.results.stabilityScore >= 60 && this.results.resourceEfficiency >= 50) {
            this.results.overallHealth = 'good';
        } else if (this.results.stabilityScore >= 40 && this.results.resourceEfficiency >= 30) {
            this.results.overallHealth = 'fair';
        } else {
            this.results.overallHealth = 'poor';
        }
    }

    /**
     * Generate comprehensive final report
     */
    generateFinalReport() {
        console.log('\n' + '='.repeat(80));
        console.log('📊 RESOURCE MONITOR - FINAL REPORT');
        console.log('='.repeat(80));
        
        // Session Overview
        console.log('\n🕐 SESSION OVERVIEW');
        console.log(`Start Time: ${this.results.startTime.toISOString()}`);
        console.log(`End Time: ${this.results.endTime.toISOString()}`);
        console.log(`Duration: ${Math.round(this.results.duration / 1000)}s (${Math.round(this.results.duration / 60000)}m)`);
        console.log(`Samples Collected: ${this.results.samplesCollected}`);
        console.log(`Sampling Rate: ${Math.round(this.results.samplesCollected / (this.results.duration / 1000))} samples/sec`);
        
        // Memory Analysis
        console.log('\n💾 MEMORY ANALYSIS');
        const memoryTrend = this.results.memoryTrend;
        const startMemory = memoryTrend[0];
        const endMemory = memoryTrend[memoryTrend.length - 1];
        const maxMemory = memoryTrend.reduce((max, m) => m.rss > max ? m.rss : max, 0);
        const avgMemoryDelta = memoryTrend.reduce((sum, m) => sum + m.deltaFromBaseline.rss, 0) / memoryTrend.length;
        
        console.log(`Initial Memory: ${Math.round(startMemory.rss / 1024 / 1024)}MB RSS, ${Math.round(startMemory.heapUsed / 1024 / 1024)}MB Heap`);
        console.log(`Final Memory: ${Math.round(endMemory.rss / 1024 / 1024)}MB RSS, ${Math.round(endMemory.heapUsed / 1024 / 1024)}MB Heap`);
        console.log(`Peak Memory: ${Math.round(maxMemory / 1024 / 1024)}MB RSS`);
        console.log(`Average Delta: ${Math.round(avgMemoryDelta / 1024 / 1024)}MB from baseline`);
        console.log(`Memory Growth: ${Math.round((endMemory.rss - startMemory.rss) / 1024 / 1024)}MB over session`);
        
        // Connection Analysis
        console.log('\n🔗 CONNECTION ANALYSIS');
        const connectionTrend = this.results.connectionTrend;
        const connectionSuccessRate = connectionTrend.filter(c => c.success).length / connectionTrend.length * 100;
        const avgResponseTime = connectionTrend.filter(c => c.responseTime > 0).reduce((sum, c) => sum + c.responseTime, 0) / connectionTrend.filter(c => c.responseTime > 0).length;
        
        console.log(`Connection Success Rate: ${connectionSuccessRate.toFixed(1)}%`);
        console.log(`Average Response Time: ${avgResponseTime ? avgResponseTime.toFixed(2) : 'N/A'}ms`);
        console.log(`Total Connection Tests: ${connectionTrend.length}`);
        console.log(`Failed Connections: ${connectionTrend.filter(c => !c.success).length}`);
        
        // Performance Analysis
        console.log('\n⚡ PERFORMANCE ANALYSIS');
        const performanceTrend = this.results.performanceTrend;
        const avgPerformance = performanceTrend.reduce((sum, p) => sum + p.operationTime, 0) / performanceTrend.length;
        const baselinePerformance = performanceTrend[0].operationTime;
        const performanceVariance = performanceTrend.reduce((sum, p) => sum + Math.pow(p.operationTime - avgPerformance, 2), 0) / performanceTrend.length;
        
        console.log(`Baseline Performance: ${baselinePerformance.toFixed(2)}ms`);
        console.log(`Average Performance: ${avgPerformance.toFixed(2)}ms`);
        console.log(`Performance Variance: ${Math.sqrt(performanceVariance).toFixed(2)}ms`);
        console.log(`Performance Stability: ${avgPerformance < baselinePerformance * 1.5 ? 'Good' : 'Degraded'}`);
        
        // Issues Summary
        console.log('\n⚠️  ISSUES DETECTED');
        console.log(`Memory Leaks: ${this.results.leaksDetected.filter(l => l.type === 'memory_leak').length}`);
        console.log(`Connection Leaks: ${this.results.leaksDetected.filter(l => l.type === 'connection_leak').length}`);
        console.log(`Performance Degradation Events: ${this.results.degradationEvents.length}`);
        console.log(`Total Issues: ${this.results.leaksDetected.length + this.results.degradationEvents.length}`);
        
        // Scoring
        console.log('\n🏆 SCORING');
        console.log(`Stability Score: ${this.results.stabilityScore}/100`);
        console.log(`Resource Efficiency: ${this.results.resourceEfficiency}/100`);
        console.log(`Overall Health: ${this.results.overallHealth.toUpperCase()}`);
        
        // Recommendations
        this.generateRecommendations();
        
        console.log('\n' + '='.repeat(80));
    }

    /**
     * Generate recommendations based on monitoring results
     */
    generateRecommendations() {
        console.log('\n💡 RECOMMENDATIONS');
        
        const recommendations = [];
        
        // Memory recommendations
        if (this.results.leaksDetected.filter(l => l.type === 'memory_leak').length > 0) {
            recommendations.push('🔧 Investigate memory leaks - consider implementing connection pooling');
            recommendations.push('🔧 Add memory monitoring to production deployment');
        }
        
        // Connection recommendations
        if (this.results.leaksDetected.filter(l => l.type === 'connection_leak').length > 0) {
            recommendations.push('🔧 Review connection lifecycle management');
            recommendations.push('🔧 Implement connection timeout and cleanup mechanisms');
        }
        
        // Performance recommendations
        if (this.results.degradationEvents.length > 0) {
            recommendations.push('🔧 Profile performance bottlenecks during extended operation');
            recommendations.push('🔧 Consider implementing performance monitoring alerts');
        }
        
        // General recommendations
        if (this.results.stabilityScore < 70) {
            recommendations.push('🔧 System needs stability improvements before production deployment');
            recommendations.push('🔧 Implement automated health checks and recovery mechanisms');
        }
        
        if (this.results.resourceEfficiency < 60) {
            recommendations.push('🔧 Optimize resource usage for better efficiency');
            recommendations.push('🔧 Consider implementing resource limits and throttling');
        }
        
        if (recommendations.length === 0) {
            console.log('✅ No issues detected - system is performing well');
            console.log('✅ Resource usage is within acceptable limits');
            console.log('✅ System is ready for production deployment');
        } else {
            recommendations.forEach(rec => console.log(rec));
        }
    }
}

/**
 * Run resource monitoring if executed directly
 */
async function runResourceMonitor() {
    const monitor = new ResourceMonitor({
        sessionDuration: 2 * 60 * 1000, // 2 minutes for testing
        samplingInterval: 5000,          // 5 seconds
        memoryThreshold: 100 * 1024 * 1024, // 100MB
        connectionThreshold: 25
    });
    
    try {
        console.log('🚀 Starting Haruspex Resource Monitor');
        console.log('📋 Extended session monitoring and leak detection');
        console.log();
        
        const results = await monitor.startMonitoring();
        
        console.log('\n🎯 RESOURCE MONITOR COMPLETED');
        console.log(`✅ Stability Score: ${results.stabilityScore}/100`);
        console.log(`✅ Resource Efficiency: ${results.resourceEfficiency}/100`);
        console.log(`✅ Overall Health: ${results.overallHealth}`);
        
        // Exit with appropriate code
        const exitCode = results.overallHealth === 'poor' ? 2 : (results.overallHealth === 'fair' ? 1 : 0);
        process.exit(exitCode);
        
    } catch (error) {
        console.error('❌ Resource Monitor failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Export for testing
module.exports = { ResourceMonitor };

// Run if executed directly
if (require.main === module) {
    runResourceMonitor();
}