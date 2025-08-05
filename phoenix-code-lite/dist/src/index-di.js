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
const client_1 = require("./claude/client");
const audit_logger_1 = require("./utils/audit-logger");
const command_factory_1 = require("./cli/factories/command-factory");
const interactive_session_1 = require("./cli/interactive/interactive-session");
const claude_client_adapter_1 = require("./cli/adapters/claude-client-adapter");
const config_manager_adapter_1 = require("./cli/adapters/config-manager-adapter");
const audit_logger_adapter_1 = require("./cli/adapters/audit-logger-adapter");
const file_system_1 = require("./utils/file-system");
const chalk_1 = __importDefault(require("chalk"));
/**
 * Phoenix Code Lite - Dependency Injection Architecture
 *
 * This is the main entry point that uses dependency injection patterns
 * to create a more testable and maintainable CLI architecture.
 */
let coreFoundation;
let configManager;
let errorHandler;
async function initializeCore() {
    try {
        console.log(chalk_1.default.blue.bold('🔥 Phoenix Code Lite - Phase 1 Initialization'));
        console.log(chalk_1.default.gray('═'.repeat(60)));
        // Initialize error handler first
        errorHandler = new error_handler_1.ErrorHandler();
        console.log(chalk_1.default.green('✅ Error Handler initialized'));
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
async function createDependencies() {
    // Create real dependencies
    const realConfigManager = configManager;
    const realAuditLogger = new audit_logger_1.AuditLogger('main-process');
    const realClaudeClient = new client_1.ClaudeCodeClient();
    const realFileSystem = new file_system_1.FileSystem();
    // Create adapters
    const configAdapter = new config_manager_adapter_1.ConfigManagerAdapter(realConfigManager);
    const auditAdapter = new audit_logger_adapter_1.AuditLoggerAdapter(realAuditLogger);
    const claudeAdapter = new claude_client_adapter_1.ClaudeClientAdapter(realClaudeClient);
    return {
        configManager: configAdapter,
        auditLogger: auditAdapter,
        claudeClient: claudeAdapter,
        fileSystem: realFileSystem
    };
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
        // Create dependencies using dependency injection
        const dependencies = await createDependencies();
        // Create command factory with real dependencies
        const commandFactory = new command_factory_1.CommandFactory(dependencies.configManager, dependencies.auditLogger, dependencies.claudeClient, dependencies.fileSystem);
        // Handle command line arguments
        const args = process.argv.slice(2);
        if (args.length === 0) {
            // Interactive mode
            const session = new interactive_session_1.InteractiveSession(commandFactory, dependencies.auditLogger, dependencies.configManager);
            await session.start();
        }
        else {
            // Command mode
            const command = args[0];
            const commandArgs = args.slice(1);
            switch (command) {
                case 'config':
                    const configCmd = commandFactory.createConfigCommand();
                    await configCmd.execute(commandArgs);
                    break;
                case 'help':
                    const helpCmd = commandFactory.createHelpCommand();
                    await helpCmd.execute(commandArgs);
                    break;
                case 'version':
                    const versionCmd = commandFactory.createVersionCommand();
                    await versionCmd.execute(commandArgs);
                    break;
                case 'generate':
                    // For generate command, we need to parse options
                    const program = (0, args_1.setupCLI)();
                    await program.parseAsync(process.argv);
                    break;
                case 'init':
                    const initCmd = commandFactory.createInitCommand();
                    await initCmd.execute(commandArgs);
                    break;
                default:
                    console.log(`Unknown command: ${command}`);
                    console.log('Use "help" for available commands');
                    process.exit(1);
            }
        }
        // Clean shutdown
        await dependencies.auditLogger.destroy();
        const { safeExit } = await Promise.resolve().then(() => __importStar(require('./utils/test-utils')));
        safeExit(0);
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
//# sourceMappingURL=index-di.js.map