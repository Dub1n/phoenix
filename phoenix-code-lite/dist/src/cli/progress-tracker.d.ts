/**---
 * title: [Progress Tracker - Workflow Phase Tracking]
 * tags: [CLI, Utility, Progress, UX]
 * provides: [ProgressTracker Class, Phase State, Time Metrics, Spinner Integration]
 * requires: [chalk]
 * description: [Tracks workflow phases, substeps, and timing; provides user-friendly progress output suitable for CLI UX.]
 * ---*/
export interface PhaseInfo {
    name: string;
    substeps?: string[];
    completedSubsteps: number;
    startTime?: Date;
    endTime?: Date;
    success?: boolean;
}
export declare class ProgressTracker {
    private workflowName;
    private totalPhases;
    private phases;
    private currentPhaseIndex;
    private spinner;
    private startTime;
    constructor(workflowName: string, totalPhases: number);
    startPhase(phaseName: string, substepCount?: number): void;
    completeSubstep(substepName?: string): void;
    completePhase(success?: boolean): void;
    getCurrentPhase(): number;
    getCurrentPhaseName(): string;
    getProgress(): number;
    getPhaseProgress(): number;
    displaySummary(): void;
    private updateSpinner;
    destroy(): void;
}
//# sourceMappingURL=progress-tracker.d.ts.map