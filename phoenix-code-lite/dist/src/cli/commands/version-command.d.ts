/**---
 * title: [Version Command - CLI Command]
 * tags: [CLI, Command, Version]
 * provides: [VersionCommand]
 * requires: [IAuditLogger]
 * description: [Displays current version and development status.]
 * ---*/
import { IAuditLogger } from '../interfaces/audit-logger';
export declare class VersionCommand {
    private auditLogger;
    constructor(auditLogger: IAuditLogger);
    execute(args: string[]): Promise<void>;
}
//# sourceMappingURL=version-command.d.ts.map