import { IConfigManager } from '../interfaces/config-manager';
import { ConfigManager } from '../../core/config-manager';
import { CoreConfig } from '../../core/foundation';
export declare class ConfigManagerAdapter implements IConfigManager {
    private configManager;
    constructor(configManager: ConfigManager);
    getConfig(): Promise<CoreConfig>;
    updateConfig(config: Partial<CoreConfig>): Promise<void>;
    validateConfig(config: CoreConfig): boolean;
    resetToDefaults(): Promise<void>;
}
//# sourceMappingURL=config-manager-adapter.d.ts.map