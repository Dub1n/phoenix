import chalk from 'chalk';
import { createInterface, Interface } from 'readline';
import { InteractionManager } from './interaction-manager';
import { InteractionModeConfig, NavigationItem } from '../types/interaction-modes';
import { PhoenixCodeLiteConfig } from '../config/settings';
import { safeExit } from '../utils/test-utils';

export interface SessionContext {
  level: 'main' | 'config' | 'templates' | 'advanced' | 'generate';
  history: string[];
  currentItem?: string;
  breadcrumb: string[];
  data?: Record<string, any>;
  mode?: 'menu' | 'command';
  navigationStack?: NavigationItem[];
}

export interface MenuAction {
  type: 'navigate' | 'execute' | 'exit' | 'back';
  target?: string;
  data?: any;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface InputValidator {
  validate(input: string, context: SessionContext): ValidationResult;
  suggest?(input: string, context: SessionContext): string[];
}

export class CLISession {
  private currentContext: SessionContext = { 
    level: 'main', 
    history: [], 
    breadcrumb: ['Phoenix Code Lite'],
    data: {},
    mode: 'menu',
    navigationStack: []
  };
  private running: boolean = false;
  private readline: Interface | null = null;
  private menuSystem: any; // Will be imported dynamically
  private interactionManager: InteractionManager | null = null;
  private inputValidator: InputValidator;
  private errorHandler: ErrorHandler;

  constructor() {
    this.inputValidator = new InputValidationService();
    this.errorHandler = new ErrorHandler();
  }

  public async start(): Promise<void> {
    try {
      this.running = true;
      
      // Fix Issue #3: Clear input buffer and set up clean input handling
      this.clearInputBuffer();
      
      // Load user's preferred interaction mode (Issue #4)
      const config = await PhoenixCodeLiteConfig.load();
      const configData = config.export();
      const interactionMode = configData.ui?.interactionMode || 'menu';
      
      this.currentContext.mode = interactionMode;
      
      // Initialize interaction manager with dual mode support
      this.interactionManager = new InteractionManager({
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
      const { MenuSystem } = await import('./menu-system');
      this.menuSystem = new MenuSystem();

      console.clear();
      this.displayWelcome();
      
      // Issue #12: Automatically display main menu
      await this.displayMainMenu();
      
      while (this.running) {
        try {
          const input = await this.promptForInput();
          await this.processCommand(input.trim());
        } catch (error) {
          await this.errorHandler.handleError(error, this.currentContext);
          await this.waitForEnter();
        }
      }

    } catch (error) {
      console.error(chalk.red('Failed to start Phoenix CLI:'), error);
      
      safeExit(1);
    } finally {
      this.cleanup();
    }
  }
  
  // Fix Issue #3: Clear input buffer to prevent pre-filled characters
  private clearInputBuffer(): void {
    if (process.stdin.readable) {
      let data;
      while ((data = process.stdin.read()) !== null) {
        // Clear any buffered input
      }
    }
    
    process.stdin.setRawMode(false); // Start in cooked mode
    process.stdin.setEncoding('utf8');
    process.stdin.resume();
  }
  
  private displayWelcome(): void {
    // Fix Issue #5: Simplified header without redundant breadcrumbs
    console.log(chalk.red.bold('🔥 Phoenix Code Lite Interactive CLI'));
    console.log(chalk.blue.bold('TDD Workflow Orchestrator for Claude Code'));
    console.log(chalk.gray('═'.repeat(70)));
    console.log(chalk.yellow('🎆 Welcome! ') + chalk.gray('Transform ideas into tested, production-ready code'));
    console.log(chalk.gray(`Mode: ${this.currentContext.mode?.toUpperCase() || 'MENU'} • Type "help" for commands • "quit" to exit`));
    console.log(chalk.gray('═'.repeat(70)));
    console.log();
  }
  
  // Issue #12: Auto-display main menu on CLI entry
  private async displayMainMenu(): Promise<void> {
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
      } else {
        result = await this.interactionManager.displayCommandMode(commands, '🏠 Phoenix Code Lite Commands');
      }
      
      await this.handleInteractionResult(result);
    }
  }
  
