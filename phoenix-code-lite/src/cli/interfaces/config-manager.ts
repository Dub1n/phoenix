import { CoreConfig } from '../../core/foundation';

export interface IConfigManager {
  getConfig(): Promise<CoreConfig>;
  updateConfig(config: Partial<CoreConfig>): Promise<void>;
  validateConfig(config: CoreConfig): boolean;
  resetToDefaults(): Promise<void>;
} 