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
export declare class CommandFactory {
    private configManager;
    private auditLogger;
    private claudeClient;
    private fileSystem;
    constructor(configManager: IConfigManager, auditLogger: IAuditLogger, claudeClient: IClaudeClient, fileSystem: IFileSystem);
    createConfigCommand(): ConfigCommand;
    createHelpCommand(): HelpCommand;
    createVersionCommand(): VersionCommand;
    createGenerateCommand(): GenerateCommand;
    createInitCommand(): InitCommand;
    createGenerateCommandWithOptions(options: PhoenixCodeLiteOptions): GenerateCommand;
}
//# sourceMappingURL=command-factory.d.ts.map