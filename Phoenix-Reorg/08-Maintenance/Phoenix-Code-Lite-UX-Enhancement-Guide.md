# Phoenix Code Lite UX Enhancement Implementation Guide

## =� Overview

This comprehensive guide documents the implementation of 17 UX improvements for Phoenix Code Lite, transforming it from a mixed command/menu interface to a cohesive, user-friendly CLI experience with dual interaction modes and enhanced navigation.

## <� Change Summary

### Core Transformation

Convert Phoenix Code Lite from a confusing mixed interface to a professional CLI with:

- **Dual Interaction Modes**: Menu Mode (arrow navigation) vs Command Mode (text commands)
- **Consistent Navigation**: Numbered options, ESC/back support, breadcrumb elimination
- **Enhanced User Experience**: Improved wizards, template management, and help system
- **Architectural Improvements**: Session management, mode switching, and context preservation

## =� Implementation Roadmap

### Phase 1: Core Infrastructure (Issues 1-6)

**Priority**: Critical - Foundation for all other improvements
**Estimated Time**: 8-12 hours
**Components**: Session management, dual mode architecture, navigation system

### Phase 2: Navigation & User Experience (Issues 7-10)

**Priority**: High - Direct user interaction improvements
**Estimated Time**: 6-8 hours
**Components**: Menu numbering, ESC handling, template management

### Phase 3: Help System & Command Interface (Issues 11-13)

**Priority**: Medium - Interface consistency and accessibility
**Estimated Time**: 4-6 hours
**Components**: Help command fixes, main menu presentation, mode selection

### Phase 4: Enhanced Wizard System (Issues 14-16)

**Priority**: Medium - First-time user experience
**Estimated Time**: 6-10 hours
**Components**: Improved setup wizard, project templates, menu reorganization

### Phase 5: Advanced Features (Issue 17)

**Priority**: Low - Future enhancement
**Estimated Time**: 8-12 hours
**Components**: Per-agent document management system

## =' Detailed Implementation Plan

### Phase 1: Core Infrastructure

#### Issue 1: Agent Information Display

**Problem**: Agent info needs separate page in Config show menu
**Solution**: Create dedicated agent information display page

**Implementation**:

```typescript
// src/cli/enhanced-commands.ts - Add agent info action
async function executeAgentInfoAction(context: SessionContext): Promise<void> {
  console.log(chalk.green.bold('\n> Agent Information'));
  console.log(chalk.gray('P'.repeat(50)));
  
  const config = await PhoenixCodeLiteConfig.load();
  const agentSettings = config.data.tdd?.agents || {};
  
  // Display each agent's configuration
  Object.entries(agentSettings).forEach(([agentName, settings]) => {
    console.log(chalk.cyan(`\n=� ${agentName.charAt(0).toUpperCase() + agentName.slice(1)} Agent:`));
    console.log(`  Model: ${settings.model || 'Default'}`);
    console.log(`  Max Tokens: ${settings.maxTokens || 'Default'}`);
    console.log(`  Temperature: ${settings.temperature || 'Default'}`);
  });
  
  console.log(chalk.gray('\nPress Enter to continue...'));
  await new Promise(resolve => process.stdin.once('data', resolve));
}
```

#### Issue 2: Menu Exit Prevention

**Problem**: "Press Enter to continue..." exits Phoenix CLI session
**Solution**: Implement proper session continuation instead of process exit

**Implementation**:

```typescript
// src/cli/session.ts - Modify pause handling
async function pauseForUser(message: string = 'Press Enter to continue...'): Promise<void> {
  console.log(chalk.gray(`\n${message}`));
  
  return new Promise((resolve) => {
    const stdin = process.stdin;
    stdin.resume();
    stdin.setEncoding('utf8');
    
    const handleInput = () => {
      stdin.removeListener('data', handleInput);
      stdin.pause();
      resolve();
    };
    
    stdin.once('data', handleInput);
  });
}

// Replace all process.exit() calls with session continuation
async function returnToMainMenu(): Promise<void> {
  // Instead of process.exit(), return to main menu
  this.navigationStack = []; // Clear navigation
  await this.displayMainMenu();
}
```

#### Issue 3: Pre-filled "e" Character

**Problem**: Letter "e" appears when entering Phoenix CLI
**Solution**: Clear stdin buffer on CLI initialization

**Implementation**:

```typescript
// src/cli/session.ts - Clear input buffer on start
constructor() {
  // Clear any existing input buffer
  if (process.stdin.readable) {
    process.stdin.read();
  }
  
  // Set up clean input handling
  process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stdin.resume();
}
```

#### Issue 4: Dual Mode Architecture

**Problem**: Current interface mixes menu and command modes confusingly
**Solution**: Implement distinct Menu Mode and Command Mode with user choice

**Implementation**:

