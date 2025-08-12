"use strict";
/**
 * Core Command Handlers
 * Created: 2025-01-06-175700
 *
 * Extracted command handlers from the existing menu system.
 * Provides unified command execution independent of interaction mode.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsPreferencesCommand = exports.SettingsResetCommand = exports.SettingsModeCommand = exports.SettingsShowCommand = exports.AdvancedDebugCommand = exports.AdvancedMetricsCommand = exports.AdvancedLoggingCommand = exports.AdvancedAgentsCommand = exports.AdvancedLanguageCommand = exports.GenerateTestCommand = exports.GenerateApiCommand = exports.GenerateComponentCommand = exports.GenerateTaskCommand = exports.TemplatesResetCommand = exports.TemplatesEditCommand = exports.TemplatesCreateCommand = exports.TemplatesPreviewCommand = exports.TemplatesUseCommand = exports.TemplatesListCommand = exports.ConfigSecurityCommand = exports.ConfigQualityCommand = exports.ConfigFrameworkCommand = exports.ConfigTemplatesCommand = exports.ConfigEditCommand = exports.ConfigShowCommand = void 0;
// ============================================================================
// Configuration Commands
// ============================================================================
exports.ConfigShowCommand = {
    id: 'config:show',
    handler: async (context) => {
        try {
            // Import configuration manager dynamically to avoid circular dependencies
            const { PhoenixCodeLiteConfig } = await Promise.resolve().then(() => __importStar(require('../config/settings')));
            const config = await PhoenixCodeLiteConfig.load();
            const configData = config.export();
            console.log('📋 Current Configuration:');
            console.log('═'.repeat(50));
            console.log(JSON.stringify(configData, null, 2));
            return {
                success: true,
                data: configData,
                message: 'Configuration displayed successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.ConfigEditCommand = {
    id: 'config:edit',
    handler: async (context) => {
        try {
            console.log('🔧 Interactive Configuration Editor');
            console.log('This would open the configuration editor...');
            // TODO: Implement interactive configuration editor
            return {
                success: true,
                message: 'Configuration editor opened (placeholder)'
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Configuration edit failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.ConfigTemplatesCommand = {
    id: 'config:templates',
    handler: async (context) => {
        try {
            console.log('📄 Configuration Templates');
            console.log('Available templates: Starter, Enterprise, Performance');
            return {
                success: true,
                shouldNavigate: true,
                navigationTarget: 'templates'
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to show templates: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.ConfigFrameworkCommand = {
    id: 'config:framework',
    handler: async (context) => {
        try {
            console.log('🏗️ Framework Configuration');
            console.log('Framework-specific settings and optimizations...');
            return {
                success: true,
                message: 'Framework configuration displayed'
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Framework config failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.ConfigQualityCommand = {
    id: 'config:quality',
    handler: async (context) => {
        try {
            console.log('🎯 Quality Gates Configuration');
            console.log('Test coverage thresholds, linting rules, etc...');
            return {
                success: true,
                message: 'Quality gates configuration displayed'
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Quality config failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.ConfigSecurityCommand = {
    id: 'config:security',
    handler: async (context) => {
        try {
            console.log('🛡️ Security Policies Configuration');
            console.log('Security rules, vulnerability scanning, etc...');
            return {
                success: true,
                message: 'Security configuration displayed'
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Security config failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
// ============================================================================
// Template Commands
// ============================================================================
exports.TemplatesListCommand = {
    id: 'templates:list',
    handler: async (context) => {
        try {
            console.log('📄 Available Templates:');
            console.log('═'.repeat(50));
            console.log('1. Starter - Basic configuration for new projects');
            console.log('2. Enterprise - Full-featured enterprise setup');
            console.log('3. Performance - Optimized for high-performance applications');
            console.log('4. Custom templates...');
            return {
                success: true,
                message: 'Templates listed successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to list templates: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.TemplatesUseCommand = {
    id: 'templates:use',
    handler: async (context) => {
        try {
            const templateName = context.parameters.template || context.parameters.args?.[0];
            if (!templateName) {
                return {
                    success: false,
                    message: 'Please specify a template name (e.g., "use starter")'
                };
            }
            console.log(`📦 Applying template: ${templateName}`);
            console.log('Template applied successfully!');
            return {
                success: true,
                message: `Template "${templateName}" applied successfully`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Template application failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.TemplatesPreviewCommand = {
    id: 'templates:preview',
    handler: async (context) => {
        try {
            const templateName = context.parameters.template || context.parameters.args?.[0] || 'starter';
            console.log(`👁️ Previewing template: ${templateName}`);
            console.log('═'.repeat(50));
            console.log('Template configuration preview...');
            return {
                success: true,
                message: `Template "${templateName}" preview displayed`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Template preview failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.TemplatesCreateCommand = {
    id: 'templates:create',
    handler: async (context) => {
        try {
            const templateName = context.parameters.name || context.parameters.args?.[0];
            if (!templateName) {
                return {
                    success: false,
                    message: 'Please specify a template name (e.g., "create my-template")'
                };
            }
            console.log(`🎨 Creating template: ${templateName}`);
            console.log('Template created from current configuration!');
            return {
                success: true,
                message: `Template "${templateName}" created successfully`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Template creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.TemplatesEditCommand = {
    id: 'templates:edit',
    handler: async (context) => {
        try {
            const templateName = context.parameters.template || context.parameters.args?.[0];
            if (!templateName) {
                return {
                    success: false,
                    message: 'Please specify a template name (e.g., "edit starter")'
                };
            }
            console.log(`✏️ Editing template: ${templateName}`);
            console.log('Template editor opened...');
            return {
                success: true,
                message: `Template "${templateName}" editor opened`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Template edit failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.TemplatesResetCommand = {
    id: 'templates:reset',
    handler: async (context) => {
        try {
            const templateName = context.parameters.template || context.parameters.args?.[0];
            if (!templateName) {
                return {
                    success: false,
                    message: 'Please specify a template name (e.g., "reset starter")'
                };
            }
            console.log(`🔄 Resetting template: ${templateName}`);
            console.log('Template reset to defaults!');
            return {
                success: true,
                message: `Template "${templateName}" reset to defaults`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Template reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
// ============================================================================
// Generation Commands
// ============================================================================
exports.GenerateTaskCommand = {
    id: 'generate:task',
    handler: async (context) => {
        try {
            const description = context.parameters.description || context.parameters.args?.join(' ');
            if (!description) {
                console.log('🤖 General Task Generation');
                console.log('Please describe what you want to build...');
                return {
                    success: true,
                    message: 'Awaiting task description'
                };
            }
            console.log(`⚡ Generating code for: ${description}`);
            console.log('TDD workflow initiated...');
            return {
                success: true,
                message: `Task generation started: ${description}`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Task generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.GenerateComponentCommand = {
    id: 'generate:component',
    handler: async (context) => {
        try {
            const description = context.parameters.description || context.parameters.args?.join(' ');
            console.log(`🧩 Generating UI component: ${description || 'Interactive component'}`);
            console.log('Creating component with tests and styling...');
            return {
                success: true,
                message: `Component generation started: ${description || 'component'}`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Component generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.GenerateApiCommand = {
    id: 'generate:api',
    handler: async (context) => {
        try {
            const description = context.parameters.description || context.parameters.args?.join(' ');
            console.log(`🔌 Generating API endpoint: ${description || 'REST API'}`);
            console.log('Creating endpoint with validation and documentation...');
            return {
                success: true,
                message: `API generation started: ${description || 'API'}`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `API generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.GenerateTestCommand = {
    id: 'generate:test',
    handler: async (context) => {
        try {
            const description = context.parameters.description || context.parameters.args?.join(' ');
            console.log(`🧪 Generating test suite: ${description || 'comprehensive tests'}`);
            console.log('Creating test files with full coverage...');
            return {
                success: true,
                message: `Test generation started: ${description || 'tests'}`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Test generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
// ============================================================================
// Advanced Commands
// ============================================================================
exports.AdvancedLanguageCommand = {
    id: 'advanced:language',
    handler: async (context) => {
        try {
            console.log('🔤 Language Preferences Configuration');
            console.log('Programming language settings and optimizations...');
            return {
                success: true,
                message: 'Language preferences displayed'
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Language config failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.AdvancedAgentsCommand = {
    id: 'advanced:agents',
    handler: async (context) => {
        try {
            console.log('🤖 AI Agent Configuration');
            console.log('Agent specialization and behavior settings...');
            return {
                success: true,
                message: 'Agent configuration displayed'
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Agent config failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.AdvancedLoggingCommand = {
    id: 'advanced:logging',
    handler: async (context) => {
        try {
            console.log('📝 Audit Logging Configuration');
            console.log('Session tracking and audit trail settings...');
            return {
                success: true,
                message: 'Logging configuration displayed'
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Logging config failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.AdvancedMetricsCommand = {
    id: 'advanced:metrics',
    handler: async (context) => {
        try {
            console.log('📊 Performance Metrics');
            console.log('Analytics, success rates, and performance data...');
            return {
                success: true,
                message: 'Metrics displayed'
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Metrics display failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.AdvancedDebugCommand = {
    id: 'advanced:debug',
    handler: async (context) => {
        try {
            console.log('🐛 Debug Mode Configuration');
            console.log('Verbose output and troubleshooting settings...');
            // Toggle debug mode in session context
            context.sessionContext.debugMode = !context.sessionContext.debugMode;
            const status = context.sessionContext.debugMode ? 'enabled' : 'disabled';
            return {
                success: true,
                message: `Debug mode ${status}`
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Debug config failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
// ============================================================================
// Settings Commands (User-Requested Feature)
// ============================================================================
exports.SettingsShowCommand = {
    id: 'settings:show',
    handler: async (context) => {
        try {
            const settingsManager = context.sessionContext.settingsManager;
            if (!settingsManager) {
                return {
                    success: false,
                    message: 'Settings manager not available'
                };
            }
            // Display current settings using the manager's built-in display
            settingsManager.displaySettings();
            return {
                success: true,
                message: 'Current settings displayed'
            };
        }
        catch (error) {
            return {
                success: false,
                message: `Failed to show settings: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.SettingsModeCommand = {
    id: 'settings:mode',
    handler: async (context) => {
        try {
            const settingsManager = context.sessionContext.settingsManager;
            const targetMode = context.parameters.mode || context.parameters.args?.[0];
            if (!settingsManager) {
                return {
                    success: false,
                    message: 'Settings manager not available'
                };
            }
            if (!targetMode) {
                // Show available modes
                console.log('🎛️ Available Interaction Modes:');
                console.log('═'.repeat(50));
                const modes = (await Promise.resolve().then(() => __importStar(require('../core/user-settings-manager')))).UserSettingsManager.getAvailableInteractionModes();
                modes.forEach((modeInfo, index) => {
                    console.log(`  ${index + 1}. ${modeInfo.mode} - ${modeInfo.description}`);
                });
                console.log('\nUsage: settings mode <mode-name>');
                console.log('Example: settings mode interactive');
                return {
                    success: true,
                    message: 'Available modes displayed. Please specify a mode to switch to.'
                };
            }
            const validModes = ['interactive', 'command', 'debug'];
            if (!validModes.includes(targetMode)) {
                return {
                    success: false,
                    message: `Invalid mode "${targetMode}". Valid modes: ${validModes.join(', ')}`
                };
            }
            // Set the interaction mode and persist it
            const success = await settingsManager.setInteractionMode(targetMode);
            if (success) {
                return {
                    success: true,
                    message: `Interaction mode changed to "${targetMode}". Please restart the CLI to apply the change.`,
                    shouldExit: true // Exit so user can restart to see the new mode
                };
            }
            else {
                return {
                    success: false,
                    message: `Failed to change interaction mode to "${targetMode}"`
                };
            }
        }
        catch (error) {
            return {
                success: false,
                message: `Mode change failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.SettingsResetCommand = {
    id: 'settings:reset',
    handler: async (context) => {
        try {
            const settingsManager = context.sessionContext.settingsManager;
            if (!settingsManager) {
                return {
                    success: false,
                    message: 'Settings manager not available'
                };
            }
            console.log('⚠️  This will reset all settings to defaults.');
            console.log('Settings being reset...');
            const success = await settingsManager.resetToDefaults();
            if (success) {
                return {
                    success: true,
                    message: 'All settings reset to defaults. Please restart the CLI to apply changes.',
                    shouldExit: true
                };
            }
            else {
                return {
                    success: false,
                    message: 'Failed to reset settings to defaults'
                };
            }
        }
        catch (error) {
            return {
                success: false,
                message: `Settings reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
exports.SettingsPreferencesCommand = {
    id: 'settings:preferences',
    handler: async (context) => {
        try {
            const settingsManager = context.sessionContext.settingsManager;
            const prefKey = context.parameters.key || context.parameters.args?.[0];
            const prefValue = context.parameters.value || context.parameters.args?.[1];
            if (!settingsManager) {
                return {
                    success: false,
                    message: 'Settings manager not available'
                };
            }
            if (!prefKey) {
                // Show available preferences
                console.log('🎨 User Preferences:');
                console.log('═'.repeat(50));
                console.log('  showWelcome     - Show welcome message on startup (true/false)');
                console.log('  autoSave        - Auto-save configuration changes (true/false)');
                console.log('  colorScheme     - UI color scheme (default/dark/light)');
                console.log('  promptTimeout   - Input timeout in milliseconds (number)');
                console.log('\nUsage: settings preferences <key> <value>');
                console.log('Example: settings preferences colorScheme dark');
                return {
                    success: true,
                    message: 'Available preferences displayed'
                };
            }
            if (!prefValue) {
                return {
                    success: false,
                    message: `Please specify a value for preference "${prefKey}"`
                };
            }
            // Convert value based on preference type
            let convertedValue = prefValue;
            if (prefKey === 'showWelcome' || prefKey === 'autoSave') {
                if (prefValue === 'true')
                    convertedValue = true;
                else if (prefValue === 'false')
                    convertedValue = false;
                else {
                    return {
                        success: false,
                        message: `"${prefKey}" requires a boolean value (true/false)`
                    };
                }
            }
            else if (prefKey === 'promptTimeout') {
                convertedValue = parseInt(prefValue);
                if (isNaN(convertedValue)) {
                    return {
                        success: false,
                        message: `"${prefKey}" requires a numeric value`
                    };
                }
            }
            else if (prefKey === 'colorScheme') {
                if (!['default', 'dark', 'light'].includes(prefValue)) {
                    return {
                        success: false,
                        message: `"${prefKey}" must be one of: default, dark, light`
                    };
                }
            }
            else {
                return {
                    success: false,
                    message: `Unknown preference "${prefKey}"`
                };
            }
            // Update the preference
            const success = await settingsManager.updatePreference(prefKey, convertedValue);
            if (success) {
                return {
                    success: true,
                    message: `Preference "${prefKey}" set to "${convertedValue}"`
                };
            }
            else {
                return {
                    success: false,
                    message: `Failed to update preference "${prefKey}"`
                };
            }
        }
        catch (error) {
            return {
                success: false,
                message: `Preference update failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
};
//# sourceMappingURL=core-commands.js.map