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
export class CoreInfrastructure {
  public static async validateEnvironment(): Promise<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
      issues.push(`Node.js version ${nodeVersion} is below minimum required version 18`);
      recommendations.push('Upgrade to Node.js 18 or higher');
    }

    // Check memory availability
    const memoryUsage = process.memoryUsage();
    const availableMemory = memoryUsage.heapTotal;
    
    if (availableMemory < 100 * 1024 * 1024) { // Less than 100MB
      issues.push('Low memory availability detected');
      recommendations.push('Ensure at least 200MB of available memory');
    }

    // Check file system permissions
    try {
      const fs = await import('fs/promises');
      await fs.access('./', fs.constants.R_OK | fs.constants.W_OK);
    } catch (error) {
      issues.push('File system access permissions insufficient');
      recommendations.push('Ensure read/write permissions for current directory');
    }

    // Check for required dependencies
    try {
      await import('zod');
      await import('chalk');
      await import('uuid');
    } catch (error) {
      issues.push('Required dependencies missing');
      recommendations.push('Run npm install to install missing dependencies');
    }

    return {
      valid: issues.length === 0,
      issues,
      recommendations
    };
  }

  public static getSystemInfo(): {
    nodeVersion: string;
    platform: string;
    architecture: string;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    versions: NodeJS.ProcessVersions;
  } {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      versions: process.versions
    };
  }
}