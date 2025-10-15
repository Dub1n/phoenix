/**
 * @fileoverview CLI MCP Server Implementation
 * 
 * Implements MCP server providing agent-CLI interaction through 5 essential tools.
 * Provides stateful CLI sessions with semantic navigation for agent compatibility.
 * 
 * TASK-MCP-002: MCP Server Framework Implementation
 * Dependencies: TASK-MCP-001 (PTY Foundation) - RESOLVED
 * 
 * @author VDL Vault
 * @since 2025-09-05
 */

import { AsyncUtils, type ManagedInterval } from '../../utils/async-utils';
import { PTYManager } from './pty-manager';
import { serialization } from '../../utils/serialization-utils';
import { emitSerializationWarnings } from '../../backend/backend-serialization-log';
import { createMCPDiagnostics } from './mcp-diagnostics';
import { 
  NavigationAction,
  CLIResponse,
  SessionInfo,
  CLIState,
  CreateSessionParams,
  SendTextParams,
  NavigateParams,
  GetStateParams,
  DestroySessionParams,
  MCPChannelError,
  MCPChannelErrorType
} from './types';

/**
 * MCP Tool Schemas for Agent Compatibility
 */
export const MCP_TOOL_SCHEMAS = {
  "cli-create-session": {
    name: "cli-create-session",
    description: "Create a new CLI session for agent interaction",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Unique session identifier"
        },
        command: {
          type: "string",
          description: "Optional command to execute (defaults to system shell)",
          optional: true
        }
      },
      required: ["sessionId"]
    }
  },
  
  "cli-navigate": {
    name: "cli-navigate",
    description: "Navigate CLI interface using semantic actions",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session identifier"
        },
        action: {
          type: "string",
          enum: ["arrow-up", "arrow-down", "arrow-left", "arrow-right", "enter", "escape", "tab", "select-option", "go-back", "confirm", "cancel"],
          description: "Navigation action to perform"
        }
      },
      required: ["sessionId", "action"]
    }
  },

  "cli-send-text": {
    name: "cli-send-text",
    description: "Send text input to CLI session",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session identifier"
        },
        text: {
          type: "string",
          description: "Text to send to CLI"
        }
      },
      required: ["sessionId", "text"]
    }
  },

  "cli-get-state": {
    name: "cli-get-state",
    description: "Get current CLI session state and available actions",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session identifier"
        }
      },
      required: ["sessionId"]
    }
  },

  "cli-destroy-session": {
    name: "cli-destroy-session",
    description: "Destroy CLI session and cleanup resources",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "Session identifier"
        }
      },
      required: ["sessionId"]
    }
  }
};

/**
 * MCP Request/Response Types
 */
export interface MCPRequest {
  id: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * CLI MCP Server
 * 
 * Implements MCP protocol for agent-CLI interaction with 5 essential tools.
 * Provides session management, navigation translation, and state tracking.
 * Enhanced with performance optimization for <100ms response times.
 */
export class CLIMCPServer {
  private ptyManager: PTYManager;
  private readonly tools: Record<string, MCPTool>;
  private performanceMetrics: {
    requestCount: number;
    totalResponseTime: number;
    lastOptimization: number;
  };
  private responseCache: Map<string, { result: any; timestamp: number }>;
  private readonly CACHE_TTL = 5000; // 5 seconds
  private readonly MAX_CACHE_SIZE = 100;
  private cacheCleanupInterval?: ManagedInterval;
  private readonly diagnostics = createMCPDiagnostics('cli-mcp-server');

  constructor() {
    this.ptyManager = new PTYManager();
    this.tools = MCP_TOOL_SCHEMAS;
    this.performanceMetrics = {
      requestCount: 0,
      totalResponseTime: 0,
      lastOptimization: Date.now()
    };
    this.responseCache = new Map();

    // Start cache cleanup timer
    this.cacheCleanupInterval = AsyncUtils.createInterval(
      () => this.cleanupCache(),
      30000,
      { unref: true }
    );
  }

