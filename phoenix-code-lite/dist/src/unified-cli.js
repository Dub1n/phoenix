"use strict";
/**
 * Unified CLI Entry Point
 * Created: 2025-01-06-175700
 *
 * Main entry point for the new unified CLI architecture.
 * Integrates menu registry, command registry, and session management.
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeUnifiedPhoenixCLI = initializeUnifiedPhoenixCLI;
exports.runUnifiedCLI = runUnifiedCLI;
const chalk_1 = __importDefault(require("chalk"));
const menu_registry_1 = require("./core/menu-registry");
const command_registry_1 = require("./core/command-registry");
const unified_session_manager_1 = require("./core/unified-session-manager");
const user_settings_manager_1 = require("./core/user-settings-manager");
const menu_registration_1 = require("./menus/menu-registration");
const command_registration_1 = require("./commands/command-registration");
/**
 * Initialize and start the unified Phoenix Code Lite CLI
 */
async function initializeUnifiedPhoenixCLI() {
    // Get version from package.json
    const packageJson = await Promise.resolve().then(() => __importStar(require('../package.json')));
    const currentVersion = packageJson.version;
    try {
        console.log(chalk_1.default.blue('🔥 Initializing Phoenix Code Lite - Unified Architecture'));
        console.log(chalk_1.default.gray('Decoupled CLI with seamless mode switching'));
        console.log(chalk_1.default.gray('═'.repeat(60)));
        // Initialize user settings
        console.log(chalk_1.default.yellow('⚙️ Initializing user settings...'));
        const settingsManager = new user_settings_manager_1.UserSettingsManager(currentVersion);
        const settingsInitialized = await settingsManager.initialize();
        if (!settingsInitialized) {
            throw new Error('Settings initialization failed');
        }
        const userSettings = settingsManager.getSettings();
        const interactionMode = userSettings.interactionMode;
        const debugMode = userSettings.debugMode;
        console.log(chalk_1.default.green(`✅ Settings loaded - Mode: ${chalk_1.default.cyan(interactionMode)}, Debug: ${debugMode ? 'enabled' : 'disabled'}`));
        // Initialize core components
        const menuRegistry = new menu_registry_1.MenuRegistry();
        const commandRegistry = new command_registry_1.UnifiedCommandRegistry();
        // Validate and register core menus
        console.log(chalk_1.default.yellow('📋 Validating menu definitions...'));
        if (!(0, menu_registration_1.validateCoreMenus)()) {
            throw new Error('Menu validation failed');
        }
        console.log(chalk_1.default.yellow('📋 Registering core menus...'));
        (0, menu_registration_1.registerCoreMenus)(menuRegistry);
        // Register core commands
        console.log(chalk_1.default.yellow('⚡ Registering command handlers...'));
        (0, command_registration_1.registerCoreCommands)(commandRegistry);
        // Validate command registration
        if (!(0, command_registration_1.validateCommandRegistration)(commandRegistry)) {
            throw new Error('Command registration validation failed');
        }
        // Create interaction mode based on user settings
        const mode = createInteractionMode(interactionMode);
        console.log(chalk_1.default.green(`✅ Initialization complete - Starting in ${mode.displayName} mode`));
        console.log();
        // Create and start session manager
        const sessionManager = new unified_session_manager_1.UnifiedSessionManager(menuRegistry, commandRegistry, mode);
        // Update session context with settings
        sessionManager.updateSessionContext({
            debugMode: debugMode,
            settingsManager: settingsManager // Pass settings manager to session
        });
        // Start the session
        await sessionManager.start();
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Failed to initialize Phoenix CLI:'), error);
        console.log(chalk_1.default.yellow('💡 Try running with --debug for more information'));
        process.exit(1);
    }
}
/**
 * Create interaction mode configuration
 */
