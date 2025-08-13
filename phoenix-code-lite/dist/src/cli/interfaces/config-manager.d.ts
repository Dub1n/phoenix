/**---
 * title: [Config Manager Interface - Core Config Contract]
 * tags: [CLI, Interface, Types]
 * provides: [IConfigManager Interface]
 * requires: [CoreConfig]
 * description: [Defines the contract for managing core configuration, validation, and defaults handling.]
 * ---*/
import { CoreConfig } from '../../core/foundation';
export interface IConfigManager {
    getConfig(): Promise<CoreConfig>;
    updateConfig(config: Partial<CoreConfig>): Promise<void>;
    validateConfig(config: CoreConfig): boolean;
    resetToDefaults(): Promise<void>;
}
//# sourceMappingURL=config-manager.d.ts.map