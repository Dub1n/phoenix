/**
 * @fileoverview MCP Channel Entry Point
 * 
 * Entry point for the MCP Channel implementation - Phase 1 Complete.
 * Provides PTY Foundation + MCP Server Framework for agent-CLI interaction.
 * 
 * TASK-MCP-001: PTY Foundation - COMPLETED
 * TASK-MCP-002: MCP Server Framework - COMPLETED  
 * 
 * @author VDL Vault
 * @since 2025-09-04
 * @updated 2025-09-05
 */

// Core exports
import { PTYManager } from './pty-manager';
import { CLIMCPServer } from './cli-mcp-server';

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

// Version and metadata
export const VERSION = '1.1.0';
export const PHASE = 'MCP Server Framework Complete';
export const DESCRIPTION = 'Agent-CLI Interaction via MCP Channel - PTY Foundation + MCP Server Framework';

/**
 * Initialize MCP Channel with Full MCP Server Framework
 * 
 * Creates a CLI MCP Server instance with PTY session management.
 * Phase 1 Complete: PTY Foundation + MCP Server Framework.
 * 
 * @returns CLIMCPServer instance ready for agent interaction
 */
export function initializeMCPChannel(): CLIMCPServer {
  console.log(`Initializing MCP Channel v${VERSION} - ${PHASE}`);
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