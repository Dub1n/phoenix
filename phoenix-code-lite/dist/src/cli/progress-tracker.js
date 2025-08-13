"use strict";
/**---
 * title: [Progress Tracker - Workflow Phase Tracking]
 * tags: [CLI, Utility, Progress, UX]
 * provides: [ProgressTracker Class, Phase State, Time Metrics, Spinner Integration]
 * requires: [chalk]
 * description: [Tracks workflow phases, substeps, and timing; provides user-friendly progress output suitable for CLI UX.]
 * ---*/
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressTracker = void 0;
const chalk_1 = __importDefault(require("chalk"));
class ProgressTracker {
    constructor(workflowName, totalPhases) {
        this.phases = [];
        this.currentPhaseIndex = -1;
        this.spinner = null;
        this.workflowName = workflowName;
        this.totalPhases = totalPhases;
        this.startTime = new Date();
    }
    startPhase(phaseName, substepCount) {
        // Complete previous phase if exists
        if (this.currentPhaseIndex >= 0) {
            this.completePhase();
        }
        this.currentPhaseIndex++;
        const phase = {
            name: phaseName,
            substeps: substepCount ? Array(substepCount).fill('').map((_, i) => `Step ${i + 1}`) : undefined,
            completedSubsteps: 0,
            startTime: new Date(),
        };
        this.phases[this.currentPhaseIndex] = phase;
        // Update spinner
        this.updateSpinner().catch(console.error);
    }
    completeSubstep(substepName) {
        const currentPhase = this.phases[this.currentPhaseIndex];
        if (currentPhase && currentPhase.substeps) {
            if (substepName && currentPhase.completedSubsteps < currentPhase.substeps.length) {
                currentPhase.substeps[currentPhase.completedSubsteps] = substepName;
            }
            currentPhase.completedSubsteps++;
            this.updateSpinner().catch(console.error);
        }
    }
    completePhase(success = true) {
        const currentPhase = this.phases[this.currentPhaseIndex];
        if (currentPhase) {
            currentPhase.endTime = new Date();
            currentPhase.success = success;
            if (this.spinner) {
                const icon = success ? '✓' : '✗';
                const duration = currentPhase.endTime.getTime() - (currentPhase.startTime?.getTime() || 0);
                this.spinner.succeed(`${icon} ${currentPhase.name} (${duration}ms)`);
                this.spinner = null;
            }
        }
    }
    getCurrentPhase() {
        return this.currentPhaseIndex + 1;
    }
    getCurrentPhaseName() {
        return this.phases[this.currentPhaseIndex]?.name || '';
    }
    getProgress() {
        if (this.totalPhases === 0)
            return 1;
        return (this.currentPhaseIndex + 1) / this.totalPhases;
    }
    getPhaseProgress() {
        const currentPhase = this.phases[this.currentPhaseIndex];
        if (!currentPhase || !currentPhase.substeps)
            return 0;
        return currentPhase.completedSubsteps / currentPhase.substeps.length;
    }
    displaySummary() {
        const duration = new Date().getTime() - this.startTime.getTime();
        const successfulPhases = this.phases.filter(p => p.success).length;
        console.log(chalk_1.default.blue(`\n◊ ${this.workflowName} Summary`));
        console.log(chalk_1.default.gray(`Total duration: ${duration}ms`));
        console.log(chalk_1.default.gray(`Phases completed: ${successfulPhases}/${this.phases.length}`));
        this.phases.forEach((phase, index) => {
            const icon = phase.success ? '✓' : '✗';
            const phaseDuration = phase.endTime && phase.startTime ?
                phase.endTime.getTime() - phase.startTime.getTime() : 0;
            console.log(`  ${icon} Phase ${index + 1}: ${phase.name} (${phaseDuration}ms)`);
            if (phase.substeps && phase.completedSubsteps > 0) {
                phase.substeps.slice(0, phase.completedSubsteps).forEach(substep => {
                    console.log(`    ✓ ${substep}`);
                });
            }
        });
    }
    async updateSpinner() {
        const currentPhase = this.phases[this.currentPhaseIndex];
        if (!currentPhase)
            return;
        const progress = Math.round(this.getProgress() * 100);
        let text = `[${progress}%] ${currentPhase.name}`;
        if (currentPhase.substeps) {
            const phaseProgress = Math.round(this.getPhaseProgress() * 100);
            text += ` (${phaseProgress}% - ${currentPhase.completedSubsteps}/${currentPhase.substeps.length})`;
        }
        if (this.spinner) {
            this.spinner.text = text;
        }
        else {
            const { default: ora } = await Promise.resolve().then(() => __importStar(require('ora')));
            this.spinner = ora(text).start();
        }
    }
    destroy() {
        if (this.spinner) {
            this.spinner.stop();
            this.spinner = null;
        }
    }
}
exports.ProgressTracker = ProgressTracker;
//# sourceMappingURL=progress-tracker.js.map