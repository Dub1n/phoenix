import { ModeConfig } from '../types/workflow';
export interface DualModeCapabilities {
    standalone: {
        cliInterface: boolean;
        localExecution: boolean;
        fileSystemAccess: boolean;
        configurationManagement: boolean;
        auditLogging: boolean;
    };
    integrated: {
        claudeCodeSDK: boolean;
        seamlessIntegration: boolean;
        contextSharing: boolean;
        workflowOrchestration: boolean;
        performanceOptimization: boolean;
    };
}
export declare class ModeManager {
    private currentMode;
    private config;
    private capabilities;
    private auditLogger;
    constructor(initialMode?: 'standalone' | 'integrated');
    /**
     * Get default configuration for specified mode
     */
    private getDefaultConfig;
    /**
     * Initialize capabilities based on current mode
     */
    private initializeCapabilities;
    /**
     * Switch between standalone and integrated modes
     */
    switchMode(newMode: 'standalone' | 'integrated'): Promise<boolean>;
    /**
     * Get current mode and configuration
     */
    getCurrentMode(): {
        mode: 'standalone' | 'integrated';
        config: ModeConfig;
        capabilities: any;
    };
    /**
     * Check if specific feature is enabled in current mode
     */
    isFeatureEnabled(feature: keyof ModeConfig['features']): boolean;
    /**
     * Check if specific capability is available in current mode
     */
    hasCapability(capability: string): boolean;
    /**
     * Get mode-specific limits
     */
    getLimits(): ModeConfig['limits'];
    /**
     * Update configuration for current mode
     */
    updateConfig(updates: Partial<ModeConfig>): Promise<boolean>;
    /**
     * Get mode compatibility information
     */
    getModeCompatibility(): {
        currentMode: string;
        availableModes: string[];
        switchingAllowed: boolean;
        requirements: {
            standalone: string[];
            integrated: string[];
        };
    };
    /**
     * Validate mode transition requirements
     */
    private validateModeTransition;
    /**
     * Check if API key is configured
     */
    private hasApiKeyConfigured;
    /**
     * Get mode-specific execution context
     */
    getExecutionContext(): {
        mode: 'standalone' | 'integrated';
        features: Record<string, boolean>;
        capabilities: Record<string, boolean>;
        limits: Record<string, number>;
        runtime: {
            environment: string;
            nodeVersion: string;
            platform: string;
        };
    };
    /**
     * Generate mode report
     */
    generateModeReport(): {
        summary: string;
        details: {
            currentMode: string;
            uptime: number;
            featuresEnabled: string[];
            capabilitiesAvailable: string[];
            performanceMetrics: {
                memoryUsage: number;
                sessionCount: number;
            };
        };
    };
    /**
     * Log mode initialization
     */
    private logModeInitialization;
    /**
     * Graceful shutdown
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=mode-manager.d.ts.map