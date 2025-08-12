"use strict";
/**
 * Debug Renderer Implementation
 * Created: 2025-01-06-175700
 *
 * Enhanced debug mode with comprehensive logging, detailed output, and diagnostic features.
 * Combines the best of both interactive and command modes with debugging capabilities.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugRenderer = void 0;
const chalk_1 = __importDefault(require("chalk"));
const readline_1 = require("readline");
const skin_menu_renderer_1 = require("../cli/skin-menu-renderer");
class DebugRenderer {
    constructor() {
        this.mode = {
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
        this.readline = null;
        this.commandHistory = [];
        this.debugLog = [];
        this.maxHistorySize = 100;
        this.maxDebugLogSize = 500;
        this.setupReadline();
        this.log('system', 'Debug renderer initialized');
    }
    /**
     * Render menu with enhanced debug information
     */
    async renderMenu(definition, context) {
        this.log('menu', `Rendering menu: ${definition.id}`);
        // Show debug header
        this.showDebugHeader(definition, context);
        // Convert MenuDefinition to MenuContent format with debug enhancements
        const menuContent = this.convertToMenuContent(definition, context);
        const displayContext = this.createDisplayContext(definition, context);
        // Use existing unified layout engine
        (0, skin_menu_renderer_1.renderLegacyWithUnified)(menuContent, displayContext);
        // Show debug footer
        this.showDebugFooter(definition, context);
        this.log('menu', `Menu rendered successfully: ${definition.id}`);
    }
    /**
     * Handle input with comprehensive debugging and dual-mode support
     */
    async handleInput(definition, context) {
        this.log('input', 'Waiting for user input...');
        const input = await this.getInput();
        this.log('input', `Received input: "${input}"`);
        // Add to history
        this.addToHistory(input);
        // Handle debug-specific commands first
        const debugResult = this.handleDebugCommands(input, definition, context);
        if (debugResult) {
            this.log('command', `Debug command processed: ${input}`);
            return debugResult;
        }
        // Handle global commands
        const globalResult = this.handleGlobalCommands(input, definition, context);
        if (globalResult) {
            this.log('command', `Global command processed: ${input}`);
            return globalResult;
        }
        // Parse input to check if it's a number (interactive mode) or command (command mode)
        const isNumber = /^\d+$/.test(input.trim());
        if (isNumber) {
            // Handle as numbered selection (interactive mode)
            this.log('input', 'Processing as numbered selection (interactive mode)');
            const result = this.handleNumberedInput(input, definition, context);
            this.log('result', `Numbered input result: ${result.success ? 'success' : 'failed'}`);
            return result;
        }
        else {
            // Handle as text command (command mode)
            this.log('input', 'Processing as text command (command mode)');
            const result = this.handleTextCommand(input, definition, context);
            this.log('result', `Text command result: ${result.success ? 'success' : 'failed'}`);
            return result;
        }
    }
    /**
     * Clean up resources
     */
    dispose() {
        this.log('system', 'Debug renderer disposing...');
        if (this.readline) {
            this.readline.close();
            this.readline = null;
        }
        this.log('system', 'Debug renderer disposed');
    }
    /**
     * Show debug header with context information
     */
    showDebugHeader(definition, context) {
        console.log(chalk_1.default.gray('┌' + '─'.repeat(118) + '┐'));
        console.log(chalk_1.default.gray('│') + chalk_1.default.blue.bold(' DEBUG MODE'.padEnd(117)) + chalk_1.default.gray('│'));
        console.log(chalk_1.default.gray('│') + chalk_1.default.gray(`  Menu ID: ${definition.id} | Context Level: ${context.level} | Timestamp: ${new Date().toLocaleTimeString()}`.padEnd(117)) + chalk_1.default.gray('│'));
        console.log(chalk_1.default.gray('└' + '─'.repeat(118) + '┘'));
    }
    /**
     * Show debug footer with available commands
     */
    showDebugFooter(definition, context) {
        console.log();
        console.log(chalk_1.default.gray('━'.repeat(120)));
        console.log(chalk_1.default.yellow('🐛 Debug Commands: ') +
            chalk_1.default.cyan('log, history, context, clear, trace') +
            chalk_1.default.gray(' | ') +
            chalk_1.default.yellow('Mode Switch: ') +
            chalk_1.default.cyan('interactive, command') +
            chalk_1.default.gray(' | ') +
            chalk_1.default.yellow('Global: ') +
            chalk_1.default.cyan('help, back, home, quit'));
        console.log(chalk_1.default.gray('━'.repeat(120)));
    }
    /**
     * Handle debug-specific commands
     */
    handleDebugCommands(input, definition, context) {
        const cmd = input.toLowerCase().trim();
        switch (cmd) {
            case 'log':
                this.showDebugLog();
                return { action: { type: 'execute' }, success: true, message: 'Debug log displayed' };
            case 'history':
                this.showCommandHistory();
                return { action: { type: 'execute' }, success: true, message: 'Command history displayed' };
            case 'context':
                this.showContextDetails(context);
                return { action: { type: 'execute' }, success: true, message: 'Context details displayed' };
            case 'clear':
                console.clear();
                this.renderMenu(definition, context);
                return { action: { type: 'execute' }, success: true, message: 'Screen cleared' };
            case 'trace':
                this.showExecutionTrace();
                return { action: { type: 'execute' }, success: true, message: 'Execution trace displayed' };
            case 'interactive':
                return {
                    action: { type: 'execute', handler: 'system:switch-mode', data: { mode: 'interactive' } },
                    success: true,
                    message: 'Switching to interactive mode'
                };
            case 'command':
                return {
                    action: { type: 'execute', handler: 'system:switch-mode', data: { mode: 'command' } },
                    success: true,
                    message: 'Switching to command mode'
                };
        }
        return null;
    }
    /**
     * Handle numbered input (interactive mode style)
     */
    handleNumberedInput(input, definition, context) {
        const number = parseInt(input);
        let itemIndex = 0;
        // Find the item by number across all sections
        for (const section of definition.sections) {
            for (const item of section.items) {
                itemIndex++;
                if (itemIndex === number) {
                    this.log('selection', `Selected item: ${item.id} (${item.label})`);
                    if (this.isItemEnabled(item, context)) {
                        return {
                            action: item.action,
                            selectedItem: item,
                            success: true
                        };
                    }
                    else {
                        return {
                            action: { type: 'execute' },
                            success: false,
                            message: `Option "${item.label}" is currently disabled`
                        };
                    }
                }
            }
        }
        this.log('error', `Invalid number selection: ${number}`);
        return {
            action: { type: 'execute' },
            success: false,
            message: `Invalid option number: ${number}`
        };
    }
    /**
     * Handle text command (command mode style)
     */
    handleTextCommand(input, definition, context) {
        const selectedItem = this.findItemByCommand(input, definition);
        if (selectedItem) {
            this.log('command', `Found matching item: ${selectedItem.id} for command: ${input}`);
            if (this.isItemEnabled(selectedItem, context)) {
                return {
                    action: selectedItem.action,
                    selectedItem,
                    inputValue: input,
                    success: true
                };
            }
            else {
                return {
                    action: { type: 'execute' },
                    success: false,
                    message: `Command "${input}" is currently disabled`
                };
            }
        }
        // Show suggestions for invalid commands
        this.log('error', `Command not found: ${input}`);
        const suggestions = this.findSimilarCommands(input, definition);
        if (suggestions.length > 0) {
            console.log(chalk_1.default.red(`Unknown command: ${input}`));
            console.log(chalk_1.default.yellow('Did you mean:'));
            suggestions.forEach(suggestion => {
                console.log(chalk_1.default.yellow(`  ${suggestion}`));
            });
        }
        else {
            console.log(chalk_1.default.red(`Unknown command: ${input}`));
            console.log(chalk_1.default.gray('Type "help" to see available commands'));
        }
        return {
            action: { type: 'execute' },
            success: false,
            message: `Unknown command: ${input}`
        };
    }
    /**
     * Enhanced menu content conversion with debug information
     */
    convertToMenuContent(definition, context) {
        return {
            title: `${definition.title} ${chalk_1.default.gray(`[DEBUG: ${definition.id}]`)}`,
            subtitle: definition.description,
            sections: definition.sections.map(section => ({
                heading: `${section.heading} ${chalk_1.default.gray(`(${section.items.length} items)`)}`,
                theme: {
                    headingColor: (['red', 'green', 'yellow', 'blue', 'magenta', 'cyan'].includes(section.theme?.headingColor || '')
                        ? section.theme?.headingColor
                        : 'cyan'),
                    bold: section.theme?.bold !== undefined ? section.theme.bold : true
                },
                items: section.items.map((item, sectionIndex) => {
                    const globalIndex = this.getGlobalItemIndex(item, definition);
                    return {
                        label: `${globalIndex}. ${item.label}`,
                        description: `${item.description || ''} ${chalk_1.default.gray(`[${item.id}]`)}`,
                        commands: this.getItemCommands(item, globalIndex),
                        type: this.getItemType(item)
                    };
                })
            })),
            footerHints: [
                ...this.generateFooterHints(definition),
                chalk_1.default.gray('🐛 Debug mode: Enhanced logging and diagnostics enabled')
            ],
            metadata: {
                menuType: definition.metadata?.contextLevel === 'main' ? 'main' : 'sub',
                complexityLevel: this.calculateComplexity(definition),
                priority: 'normal',
                autoSize: true
            }
        };
    }
    /**
     * Get global item index across all sections
     */
    getGlobalItemIndex(targetItem, definition) {
        let index = 0;
        for (const section of definition.sections) {
            for (const item of section.items) {
                index++;
                if (item.id === targetItem.id) {
                    return index;
                }
            }
        }
        return index;
    }
    /**
     * Find item by command text
     */
    findItemByCommand(command, definition) {
        const query = command.toLowerCase();
        for (const section of definition.sections) {
            for (const item of section.items) {
                // Check shortcuts
                if (item.shortcuts?.some(shortcut => shortcut.toLowerCase() === query)) {
                    return item;
                }
                // Check item ID
                if (item.id.toLowerCase() === query) {
                    return item;
                }
                // Check partial matches
                if (item.shortcuts?.some(shortcut => shortcut.toLowerCase().startsWith(query))) {
                    return item;
                }
            }
        }
        return null;
    }
    /**
     * Log debug message
     */
    log(type, message) {
        const entry = {
            timestamp: new Date().toISOString(),
            type,
            message
        };
        this.debugLog.push(entry);
        if (this.debugLog.length > this.maxDebugLogSize) {
            this.debugLog = this.debugLog.slice(-this.maxDebugLogSize);
        }
        // Also log to console if verbose debugging is enabled
        if (process.env.PHOENIX_VERBOSE === 'true') {
            console.log(chalk_1.default.gray(`[${type.toUpperCase()}] ${message}`));
        }
    }
    /**
     * Show debug log
     */
    showDebugLog() {
        console.log(chalk_1.default.blue.bold('\n🐛 Debug Log'));
        console.log(chalk_1.default.gray('═'.repeat(80)));
        const recentLogs = this.debugLog.slice(-20);
        if (recentLogs.length === 0) {
            console.log(chalk_1.default.gray('  No debug entries'));
        }
        else {
            recentLogs.forEach(entry => {
                const time = new Date(entry.timestamp).toLocaleTimeString();
                const typeColor = this.getLogTypeColor(entry.type);
                console.log(`  ${chalk_1.default.gray(time)} ${chalk_1.default[typeColor](`[${entry.type.toUpperCase()}]`)} ${entry.message}`);
            });
        }
        console.log(chalk_1.default.gray('═'.repeat(80)));
    }
    /**
     * Get appropriate color for log type
     */
    getLogTypeColor(type) {
        switch (type) {
            case 'error': return 'red';
            case 'warning': return 'yellow';
            case 'success': return 'green';
            case 'system': return 'blue';
            case 'command': return 'cyan';
            default: return 'gray';
        }
    }
    /**
     * Show context details
     */
    showContextDetails(context) {
        console.log(chalk_1.default.blue.bold('\n🎯 Context Details'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log(`  Level: ${context.level}`);
        console.log(`  Session Context: ${JSON.stringify(context.sessionContext, null, 2)}`);
        if (context.parameters) {
            console.log(`  Parameters: ${JSON.stringify(context.parameters, null, 2)}`);
        }
        console.log(chalk_1.default.gray('═'.repeat(50)));
    }
    /**
     * Show execution trace
     */
    showExecutionTrace() {
        console.log(chalk_1.default.blue.bold('\n📋 Execution Trace'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
        console.log(`  Current Mode: ${this.mode.name}`);
        console.log(`  Command History Length: ${this.commandHistory.length}`);
        console.log(`  Debug Log Length: ${this.debugLog.length}`);
        console.log(`  Input Timeout: ${this.mode.configuration.inputTimeout}ms`);
        console.log(chalk_1.default.gray('═'.repeat(50)));
    }
    // Include utility methods from other renderers
    setupReadline() {
        this.readline = (0, readline_1.createInterface)({
            input: process.stdin,
            output: process.stdout,
            completer: this.completer.bind(this)
        });
        this.clearInputBuffer();
    }
    completer(line) {
        const completions = [
            'help', 'back', 'home', 'quit', 'clear', 'log', 'history', 'context', 'trace',
            'interactive', 'command', 'debug',
            'show', 'edit', 'list', 'create', 'delete', 'reset',
            'config', 'templates', 'generate', 'advanced'
        ];
        const hits = completions.filter(c => c.startsWith(line));
        return [hits.length ? hits : completions, line];
    }
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
    async getInput() {
        return new Promise((resolve) => {
            if (!this.readline) {
                this.setupReadline();
            }
            const prompt = chalk_1.default.yellow('Phoenix-Debug> ');
            this.readline.question(prompt, (answer) => {
                resolve(answer.trim());
            });
        });
    }
    addToHistory(command) {
        if (command && command !== this.commandHistory[this.commandHistory.length - 1]) {
            this.commandHistory.push(command);
            if (this.commandHistory.length > this.maxHistorySize) {
                this.commandHistory = this.commandHistory.slice(-this.maxHistorySize);
            }
        }
    }
    showCommandHistory() {
        console.log(chalk_1.default.blue.bold('\n📚 Command History'));
        console.log(chalk_1.default.gray('═'.repeat(50)));
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
        console.log(chalk_1.default.gray('═'.repeat(50)));
    }
    handleGlobalCommands(input, definition, context) {
        const cmd = input.toLowerCase().trim();
        switch (cmd) {
            case 'back':
                return { action: { type: 'back' }, success: true };
            case 'home':
            case 'main':
                return { action: { type: 'navigate', target: 'main' }, success: true };
            case 'quit':
            case 'exit':
                return { action: { type: 'exit' }, success: true };
            case 'help':
                return { action: { type: 'execute', handler: 'system:help' }, success: true };
        }
        return null;
    }
    getItemCommands(item, index) {
        const commands = [index.toString()];
        if (item.shortcuts) {
            commands.push(...item.shortcuts);
        }
        else {
            commands.push(item.id);
        }
        return commands;
    }
    getItemType(item) {
        switch (item.action.type) {
            case 'navigate': return 'navigation';
            case 'execute': return 'command';
            case 'exit': return 'action';
            case 'back': return 'action';
            default: return 'command';
        }
    }
    generateFooterHints(definition) {
        return [
            'Type number or command name',
            'Debug commands: log, history, context, trace',
            'Mode switch: interactive, command'
        ];
    }
    calculateComplexity(definition) {
        const itemCount = definition.sections.reduce((total, section) => total + section.items.length, 0);
        if (itemCount <= 4)
            return 'simple';
        if (itemCount <= 8)
            return 'moderate';
        return 'complex';
    }
    createDisplayContext(definition, context) {
        return {
            level: context.level,
            breadcrumb: this.getBreadcrumb(context)
        };
    }
    getBreadcrumb(context) {
        const sessionContext = context.sessionContext;
        return sessionContext.breadcrumb || ['Phoenix Code Lite'];
    }
    isItemEnabled(item, context) {
        if (item.enabled === undefined)
            return true;
        if (typeof item.enabled === 'boolean')
            return item.enabled;
        if (typeof item.enabled === 'function')
            return item.enabled(context);
        return true;
    }
    findSimilarCommands(input, definition) {
        const allCommands = [];
        for (const section of definition.sections) {
            for (const item of section.items) {
                if (item.shortcuts) {
                    allCommands.push(...item.shortcuts);
                }
                allCommands.push(item.id);
            }
        }
        allCommands.push('help', 'back', 'home', 'quit', 'clear', 'log', 'history', 'context');
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
    calculateSimilarity(str1, str2) {
        const longer = str1.length > str2.length ? str1 : str2;
        const shorter = str1.length > str2.length ? str2 : str1;
        if (longer.length === 0)
            return 1.0;
        const distance = this.levenshteinDistance(longer, shorter);
        return (longer.length - distance) / longer.length;
    }
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
}
exports.DebugRenderer = DebugRenderer;
//# sourceMappingURL=debug-renderer.js.map