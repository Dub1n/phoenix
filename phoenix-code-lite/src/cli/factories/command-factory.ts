import { IConfigManager } from '../interfaces/config-manager';
import { IAuditLogger } from '../interfaces/audit-logger';
import { IClaudeClient } from '../interfaces/claude-client';
import { IFileSystem } from '../interfaces/file-system';
import { ConfigCommand } from '../commands/config-command';
import { HelpCommand } from '../commands/help-command';
import { VersionCommand } from '../commands/version-command';
import { GenerateCommand } from '../commands/generate-command';
import { InitCommand } from '../commands/init-command';
import { PhoenixCodeLiteOptions } from '../args';

export class CommandFactory {
  constructor(
    private configManager: IConfigManager,
    private auditLogger: IAuditLogger,
    private claudeClient: IClaudeClient,
    private fileSystem: IFileSystem
  ) {}

  createConfigCommand(): ConfigCommand {
    return new ConfigCommand(this.configManager, this.auditLogger);
  }

  createHelpCommand(): HelpCommand {
    return new HelpCommand(this.auditLogger);
  }

  createVersionCommand(): VersionCommand {
    return new VersionCommand(this.auditLogger);
  }

  createGenerateCommand(): GenerateCommand {
    return new GenerateCommand(
      this.claudeClient,
      this.configManager,
      this.auditLogger,
      this.fileSystem
    );
  }

  createInitCommand(): InitCommand {
    return new InitCommand(
      this.configManager,
      this.auditLogger,
      this.fileSystem
    );
  }

  // Method to create commands with options (for commands that need them)
  createGenerateCommandWithOptions(options: PhoenixCodeLiteOptions): GenerateCommand {
    return new GenerateCommand(
      this.claudeClient,
      this.configManager,
      this.auditLogger,
      this.fileSystem
    );
  }
} 