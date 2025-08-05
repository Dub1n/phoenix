import { IAuditLogger } from '../interfaces/audit-logger';
export declare class VersionCommand {
    private auditLogger;
    constructor(auditLogger: IAuditLogger);
    execute(args: string[]): Promise<void>;
}
//# sourceMappingURL=version-command.d.ts.map