  /**
   * Handle MCP request with proper routing and error handling
   * Enhanced with performance monitoring and caching
   */
  async handleMCPRequest(request: MCPRequest): Promise<MCPResponse> {
    const startTime = Date.now();
    
    try {
      // Validate request structure
      if (!request.id || !request.method) {
        throw new MCPChannelError(
          MCPChannelErrorType.INVALID_ACTION,
          "Invalid MCP request: missing id or method"
        );
      }

      // Check cache for cacheable requests
      const cacheKey = this.getCacheKey(request);
      if (cacheKey && this.responseCache.has(cacheKey)) {
        const cached = this.responseCache.get(cacheKey)!;
        if (Date.now() - cached.timestamp < this.CACHE_TTL) {
          // Cache hit - return immediately for optimal performance
          this.recordPerformance(Date.now() - startTime);
          return {
            id: request.id,
            result: cached.result
          };
        } else {
          // Cache expired
          this.responseCache.delete(cacheKey);
        }
      }

      // Route to appropriate tool handler
      let result: any;
      
      switch (request.method) {
        case 'tools/list':
          result = this.handleListTools();
          break;
          
        case 'tools/call':
          result = await this.handleToolCall(request.params);
          break;
          
        default:
          throw new MCPChannelError(
            MCPChannelErrorType.INVALID_ACTION,
            `Unknown MCP method: ${request.method}`
          );
      }

      // Cache the result if cacheable
      if (cacheKey) {
        this.cacheResult(cacheKey, result);
      }

      // Record performance metrics
      this.recordPerformance(Date.now() - startTime);

      return {
        id: request.id,
        result
      };

    } catch (error) {
      // Record performance even for errors
      this.recordPerformance(Date.now() - startTime);
      const errorDetails = error instanceof MCPChannelError ? error.details : undefined;
      const templumError = this.diagnostics.error('handleMCPRequest failure', error, {
        requestId: request.id,
        method: request.method,
        errorDetails
      });

      return {
        id: request.id,
        error: {
          code: this.getErrorCode(error),
          message: templumError.message,
          data: {
            templumError,
            details: errorDetails
          }
        }
      };
    }
  }

  /**
   * Handle tools/list request - return available MCP tools
   */
  private handleListTools(): { tools: MCPTool[] } {
    return {
      tools: Object.values(this.tools)
    };
  }

  /**
   * Handle tools/call request - execute specific tool
   */
  private async handleToolCall(params: any): Promise<any> {
    if (!params || !params.name) {
      throw new MCPChannelError(
        MCPChannelErrorType.INVALID_ACTION,
        "Tool call missing name parameter"
      );
    }

    const toolName = params.name;
    const toolParams = params.arguments || {};

    // Validate tool exists
    if (!this.tools[toolName]) {
      throw new MCPChannelError(
        MCPChannelErrorType.INVALID_ACTION,
        `Unknown tool: ${toolName}`
      );
    }

    // Validate tool parameters
    this.validateToolParameters(toolName, toolParams);

    // Route to specific tool handler
    switch (toolName) {
      case 'cli-create-session':
        return await this.handleCreateSession(toolParams as CreateSessionParams);
        
      case 'cli-navigate':
        return await this.handleNavigate(toolParams as NavigateParams);
        
      case 'cli-send-text':
        return await this.handleSendText(toolParams as SendTextParams);
        
      case 'cli-get-state':
        return await this.handleGetState(toolParams as GetStateParams);
        
      case 'cli-destroy-session':
        return await this.handleDestroySession(toolParams as DestroySessionParams);
        
      default:
        throw new MCPChannelError(
          MCPChannelErrorType.INVALID_ACTION,
          `Tool handler not implemented: ${toolName}`
        );
    }
  }

  /**
   * MCP Tool: cli-create-session
   */
  private async handleCreateSession(params: CreateSessionParams): Promise<SessionInfo> {
    try {
      return this.ptyManager.createSession(params.sessionId, params.command);
    } catch (error) {
      if (error instanceof MCPChannelError) {
        throw error;
      }
      this.diagnostics.error('Failed to create session', error, {
        sessionId: params.sessionId
      });
      throw new MCPChannelError(
        MCPChannelErrorType.INTERNAL_ERROR,
        `Failed to create session: ${error instanceof Error ? error.message : error}`,
        { params, error }
      );
    }
  }

  /**
   * MCP Tool: cli-navigate
   */
  private async handleNavigate(params: NavigateParams): Promise<CLIResponse> {
    try {
      // Validate session exists
      const session = this.ptyManager.getSession(params.sessionId);
      if (!session) {
        throw new MCPChannelError(
          MCPChannelErrorType.SESSION_NOT_FOUND,
          `Session not found: ${params.sessionId}`
        );
      }

      // Translate navigation action to keystroke
      const keystroke = this.translateNavigationAction(params.action);
      
      // Send keystroke to PTY session
      this.ptyManager.sendKeystroke(params.sessionId, keystroke);
      
      // TODO: [TASK-MCP-003] Add real output processing when Agent Translation Layer is implemented
      // For now, return basic response structure
      return {
        success: true,
        output: `Navigation: ${params.action}`,
        parsedContent: {
          type: 'output',
          isWaiting: false
        }
      };

    } catch (error) {
      if (error instanceof MCPChannelError) {
        throw error;
      }
      this.diagnostics.error('Navigation failed', error, {
        sessionId: params.sessionId,
        action: params.action
      });
      throw new MCPChannelError(
        MCPChannelErrorType.INTERNAL_ERROR,
        `Navigation failed: ${error instanceof Error ? error.message : error}`,
        { params, error }
      );
    }
  }

