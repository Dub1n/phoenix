import { CommandFactory } from '../../../../src/cli/factories/command-factory';
import { MockConfigManager } from '../../../../src/testing/mocks/mock-config-manager';
import { MockAuditLogger } from '../../../../src/testing/mocks/mock-audit-logger';
import { MockClaudeClient } from '../../../../src/testing/mocks/mock-claude-client';
import { MockFileSystem } from '../../../../src/testing/mocks/mock-file-system';

describe('CommandFactory', () => {
  let configManager: MockConfigManager;
  let auditLogger: MockAuditLogger;
  let claudeClient: MockClaudeClient;
  let fileSystem: MockFileSystem;
  let factory: CommandFactory;

  beforeEach(() => {
    configManager = new MockConfigManager();
    auditLogger = new MockAuditLogger();
    claudeClient = new MockClaudeClient();
    fileSystem = new MockFileSystem();
    factory = new CommandFactory(configManager, auditLogger, claudeClient, fileSystem);
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