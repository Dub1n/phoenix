/**
 * @fileoverview PTY Process Management
 * 
 * Core PTY process lifecycle management for terminal sessions.
 * Handles creation, cleanup, and error recovery for pseudoterminal processes.
 * 
 * @author VDL Vault
 * @since 2025-09-04
 */

// TODO: [TASK-MCP-001] Install node-pty with proper C++ build tools or use alternative PTY solution
// Currently mocking node-pty due to missing Visual Studio C++ build tools
// Requires: Visual Studio 2022 with "Desktop development with C++" workload
// Alternative: Use existing PTY MCP servers like pty-mcp-server or terminal-controller-mcp
import { spawn, IPty, SpawnOptions } from './node-pty-types';
import { v4 as uuidv4 } from 'uuid';
import { 
  CLISession, 
  SessionInfo, 
  MCPChannelError, 
  MCPChannelErrorType,
  CLIState,
  NavigationAction 
} from './types';

/**
 * PTY Process Manager
 * 
 * Manages pseudoterminal processes with session tracking, cleanup, and timeout handling.
 * Provides foundation for agent-CLI interaction through controlled PTY sessions.
 */
export class PTYManager {
  private sessions: Map<string, CLISession> = new Map();
  private readonly defaultTimeout = 30000; // 30 seconds
  private readonly cleanupInterval = 60000; // 1 minute
  private cleanupTimer?: NodeJS.Timeout;

  constructor() {
    // Start cleanup timer for idle sessions
    this.cleanupTimer = setInterval(() => this.cleanupIdleSessions(), this.cleanupInterval);
  }

  /**
   * Create new PTY session with specified command
   * 
   * @param sessionId - Unique session identifier
   * @param command - Command to execute (defaults to system shell)
   * @returns Session information for agents
   */
  createSession(sessionId: string, command?: string): SessionInfo {
    if (this.sessions.has(sessionId)) {
      throw new MCPChannelError(
        MCPChannelErrorType.INTERNAL_ERROR,
        `Session ${sessionId} already exists`
      );
    }

    try {
      // Determine shell command based on platform
      const shell = command || this.getDefaultShell();
      const args: string[] = command ? [] : this.getDefaultShellArgs();

      // Spawn PTY process
      const processHandle = spawn(shell, args, {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: process.cwd(),
        env: process.env
      });

      // Initialize session state
      const session: CLISession = {
        sessionId,
        processHandle,
        command: shell,
        lastActivity: new Date(),
        history: [],
        currentState: {
          isWaiting: true,
          currentScreen: '',
          availableActions: ['enter', 'escape', 'tab'] as NavigationAction[],
          context: {}
        }
      };

      // Set up PTY event handlers
      this.setupPTYHandlers(session);

      // Store session
      this.sessions.set(sessionId, session);

      return {
        sessionId,
        command: shell,
        started: session.lastActivity,
        status: 'active'
      };

    } catch (error) {
      throw new MCPChannelError(
        MCPChannelErrorType.PTY_SPAWN_FAILED,
        `Failed to create PTY session: ${error instanceof Error ? error.message : error}`,
        { sessionId, command, error }
      );
    }
  }

  /**
   * Get session by ID
   * 
   * @param sessionId - Session identifier
   * @returns CLI session or undefined if not found
   */
  getSession(sessionId: string): CLISession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Destroy PTY session and cleanup resources
   * 
   * @param sessionId - Session identifier
   * @returns True if session was destroyed, false if not found
   */
  destroySession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }

    try {
      // Kill PTY process
      if (!session.processHandle.killed) {
        session.processHandle.kill();
      }
      
      // Remove from tracking
      this.sessions.delete(sessionId);
      
      return true;
    } catch (error) {
      // Log error but still remove from tracking
      console.error(`Error destroying session ${sessionId}:`, error);
      this.sessions.delete(sessionId);
      return true;
    }
  }

  /**
   * Send text input to PTY session
   * 
   * @param sessionId - Session identifier
   * @param text - Text to send
   */
  sendText(sessionId: string, text: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new MCPChannelError(
        MCPChannelErrorType.SESSION_NOT_FOUND,
        `Session ${sessionId} not found`
      );
    }

    try {
      session.processHandle.write(text);
      session.lastActivity = new Date();
    } catch (error) {
      throw new MCPChannelError(
        MCPChannelErrorType.INTERNAL_ERROR,
        `Failed to send text to session ${sessionId}: ${error instanceof Error ? error.message : error}`,
        { sessionId, text, error }
      );
    }
  }

  /**
   * Send keystroke to PTY session
   * 
   * @param sessionId - Session identifier
   * @param keystroke - Keystroke string to send
   */
  sendKeystroke(sessionId: string, keystroke: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new MCPChannelError(
        MCPChannelErrorType.SESSION_NOT_FOUND,
        `Session ${sessionId} not found`
      );
    }

    try {
      session.processHandle.write(keystroke);
      session.lastActivity = new Date();
    } catch (error) {
      throw new MCPChannelError(
        MCPChannelErrorType.INTERNAL_ERROR,
        `Failed to send keystroke to session ${sessionId}: ${error instanceof Error ? error.message : error}`,
        { sessionId, keystroke, error }
      );
    }
  }

  /**
   * Get all active session IDs
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Cleanup idle sessions that exceed timeout
   */
  private cleanupIdleSessions(): void {
    const now = new Date().getTime();
    
    // Fixed MapIterator compatibility for older TypeScript targets using Array.from()
    for (const [sessionId, session] of Array.from(this.sessions.entries())) {
      const idleTime = now - session.lastActivity.getTime();
      
      if (idleTime > this.defaultTimeout) {
        console.log(`Cleaning up idle session: ${sessionId}`);
        this.destroySession(sessionId);
      }
    }
  }

  /**
   * Set up PTY process event handlers
   */
  private setupPTYHandlers(session: CLISession): void {
    const { processHandle } = session;

    // Handle PTY data output
    processHandle.onData((data: string) => {
      // Update current screen state
      session.currentState.currentScreen = data;
      session.lastActivity = new Date();
    });

    // Handle PTY process exit
    processHandle.onExit((exitCode, signal) => {
      console.log(`PTY session ${session.sessionId} exited with code ${exitCode}, signal ${signal}`);
      this.sessions.delete(session.sessionId);
    });

    // Handle PTY errors
    processHandle.onError((error) => {
      console.error(`PTY session ${session.sessionId} error:`, error);
      // Keep session alive for error recovery
    });
  }

  /**
   * Get default shell for current platform
   */
  private getDefaultShell(): string {
    const platform = process.platform;
    
    if (platform === 'win32') {
      return process.env.COMSPEC || 'cmd.exe';
    } else {
      return process.env.SHELL || '/bin/bash';
    }
  }

  /**
   * Get default shell arguments
   */
  private getDefaultShellArgs(): string[] {
    const platform = process.platform;
    
    if (platform === 'win32') {
      return [];
    } else {
      return ['-l']; // Login shell
    }
  }

  /**
   * Cleanup all sessions on shutdown
   */
  cleanup(): void {
    console.log(`Cleaning up ${this.sessions.size} PTY sessions...`);
    
    // Clear the cleanup timer to prevent process hanging
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    
    // Fixed Map.keys() MapIterator compatibility for cleanup operations
    for (const sessionId of Array.from(this.sessions.keys())) {
      this.destroySession(sessionId);
    }
    
    console.log('PTY Manager cleanup complete');
  }
}