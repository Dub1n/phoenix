/**
 * @fileoverview Dynamic Command Router - Generic Command Routing System
 * @author Claude Code Implementation  
 * @created 2025-08-29
 * 
 * Implements TASK-GENERIC-002: Dynamic Command Routing System
 * Routes commands to appropriate backends based on skin definitions instead of hardcoded patterns.
 * Replaces pattern matching (e.g., "if command starts with 'haruspex.'") with dynamic mapping.
 */

import { BackendConnection } from './connection-factory';
import { 
  UniversalSkinDefinition,
  createTemplumError, 
  isTemplumError 
} from '../types/templum-types';
import { EventDrivenComponent } from '../utils/event-bus-adapter';
import type { TypedEventMap } from '../utils/event-utils';

/**
 * Command routing information
 */
export interface CommandRoute {
  commandId: string;
  backend: BackendConnection;
  isAlias: boolean;
  originalCommandId?: string; // For aliases, points to the original command
}

/**
 * Routing statistics for monitoring
 */
export interface RoutingStatistics {
  totalCommands: number;
  totalAliases: number;
  backendCount: number;
  commandsByBackend: Record<string, number>;
  duplicateCommands: string[]; // Commands registered by multiple backends
}

interface DynamicCommandRouterEvents extends TypedEventMap {
  backendRegistered: (payload: {
    backendId: string;
    commandCount: number;
    aliasCount: number;
    commands: string[];
  }) => void;
  backendUnregistered: (payload: {
    backendId: string;
    commandsRemoved: number;
    aliasesRemoved: number;
  }) => void;
  cleared: () => void;
}

/**
 * Dynamic Command Router Implementation
 * 
 * Routes commands to appropriate backend services based on skin command definitions.
 * Eliminates hardcoded routing patterns by building routing tables from skin metadata.
 */
export class DynamicCommandRouter extends EventDrivenComponent<DynamicCommandRouterEvents> {
  private static instanceCounter = 0;
  private commandMap: Map<string, BackendConnection> = new Map();
  private aliasMap: Map<string, string> = new Map(); // alias -> original command
  private backendCommands: Map<string, Set<string>> = new Map(); // backend ID -> command IDs
  private duplicateCommands: Set<string> = new Set(); // Commands registered by multiple backends
  
  constructor() {
    super(`dynamic-command-router:${DynamicCommandRouter.instanceCounter++}`, 80);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // [TASK-NEW-064] Enhanced Command Router Event Handling - See templum-active-tasks.md
    // Implementation: Enhanced event handling for command router system
    // Phase: Integration
    // Implementation: Add event handlers for backend connection/disconnection lifecycle management
  }

  /**
   * Register a backend's commands from its skin definition
   * Builds command-to-backend mapping dynamically
   */
  registerBackend(backend: BackendConnection, skin: UniversalSkinDefinition): void {
    try {
      console.log(`[DynamicCommandRouter] Registering commands for backend: ${backend.id}`);
      
      if (!skin.commands) {
        console.log(`[DynamicCommandRouter] No commands found in skin for backend: ${backend.id}`);
        return;
      }

      const backendCommandSet = new Set<string>();
      let commandCount = 0;
      let aliasCount = 0;

      // Register commands from templum-types.ts structure: { [commandId: string]: CommandDefinition }
      for (const [commandId, _commandDef] of Object.entries(skin.commands)) {
        // Check for duplicate commands across backends
        if (this.commandMap.has(commandId)) {
          const existingBackend = this.commandMap.get(commandId)!;
          console.warn(`[DynamicCommandRouter] Command '${commandId}' already registered to ${existingBackend.id}, now registering to ${backend.id}`);
          this.duplicateCommands.add(commandId);
        }

        // Register the command
        this.commandMap.set(commandId, backend);
        backendCommandSet.add(commandId);
        commandCount++;

        console.log(`[DynamicCommandRouter] Registered command: ${commandId} -> ${backend.id}`);
      }

      // Handle shortcuts as aliases if they exist at root level
      if (skin.shortcuts) {
        for (const [shortcut, commandId] of Object.entries(skin.shortcuts)) {
          // Verify the target command exists in this backend's commands
          if (backendCommandSet.has(commandId)) {
            this.aliasMap.set(shortcut, commandId);
            this.commandMap.set(shortcut, backend);
            aliasCount++;
            
            console.log(`[DynamicCommandRouter] Registered shortcut: ${shortcut} -> ${commandId} (${backend.id})`);
          } else {
            console.warn(`[DynamicCommandRouter] Shortcut '${shortcut}' points to non-existent command '${commandId}' in backend ${backend.id}`);
          }
        }
      }

      // Store backend command mapping
      this.backendCommands.set(backend.id, backendCommandSet);

      console.log(`[DynamicCommandRouter] Registration complete for ${backend.id}: ${commandCount} commands, ${aliasCount} aliases`);
      
      // Emit event for monitoring/debugging
      this.emit('backendRegistered', {
        backendId: backend.id,
        commandCount,
        aliasCount,
        commands: Array.from(backendCommandSet)
      });

    } catch (error) {
      console.error(`[DynamicCommandRouter] Failed to register backend ${backend.id}:`, error);
      throw createTemplumError(
        `Failed to register backend commands: ${backend.id}`,
        'COMMAND_REGISTRATION_FAILED',
        'integration',
        { backendId: backend.id, error: isTemplumError(error) ? error : undefined }
      );
    }
  }

