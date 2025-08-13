"use strict";
/**---
 * title: [Advanced CLI - Rich Output and Command History]
 * tags: [CLI, Interface, Output, History]
 * provides: [AdvancedCLI Class, Command History, Results Display, Contextual Help Integration]
 * requires: [fs, cli-table3, HelpSystem, InteractivePrompts, ProgressTracker]
 * description: [Provides enhanced CLI utilities including formatted result tables, command history recording, contextual help integration, and prompt workflows.]
 * ---*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedCLI = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const chalk_1 = __importDefault(require("chalk"));
const cli_table3_1 = __importDefault(require("cli-table3"));
const help_system_1 = require("./help-system");
const interactive_1 = require("./interactive");
class AdvancedCLI {
    constructor(basePath) {
        this.basePath = basePath || process.cwd();
        this.historyPath = (0, path_1.join)(this.basePath, '.phoenix-code-lite', 'history.json');
        this.helpSystem = new help_system_1.HelpSystem();
        this.prompts = new interactive_1.InteractivePrompts();
    }
    async recordCommand(command, options, success = true, duration = 0) {
        try {
            const entry = {
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
            await fs_1.promises.mkdir((0, path_1.join)(this.basePath, '.phoenix-code-lite'), { recursive: true });
            await fs_1.promises.writeFile(this.historyPath, JSON.stringify(history, null, 2));
        }
        catch (error) {
            // Silently fail for history recording
            console.debug('Failed to record command history:', error);
        }
    }
    async getCommandHistory() {
        try {
            const content = await fs_1.promises.readFile(this.historyPath, 'utf-8');
            const history = JSON.parse(content);
            return history.map((entry) => ({
                ...entry,
                timestamp: new Date(entry.timestamp),
            }));
        }
        catch {
            return [];
        }
    }
    getCompletionSuggestions(partial) {
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
    async generateWorkflowReport(result) {
        const table = new cli_table3_1.default({
            head: ['Phase', 'Status', 'Duration', 'Artifacts'],
            colWidths: [20, 10, 12, 30],
        });
        result.phases.forEach(phase => {
            const status = phase.success ? chalk_1.default.green('✓ Pass') : chalk_1.default.red('✗ Fail');
            const duration = phase.endTime && phase.startTime ?
                `${phase.endTime.getTime() - phase.startTime.getTime()}ms` : 'N/A';
            const artifacts = phase.artifacts ? phase.artifacts.join(', ') : 'None';
            table.push([phase.name, status, duration, artifacts]);
        });
        const overallStatus = result.success ?
            chalk_1.default.green('✓ SUCCESS') :
            chalk_1.default.red('✗ FAILED');
        let report = chalk_1.default.bold.blue('\n※ Workflow Summary\n\n');
        report += chalk_1.default.gray(`Task: ${result.taskDescription}\n`);
        report += chalk_1.default.gray(`Status: ${overallStatus}\n`);
        report += chalk_1.default.gray(`Total Duration: ${result.duration}ms\n`);
        report += chalk_1.default.gray(`Phases: ${result.phases.length}\n\n`);
        report += table.toString();
        if (result.error) {
            report += chalk_1.default.red(`\n✗ Error: ${result.error}\n`);
        }
        if (result.artifacts && result.artifacts.length > 0) {
            report += chalk_1.default.green(`\n□ Generated Files:\n`);
            result.artifacts.forEach(artifact => {
                report += chalk_1.default.gray(`  • ${artifact}\n`);
            });
        }
        return report;
    }
    async exportReport(result, format, outputPath) {
        let content;
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
        await fs_1.promises.writeFile(outputPath, content, 'utf-8');
    }
    async displayHistory(limit = 10) {
        const history = await this.getCommandHistory();
        const recent = history.slice(0, limit);
        if (recent.length === 0) {
            console.log(chalk_1.default.yellow('No command history found.'));
            return;
        }
        const table = new cli_table3_1.default({
            head: ['Command', 'Status', 'Duration', 'Time'],
            colWidths: [20, 10, 12, 20],
        });
        recent.forEach(entry => {
            const status = entry.success ? chalk_1.default.green('✓ Success') : chalk_1.default.red('✗ Failed');
            const duration = `${entry.duration}ms`;
            const time = entry.timestamp.toLocaleString();
            table.push([entry.command, status, duration, time]);
        });
        console.log(chalk_1.default.bold.blue('\n📜 Command History\n'));
        console.log(table.toString());
    }
    async getContextualHelp() {
        return await this.helpSystem.getContextualHelp(this.basePath);
    }
    convertToCSV(result) {
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
    convertToHTML(result) {
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
exports.AdvancedCLI = AdvancedCLI;
//# sourceMappingURL=advanced-cli.js.map