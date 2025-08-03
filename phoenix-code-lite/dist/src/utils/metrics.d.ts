import { WorkflowResult } from '../types/workflow';
export interface WorkflowMetrics {
    totalWorkflows: number;
    successfulWorkflows: number;
    failedWorkflows: number;
    successRate: number;
    averageDuration: number;
    totalTokensUsed: number;
    averageQualityScore: number;
}
export interface AnalyticsReport {
    timeRange: {
        start: Date;
        end: Date;
    };
    totalWorkflows: number;
    successRate: number;
    averageDuration: number;
    phaseMetrics: {
        [phaseName: string]: {
            successRate: number;
            averageDuration: number;
            failureReasons: string[];
        };
    };
    qualityTrends: {
        averageScore: number;
        trendDirection: 'up' | 'down' | 'stable';
    };
    recommendations: string[];
}
export declare class MetricsCollector {
    private metricsPath;
    constructor(basePath?: string);
    recordWorkflow(result: WorkflowResult): Promise<void>;
    getWorkflowMetrics(): Promise<WorkflowMetrics>;
    generateAnalyticsReport(daysBack?: number): Promise<AnalyticsReport>;
    exportMetrics(format?: 'json' | 'csv'): Promise<string>;
    private loadWorkflowData;
    private calculateMetricsForData;
    private calculatePhaseMetrics;
    private calculateQualityTrends;
    private generateRecommendations;
    private extractTokenUsage;
}
//# sourceMappingURL=metrics.d.ts.map