```typescript
// src/types/interaction.ts - New interface types
export interface InteractionModeConfig {
  mode: 'menu' | 'command';
  allowModeSwitch: boolean;
  menuStyle: 'numbered' | 'arrows';
  commandPrompt: string;
}

// src/cli/interaction-manager.ts - New interaction manager
export class InteractionManager {
  private currentMode: 'menu' | 'command' = 'menu';
  private config: InteractionModeConfig;
  
  constructor(config: InteractionModeConfig) {
    this.config = config;
    this.currentMode = config.mode;
  }
  
  async displayMenuMode(options: MenuOption[]): Promise<string> {
    // Display numbered menu with arrow navigation
    console.log(chalk.cyan('\n=� Select an option:'));
    options.forEach((option, index) => {
      console.log(`${chalk.yellow((index + 1).toString())}. ${option.label}`);
    });
    
    console.log(chalk.gray('\nUse arrow keys, number keys, or type command'));
    console.log(chalk.gray('Press "c" for command mode, "ESC" or "back" to go back'));
    
    return await this.handleMenuInput(options);
  }
  
  async displayCommandMode(commands: CommandInfo[]): Promise<string> {
    // Display command list with text input
    console.log(chalk.cyan('\n=� Available Commands:'));
    commands.forEach((cmd, index) => {
      console.log(`${chalk.yellow((index + 1).toString())}. ${chalk.cyan(cmd.name)} - ${cmd.description}`);
    });
    
    console.log(chalk.gray('\nType command name or number, "m" for menu mode, "back" to go back'));
    console.log(chalk.gray('Phoenix> '), { noNewLine: true });
    
    return await this.handleCommandInput(commands);
  }
  
  switchMode(): void {
    this.currentMode = this.currentMode === 'menu' ? 'command' : 'menu';
    console.log(chalk.green(`\n= Switched to ${this.currentMode.toUpperCase()} mode`));
  }
}
```

#### Issue 5: Breadcrumb Navigation Removal

**Problem**: Redundant breadcrumb "Phoenix Code Lite > Advanced" display
**Solution**: Remove intermediate breadcrumbs, keep only main title and current section

**Implementation**:

```typescript
// src/cli/menu-system.ts - Simplified header display
displayHeader(sectionTitle: string, showBreadcrumb: boolean = false): void {
  console.clear();
  console.log(chalk.red('=% Phoenix Code Lite Interactive CLI'));
  console.log(chalk.gray('P'.repeat(50)));
  
  // Only show section title, no breadcrumb
  if (sectionTitle) {
    console.log(chalk.cyan(`${sectionTitle}`));
    console.log(chalk.gray('P'.repeat(50)));
  }
}
```

#### Issue 6: Consistent Help Command

**Problem**: Repeated help command shows unnecessary navigation text
**Solution**: Clean help display focusing on available commands

**Implementation**:

```typescript
// src/cli/help-system.ts - Streamlined help display
displayHelp(commands: CommandInfo[], context?: string): void {
  console.clear();
  console.log(chalk.red('=% Phoenix Code Lite Interactive CLI'));
  console.log(chalk.gray('P'.repeat(50)));
  console.log(chalk.cyan('=� Available Commands:'));
  console.log(chalk.gray('P'.repeat(50)));
  
  commands.forEach((cmd, index) => {
    console.log(`${chalk.yellow((index + 1).toString().padStart(2))}. ${chalk.cyan(cmd.name.padEnd(12))} - ${cmd.description}`);
  });
  
  console.log(chalk.gray('\nP'.repeat(50)));
  if (context) {
    console.log(chalk.gray(`Context: ${context}`));
  }
}
```

### Phase 2: Navigation & User Experience

#### Issue 7: ESC Key Handling

**Problem**: ESC key doesn't work for going back
**Solution**: Implement proper ESC key detection and handling

**Implementation**:

```typescript
// src/cli/input-handler.ts - ESC key handling
export class InputHandler {
  private setupKeyHandling(): void {
    process.stdin.on('keypress', (str, key) => {
      if (key && key.name === 'escape') {
        this.handleBackNavigation();
      }
    });
  }
  
  private async handleBackNavigation(): Promise<void> {
    if (this.navigationStack.length > 0) {
      const previousScreen = this.navigationStack.pop();
      await this.navigateToScreen(previousScreen);
    } else {
      await this.showMainMenu();
    }
  }
  
  async waitForInput(): Promise<string> {
    return new Promise((resolve) => {
      const keypress = require('keypress');
      keypress(process.stdin);
      
      process.stdin.on('keypress', (ch, key) => {
        if (key && key.ctrl && key.name === 'c') {
          process.exit();
        }
        
        if (key && key.name === 'escape') {
          resolve('back');
        }
        
        if (key && key.name === 'return') {
          resolve(this.currentInput.trim());
        }
        
        // Handle other key inputs...
      });
    });
  }
}
```

#### Issue 8: Numbered Menu Options

**Problem**: Menu options lack numbers for quick selection
**Solution**: Add numbered options (1-9, then 10+) with number key support

**Implementation**:

```typescript
// src/cli/menu-renderer.ts - Numbered menu rendering
export class MenuRenderer {
  renderNumberedMenu(options: MenuOption[], title: string): void {
    console.log(chalk.cyan(`\n${title}`));
    console.log(chalk.gray('P'.repeat(50)));
    
    options.forEach((option, index) => {
      const number = (index + 1).toString();
      const padding = number.length === 1 ? ' ' : '';
      console.log(`${chalk.yellow(padding + number)}. ${option.label}`);
      
      if (option.description) {
        console.log(`   ${chalk.gray(option.description)}`);
      }
    });
    
    console.log(chalk.gray('\nP'.repeat(50)));
    console.log(chalk.gray('Type number, command name, or "back"/"home"'));
  }
  
  async handleNumberedInput(options: MenuOption[]): Promise<string> {
    const input = await this.getInput();
    
    // Check if input is a number
    const num = parseInt(input);
    if (!isNaN(num) && num >= 1 && num <= options.length) {
      return options[num - 1].value;
    }
    
    // Check if input matches an option by name
    const matchedOption = options.find(opt => 
      opt.value.toLowerCase() === input.toLowerCase() ||
      opt.label.toLowerCase().includes(input.toLowerCase())
    );
    
    if (matchedOption) {
      return matchedOption.value;
    }
    
    // Handle special commands
    if (['back', 'home', 'quit', 'exit'].includes(input.toLowerCase())) {
      return input.toLowerCase();
    }
    
    console.log(chalk.red(`Invalid option: ${input}`));
    return await this.handleNumberedInput(options);
  }
}
```

