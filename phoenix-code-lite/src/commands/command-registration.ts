/**---
 * title: [Command Registration - Unified Architecture]
 * tags: [Unified, Commands, Registration]
 * provides: [Command Registration, Registry Wiring]
 * requires: [core-commands]
 * description: [Registers core commands into the unified command registry for integrated CLI.]
 * ---*/

import { CommandRegistry } from '../types/command-execution';
import { 
  // Configuration Commands
  ConfigShowCommand,
  ConfigEditCommand,
  ConfigTemplatesCommand,
  ConfigFrameworkCommand,
  ConfigQualityCommand,
  ConfigSecurityCommand,
  
  // Template Commands
  TemplatesListCommand,
  TemplatesUseCommand,
  TemplatesPreviewCommand,
  TemplatesCreateCommand,
  TemplatesEditCommand,
  TemplatesResetCommand,
  
  // Generation Commands
  GenerateTaskCommand,
  GenerateComponentCommand,
  GenerateApiCommand,
  GenerateTestCommand,
  
  // Advanced Commands
  AdvancedLanguageCommand,
  AdvancedAgentsCommand,
  AdvancedLoggingCommand,
  AdvancedMetricsCommand,
  AdvancedDebugCommand,
  
  // Settings Commands (User-Requested Feature)
  SettingsShowCommand,
  SettingsModeCommand,
  SettingsResetCommand,
  SettingsPreferencesCommand
} from './core-commands';

/**
 * Register all core command handlers
 */
export function registerCoreCommands(commandRegistry: CommandRegistry): void {
  try {
    // Configuration Commands
    commandRegistry.register(ConfigShowCommand);
    commandRegistry.register(ConfigEditCommand);
    commandRegistry.register(ConfigTemplatesCommand);
    commandRegistry.register(ConfigFrameworkCommand);
    commandRegistry.register(ConfigQualityCommand);
    commandRegistry.register(ConfigSecurityCommand);
    
    // Template Commands
    commandRegistry.register(TemplatesListCommand);
    commandRegistry.register(TemplatesUseCommand);
    commandRegistry.register(TemplatesPreviewCommand);
    commandRegistry.register(TemplatesCreateCommand);
    commandRegistry.register(TemplatesEditCommand);
    commandRegistry.register(TemplatesResetCommand);
    
    // Generation Commands
    commandRegistry.register(GenerateTaskCommand);
    commandRegistry.register(GenerateComponentCommand);
    commandRegistry.register(GenerateApiCommand);
    commandRegistry.register(GenerateTestCommand);
    
    // Advanced Commands
    commandRegistry.register(AdvancedLanguageCommand);
    commandRegistry.register(AdvancedAgentsCommand);
    commandRegistry.register(AdvancedLoggingCommand);
    commandRegistry.register(AdvancedMetricsCommand);
    commandRegistry.register(AdvancedDebugCommand);
    
    // Settings Commands (User-Requested Feature)
    commandRegistry.register(SettingsShowCommand);
    commandRegistry.register(SettingsModeCommand);
    commandRegistry.register(SettingsResetCommand);
    commandRegistry.register(SettingsPreferencesCommand);
    
    console.log('✓ All core commands registered successfully');
  } catch (error) {
    console.error('✗ Failed to register core commands:', error);
    throw error;
  }
}

/**
 * Get command handlers by category
 */
export function getCommandsByCategory(): Record<string, string[]> {
  return {
    configuration: [
      'config:show',
      'config:edit', 
      'config:templates',
      'config:framework',
      'config:quality',
      'config:security'
    ],
    templates: [
      'templates:list',
      'templates:use',
      'templates:preview',
      'templates:create',
      'templates:edit',
      'templates:reset'
    ],
    generation: [
      'generate:task',
      'generate:component',
      'generate:api',
      'generate:test'
    ],
    advanced: [
      'advanced:language',
      'advanced:agents',
      'advanced:logging',
      'advanced:metrics',
      'advanced:debug'
    ],
    settings: [
      'settings:show',
      'settings:mode',
      'settings:reset',
      'settings:preferences'
    ]
  };
}

/**
 * Get all core command IDs
 */
export function getCoreCommandIds(): string[] {
  const categories = getCommandsByCategory();
  return Object.values(categories).flat();
}

/**
 * Validate command registration
 */
export function validateCommandRegistration(commandRegistry: CommandRegistry): boolean {
  const expectedCommands = getCoreCommandIds();
  const registeredCommands = commandRegistry.listHandlers().map(h => h.id);
  
  const missingCommands = expectedCommands.filter(id => !registeredCommands.includes(id));
  
  if (missingCommands.length > 0) {
    console.error('✗ Missing command registrations:', missingCommands);
    return false;
  }
  
  console.log(`✓ All ${expectedCommands.length} commands registered and validated`);
  return true;
}
