"use strict";
/**---
 * title: [Generate Command - CLI Command]
 * tags: [CLI, Command, Generation]
 * provides: [GenerateCommand]
 * requires: [IClaudeClient, IConfigManager, IAuditLogger, IFileSystem, TDDOrchestrator, ClaudeCodeClient]
 * description: [Executes TDD workflow to generate code using Claude Code with configuration awareness and validation.]
 * ---*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenerateCommand = void 0;
const orchestrator_1 = require("../../tdd/orchestrator");
const client_1 = require("../../claude/client");
const claude_client_adapter_1 = require("../adapters/claude-client-adapter");
const workflow_1 = require("../../types/workflow");
const test_utils_1 = require("../../utils/test-utils");
const chalk_1 = __importDefault(require("chalk"));
class GenerateCommand {
    constructor(claudeClient, configManager, auditLogger, fileSystem) {
        this.claudeClient = claudeClient;
        this.configManager = configManager;
        this.auditLogger = auditLogger;
        this.fileSystem = fileSystem;
    }
    async execute(options) {
        this.auditLogger.log('info', 'Generate command executed', { options });
        try {
            // Load configuration
            const config = await this.configManager.getConfig();
            // Apply CLI overrides to configuration
            if (options.verbose) {
                // In a real implementation, this would update the config
                this.auditLogger.log('debug', 'Verbose mode enabled');
            }
            if (options.maxAttempts) {
                // In a real implementation, this would update the config
                this.auditLogger.log('debug', `Max attempts set to: ${options.maxAttempts}`);
            }
            // Validate task context
            const context = {
                taskDescription: options.task,
                projectPath: options.projectPath || process.cwd(),
                language: options.language,
                framework: options.framework,
                maxTurns: config.performance.maxMemoryUsage, // Using a config value as example
            };
            // Validate using schema
            const validatedContext = workflow_1.TaskContextSchema.parse(context);
            // Create TDD orchestrator with adapter
            const realClient = new client_1.ClaudeCodeClient();
            const adapter = new claude_client_adapter_1.ClaudeClientAdapter(realClient);
            const orchestrator = new orchestrator_1.TDDOrchestrator(realClient);
            this.auditLogger.log('info', 'Starting TDD workflow', { context: validatedContext });
            // Execute the workflow
            const result = await orchestrator.executeWorkflow(options.task, validatedContext);
            // Display results
            if (result.success) {
                console.log(chalk_1.default.green('✓ Phoenix-Code-Lite workflow completed successfully!'));
                console.log(chalk_1.default.gray(`Duration: ${result.duration}ms`));
                console.log(chalk_1.default.gray(`Phases completed: ${result.phases.length}`));
                if (options.verbose) {
                    this.displayDetailedResults(result);
                }
            }
            else {
                console.log(chalk_1.default.red('✗ Phoenix-Code-Lite workflow failed'));
                console.log(chalk_1.default.red(`Error: ${result.error}`));
                (0, test_utils_1.safeExit)(1);
            }
        }
        catch (error) {
            this.auditLogger.log('error', 'Generate command failed', { error: error instanceof Error ? error.message : 'Unknown error' });
            console.error(chalk_1.default.red('Fatal error:'), error instanceof Error ? error.message : 'Unknown error');
            (0, test_utils_1.safeExit)(1);
        }
    }
    displayDetailedResults(result) {
        console.log(chalk_1.default.blue('\nDetailed Results:'));
        console.log(chalk_1.default.gray('Phases:'));
        result.phases.forEach((phase, index) => {
            console.log(chalk_1.default.gray(`  ${index + 1}. ${phase.name}: ${phase.success ? '✓' : '✗'}`));
        });
    }
}
exports.GenerateCommand = GenerateCommand;
//# sourceMappingURL=generate-command.js.map