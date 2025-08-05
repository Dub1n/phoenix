import { IAuditLogger } from '../interfaces/audit-logger';
export declare class HelpCommand {
    private auditLogger;
    constructor(auditLogger: IAuditLogger);
    execute(args: string[]): Promise<void>;
}
//# sourceMappingURL=help-command.d.ts.map