/**---
 * title: [Interactive Session Manager - CLI Session Orchestrator]
 * tags: [CLI, Interface, Session-Management, User-Interaction]
 * provides: [InteractiveSession Class, Session Lifecycle, Main Menu Rendering, Command Dispatch Hooks]
 * requires: [CommandFactory, IAuditLogger, IConfigManager, CLI Framework]
 * description: [Manages persistent CLI sessions with menu navigation, command dispatch scaffolding, and context-aware user interactions.]
 * ---*/
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