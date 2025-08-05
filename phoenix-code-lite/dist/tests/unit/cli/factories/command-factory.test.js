"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const command_factory_1 = require("../../../../src/cli/factories/command-factory");
const mock_config_manager_1 = require("../../../../src/testing/mocks/mock-config-manager");
const mock_audit_logger_1 = require("../../../../src/testing/mocks/mock-audit-logger");
const mock_claude_client_1 = require("../../../../src/testing/mocks/mock-claude-client");
const mock_file_system_1 = require("../../../../src/testing/mocks/mock-file-system");
describe('CommandFactory', () => {
    let configManager;
    let auditLogger;
    let claudeClient;
    let fileSystem;
    let factory;
    beforeEach(() => {
        configManager = new mock_config_manager_1.MockConfigManager();
        auditLogger = new mock_audit_logger_1.MockAuditLogger();
        claudeClient = new mock_claude_client_1.MockClaudeClient();
        fileSystem = new mock_file_system_1.MockFileSystem();
        factory = new command_factory_1.CommandFactory(configManager, auditLogger, claudeClient, fileSystem);
    });
    test('should create ConfigCommand with dependencies', () => {
        const command = factory.createConfigCommand();
        expect(command).toBeDefined();
        expect(typeof command.execute).toBe('function');
    });
    test('should create HelpCommand with dependencies', () => {
        const command = factory.createHelpCommand();
        expect(command).toBeDefined();
        expect(typeof command.execute).toBe('function');
    });
    test('should create VersionCommand with dependencies', () => {
        const command = factory.createVersionCommand();
        expect(command).toBeDefined();
        expect(typeof command.execute).toBe('function');
    });
    test('should create GenerateCommand with dependencies', () => {
        const command = factory.createGenerateCommand();
        expect(command).toBeDefined();
        expect(typeof command.execute).toBe('function');
    });
    test('should create InitCommand with dependencies', () => {
        const command = factory.createInitCommand();
        expect(command).toBeDefined();
        expect(typeof command.execute).toBe('function');
    });
    test('should create GenerateCommand with options', () => {
        const options = {
            task: 'test task',
            projectPath: '/test/project',
            language: 'typescript',
            framework: 'node',
            verbose: false,
            maxAttempts: 3
        };
        const command = factory.createGenerateCommandWithOptions(options);
        expect(command).toBeDefined();
        expect(typeof command.execute).toBe('function');
    });
});
//# sourceMappingURL=command-factory.test.js.map