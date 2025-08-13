#!/usr/bin/env node
"use strict";
/**---
 * title: [Phoenix Code Lite - Unified Architecture Entry Point]
 * tags: [Core, Infrastructure, Entry-Point, Unified-Architecture]
 * provides: [Unified CLI Bootstrap, Legacy Mode Bridge, Core Initialization, Unified CLI Launcher]
 * requires: [CoreFoundation, ConfigManager, ErrorHandler, unified-cli, CLI Args]
 * description: [Entry point for running Phoenix Code Lite with the unified architecture, including fallback to legacy initialization; coordinates core setup and unified CLI execution.]
 * ---*/
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
exports.initializeUnifiedPhoenixCLI = exports.ErrorHandler = exports.ConfigManager = exports.CoreFoundation = exports.setupCLI = void 0;
const args_1 = require("./cli/args");
Object.defineProperty(exports, "setupCLI", { enumerable: true, get: function () { return args_1.setupCLI; } });
const foundation_1 = require("./core/foundation");
Object.defineProperty(exports, "CoreFoundation", { enumerable: true, get: function () { return foundation_1.CoreFoundation; } });
const config_manager_1 = require("./core/config-manager");
Object.defineProperty(exports, "ConfigManager", { enumerable: true, get: function () { return config_manager_1.ConfigManager; } });
const error_handler_1 = require("./core/error-handler");
Object.defineProperty(exports, "ErrorHandler", { enumerable: true, get: function () { return error_handler_1.ErrorHandler; } });
const unified_cli_1 = require("./unified-cli");
Object.defineProperty(exports, "initializeUnifiedPhoenixCLI", { enumerable: true, get: function () { return unified_cli_1.initializeUnifiedPhoenixCLI; } });
const chalk_1 = __importDefault(require("chalk"));
let coreFoundation;
let configManager;
let errorHandler;
async function initializeCore() {
    try {
        const args = process.argv.slice(2);
        const useUnified = args.includes('--unified') || args.includes('--new-architecture');
        if (!useUnified) {
            // Only show initialization messages for legacy mode
            if (args.length > 0) {
                console.log(chalk_1.default.blue.bold('* Phoenix Code Lite - Core Infrastructure'));
                console.log(chalk_1.default.gray('Legacy Mode with Core Foundation'));
                console.log(chalk_1.default.gray('═'.repeat(60)));
            }
            // Initialize error handler first
            errorHandler = new error_handler_1.ErrorHandler();
            if (args.length > 0) {
                console.log(chalk_1.default.green('✓ Error Handler initialized'));
            }
            // Initialize configuration manager
            configManager = new config_manager_1.ConfigManager();
            const configInitialized = await configManager.initialize();
            if (!configInitialized) {
                throw new Error('Configuration initialization failed');
            }
            console.log(chalk_1.default.green('✓ Configuration Manager initialized'));
            // Initialize core foundation with configuration
            const config = configManager.getConfig();
            coreFoundation = new foundation_1.CoreFoundation(config);
            const coreInitialized = await coreFoundation.initialize();
            if (!coreInitialized) {
                throw new Error('Core foundation initialization failed');
            }
            console.log(chalk_1.default.green('✓ Core Foundation initialized'));
            // Setup configuration change handler
            configManager.onConfigChange('core-foundation', (newConfig) => {
                console.log(chalk_1.default.yellow('⇔ Configuration changed, updating core systems...'));
            });
            console.log(chalk_1.default.gray('═'.repeat(60)));
            console.log(chalk_1.default.green.bold('^ Core Infrastructure Ready (Legacy Mode)'));
            console.log();
        }
        return true;
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(chalk_1.default.red('✗ Core initialization failed:'), errorMsg);
        return false;
    }
}
async function shutdown() {
    console.log(chalk_1.default.yellow('\n⇔ Initiating graceful shutdown...'));
    try {
        if (configManager) {
            await configManager.shutdown();
            console.log(chalk_1.default.green('✓ Configuration Manager shutdown'));
        }
        if (errorHandler) {
            await errorHandler.shutdown();
            console.log(chalk_1.default.green('✓ Error Handler shutdown'));
        }
        if (coreFoundation) {
            await coreFoundation.gracefulShutdown();
        }
        console.log(chalk_1.default.green('✓ Graceful shutdown completed'));
    }
    catch (error) {
        console.error(chalk_1.default.red('✗ Shutdown error:'), error);
        const { safeExit } = await Promise.resolve().then(() => __importStar(require('./utils/test-utils')));
        safeExit(1);
    }
}
async function main() {
    try {
        const args = process.argv.slice(2);
        // Check for unified architecture flags
        const useLegacy = args.includes('--legacy') || args.includes('--old-architecture');
        const showHelp = args.includes('--help') || args.includes('-h');
        if (showHelp && !useLegacy) {
            showMainHelp();
            return;
        }
        if (useLegacy) {
            // Use legacy architecture
            const initialized = await initializeCore();
            if (!initialized) {
                console.error(chalk_1.default.red('✗ Failed to initialize core infrastructure'));
                process.exit(1);
            }
            // Setup graceful shutdown handlers
            process.on('SIGINT', shutdown);
            process.on('SIGTERM', shutdown);
            process.on('uncaughtException', async (error) => {
                if (errorHandler) {
                    await errorHandler.handleError(error, {
                        source: 'main-process',
                        category: 'system',
                        severity: 'critical'
                    });
                }
                await shutdown();
            });
            if (args.length === 0) {
                // Start persistent CLI session with core foundation access
                const { CLISession } = await Promise.resolve().then(() => __importStar(require('./cli/session')));
                const session = new CLISession();
                session.updateContext({
                    data: {
                        coreFoundation,
                        configManager,
                        errorHandler,
                        systemStatus: coreFoundation.getSystemStatus()
                    }
                });
                await session.start();
            }
            else {
                // Use traditional command-line mode
                const program = (0, args_1.setupCLI)();
                await program.parseAsync(process.argv);
                await shutdown();
                const { safeExit } = await Promise.resolve().then(() => __importStar(require('./utils/test-utils')));
                safeExit(0);
            }
            return;
        }
        // Use unified architecture (default)
        console.log(chalk_1.default.blue.bold('* Phoenix Code Lite - Unified Architecture'));
        console.log(chalk_1.default.gray('Decoupled CLI with seamless mode switching'));
        console.log(chalk_1.default.gray('═'.repeat(60)));
        // Parse unified CLI specific flags
        let initialMode = 'interactive';
        let debugMode = false;
        if (args.includes('--command-mode') || args.includes('-c')) {
            initialMode = 'command';
        }
        if (args.includes('--debug') || args.includes('-d')) {
            debugMode = true;
        }
        // Initialize unified CLI (uses settings-based configuration)
        await (0, unified_cli_1.initializeUnifiedPhoenixCLI)();
        return;
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        if (errorHandler) {
            await errorHandler.handleError(error, {
                source: 'main-process',
                category: 'system',
                severity: 'high'
            });
        }
        console.error(chalk_1.default.red('Phoenix-Code-Lite failed:'), errorMsg);
        await shutdown();
        process.exit(1);
    }
}
function showMainHelp() {
    console.log(chalk_1.default.blue.bold('* Phoenix Code Lite - Entry Point Selection'));
    console.log(chalk_1.default.gray('Choose between Legacy and Unified Architecture'));
    console.log();
    console.log(chalk_1.default.yellow('Legacy Mode (Default):'));
    console.log('  npm start                    Start interactive session with legacy architecture');
    console.log('  npm start [command] [args]   Run command with legacy CLI');
    console.log();
    console.log(chalk_1.default.yellow('Unified Mode (Experimental):'));
    console.log('  npm start --unified          Start with new unified architecture');
    console.log('  npm start --unified -i       Start in interactive mode');
    console.log('  npm start --unified -c       Start in command mode');
    console.log('  npm start --unified -d       Start with debug mode');
    console.log();
    console.log(chalk_1.default.yellow('Architecture Comparison:'));
    console.log(chalk_1.default.green('  Legacy Mode:'));
    console.log('    • Existing implementation with scattered menu definitions');
    console.log('    • Mode-specific interaction handling');
    console.log('    • Command processing mixed with UI concerns');
    console.log();
    console.log(chalk_1.default.blue('  Unified Mode:'));
    console.log('    • Decoupled menu definitions work with all interaction modes');
    console.log('    • Seamless switching between interactive and command modes');
    console.log('    • Clean separation of concerns with unified command registry');
    console.log('    • Skins system ready for domain-specific customization');
    console.log();
    console.log(chalk_1.default.gray('The unified architecture is the future - test it with --unified flag'));
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=index-unified.js.map