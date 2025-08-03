export interface BenchmarkTest {
    name: string;
    task: string;
    expectedDuration: number;
    iterations: number;
}
export interface BenchmarkResult {
    name: string;
    averageDuration: number;
    minDuration: number;
    maxDuration: number;
    successRate: number;
    memoryUsage: {
        peak: number;
        average: number;
    };
}
export interface ConcurrentTestOptions {
    concurrency: number;
    task: string;
    timeout: number;
}
export interface ConcurrentTestResult {
    allSucceeded: boolean;
    totalDuration: number;
    averageQueueTime: number;
    results: Array<{
        success: boolean;
        duration: number;
    }>;
}
export declare class PerformanceBenchmark {
    private e2eRunner;
    constructor();
    runBenchmarkSuite(tests: BenchmarkTest[]): Promise<BenchmarkResult[]>;
    private runBenchmark;
    runConcurrentTest(options: ConcurrentTestOptions): Promise<ConcurrentTestResult>;
    generatePerformanceReport(results: BenchmarkResult[]): string;
}
//# sourceMappingURL=performance.d.ts.map