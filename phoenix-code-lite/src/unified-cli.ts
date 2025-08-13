/**---
 * title: [Unified CLI Entry - Core Infrastructure Component]
 * tags: [Core, Infrastructure, Entry-Point, CLI]
 * provides: [initializeUnifiedPhoenixCLI Function, runUnifiedCLI Function]
 * requires: [MenuRegistry, UnifiedCommandRegistry, UnifiedSessionManager, UserSettingsManager, chalk]
 * description: [Main entry point for the unified CLI architecture, wiring menus, commands and session management with persisted user settings]
 * ---*/

import chalk from 'chalk';
import { MenuRegistry } from './core/menu-registry';
import { UnifiedCommandRegistry } from './core/command-registry';
import { UnifiedSessionManager } from './core/unified-session-manager';
import { UserSettingsManager } from './core/user-settings-manager';
import { registerCoreMenus, validateCoreMenus } from './menus/menu-registration';
import { registerCoreCommands, validateCommandRegistration } from './commands/command-registration';
import { InteractionMode } from './types/interaction-abstraction';

/**
 * Initialize and start the unified Phoenix Code Lite CLI
 */
export async function initializeUnifiedPhoenixCLI(): Promise<void> {
  // Get version from package.json
  const packageJson = await import('../package.json');
  const currentVersion = packageJson.version;
  
  try {
    console.log(chalk.blue('* Initializing Phoenix Code Lite - Unified Architecture'));
    console.log(chalk.gray('Decoupled CLI with seamless mode switching'));
    console.log(chalk.gray('═'.repeat(60)));
    
    // Initialize user settings
    console.log(chalk.yellow('⌘ Initializing user settings...'));
    const settingsManager = new UserSettingsManager(currentVersion);
    const settingsInitialized = await settingsManager.initialize();
    
    if (!settingsInitialized) {
      throw new Error('Settings initialization failed');
    }
    
    const userSettings = settingsManager.getSettings();
    const interactionMode = userSettings.interactionMode;
    const debugMode = userSettings.debugMode;
    
    console.log(chalk.green(`✓ Settings loaded - Mode: ${chalk.cyan(interactionMode)}, Debug: ${debugMode ? 'enabled' : 'disabled'}`));
    
    // Initialize core components
    const menuRegistry = new MenuRegistry();
    const commandRegistry = new UnifiedCommandRegistry();
    
    // Validate and register core menus
    console.log(chalk.yellow('⋇ Validating menu definitions...'));
    if (!validateCoreMenus()) {
      throw new Error('Menu validation failed');
    }
    
    console.log(chalk.yellow('⋇ Registering core menus...'));
    registerCoreMenus(menuRegistry);
    
    // Register core commands
    console.log(chalk.yellow('⚡ Registering command handlers...'));
    registerCoreCommands(commandRegistry);
    
    // Validate command registration
    if (!validateCommandRegistration(commandRegistry)) {
      throw new Error('Command registration validation failed');
    }
    
    // Create interaction mode based on user settings
    const mode: InteractionMode = createInteractionMode(interactionMode);
    
    console.log(chalk.green(`✓ Initialization complete - Starting in ${mode.displayName} mode`));
    console.log();
    
    // Create and start session manager
    const sessionManager = new UnifiedSessionManager(
      menuRegistry,
      commandRegistry,
      mode
    );
    
    // Update session context with settings
    sessionManager.updateSessionContext({ 
      debugMode: debugMode,
      settingsManager: settingsManager // Pass settings manager to session
    });
    
    // Start the session
    await sessionManager.start();
    
  } catch (error) {
    console.error(chalk.red('✗ Failed to initialize Phoenix CLI:'), error);
    console.log(chalk.yellow('* Try running with --debug for more information'));
    process.exit(1);
  }
}

/**
 * Create interaction mode configuration
 */
function createInteractionMode(modeName: 'interactive' | 'command' | 'debug'): InteractionMode {
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
export async function runUnifiedCLI(): Promise<void> {
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
function showHelp(): void {
  console.log(chalk.blue.bold('* Phoenix Code Lite - Unified CLI'));
  console.log(chalk.gray('TDD Workflow Orchestrator with Persistent Settings'));
  console.log();
  console.log(chalk.yellow('Usage:'));
  console.log('  npm start                Start with saved user settings');
  console.log('  node dist/unified-cli.js Start with saved user settings');
  console.log();
  console.log(chalk.yellow('Interaction Modes (saved in settings):'));
  console.log(chalk.green('  Debug Mode (default)     ') + '- Enhanced debugging with dual input support');
  console.log(chalk.cyan('  Interactive Mode         ') + '- Numbered menus with arrow navigation');
  console.log(chalk.magenta('  Command Mode             ') + '- Text-based command interface');
  console.log();
  console.log(chalk.yellow('Settings Management:'));
  console.log('  • Mode preferences saved to .phoenix-settings.json');
  console.log('  • Settings automatically reset when version changes');
  console.log('  • Change modes using built-in settings commands');
  console.log('  • Debug mode enabled by default for development');
  console.log();
  console.log(chalk.yellow('Features:'));
  console.log('  • Seamless mode switching via settings commands');
  console.log('  • Persistent user preferences across sessions');
  console.log('  • Unified menu definitions work with all interaction modes');
  console.log('  • Comprehensive debug logging and diagnostics');
  console.log('  • Automatic version-based settings reset');
  console.log();
  console.log(chalk.gray('Settings file: .phoenix-settings.json'));
  console.log(chalk.blue('Visit documentation for more information'));
}

// If this file is run directly, start the CLI
if (require.main === module) {
  runUnifiedCLI().catch(error => {
    console.error(chalk.red('Fatal error:'), error);
    process.exit(1);
  });
}
