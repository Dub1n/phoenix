import { IClaudeClient } from '../interfaces/claude-client';
import { IConfigManager } from '../interfaces/config-manager';
import { IAuditLogger } from '../interfaces/audit-logger';
import { IFileSystem } from '../interfaces/file-system';
import { PhoenixCodeLiteOptions } from '../args';
export declare class GenerateCommand {
    private claudeClient;
    private configManager;
    private auditLogger;
    private fileSystem;
    constructor(claudeClient: IClaudeClient, configManager: IConfigManager, auditLogger: IAuditLogger, fileSystem: IFileSystem);
    execute(options: PhoenixCodeLiteOptions): Promise<void>;
    private displayDetailedResults;
}
//# sourceMappingURL=generate-command.d.ts.map