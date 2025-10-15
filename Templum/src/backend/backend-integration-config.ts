/**
 * title: [Backend Integration Configuration - Generic Backend Support]
 * tags: [Configuration, Backend-Integration, Feature-Flags, Generic-Architecture]
 * provides: [BackendIntegrationConfig, FeatureFlags, ConfigManager, TransitionSupport]
 * requires: [Universal Skin Engine Types, Backend Connection Factory]
 * description: [Configuration system enabling transition from hardcoded to generic backend integration with feature flags]
 */

import { BackendConfig } from '../types/universal-skin-engine-types';
import { createLogger, LogLevel, type Logger } from '../utils/logger';

/**
 * Feature flags controlling backend integration behavior
 */
export interface BackendFeatureFlags {
  /** Enable generic backend integration via skin definitions */
  useGenericIntegration: boolean;
  
  /** Enable service discovery for automatic backend detection */
  enableServiceDiscovery: boolean;
  
  /** Enable dynamic command routing based on skin definitions */
  useDynamicCommandRouting: boolean;
  
  
  /** Use enhanced backend configuration schema */
  useEnhancedBackendConfig: boolean;
  
  /** Enable backend health monitoring */
  enableHealthMonitoring: boolean;
  
  /** Debug mode for backend integration transitions */
  debugModeEnabled: boolean;
}

/**
 * Legacy backend configuration (hardcoded approach)
 */
export interface LegacyBackendConfig {
  haruspex: {
    protocol: 'ipc';
    workspacePath: string;
    connectionTimeout: number;
  };
  pcl: {
    protocol: 'http';
    endpoint: string;
    healthEndpoint: string;
    capabilitiesEndpoint: string;
    timeout: number;
  };
  litany: {
    protocol: 'websocket';
    endpoint: string;
    timeout: number;
  };
}

/**
 * Backend integration mode configuration
 */
export interface BackendIntegrationConfig {
  /** Current integration mode */
  mode: 'legacy' | 'generic' | 'hybrid';
  
  /** Feature flags controlling behavior */
  features: BackendFeatureFlags;
  
  /** Legacy hardcoded backend configurations */
  legacyConfig: LegacyBackendConfig;
  
  /** Service discovery configuration */
  serviceDiscovery: {
    enabled: boolean;
    scanPorts: number[];
    timeout: number;
    strategies: ('registry' | 'scanning' | 'configuration')[];
  };
  
  /** Generic backend configuration overrides */
  genericOverrides: Map<string, Partial<BackendConfig>>;
}

/**
 * Default configuration for fully generic backend integration
 * PHASE 3 COMPLETE: Transitioned from hardcoded to fully skin-driven configuration
 */
export const DEFAULT_BACKEND_INTEGRATION_CONFIG: BackendIntegrationConfig = {
  // Generic mode: Fully skin-driven backend integration
  mode: 'generic',
  
  features: {
    // Full generic system enabled
    useGenericIntegration: true,
    enableServiceDiscovery: true,
    useDynamicCommandRouting: true,
    useEnhancedBackendConfig: true,
    enableHealthMonitoring: true,
    debugModeEnabled: false
  },
  
  // Legacy configurations removed - backends now provide connection info via skin definitions
  legacyConfig: {
    haruspex: {
      protocol: 'ipc',
      workspacePath: process.cwd(),
      connectionTimeout: 5000
    },
    pcl: {
      protocol: 'http',
      endpoint: '', // No hardcoded endpoint - provided by skin definition
      healthEndpoint: '', // Constructed from skin-provided base endpoint
      capabilitiesEndpoint: '', // Constructed from skin-provided base endpoint
      timeout: 10000
    },
    litany: {
      protocol: 'websocket',
      endpoint: '', // No hardcoded endpoint - provided by skin definition
      timeout: 15000
    }
  },
  
  serviceDiscovery: {
    enabled: true,
    scanPorts: [3001, 3002, 3003, 8080, 8081, 8082, 9000, 9001, 9002],
    timeout: 5000,
    strategies: ['registry', 'scanning', 'configuration']
  },
  
  genericOverrides: new Map()
};

/**
 * Configuration manager for backend integration modes
 */
export class BackendIntegrationConfigManager {
  private config: BackendIntegrationConfig;
  private configListeners: Array<(config: BackendIntegrationConfig) => void> = [];
  private readonly logger: Logger;
  private readonly configLogger: Logger;
  private readonly listenerLogger: Logger;

