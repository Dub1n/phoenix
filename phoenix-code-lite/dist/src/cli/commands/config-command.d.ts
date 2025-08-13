/**---
 * title: [Config Command - CLI Command]
 * tags: [CLI, Command, Configuration]
 * provides: [ConfigCommand]
 * requires: [IConfigManager, IAuditLogger, ConfigFormatter, InteractivePrompts]
 * description: [Manages Phoenix Code Lite configuration operations including show, edit, adjust, use, and template application.]
 * ---*/
import { IConfigManager } from '../interfaces/config-manager';
import { IAuditLogger } from '../interfaces/audit-logger';
export declare class ConfigCommand {
    private configManager;
    private auditLogger;
    constructor(configManager: IConfigManager, auditLogger: IAuditLogger);
    execute(args: string[]): Promise<void>;
    private showConfig;
    private handleInteractiveOperations;
    private applyTemplate;
    private resetConfig;
    private showHelp;
    private parseArgs;
    private adjustTemplate;
    private addTemplate;
}
//# sourceMappingURL=config-command.d.ts.map