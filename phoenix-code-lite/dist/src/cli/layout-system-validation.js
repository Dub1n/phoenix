"use strict";
/**---
 * title: [Layout System Validation - Unified vs Legacy Equivalence]
 * tags: [CLI, Menu, Validation, Migration]
 * provides: [Validation Suite, Conversion Checks, Migration Demo]
 * requires: [MenuComposer, MenuLayoutManager, Unified Layout Engine, SkinMenuRenderer, Menu Types]
 * description: [Validates that the unified layout engine produces equivalent results to legacy systems and supports migration readiness.]
 * ---*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationTestCases = exports.LayoutSystemValidator = void 0;
exports.runLayoutValidation = runLayoutValidation;
exports.generateValidationReport = generateValidationReport;
const menu_composer_1 = require("./menu-composer");
const menu_layout_manager_1 = require("./menu-layout-manager");
const unified_layout_engine_1 = require("./unified-layout-engine");
const menu_content_converter_1 = require("./menu-content-converter");
const skin_menu_renderer_1 = require("./skin-menu-renderer");
/**
 * Main validation class
 */
class LayoutSystemValidator {
    constructor(options) {
        this.menuComposer = new menu_composer_1.MenuComposer({ debug: false });
        this.menuLayoutManager = new menu_layout_manager_1.MenuLayoutManager();
        this.skinRenderer = new skin_menu_renderer_1.SkinMenuRenderer();
        this.tolerance = options?.tolerance || 0.05; // 5% tolerance for minor differences
    }
    /**
     * Comprehensive validation of width calculations
     */
    validateWidthCalculations(content, context) {
        const startLegacy = performance.now();
        // Get legacy width calculation
        const legacyLayout = this.getLegacyLayout(content, context);
        const legacyWidth = legacyLayout.headerSeparatorLength;
        const legacyTime = performance.now() - startLegacy;
        // Get unified width calculation
        const startUnified = performance.now();
        const skinDefinition = (0, menu_content_converter_1.convertMenuContentToSkinDefinition)(content, context);
        const defaultConstraints = {
            minHeight: 15,
            minWidth: 40,
            maxWidth: 100,
            textboxLines: 3,
            paddingLines: 2,
            enforceConsistentHeight: true
        };
        const unifiedLayout = (0, unified_layout_engine_1.calculateMenuLayout)(skinDefinition, defaultConstraints);
        const unifiedWidth = unifiedLayout.separatorLength;
        const unifiedTime = performance.now() - startUnified;
        // Calculate differences
        const widthDifference = Math.abs(legacyWidth - unifiedWidth);
        const relativeDifference = widthDifference / legacyWidth;
        const withinTolerance = relativeDifference <= this.tolerance;
        const differences = [];
        if (!withinTolerance) {
            differences.push(`Width difference: ${widthDifference} chars (${(relativeDifference * 100).toFixed(1)}%)`);
        }
        return {
            test: 'Width Calculation Comparison',
            passed: withinTolerance,
            details: {
                legacy: { width: legacyWidth, layout: legacyLayout },
                unified: { width: unifiedWidth, layout: unifiedLayout },
                differences,
                toleranceApplied: true
            },
            metrics: {
                legacyTime,
                unifiedTime,
                performanceGain: ((legacyTime - unifiedTime) / legacyTime) * 100
            }
        };
    }
    /**
     * Comprehensive validation of height calculations
     */
    validateHeightCalculations(content, context) {
        const startLegacy = performance.now();
        // Get legacy height calculation
        const legacyBaseLayout = this.getLegacyLayout(content, context);
        const legacyConsistentLayout = this.menuLayoutManager.calculateConsistentLayout(content, context, legacyBaseLayout);
        const legacyHeight = legacyConsistentLayout.totalLines;
        const legacyContentLines = legacyConsistentLayout.contentLines;
        const legacyTime = performance.now() - startLegacy;
        // Get unified height calculation  
        const startUnified = performance.now();
        const skinDefinition = (0, menu_content_converter_1.convertMenuContentToSkinDefinition)(content, context);
        const defaultConstraints = {
            minHeight: 15,
            minWidth: 40,
            maxWidth: 100,
            textboxLines: 3,
            paddingLines: 2,
            enforceConsistentHeight: true
        };
        const unifiedLayout = (0, unified_layout_engine_1.calculateMenuLayout)(skinDefinition, defaultConstraints);
        const unifiedHeight = unifiedLayout.totalLines;
        const unifiedContentLines = unifiedLayout.contentLines;
        const unifiedTime = performance.now() - startUnified;
        // Calculate differences
        const heightMatch = legacyHeight === unifiedHeight;
        const contentLinesMatch = legacyContentLines === unifiedContentLines;
        const textboxMatch = legacyConsistentLayout.textboxAreaLines === unifiedLayout.textboxAreaLines;
        const differences = [];
        if (!heightMatch) {
            differences.push(`Height mismatch: legacy=${legacyHeight}, unified=${unifiedHeight}`);
        }
        if (!contentLinesMatch) {
            differences.push(`Content lines mismatch: legacy=${legacyContentLines}, unified=${unifiedContentLines}`);
        }
        if (!textboxMatch) {
            differences.push(`Textbox area mismatch`);
        }
        return {
            test: 'Height Calculation Comparison',
            passed: heightMatch && contentLinesMatch && textboxMatch,
            details: {
                legacy: {
                    height: legacyHeight,
                    contentLines: legacyContentLines,
                    textboxLines: legacyConsistentLayout.textboxAreaLines
                },
                unified: {
                    height: unifiedHeight,
                    contentLines: unifiedContentLines,
                    textboxLines: unifiedLayout.textboxAreaLines
                },
                differences,
                toleranceApplied: false
            },
            metrics: {
                legacyTime,
                unifiedTime,
                performanceGain: ((legacyTime - unifiedTime) / legacyTime) * 100
            }
        };
    }
    /**
     * Validate content preservation during conversion
     */
    validateContentPreservation(content, context) {
        const startTime = performance.now();
        // Convert and validate
        const skinDefinition = (0, menu_content_converter_1.convertMenuContentToSkinDefinition)(content, context);
        const validation = (0, menu_content_converter_1.validateConversion)(content, skinDefinition);
        const endTime = performance.now();
        const differences = validation.issues;
        const passed = validation.isValid;
        return {
            test: 'Content Preservation Validation',
            passed,
            details: {
                legacy: {
                    title: content.title,
                    itemCount: content.sections.reduce((total, section) => total + section.items.length, 0),
                    sectionCount: content.sections.length
                },
                unified: {
                    title: skinDefinition.title,
                    itemCount: skinDefinition.items.filter(item => item.type !== 'action').length,
                    themeApplied: !!skinDefinition.theme
                },
                differences,
                toleranceApplied: false
            },
            metrics: {
                legacyTime: 0, // No legacy operation for comparison
                unifiedTime: endTime - startTime,
                performanceGain: 0
            }
        };
    }
    /**
     * Performance comparison test
     */
    validatePerformance(content, context, iterations = 100) {
        // Legacy performance test
        const legacyTimes = [];
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            this.renderLegacyMenu(content, context);
            legacyTimes.push(performance.now() - start);
        }
        // Unified performance test
        const unifiedTimes = [];
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            this.skinRenderer.renderLegacyMenu(content, context);
            unifiedTimes.push(performance.now() - start);
        }
        const avgLegacyTime = legacyTimes.reduce((sum, time) => sum + time, 0) / iterations;
        const avgUnifiedTime = unifiedTimes.reduce((sum, time) => sum + time, 0) / iterations;
        const performanceGain = ((avgLegacyTime - avgUnifiedTime) / avgLegacyTime) * 100;
        return {
            test: 'Performance Comparison',
            passed: performanceGain >= 0, // Unified should be at least as fast
            details: {
                legacy: {
                    averageTime: avgLegacyTime,
                    iterations,
                    minTime: Math.min(...legacyTimes),
                    maxTime: Math.max(...legacyTimes)
                },
                unified: {
                    averageTime: avgUnifiedTime,
                    iterations,
                    minTime: Math.min(...unifiedTimes),
                    maxTime: Math.max(...unifiedTimes)
                },
                differences: [
                    `Performance gain: ${performanceGain.toFixed(1)}%`,
                    `Time difference: ${(avgLegacyTime - avgUnifiedTime).toFixed(3)}ms`
                ],
                toleranceApplied: false
            },
            metrics: {
                legacyTime: avgLegacyTime,
                unifiedTime: avgUnifiedTime,
                performanceGain
            }
        };
    }
    /**
     * Run comprehensive validation suite
     */
    runBatchValidation(testCases) {
        const results = [];
        for (const testCase of testCases) {
            try {
                // Run all validation tests for this case
                const widthResult = this.validateWidthCalculations(testCase.content, testCase.context);
                const heightResult = this.validateHeightCalculations(testCase.content, testCase.context);
                const contentResult = this.validateContentPreservation(testCase.content, testCase.context);
                const performanceResult = this.validatePerformance(testCase.content, testCase.context, 10);
                results.push({ ...widthResult, test: `${testCase.name} - ${widthResult.test}` }, { ...heightResult, test: `${testCase.name} - ${heightResult.test}` }, { ...contentResult, test: `${testCase.name} - ${contentResult.test}` }, { ...performanceResult, test: `${testCase.name} - ${performanceResult.test}` });
            }
            catch (error) {
                results.push({
                    test: `${testCase.name} - Error`,
                    passed: false,
                    details: {
                        legacy: null,
                        unified: null,
                        differences: [`Test failed with error: ${error}`],
                        toleranceApplied: false
                    },
                    metrics: { legacyTime: 0, unifiedTime: 0, performanceGain: 0 }
                });
            }
        }
        // Calculate summary statistics
        const totalTests = results.length;
        const passed = results.filter(r => r.passed).length;
        const failed = totalTests - passed;
        const successRate = (passed / totalTests) * 100;
        const avgPerformanceGain = results.reduce((sum, r) => sum + r.metrics.performanceGain, 0) / totalTests;
        // Calculate specific accuracy rates
        const widthTests = results.filter(r => r.test.includes('Width'));
        const heightTests = results.filter(r => r.test.includes('Height'));
        const contentTests = results.filter(r => r.test.includes('Content'));
        const renderingTests = results.filter(r => r.test.includes('Performance'));
        return {
            totalTests,
            passed,
            failed,
            successRate,
            overallPerformanceGain: avgPerformanceGain,
            results,
            summary: {
                widthCalculationAccuracy: (widthTests.filter(r => r.passed).length / widthTests.length) * 100,
                heightCalculationAccuracy: (heightTests.filter(r => r.passed).length / heightTests.length) * 100,
                contentPreservationRate: (contentTests.filter(r => r.passed).length / contentTests.length) * 100,
                renderingConsistency: (renderingTests.filter(r => r.passed).length / renderingTests.length) * 100
            }
        };
    }
    // Private helper methods
    getLegacyLayout(content, context) {
        // Access the private calculateLayout method through composition
        return this.menuComposer.calculateLayout(content, context);
    }
    renderLegacyMenu(content, context) {
        // Use the compose method without actually rendering to console
        const originalConsoleLog = console.log;
        console.log = () => { }; // Suppress output during testing
        try {
            this.menuComposer.compose(content, context);
        }
        finally {
            console.log = originalConsoleLog; // Restore console.log
        }
    }
}
exports.LayoutSystemValidator = LayoutSystemValidator;
/**
 * Pre-built test cases for validation
 */
