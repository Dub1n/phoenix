/**---
 * title: [Help Command - CLI Command]
 * tags: [CLI, Command, Help]
 * provides: [HelpCommand]
 * requires: [IAuditLogger]
 * description: [Displays available commands and guidance for Phoenix Code Lite.]
 * ---*/
import { IAuditLogger } from '../interfaces/audit-logger';
export declare class HelpCommand {
    private auditLogger;
    constructor(auditLogger: IAuditLogger);
    execute(args: string[]): Promise<void>;
}
//# sourceMappingURL=help-command.d.ts.map