/**
 * @fileoverview MCP Channel Type Definitions
 * 
 * Core type definitions for agent-CLI interaction via MCP channel approach.
 * Defines interfaces for PTY session management, CLI state tracking, and
 * agent-compatible navigation actions.
 * 
 * @author VDL Vault
 * @since 2025-09-04
 */

import { IPty } from './node-pty-types';

// Navigation actions agents can send
export type NavigationAction = 
  | "arrow-up" | "arrow-down" | "arrow-left" | "arrow-right"
  | "enter" | "escape" | "tab" 
  | "select-option" | "go-back" | "confirm" | "cancel";

// Structured CLI response for agents  
export interface CLIResponse {
  success: boolean;
  output: string;           // Clean terminal output (what user sees)
  parsedContent?: {         // Optional: structured interpretation
    type: 'menu' | 'prompt' | 'output' | 'error';
    options?: string[];     // Available menu options
    currentSelection?: number;
    promptText?: string;    // Question being asked
    isWaiting?: boolean;    // CLI waiting for input
  };
  rawOutput?: string;       // Raw terminal with ANSI codes (for debugging)
}

// CLI session state tracking
export interface CLIState {
  isWaiting: boolean;       // CLI waiting for input
  currentScreen: string;    // Current display content  
  availableActions: NavigationAction[];  // What agent can do now
  context: {
    inMenu?: boolean;
    menuOptions?: string[];
    currentSelection?: number;
    promptActive?: boolean;
    promptText?: string;
  };
}

// PTY session management
export interface CLISession {
  sessionId: string;
  processHandle: IPty;
  currentState: CLIState;
  history: CLIInteraction[];
  lastActivity: Date;
  command?: string;
}

// Session interaction tracking
export interface CLIInteraction {
  timestamp: Date;
  action: 'send-text' | 'navigate' | 'get-state';
  input?: string | NavigationAction;
  output?: CLIResponse;
}

// Session info for agents
export interface SessionInfo {
  sessionId: string;
  command: string;
  started: Date;
  status: 'active' | 'waiting' | 'processing' | 'error';
}

// Keystroke sequence for PTY interaction
export interface KeySequence {
  key?: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
}

// Parsed content structure for CLI output
export interface ParsedContent {
  type: 'menu' | 'prompt' | 'output' | 'error';
  options?: string[];
  currentSelection?: number;
  promptText?: string;
  isWaiting?: boolean;
}

// MCP tool parameter interfaces
export interface CreateSessionParams {
  sessionId: string;
  command?: string;
}

export interface SendTextParams {
  sessionId: string;
  text: string;
}

export interface NavigateParams {
  sessionId: string;
  action: NavigationAction;
}

export interface GetStateParams {
  sessionId: string;
}

export interface DestroySessionParams {
  sessionId: string;
}

// Error types for MCP channel operations
export enum MCPChannelErrorType {
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  PTY_SPAWN_FAILED = 'PTY_SPAWN_FAILED',
  INVALID_ACTION = 'INVALID_ACTION',
  TIMEOUT = 'TIMEOUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export class MCPChannelError extends Error {
  constructor(
    public type: MCPChannelErrorType,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'MCPChannelError';
  }
}