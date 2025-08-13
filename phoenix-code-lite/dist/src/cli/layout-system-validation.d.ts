/**---
 * title: [Layout System Validation - Unified vs Legacy Equivalence]
 * tags: [CLI, Menu, Validation, Migration]
 * provides: [Validation Suite, Conversion Checks, Migration Demo]
 * requires: [MenuComposer, MenuLayoutManager, Unified Layout Engine, SkinMenuRenderer, Menu Types]
 * description: [Validates that the unified layout engine produces equivalent results to legacy systems and supports migration readiness.]
 * ---*/
import type { MenuContent, MenuDisplayContext } from './menu-types';
/**
 * Validation result structure
 */
export interface ValidationResult {
    test: string;
    passed: boolean;
    details: {
        legacy: any;
        unified: any;
        differences: string[];
        toleranceApplied: boolean;
    };
    metrics: {
        legacyTime: number;
        unifiedTime: number;
        performanceGain: number;
    };
}
/**
 * Batch validation results
 */
export interface BatchValidationResult {
    totalTests: number;
    passed: number;
    failed: number;
    successRate: number;
    overallPerformanceGain: number;
    results: ValidationResult[];
    summary: {
        widthCalculationAccuracy: number;
        heightCalculationAccuracy: number;
        contentPreservationRate: number;
        renderingConsistency: number;
    };
}
/**
 * Main validation class
 */
export declare class LayoutSystemValidator {
    private menuComposer;
    private menuLayoutManager;
    private skinRenderer;
    private tolerance;
    constructor(options?: {
        tolerance?: number;
    });
    /**
     * Comprehensive validation of width calculations
     */
    validateWidthCalculations(content: MenuContent, context: MenuDisplayContext): ValidationResult;
    /**
     * Comprehensive validation of height calculations
     */
    validateHeightCalculations(content: MenuContent, context: MenuDisplayContext): ValidationResult;
    /**
     * Validate content preservation during conversion
     */
    validateContentPreservation(content: MenuContent, context: MenuDisplayContext): ValidationResult;
    /**
     * Performance comparison test
     */
    validatePerformance(content: MenuContent, context: MenuDisplayContext, iterations?: number): ValidationResult;
    /**
     * Run comprehensive validation suite
     */
    runBatchValidation(testCases: Array<{
        content: MenuContent;
        context: MenuDisplayContext;
        name: string;
    }>): BatchValidationResult;
    private getLegacyLayout;
    private renderLegacyMenu;
}
/**
 * Pre-built test cases for validation
 */
export declare const validationTestCases: Array<{
    content: MenuContent;
    context: MenuDisplayContext;
    name: string;
}>;
/**
 * Convenience function to run validation
 */
export declare function runLayoutValidation(): BatchValidationResult;
/**
 * Generate validation report
 */
export declare function generateValidationReport(result: BatchValidationResult): string;
//# sourceMappingURL=layout-system-validation.d.ts.map