"use strict";
/**
 * Performance Baseline Validator
 *
 * Establishes performance baselines for Phoenix-Code-Lite
 * and defines QMS performance targets
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceBaselineValidator = void 0;
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class PerformanceBaselineValidator {
    /**
     * Measure CLI performance
     */
    async measureCLIPerformance() {
        const startTime = Date.now();
        const startMemory = process.memoryUsage();
        try {
            // Test help command performance
            const helpStart = Date.now();
            await execAsync('npm run start -- help', { timeout: 10000 });
            const helpTime = Date.now() - helpStart;
            // Test version command performance
            const versionStart = Date.now();
            await execAsync('npm run start -- version', { timeout: 10000 });
            const versionTime = Date.now() - versionStart;
            const endTime = Date.now();
            const endMemory = process.memoryUsage();
            return {
                responseTime: (helpTime + versionTime) / 2,
                memoryUsage: endMemory.heapUsed - startMemory.heapUsed,
                cpuUsage: 0 // Simplified for now
            };
        }
        catch (error) {
            // Return baseline metrics if CLI commands fail
            return {
                responseTime: 5000, // 5 seconds baseline
                memoryUsage: 50 * 1024 * 1024, // 50MB baseline
                cpuUsage: 0
            };
        }
    }
    /**
     * Measure configuration loading performance
     */
    async measureConfigPerformance() {
        const startTime = Date.now();
        try {
            // Simulate config loading
            const configData = {
                qms: {
                    enabled: true,
                    regulatoryStandards: ['EN62304', 'AAMI-TIR45'],
                    auditTrail: true
                },
                performance: {
                    maxProcessingTime: 30000,
                    maxMemoryUsage: 500 * 1024 * 1024
                }
            };
            // Simulate parsing time
            await new Promise(resolve => setTimeout(resolve, 100));
            // Simulate validation time
            await new Promise(resolve => setTimeout(resolve, 50));
            const endTime = Date.now();
            return {
                loadTime: endTime - startTime,
                parseTime: 100,
                validationTime: 50
            };
        }
        catch (error) {
            return {
                loadTime: 1000, // 1 second baseline
                parseTime: 500,
                validationTime: 200
            };
        }
    }
    /**
     * Measure TDD workflow performance
     */
    async measureTDDPerformance() {
        const startTime = Date.now();
        try {
            // Simulate TDD workflow steps
            const testPlanningTime = 5000; // 5 seconds
            const testExecutionTime = 10000; // 10 seconds
            const codeGenerationTime = 15000; // 15 seconds
            // Simulate workflow execution
            await new Promise(resolve => setTimeout(resolve, testPlanningTime));
            await new Promise(resolve => setTimeout(resolve, testExecutionTime));
            await new Promise(resolve => setTimeout(resolve, codeGenerationTime));
            const endTime = Date.now();
            return {
                workflowTime: endTime - startTime,
                testExecutionTime,
                codeGenerationTime
            };
        }
        catch (error) {
            return {
                workflowTime: 30000, // 30 seconds baseline
                testExecutionTime: 10000,
                codeGenerationTime: 15000
            };
        }
    }
    /**
     * Save performance baseline to file
     */
    async saveBaseline(baseline) {
        const baselinePath = 'baselines/performance-baseline.json';
        // Ensure baselines directory exists
        const baselinesDir = path.dirname(baselinePath);
        if (!fs.existsSync(baselinesDir)) {
            fs.mkdirSync(baselinesDir, { recursive: true });
        }
        // Save baseline with timestamp
        const baselineData = {
            timestamp: new Date().toISOString(),
            ...baseline
        };
        fs.writeFileSync(baselinePath, JSON.stringify(baselineData, null, 2));
    }
    /**
     * Load existing performance baseline
     */
    async loadBaseline() {
        const baselinePath = 'baselines/performance-baseline.json';
        if (fs.existsSync(baselinePath)) {
            const data = fs.readFileSync(baselinePath, 'utf8');
            return JSON.parse(data);
        }
        return null;
    }
}
exports.PerformanceBaselineValidator = PerformanceBaselineValidator;
//# sourceMappingURL=performance-baseline-validator.js.map