"use strict";
/**---
 * title: [Command Registration - Unified Architecture]
 * tags: [Unified, Commands, Registration]
 * provides: [Command Registration, Registry Wiring]
 * requires: [core-commands]
 * description: [Registers core commands into the unified command registry for integrated CLI.]
 * ---*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerCoreCommands = registerCoreCommands;
exports.getCommandsByCategory = getCommandsByCategory;
exports.getCoreCommandIds = getCoreCommandIds;
exports.validateCommandRegistration = validateCommandRegistration;
const core_commands_1 = require("./core-commands");
/**
 * Register all core command handlers
 */
function registerCoreCommands(commandRegistry) {
    try {
        // Configuration Commands
        commandRegistry.register(core_commands_1.ConfigShowCommand);
        commandRegistry.register(core_commands_1.ConfigEditCommand);
        commandRegistry.register(core_commands_1.ConfigTemplatesCommand);
        commandRegistry.register(core_commands_1.ConfigFrameworkCommand);
        commandRegistry.register(core_commands_1.ConfigQualityCommand);
        commandRegistry.register(core_commands_1.ConfigSecurityCommand);
        // Template Commands
        commandRegistry.register(core_commands_1.TemplatesListCommand);
        commandRegistry.register(core_commands_1.TemplatesUseCommand);
        commandRegistry.register(core_commands_1.TemplatesPreviewCommand);
        commandRegistry.register(core_commands_1.TemplatesCreateCommand);
        commandRegistry.register(core_commands_1.TemplatesEditCommand);
        commandRegistry.register(core_commands_1.TemplatesResetCommand);
        // Generation Commands
        commandRegistry.register(core_commands_1.GenerateTaskCommand);
        commandRegistry.register(core_commands_1.GenerateComponentCommand);
        commandRegistry.register(core_commands_1.GenerateApiCommand);
        commandRegistry.register(core_commands_1.GenerateTestCommand);
        // Advanced Commands
        commandRegistry.register(core_commands_1.AdvancedLanguageCommand);
        commandRegistry.register(core_commands_1.AdvancedAgentsCommand);
        commandRegistry.register(core_commands_1.AdvancedLoggingCommand);
        commandRegistry.register(core_commands_1.AdvancedMetricsCommand);
        commandRegistry.register(core_commands_1.AdvancedDebugCommand);
        // Settings Commands (User-Requested Feature)
        commandRegistry.register(core_commands_1.SettingsShowCommand);
        commandRegistry.register(core_commands_1.SettingsModeCommand);
        commandRegistry.register(core_commands_1.SettingsResetCommand);
        commandRegistry.register(core_commands_1.SettingsPreferencesCommand);
        console.log('✓ All core commands registered successfully');
    }
    catch (error) {
        console.error('✗ Failed to register core commands:', error);
        throw error;
    }
}
/**
 * Get command handlers by category
 */
function getCommandsByCategory() {
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
function getCoreCommandIds() {
    const categories = getCommandsByCategory();
    return Object.values(categories).flat();
}
/**
 * Validate command registration
 */
function validateCommandRegistration(commandRegistry) {
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
//# sourceMappingURL=command-registration.js.map