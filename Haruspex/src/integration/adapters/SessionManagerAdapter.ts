/**
 * Session Manager Adapter for PCL Integration
 * 
 * Provides adapter layer between Phoenix Code Lite SessionManager component
 * and Haruspex-native interfaces, ensuring session state integrity and consistency.
 * 
 * @implementation Phase 3 PCL Integration - Session Management
 * @created 2025-08-14
 */

import { IntegrationError } from './ProjectDiscoveryAdapter';

export interface SessionState {
  readonly id: string;
  readonly context: Record<string, unknown>;
}

export interface HaruspexSessionManager {
  getState(): Promise<SessionState>;
  updateContext(patch: Record<string, unknown>): Promise<SessionState>;
}

export interface PCLSessionManager {
  getState(): Promise<{ id: string; context: Record<string, unknown> }>;
  patchContext(patch: Record<string, unknown>): Promise<{ id: string; context: Record<string, unknown> }>;
}

/**
 * Adapter for Phoenix Code Lite SessionManager component
 * 
 * Harmonizes PCL's session management interface to Haruspex's unified API,
 * ensuring proper session state validation and error isolation.
 */
export class SessionManagerAdapter implements HaruspexSessionManager {
  constructor(private readonly pcl: PCLSessionManager) {
    if (!pcl) {
      throw new Error('PCL SessionManager instance is required');
    }
  }

  /**
   * Get current session state
   * 
   * @returns Promise resolving to current session state
   * @throws IntegrationError - When session state is unavailable or invalid
   */
  public async getState(): Promise<SessionState> {
    try {
      const result = await this.pcl.getState();
      
      // Validate PCL response structure
      if (!result || typeof result.id !== 'string' || !result.context) {
        throw new IntegrationError(
          'invalid_session_state',
          'PCL SessionManager returned invalid session state',
          { response: result }
        );
      }

      // Ensure session ID is non-empty
      if (result.id.length === 0) {
        throw new IntegrationError(
          'empty_session_id',
          'Session ID cannot be empty',
          { sessionId: result.id }
        );
      }

      // Return normalized result with deep clone to ensure immutability
      return {
        id: result.id,
        context: this.deepClone(result.context)
      };
    } catch (err) {
      if (err instanceof IntegrationError) {
        throw err;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new IntegrationError(
        'session_state_unavailable',
        'Failed to retrieve session state',
        { originalError: errorMessage }
      );
    }
  }

  /**
   * Update session context with provided patch
   * 
   * @param patch - Context properties to update
   * @returns Promise resolving to updated session state
   * @throws IntegrationError - When context update fails or patch is invalid
   */
  public async updateContext(patch: Record<string, unknown>): Promise<SessionState> {
    // Validate patch input
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
      throw new IntegrationError(
        'invalid_patch',
        'Context patch must be a non-null object',
        { patch }
      );
    }

    // Ensure patch is not empty
    if (Object.keys(patch).length === 0) {
      throw new IntegrationError(
        'empty_patch',
        'Context patch cannot be empty',
        { patch }
      );
    }

    try {
      // Create sanitized patch (remove undefined values to prevent corruption)
      const sanitizedPatch = this.sanitizePatch(patch);
      
      const result = await this.pcl.patchContext(sanitizedPatch);
      
      // Validate PCL response structure
      if (!result || typeof result.id !== 'string' || !result.context) {
        throw new IntegrationError(
          'invalid_session_response',
          'PCL SessionManager returned invalid response after context update',
          { response: result }
        );
      }

      // Return normalized result
      return {
        id: result.id,
        context: this.deepClone(result.context)
      };
    } catch (err) {
      if (err instanceof IntegrationError) {
        throw err;
      }

      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      throw new IntegrationError(
        'session_update_failed',
        'Failed to update session context',
        { 
          patch,
          originalError: errorMessage
        }
      );
    }
  }

  /**
   * Deep clone object to ensure immutability
   * 
   * @private
   * @param obj - Object to clone
   * @returns Deep cloned object
   */
  private deepClone(obj: Record<string, unknown>): Record<string, unknown> {
    try {
      return JSON.parse(JSON.stringify(obj));
    } catch {
      // If JSON serialization fails, return empty object as fallback
      return {};
    }
  }

  /**
   * Sanitize patch by removing undefined values and invalid entries
   * 
   * @private
   * @param patch - Patch to sanitize
   * @returns Sanitized patch
   */
  private sanitizePatch(patch: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(patch)) {
      // Skip undefined values and invalid keys
      if (value !== undefined && typeof key === 'string' && key.length > 0) {
        // Basic sanitization - could be extended for specific security requirements
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
}