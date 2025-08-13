/**---
 * title: [Menu System - Contextual Menu Routing]
 * tags: [CLI, Menu, Navigation, Rendering]
 * provides: [MenuSystem Class, Contextual Menus, Submenu Routing]
 * requires: [SessionContext, SkinMenuRenderer, Menu Types]
 * description: [Renders contextual menus for main sections and routes navigation between them using session state.]
 * ---*/

import chalk from 'chalk';
import { SessionContext, MenuAction } from './session';
import { renderLegacyWithUnified } from './skin-menu-renderer';
import type { MenuContent, MenuDisplayContext } from './menu-types';

export interface MenuContext {
  level: 'main' | 'config' | 'templates' | 'advanced' | 'generate';
  parentMenu?: string;
  currentItem?: string;
  breadcrumb: string[];
}

export class MenuSystem {
  
  public async showContextualMenu(context: SessionContext): Promise<void> {
    switch (context.level) {
      case 'main':
        this.showMainMenu();
        break;
      case 'config':
        this.showConfigMenu(context);
        break;
      case 'templates':
        this.showTemplatesMenu(context);
        break;
      case 'generate':
        this.showGenerateMenu(context);
        break;
      case 'advanced':
        this.showAdvancedMenu(context);
        break;
      default:
        this.showMainMenu();
    }
  }

  public async processContextCommand(input: string, context: SessionContext): Promise<MenuAction | null> {
    const cmd = input.toLowerCase().trim();
    
    switch (context.level) {
      case 'main':
        return this.processMainCommands(cmd);
      case 'config':
        return this.processConfigCommands(cmd, context);
      case 'templates':
        return this.processTemplateCommands(cmd, context);
      case 'generate':
        return this.processGenerateCommands(cmd, context);
      case 'advanced':
        return this.processAdvancedCommands(cmd, context);
      default:
        return null;
    }
  }

  public showContextHelp(context: SessionContext): void {
    switch (context.level) {
      case 'main':
        this.showMainHelp();
        break;
      case 'config':
        this.showConfigHelp();
        break;
      case 'templates':
        this.showTemplatesHelp();
        break;
      case 'generate':
        this.showGenerateHelp();
        break;
      case 'advanced':
        this.showAdvancedHelp();
        break;
    }
  }

  private showMainMenu(): void {
    const content: MenuContent = {
      title: '* Phoenix Code Lite • TDD Workflow Orchestrator',
      subtitle: 'Transform natural language into production-ready code through TDD',
      sections: [{
        heading: 'Main Navigation',
        theme: { headingColor: 'red', bold: true },
        items: [
          {
            label: 'Configuration',
            description: 'Manage project settings and preferences',
            commands: ['config'],
            type: 'navigation'
          },
          {
            label: 'Templates',
            description: 'Starter, Enterprise, Performance configurations',
            commands: ['templates'],
            type: 'navigation'
          },
          {
            label: 'Generate',
            description: 'AI-powered TDD code generation',
            commands: ['generate'],
            type: 'navigation'
          },
          {
            label: 'Advanced',
            description: 'Expert settings, metrics, logging',
            commands: ['advanced'],
            type: 'navigation'
          }
        ]
      }],
      footerHints: [
        'Type a number or command name to navigate',
        'Use "help" for detailed command reference',
        'Use "quit" to exit or "back" to return'
      ],
      metadata: {
        menuType: 'main',
        complexityLevel: 'simple',
        priority: 'normal',
        autoSize: true
      }
    };

    const context: MenuDisplayContext = {
      level: 'main',
      breadcrumb: ['Phoenix Code Lite']
    };

    renderLegacyWithUnified(content, context);
  }