  private async handleInteractionResult(result: any): Promise<void> {
    if (!result.success) {
      if (result.message) {
        console.log(chalk.red(result.message));
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
  
  private switchMode(newMode: 'menu' | 'command'): void {
    this.currentContext.mode = newMode;
    if (this.interactionManager) {
      this.interactionManager.switchMode();
    }
  }
  
  private cleanup(): void {
    if (this.interactionManager) {
      this.interactionManager.dispose();
      this.interactionManager = null;
    }
    if (this.readline) {
      this.readline.close();
      this.readline = null;
    }
  }

  private async promptForInput(): Promise<string> {
    const prompt = this.generatePrompt();
    return new Promise((resolve) => {
      this.readline!.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }

  private generatePrompt(): string {
    const contextColor = this.getContextColor();
    const contextLabel = this.getContextLabel();
    return chalk[contextColor](`${contextLabel}> `);
  }

  private getContextColor(): 'blue' | 'green' | 'yellow' | 'cyan' | 'magenta' {
    switch (this.currentContext.level) {
      case 'config': return 'green';
      case 'templates': return 'yellow';
      case 'advanced': return 'cyan';
      case 'generate': return 'magenta';
      default: return 'blue';
    }
  }

  private getContextLabel(): string {
    const breadcrumb = this.currentContext.breadcrumb.slice(1).join(' > ');
    return breadcrumb || 'Phoenix';
  }

  private async processCommand(input: string): Promise<void> {
    if (!input) return;

    // Validate input first
    const validation = this.inputValidator.validate(input, this.currentContext);
    if (!validation.valid) {
      console.log(chalk.red('❌ Invalid input:'));
      validation.errors.forEach(error => console.log(chalk.red(`  • ${error}`)));
      
      // Show suggestions if available
      const suggestions = this.inputValidator.suggest?.(input, this.currentContext);
      if (suggestions && suggestions.length > 0) {
        console.log(chalk.yellow('\n💡 Did you mean:'));
        suggestions.forEach(suggestion => console.log(chalk.yellow(`  • ${suggestion}`)));
      }
      return;
    }

    // Show warnings if any
    if (validation.warnings && validation.warnings.length > 0) {
      validation.warnings.forEach(warning => console.log(chalk.yellow(`⚠️ ${warning}`)));
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

  private async handleGlobalCommands(input: string): Promise<boolean> {
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
        } else {
          console.log(chalk.yellow('Already at main menu'));
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

  private async handleContextCommands(input: string): Promise<void> {
    const action = await this.menuSystem.processContextCommand(input, this.currentContext);
    
    if (action) {
      switch (action.type) {
        case 'navigate':
          await this.navigateToContext(action.target!, action.data);
          break;
        case 'execute':
          await this.executeAction(action.target!, action.data);
          break;
        case 'back':
          await this.navigateBack();
          break;
        case 'exit':
          this.running = false;
          break;
      }
    } else {
      // Enhanced error message with suggestions
      const suggestions = this.inputValidator.suggest?.(input, this.currentContext) || [];
      console.log(chalk.red(`❌ Unknown command: ${chalk.bold(input)}`));
      
      if (suggestions.length > 0) {
        console.log(chalk.yellow('\n💡 Did you mean:'));
        suggestions.slice(0, 3).forEach(suggestion => {
          console.log(chalk.yellow(`  • ${suggestion}`));
        });
      } else {
        console.log(chalk.gray('Type "help" for available commands'));
      }
    }
  }

  private async navigateToContext(target: string, data?: any): Promise<void> {
    // Save current context to history for back navigation
    this.currentContext.history.push(`nav:${this.currentContext.level}`);
    
    // Update context
    const previousLevel = this.currentContext.level;
    this.currentContext.level = target as any;
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

  private async navigateBack(): Promise<void> {
    if (this.currentContext.breadcrumb.length > 1) {
      this.currentContext.breadcrumb.pop();
      
      // Determine parent context
      const parentLevel = this.currentContext.breadcrumb.length === 1 ? 'main' : 
        this.getContextLevelFromDisplayName(this.currentContext.breadcrumb[this.currentContext.breadcrumb.length - 1]);
      
      this.currentContext.level = parentLevel as any;
      
      console.clear();
      this.showHeader();
      await this.menuSystem.showContextualMenu(this.currentContext);
    }
  }

  private async navigateToMain(): Promise<void> {
    this.currentContext.level = 'main';
    this.currentContext.breadcrumb = ['Phoenix Code Lite'];
    this.currentContext.currentItem = undefined;
    
    console.clear();
    this.showHeader();
    await this.menuSystem.showContextualMenu(this.currentContext);
  }

  private async executeAction(action: string, data?: any): Promise<void> {
    // Import and execute appropriate command
    try {
      const { executeSessionAction } = await import('./enhanced-commands');
      await executeSessionAction(action, data, this.currentContext);
    } catch (error) {
      await this.errorHandler.handleError(error, this.currentContext, `executing action: ${action}`);
      await this.waitForEnter();
    }
  }

  private getContextDisplayName(level: string): string {
    const names: Record<string, string> = {
      'config': 'Configuration',
      'templates': 'Templates',
      'advanced': 'Advanced',
      'generate': 'Generate'
    };
    return names[level] || level;
  }

  private getContextLevelFromDisplayName(displayName: string): string {
    const levels: Record<string, string> = {
      'Configuration': 'config',
      'Templates': 'templates',
      'Advanced': 'advanced',
      'Generate': 'generate'
    };
    return levels[displayName] || 'main';
  }

  private showHeader(): void {
    const title = this.menuSystem?.generateTitle(this.currentContext) || '🔥 Phoenix Code Lite';
    console.log(chalk.red.bold(title));
    console.log(chalk.gray('═'.repeat(70)));
    
    if (this.currentContext.breadcrumb.length > 1) {
      const breadcrumbStr = this.currentContext.breadcrumb.join(' › ');
      console.log(chalk.blue('📍 Navigation: ') + chalk.gray(breadcrumbStr));
      console.log(chalk.gray('─'.repeat(70)));
    }
    
    console.log();
  }

  private showHelp(): void {
    console.log(chalk.blue.bold('\n📚 Phoenix Code Lite Help System'));
    console.log(chalk.gray('═'.repeat(70)));
    
    console.log(chalk.yellow.bold('🌐 Global Commands:'));
    console.log(chalk.cyan('  help     ') + chalk.gray('- Show this comprehensive help system'));
    console.log(chalk.cyan('  clear    ') + chalk.gray('- Clear screen and refresh display'));
    console.log(chalk.cyan('  back     ') + chalk.gray('- Navigate to previous menu level'));
    console.log(chalk.cyan('  home     ') + chalk.gray('- Return to main menu hub'));
    console.log(chalk.cyan('  quit     ') + chalk.gray('- Exit Phoenix Code Lite gracefully'));
    console.log();
    
    console.log(chalk.yellow.bold('🧭 Navigation Commands:'));
    console.log(chalk.green('  config     ') + chalk.gray('- Project configuration and settings management'));
    console.log(chalk.green('  templates  ') + chalk.gray('- Configuration templates (Starter, Enterprise, Performance)'));
    console.log(chalk.green('  generate   ') + chalk.gray('- AI-powered TDD code generation workflow'));
    console.log(chalk.green('  advanced   ') + chalk.gray('- Expert settings, debugging, and metrics'));
    console.log();
    
    if (this.currentContext.level !== 'main') {
      console.log(chalk.yellow.bold(`🎯 Context Commands (${this.getContextDisplayName(this.currentContext.level)}):`));
      this.menuSystem?.showContextHelp(this.currentContext);
      console.log();
    }
    
    console.log(chalk.blue.bold('💡 Pro Tips:'));
    console.log(chalk.gray('  • Commands are case-insensitive and support partial matching'));
    console.log(chalk.gray('  • Use numbers (1, 2, 3, 4) as shortcuts for menu navigation'));
    console.log(chalk.gray('  • Context-aware help adapts to your current location'));
    console.log(chalk.gray('  • All TDD workflows include Plan → Implement → Refactor phases'));
    
    console.log(chalk.gray('═'.repeat(70)));
  }

  private async confirmExit(): Promise<void> {
    console.log(chalk.yellow('\nAre you sure you want to exit? (y/N)'));
    const input = await this.promptForInput();
    
    if (input.toLowerCase() === 'y' || input.toLowerCase() === 'yes') {
      console.log(chalk.blue('👋 Thanks for using Phoenix Code Lite!'));
      this.running = false;
    }
  }

  private async waitForEnter(): Promise<void> {
    return new Promise((resolve) => {
      this.readline!.question(chalk.gray('Press Enter to continue...'), () => {
        resolve();
      });
    });
  }

  public getCurrentContext(): SessionContext {
    return { ...this.currentContext };
  }

  public updateContext(updates: Partial<SessionContext>): void {
    this.currentContext = { ...this.currentContext, ...updates };
  }

  public setInputValidator(validator: InputValidator): void {
    this.inputValidator = validator;
  }

  public setErrorHandler(handler: ErrorHandler): void {
    this.errorHandler = handler;
  }
}

class InputValidationService implements InputValidator {
  validate(input: string, context: SessionContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

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

  suggest(input: string, context: SessionContext): string[] {
    const suggestions: string[] = [];
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

  private containsSuspiciousPatterns(input: string): boolean {
    const suspiciousPatterns = [
      /\.\.\//,  // Path traversal
      /<script/i, // Script injection
      /javascript:/i, // JavaScript protocol
      /eval\(/,   // Eval function
      /\$\(/,     // Command substitution
      /`/,        // Backticks
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  private validateTemplateInput(input: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

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

  private getContextCommands(context: SessionContext): string[] {
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

  private getNumberedCommands(context: SessionContext): string[] {
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

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
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
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

class ErrorHandler {
  async handleError(error: unknown, context: SessionContext, operation?: string): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorType = this.categorizeError(error);
    
    console.log();
    console.log(chalk.red('❌ Error occurred'));
    
    if (operation) {
      console.log(chalk.gray(`   Operation: ${operation}`));
    }
    
    console.log(chalk.gray(`   Context: ${context.level}`));
    console.log(chalk.red(`   Message: ${errorMessage}`));
    
    // Provide contextual help based on error type
    switch (errorType) {
      case 'validation':
        console.log(chalk.yellow('\n💡 This looks like a validation error. Check your input format.'));
        break;
      case 'file':
        console.log(chalk.yellow('\n💡 This appears to be a file system error. Check file permissions and paths.'));
        break;
      case 'network':
        console.log(chalk.yellow('\n💡 This seems to be a network-related error. Check your connection.'));
        break;
      case 'config':
        console.log(chalk.yellow('\n💡 Configuration error detected. Try resetting to default template.'));
        break;
      default:
        console.log(chalk.yellow('\n💡 For help, type "help" or visit the documentation.'));
    }
    
    // Suggest recovery actions
    const recoveryActions = this.getRecoveryActions(errorType, context);
    if (recoveryActions.length > 0) {
      console.log(chalk.blue('\n🔧 Suggested actions:'));
      recoveryActions.forEach(action => console.log(chalk.blue(`   • ${action}`)));
    }
    
    console.log();
  }

  private categorizeError(error: unknown): string {
    if (!(error instanceof Error)) return 'unknown';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('validation') || message.includes('invalid')) return 'validation';
    if (message.includes('file') || message.includes('ENOENT') || message.includes('permission')) return 'file';
    if (message.includes('network') || message.includes('connection') || message.includes('timeout')) return 'network';
    if (message.includes('config') || message.includes('template')) return 'config';
    
    return 'unknown';
  }

  private getRecoveryActions(errorType: string, context: SessionContext): string[] {
    const actions: string[] = [];
    
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
    } else if (context.level === 'config') {
      actions.push('View current configuration with "show" command');
    }
    
    return actions;
  }
}