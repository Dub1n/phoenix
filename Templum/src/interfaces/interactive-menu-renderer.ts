/**---
 * title: [Interactive Menu Renderer - Visual CLI Navigation]
 * tags: [Interface, Menu, Interactive, Navigation, CLI]
 * provides: [InteractiveMenuRenderer, Arrow Key Navigation, Visual Menu Display]
 * requires: [inquirer, chalk, ITemplumOrchestrator, UniversalSkinDefinition]
 * description: [Interactive menu system with arrow key navigation, visual selection, and dynamic menu generation from orchestrator status]
 * ---*/

import inquirer from 'inquirer';
import chalk from 'chalk';
import { ITemplumOrchestrator } from './templum-orchestrator-interface';
import { UniversalSkinDefinition } from '../types/templum-types';

/**
 * Menu item definition for interactive display
 */
export interface InteractiveMenuItem {
  id: string;
  title: string;
  description?: string;
  action: 'navigate' | 'execute' | 'system';
  target?: string;
  command?: string;
  enabled: boolean;
  icon?: string;
}

/**
 * Menu definition with metadata
 */
export interface InteractiveMenu {
  id: string;
  title: string;
  description?: string;
  items: InteractiveMenuItem[];
  parent?: string;
}

/**
 * Menu interaction result
 */
export interface MenuInteractionResult {
  action: 'navigate' | 'execute' | 'back' | 'quit' | 'help';
  target?: string;
  command?: string;
  data?: any;
}

/**
 * Interactive Menu Renderer with arrow key navigation
 * Based on Phoenix Code Lite patterns with Templum orchestrator integration
 */
export class InteractiveMenuRenderer {
  private orchestrator: ITemplumOrchestrator;
  private currentMenu: string = 'main';
  private navigationHistory: string[] = [];
  private menus: Map<string, InteractiveMenu> = new Map();
  
  constructor(orchestrator: ITemplumOrchestrator) {
    this.orchestrator = orchestrator;
    this.initializeDefaultMenus();
  }

