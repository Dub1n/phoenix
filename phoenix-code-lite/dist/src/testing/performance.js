"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceBenchmark = void 0;
const perf_hooks_1 = require("perf_hooks");
const e2e_runner_1 = require("./e2e-runner");
class PerformanceBenchmark {
    constructor() {
        this.e2eRunner = new e2e_runner_1.PhoenixCodeLiteE2E(process.cwd());
    }
    async runBenchmarkSuite(tests) {
        const results = [];
        for (const test of tests) {
            console.log(`Running benchmark: ${test.name}`);
            const result = await this.runBenchmark(test);
            results.push(result);
        }
        return results;
    }
    async runBenchmark(test) {
        const durations = [];
        const memoryReadings = [];
        let successCount = 0;
        for (let i = 0; i < test.iterations; i++) {
            const startMemory = process.memoryUsage().heapUsed;
            const startTime = perf_hooks_1.performance.now();
            try {
                const result = await this.e2eRunner.runWorkflow({
                    task: `${test.task} (iteration ${i + 1})`,
                });
                const endTime = perf_hooks_1.performance.now();
                const endMemory = process.memoryUsage().heapUsed;
                durations.push(endTime - startTime);
                memoryReadings.push(endMemory - startMemory);
                if (result.success) {
                    successCount++;
                }
            }
            catch (error) {
                const endTime = perf_hooks_1.performance.now();
                durations.push(endTime - startTime);
                memoryReadings.push(0); // Failed iterations don't count for memory
            }
            // Brief pause between iterations
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return {
            name: test.name,
            averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations),
            successRate: successCount / test.iterations,
            memoryUsage: {
                peak: Math.max(...memoryReadings),
                average: memoryReadings.reduce((sum, m) => sum + m, 0) / memoryReadings.length,
            },
        };
    }
    async runConcurrentTest(options) {
        const startTime = perf_hooks_1.performance.now();
        const promises = [];
        for (let i = 0; i < options.concurrency; i++) {
            const queueStartTime = perf_hooks_1.performance.now();
            const promise = (async () => {
                const actualStartTime = perf_hooks_1.performance.now();
                const queueTime = actualStartTime - queueStartTime;
                try {
                    const result = await this.e2eRunner.runWorkflow({
                        task: `${options.task} (concurrent ${i + 1})`,
                    });
                    return {
                        success: result.success,
                        duration: result.duration,
                        queueTime,
                    };
                }
                catch (error) {
                    return {
                        success: false,
                        duration: 0,
                        queueTime,
                    };
                }
            })();
            promises.push(promise);
        }
        const results = await Promise.all(promises);
        const totalDuration = perf_hooks_1.performance.now() - startTime;
        return {
            allSucceeded: results.every(r => r.success),
            totalDuration,
            averageQueueTime: results.reduce((sum, r) => sum + r.queueTime, 0) / results.length,
            results: results.map(r => ({ success: r.success, duration: r.duration })),
        };
    }
    generatePerformanceReport(results) {
        let report = '# Performance Benchmark Report\n\n';
        results.forEach(result => {
            report += `## ${result.name}\n\n`;
            report += `- **Average Duration**: ${Math.round(result.averageDuration)}ms\n`;
            report += `- **Min/Max Duration**: ${Math.round(result.minDuration)}ms / ${Math.round(result.maxDuration)}ms\n`;
            report += `- **Success Rate**: ${(result.successRate * 100).toFixed(1)}%\n`;
            report += `- **Peak Memory**: ${Math.round(result.memoryUsage.peak / 1024 / 1024)}MB\n`;
            report += `- **Average Memory**: ${Math.round(result.memoryUsage.average / 1024 / 1024)}MB\n\n`;
        });
        return report;
    }
}
exports.PerformanceBenchmark = PerformanceBenchmark;
//# sourceMappingURL=performance.js.map