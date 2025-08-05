import { IConfigManager } from '../../cli/interfaces/config-manager';
import { CoreConfig } from '../../core/foundation';
export declare class MockConfigManager implements IConfigManager {
    private config;
    private calls;
    getConfig(): Promise<CoreConfig>;
    updateConfig(config: Partial<CoreConfig>): Promise<void>;
    validateConfig(config: CoreConfig): boolean;
    resetToDefaults(): Promise<void>;
    getCallHistory(): {
        method: string;
        args: any[];
    }[];
    setConfig(config: CoreConfig): void;
    clearCallHistory(): void;
}
//# sourceMappingURL=mock-config-manager.d.ts.map