exports.validationTestCases = [
    {
        name: 'Simple Menu',
        content: {
            title: '* Phoenix Code Lite',
            subtitle: 'Quick Actions',
            sections: [{
                    heading: '⚡ Quick Commands:',
                    theme: { headingColor: 'yellow', bold: true },
                    items: [
                        { label: '1. help', description: 'Show help', commands: ['help', '1'] },
                        { label: '2. quit', description: 'Exit application', commands: ['quit', '2'] }
                    ]
                }]
        },
        context: { level: 'main', breadcrumb: ['Phoenix Code Lite'] }
    },
    {
        name: 'Complex Config Menu',
        content: {
            title: '⋇ Advanced Configuration Management Hub',
            subtitle: 'Comprehensive settings management with enterprise-grade options',
            sections: [
                {
                    heading: '◦ Primary Configuration:',
                    theme: { headingColor: 'green', bold: true },
                    items: [
                        { label: '1. show', description: 'Display current configuration with detailed validation status', commands: ['show', '1'] },
                        { label: '2. edit', description: 'Interactive configuration editor with guided setup wizard', commands: ['edit', '2'] },
                        { label: '3. validate', description: 'Run comprehensive configuration validation checks', commands: ['validate', '3'] },
                        { label: '4. backup', description: 'Create timestamped configuration backup', commands: ['backup', '4'] }
                    ]
                },
                {
                    heading: '⌘ Advanced Settings:',
                    theme: { headingColor: 'cyan', bold: true },
                    items: [
                        { label: '5. framework', description: 'Framework-specific optimization and performance settings', commands: ['framework', '5'] },
                        { label: '6. security', description: 'Security policies, audit trails, and access controls', commands: ['security', '6'] },
                        { label: '7. monitoring', description: 'Performance monitoring and alerting configuration', commands: ['monitoring', '7'] },
                        { label: '8. integrations', description: 'Third-party service integrations and API settings', commands: ['integrations', '8'] }
                    ]
                }
            ],
            footerHints: ['Navigation: command name, number, "back" to return, "quit" to exit']
        },
        context: { level: 'config', parentMenu: 'main', breadcrumb: ['Phoenix Code Lite', 'Configuration'] }
    },
    {
        name: 'Medium Template Menu',
        content: {
            title: '□ Template Management',
            subtitle: 'Manage configuration templates',
            sections: [{
                    heading: '⌺ Template Commands:',
                    theme: { headingColor: 'yellow', bold: true },
                    items: [
                        { label: '1. list', description: 'Show available templates', commands: ['list', '1'] },
                        { label: '2. use', description: 'Apply template to project', commands: ['use', '2'] },
                        { label: '3. create', description: 'Create custom template', commands: ['create', '3'] },
                        { label: '4. edit', description: 'Modify existing template', commands: ['edit', '4'] },
                        { label: '5. delete', description: 'Remove template', commands: ['delete', '5'] }
                    ]
                }],
            footerHints: ['Navigation: command name, number, "back" to return']
        },
        context: { level: 'templates', parentMenu: 'main', breadcrumb: ['Phoenix Code Lite', 'Templates'] }
    }
];
/**
 * Convenience function to run validation
 */
