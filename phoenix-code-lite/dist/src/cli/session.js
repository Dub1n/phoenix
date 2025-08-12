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
exports.CLISession = void 0;
const chalk_1 = __importDefault(require("chalk"));
const readline_1 = require("readline");
const interaction_manager_1 = require("./interaction-manager");
const settings_1 = require("../config/settings");
const test_utils_1 = require("../utils/test-utils");
const skin_menu_renderer_1 = require("./skin-menu-renderer");
class CLISession {
    constructor() {
        this.currentContext = {
            level: 'main',
            history: [],
            breadcrumb: ['Phoenix Code Lite'],
            data: {},
            mode: 'menu',
            navigationStack: []
        };
        this.running = false;
        this.readline = null;
        this.interactionManager = null;
        this.inputValidator = new InputValidationService();
        this.errorHandler = new ErrorHandler();
    }
    async start() {
        try {
            this.running = true;
            // Fix Issue #3: Clear input buffer and set up clean input handling
            this.clearInputBuffer();
            // Initialize readline interface for session input handling
            // Adaptive interface creation for both TTY and non-TTY environments
            this.readline = (0, readline_1.createInterface)({
                input: process.stdin,
                output: process.stdout,
                terminal: process.stdin.isTTY || false // Explicit terminal setting
            });
            // Load user's preferred interaction mode (Issue #4)
            const config = await settings_1.PhoenixCodeLiteConfig.load();
            const configData = config.export();
            const interactionMode = configData.ui?.interactionMode || 'menu';
            this.currentContext.mode = interactionMode;
            // Initialize interaction manager with dual mode support
            this.interactionManager = new interaction_manager_1.InteractionManager({
                currentMode: interactionMode,
                menuConfig: {
                    showNumbers: true,
                    allowArrowNavigation: true,
                    showDescriptions: true,
                    compactMode: false
                },
                commandConfig: {
                    promptSymbol: 'Phoenix> ',
                    showCommandList: true,
                    autoComplete: true,
                    historyEnabled: true
                },
                allowModeSwitch: true
            });
            // Import menu system dynamically
            const { MenuSystem } = await Promise.resolve().then(() => __importStar(require('./menu-system')));
            this.menuSystem = new MenuSystem();
            // Wait a moment for any pending foundation logs to complete
            await new Promise(resolve => setTimeout(resolve, 100));
            console.clear();
            console.log("🚀🚀🚀 RILEY TEST: If you see this, our code changes ARE working! 🚀🚀🚀");
            // this.displayWelcome();
            // Issue #12: Automatically display main menu
            await this.displayMainMenu();
            while (this.running) {
                try {
                    const input = await this.promptForInput();
                    await this.processCommand(input.trim());
                }
                catch (error) {
                    // Handle readline closed error - user likely pressed Ctrl+C
                    if (error.code === 'ERR_USE_AFTER_CLOSE') {
                        await this.handleInterruption();
                        break;
                    }
                    await this.errorHandler.handleError(error, this.currentContext);
                    await this.waitForEnter();
                }
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('Failed to start Phoenix CLI:'), error);
            (0, test_utils_1.safeExit)(1);
        }
        finally {
            this.cleanup();
        }
    }
    // Fix Issue #3: Clear input buffer to prevent pre-filled characters
    // Adaptive input handling that works in both TTY and non-TTY environments
    clearInputBuffer() {
        if (process.stdin.readable) {
            let data;
            while ((data = process.stdin.read()) !== null) {
                // Clear any buffered input
            }
        }
        // Adaptive TTY handling - only use setRawMode if available
        if (typeof process.stdin.setRawMode === 'function') {
            process.stdin.setRawMode(false); // Start in cooked mode for TTY
        }
        // Non-TTY environments work fine without setRawMode
        process.stdin.setEncoding('utf8');
        process.stdin.resume();
    }
    displayWelcome() {
        // Use unified layout engine for welcome screen
        const content = {
            title: '🔥 Phoenix Code Lite Interactive CLI',
            subtitle: 'TDD Workflow Orchestrator for Claude Code',
            sections: [{
                    heading: 'Welcome',
                    theme: { headingColor: 'yellow', bold: true },
                    items: [{
                            label: '🎆 Welcome! Transform ideas into tested, production-ready code',
                            description: `Mode: ${this.currentContext.mode?.toUpperCase() || 'MENU'} • Type "help" for commands • "quit" to exit`,
                            commands: ['help'],
                            type: 'action'
                        }]
                }],
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
        (0, skin_menu_renderer_1.renderLegacyWithUnified)(content, context);
    }
    // Issue #12: Auto-display main menu on CLI entry
    async displayMainMenu() {
        const mainMenuOptions = [
            { label: 'Generate Code', value: 'generate', description: 'Start TDD workflow for new code' },
            { label: 'Configuration', value: 'config', description: 'Manage settings and templates' },
            { label: 'Templates', value: 'templates', description: 'Manage project templates' },
            { label: 'Advanced Settings', value: 'advanced', description: 'Advanced configuration options' },
            { label: 'Help', value: 'help', description: 'Show available commands' },
            { label: 'Quit', value: 'quit', description: 'Exit Phoenix Code Lite' }
        ];
        const commands = mainMenuOptions.map(opt => ({
            name: opt.value,
            description: opt.description,
            aliases: opt.value === 'quit' ? ['exit'] : undefined
        }));
        if (this.interactionManager) {
            let result;
            if (this.currentContext.mode === 'menu') {
                result = await this.interactionManager.displayMenuMode(mainMenuOptions, '🏠 Main Menu');
            }
            else {
                result = await this.interactionManager.displayCommandMode(commands, '🏠 Phoenix Code Lite Commands');
            }
            await this.handleInteractionResult(result);
        }
    }
    async handleInteractionResult(result) {
        if (!result.success) {
            if (result.message) {
                console.log(chalk_1.default.red(result.message));
            }
            return;
        }
        switch (result.action) {
            case 'navigate':
                await this.navigateToContext(result.target, result.data);
                break;
            case 'execute':
                await this.executeAction(result.target, result.data);
                break;
            case 'switch_mode':
                this.switchMode(result.newMode);
                await this.displayMainMenu(); // Refresh display in new mode
                break;
            case 'back':
                await this.navigateBack();
                break;
            case 'quit':
                await this.confirmExit();
                break;
        }
    }
    switchMode(newMode) {
        this.currentContext.mode = newMode;
        if (this.interactionManager) {
            this.interactionManager.switchMode();
        }
    }
    cleanup() {
        if (this.interactionManager) {
            this.interactionManager.dispose();
            this.interactionManager = null;
        }
        if (this.readline) {
            this.readline.close();
            this.readline = null;
        }
    }
    async reinitializeInputHandling() {
        // Clean up existing interfaces to prevent event listener conflicts
        this.cleanup();
        // Clear input buffer and set up clean input handling (same as start())
        this.clearInputBuffer();
        // Initialize readline interface for session input handling  
        // Adaptive interface creation for both TTY and non-TTY environments
        this.readline = (0, readline_1.createInterface)({
            input: process.stdin,
            output: process.stdout,
            terminal: process.stdin.isTTY || false // Explicit terminal setting
        });
        // Reinitialize interaction manager with current context mode
        this.interactionManager = new interaction_manager_1.InteractionManager({
            currentMode: this.currentContext.mode || 'menu',
            menuConfig: {
                showNumbers: true,
                allowArrowNavigation: true,
                showDescriptions: true,
                compactMode: false
            },
            commandConfig: {
                promptSymbol: 'Phoenix> ',
                showCommandList: true,
                autoComplete: true,
                historyEnabled: true
            },
            allowModeSwitch: true
        });
    }
    async promptForInput() {
        // Guard against closed or null readline interface
        if (!this.readline) {
            throw new Error('ERR_USE_AFTER_CLOSE');
        }
        const prompt = this.generatePrompt();
        return new Promise((resolve, reject) => {
            try {
                this.readline.question(prompt, (answer) => {
                    resolve(answer);
                });
            }
            catch (error) {
                // Re-throw readline closed error to be handled by interruption handler
                if (error.code === 'ERR_USE_AFTER_CLOSE') {
                    reject(error);
                }
                else {
                    throw error;
                }
            }
        });
    }
    generatePrompt() {
        const contextColor = this.getContextColor();
        const contextLabel = this.getContextLabel();
        return chalk_1.default[contextColor](`${contextLabel}> `);
    }
    getContextColor() {
        switch (this.currentContext.level) {
            case 'config': return 'green';
            case 'templates': return 'yellow';
            case 'advanced': return 'cyan';
            case 'generate': return 'magenta';
            default: return 'blue';
        }
    }
    getContextLabel() {
        const breadcrumb = this.currentContext.breadcrumb.slice(1).join(' > ');
        return breadcrumb || 'Phoenix';
    }
    async processCommand(input) {
        if (!input)
            return;
        // Validate input first
        const validation = this.inputValidator.validate(input, this.currentContext);
        if (!validation.valid) {
            console.log(chalk_1.default.red('❌ Invalid input:'));
            validation.errors.forEach(error => console.log(chalk_1.default.red(`  • ${error}`)));
            // Show suggestions if available
            const suggestions = this.inputValidator.suggest?.(input, this.currentContext);
            if (suggestions && suggestions.length > 0) {
                console.log(chalk_1.default.yellow('\n💡 Did you mean:'));
                suggestions.forEach(suggestion => console.log(chalk_1.default.yellow(`  • ${suggestion}`)));
            }
            return;
        }
        // Show warnings if any
        if (validation.warnings && validation.warnings.length > 0) {
            validation.warnings.forEach(warning => console.log(chalk_1.default.yellow(`⚠️ ${warning}`)));
        }
        // Add to history
        this.currentContext.history.push(input);
        // Handle global commands first
        if (await this.handleGlobalCommands(input)) {
            return;
        }
        // Handle context-specific commands
        await this.handleContextCommands(input);
    }
    async handleGlobalCommands(input) {
        const cmd = input.toLowerCase();
        switch (cmd) {
            case 'quit':
            case 'exit':
                await this.confirmExit();
                return true;
            case 'help':
                this.showHelp();
                return true;
            case 'clear':
                console.clear();
                this.showHeader();
                return true;
            case 'back':
                if (this.currentContext.level !== 'main') {
                    await this.navigateBack();
                }
                else {
                    console.log(chalk_1.default.yellow('Already at main menu'));
                }
                return true;
            case 'home':
            case 'main':
                await this.navigateToMain();
                return true;
            default:
                return false;
        }
    }
    async handleContextCommands(input) {
        const action = await this.menuSystem.processContextCommand(input, this.currentContext);
        if (action) {
            switch (action.type) {
                case 'navigate':
                    await this.navigateToContext(action.target, action.data);
                    break;
                case 'execute':
                    await this.executeAction(action.target, action.data);
                    break;
                case 'back':
                    await this.navigateBack();
                    break;
                case 'exit':
                    this.running = false;
                    break;
            }
        }
        else {
            // Enhanced error message with suggestions
            const suggestions = this.inputValidator.suggest?.(input, this.currentContext) || [];
            console.log(chalk_1.default.red(`❌ Unknown command: ${chalk_1.default.bold(input)}`));
            if (suggestions.length > 0) {
                console.log(chalk_1.default.yellow('\n💡 Did you mean:'));
                suggestions.slice(0, 3).forEach(suggestion => {
                    console.log(chalk_1.default.yellow(`  • ${suggestion}`));
                });
            }
            else {
                console.log(chalk_1.default.gray('Type "help" for available commands'));
            }
        }
    }
    async navigateToContext(target, data) {
        // Save current context to history for back navigation
        this.currentContext.history.push(`nav:${this.currentContext.level}`);
        // Update context
        const previousLevel = this.currentContext.level;
        this.currentContext.level = target;
        this.currentContext.data = { ...this.currentContext.data, ...data };
        // Update breadcrumb
        if (target !== 'main') {
            if (previousLevel === 'main' || !this.currentContext.breadcrumb.includes(this.getContextDisplayName(target))) {
                this.currentContext.breadcrumb.push(this.getContextDisplayName(target));
            }
        }
        console.clear();
        this.showHeader();
        await this.menuSystem.showContextualMenu(this.currentContext);
    }
    async navigateBack() {
        if (this.currentContext.breadcrumb.length > 1) {
            this.currentContext.breadcrumb.pop();
            // Determine parent context
            const parentLevel = this.currentContext.breadcrumb.length === 1 ? 'main' :
                this.getContextLevelFromDisplayName(this.currentContext.breadcrumb[this.currentContext.breadcrumb.length - 1]);
            this.currentContext.level = parentLevel;
            console.clear();
            this.showHeader();
            await this.menuSystem.showContextualMenu(this.currentContext);
        }
    }
    async navigateToMain() {
        this.currentContext.level = 'main';
        this.currentContext.breadcrumb = ['Phoenix Code Lite'];
        this.currentContext.currentItem = undefined;
        console.clear();
        this.showHeader();
        await this.menuSystem.showContextualMenu(this.currentContext);
    }
    async executeAction(action, data) {
        // Import and execute appropriate command
        try {
            const { executeSessionAction } = await Promise.resolve().then(() => __importStar(require('./enhanced-commands')));
            await executeSessionAction(action, data, this.currentContext);
            // Refresh menu display after action completes
            console.clear();
            this.showHeader();
            await this.menuSystem.showContextualMenu(this.currentContext);
            // Properly cleanup and reinitialize readline interface to prevent input doubling
            await this.reinitializeInputHandling();
        }
        catch (error) {
            await this.errorHandler.handleError(error, this.currentContext, `executing action: ${action}`);
            await this.waitForEnter();
        }
    }
    getContextDisplayName(level) {
        const names = {
            'config': 'Configuration',
            'templates': 'Templates',
            'advanced': 'Advanced',
            'generate': 'Generate'
        };
        return names[level] || level;
    }
    getContextLevelFromDisplayName(displayName) {
        const levels = {
            'Configuration': 'config',
            'Templates': 'templates',
            'Advanced': 'advanced',
            'Generate': 'generate'
        };
        return levels[displayName] || 'main';
    }
    showHeader() {
        const title = this.menuSystem?.generateTitle(this.currentContext) || '🔥 Phoenix Code Lite';
        console.log(chalk_1.default.red.bold(title));
        console.log(chalk_1.default.gray('═'.repeat(70)));
        if (this.currentContext.breadcrumb.length > 1) {
            const breadcrumbStr = this.currentContext.breadcrumb.join(' › ');
            console.log(chalk_1.default.blue('📍 Navigation: ') + chalk_1.default.gray(breadcrumbStr));
            console.log(chalk_1.default.gray('─'.repeat(70)));
        }
        console.log();
    }
    showHelp() {
        console.log(chalk_1.default.blue.bold('\n📚 Phoenix Code Lite Help System'));
        console.log(chalk_1.default.gray('═'.repeat(70)));
        console.log(chalk_1.default.yellow.bold('🌐 Global Commands:'));
        console.log(chalk_1.default.cyan('  help     ') + chalk_1.default.gray('- Show this comprehensive help system'));
        console.log(chalk_1.default.cyan('  clear    ') + chalk_1.default.gray('- Clear screen and refresh display'));
        console.log(chalk_1.default.cyan('  back     ') + chalk_1.default.gray('- Navigate to previous menu level'));
        console.log(chalk_1.default.cyan('  home     ') + chalk_1.default.gray('- Return to main menu hub'));
        console.log(chalk_1.default.cyan('  quit     ') + chalk_1.default.gray('- Exit Phoenix Code Lite gracefully'));
        console.log();
        console.log(chalk_1.default.yellow.bold('🧭 Navigation Commands:'));
        console.log(chalk_1.default.green('  config     ') + chalk_1.default.gray('- Project configuration and settings management'));
        console.log(chalk_1.default.green('  templates  ') + chalk_1.default.gray('- Configuration templates (Starter, Enterprise, Performance)'));
        console.log(chalk_1.default.green('  generate   ') + chalk_1.default.gray('- AI-powered TDD code generation workflow'));
        console.log(chalk_1.default.green('  advanced   ') + chalk_1.default.gray('- Expert settings, debugging, and metrics'));
        console.log();
        if (this.currentContext.level !== 'main') {
            console.log(chalk_1.default.yellow.bold(`🎯 Context Commands (${this.getContextDisplayName(this.currentContext.level)}):`));
            this.menuSystem?.showContextHelp(this.currentContext);
            console.log();
        }
        console.log(chalk_1.default.blue.bold('💡 Pro Tips:'));
        console.log(chalk_1.default.gray('  • Commands are case-insensitive and support partial matching'));
        console.log(chalk_1.default.gray('  • Use numbers (1, 2, 3, 4) as shortcuts for menu navigation'));
        console.log(chalk_1.default.gray('  • Context-aware help adapts to your current location'));
        console.log(chalk_1.default.gray('  • All TDD workflows include Plan → Implement → Refactor phases'));
        console.log(chalk_1.default.gray('═'.repeat(70)));
    }
    async confirmExit() {
        console.log(chalk_1.default.yellow('\nAre you sure you want to exit? (y/N)'));
        const input = await this.promptForInput();
        if (input.toLowerCase() === 'y' || input.toLowerCase() === 'yes') {
            console.log(chalk_1.default.blue('👋 Thanks for using Phoenix Code Lite!'));
            this.running = false;
        }
    }
    async handleInterruption() {
        console.log(chalk_1.default.yellow('\n🔄 Session interrupted, navigating back...'));
        // If we're not at main menu, go back one level
        if (this.currentContext.level !== 'main') {
            await this.navigateBack();
        }
        else {
            // If already at main, just refresh the display
            console.clear();
            this.showHeader();
            await this.menuSystem.showContextualMenu(this.currentContext);
        }
    }
    async waitForEnter() {
        // Guard against closed or null readline interface
        if (!this.readline) {
            console.log(chalk_1.default.gray('(Press Enter to continue...)'));
            return Promise.resolve();
        }
        return new Promise((resolve) => {
            try {
                this.readline.question(chalk_1.default.gray('Press Enter to continue...'), () => {
                    resolve();
                });
            }
            catch (error) {
                // Handle readline closed error gracefully
                if (error.code === 'ERR_USE_AFTER_CLOSE') {
                    console.log(chalk_1.default.gray('(Press Enter to continue...)'));
                    resolve();
                }
                else {
                    throw error;
                }
            }
        });
    }
    getCurrentContext() {
        return { ...this.currentContext };
    }
    updateContext(updates) {
        this.currentContext = { ...this.currentContext, ...updates };
    }
    setInputValidator(validator) {
        this.inputValidator = validator;
    }
    setErrorHandler(handler) {
        this.errorHandler = handler;
    }
}
exports.CLISession = CLISession;
class InputValidationService {
    validate(input, context) {
        const errors = [];
        const warnings = [];
        // Basic validation
        if (input.length > 1000) {
            errors.push('Input is too long (maximum 1000 characters)');
        }
        // Check for potentially harmful input patterns
        if (this.containsSuspiciousPatterns(input)) {
            errors.push('Input contains potentially harmful patterns');
        }
        // Context-specific validation
        if (context.level === 'templates') {
            const templateValidation = this.validateTemplateInput(input);
            errors.push(...templateValidation.errors);
            warnings.push(...templateValidation.warnings || []);
        }
        return { valid: errors.length === 0, errors, warnings };
    }
    suggest(input, context) {
        const suggestions = [];
        const commands = this.getContextCommands(context);
        // Find similar commands using fuzzy matching
        for (const command of commands) {
            if (this.calculateSimilarity(input.toLowerCase(), command.toLowerCase()) > 0.6) {
                suggestions.push(command);
            }
        }
        // Add numbered alternatives if user entered a number
        if (/^\d+$/.test(input)) {
            const num = parseInt(input);
            const numberedCommands = this.getNumberedCommands(context);
            if (num > numberedCommands.length) {
                suggestions.push(...numberedCommands.map((cmd, idx) => `${idx + 1} (${cmd})`));
            }
        }
        return suggestions.slice(0, 5); // Limit to 5 suggestions
    }
    containsSuspiciousPatterns(input) {
        const suspiciousPatterns = [
            /\.\.\//, // Path traversal
            /<script/i, // Script injection
            /javascript:/i, // JavaScript protocol
            /eval\(/, // Eval function
            /\$\(/, // Command substitution
            /`/, // Backticks
        ];
        return suspiciousPatterns.some(pattern => pattern.test(input));
    }
    validateTemplateInput(input) {
        const errors = [];
        const warnings = [];
        const parts = input.split(' ');
        const command = parts[0];
        const arg = parts.slice(1).join(' ');
        if (['use', 'edit', 'delete', 'preview'].includes(command) && !arg) {
            errors.push(`Command '${command}' requires a template name`);
        }
        if (command === 'create' && arg && arg.length < 3) {
            warnings.push('Template names should be at least 3 characters long');
        }
        return { valid: errors.length === 0, errors, warnings };
    }
    getContextCommands(context) {
        const baseCommands = ['help', 'back', 'home', 'clear', 'quit'];
        switch (context.level) {
            case 'main':
                return [...baseCommands, 'config', 'templates', 'generate', 'advanced'];
            case 'config':
                return [...baseCommands, 'show', 'edit', 'templates', 'framework', 'quality', 'security'];
            case 'templates':
                return [...baseCommands, 'list', 'use', 'preview', 'create', 'edit', 'reset'];
            case 'generate':
                return [...baseCommands, 'task', 'component', 'api', 'test'];
            case 'advanced':
                return [...baseCommands, 'language', 'agents', 'logging', 'metrics', 'debug'];
            default:
                return baseCommands;
        }
    }
    getNumberedCommands(context) {
        switch (context.level) {
            case 'main':
                return ['config', 'templates', 'generate', 'advanced'];
            case 'config':
                return ['show', 'edit', 'templates', 'framework', 'quality', 'security'];
            case 'templates':
                return ['list', 'use', 'preview', 'create', 'edit', 'reset'];
            default:
                return [];
        }
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
class ErrorHandler {
    async handleError(error, context, operation) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const errorType = this.categorizeError(error);
        console.log();
        console.log(chalk_1.default.red('❌ Error occurred'));
        if (operation) {
            console.log(chalk_1.default.gray(`   Operation: ${operation}`));
        }
        console.log(chalk_1.default.gray(`   Context: ${context.level}`));
        console.log(chalk_1.default.red(`   Message: ${errorMessage}`));
        // Provide contextual help based on error type
        switch (errorType) {
            case 'validation':
                console.log(chalk_1.default.yellow('\n💡 This looks like a validation error. Check your input format.'));
                break;
            case 'file':
                console.log(chalk_1.default.yellow('\n💡 This appears to be a file system error. Check file permissions and paths.'));
                break;
            case 'network':
                console.log(chalk_1.default.yellow('\n💡 This seems to be a network-related error. Check your connection.'));
                break;
            case 'config':
                console.log(chalk_1.default.yellow('\n💡 Configuration error detected. Try resetting to default template.'));
                break;
            default:
                console.log(chalk_1.default.yellow('\n💡 For help, type "help" or visit the documentation.'));
        }
        // Suggest recovery actions
        const recoveryActions = this.getRecoveryActions(errorType, context);
        if (recoveryActions.length > 0) {
            console.log(chalk_1.default.blue('\n🔧 Suggested actions:'));
            recoveryActions.forEach(action => console.log(chalk_1.default.blue(`   • ${action}`)));
        }
        console.log();
    }
    categorizeError(error) {
        if (!(error instanceof Error))
            return 'unknown';
        const message = error.message.toLowerCase();
        if (message.includes('validation') || message.includes('invalid'))
            return 'validation';
        if (message.includes('file') || message.includes('ENOENT') || message.includes('permission'))
            return 'file';
        if (message.includes('network') || message.includes('connection') || message.includes('timeout'))
            return 'network';
        if (message.includes('config') || message.includes('template'))
            return 'config';
        return 'unknown';
    }
    getRecoveryActions(errorType, context) {
        const actions = [];
        switch (errorType) {
            case 'validation':
                actions.push('Check the command syntax and try again');
                actions.push('Type "help" to see available commands');
                break;
            case 'file':
                actions.push('Verify file permissions and paths');
                actions.push('Try running with appropriate permissions');
                break;
            case 'config':
                actions.push('Try switching to a different template');
                actions.push('Reset configuration to defaults');
                break;
        }
        // Context-specific recovery actions
        if (context.level === 'templates') {
            actions.push('List available templates with "list" command');
        }
        else if (context.level === 'config') {
            actions.push('View current configuration with "show" command');
        }
        return actions;
    }
}
//# sourceMappingURL=session.js.map