#### Issue 9: Template Management Fix

**Problem**: Template reset/edit doesn't provide template selection
**Solution**: Implement proper template selection flow

**Implementation**:

```typescript
// src/cli/template-manager.ts - Enhanced template management
export class TemplateManager {
  async handleTemplateReset(): Promise<void> {
    const templates = ConfigurationTemplates.getAvailableTemplates();
    const options = Object.keys(templates).map(name => ({
      label: `${name.charAt(0).toUpperCase() + name.slice(1)} Template`,
      value: name,
      description: templates[name].description || 'Template configuration'
    }));
    
    console.log(chalk.cyan('\n= Reset Template Configuration'));
    console.log(chalk.gray('P'.repeat(50)));
    console.log(chalk.yellow('Select template to reset:'));
    
    const renderer = new MenuRenderer();
    renderer.renderNumberedMenu(options, '');
    
    const selection = await renderer.handleNumberedInput(options);
    
    if (selection && selection !== 'back') {
      await this.resetTemplate(selection);
      console.log(chalk.green(` Template '${selection}' has been reset`));
    }
  }
  
  async handleTemplateEdit(): Promise<void> {
    const templates = ConfigurationTemplates.getAvailableTemplates();
    const options = Object.keys(templates).map(name => ({
      label: `Edit ${name.charAt(0).toUpperCase() + name.slice(1)} Template`,
      value: name,
      description: `Modify ${name} template settings`
    }));
    
    console.log(chalk.cyan('\n Edit Template Configuration'));
    console.log(chalk.gray('P'.repeat(50)));
    
    const renderer = new MenuRenderer();
    renderer.renderNumberedMenu(options, '');
    
    const selection = await renderer.handleNumberedInput(options);
    
    if (selection && selection !== 'back') {
      await this.openTemplateEditor(selection);
    }
  }
}
```

#### Issue 10: Debug Settings Editability

**Problem**: Debug options in Advanced Settings aren't editable
**Solution**: Make debug settings interactive with proper editing interface

**Implementation**:

```typescript
// src/cli/debug-settings.ts - Editable debug settings
export class DebugSettingsManager {
  async displayDebugSettings(): Promise<void> {
    const config = await PhoenixCodeLiteConfig.load();
    const debugSettings = config.data.debugging || {};
    
    const options = [
      {
        label: `Verbose Mode: ${debugSettings.verbose ? 'ON' : 'OFF'}`,
        value: 'verbose',
        description: 'Enable detailed logging output'
      },
      {
        label: `Log Level: ${debugSettings.logLevel || 'INFO'}`,
        value: 'logLevel',
        description: 'Set logging level (DEBUG, INFO, WARN, ERROR)'
      },
      {
        label: `Debug File Output: ${debugSettings.fileOutput ? 'ON' : 'OFF'}`,
        value: 'fileOutput',
        description: 'Save debug logs to file'
      },
      {
        label: 'Back to Advanced Settings',
        value: 'back',
        description: 'Return to previous menu'
      }
    ];
    
    console.log(chalk.cyan('\n= Debug Settings'));
    console.log(chalk.gray('P'.repeat(50)));
    
    const renderer = new MenuRenderer();
    renderer.renderNumberedMenu(options, '');
    
    const selection = await renderer.handleNumberedInput(options);
    await this.handleDebugSettingChange(selection, config);
  }
  
  private async handleDebugSettingChange(setting: string, config: PhoenixCodeLiteConfig): Promise<void> {
    switch (setting) {
      case 'verbose':
        config.data.debugging.verbose = !config.data.debugging.verbose;
        await config.save();
        console.log(chalk.green(` Verbose mode ${config.data.debugging.verbose ? 'enabled' : 'disabled'}`));
        break;
        
      case 'logLevel':
        const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
        console.log(chalk.cyan('Select log level:'));
        levels.forEach((level, index) => {
          console.log(`${index + 1}. ${level}`);
        });
        
        const input = await this.getInput();
        const levelIndex = parseInt(input) - 1;
        if (levelIndex >= 0 && levelIndex < levels.length) {
          config.data.debugging.logLevel = levels[levelIndex];
          await config.save();
          console.log(chalk.green(` Log level set to ${levels[levelIndex]}`));
        }
        break;
        
      case 'fileOutput':
        config.data.debugging.fileOutput = !config.data.debugging.fileOutput;
        await config.save();
        console.log(chalk.green(` File output ${config.data.debugging.fileOutput ? 'enabled' : 'disabled'}`));
        break;
    }
    
    if (setting !== 'back') {
      await this.displayDebugSettings(); // Refresh the menu
    }
  }
}
```

### Phase 3: Help System & Command Interface

#### Issue 11: Help Command Fix

**Problem**: -h/--help subcommand doesn't work
**Solution**: Restore proper help command handling in argument parser

**Implementation**:

