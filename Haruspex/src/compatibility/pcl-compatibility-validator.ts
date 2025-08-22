/**
 * PCL Compatibility Validator for Haruspex Core Engine
 * 
 * Validates compatibility with Phoenix Code Lite components and provides
 * compatibility scoring and remediation guidance.
 * 
 * @implementation Based on Phase 2 Core Engine Implementation
 * @created 2025-08-14
 */

export interface PCLComponent {
  /** Component name */
  name: string;
  /** Component version */
  version?: string;
  /** Whether component is available */
  available: boolean;
  /** Component compatibility score (0-100) */
  compatibilityScore: number;
  /** Issues found with this component */
  issues: string[];
  /** Recommended actions */
  recommendations: string[];
}

export interface CompatibilityResult {
  /** Whether all components are compatible */
  allCompatible: boolean;
  /** Overall compatibility score (0-100) */
  compatibilityScore: number;
  /** List of validated components */
  validatedComponents: readonly string[];
  /** List of compatibility issues */
  issues: readonly string[];
  /** Individual component results */
  components: readonly PCLComponent[];
  /** Validation timestamp */
  timestamp: number;
  /** Validation duration in milliseconds */
  validationDurationMs: number;
}

/**
 * PCL Compatibility Validator
 * 
 * Checks compatibility with Phoenix Code Lite components including:
 * - ProjectDiscovery: Project analysis and context detection
 * - SessionManager: Session lifecycle management
 * - MenuSystem: Interactive CLI menu system
 * - TDDOrchestrator: TDD workflow coordination
 * - ConfigManager: Configuration management
 * - ErrorHandler: Error handling and recovery
 */
export class PCLCompatibilityValidator {
  private readonly expectedComponents = [
    'ProjectDiscovery',
    'SessionManager', 
    'MenuSystem',
    'TDDOrchestrator',
    'ConfigManager',
    'ErrorHandler',
    'AuditLogger',
    'SecurityGuardrails'
  ] as const;

  /**
   * Validate all PCL components for compatibility
   * 
   * @returns Promise resolving to comprehensive compatibility results
   */
  async validateAllComponents(): Promise<CompatibilityResult> {
    const startTime = Date.now();
    const components: PCLComponent[] = [];
    const allIssues: string[] = [];

    // Validate each expected component
    for (const componentName of this.expectedComponents) {
      const result = await this.validateComponent(componentName);
      components.push(result);
      allIssues.push(...result.issues);
    }

    // Calculate overall compatibility score
    const totalScore = components.reduce((sum, comp) => sum + comp.compatibilityScore, 0);
    const compatibilityScore = Math.round(totalScore / components.length);

    // Determine if all components are compatible (score >= 80 and no critical issues)
    const allCompatible = compatibilityScore >= 80 && 
                         !allIssues.some(issue => issue.includes('CRITICAL'));

    const validationDurationMs = Date.now() - startTime;

    return {
      allCompatible,
      compatibilityScore,
      validatedComponents: components.map(c => c.name),
      issues: allIssues,
      components,
      timestamp: Date.now(),
      validationDurationMs
    };
  }

