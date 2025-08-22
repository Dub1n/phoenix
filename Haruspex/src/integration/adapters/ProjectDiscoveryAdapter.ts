/**
 * Project Discovery Adapter for PCL Integration
 * 
 * Provides adapter layer between Phoenix Code Lite ProjectDiscovery component
 * and Haruspex-native interfaces, following Phase 2 error isolation patterns.
 * 
 * @implementation Phase 3 PCL Integration - Project Discovery
 * @created 2025-08-14
 */

export interface ProjectSummary {
  readonly files: readonly string[];
  readonly languages: readonly string[];
}

export interface HaruspexProjectDiscovery {
  scan(rootPath: string): Promise<ProjectSummary>;
}

export interface PCLProjectDiscovery {
  scanWorkspace(rootPath: string): Promise<{ files: string[]; languages: string[] }>;
}

export class IntegrationError extends Error {
  public readonly code: string;
  public readonly data?: Record<string, unknown>;
  
  constructor(code: string, message: string, data?: Record<string, unknown>) {
    super(message);
    this.name = 'IntegrationError';
    this.code = code;
    // ✅ Apply Phase 2 conditional property assignment pattern
    if (data !== undefined) {
      (this as any).data = data;
    }
  }
}

/**
 * Adapter for Phoenix Code Lite ProjectDiscovery component
 * 
 * Harmonizes PCL's project discovery interface to Haruspex's unified API,
 * applying Phase 2's proven error isolation and telemetry patterns.
 */
export class ProjectDiscoveryAdapter implements HaruspexProjectDiscovery {
  constructor(private readonly pcl: PCLProjectDiscovery) {
    if (!pcl) {
      throw new Error('PCL ProjectDiscovery instance is required');
    }
  }

  /**
   * Scan workspace and return normalized project summary
   * 
   * @param rootPath - Root path to scan
   * @returns Promise resolving to Haruspex-compatible project summary
   * @throws IntegrationError - When PCL integration fails
   */
  public async scan(rootPath: string): Promise<ProjectSummary> {
    if (!rootPath || typeof rootPath !== 'string') {
      throw new IntegrationError(
        'invalid_input',
        'Root path must be a non-empty string',
        { rootPath }
      );
    }

    try {
      const result = await this.pcl.scanWorkspace(rootPath);
      
      // Validate PCL response structure
      if (!result || !Array.isArray(result.files) || !Array.isArray(result.languages)) {
        throw new IntegrationError(
          'invalid_pcl_response',
          'PCL ProjectDiscovery returned invalid response structure',
          { response: result }
        );
      }

      // Return normalized result with readonly guarantees
      return {
        files: [...result.files], // Create immutable array
        languages: [...result.languages]
      };
    } catch (err) {
      // Re-throw IntegrationErrors as-is
      if (err instanceof IntegrationError) {
        throw err;
      }

      // Wrap other errors in IntegrationError
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new IntegrationError(
        'project_discovery_failed', 
        'Failed to scan workspace', 
        { 
          rootPath,
          originalError: errorMessage
        }
      );
    }
  }
}