```typescript
// src/cli/args.ts - Fix help command handling
export function parseArguments(): PhoenixCodeLiteOptions {
  const program = new Command();
  
  program
    .name('phoenix-code-lite')
    .description('TDD Workflow Orchestrator for Claude Code')
    .version('1.0.0')
    .helpOption('-h, --help', 'Display help information')
    .addHelpCommand('help [command]', 'Display help for command');
  
  // Override help handling to work within session
  program.configureHelp({
    sortSubcommands: true,
    subcommandTerm: (cmd) => cmd.name()
  });
  
  // Ensure help works in both traditional and interactive modes
  program.hook('preAction', (thisCommand, actionCommand) => {
    if (process.argv.includes('-h') || process.argv.includes('--help')) {
      thisCommand.outputHelp();
      if (process.env.PHOENIX_INTERACTIVE_MODE !== 'true') {
        process.exit(0);
      }
      return; // Don't exit in interactive mode
    }
  });
  
  return program.parse().opts() as PhoenixCodeLiteOptions;
}
```

#### Issue 12: Main Menu Display on Entry

**Problem**: User should see main menu immediately on CLI entry
**Solution**: Show main menu automatically based on selected interaction mode

**Implementation**:

```typescript
// src/cli/session.ts - Auto-display main menu
async start(): Promise<void> {
  try {
    console.clear();
    this.displayWelcome();
    
    // Load user's preferred interaction mode
    const config = await PhoenixCodeLiteConfig.load();
    const interactionMode = config.data.ui?.interactionMode || 'menu';
    
    this.interactionManager = new InteractionManager({
      mode: interactionMode,
      allowModeSwitch: true,
      menuStyle: 'numbered',
      commandPrompt: 'Phoenix> '
    });
    
    // Automatically display main menu
    await this.displayMainMenu();
    
  } catch (error) {
    console.error(chalk.red('Failed to start Phoenix CLI:'), error);
    process.exit(1);
  }
}

private async displayMainMenu(): Promise<void> {
  const mainMenuOptions = [
    { label: 'Generate Code', value: 'generate', description: 'Start TDD workflow for new code' },
    { label: 'Configuration', value: 'config', description: 'Manage settings and templates' },
    { label: 'Templates', value: 'templates', description: 'Manage project templates' },
    { label: 'Advanced Settings', value: 'advanced', description: 'Advanced configuration options' },
    { label: 'Help', value: 'help', description: 'Show available commands' },
    { label: 'Quit', value: 'quit', description: 'Exit Phoenix Code Lite' }
  ];
  
  if (this.interactionManager.currentMode === 'menu') {
    await this.interactionManager.displayMenuMode(mainMenuOptions);
  } else {
    const commands = mainMenuOptions.map(opt => ({
      name: opt.value,
      description: opt.description
    }));
    await this.interactionManager.displayCommandMode(commands);
  }
}
```

#### Issue 13: Interaction Mode Selection in Setup

**Problem**: User should choose interaction mode during initial setup
**Solution**: Add mode selection to setup wizard and init command

**Implementation**:

```typescript
// src/cli/interactive.ts - Add mode selection to wizard
async runSetupWizard(): Promise<SetupResult> {
  console.log(chalk.green.bold('=� Phoenix Code Lite Setup Wizard'));
  console.log(chalk.gray('P'.repeat(50)));
  
  // First question: Interaction mode preference
  const modeChoice = await this.askInteractionMode();
  
  // Continue with existing wizard questions...
  const languageChoice = await this.askLanguagePreference();
  const frameworkChoice = await this.askFrameworkPreference(languageChoice);
  const projectPath = await this.askProjectPath();
  
  const setupConfig = {
    interactionMode: modeChoice,
    language: languageChoice,
    framework: frameworkChoice,
    projectPath: projectPath,
    // ... other setup data
  };
  
  await this.saveSetupConfiguration(setupConfig);
  
  return {
    success: true,
    config: setupConfig,
    nextSteps: this.generateNextSteps(setupConfig)
  };
}

private async askInteractionMode(): Promise<'menu' | 'command'> {
  console.log(chalk.cyan('\n<� Choose your preferred interaction mode:'));
  console.log('1. Menu Mode - Navigate with arrow keys and numbered options');
  console.log('2. Command Mode - Type commands directly');
  console.log(chalk.gray('\nYou can change this later in Advanced Settings'));
  
  const choice = await this.promptUser('Select mode (1-2):', '1');
  return choice === '2' ? 'command' : 'menu';
}
```

### Phase 4: Enhanced Wizard System

#### Issue 14: Stack Knowledge Question

**Problem**: Wizard assumes user knows their technology stack
**Solution**: Add preliminary question about stack knowledge with different paths

**Implementation**:

