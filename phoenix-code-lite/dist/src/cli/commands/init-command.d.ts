import { IConfigManager } from '../interfaces/config-manager';
import { IAuditLogger } from '../interfaces/audit-logger';
import { IFileSystem } from '../interfaces/file-system';
export declare class InitCommand {
    private configManager;
    private auditLogger;
    private fileSystem;
    constructor(configManager: IConfigManager, auditLogger: IAuditLogger, fileSystem: IFileSystem);
    execute(args: string[]): Promise<void>;
    private applyTemplate;
    private createProjectStructure;
    private initializeConfigFile;
    private parseArgs;
    private getStarterTemplate;
    private getEnterpriseTemplate;
    private getPerformanceTemplate;
}
//# sourceMappingURL=init-command.d.ts.map