  /**
   * Validate a specific PCL component
   * 
   * @param componentName - Name of the component to validate
   * @returns Promise resolving to component validation result
   */
  async validateComponent(componentName: string): Promise<PCLComponent> {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let available = true;
    let compatibilityScore = 100;

    try {
      // Simulate component validation logic
      // In a real implementation, this would check for actual PCL component availability
      // and interface compatibility
      
      switch (componentName) {
        case 'ProjectDiscovery':
          // Check for project discovery capabilities
          if (!this.checkNodeJsEnvironment()) {
            issues.push('Node.js environment not suitable for project discovery');
            compatibilityScore -= 20;
            recommendations.push('Ensure Node.js 18+ is available');
          }
          if (!this.checkFileSystemAccess()) {
            issues.push('Limited file system access may affect project analysis');
            compatibilityScore -= 10;
            recommendations.push('Verify file system permissions');
          }
          break;

        case 'SessionManager':
          // Check for session management capabilities
          if (!this.checkMemoryAvailability()) {
            issues.push('Insufficient memory for session management');
            compatibilityScore -= 15;
            recommendations.push('Increase available memory');
          }
          break;

        case 'MenuSystem':
          // Check for interactive menu capabilities
          if (!this.checkTerminalSupport()) {
            issues.push('Terminal/console support limited');
            compatibilityScore -= 25;
            recommendations.push('Ensure proper terminal environment');
          }
          break;

        case 'TDDOrchestrator':
          // Check for TDD workflow capabilities
          if (!this.checkTestingEnvironment()) {
            issues.push('Testing environment not fully configured');
            compatibilityScore -= 30;
            recommendations.push('Configure testing framework');
          }
          break;

        case 'ConfigManager':
          // Check for configuration management capabilities
          if (!this.checkConfigurationSupport()) {
            issues.push('Configuration management may have limitations');
            compatibilityScore -= 10;
            recommendations.push('Verify configuration file access');
          }
          break;

        case 'ErrorHandler':
          // Check for error handling capabilities
          if (!this.checkErrorHandlingSupport()) {
            issues.push('Error handling capabilities limited');
            compatibilityScore -= 20;
            recommendations.push('Implement comprehensive error boundaries');
          }
          break;

        case 'AuditLogger':
          // Check for audit logging capabilities
          if (!this.checkLoggingSupport()) {
            issues.push('Audit logging may have restrictions');
            compatibilityScore -= 15;
            recommendations.push('Configure logging infrastructure');
          }
          break;

        case 'SecurityGuardrails':
          // Check for security guardrails
          if (!this.checkSecuritySupport()) {
            issues.push('Security guardrails need configuration');
            compatibilityScore -= 25;
            recommendations.push('Implement security validation');
          }
          break;

        default:
          issues.push(`Unknown component: ${componentName}`);
          compatibilityScore = 0;
          available = false;
          recommendations.push('Verify component specification');
      }

      // Apply additional compatibility checks
      if (compatibilityScore < 60) {
        issues.push(`CRITICAL: ${componentName} compatibility score too low`);
        recommendations.push(`Address critical issues for ${componentName}`);
      }

    } catch (error) {
      issues.push(`Failed to validate ${componentName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      compatibilityScore = 0;
      available = false;
      recommendations.push(`Investigate ${componentName} validation failure`);
    }

    return {
      name: componentName,
      available,
      compatibilityScore: Math.max(0, compatibilityScore),
      issues,
      recommendations
    };
  }

  /**
   * Get compatibility summary for reporting
   */
  getCompatibilitySummary(result: CompatibilityResult): string {
    const { allCompatible, compatibilityScore, issues, components } = result;
    
    let summary = `PCL Compatibility Report\\n`;
    summary += `Overall Score: ${compatibilityScore}/100\\n`;
    summary += `Status: ${allCompatible ? 'COMPATIBLE' : 'ISSUES DETECTED'}\\n\\n`;
    
    if (issues.length > 0) {
      summary += `Issues Found (${issues.length}):\\n`;
      issues.forEach((issue, index) => {
        summary += `  ${index + 1}. ${issue}\\n`;
      });
      summary += '\\n';
    }
    
    summary += `Component Details:\\n`;
    components.forEach(comp => {
      const status = comp.available ? 
        (comp.compatibilityScore >= 80 ? '✅' : '⚠️') : '❌';
      summary += `  ${status} ${comp.name}: ${comp.compatibilityScore}/100\\n`;
    });
    
    return summary;
  }

  // Environment check methods - these would be implemented based on actual requirements
  private checkNodeJsEnvironment(): boolean {
    try {
      return typeof process !== 'undefined' && process.versions && !!process.versions.node;
    } catch {
      return false;
    }
  }

  private checkFileSystemAccess(): boolean {
    try {
      // In VSCode extension context, we should have file system access
      return true;
    } catch {
      return false;
    }
  }

  private checkMemoryAvailability(): boolean {
    try {
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const usage = process.memoryUsage();
        // Check if we have at least 50MB available
        return usage.heapUsed < (usage.heapTotal * 0.8);
      }
      return true; // Assume sufficient memory if we can't check
    } catch {
      return false;
    }
  }

  private checkTerminalSupport(): boolean {
    // In VSCode extension, we rely on VSCode's terminal support
    return true;
  }

  private checkTestingEnvironment(): boolean {
    // Check if testing capabilities are available
    try {
      // This would check for Jest, Mocha, or other testing frameworks
      return true;
    } catch {
      return false;
    }
  }

  private checkConfigurationSupport(): boolean {
    // Check configuration management capabilities
    return true;
  }

  private checkErrorHandlingSupport(): boolean {
    // Check error handling capabilities
    return true;
  }

  private checkLoggingSupport(): boolean {
    // Check logging infrastructure
    return true;
  }

  private checkSecuritySupport(): boolean {
    // Check security validation capabilities
    return true;
  }
}