```typescript
// src/cli/enhanced-wizard.ts - Stack knowledge question
export class EnhancedSetupWizard {
  async runEnhancedSetupWizard(): Promise<SetupResult> {
    console.log(chalk.green.bold('=� Phoenix Code Lite Enhanced Setup'));
    console.log(chalk.gray('P'.repeat(50)));
    
    // Preliminary stack knowledge question
    const knowsStack = await this.askStackKnowledge();
    
    if (knowsStack) {
      return await this.runKnownStackWizard();
    } else {
      return await this.runProjectDiscoveryWizard();
    }
  }
  
  private async askStackKnowledge(): Promise<boolean> {
    console.log(chalk.cyan('\nS Do you know what technology stack you\'ll be using?'));
    console.log('1. Yes - I know my languages, frameworks, and tools');
    console.log('2. No - I need help deciding based on my project');
    console.log('3. Partially - I have some ideas but need guidance');
    
    const choice = await this.promptUser('Select option (1-3):', '1');
    return choice === '1';
  }
  
  private async runKnownStackWizard(): Promise<SetupResult> {
    // Enhanced version of existing wizard with "Other" options
    const languageChoice = await this.askLanguageWithOther();
    const frameworkChoice = await this.askFrameworkWithOther(languageChoice);
    const testingChoice = await this.askTestingFrameworkWithOther(languageChoice);
    
    const config = {
      language: languageChoice,
      framework: frameworkChoice,
      testing: testingChoice,
      stackKnowledge: 'known'
    };
    
    await this.displayStackSummary(config);
    return { success: true, config, nextSteps: [] };
  }
  
  private async askLanguageWithOther(): Promise<string> {
    const languages = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Java', 'Other'];
    
    console.log(chalk.cyan('\n=� What programming language will you use?'));
    languages.forEach((lang, index) => {
      console.log(`${index + 1}. ${lang}`);
    });
    
    const choice = await this.promptUser('Select language (1-6):', '1');
    const selectedIndex = parseInt(choice) - 1;
    
    if (selectedIndex === languages.length - 1) { // "Other" selected
      return await this.promptUser('Specify language:', '');
    }
    
    return languages[selectedIndex] || languages[0];
  }
  
  private async displayStackSummary(config: any): Promise<void> {
    console.log(chalk.green.bold('\n=� Your Technology Stack Summary'));
    console.log(chalk.gray('P'.repeat(50)));
    console.log(`Language: ${chalk.cyan(config.language)}`);
    console.log(`Framework: ${chalk.cyan(config.framework)}`);
    console.log(`Testing: ${chalk.cyan(config.testing)}`);
    console.log(chalk.gray('P'.repeat(50)));
    console.log(chalk.green(' Configuration saved successfully!'));
  }
}
```

#### Issue 15: Project Discovery Wizard

**Problem**: No path for users who don't know their stack
**Solution**: Create discovery wizard with project-focused questions

**Implementation**:

```typescript
// src/cli/project-discovery-wizard.ts - Project-focused wizard
export class ProjectDiscoveryWizard {
  async runDiscoveryWizard(): Promise<SetupResult> {
    console.log(chalk.blue.bold('\n=
 Project Discovery Wizard'));
    console.log(chalk.gray('Let\'s learn about your project to suggest the best stack'));
    console.log(chalk.gray('P'.repeat(50)));
    
    const projectInfo = await this.gatherProjectInfo();
    const stackRecommendation = await this.generateStackRecommendation(projectInfo);
    const finalConfig = await this.confirmStackChoice(stackRecommendation, projectInfo);
    
    await this.saveCurrentProjectTemplate(finalConfig);
    
    return {
      success: true,
      config: finalConfig,
      nextSteps: this.generateProjectNextSteps(finalConfig)
    };
  }
  
  private async gatherProjectInfo(): Promise<ProjectInfo> {
    const projectType = await this.askProjectType();
    const targetAudience = await this.askTargetAudience();
    const complexity = await this.askComplexity();
    const timeframe = await this.askTimeframe();
    const teamSize = await this.askTeamSize();
    const experience = await this.askExperience();
    
    return {
      type: projectType,
      audience: targetAudience,
      complexity,
      timeframe,
      teamSize,
      experience
    };
  }
  
  private async askProjectType(): Promise<string> {
    console.log(chalk.cyan('\n<� What type of project are you building?'));
    const types = [
      'Web Application (Frontend + Backend)',
      'Frontend Only (SPA, React, Vue, etc.)',
      'Backend API/Service',
      'Desktop Application',
      'Mobile Application',
      'CLI Tool/Script',
      'Library/Package',
      'Data Analysis/ML Project',
      'Other'
    ];
    
    types.forEach((type, index) => {
      console.log(`${index + 1}. ${type}`);
    });
    
    const choice = await this.promptUser('Select project type (1-9):', '1');
    const index = parseInt(choice) - 1;
    return types[index] || types[0];
  }
  
  private async generateStackRecommendation(projectInfo: ProjectInfo): Promise<StackRecommendation> {
    // Stack recommendation logic based on project info
    const recommendations = {
      'Web Application (Frontend + Backend)': {
        language: 'TypeScript',
        frontend: 'React',
        backend: 'Node.js/Express',
        database: 'PostgreSQL',
        testing: 'Jest + Cypress',
        rationale: 'Full-stack TypeScript provides consistency and strong typing'
      },
      'Frontend Only (SPA, React, Vue, etc.)': {
        language: 'TypeScript',
        framework: 'React',
        testing: 'Jest + Testing Library',
        bundler: 'Vite',
        rationale: 'Modern React stack with excellent DX and performance'
      },
      // ... more recommendations
    };
    
    return recommendations[projectInfo.type] || recommendations['Web Application (Frontend + Backend)'];
  }
  
  private async saveCurrentProjectTemplate(config: any): Promise<void> {
    const templateName = 'currentproject';
    const template = {
      ...config,
      name: 'Current Project Template',
      description: 'Generated from project discovery wizard',
      createdAt: new Date().toISOString()
    };
    
    // Save as new template
    await ConfigurationTemplates.saveCustomTemplate(templateName, template);
    console.log(chalk.green(` Saved as "${templateName}" template`));
  }
}
```

#### Issue 16: Menu Structure Reorganization

**Problem**: Template editing opens wrong configuration manager, duplicated/missing options
**Solution**: Reorganize menu structure with clear hierarchy mapping

**Implementation**:

