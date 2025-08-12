"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InteractionManager = void 0;
const chalk_1 = __importDefault(require("chalk"));
const readline_1 = require("readline");
const skin_menu_renderer_1 = require("./skin-menu-renderer");
/**
 * Dual Mode Interaction Manager
 * Handles both Menu Mode (arrow navigation) and Command Mode (text commands)
 * Implements Issue #4 from UX Enhancement Guide
 */
class InteractionManager {
    constructor(config) {
        this.readline = null;
        this.keyboardListener = null;
        this.config = config;
        this.setupReadline();
    }
    setupReadline() {
        this.readline = (0, readline_1.createInterface)({
            input: process.stdin,
            output: process.stdout,
            prompt: this.config.commandConfig.promptSymbol
        });
        // Fix Issue #3: Clear input buffer on initialization
        this.clearInputBuffer();
    }
    /**
     * Fix Issue #3: Clear input buffer to prevent pre-filled characters
     */
    clearInputBuffer() {
        if (process.stdin.readable) {
            let data;
            while ((data = process.stdin.read()) !== null) {
                // Clear any buffered input
            }
        }
        // Set up clean input handling - check if setRawMode is available
        if (typeof process.stdin.setRawMode === 'function') {
            process.stdin.setRawMode(false); // Start in cooked mode
        }
        process.stdin.setEncoding('utf8');
        process.stdin.resume();
    }
    /**
     * Display Menu Mode interface with numbered options
     * Implements Issue #8: Numbered menu options
     * Now uses unified layout engine for consistent rendering
     */
    async displayMenuMode(options, title) {
        // Convert to MenuContent structure for unified rendering
        const content = {
            title,
            sections: [{
                    heading: 'Options',
                    theme: { headingColor: 'cyan', bold: true },
                    items: options.map((option, index) => ({
                        label: option.label, // Remove numbering here - unified engine will add it
                        description: option.description || '',
                        commands: [option.value, (index + 1).toString()],
                        type: option.enabled === false ? 'action' : 'command'
                    }))
                }],
            footerHints: [
                'Type number, command name, or:',
                '"c" for command mode, "ESC"/"back" to go back, "home" for main menu'
            ],
            metadata: {
                menuType: 'main',
                complexityLevel: 'simple',
                priority: 'normal',
                autoSize: true
            }
        };
        const context = {
            level: 'main',
            breadcrumb: ['Phoenix Code Lite']
        };
        // Use unified layout engine for rendering
        (0, skin_menu_renderer_1.renderLegacyWithUnified)(content, context);
        return await this.handleMenuInput(options);
    }
    /**
     * Display Command Mode interface with text input
     * Now uses unified layout engine for consistent rendering
     */
    async displayCommandMode(commands, title) {
        // Convert to MenuContent structure for unified rendering
        const content = {
            title,
            sections: [{
                    heading: 'Commands',
                    theme: { headingColor: 'cyan', bold: true },
                    items: commands.map((cmd, index) => ({
                        label: `${(index + 1).toString().padStart(2)}. ${cmd.name.padEnd(12)}`,
                        description: cmd.description || '',
                        commands: [cmd.name, (index + 1).toString()],
                        type: 'command'
                    }))
                }],
            footerHints: [
                'Type command name or number, "m" for menu mode, "back" to go back'
            ],
            metadata: {
                menuType: 'main',
                complexityLevel: 'simple',
                priority: 'normal',
                autoSize: true
            }
        };
        const context = {
            level: 'main',
            breadcrumb: ['Phoenix Code Lite']
        };
        // Use unified layout engine for rendering
        (0, skin_menu_renderer_1.renderLegacyWithUnified)(content, context);
        return await this.handleCommandInput(commands);
    }
    /**
     * Handle menu mode input (numbers, commands, special keys)
     */
    async handleMenuInput(options) {
        const input = await this.getInput();
        // Handle special commands first
        const specialResult = this.handleSpecialCommands(input);
        if (specialResult)
            return specialResult;
        // Check if input is a number
        const num = parseInt(input);
        if (!isNaN(num) && num >= 1 && num <= options.length) {
            const selectedOption = options[num - 1];
            if (selectedOption.enabled === false) {
                return {
                    action: 'execute',
                    success: false,
                    message: `Option "${selectedOption.label}" is currently disabled`
                };
            }
            return {
                action: 'navigate',
                target: selectedOption.value,
                success: true
            };
        }
        // Check if input matches an option by name or value
        const matchedOption = this.findMatchingOption(input, options);
        if (matchedOption) {
            if (matchedOption.enabled === false) {
                return {
                    action: 'execute',
                    success: false,
                    message: `Option "${matchedOption.label}" is currently disabled`
                };
            }
            return {
                action: 'navigate',
                target: matchedOption.value,
                success: true
            };
        }
        // Invalid input
        console.log(chalk_1.default.red(`Invalid option: ${input}`));
        console.log(chalk_1.default.yellow('Available options:'));
        options.forEach((opt, idx) => {
            console.log(chalk_1.default.yellow(`  ${idx + 1}. ${opt.label}`));
        });
        return await this.handleMenuInput(options); // Retry
    }
    /**
     * Handle command mode input (text commands)
     */
    async handleCommandInput(commands) {
        process.stdout.write(chalk_1.default.gray(this.config.commandConfig.promptSymbol));
        const input = await this.getInput();
        // Handle special commands first
        const specialResult = this.handleSpecialCommands(input);
        if (specialResult)
            return specialResult;
        // Check if input is a number
        const num = parseInt(input);
        if (!isNaN(num) && num >= 1 && num <= commands.length) {
            const selectedCommand = commands[num - 1];
            return {
                action: 'execute',
                target: selectedCommand.name,
                success: true
            };
        }
        // Check if input matches a command by name or alias
        const matchedCommand = this.findMatchingCommand(input, commands);
        if (matchedCommand) {
            return {
                action: 'execute',
                target: matchedCommand.name,
                success: true
            };
        }
        // Invalid command
        console.log(chalk_1.default.red(`Unknown command: ${input}`));
        const suggestions = this.suggestCommands(input, commands);
        if (suggestions.length > 0) {
            console.log(chalk_1.default.yellow('Did you mean:'));
            suggestions.forEach(cmd => console.log(chalk_1.default.yellow(`  ${cmd.name}`)));
        }
        return await this.handleCommandInput(commands); // Retry
    }
    /**
     * Handle special commands that work in both modes
     */
    handleSpecialCommands(input) {
        const cmd = input.toLowerCase().trim();
        switch (cmd) {
            case 'c':
            case 'command':
                if (this.config.currentMode === 'menu' && this.config.allowModeSwitch) {
                    return { action: 'switch_mode', newMode: 'command', success: true };
                }
                break;
            case 'm':
            case 'menu':
                if (this.config.currentMode === 'command' && this.config.allowModeSwitch) {
                    return { action: 'switch_mode', newMode: 'menu', success: true };
                }
                break;
            case 'back':
            case '\x1b': // ESC key
                return { action: 'back', success: true };
            case 'home':
            case 'main':
                return { action: 'navigate', target: 'main', success: true };
            case 'quit':
            case 'exit':
                return { action: 'quit', success: true };
            case 'help':
                return { action: 'execute', target: 'help', success: true };
        }
        return null;
    }
    /**
     * Get user input with proper handling
     */
    async getInput() {
        return new Promise((resolve) => {
            if (!this.readline) {
                this.setupReadline();
            }
            this.readline.question('', (answer) => {
                resolve(answer.trim());
            });
        });
    }
    /**
     * Find matching menu option by partial name matching
     */
    findMatchingOption(input, options) {
        const query = input.toLowerCase();
        // Exact match on value
        let match = options.find(opt => opt.value.toLowerCase() === query);
        if (match)
            return match;
        // Exact match on label
        match = options.find(opt => opt.label.toLowerCase() === query);
        if (match)
            return match;
        // Partial match on label
        match = options.find(opt => opt.label.toLowerCase().includes(query));
        if (match)
            return match;
        // Partial match on value
        match = options.find(opt => opt.value.toLowerCase().includes(query));
        return match || null;
    }
    /**
     * Find matching command by name or alias
     */
    findMatchingCommand(input, commands) {
        const query = input.toLowerCase();
        // Exact match on name
        let match = commands.find(cmd => cmd.name.toLowerCase() === query);
        if (match)
            return match;
        // Exact match on alias
        match = commands.find(cmd => cmd.aliases?.some(alias => alias.toLowerCase() === query));
        if (match)
            return match;
        // Partial match on name
        match = commands.find(cmd => cmd.name.toLowerCase().includes(query));
        return match || null;
    }
    /**
     * Suggest similar commands based on input
     */
    suggestCommands(input, commands) {
        const query = input.toLowerCase();
        const suggestions = [];
        commands.forEach(command => {
            const nameScore = this.calculateSimilarity(query, command.name.toLowerCase());
            if (nameScore > 0.5) {
                suggestions.push({ command, score: nameScore });
            }
            // Check aliases too
            if (command.aliases) {
                command.aliases.forEach(alias => {
                    const aliasScore = this.calculateSimilarity(query, alias.toLowerCase());
                    if (aliasScore > nameScore && aliasScore > 0.5) {
                        suggestions.push({ command, score: aliasScore });
                    }
                });
            }
        });
        return suggestions
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(s => s.command);
    }
    /**
     * Calculate string similarity using Levenshtein distance
     */
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0)
            return 1.0;
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
    /**
     * Calculate Levenshtein distance between two strings
     */
    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j] + 1);
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
    /**
     * Switch between menu and command modes
     */
    switchMode() {
        this.config.currentMode = this.config.currentMode === 'menu' ? 'command' : 'menu';
        console.log(chalk_1.default.green(`\n═ Switched to ${this.config.currentMode.toUpperCase()} mode`));
        return this.config.currentMode;
    }
    /**
     * Get current interaction mode
     */
    getCurrentMode() {
        return this.config.currentMode;
    }
    /**
     * Update interaction configuration
     */
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
    /**
     * Clean up resources
     */
    dispose() {
        if (this.readline) {
            this.readline.close();
            this.readline = null;
        }
        if (this.keyboardListener) {
            this.keyboardListener.destroy();
            this.keyboardListener = null;
        }
    }
}
exports.InteractionManager = InteractionManager;
//# sourceMappingURL=interaction-manager.js.map