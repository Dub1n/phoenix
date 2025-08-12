#!/usr/bin/env node
"use strict";
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
exports.ErrorHandler = exports.ConfigManager = exports.CoreFoundation = exports.setupCLI = void 0;
const args_1 = require("./cli/args");
Object.defineProperty(exports, "setupCLI", { enumerable: true, get: function () { return args_1.setupCLI; } });
const foundation_1 = require("./core/foundation");
Object.defineProperty(exports, "CoreFoundation", { enumerable: true, get: function () { return foundation_1.CoreFoundation; } });
const config_manager_1 = require("./core/config-manager");
Object.defineProperty(exports, "ConfigManager", { enumerable: true, get: function () { return config_manager_1.ConfigManager; } });
const error_handler_1 = require("./core/error-handler");
Object.defineProperty(exports, "ErrorHandler", { enumerable: true, get: function () { return error_handler_1.ErrorHandler; } });
const chalk_1 = __importDefault(require("chalk"));
/**
 * Phoenix Code Lite - Phase 1 Core Infrastructure
 *
 * This is the main entry point that initializes the core foundation
 * including session management, dual mode architecture, configuration
 * management, and comprehensive error handling.
 */
let coreFoundation;
let configManager;
let errorHandler;
async function initializeCore() {
    try {
        // Only show initialization in command mode, not interactive mode
        const args = process.argv.slice(2);
        if (args.length > 0) {
            console.log(chalk_1.default.blue.bold('🔥 Phoenix Code Lite - Phase 1 Initialization'));
            console.log(chalk_1.default.gray('═'.repeat(60)));
        }
        // Initialize error handler first
        errorHandler = new error_handler_1.ErrorHandler();
        if (args.length > 0) {
            console.log(chalk_1.default.green('✅ Error Handler initialized'));
        }
        // Initialize configuration manager
        configManager = new config_manager_1.ConfigManager();
        const configInitialized = await configManager.initialize();
        if (!configInitialized) {
            throw new Error('Configuration initialization failed');
        }
        console.log(chalk_1.default.green('✅ Configuration Manager initialized'));
        // Initialize core foundation with configuration
        const config = configManager.getConfig();
        coreFoundation = new foundation_1.CoreFoundation(config);
        const coreInitialized = await coreFoundation.initialize();
        if (!coreInitialized) {
            throw new Error('Core foundation initialization failed');
        }
        console.log(chalk_1.default.green('✅ Core Foundation initialized'));
        // Setup configuration change handler
        configManager.onConfigChange('core-foundation', (newConfig) => {
            console.log(chalk_1.default.yellow('🔄 Configuration changed, updating core systems...'));
            // In a real implementation, you might restart components or apply changes
        });
        console.log(chalk_1.default.gray('═'.repeat(60)));
        console.log(chalk_1.default.green.bold('🚀 Phase 1 Core Infrastructure Ready'));
        console.log();
        return true;
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(chalk_1.default.red('❌ Core initialization failed:'), errorMsg);
        return false;
    }
}
async function shutdown() {
    console.log(chalk_1.default.yellow('\n🔄 Initiating graceful shutdown...'));
    try {
        if (configManager) {
            await configManager.shutdown();
            console.log(chalk_1.default.green('✅ Configuration Manager shutdown'));
        }
        if (errorHandler) {
            await errorHandler.shutdown();
            console.log(chalk_1.default.green('✅ Error Handler shutdown'));
        }
        if (coreFoundation) {
            await coreFoundation.gracefulShutdown();
        }
        console.log(chalk_1.default.green('✅ Graceful shutdown completed'));
    }
    catch (error) {
        console.error(chalk_1.default.red('❌ Shutdown error:'), error);
        // Use safeExit to handle test environments properly
        const { safeExit } = await Promise.resolve().then(() => __importStar(require('./utils/test-utils')));
        safeExit(1);
    }
}
async function main() {
    try {
        // Initialize Phase 1 core infrastructure
        const initialized = await initializeCore();
        if (!initialized) {
            console.error(chalk_1.default.red('❌ Failed to initialize core infrastructure'));
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
        // Check if running in interactive mode (no arguments or just the executable)
        const args = process.argv.slice(2);
        if (args.length === 0) {
            // Start persistent CLI session with core foundation access
            const { CLISession } = await Promise.resolve().then(() => __importStar(require('./cli/session')));
            const session = new CLISession();
            // Provide access to core components through session context
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
            // Clean up resources before exit in non-interactive mode
            // This ensures timers and event listeners are properly disposed
            await shutdown();
            // Exit after command completion and cleanup
            // Use safeExit to handle test environments properly
            const { safeExit } = await Promise.resolve().then(() => __importStar(require('./utils/test-utils')));
            safeExit(0);
        }
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
if (require.main === module) {
    main();
}
//# sourceMappingURL=index.js.map