```typescript
// src/cli/menu-hierarchy.ts - Menu structure definition
export class MenuHierarchy {
  private static menuStructure = {
    main: {
      title: '=% Phoenix Code Lite Interactive CLI',
      options: [
        { id: 'generate', label: 'Generate Code', target: 'generate' },
        { id: 'config', label: 'Configuration', target: 'configuration' },
        { id: 'templates', label: 'Templates', target: 'templates' },
        { id: 'advanced', label: 'Advanced Settings', target: 'advanced' },
        { id: 'help', label: 'Help', target: 'help' },
        { id: 'quit', label: 'Quit', target: 'quit' }
      ]
    },
    
    templates: {
      title: '=� Template Management',
      options: [
        { id: 'list', label: 'List Templates', target: 'templates.list' },
        { id: 'edit', label: 'Edit Template', target: 'templates.edit' },
        { id: 'reset', label: 'Reset Template', target: 'templates.reset' },
        { id: 'create', label: 'Create New Template', target: 'templates.create' },
        { id: 'back', label: 'Back to Main Menu', target: 'main' }
      ]
    },
    
    'templates.edit': {
      title: ' Edit Template Configuration',
      dynamic: true, // Content generated dynamically
      handler: 'templateEditHandler'
    },
    
    configuration: {
      title: '� Phoenix Code Lite Configuration',
      options: [
        { id: 'show', label: 'Show Current Config', target: 'config.show' },
        { id: 'edit', label: 'Edit Configuration', target: 'config.edit' },
        { id: 'framework', label: 'Framework Settings', target: 'config.framework' },
        { id: 'agents', label: 'Agent Information', target: 'config.agents' },
        { id: 'back', label: 'Back to Main Menu', target: 'main' }
      ]
    }
  };
  
  static getMenuDefinition(menuId: string): MenuDefinition {
    return this.menuStructure[menuId] || this.menuStructure.main;
  }
  
  static createMenuSchematic(): string {
    // Generate ASCII schematic of menu structure
    let schematic = 'Phoenix Code Lite Menu Structure\n';
    schematic += 'P'.repeat(40) + '\n\n';
    
    const generateBranch = (menuId: string, depth: number = 0): string => {
      const menu = this.menuStructure[menuId];
      if (!menu) return '';
      
      const indent = '  '.repeat(depth);
      let branch = `${indent}  ${menu.title}\n`;
      
      if (menu.options) {
        menu.options.forEach(option => {
          if (option.target && this.menuStructure[option.target]) {
            branch += generateBranch(option.target, depth + 1);
          } else {
            branch += `${indent}    ${option.label}\n`;
          }
        });
      }
      
      return branch;
    };
    
    schematic += generateBranch('main');
    return schematic;
  }
}

// src/cli/template-context-manager.ts - Specific template context handling
export class TemplateContextManager {
  async handleTemplateEdit(templateName?: string): Promise<void> {
    if (!templateName) {
      // Show template selection first
      templateName = await this.selectTemplate();
    }
    
    if (templateName && templateName !== 'back') {
      // Open template-specific configuration editor
      await this.openTemplateSpecificEditor(templateName);
    }
  }
  
  private async openTemplateSpecificEditor(templateName: string): Promise<void> {
    const template = await ConfigurationTemplates.getTemplate(templateName);
    
    console.log(chalk.cyan(`\n Editing ${templateName} Template`));
    console.log(chalk.gray('P'.repeat(50)));
    
    // Create context-specific editor, not general config editor
    const editor = new TemplateSpecificEditor(template);
    await editor.run();
  }
}
```

### Phase 5: Advanced Features

#### Issue 17: Per-Agent Document Management

**Problem**: Document management system needs per-agent and global document controls
**Solution**: Implement comprehensive document management with template-level activation

**Implementation**:

```typescript
// src/config/document-manager.ts - Document management system
export class DocumentManager {
  private documentsPath: string;
  
  constructor() {
    this.documentsPath = join(process.cwd(), '.phoenix-documents');
  }
  
  async initializeDocumentSystem(): Promise<void> {
    // Create document directory structure
    const dirs = [
      'global',
      'agents/planning-analyst',
      'agents/implementation-engineer', 
      'agents/quality-reviewer'
    ];
    
    for (const dir of dirs) {
      const fullPath = join(this.documentsPath, dir);
      await fs.mkdir(fullPath, { recursive: true });
    }
  }
  
  async getAvailableDocuments(): Promise<DocumentInventory> {
    const inventory: DocumentInventory = {
      global: await this.scanDocuments('global'),
      agents: {
        'planning-analyst': await this.scanDocuments('agents/planning-analyst'),
        'implementation-engineer': await this.scanDocuments('agents/implementation-engineer'),
        'quality-reviewer': await this.scanDocuments('agents/quality-reviewer')
      }
    };
    
    return inventory;
  }
  
  async getTemplateDocumentConfiguration(templateName: string): Promise<DocumentConfiguration> {
    const template = await ConfigurationTemplates.getTemplate(templateName);
    return template.documents || {
      global: {},
      agents: {
        'planning-analyst': {},
        'implementation-engineer': {},
        'quality-reviewer': {}
      }
    };
  }
  
  async updateTemplateDocumentConfiguration(
    templateName: string, 
    config: DocumentConfiguration
  ): Promise<void> {
    const template = await ConfigurationTemplates.getTemplate(templateName);
    template.documents = config;
    await ConfigurationTemplates.saveTemplate(templateName, template);
  }
}

// src/cli/document-configuration-editor.ts - Document configuration interface
export class DocumentConfigurationEditor {
  private documentManager: DocumentManager;
  
  constructor() {
    this.documentManager = new DocumentManager();
  }
  
  async editTemplateDocuments(templateName: string): Promise<void> {
    const inventory = await this.documentManager.getAvailableDocuments();
    const currentConfig = await this.documentManager.getTemplateDocumentConfiguration(templateName);
    
    console.log(chalk.cyan(`\n=� Document Configuration - ${templateName} Template`));
    console.log(chalk.gray('P'.repeat(50)));
    
    // Show global documents
    await this.editDocumentCategory('Global Documents', inventory.global, currentConfig.global);
    
    // Show agent-specific documents
    for (const [agentName, documents] of Object.entries(inventory.agents)) {
      const agentTitle = agentName.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') + ' Agent';
      
      await this.editDocumentCategory(agentTitle, documents, currentConfig.agents[agentName]);
    }
    
    await this.documentManager.updateTemplateDocumentConfiguration(templateName, currentConfig);
  }
  
  private async editDocumentCategory(
    categoryName: string, 
    availableDocuments: DocumentInfo[], 
    currentConfig: Record<string, boolean>
  ): Promise<void> {
    console.log(chalk.cyan(`\n=� ${categoryName}`));
    
    availableDocuments.forEach((doc, index) => {
      const isEnabled = currentConfig[doc.filename] || false;
      const status = isEnabled ? chalk.green(' ON') : chalk.gray('L OFF');
      console.log(`${index + 1}. ${doc.name} ${status}`);
      console.log(`   ${chalk.gray(doc.description)}`);
    });
    
    if (availableDocuments.length === 0) {
      console.log(chalk.gray('   No documents available in this category'));
    }
  }
}
```