function runLayoutValidation() {
    const validator = new LayoutSystemValidator();
    return validator.runBatchValidation(exports.validationTestCases);
}
/**
 * Generate validation report
 */
function generateValidationReport(result) {
    const lines = [
        '# Layout System Validation Report',
        '',
        `**Overall Success Rate**: ${result.successRate.toFixed(1)}%`,
        `**Tests Passed**: ${result.passed}/${result.totalTests}`,
        `**Performance Gain**: ${result.overallPerformanceGain.toFixed(1)}%`,
        '',
        '## Summary by Category',
        `- Width Calculation Accuracy: ${result.summary.widthCalculationAccuracy.toFixed(1)}%`,
        `- Height Calculation Accuracy: ${result.summary.heightCalculationAccuracy.toFixed(1)}%`,
        `- Content Preservation Rate: ${result.summary.contentPreservationRate.toFixed(1)}%`,
        `- Rendering Consistency: ${result.summary.renderingConsistency.toFixed(1)}%`,
        '',
        '## Individual Test Results',
        ''
    ];
    for (const test of result.results) {
        const status = test.passed ? '✓ PASS' : '✗ FAIL';
        lines.push(`### ${test.test} - ${status}`);
        lines.push(`**Performance**: ${test.metrics.performanceGain.toFixed(1)}% improvement`);
        if (test.details.differences.length > 0) {
            lines.push('**Issues**:');
            for (const diff of test.details.differences) {
                lines.push(`- ${diff}`);
            }
        }
        lines.push('');
    }
    return lines.join('\n');
}
//# sourceMappingURL=layout-system-validation.js.map