  private showConfigMenu(context: SessionContext): void {
    const title = context.currentItem ? 
      `⋇ Configuration › ${context.currentItem}` : 
      '⋇ Configuration Management Hub';
      
    const content: MenuContent = {
      title,
      subtitle: 'Manage Phoenix Code Lite settings and preferences',
      sections: [{
        heading: '◦ Configuration Commands:',
        theme: { headingColor: 'yellow', bold: true },
        items: [
          {
            label: 'show',
            description: 'Display current configuration with validation status',
            commands: ['show'],
            type: 'command'
          },
          {
            label: 'edit',
            description: 'Interactive configuration editor with guided setup',
            commands: ['edit'],
            type: 'command'
          },
          {
            label: 'templates',
            description: 'Browse and apply configuration templates',
            commands: ['templates'],
            type: 'navigation'
          },
          {
            label: 'framework',
            description: 'Framework-specific optimization settings',
            commands: ['framework'],
            type: 'setting'
          },
          {
            label: 'quality',
            description: 'Quality gates and testing thresholds',
            commands: ['quality'],
            type: 'setting'
          },
          {
            label: 'security',
            description: 'Security policies and guardrails',
            commands: ['security'],
            type: 'setting'
          }
        ]
      }],
      footerHints: [
        'Navigation: command name, number, "back" to return, "quit" to exit'
      ],
      metadata: {
        menuType: 'sub',
        complexityLevel: 'moderate',
        priority: 'normal',
        autoSize: true
      }
    };

    const menuContext: MenuDisplayContext = {
      level: 'config',
      parentMenu: 'main',
      currentItem: context.currentItem,
      breadcrumb: context.breadcrumb || ['Phoenix Code Lite', 'Configuration']
    };

    renderLegacyWithUnified(content, menuContext);
  }

  private showTemplatesMenu(context: SessionContext): void {
    const title = context.currentItem ? 
      `□ Templates › ${context.currentItem}` : 
      '□ Template Management Center';
      
    const content: MenuContent = {
      title,
      subtitle: 'Choose from Starter, Enterprise, Performance, or create custom templates',
      sections: [{
        heading: '⌺ Template Commands:',
        theme: { headingColor: 'yellow', bold: true },
        items: [
          {
            label: 'list',
            description: 'Show all available configuration templates',
            commands: ['list'],
            type: 'command'
          },
          {
            label: 'use',
            description: 'Apply template to current project',
            commands: ['use'],
            type: 'command'
          },
          {
            label: 'preview',
            description: 'Preview template settings before applying them',
            commands: ['preview'],
            type: 'command'
          },
          {
            label: 'create',
            description: 'Build custom template from current configuration',
            commands: ['create'],
            type: 'command'
          },
          {
            label: 'edit',
            description: 'Modify existing template settings',
            commands: ['edit'],
            type: 'command'
          },
          {
            label: 'reset',
            description: 'Restore template to original defaults',
            commands: ['reset'],
            type: 'command'
          }
        ]
      }],
      footerHints: [
        'Popular Templates: starter, enterprise, performance',
        'Navigation: command name, number, "back" to return'
      ],
      metadata: {
        menuType: 'sub',
        complexityLevel: 'moderate',
        priority: 'normal',
        autoSize: true
      }
    };

    const menuContext: MenuDisplayContext = {
      level: 'templates',
      parentMenu: 'main',
      currentItem: context.currentItem,
      breadcrumb: context.breadcrumb || ['Phoenix Code Lite', 'Templates']
    };

    renderLegacyWithUnified(content, menuContext);
  }

  private showGenerateMenu(context: SessionContext): void {
    const content: MenuContent = {
      title: '⚡ AI-Powered Code Generation',
      subtitle: 'Transform natural language into tested, production-ready code',
      sections: [{
        heading: '🤖 Generation Commands:',
        theme: { headingColor: 'magenta', bold: true },
        items: [
          {
            label: 'task',
            description: 'General code generation from any description',
            commands: ['task'],
            type: 'command'
          },
          {
            label: 'component',
            description: 'UI/React components with tests and styling',
            commands: ['component'],
            type: 'command'
          },
          {
            label: 'api',
            description: 'REST API endpoints with validation and docs',
            commands: ['api'],
            type: 'command'
          },
          {
            label: 'test',
            description: 'Comprehensive test suites for existing code',
            commands: ['test'],
            type: 'command'
          }
        ]
      }],
      footerHints: [
        'Natural Language Input: Simply describe what you want to build',
        'Examples: "create a user authentication system with JWT"',
        'TDD Workflow: Plan & Test → Implement & Fix → Refactor & Document'
      ],
      metadata: {
        menuType: 'sub',
        complexityLevel: 'moderate',
        priority: 'normal',
        autoSize: true
      }
    };

    const menuContext: MenuDisplayContext = {
      level: 'generate',
      parentMenu: 'main',
      currentItem: context.currentItem,
      breadcrumb: context.breadcrumb || ['Phoenix Code Lite', 'Generate']
    };

    renderLegacyWithUnified(content, menuContext);
  }