  /**
   * MCP Tool: cli-send-text
   */
  private async handleSendText(params: SendTextParams): Promise<CLIResponse> {
    try {
      // Validate session exists
      const session = this.ptyManager.getSession(params.sessionId);
      if (!session) {
        throw new MCPChannelError(
          MCPChannelErrorType.SESSION_NOT_FOUND,
          `Session not found: ${params.sessionId}`
        );
      }

      // Send text to PTY session
      this.ptyManager.sendText(params.sessionId, params.text);

      // TODO: [TASK-MCP-003] Add real output processing when Agent Translation Layer is implemented
      // For now, return basic response structure
      return {
        success: true,
        output: `Sent: ${params.text}`,
        parsedContent: {
          type: 'output',
          isWaiting: false
        }
      };

    } catch (error) {
      if (error instanceof MCPChannelError) {
        throw error;
      }
      this.diagnostics.error('Send text failed', error, {
        sessionId: params.sessionId
      });
      throw new MCPChannelError(
        MCPChannelErrorType.INTERNAL_ERROR,
        `Send text failed: ${error instanceof Error ? error.message : error}`,
        { params, error }
      );
    }
  }

  /**
   * MCP Tool: cli-get-state
   */
  private async handleGetState(params: GetStateParams): Promise<CLIState> {
    try {
      // Validate session exists
      const session = this.ptyManager.getSession(params.sessionId);
      if (!session) {
        throw new MCPChannelError(
          MCPChannelErrorType.SESSION_NOT_FOUND,
          `Session not found: ${params.sessionId}`
        );
      }

      // Return current session state
      return session.currentState;

    } catch (error) {
      if (error instanceof MCPChannelError) {
        throw error;
      }
      this.diagnostics.error('Get state failed', error, {
        sessionId: params.sessionId
      });
      throw new MCPChannelError(
        MCPChannelErrorType.INTERNAL_ERROR,
        `Get state failed: ${error instanceof Error ? error.message : error}`,
        { params, error }
      );
    }
  }

  /**
   * MCP Tool: cli-destroy-session
   */
  private async handleDestroySession(params: DestroySessionParams): Promise<{ success: boolean }> {
    try {
      const result = this.ptyManager.destroySession(params.sessionId);
      return { success: result };

    } catch (error) {
      this.diagnostics.error('Destroy session failed', error, {
        sessionId: params.sessionId
      });
      throw new MCPChannelError(
        MCPChannelErrorType.INTERNAL_ERROR,
        `Destroy session failed: ${error instanceof Error ? error.message : error}`,
        { params, error }
      );
    }
  }

  /**
   * Translate agent navigation action to PTY keystroke
   */
  private translateNavigationAction(action: NavigationAction): string {
    switch (action) {
      case 'arrow-up': return '\u001b[A';      // Up arrow
      case 'arrow-down': return '\u001b[B';    // Down arrow
      case 'arrow-right': return '\u001b[C';   // Right arrow  
      case 'arrow-left': return '\u001b[D';    // Left arrow
      case 'enter':
      case 'select-option':
      case 'confirm': return '\r';             // Enter key
      case 'escape':
      case 'go-back':
      case 'cancel': return '\u001b';          // Escape key
      case 'tab': return '\t';                 // Tab key
      default:
        throw new MCPChannelError(
          MCPChannelErrorType.INVALID_ACTION,
          `Unknown navigation action: ${action}`
        );
    }
  }

  /**
   * Validate MCP tool parameters against schema
   */
  private validateToolParameters(toolName: string, params: any): void {
    const tool = this.tools[toolName];
    const schema = tool.inputSchema;

    // Check required parameters
    for (const requiredParam of schema.required) {
      if (!(requiredParam in params)) {
        throw new MCPChannelError(
          MCPChannelErrorType.INVALID_ACTION,
          `Missing required parameter: ${requiredParam}`
        );
      }
    }

    // Validate parameter types and constraints
    for (const [paramName, paramValue] of Object.entries(params)) {
      const paramSchema = schema.properties[paramName];
      if (!paramSchema) {
        throw new MCPChannelError(
          MCPChannelErrorType.INVALID_ACTION,
          `Unknown parameter: ${paramName}`
        );
      }

      // Validate enum constraints (like NavigationAction)
      if (paramSchema.enum && !paramSchema.enum.includes(paramValue)) {
        throw new MCPChannelError(
          MCPChannelErrorType.INVALID_ACTION,
          `Invalid value for ${paramName}: ${paramValue}. Must be one of: ${paramSchema.enum.join(', ')}`
        );
      }

      // Basic type validation
      if (paramSchema.type === 'string' && typeof paramValue !== 'string') {
        throw new MCPChannelError(
          MCPChannelErrorType.INVALID_ACTION,
          `Parameter ${paramName} must be a string`
        );
      }
    }
  }

