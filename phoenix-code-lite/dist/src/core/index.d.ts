/**
 * Phase 1 Core Infrastructure Exports
 *
 * This module provides centralized access to all Phase 1 core components
 * including session management, mode management, configuration, and error handling.
 */
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