  /**
   * Unregister a backend and remove all its commands
   * Used when backends disconnect or become unavailable
   */
  unregisterBackend(backendId: string): void {
    try {
      console.log(`[DynamicCommandRouter] Unregistering backend: ${backendId}`);
      
      const commandsToRemove = this.backendCommands.get(backendId);
      if (!commandsToRemove) {
        console.log(`[DynamicCommandRouter] Backend ${backendId} was not registered`);
        return;
      }

      let removedCount = 0;
      
      // Remove all commands for this backend
      for (const commandId of Array.from(commandsToRemove)) {
        if (this.commandMap.has(commandId) && this.commandMap.get(commandId)!.id === backendId) {
          this.commandMap.delete(commandId);
          this.duplicateCommands.delete(commandId);
          removedCount++;
        }
      }

      // Remove aliases that point to this backend's commands
      const aliasesToRemove: string[] = [];
      for (const [alias, originalCommand] of Array.from(this.aliasMap.entries())) {
        if (commandsToRemove.has(originalCommand)) {
          aliasesToRemove.push(alias);
        }
      }
      
      for (const alias of aliasesToRemove) {
        this.aliasMap.delete(alias);
        this.commandMap.delete(alias);
      }

      // Clean up backend tracking
      this.backendCommands.delete(backendId);

      console.log(`[DynamicCommandRouter] Unregistered ${backendId}: ${removedCount} commands, ${aliasesToRemove.length} aliases removed`);
      
      this.emit('backendUnregistered', {
        backendId,
        commandsRemoved: removedCount,
        aliasesRemoved: aliasesToRemove.length
      });

    } catch (error) {
      console.error(`[DynamicCommandRouter] Failed to unregister backend ${backendId}:`, error);
      throw createTemplumError(
        `Failed to unregister backend: ${backendId}`,
        'COMMAND_UNREGISTRATION_FAILED',
        'integration',
        { backendId, error: isTemplumError(error) ? error : undefined }
      );
    }
  }

  /**
   * Get the backend connection for a specific command
   * Returns null if command is not registered
   */
  getBackendForCommand(commandId: string): BackendConnection | null {
    return this.commandMap.get(commandId) || null;
  }

  /**
   * Get routing information for a command (including alias resolution)
   */
  getCommandRoute(commandId: string): CommandRoute | null {
    const backend = this.commandMap.get(commandId);
    if (!backend) {
      return null;
    }

    const isAlias = this.aliasMap.has(commandId);
    const originalCommandId = isAlias ? this.aliasMap.get(commandId) : undefined;

    return {
      commandId,
      backend,
      isAlias,
      originalCommandId
    };
  }

  /**
   * Check if a command is registered
   */
  hasCommand(commandId: string): boolean {
    return this.commandMap.has(commandId);
  }

  /**
   * Get all commands registered to a specific backend
   */
  getBackendCommands(backendId: string): string[] {
    const commandSet = this.backendCommands.get(backendId);
    return commandSet ? Array.from(commandSet) : [];
  }

  /**
   * Get all registered command IDs
   */
  getAllCommands(): string[] {
    return Array.from(this.commandMap.keys());
  }

  /**
   * Get routing statistics for monitoring and debugging
   */
  getStatistics(): RoutingStatistics {
    const backendCounts: Record<string, number> = {};
    
    for (const [backendId, commandSet] of Array.from(this.backendCommands.entries())) {
      backendCounts[backendId] = commandSet.size;
    }

    return {
      totalCommands: this.commandMap.size,
      totalAliases: this.aliasMap.size,
      backendCount: this.backendCommands.size,
      commandsByBackend: backendCounts,
      duplicateCommands: Array.from(this.duplicateCommands)
    };
  }

  /**
   * Clear all command mappings
   * Used for testing or complete reset
   */
  clear(): void {
    console.log('[DynamicCommandRouter] Clearing all command mappings');
    
    this.commandMap.clear();
    this.aliasMap.clear();
    this.backendCommands.clear();
    this.duplicateCommands.clear();
    
    this.emit('cleared');
  }

  /**
   * Debug method to dump current routing state
   */
  dumpRoutingTable(): void {
    console.log('[DynamicCommandRouter] === Routing Table Dump ===');
    console.log('Commands:', Object.fromEntries(
      Array.from(this.commandMap.entries()).map(([cmd, backend]) => [cmd, backend.id])
    ));
    console.log('Aliases:', Object.fromEntries(this.aliasMap));
    console.log('Backend Commands:', Object.fromEntries(
      Array.from(this.backendCommands.entries()).map(([id, cmds]) => [id, Array.from(cmds)])
    ));
    console.log('Duplicate Commands:', Array.from(this.duplicateCommands));
    console.log('=== End Routing Table Dump ===');
  }
}