  private showAdvancedMenu(context: SessionContext): void {
    const content: MenuContent = {
      title: '◦ Advanced Configuration Center',
      subtitle: 'Expert settings, debugging tools, and performance monitoring',
      sections: [{
        heading: '⌘ Advanced Commands:',
        theme: { headingColor: 'cyan', bold: true },
        items: [
          {
            label: 'language',
            description: 'Programming language preferences and optimization',
            commands: ['language'],
            type: 'setting'
          },
          {
            label: 'agents',
            description: 'AI agent configuration and specialization settings',
            commands: ['agents'],
            type: 'setting'
          },
          {
            label: 'logging',
            description: 'Comprehensive audit logging and session tracking',
            commands: ['logging'],
            type: 'setting'
          },
          {
            label: 'metrics',
            description: 'Performance metrics, success rates, and analytics',
            commands: ['metrics'],
            type: 'setting'
          },
          {
            label: 'debug',
            description: 'Debug mode, verbose output, and troubleshooting',
            commands: ['debug'],
            type: 'setting'
          }
        ]
      }],
      footerHints: [
        'Analytics: Track TDD workflow performance and code quality trends',
        'Navigation: command name, "back" to return'
      ],
      metadata: {
        menuType: 'sub',
        complexityLevel: 'complex',
        priority: 'normal',
        autoSize: true
      }
    };

    const menuContext: MenuDisplayContext = {
      level: 'advanced',
      parentMenu: 'main',
      currentItem: context.currentItem,
      breadcrumb: context.breadcrumb || ['Phoenix Code Lite', 'Advanced']
    };

    renderLegacyWithUnified(content, menuContext);
  }

  private processMainCommands(cmd: string): MenuAction | null {
    switch (cmd) {
      case 'config':
      case 'configuration':
      case '1':
        return { type: 'navigate', target: 'config' };
      case 'templates':
      case 'template':
      case '2':
        return { type: 'navigate', target: 'templates' };
      case 'generate':
      case 'gen':
      case '3':
        return { type: 'navigate', target: 'generate' };
      case 'advanced':
      case 'settings':
      case '4':
        return { type: 'navigate', target: 'advanced' };
      default:
        return null;
    }
  }

  private processConfigCommands(cmd: string, context: SessionContext): MenuAction | null {
    switch (cmd) {
      case 'show':
      case '1':
        return { type: 'execute', target: 'config:show' };
      case 'edit':
      case '2':
        return { type: 'execute', target: 'config:edit' };
      case 'templates':
      case '3':
        context.currentItem = 'Templates';
        return { type: 'execute', target: 'config:templates' };
      case 'framework':
      case '4':
        context.currentItem = 'Framework';
        return { type: 'execute', target: 'config:framework' };
      case 'quality':
      case '5':
        context.currentItem = 'Quality';
        return { type: 'execute', target: 'config:quality' };
      case 'security':
      case '6':
        context.currentItem = 'Security';
        return { type: 'execute', target: 'config:security' };
      case 'back':
        return { type: 'navigate', target: 'main' };
      default:
        return null;
    }
  }