  /**
   * Display interactive menu with arrow key navigation
   */
  async displayMenu(menuId: string = this.currentMenu): Promise<MenuInteractionResult> {
    const menu = this.menus.get(menuId);
    if (!menu) {
      return { action: 'navigate', target: 'main' };
    }

    // Update menu items based on orchestrator status
    await this.updateDynamicMenuItems(menu);

    // Display menu header
    this.displayMenuHeader(menu);

    // Create choices for inquirer
    const choices = this.createMenuChoices(menu);

    try {
      const { selection } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selection',
          message: `${chalk.cyan('›')} Select an option:`,
          choices: choices,
          pageSize: 15,
          loop: false
        }
      ]);

      return this.processMenuSelection(selection, menu);

    } catch (error) {
      // Handle Ctrl+C or other interruptions
      if (error && (error as any).isTtyError === false) {
        return { action: 'quit' };
      }
      throw error;
    }
  }

  /**
   * Update current menu and navigation
   */
  navigateToMenu(menuId: string): void {
    if (menuId !== this.currentMenu && this.currentMenu !== '') {
      this.navigationHistory.push(this.currentMenu);
    }
    this.currentMenu = menuId;
  }

  /**
   * Navigate back to previous menu
   */
  navigateBack(): string | null {
    const previousMenu = this.navigationHistory.pop();
    if (previousMenu) {
      this.currentMenu = previousMenu;
      return previousMenu;
    }
    return null;
  }

  /**
   * Get current menu ID
   */
  getCurrentMenu(): string {
    return this.currentMenu;
  }

  /**
   * Initialize default menu structure
   */
  private initializeDefaultMenus(): void {
    // Main menu
    this.menus.set('main', {
      id: 'main',
      title: 'Templum Universal Interface',
      description: 'Navigate backend services and execute commands',
      items: [
        {
          id: 'services',
          title: 'Backend Services',
          description: 'View and manage connected backend services',
          action: 'navigate',
          target: 'services',
          enabled: true,
          icon: '🔗'
        },
        {
          id: 'commands',
          title: 'Execute Commands',
          description: 'Run commands on connected backends',
          action: 'navigate', 
          target: 'commands',
          enabled: true,
          icon: '⚡'
        },
        {
          id: 'status',
          title: 'System Status',
          description: 'View system health and configuration',
          action: 'execute',
          command: 'system:status',
          enabled: true,
          icon: '📊'
        },
        {
          id: 'settings',
          title: 'Settings',
          description: 'Configure Templum behavior',
          action: 'navigate',
          target: 'settings',
          enabled: true,
          icon: '⚙️'
        }
      ]
    });

    // Services menu
    this.menus.set('services', {
      id: 'services',
      title: 'Backend Services',
      description: 'Manage connections to backend services',
      parent: 'main',
      items: [
        {
          id: 'list-services',
          title: 'List Connected Services',
          description: 'Show all currently connected backend services',
          action: 'execute',
          command: 'services:list',
          enabled: true,
          icon: '📋'
        },
        {
          id: 'refresh-services',
          title: 'Refresh Service Discovery',
          description: 'Scan for new backend services',
          action: 'execute',
          command: 'services:refresh',
          enabled: true,
          icon: '🔄'
        }
      ]
    });

    // Commands menu  
    this.menus.set('commands', {
      id: 'commands',
      title: 'Command Execution',
      description: 'Execute commands on backend services',
      parent: 'main',
      items: [
        {
          id: 'custom-command',
          title: 'Enter Custom Command',
          description: 'Type a command to execute',
          action: 'execute',
          command: 'command:custom',
          enabled: true,
          icon: '💬'
        }
      ]
    });

    // Settings menu
    this.menus.set('settings', {
      id: 'settings',
      title: 'Templum Settings',
      description: 'Configure application behavior',
      parent: 'main',
      items: [
        {
          id: 'interaction-mode',
          title: 'Switch to Command Mode',
          description: 'Use text-based command entry',
          action: 'execute',
          command: 'settings:toggle-mode',
          enabled: true,
          icon: '🔀'
        }
      ]
    });
  }

  /**
   * Update menu items based on orchestrator status
   */
  private async updateDynamicMenuItems(menu: InteractiveMenu): Promise<void> {
    if (!this.orchestrator.isInitialized()) {
      return;
    }

    try {
      const systemStatus = this.orchestrator.getSystemStatus();
      
      // Add dynamic backend service items to services menu
      if (menu.id === 'services' && systemStatus?.coreEngine?.backendConnections?.backends) {
        const backends = systemStatus.coreEngine.backendConnections.backends;
        const backendEntries = Object.entries(backends);
        
        if (backendEntries.length > 0) {
          // Clear existing dynamic items (keep static ones)
          menu.items = menu.items.filter(item => 
            ['list-services', 'refresh-services'].includes(item.id)
          );
          
          // Add dynamic backend items
          for (const [backendId, backend] of backendEntries) {
            menu.items.push({
              id: `backend-${backendId}`,
              title: `${backendId}`,
              description: `Health: ${backend.health || 'Unknown'} - ${backend.connected ? 'Connected' : 'Disconnected'}`,
              action: 'execute',
              command: `backend:info:${backendId}`,
              enabled: backend.connected,
              icon: backend.connected && backend.health === 'healthy' ? '✅' : '⚠️'
            });
          }
        }
      }

      // Add dynamic command items to commands menu
      if (menu.id === 'commands' && systemStatus?.coreEngine?.backendConnections?.backends) {
        const backends = systemStatus.coreEngine.backendConnections.backends;
        
        // Clear existing dynamic items (keep custom command)
        menu.items = menu.items.filter(item => item.id === 'custom-command');
        
        // Add common backend commands
        for (const [backendId, backend] of Object.entries(backends)) {
          if (backend.connected) {
            menu.items.push({
              id: `execute-${backendId}`,
              title: `Execute on ${backendId}`,
              description: `Run command on ${backendId}`,
              action: 'execute',
              command: `execute:${backendId}`,
              enabled: true,
              icon: '▶️'
            });
          }
        }
      }
    } catch (error) {
      console.warn('Failed to update dynamic menu items:', error);
    }
  }

  /**
   * Display menu header with title and description
   */
  private displayMenuHeader(menu: InteractiveMenu): void {
    console.clear();
    console.log(chalk.blue.bold(`* ${menu.title}`));
    
    if (menu.description) {
      console.log(chalk.gray(menu.description));
    }
    
    // Show navigation path
    if (this.navigationHistory.length > 0 || menu.parent) {
      const path = [...this.navigationHistory, menu.id].join(' › ');
      console.log(chalk.dim(`📍 ${path}`));
    }
    
    console.log(); // Empty line for spacing
  }

  /**
   * Create choices for inquirer prompt
   */
  private createMenuChoices(menu: InteractiveMenu): any[] {
    const choices: any[] = [];

    // Add menu items
    for (const item of menu.items) {
      const icon = item.icon || '•';
      const title = item.enabled ? item.title : chalk.dim(item.title);
      const description = item.description ? chalk.gray(` - ${item.description}`) : '';
      
      choices.push({
        name: `${icon} ${title}${description}`,
        value: item.id,
        disabled: !item.enabled ? 'Not available' : false
      });
    }

    // Add separator and navigation items
    if (choices.length > 0) {
      choices.push(new inquirer.Separator());
    }

    // Add back option if not at root
    if (this.navigationHistory.length > 0 || menu.parent) {
      choices.push({
        name: `🔙 Back`,
        value: 'back'
      });
    }

    // Add common options
    choices.push(
      {
        name: `🏠 Main Menu`,
        value: 'home'
      },
      {
        name: `❓ Help`,
        value: 'help'
      },
      {
        name: `🚪 Exit`,
        value: 'quit'
      }
    );

    return choices;
  }

  /**
   * Process user menu selection
   */
  private async processMenuSelection(selection: string, menu: InteractiveMenu): Promise<MenuInteractionResult> {
    // Handle system actions
    switch (selection) {
      case 'back':
        const previousMenu = this.navigateBack();
        return { action: 'back', target: previousMenu || 'main' };
        
      case 'home':
        this.currentMenu = 'main';
        this.navigationHistory = [];
        return { action: 'navigate', target: 'main' };
        
      case 'help':
        await this.displayHelp();
        return { action: 'help' };
        
      case 'quit':
        return { action: 'quit' };
    }

    // Find selected menu item
    const selectedItem = menu.items.find(item => item.id === selection);
    if (!selectedItem) {
      return { action: 'navigate', target: this.currentMenu };
    }

    // Process item action
    switch (selectedItem.action) {
      case 'navigate':
        if (selectedItem.target) {
          this.navigateToMenu(selectedItem.target);
          return { action: 'navigate', target: selectedItem.target };
        }
        break;
        
      case 'execute':
        if (selectedItem.command) {
          return { 
            action: 'execute', 
            command: selectedItem.command,
            data: { menuId: menu.id, itemId: selectedItem.id }
          };
        }
        break;
    }

    return { action: 'navigate', target: this.currentMenu };
  }

  /**
   * Display help information  
   * TASK-CLI-009: Fixed nested inquirer calls to prevent terminal state corruption
   */
  private async displayHelp(): Promise<void> {
    console.clear();
    console.log(chalk.blue.bold('* Templum Interactive Help'));
    console.log();
    console.log('Navigation:');
    console.log('  ↑↓    Use arrow keys to navigate menu items');
    console.log('  Enter  Select highlighted option');
    console.log('  Ctrl+C Exit application');
    console.log();
    console.log('Menu Items:');
    console.log('  🔗    Backend Services - Manage service connections');
    console.log('  ⚡    Execute Commands - Run operations on backends');
    console.log('  📊    System Status - View health and configuration');
    console.log('  ⚙️    Settings - Configure Templum behavior');
    console.log();
    console.log('Press Enter to continue...');
    
    // Use simple stdin listener to avoid nested inquirer conflicts
    return new Promise((resolve) => {
      const stdin = process.stdin;
      
      if (stdin.isTTY) {
        stdin.resume();
        const listener = () => {
          stdin.removeListener('data', listener);
          stdin.pause();
          resolve(void 0);
        };
        stdin.once('data', listener);
      } else {
        // Non-TTY fallback
        setTimeout(() => resolve(void 0), 1000);
      }
    });
  }
}