function createInteractionMode(modeName) {
    switch (modeName) {
        case 'interactive':
            return {
                name: 'interactive',
                displayName: 'Interactive Navigation',
                capabilities: {
                    supportsArrowNavigation: true,
                    supportsTextInput: true,
                    supportsKeyboardShortcuts: true,
                    supportsRealTimeValidation: false
                },
                configuration: {
                    inputTimeout: 30000,
                    displayOptions: {
                        showNumbers: true,
                        showShortcuts: true,
                        compactMode: false
                    }
                }
            };
        case 'command':
            return {
                name: 'command',
                displayName: 'Command-Line Interface',
                capabilities: {
                    supportsArrowNavigation: false,
                    supportsTextInput: true,
                    supportsKeyboardShortcuts: true,
                    supportsRealTimeValidation: true
                },
                configuration: {
                    inputTimeout: 60000,
                    validationRules: [
                        { type: 'command', pattern: /^[a-zA-Z0-9\s\-_]+$/ }
                    ]
                }
            };
        case 'debug':
            return {
                name: 'debug',
                displayName: 'Debug Mode',
                capabilities: {
                    supportsArrowNavigation: true,
                    supportsTextInput: true,
                    supportsKeyboardShortcuts: true,
                    supportsRealTimeValidation: true
                },
                configuration: {
                    inputTimeout: 60000,
                    validationRules: [
                        { type: 'command', pattern: /^[a-zA-Z0-9\s\-_]+$/ }
                    ],
                    displayOptions: {
                        showNumbers: true,
                        showShortcuts: true,
                        compactMode: false,
                        maxWidth: 120
                    }
                }
            };
        default:
            throw new Error(`Unsupported interaction mode: ${modeName}`);
    }
}
/**
 * CLI entry point - uses settings for mode selection
 */
async function runUnifiedCLI() {
    const args = process.argv.slice(2);
    // Check for help flag
    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }
    // Initialize using settings (no more command line flags needed)
    await initializeUnifiedPhoenixCLI();
}
/**
 * Show command line help
 */
function showHelp() {
    console.log(chalk_1.default.blue.bold('🔥 Phoenix Code Lite - Unified CLI'));
    console.log(chalk_1.default.gray('TDD Workflow Orchestrator with Persistent Settings'));
    console.log();
    console.log(chalk_1.default.yellow('Usage:'));
    console.log('  npm start                Start with saved user settings');
    console.log('  node dist/unified-cli.js Start with saved user settings');
    console.log();
    console.log(chalk_1.default.yellow('Interaction Modes (saved in settings):'));
    console.log(chalk_1.default.green('  Debug Mode (default)     ') + '- Enhanced debugging with dual input support');
    console.log(chalk_1.default.cyan('  Interactive Mode         ') + '- Numbered menus with arrow navigation');
    console.log(chalk_1.default.magenta('  Command Mode             ') + '- Text-based command interface');
    console.log();
    console.log(chalk_1.default.yellow('Settings Management:'));
    console.log('  • Mode preferences saved to .phoenix-settings.json');
    console.log('  • Settings automatically reset when version changes');
    console.log('  • Change modes using built-in settings commands');
    console.log('  • Debug mode enabled by default for development');
    console.log();
    console.log(chalk_1.default.yellow('Features:'));
    console.log('  • Seamless mode switching via settings commands');
    console.log('  • Persistent user preferences across sessions');
    console.log('  • Unified menu definitions work with all interaction modes');
    console.log('  • Comprehensive debug logging and diagnostics');
    console.log('  • Automatic version-based settings reset');
    console.log();
    console.log(chalk_1.default.gray('Settings file: .phoenix-settings.json'));
    console.log(chalk_1.default.blue('Visit documentation for more information'));
}
// If this file is run directly, start the CLI
if (require.main === module) {
    runUnifiedCLI().catch(error => {
        console.error(chalk_1.default.red('Fatal error:'), error);
        process.exit(1);
    });
}
//# sourceMappingURL=unified-cli.js.map