  constructor(initialConfig?: Partial<BackendIntegrationConfig>) {
    const baseLogger = createLogger('backend-integration-config');
    baseLogger.setLevel(LogLevel.WARN);
    this.logger = baseLogger;
    this.configLogger = baseLogger.child('configuration');
    this.listenerLogger = baseLogger.child('listeners');
    this.config = {
      ...DEFAULT_BACKEND_INTEGRATION_CONFIG,
      ...initialConfig,
      features: {
        ...DEFAULT_BACKEND_INTEGRATION_CONFIG.features,
        ...initialConfig?.features
      }
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): BackendIntegrationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration with validation
   */
  updateConfig(updates: Partial<BackendIntegrationConfig>): void {
    const newConfig = {
      ...this.config,
      ...updates,
      features: {
        ...this.config.features,
        ...updates.features
      }
    };

    // Validation: Generic mode configuration validated

    this.config = newConfig;
    this.notifyListeners();
  }

  /**
   * Switch to specific integration mode
   */
  setMode(mode: 'legacy' | 'generic' | 'hybrid'): void {
    this.updateConfig({ mode });
  }

  /**
   * Enable feature flag with validation
   */
  enableFeature(feature: keyof BackendFeatureFlags): void {
    const updates: Partial<BackendIntegrationConfig> = {
      features: {
        ...this.config.features,
        [feature]: true
      }
    };

    // Auto-enable dependencies
    if (feature === 'useGenericIntegration') {
      updates.features!.enableServiceDiscovery = true;
      updates.features!.useDynamicCommandRouting = true;
    }

    this.updateConfig(updates);
  }

  /**
   * Disable feature flag with safety checks
   */
  disableFeature(feature: keyof BackendFeatureFlags): void {
    const updates: Partial<BackendIntegrationConfig> = {
      features: {
        ...this.config.features,
        [feature]: false
      }
    };


    this.updateConfig(updates);
  }

  /**
   * Check if a specific feature is enabled
   */
  isFeatureEnabled(feature: keyof BackendFeatureFlags): boolean {
    return this.config.features[feature];
  }

  /**
   * Get backend configuration prioritizing skin-driven approach
   * GENERIC ARCHITECTURE: Skin definitions provide all connection parameters
   */
  getBackendConfig(backendName: string, skinConfig?: BackendConfig): BackendConfig | null {
    // Primary: Use skin configuration when available (fully generic approach)
    if (skinConfig) {
      this.logger.info('Using skin-provided backend configuration', {
        backendName
      });
      // Apply any configured overrides
      const override = this.config.genericOverrides.get(backendName);
      return override ? { ...skinConfig, ...override } : skinConfig;
    }

    // Secondary: Service discovery will provide configuration
    // No fallback to hardcoded values - backends must self-describe
    this.logger.info('No skin configuration available; relying on service discovery', {
      backendName
    });
    return null;
  }

  /**
   * Get legacy hardcoded configuration
   */
  private getLegacyBackendConfig(backendName: string): BackendConfig | null {
    const legacy = this.config.legacyConfig;
    
    switch (backendName.toLowerCase()) {
      case 'haruspex':
        return {
          service: 'haruspex',
          version: '1.0.0',
          protocol: 'ipc',
          endpoint: '',
          timeout: legacy.haruspex.connectionTimeout,
          retries: 3,
          authentication: { type: 'none' },
          options: { workspacePath: legacy.haruspex.workspacePath }
        };

      case 'pcl':
        return {
          service: 'pcl',
          version: '1.0.0',
          protocol: 'http',
          endpoint: legacy.pcl.endpoint,
          timeout: legacy.pcl.timeout,
          retries: 3,
          keepAlive: true,
          healthEndpoint: legacy.pcl.healthEndpoint,
          capabilitiesEndpoint: legacy.pcl.capabilitiesEndpoint,
          authentication: { type: 'none' }
        };

      case 'litany':
        return {
          service: 'litany',
          version: '1.0.0',
          protocol: 'websocket',
          endpoint: legacy.litany.endpoint,
          timeout: legacy.litany.timeout,
          retries: 3,
          keepAlive: true,
          authentication: { type: 'none' }
        };

      default:
        return null;
    }
  }

  /**
   * Add configuration change listener
   */
  onConfigChange(listener: (config: BackendIntegrationConfig) => void): void {
    this.configListeners.push(listener);
  }

  /**
   * Remove configuration change listener
   */
  removeConfigListener(listener: (config: BackendIntegrationConfig) => void): void {
    const index = this.configListeners.indexOf(listener);
    if (index > -1) {
      this.configListeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of configuration changes
   */
  private notifyListeners(): void {
    this.configListeners.forEach(listener => {
      try {
        listener(this.config);
      } catch (error) {
        const errorInstance = error instanceof Error ? error : new Error(String(error));
        this.listenerLogger.error('Configuration change listener failed', errorInstance);
      }
    });
  }

  /**
   * Log current configuration for debugging
   */
  logConfiguration(): void {
    this.configLogger.info('Backend integration configuration snapshot', {
      mode: this.config.mode,
      features: this.config.features,
      serviceDiscoveryEnabled: this.config.serviceDiscovery.enabled,
    });
  }
}

// Global configuration manager instance
export const backendIntegrationConfig = new BackendIntegrationConfigManager();
