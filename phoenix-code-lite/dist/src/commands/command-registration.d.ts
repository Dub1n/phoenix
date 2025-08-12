/**
 * Command Registration System
 * Created: 2025-01-06-175700
 *
 * Central registration point for all command handlers.
 * Manages command lifecycle and provides categorization.
 */
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