## =' Technical Implementation Details

### Architecture Changes

#### Session Management Enhancement

```typescript
// src/cli/session.ts - Core session management
export class CLISession {
  private interactionManager: InteractionManager;
  private navigationStack: NavigationItem[] = [];
  private currentContext: SessionContext;
  
  constructor() {
    this.currentContext = {
      mode: 'menu',
      location: 'main',
      user: null,
      config: null
    };
  }
  
  async initializeSession(): Promise<void> {
    // Load user preferences
    const config = await PhoenixCodeLiteConfig.load();
    this.currentContext.config = config;
    this.currentContext.mode = config.data.ui?.interactionMode || 'menu';
    
    // Initialize interaction manager
    this.interactionManager = new InteractionManager({
      mode: this.currentContext.mode,
      allowModeSwitch: true,
      menuStyle: 'numbered',
      commandPrompt: 'Phoenix> '
    });
    
    // Clear any input buffer issues
    this.clearInputBuffer();
  }
  
  private clearInputBuffer(): void {
    // Fix for Issue #3 - pre-filled "e" character
    if (process.stdin.readable) {
      let data = '';
      while ((data = process.stdin.read()) !== null) {
        // Clear buffer
      }
    }
    
    process.stdin.setRawMode(true);
    process.stdin.setEncoding('utf8');
  }
}
```

#### Dual Mode Architecture

```typescript
// src/types/interaction-modes.ts - Mode definitions
export interface MenuModeConfig {
  showNumbers: boolean;
  allowArrowNavigation: boolean;
  showDescriptions: boolean;
  compactMode: boolean;
}

export interface CommandModeConfig {
  promptSymbol: string;
  showCommandList: boolean;
  autoComplete: boolean;
  historyEnabled: boolean;
}

export interface InteractionModeConfig {
  currentMode: 'menu' | 'command';
  menuConfig: MenuModeConfig;
  commandConfig: CommandModeConfig;
  allowModeSwitch: boolean;
}
```

### Quality Assurance Integration

#### TDD Implementation

Following the TDD standards from the guidance documents:

```typescript
// tests/integration/dual-mode-interface.test.ts
describe('Dual Mode Interface', () => {
  let session: CLISession;
  let mockInput: MockInputStream;
  
  beforeEach(() => {
    mockInput = new MockInputStream();
    session = new CLISession();
    // Setup test environment
  });
  
  it('should start in user-preferred mode', async () => {
    // Red: Test that user's saved preference is respected
    const config = new PhoenixCodeLiteConfig({
      ui: { interactionMode: 'command' }
    }, '');
    
    mockInput.push('help\n');
    const result = await session.handleUserInput();
    
    expect(result.mode).toBe('command');
    expect(result.display.includes('Phoenix> ')).toBe(true);
  });
  
  it('should allow mode switching with hotkey', async () => {
    // Red: Test mode switching functionality
    mockInput.push('m\n'); // Switch to menu mode
    
    const result = await session.handleModeSwitch();
    
    expect(result.newMode).toBe('menu');
    expect(result.success).toBe(true);
  });
});
```

#### Security Validation

```typescript
// tests/security/input-validation.test.ts
describe('Input Validation Security', () => {
  it('should prevent command injection in mode switching', async () => {
    const maliciousInput = 'c && rm -rf /';
    
    const result = await inputHandler.validateModeCommand(maliciousInput);
    
    expect(result.isValid).toBe(false);
    expect(result.sanitized).toBe('c');
  });
  
  it('should validate ESC key handling doesn\'t expose system', async () => {
    const escSequence = '\x1b[A'; // Up arrow after ESC
    
    const result = await inputHandler.handleEscapeSequence(escSequence);
    
    expect(result.action).toBe('back');
    expect(result.secure).toBe(true);
  });
});
```

## =� Implementation Checklist

### Checklist: Phase 1: Core Infrastructure

