"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CLITestUtils = void 0;
const mock_config_manager_1 = require("../mocks/mock-config-manager");
const mock_audit_logger_1 = require("../mocks/mock-audit-logger");
const mock_claude_client_1 = require("../mocks/mock-claude-client");
const mock_file_system_1 = require("../mocks/mock-file-system");
const command_factory_1 = require("../../cli/factories/command-factory");
class CLITestUtils {
    static createMockDependencies() {
        return {
            configManager: new mock_config_manager_1.MockConfigManager(),
            auditLogger: new mock_audit_logger_1.MockAuditLogger(),
            claudeClient: new mock_claude_client_1.MockClaudeClient(),
            fileSystem: new mock_file_system_1.MockFileSystem()
        };
    }
    static createCommandFactory(mocks = this.createMockDependencies()) {
        return new command_factory_1.CommandFactory(mocks.configManager, mocks.auditLogger, mocks.claudeClient, mocks.fileSystem);
    }
    // Note: InteractiveSession will be implemented later
    // static createInteractiveSession(mocks = this.createMockDependencies()) {
    //   const commandFactory = this.createCommandFactory(mocks);
    //   return new InteractiveSession(
    //     commandFactory,
    //     mocks.auditLogger,
    //     mocks.configManager
    //   );
    // }
    static async captureConsoleOutput(fn) {
        const originalLog = console.log;
        let output = '';
        console.log = (...args) => {
            output += args.join(' ') + '\n';
        };
        try {
            await fn();
        }
        finally {
            console.log = originalLog;
        }
        return output;
    }
    static async captureConsoleError(fn) {
        const originalWrite = process.stderr.write;
        let output = '';
        process.stderr.write = (chunk) => {
            output += chunk;
            return true;
        };
        try {
            await fn();
        }
        finally {
            process.stderr.write = originalWrite;
        }
        return output;
    }
    static mockProcessExit(fn) {
        const originalExit = process.exit;
        let exitCode = null;
        let exitCalled = false;
        process.exit = ((code) => {
            exitCode = code;
            exitCalled = true;
        });
        try {
            fn();
        }
        finally {
            process.exit = originalExit;
        }
        return { exitCode, exitCalled };
    }
    static createTestOptions(overrides = {}) {
        return {
            task: 'test task',
            projectPath: '/test/project',
            language: 'typescript',
            framework: 'node',
            verbose: false,
            maxAttempts: 3,
            ...overrides
        };
    }
}
exports.CLITestUtils = CLITestUtils;
//# sourceMappingURL=cli-test-utils.js.map