/**
 * Performance Baseline Validator
 *
 * Establishes performance baselines for Phoenix-Code-Lite
 * and defines QMS performance targets
 */
export interface CLIPerformanceMetrics {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
}
export interface ConfigPerformanceMetrics {
    loadTime: number;
    parseTime: number;
    validationTime: number;
}
export interface TDDPerformanceMetrics {
    workflowTime: number;
    testExecutionTime: number;
    codeGenerationTime: number;
}
export declare class PerformanceBaselineValidator {
    /**
     * Measure CLI performance
     */
    measureCLIPerformance(): Promise<CLIPerformanceMetrics>;
    /**
     * Measure configuration loading performance
     */
    measureConfigPerformance(): Promise<ConfigPerformanceMetrics>;
    /**
     * Measure TDD workflow performance
     */
    measureTDDPerformance(): Promise<TDDPerformanceMetrics>;
    /**
     * Save performance baseline to file
     */
    saveBaseline(baseline: any): Promise<void>;
    /**
     * Load existing performance baseline
     */
    loadBaseline(): Promise<any>;
}
//# sourceMappingURL=performance-baseline-validator.d.ts.map