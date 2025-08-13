/**---
 * title: [Quality Gates - TDD Validation Module]
 * tags: [TDD, Validation, Quality-Assurance, Scoring]
 * provides: [QualityGateManager Class, QualityGate Types, Quality Reports, Heuristic Validators]
 * requires: [Zod, Workflow Types]
 * description: [Runs syntax, coverage, code quality, and documentation checks to produce weighted quality scores and recommendations across TDD phases.]
 * ---*/
import { TaskContext } from '../types/workflow';
export interface QualityGate {
    name: string;
    description: string;
    validator: (artifact: any, context?: TaskContext) => Promise<QualityResult>;
    required: boolean;
    weight: number;
}
export interface QualityResult {
    passed: boolean;
    score: number;
    issues: string[];
    suggestions: string[];
    metadata?: Record<string, any>;
}
export interface QualityGateReport {
    phase: string;
    overallScore: number;
    overallQualityScore: number;
    overallPassed: boolean;
    gateResults: Record<string, QualityResult>;
    recommendations: string[];
}
export declare class QualityGateManager {
    private gates;
    runQualityGates(artifact: any, context: TaskContext, phase: string): Promise<QualityGateReport>;
    private validateSyntax;
    private validateTestCoverage;
    private validateCodeQuality;
    private validateDocumentation;
    private hasValidStructure;
    private hasBalancedBraces;
    private findFunctionBlocks;
    private generateRecommendations;
}
//# sourceMappingURL=quality-gates.d.ts.map