/**---
 * title: [Command Registration - Unified Architecture]
 * tags: [Unified, Commands, Registration]
 * provides: [Command Registration, Registry Wiring]
 * requires: [core-commands]
 * description: [Registers core commands into the unified command registry for integrated CLI.]
 * ---*/
import { CommandRegistry } from '../types/command-execution';
/**
 * Register all core command handlers
 */
export declare function registerCoreCommands(commandRegistry: CommandRegistry): void;
/**
 * Get command handlers by category
 */
export declare function getCommandsByCategory(): Record<string, string[]>;
/**
 * Get all core command IDs
 */
export declare function getCoreCommandIds(): string[];
/**
 * Validate command registration
 */
export declare function validateCommandRegistration(commandRegistry: CommandRegistry): boolean;
//# sourceMappingURL=command-registration.d.ts.map