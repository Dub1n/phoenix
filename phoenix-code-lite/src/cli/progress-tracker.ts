import chalk from 'chalk';

export interface PhaseInfo {
  name: string;
  substeps?: string[];
  completedSubsteps: number;
  startTime?: Date;
  endTime?: Date;
  success?: boolean;
}

export class ProgressTracker {
  private workflowName: string;
  private totalPhases: number;
  private phases: PhaseInfo[] = [];
  private currentPhaseIndex: number = -1;
  private spinner: any | null = null;
  private startTime: Date;

  constructor(workflowName: string, totalPhases: number) {
    this.workflowName = workflowName;
    this.totalPhases = totalPhases;
    this.startTime = new Date();
  }

  startPhase(phaseName: string, substepCount?: number): void {
    // Complete previous phase if exists
    if (this.currentPhaseIndex >= 0) {
      this.completePhase();
    }

    this.currentPhaseIndex++;
    const phase: PhaseInfo = {
      name: phaseName,
      substeps: substepCount ? Array(substepCount).fill('').map((_, i) => `Step ${i + 1}`) : undefined,
      completedSubsteps: 0,
      startTime: new Date(),
    };

    this.phases[this.currentPhaseIndex] = phase;

    // Update spinner
    this.updateSpinner().catch(console.error);
  }

  completeSubstep(substepName?: string): void {
    const currentPhase = this.phases[this.currentPhaseIndex];
    if (currentPhase && currentPhase.substeps) {
      if (substepName && currentPhase.completedSubsteps < currentPhase.substeps.length) {
        currentPhase.substeps[currentPhase.completedSubsteps] = substepName;
      }
      currentPhase.completedSubsteps++;
      this.updateSpinner().catch(console.error);
    }
  }

  completePhase(success: boolean = true): void {
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

  getCurrentPhase(): number {
    return this.currentPhaseIndex + 1;
  }

  getCurrentPhaseName(): string {
    return this.phases[this.currentPhaseIndex]?.name || '';
  }

  getProgress(): number {
    if (this.totalPhases === 0) return 1;
    return (this.currentPhaseIndex + 1) / this.totalPhases;
  }

  getPhaseProgress(): number {
    const currentPhase = this.phases[this.currentPhaseIndex];
    if (!currentPhase || !currentPhase.substeps) return 0;
    return currentPhase.completedSubsteps / currentPhase.substeps.length;
  }

  displaySummary(): void {
    const duration = new Date().getTime() - this.startTime.getTime();
    const successfulPhases = this.phases.filter(p => p.success).length;

    console.log(chalk.blue(`\n◊ ${this.workflowName} Summary`));
    console.log(chalk.gray(`Total duration: ${duration}ms`));
    console.log(chalk.gray(`Phases completed: ${successfulPhases}/${this.phases.length}`));

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

  private async updateSpinner(): Promise<void> {
    const currentPhase = this.phases[this.currentPhaseIndex];
    if (!currentPhase) return;

    const progress = Math.round(this.getProgress() * 100);
    let text = `[${progress}%] ${currentPhase.name}`;

    if (currentPhase.substeps) {
      const phaseProgress = Math.round(this.getPhaseProgress() * 100);
      text += ` (${phaseProgress}% - ${currentPhase.completedSubsteps}/${currentPhase.substeps.length})`;
    }

    if (this.spinner) {
      this.spinner.text = text;
    } else {
      const { default: ora } = await import('ora');
      this.spinner = ora(text).start();
    }
  }

  destroy(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }
}