  private processTemplateCommands(cmd: string, context: SessionContext): MenuAction | null {
    const parts = cmd.split(' ');
    const command = parts[0];
    const arg = parts.slice(1).join(' ');

    switch (command) {
      case 'list':
      case '1':
        return { type: 'execute', target: 'templates:list' };
      case 'use':
      case '2':
        return { type: 'execute', target: 'templates:use', data: { template: arg } };
      case 'preview':
      case '3':
        return { type: 'execute', target: 'templates:preview', data: { template: arg } };
      case 'create':
      case '4':
        return { type: 'execute', target: 'templates:create', data: { name: arg } };
      case 'edit':
      case '5':
        return { type: 'execute', target: 'templates:edit', data: { template: arg } };
      case 'reset':
      case '6':
        return { type: 'execute', target: 'templates:reset', data: { template: arg } };
      case 'back':
        return { type: 'navigate', target: 'main' };
      default:
        return null;
    }
  }

  private processGenerateCommands(cmd: string, context: SessionContext): MenuAction | null {
    const parts = cmd.split(' ');
    const command = parts[0];
    const description = parts.slice(1).join(' ');

    switch (command) {
      case 'task':
        return { type: 'execute', target: 'generate:task', data: { description } };
      case 'component':
        return { type: 'execute', target: 'generate:component', data: { description } };
      case 'api':
        return { type: 'execute', target: 'generate:api', data: { description } };
      case 'test':
        return { type: 'execute', target: 'generate:test', data: { description } };
      default:
        // Treat any unrecognized command as a task description
        return { type: 'execute', target: 'generate:task', data: { description: cmd } };
    }
  }

  private processAdvancedCommands(cmd: string, context: SessionContext): MenuAction | null {
    switch (cmd) {
      case 'language':
        return { type: 'execute', target: 'advanced:language' };
      case 'agents':
        return { type: 'execute', target: 'advanced:agents' };
      case 'logging':
        return { type: 'execute', target: 'advanced:logging' };
      case 'metrics':
        return { type: 'execute', target: 'advanced:metrics' };
      case 'debug':
        return { type: 'execute', target: 'advanced:debug' };
      default:
        return null;
    }
  }

  private showMainHelp(): void {
    console.log('  config     - Enter configuration management');
    console.log('  templates  - Enter template management');
    console.log('  generate   - Enter code generation');
    console.log('  advanced   - Enter advanced settings');
  }

  private showConfigHelp(): void {
    console.log('  show       - Display current configuration');
    console.log('  edit       - Open interactive editor');
    console.log('  templates  - Manage configuration templates');
    console.log('  framework  - Framework-specific settings');
    console.log('  quality    - Quality thresholds and gates');
    console.log('  security   - Security policies and guardrails');
  }

  private showTemplatesHelp(): void {
    console.log('  list                    - Show all available templates');
    console.log('  use <name>              - Switch to specified template');
    console.log('  preview [name]          - Preview template settings');
    console.log('  create <name>           - Create new custom template');
    console.log('  edit <name>             - Edit template settings');
    console.log('  reset <name>            - Reset template to defaults');
  }

  private showGenerateHelp(): void {
    console.log('  task <description>      - Generate from task description');
    console.log('  component <description> - Generate UI component');
    console.log('  api <description>       - Generate API endpoint');
    console.log('  test <description>      - Generate test files');
    console.log('');
    console.log('  Or simply type your task description directly');
  }

  private showAdvancedHelp(): void {
    console.log('  language  - Configure language preferences');
    console.log('  agents    - Configure AI agent settings');
    console.log('  logging   - Configure audit logging');
    console.log('  metrics   - Configure performance metrics');
    console.log('  debug     - Configure debug settings');
  }

  public generateTitle(context: SessionContext): string {
    const phoenixBrand = '* Phoenix Code Lite';
    
    switch (context.level) {
      case 'templates':
        return `${phoenixBrand} • □ Template Manager${context.currentItem ? ` › ${context.currentItem}` : ''}`;
      case 'config':
        return `${phoenixBrand} • ⋇ Configuration${context.currentItem ? ` › ${context.currentItem}` : ''}`;
      case 'generate':
        return `${phoenixBrand} • ⚡ Code Generation`;
      case 'advanced':
        return `${phoenixBrand} • ◦ Advanced Settings`;
      default:
        return `${phoenixBrand} • TDD Workflow Orchestrator`;
    }
  }
}
