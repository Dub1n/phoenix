"use strict";
/**---
 * title: [Command Renderer - Unified Architecture]
 * tags: [Unified, Interaction, Rendering]
 * provides: [Command Renderer]
 * requires: []
 * description: [Renders command interactions for the unified CLI system.]
 * ---*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandRenderer = void 0;
const chalk_1 = __importDefault(require("chalk"));
const readline_1 = require("readline");
class CommandRenderer {
    constructor() {
        this.mode = {
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
        this.readline = null;
        this.commandHistory = [];
        this.maxHistorySize = 100;
        this.setupReadline();
    }
    /**
     * Render menu in command-line format
     */
    async renderMenu(definition, context) {
        console.log(chalk_1.default.blue.bold(definition.title));
        if (definition.description) {
            console.log(chalk_1.default.gray(definition.description));
        }
        console.log(chalk_1.default.yellow('\nAvailable commands:'));
        // Display commands in a compact, CLI-friendly format
        definition.sections.forEach(section => {
            console.log(chalk_1.default.yellow(`\n${section.heading}:`));
            section.items.forEach((item, index) => {
                const shortcuts = this.getItemShortcuts(item, index);
                const shortcutStr = shortcuts.join(', ');
                const padding = shortcutStr.padEnd(15);
                console.log(`  ${chalk_1.default.cyan(padding)} - ${item.description || item.label}`);
            });
        });
        // Show global commands
        console.log(chalk_1.default.gray('\nGlobal commands: help, back, home, quit, m (menu mode)'));
        console.log();
    }
    /**
     * Handle command input with completion and validation
     */
    async handleInput(definition, context) {
        const input = await this.getCommandInput();
        // Add to history
        this.addToHistory(input);
        // Handle global commands first
        const globalResult = this.handleGlobalCommands(input, definition, context);
        if (globalResult) {
            return globalResult;
        }
        // Parse command and arguments
        const { command, args } = this.parseInput(input);
        // Find matching menu item
        const selectedItem = this.findItemByCommand(command, definition);
        if (selectedItem) {
            // Check if item is enabled
            if (await this.isItemEnabled(selectedItem, context)) {
                return {
                    action: {
                        ...selectedItem.action,
                        data: { ...selectedItem.action.data, args }
                    },
                    selectedItem,
                    inputValue: input,
                    success: true
                };
            }
            else {
                return {
                    action: { type: 'execute' },
                    success: false,
                    message: `Command "${command}" is currently disabled`
                };
            }
        }
        // Command not found - provide suggestions
        return this.handleCommandError(command, definition);
    }
    /**
     * Clean up resources
     */
    dispose() {
        if (this.readline) {
            this.readline.close();
            this.readline = null;
        }
    }
    /**
     * Get command shortcuts for display
     */
    getItemShortcuts(item, index) {
        const shortcuts = [(index + 1).toString()]; // Add number
        if (item.shortcuts && item.shortcuts.length > 0) {
            shortcuts.push(...item.shortcuts);
        }
        else {
            shortcuts.push(item.id);
        }
        return shortcuts;
    }
    /**
     * Setup readline with enhanced features
     */
    setupReadline() {
        this.readline = (0, readline_1.createInterface)({
            input: process.stdin,
            output: process.stdout,
            completer: this.completer.bind(this)
        });
        // Clear input buffer
        this.clearInputBuffer();
    }
    /**
     * Command completion function
     */
    completer(line) {
        // Simple completion based on command history and common commands
        const completions = [
            'help', 'back', 'home', 'quit', 'exit', 'clear',
            'show', 'edit', 'list', 'create', 'delete', 'reset',
            'config', 'templates', 'generate', 'advanced'
        ];
        // Add recent commands from history
        completions.push(...this.commandHistory.slice(-10));
        const hits = completions.filter(c => c.startsWith(line));
        return [hits.length ? hits : completions, line];
    }
    /**
     * Clear input buffer
     */
    clearInputBuffer() {
        if (process.stdin.readable) {
            let data;
            while ((data = process.stdin.read()) !== null) {
                // Clear any buffered input
            }
        }
        if (typeof process.stdin.setRawMode === 'function') {
            process.stdin.setRawMode(false);
        }
        process.stdin.setEncoding('utf8');
        process.stdin.resume();
    }
    /**
     * Get command input with prompt
     */
    async getCommandInput() {
        return new Promise((resolve) => {
            if (!this.readline) {
                this.setupReadline();
            }
            const prompt = chalk_1.default.gray('Phoenix> ');
            this.readline.question(prompt, (answer) => {
                resolve(answer.trim());
            });
        });
    }
    /**
     * Parse input into command and arguments
     */
    parseInput(input) {
        const parts = input.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);
        return { command, args };
    }
    /**
     * Find menu item by command
     */
    findItemByCommand(command, definition) {
        for (const section of definition.sections) {
            for (const [index, item] of section.items.entries()) {
                // Check number match
                if (command === (index + 1).toString()) {
                    return item;
                }
                // Check shortcuts (exact match)
                if (item.shortcuts?.some(shortcut => shortcut.toLowerCase() === command)) {
                    return item;
                }
                // Check item ID (exact match)
                if (item.id.toLowerCase() === command) {
                    return item;
                }
                // Check partial matches for convenience
                if (item.shortcuts?.some(shortcut => shortcut.toLowerCase().startsWith(command))) {
                    return item;
                }
            }
        }
        return null;
    }
    /**
     * Handle global commands
     */
    handleGlobalCommands(input, definition, context) {
        const cmd = input.toLowerCase().trim();
        switch (cmd) {
            case 'm':
            case 'menu':
                return {
                    action: { type: 'execute', handler: 'system:switch-mode', data: { mode: 'menu' } },
                    success: true
                };
            case 'back':
                return {
                    action: { type: 'back' },
                    success: true
                };
            case 'home':
            case 'main':
                return {
                    action: { type: 'navigate', target: 'main' },
                    success: true
                };
            case 'quit':
            case 'exit':
                return {
                    action: { type: 'exit' },
                    success: true
                };
            case 'help':
                return {
                    action: { type: 'execute', handler: 'system:help' },
                    success: true
                };
            case 'clear':
                console.clear();
                return {
                    action: { type: 'execute', handler: 'system:refresh' },
                    success: true
                };
            case 'history':
                this.showHistory();
                return {
                    action: { type: 'execute' },
                    success: true
                };
        }
        return null;
    }
    /**
     * Handle command errors with suggestions
     */
    handleCommandError(command, definition) {
        console.log(chalk_1.default.red(`Unknown command: ${command}`));
        // Find similar commands
        const suggestions = this.findSimilarCommands(command, definition);
        if (suggestions.length > 0) {
            console.log(chalk_1.default.yellow('Did you mean:'));
            suggestions.forEach(suggestion => {
                console.log(chalk_1.default.yellow(`  ${suggestion}`));
            });
        }
        else {
            console.log(chalk_1.default.gray('Type "help" to see available commands'));
        }
        return {
            action: { type: 'execute' },
            success: false,
            message: `Unknown command: ${command}`
        };
    }
    /**
     * Find similar commands using fuzzy matching
     */
    findSimilarCommands(input, definition) {
        const allCommands = [];
        // Collect all possible commands
        for (const section of definition.sections) {
            for (const item of section.items) {
                if (item.shortcuts) {
                    allCommands.push(...item.shortcuts);
                }
                allCommands.push(item.id);
            }
        }
        // Add global commands
        allCommands.push('help', 'back', 'home', 'quit', 'clear', 'menu');
        // Find similar commands
        const suggestions = [];
        for (const command of allCommands) {
            const score = this.calculateSimilarity(input.toLowerCase(), command.toLowerCase());
            if (score > 0.5) {
                suggestions.push({ command, score });
            }
        }
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
     * Calculate Levenshtein distance
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
     * Add command to history
     */
    addToHistory(command) {
        if (command && command !== this.commandHistory[this.commandHistory.length - 1]) {
            this.commandHistory.push(command);
            if (this.commandHistory.length > this.maxHistorySize) {
                this.commandHistory = this.commandHistory.slice(-this.maxHistorySize);
            }
        }
    }
    /**
     * Show command history
     */
    showHistory() {
        console.log(chalk_1.default.blue('Command History:'));
        if (this.commandHistory.length === 0) {
            console.log(chalk_1.default.gray('  No commands in history'));
        }
        else {
            const recentHistory = this.commandHistory.slice(-10);
            recentHistory.forEach((cmd, index) => {
                const number = this.commandHistory.length - recentHistory.length + index + 1;
                console.log(chalk_1.default.gray(`  ${number}. ${cmd}`));
            });
        }
    }
    /**
     * Check if item is enabled
     */
    async isItemEnabled(item, context) {
        if (item.enabled === undefined) {
            return true;
        }
        if (typeof item.enabled === 'boolean') {
            return item.enabled;
        }
        if (typeof item.enabled === 'function') {
            return item.enabled(context);
        }
        return true;
    }
}
exports.CommandRenderer = CommandRenderer;
//# sourceMappingURL=command-renderer.js.map