  /**
   * Convert error to MCP error code
   */
  private getErrorCode(error: any): number {
    if (error instanceof MCPChannelError) {
      switch (error.type) {
        case MCPChannelErrorType.SESSION_NOT_FOUND: return -32001;
        case MCPChannelErrorType.PTY_SPAWN_FAILED: return -32002;
        case MCPChannelErrorType.INVALID_ACTION: return -32003;
        case MCPChannelErrorType.TIMEOUT: return -32004;
        case MCPChannelErrorType.INTERNAL_ERROR: return -32000;
        default: return -32000;
      }
    }
    return -32000; // Internal error
  }

  /**
   * Get available MCP tools
   */
  getAvailableTools(): string[] {
    return Object.keys(this.tools);
  }

  /**
   * Cleanup all resources
   */
  cleanup(): void {
    this.ptyManager.cleanup();
    this.responseCache.clear();
    this.cacheCleanupInterval?.stop();
    this.cacheCleanupInterval = undefined;
  }

  /**
   * Performance optimization methods
   */

  /**
   * Generate cache key for request
   */
  private getCacheKey(request: MCPRequest): string | null {
    // Only cache tools/list requests as they don't change frequently
    if (request.method === 'tools/list') {
      return 'tools/list';
    }
    
    // Don't cache tool calls as they may have different results
    return null;
  }

  /**
   * Cache result for future requests
   */
  private cacheResult(key: string, result: any): void {
    // Implement LRU-style cache size management
    if (this.responseCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.responseCache.keys().next().value;
      if (oldestKey) {
        this.responseCache.delete(oldestKey);
      }
    }

    this.responseCache.set(key, {
      result: this.cloneWithSerialization(result, 'mcp:cli-server:cache-result'),
      timestamp: Date.now()
    });
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.responseCache.forEach((entry, key) => {
      if (now - entry.timestamp > this.CACHE_TTL) {
        expiredKeys.push(key);
      }
    });

    for (const key of expiredKeys) {
      this.responseCache.delete(key);
    }

    if (expiredKeys.length > 0) {
      this.diagnostics.info('Cleaned up expired cache entries', {
        expiredCacheEntries: expiredKeys.length
      });
    }
  }

  private cloneWithSerialization<T>(value: T, context: string): T {
    const serializeBuilder = serialization.json(value).context(context).fallback('{}');
    const serializeOutcome = serializeBuilder.stringify();
    emitSerializationWarnings(context, serializeOutcome);

    if (!serializeOutcome.value) {
      return value;
    }

    const parseBuilder = serialization
      .fromJson<T>(serializeOutcome.value)
      .context(`${context}:parse`)
      .fallback(value);

    const parseOutcome = parseBuilder.parse();
    emitSerializationWarnings(`${context}:parse`, parseOutcome);

    if (!parseOutcome.ok || parseOutcome.value === undefined) {
      return value;
    }

    return parseOutcome.value;
  }

  /**
   * Record performance metrics
   */
  private recordPerformance(responseTime: number): void {
    this.performanceMetrics.requestCount++;
    this.performanceMetrics.totalResponseTime += responseTime;

    // Log slow requests for monitoring
    if (responseTime > 100) {
      this.diagnostics.warn('Slow request detected', {
        responseTimeMs: responseTime
      });
    }

    // Periodic performance reporting
    if (this.performanceMetrics.requestCount % 100 === 0) {
      const avgResponse = this.performanceMetrics.totalResponseTime / this.performanceMetrics.requestCount;
      this.diagnostics.info('Processed requests summary', {
        requestCount: this.performanceMetrics.requestCount,
        averageResponseMs: Number(avgResponse.toFixed(2))
      });
    }
  }

  /**
   * Get performance metrics for health monitoring
   */
  getPerformanceMetrics(): { requestCount: number; averageResponseTime: number } {
    return {
      requestCount: this.performanceMetrics.requestCount,
      averageResponseTime: this.performanceMetrics.requestCount > 0 
        ? this.performanceMetrics.totalResponseTime / this.performanceMetrics.requestCount 
        : 0
    };
  }
}
