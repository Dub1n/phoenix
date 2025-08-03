import { PhoenixCodeLiteOptions } from './args';
import { SessionContext } from './session';
export declare function enhancedGenerateCommand(options: PhoenixCodeLiteOptions): Promise<void>;
export declare function wizardCommand(): Promise<void>;
export declare function historyCommand(options: any): Promise<void>;
export declare function helpCommand(options: any): Promise<void>;
export declare function executeSessionAction(action: string, data: any, context: SessionContext): Promise<void>;
//# sourceMappingURL=enhanced-commands.d.ts.map