- [ ] **Issue 1**: Create agent information display page in config menu
- [ ] **Issue 2**: Replace process.exit() with session continuation
- [ ] **Issue 3**: Fix pre-filled "e" character with input buffer clearing
- [ ] **Issue 4**: Implement dual mode architecture (Menu/Command)
- [ ] **Issue 5**: Remove redundant breadcrumb navigation
- [ ] **Issue 6**: Streamline help command display

### Checklist: Phase 2: Navigation & UX

- [ ] **Issue 7**: Implement ESC key handling for back navigation
- [ ] **Issue 8**: Add numbered options to all menus
- [ ] **Issue 9**: Fix template reset/edit with proper selection flow
- [ ] **Issue 10**: Make debug settings editable in Advanced Settings

### Checklist: Phase 3: Command Interface

- [ ] **Issue 11**: Restore -h/--help command functionality
- [ ] **Issue 12**: Auto-display main menu on CLI entry
- [ ] **Issue 13**: Add interaction mode selection to setup wizard
- [ ] **Documentation**: Complete documentation for this phase as per the documentation section below

### Checklist: Phase 4: Enhanced Wizard

- [ ] **Issue 14**: Add stack knowledge question with enhanced wizard
- [ ] **Issue 15**: Create project discovery wizard for unknown stacks
- [ ] **Issue 16**: Reorganize menu structure with clear hierarchy
- [ ] **Documentation**: Complete documentation for this phase as per the documentation section below

### Checklist: Phase 5: Advanced Features

- [ ] **Issue 17**: Implement per-agent document management system
- [ ] **Documentation**: Complete documentation for this phase as per the documentation section below

## >� Testing Strategy

### Test Categories

1. **Unit Tests**: Individual component behavior
2. **Integration Tests**: Workflow and interaction testing
3. **User Experience Tests**: End-to-end user journey validation
4. **Security Tests**: Input validation and security guardrails
5. **Performance Tests**: Response time and resource usage

### Specific Test Requirements

- **Mode Switching**: Test both menu � command transitions
- **Navigation**: Test ESC, back, home, and numbered selections
- **Session Persistence**: Ensure session state maintained across interactions
- **Input Validation**: Prevent injection attacks and malformed input
- **Template Management**: Test edit/reset flows work correctly
- **Wizard Flows**: Test both known and unknown stack paths

## =� Success Metrics

### User Experience Metrics

- **Navigation Efficiency**: Reduce clicks/keystrokes to complete tasks by 40%
- **User Confusion**: Eliminate exit-from-CLI issues (0 unexpected exits)
- **Task Completion**: Increase successful template management by 60%
- **First-Time User Success**: 90% completion rate for setup wizard

### Technical Metrics

- **Test Coverage**: Maintain >90% coverage across all new components
- **Performance**: Menu navigation <100ms response time
- **Error Rate**: <1% error rate for all user interactions
- **Compatibility**: 100% backward compatibility for existing configurations

## = Rollback Plan

### If Implementation Issues Arise

1. **Incremental Rollback**: Revert by phase, maintaining working functionality
2. **Feature Flags**: Disable new features while keeping core functionality
3. **Configuration Backup**: Restore previous configuration schemas
4. **Session Fallback**: Fall back to traditional command-line mode

### Recovery Procedures

- **Database/Config Corruption**: Restore from template backups
- **Navigation Issues**: Provide escape hatch to traditional CLI
- **Performance Problems**: Disable complex features, use simplified UI
- **Security Concerns**: Immediately disable problematic features

## =� Documentation Updates Required

### User Documentation

- **User Guide**: Update with new interaction modes and navigation
- **Quick Start**: Include mode selection in initial setup guide
- **FAQ**: Add troubleshooting for new navigation features

### Developer Documentation

- **API Reference**: Document new interfaces and configuration options
- **Architecture Guide**: Update with session management and dual-mode architecture
- **Testing Guide**: Include test patterns for interactive components

### Lessons Learned

Before planning any changes, take notes of the lessons learned from the previous phases and consider if there is anything to change in the current phase's plan.

#### Lessons Learned: Phase 1: Core Infrastructure Implementation

- **Start Simple**: Begin with basic functionality tests before comprehensive integration tests
- **Schema First**: Define complete Zod schemas with defaults before implementation
- **Environment Awareness**: Design validation logic to be environment-aware from the start
- **Incremental Testing**: Build and test incrementally to catch issues early`

#### Lessons Learned: Phase 2: Navigation & UX Enhancement

- Complex CLI interactions require careful state management and validation
- User experience improvements should include both visual and functional enhancements
- Security considerations must be built into input validation from the start
- Error handling should provide actionable guidance, not just error messages

#### Lessons Learned: Phase 3: Command Interface

- Add lessons learned here

#### Lessons Learned: Phase 4: Enhanced Wizard

- Add lessons learned here

#### Lessons Learned: Phase 5: Advanced Features

- Add lessons learned here

---

## <� Implementation Timeline

**Total Estimated Time**: 32-46 hours across 5 phases
**Recommended Approach**: Implement phases 1-3 first (18-28 hours) for core functionality, then phases 4-5 (14-18 hours) for enhanced features.

**Phase Priority**:

1. **Critical** (Phase 1): Foundation and architecture
2. **High** (Phase 2-3): User experience and core interface
3. **Medium-Low** (Phase 4-5): Enhanced features and future improvements

This guide provides a comprehensive roadmap for transforming Phoenix Code Lite into a professional, user-friendly CLI tool that respects both the existing architecture and user experience best practices.
