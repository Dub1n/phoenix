"use strict";
/**---
 * title: [Command Factory - CLI Command Instantiation]
 * tags: [CLI, Factory, Commands]
 * provides: [CommandFactory Class, Command Creators]
 * requires: [generate-command, config-command, init-command, help-command, version-command]
 * description: [Centralized factory for constructing CLI command handlers, wiring options and dependencies.]
 * ---*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandFactory = void 0;
const config_command_1 = require("../commands/config-command");
const help_command_1 = require("../commands/help-command");
const version_command_1 = require("../commands/version-command");
const generate_command_1 = require("../commands/generate-command");
const init_command_1 = require("../commands/init-command");
class CommandFactory {
    constructor(configManager, auditLogger, claudeClient, fileSystem) {
        this.configManager = configManager;
        this.auditLogger = auditLogger;
        this.claudeClient = claudeClient;
        this.fileSystem = fileSystem;
    }
    createConfigCommand() {
        return new config_command_1.ConfigCommand(this.configManager, this.auditLogger);
    }
    createHelpCommand() {
        return new help_command_1.HelpCommand(this.auditLogger);
    }
    createVersionCommand() {
        return new version_command_1.VersionCommand(this.auditLogger);
    }
    createGenerateCommand() {
        return new generate_command_1.GenerateCommand(this.claudeClient, this.configManager, this.auditLogger, this.fileSystem);
    }
    createInitCommand() {
        return new init_command_1.InitCommand(this.configManager, this.auditLogger, this.fileSystem);
    }
    // Method to create commands with options (for commands that need them)
    createGenerateCommandWithOptions(options) {
        return new generate_command_1.GenerateCommand(this.claudeClient, this.configManager, this.auditLogger, this.fileSystem);
    }
}
exports.CommandFactory = CommandFactory;
//# sourceMappingURL=command-factory.js.map