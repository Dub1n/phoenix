import { CommandFactory } from '../factories/command-factory';
import { IAuditLogger } from '../interfaces/audit-logger';
import { IConfigManager } from '../interfaces/config-manager';
export declare class InteractiveSession {
    private commandFactory;
    private auditLogger;
    private configManager;
    constructor(commandFactory: CommandFactory, auditLogger: IAuditLogger, configManager: IConfigManager);
    start(): Promise<void>;
    private showMainMenu;
    private handleMenuSelection;
}
//# sourceMappingURL=interactive-session.d.ts.map