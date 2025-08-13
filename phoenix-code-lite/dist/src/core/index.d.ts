/**---
 * title: [Core Infrastructure Exports - Index]
 * tags: [Core, Infrastructure, Exports, Validation]
 * provides: [Centralized Core Exports, CoreInfrastructure Utils, Types]
 * requires: [Core Modules: foundation, session-manager, mode-manager, config-manager, error-handler]
 * description: [Aggregates and re-exports Phase 1 core infrastructure modules and provides environment validation and system info utilities]
 * ---*/
export { CoreFoundation } from './foundation';
export { SessionManager } from './session-manager';
export { ModeManager } from './mode-manager';
export { ConfigManager, ConfigTemplates } from './config-manager';
export { ErrorHandler, ErrorSeverity, ErrorCategory } from './error-handler';
export type { CoreConfig } from './foundation';
export type { SessionState, ModeConfig } from '../types/workflow';
export type { ErrorInfo, ErrorStrategy, ErrorHandlingResult } from './error-handler';
export type { ConfigTemplate } from './config-manager';
/**
 * Core infrastructure validation and health checks
 */
export declare class CoreInfrastructure {
    static validateEnvironment(): Promise<{
        valid: boolean;
        issues: string[];
        recommendations: string[];
    }>;
    static getSystemInfo(): {
        nodeVersion: string;
        platform: string;
        architecture: string;
        memoryUsage: NodeJS.MemoryUsage;
        uptime: number;
        versions: NodeJS.ProcessVersions;
    };
}
//# sourceMappingURL=index.d.ts.map