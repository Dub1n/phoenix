"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoenixCodeLiteE2E = void 0;
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const path_1 = require("path");
class PhoenixCodeLiteE2E {
    constructor(projectPath) {
        this.projectPath = projectPath;
    }
    async runWorkflow(options) {
        const startTime = Date.now();
        let filesGenerated = [];
        let testsPass = false;
        let qualityScore = 0;
        let retryCount = 0;
        try {
            // Build CLI command - use the correct entry point
            const args = [
                'node',
                'dist/src/index.js',
                'generate',
                '--task', options.task,
            ];
            if (options.framework) {
                args.push('--framework', options.framework);
            }
            if (options.language) {
                args.push('--language', options.language);
            }
            if (options.maxAttempts) {
                args.push('--max-attempts', options.maxAttempts.toString());
            }
            // Execute workflow
            const result = await this.executeCommand(args);
            if (result.exitCode !== 0) {
                throw new Error(`Workflow failed: ${result.stderr}`);
            }
            // Analyze results
            const workflowData = await this.analyzeWorkflowResults();
            filesGenerated = workflowData.files;
            testsPass = workflowData.testsPass;
            qualityScore = workflowData.qualityScore;
            retryCount = workflowData.retryCount;
            // Validate expectations
            if (options.expectFiles) {
                for (const expectedFile of options.expectFiles) {
                    if (!filesGenerated.includes(expectedFile)) {
                        throw new Error(`Expected file not generated: ${expectedFile}`);
                    }
                }
            }
            if (options.expectTests && !testsPass) {
                throw new Error('Expected tests to pass, but they failed');
            }
            return {
                success: true,
                duration: Date.now() - startTime,
                filesGenerated,
                testsPass,
                qualityScore,
                retryCount,
            };
        }
        catch (error) {
            return {
                success: false,
                duration: Date.now() - startTime,
                filesGenerated,
                testsPass,
                qualityScore,
                retryCount,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
    async runConfigurationWorkflow(template) {
        try {
            // Apply template
            await this.executeCommand([
                'node',
                'dist/src/index.js',
                'config',
                '--template', template,
            ]);
            // Verify configuration was created
            const configPath = (0, path_1.join)(this.projectPath, '.phoenix-code-lite.json');
            const configExists = await fs_1.promises.access(configPath).then(() => true).catch(() => false);
            if (!configExists) {
                return { configCreated: false, configValid: false };
            }
            // Validate configuration
            const configContent = await fs_1.promises.readFile(configPath, 'utf-8');
            const config = JSON.parse(configContent);
            const isValid = this.validateConfigurationStructure(config);
            return {
                configCreated: true,
                configValid: isValid,
            };
        }
        catch (error) {
            return { configCreated: false, configValid: false };
        }
    }
    async executeCommand(args) {
        return new Promise((resolve) => {
            const child = (0, child_process_1.spawn)('node', args, {
                cwd: this.projectPath,
                stdio: 'pipe',
            });
            let stdout = '';
            let stderr = '';
            child.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            child.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            child.on('close', (code) => {
                resolve({
                    exitCode: code || 0,
                    stdout,
                    stderr,
                });
            });
        });
    }
    async analyzeWorkflowResults() {
        const files = [];
        let testsPass = false;
        let qualityScore = 0;
        let retryCount = 0;
        try {
            // Check for generated files
            const projectFiles = await fs_1.promises.readdir(this.projectPath);
            files.push(...projectFiles.filter(f => f.endsWith('.js') || f.endsWith('.ts')));
            // Check audit logs for test results and retry count
            const auditPath = (0, path_1.join)(this.projectPath, '.phoenix-code-lite', 'audit');
            try {
                const auditFiles = await fs_1.promises.readdir(auditPath);
                const latestAudit = auditFiles.sort().pop();
                if (latestAudit) {
                    const auditContent = await fs_1.promises.readFile((0, path_1.join)(auditPath, latestAudit), 'utf-8');
                    const auditLines = auditContent.trim().split('\n');
                    auditLines.forEach(line => {
                        try {
                            const event = JSON.parse(line);
                            if (event.eventType === 'quality_gate' && event.data?.testsPassed) {
                                testsPass = true;
                            }
                            if (event.metadata?.qualityScore) {
                                qualityScore = Math.max(qualityScore, event.metadata.qualityScore);
                            }
                            if (event.eventType === 'agent_invocation' && event.data?.retryAttempt) {
                                retryCount++;
                            }
                        }
                        catch {
                            // Skip invalid JSON lines
                        }
                    });
                }
            }
            catch {
                // No audit logs available
            }
        }
        catch (error) {
            console.warn('Failed to analyze workflow results:', error);
        }
        return { files, testsPass, qualityScore, retryCount };
    }
    validateConfigurationStructure(config) {
        const requiredFields = ['version', 'claude', 'tdd', 'output'];
        return requiredFields.every(field => field in config);
    }
}
exports.PhoenixCodeLiteE2E = PhoenixCodeLiteE2E;
//# sourceMappingURL=e2e-runner.js.map