import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import Table from 'cli-table3';
import { WorkflowResult } from '../types/workflow';
import { ProgressTracker } from './progress-tracker';
import { HelpSystem } from './help-system';
import { InteractivePrompts } from './interactive';

export interface CommandHistoryEntry {
  command: string;
  options: any;
  timestamp: Date;
  success: boolean;
  duration: number;
}

export class AdvancedCLI {
  private basePath: string;
  private historyPath: string;
  private helpSystem: HelpSystem;
  private prompts: InteractivePrompts;

  constructor(basePath?: string) {
    this.basePath = basePath || process.cwd();
    this.historyPath = join(this.basePath, '.phoenix-code-lite', 'history.json');
    this.helpSystem = new HelpSystem();
    this.prompts = new InteractivePrompts();
  }

  async recordCommand(command: string, options: any, success: boolean = true, duration: number = 0): Promise<void> {
    try {
      const entry: CommandHistoryEntry = {
        command,
        options,
        timestamp: new Date(),
        success,
        duration,
      };

      const history = await this.getCommandHistory();
      history.unshift(entry); // Add to beginning

      // Keep only last 100 entries
      if (history.length > 100) {
        history.splice(100);
      }

      await fs.mkdir(join(this.basePath, '.phoenix-code-lite'), { recursive: true });
      await fs.writeFile(this.historyPath, JSON.stringify(history, null, 2));
    } catch (error) {
      // Silently fail for history recording
      console.debug('Failed to record command history:', error);
    }
  }

  async getCommandHistory(): Promise<CommandHistoryEntry[]> {
    try {
      const content = await fs.readFile(this.historyPath, 'utf-8');
      const history = JSON.parse(content);
      return history.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));
    } catch {
      return [];
    }
  }

  getCompletionSuggestions(partial: string): string[] {
    const commands = ['generate', 'init', 'config', 'export', 'history', 'help'];
    const flags = ['--task', '--project-path', '--language', '--framework', '--verbose', '--skip-docs', '--max-attempts'];

    if (partial.startsWith('--')) {
      return flags.filter(flag => flag.startsWith(partial));
    }

    // If partial contains a command followed by --, suggest flags
    if (partial.includes(' --')) {
      const flagPart = partial.split(' --')[1];
      if (flagPart !== undefined) {
        return flags.filter(flag => flag.startsWith('--' + flagPart));
      }
      return flags;
    }

    return commands.filter(cmd => cmd.startsWith(partial));
  }

  async generateWorkflowReport(result: WorkflowResult): Promise<string> {
    const table = new Table({
      head: ['Phase', 'Status', 'Duration', 'Artifacts'],
      colWidths: [20, 10, 12, 30],
    });

    result.phases.forEach(phase => {
      const status = phase.success ? chalk.green('✓ Pass') : chalk.red('✗ Fail');
      const duration = phase.endTime && phase.startTime ? 
        `${phase.endTime.getTime() - phase.startTime.getTime()}ms` : 'N/A';
      const artifacts = phase.artifacts ? phase.artifacts.join(', ') : 'None';

      table.push([phase.name, status, duration, artifacts]);
    });

    const overallStatus = result.success ? 
      chalk.green('✓ SUCCESS') : 
      chalk.red('✗ FAILED');

    let report = chalk.bold.blue('\n※ Workflow Summary\n\n');
    report += chalk.gray(`Task: ${result.taskDescription}\n`);
    report += chalk.gray(`Status: ${overallStatus}\n`);
    report += chalk.gray(`Total Duration: ${result.duration}ms\n`);
    report += chalk.gray(`Phases: ${result.phases.length}\n\n`);
    
    report += table.toString();
    
    if (result.error) {
      report += chalk.red(`\n✗ Error: ${result.error}\n`);
    }

    if (result.artifacts && result.artifacts.length > 0) {
      report += chalk.green(`\n□ Generated Files:\n`);
      result.artifacts.forEach(artifact => {
        report += chalk.gray(`  • ${artifact}\n`);
      });
    }

    return report;
  }

  async exportReport(result: WorkflowResult, format: 'json' | 'csv' | 'html', outputPath: string): Promise<void> {
    let content: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(result, null, 2);
        break;
      case 'csv':
        content = this.convertToCSV(result);
        break;
      case 'html':
        content = this.convertToHTML(result);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    await fs.writeFile(outputPath, content, 'utf-8');
  }

  async displayHistory(limit: number = 10): Promise<void> {
    const history = await this.getCommandHistory();
    const recent = history.slice(0, limit);

    if (recent.length === 0) {
      console.log(chalk.yellow('No command history found.'));
      return;
    }

    const table = new Table({
      head: ['Command', 'Status', 'Duration', 'Time'],
      colWidths: [20, 10, 12, 20],
    });

    recent.forEach(entry => {
      const status = entry.success ? chalk.green('✓ Success') : chalk.red('✗ Failed');
      const duration = `${entry.duration}ms`;
      const time = entry.timestamp.toLocaleString();

      table.push([entry.command, status, duration, time]);
    });

    console.log(chalk.bold.blue('\n📜 Command History\n'));
    console.log(table.toString());
  }

  async getContextualHelp(): Promise<string> {
    return await this.helpSystem.getContextualHelp(this.basePath);
  }

  private convertToCSV(result: WorkflowResult): string {
    const headers = ['Task', 'Success', 'Duration', 'Phase', 'PhaseSuccess', 'PhaseDuration', 'Artifacts'];
    const rows = [headers.join(',')];

    result.phases.forEach(phase => {
      const phaseDuration = phase.endTime && phase.startTime ? 
        phase.endTime.getTime() - phase.startTime.getTime() : 0;
      
      const row = [
        `"${result.taskDescription}"`,
        result.success,
        result.duration,
        `"${phase.name}"`,
        phase.success,
        phaseDuration,
        `"${phase.artifacts?.join(';') || ''}"`
      ];
      
      rows.push(row.join(','));
    });

    return rows.join('\n');
  }

  private convertToHTML(result: WorkflowResult): string {
    const status = result.success ? 'SUCCESS' : 'FAILED';
    const statusColor = result.success ? 'green' : 'red';

    let html = `
<!DOCTYPE html>
<html>
<head>
    <title>Phoenix-Code-Lite Workflow Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .status-success { color: green; font-weight: bold; }
        .status-failed { color: red; font-weight: bold; }
        table { border-collapse: collapse; width: 100%; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Workflow Report</h1>
        <p><strong>Task:</strong> ${result.taskDescription}</p>
        <p><strong>Status:</strong> <span class="status-${result.success ? 'success' : 'failed'}">${status}</span></p>
        <p><strong>Duration:</strong> ${result.duration}ms</p>
    </div>
    
    <h2>Phase Details</h2>
    <table>
        <thead>
            <tr>
                <th>Phase</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Artifacts</th>
            </tr>
        </thead>
        <tbody>`;

    result.phases.forEach(phase => {
      const phaseStatus = phase.success ? 'SUCCESS' : 'FAILED';
      const phaseDuration = phase.endTime && phase.startTime ? 
        phase.endTime.getTime() - phase.startTime.getTime() : 0;
      
      html += `
            <tr>
                <td>${phase.name}</td>
                <td class="status-${phase.success ? 'success' : 'failed'}">${phaseStatus}</td>
                <td>${phaseDuration}ms</td>
                <td>${phase.artifacts?.join(', ') || 'None'}</td>
            </tr>`;
    });

    html += `
        </tbody>
    </table>
</body>
</html>`;

    return html;
  }
}