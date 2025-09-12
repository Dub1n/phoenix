/**
 * @fileoverview MCP Channel Entry Point
 * 
 * Entry point for the MCP Channel implementation with Service Discovery Integration.
 * Provides PTY Foundation + MCP Server Framework + Service Discovery Integration.
 * 
 * TASK-MCP-001: PTY Foundation - COMPLETED
 * TASK-MCP-002: MCP Server Framework - COMPLETED  
 * Service Discovery Integration - Enhanced MCP channel with service registration and health monitoring
 * 
 * @author VDL Vault
 * @since 2025-09-04
 * @updated 2025-09-11 - Service Discovery Integration
 */

// Core exports
import { PTYManager } from './pty-manager';
import { CLIMCPServer } from './cli-mcp-server';
import { MCPLifecycleCoordinator, LifecycleOptions, createMCPLifecycleCoordinator } from './lifecycle-coordinator';

export { PTYManager, CLIMCPServer };
export { 
  NavigationAction,
  CLIResponse,
  CLIState,
  CLISession,
  SessionInfo,
  KeySequence,
  ParsedContent,
  CreateSessionParams,
  SendTextParams,
  NavigateParams,
  GetStateParams,
  DestroySessionParams,
  MCPChannelError,
  MCPChannelErrorType
} from './types';

// MCP Server exports
export { 
  MCP_TOOL_SCHEMAS,
  MCPRequest,
  MCPResponse,
  MCPTool
} from './cli-mcp-server';

// Service Discovery Integration exports
export { 
  MCPServiceRegistration,
  MCPServiceConfig,
  ServiceRegistrationOptions,
  createMCPServiceRegistration
} from './service-registration';

export {
  MCPHealthMonitor,
  HealthStatus,
  HealthCheckResult,
  PerformanceMetrics,
  createMCPHealthMonitor
} from './health-monitor';

export {
  MCPLifecycleCoordinator,
  LifecycleState,
  LifecycleOptions,
  createMCPLifecycleCoordinator,
  createMCPLifecycleCoordinatorManual
} from './lifecycle-coordinator';

// Version and metadata
export const VERSION = '1.2.0';
export const PHASE = 'Service Discovery Integration Complete';
export const DESCRIPTION = 'Agent-CLI Interaction via MCP Channel with Templum Service Discovery Integration';

/**
 * Initialize MCP Channel with Service Discovery Integration
 * 
 * Creates a lifecycle coordinator that manages MCP server, PTY manager,
 * service registration, and health monitoring as an integrated system.
 * 
 * @param options - Lifecycle configuration options
 * @returns MCPLifecycleCoordinator instance ready for integrated operation
 */
export async function initializeMCPChannelWithServiceDiscovery(
  options?: LifecycleOptions
): Promise<MCPLifecycleCoordinator> {
  console.log(`Initializing MCP Channel v${VERSION} - ${PHASE}`);
  return await createMCPLifecycleCoordinator(options);
}

/**
 * Initialize MCP Channel with Full MCP Server Framework (Legacy)
 * 
 * Creates a CLI MCP Server instance with PTY session management.
 * For backward compatibility - consider using initializeMCPChannelWithServiceDiscovery.
 * 
 * @returns CLIMCPServer instance ready for agent interaction
 */
export function initializeMCPChannel(): CLIMCPServer {
  console.log(`Initializing MCP Channel v${VERSION} - ${PHASE} (Legacy Mode)`);
  return new CLIMCPServer();
}

/**
 * Initialize PTY-only mode for advanced use cases
 * 
 * @returns PTYManager instance for direct PTY management
 */
export function initializePTYOnly(): PTYManager {
  console.log(`Initializing PTY Manager only - ${VERSION}`);
  return new PTYManager();
}

/**
 * Graceful shutdown handler for MCP Server
 * 
 * @param mcpServer - CLI MCP Server instance to cleanup
 */
export function shutdownMCPChannel(mcpServer: CLIMCPServer): void {
  console.log('Shutting down MCP Channel...');
  mcpServer.cleanup();
  console.log('MCP Channel shutdown complete');
}

/**
 * Graceful shutdown handler for PTY-only mode
 * 
 * @param ptyManager - PTY Manager instance to cleanup  
 */
export function shutdownPTYManager(ptyManager: PTYManager): void {
  console.log('Shutting down PTY Manager...');
  ptyManager.cleanup();
  console.log('PTY Manager shutdown complete');
}