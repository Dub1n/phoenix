/**
---
title: [Interactive Menu Renderer - Visual CLI Navigation]
tags: [Interface, Menu, Interactive, Navigation, CLI]
provides: [InteractiveMenuRenderer, Arrow Key Navigation, Visual Menu Display]
requires: [inquirer, chalk, ITemplumOrchestrator, UniversalSkinDefinition]
description: [Interactive menu system with arrow key navigation, visual selection, and dynamic menu generation from orchestrator status]
---
**/

import inquirer from 'inquirer';
import chalk from 'chalk';
import { ITemplumOrchestrator } from './templum-orchestrator-interface';
import { 
  EnhancedInteractiveMenu, 
  EnhancedMenuConfig, 
  MenuSection, 
  DefaultColorThemes,
  WindowContentItem 
} from './terminal-ui-components';
import { 
  CLIDisplayConsistencyEngine, 
  createCLIDisplayConsistencyEngine 
} from './cli-display-consistency-engine';
import { ServiceInfo } from './service-ordering-manager';

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
  private consistencyEngine: CLIDisplayConsistencyEngine;
  
  constructor(orchestrator: ITemplumOrchestrator) {
    this.orchestrator = orchestrator;
    this.initializeDefaultMenus();
    
    // Initialize consistency engine for menu display standardization
    // TODO: [TASK-ID-007] Pattern: menu-consistency-integration | Complexity: 5 | Dependencies: cli-display-consistency-engine,service-ordering
    // Context: Apply display consistency framework to menu rendering for uniform spacing and service ordering
    // Validation-Required: menu-formatting-consistency, service-order-correctness, responsive-menu-behavior
    // Pattern-Info: { approach: "menu-display-integration", alternatives: "manual-formatting", trade-offs: "consistency-vs-menu-flexibility" }
    this.consistencyEngine = createCLIDisplayConsistencyEngine({
      enforceWidthStandards: true,
      enforceServiceOrdering: true, // Apply connected-first, alphabetical ordering to menu items
      enforceLayoutNormalization: true,
      skinCompatibilityMode: true
    });
  }

  /**
   * Display enhanced interactive menu with CLI design specification compliance
   * Integrates new CLI design with existing menu system for pattern-based UX optimization
   * Pattern: enhanced-menu-integration - See /dev/patterns/enhanced-menu-integration.md for reusable implementation guide  
   * Validation-Required: menu-integration, performance-timing, user-experience
   */
  async displayEnhancedMenu(menuId: string = this.currentMenu): Promise<MenuInteractionResult> {
    const menu = this.menus.get(menuId);
    if (!menu) {
      return { action: 'navigate', target: 'main' };
    }

    // Update menu items based on orchestrator status with performance optimization
    const startTime = Date.now();
    await this.updateDynamicMenuItems(menu);
    const updateTime = Date.now() - startTime;

    // Apply speed heuristics - if update took > 100ms, show loading indicator next time
    if (updateTime > 100) {
      console.log(chalk.yellow('Loading menu data...'));
    }

    // Build enhanced menu configuration
    const menuConfig: EnhancedMenuConfig = {
      title: menu.title,
      subtitle: menu.description,
      sections: this.buildEnhancedSections(menu),
      theme: DefaultColorThemes.default,
      onSelection: async (item: WindowContentItem) => {
        // Handle selection with performance tracking
        const selectionStart = Date.now();
        await this.handleEnhancedSelection(item);
        const selectionTime = Date.now() - selectionStart;
        
        // Log performance for UX optimization
        if (selectionTime > 50) {
          console.log(chalk.dim(`Selection processed in ${selectionTime}ms`));
        }
      },
      onExit: async () => {
        console.log(chalk.green('Templum CLI shutting down...'));
        process.exit(0);
      }
    };

    // Create and start enhanced menu
    const enhancedMenu = new EnhancedInteractiveMenu(menuConfig);
    
    try {
      const selectedItem = await enhancedMenu.start();
      
      if (!selectedItem) {
        return { action: 'quit' };
      }

      return this.convertToMenuResult(selectedItem);
    } catch (error) {
      console.error('Enhanced menu error:', error);
      // Fallback to original menu system
      return this.displayMenu(menuId);
    }
  }

  /**
   * Display interactive menu with arrow key navigation (original implementation preserved)
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
      // Handle Ctrl+C or other interruptions with proper CLI design behavior
      if (error && (error as any).isTtyError === false) {
        console.log('\nPress Ctrl+C again to shut down Templum CLI');
        return { action: 'quit', data: { confirmRequired: true } };
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
          enabled: true
        },
        {
          id: 'commands',
          title: 'Execute Commands',
          description: 'Run commands on connected backends',
          action: 'navigate', 
          target: 'commands',
          enabled: true
        },
        {
          id: 'status',
          title: 'System Status',
          description: 'View system health and configuration',
          action: 'execute',
          command: 'system:status',
          enabled: true
        },
        {
          id: 'settings',
          title: 'Settings',
          description: 'Configure Templum behavior',
          action: 'navigate',
          target: 'settings',
          enabled: true
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
          title: 'Connected Services',
          description: 'Show all currently connected backend services',
          action: 'execute',
          command: 'services:list',
          enabled: true
        },
        {
          id: 'refresh-services',
          title: 'Refresh Service Discovery',
          description: 'Scan for new backend services',
          action: 'execute',
          command: 'services:refresh',
          enabled: true
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
          enabled: true
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
          enabled: true
        }
      ]
    });
  }

  /**
   * Update menu items based on orchestrator status using consistency framework
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
          
          // Convert backends to ServiceInfo format for consistency engine
          const services: ServiceInfo[] = backendEntries.map(([serviceId, backend]) => {
            const backendTyped = backend as any;
            return {
              id: serviceId,
              name: serviceId,
              connected: backendTyped.connected || false,
              health: backendTyped.health || 'unknown',
              responseTime: backendTyped.responseTime,
              capabilities: backendTyped.capabilities || [],
              lastCheck: backendTyped.lastCheck || Date.now()
            } as ServiceInfo;
          });

          // Apply consistency framework service ordering (connected-first, alphabetical)
          const orderingResult = this.consistencyEngine.orderServices(services, 'menu-selection');
          const sortedServices = orderingResult.orderedServices;
          
          // Add dynamic backend items using consistency framework ordered services
          for (const service of sortedServices) {
            const statusIcon = service.connected ? '🟢' : '🔴';
            const statusText = service.connected 
              ? (service.health === 'healthy' ? 'Healthy' : `${service.health}`)
              : 'Disconnected';
              
            menu.items.push({
              id: `backend-${service.id}`,
              title: `${statusIcon} ${service.id}`,
              description: `Status: ${statusText}${service.responseTime ? ` | Response: ${service.responseTime}ms` : ''}`,
              action: 'execute',
              command: `backend:info:${service.id}`,
              enabled: service.connected,
              icon: statusIcon
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
              enabled: true
            });
          }
        }
      }
    } catch (error) {
      console.warn('Failed to update dynamic menu items:', error);
    }
  }

  /**
   * Display menu using new CLI window design - no separate header
   */
  private displayMenuHeader(menu: InteractiveMenu): void {
    console.clear();
    // Header is now integrated into the window layout - no separate display needed
  }

  /**
   * Create choices for inquirer prompt - simplified for window-based design
   */
  private createMenuChoices(menu: InteractiveMenu): any[] {
    const choices: any[] = [];

    // Add menu items (no icons, description handled in window layout)
    for (const item of menu.items) {
      const title = item.enabled ? item.title : chalk.dim(item.title);
      const description = item.description ? chalk.gray(` - ${item.description}`) : '';
      
      choices.push({
        name: `${title}${description}`,
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
        name: 'Back',
        value: 'back'
      });
    }

    // Add common options
    choices.push(
      {
        name: 'Home',
        value: 'home'
      },
      {
        name: 'Help',
        value: 'help'
      },
      {
        name: 'Exit',
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
   * TODO: [TASK-MCP-010-001] Pattern: cli-design-compliance | Complexity: 2 | Dependencies: navigation-flow
   * Context: Removed Press Enter continuation message per CLI-design specification requirement
   * Validation-Required: navigation-integration, user-experience-flow, cli-design-compliance
   * Pattern-Info: { approach: "immediate-return", alternatives: "timeout-pause", trade-offs: "improved-ux-vs-display-time" }
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
    console.log('  Backend Services  - Manage service connections');
    console.log('  Execute Commands  - Run operations on backends');
    console.log('  System Status     - View health and configuration');
    console.log('  Settings          - Configure Templum behavior');
    console.log();
    // Return immediately - help display integrates with menu navigation
    // CLI-design compliance: No "Press Enter to continue" messages
    return Promise.resolve();
  }

  /**
   * Build enhanced menu sections with proper ordering
   * @private
   */
  private buildEnhancedSections(menu: InteractiveMenu): MenuSection[] {
    const sections: MenuSection[] = [];

    // Main content section
    const mainItems = menu.items
      .filter(item => !['back', 'home', 'help', 'exit'].includes(item.id))
      .map(item => ({
        id: item.id,
        label: item.title,
        description: item.description,
        action: item.action === 'navigate' ? `navigate:${item.target}` : 
                item.action === 'execute' ? `execute:${item.command}` : item.action,
        enabled: item.enabled,
        icon: item.icon || ''
      }));

    if (mainItems.length > 0) {
      sections.push({
        id: 'main-items',
        items: mainItems
      });
    }

    // Add separator
    sections.push({
      id: 'separator',
      type: 'separator',
      items: []
    });

    // Navigation items (with proper ordering)
    const navigationItems = [];
    
    // Add Back if available
    const backItem = menu.items.find(item => item.id === 'back');
    if (backItem) {
      navigationItems.push({
        id: 'back',
        label: 'Back',
        description: '',
        action: 'navigate:back',
        enabled: true,
        icon: ''
      });
    }

    // Standard navigation items
    navigationItems.push(
      {
        id: 'home',
        label: 'Home',
        description: '',
        action: 'navigate:main',
        enabled: true,
        icon: ''
      },
      {
        id: 'help',
        label: 'Help',
        description: '',
        action: 'show:help',
        enabled: true,
        icon: ''
      },
      {
        id: 'exit',
        label: 'Exit',
        description: '',
        action: 'system:exit',
        enabled: true,
        icon: ''
      }
    );

    sections.push({
      id: 'navigation',
      items: navigationItems
    });

    return sections;
  }

  /**
   * Handle enhanced menu selection
   * @private
   */
  private async handleEnhancedSelection(item: WindowContentItem): Promise<void> {
    const itemData = item.data as any;
    if (!itemData?.action) return;

    const [actionType, actionTarget] = itemData.action.split(':', 2);

    switch (actionType) {
      case 'navigate':
        if (actionTarget === 'back') {
          this.navigateBack();
        } else if (actionTarget === 'main') {
          this.navigateToMenu('main');
        } else {
          this.navigateToMenu(actionTarget);
        }
        break;

      case 'execute':
        console.log(`Executing command: ${actionTarget}`);
        // Handle command execution
        break;

      case 'show':
        if (actionTarget === 'help') {
          await this.displayEnhancedHelp();
        }
        break;

      case 'system':
        if (actionTarget === 'exit') {
          // Exit is handled by the menu system
        }
        break;
    }
  }

  /**
   * Convert enhanced menu result to standard menu result
   * @private
   */
  private convertToMenuResult(item: WindowContentItem): MenuInteractionResult {
    const itemData = item.data as any;
    if (!itemData?.action) {
      return { action: 'navigate', target: this.currentMenu };
    }

    const [actionType, actionTarget] = itemData.action.split(':', 2);

    switch (actionType) {
      case 'navigate':
        return { action: 'navigate', target: actionTarget };
      case 'execute':
        return { action: 'execute', command: actionTarget };
      case 'show':
        return { action: 'help' };
      case 'system':
        return { action: 'quit' };
      default:
        return { action: 'navigate', target: this.currentMenu };
    }
  }

  /**
   * Display enhanced help with better formatting
   * @private
   */
  private async displayEnhancedHelp(): Promise<void> {
    console.clear();
    console.log(chalk.blue.bold('┌─────────────────────────────────────────────────────────────────────────┐'));
    console.log(chalk.blue.bold('│                               Templum Help                             │'));
    console.log(chalk.blue.bold('├─────────────────────────────────────────────────────────────────────────┤'));
    console.log(chalk.blue.bold('│') + '                                                                       ' + chalk.blue.bold('│'));
    console.log(chalk.blue.bold('│') + '   Navigation:                                                         ' + chalk.blue.bold('│'));
    console.log(chalk.blue.bold('│') + '     ↑↓     Navigate menu items                                       ' + chalk.blue.bold('│'));
    console.log(chalk.blue.bold('│') + '     Enter  Select highlighted option                                 ' + chalk.blue.bold('│'));
    console.log(chalk.blue.bold('│') + '     Escape Return to previous menu                                   ' + chalk.blue.bold('│'));
    console.log(chalk.blue.bold('│') + '     Ctrl+C Exit application (press twice)                            ' + chalk.blue.bold('│'));
    console.log(chalk.blue.bold('│') + '                                                                       ' + chalk.blue.bold('│'));
    console.log(chalk.blue.bold('│') + '   Features:                                                           ' + chalk.blue.bold('│'));
    console.log(chalk.blue.bold('│') + '     • Cross-separator navigation                                      ' + chalk.blue.bold('│'));
    console.log(chalk.blue.bold('│') + '     • Exit confirmation behavior                                      ' + chalk.blue.bold('│'));
    console.log(chalk.blue.bold('│') + '     • Connected services prioritized                                  ' + chalk.blue.bold('│'));
    console.log(chalk.blue.bold('│') + '     • Performance-optimized rendering                                 ' + chalk.blue.bold('│'));
    console.log(chalk.blue.bold('│') + '                                                                       ' + chalk.blue.bold('│'));
    console.log(chalk.blue.bold('└─────────────────────────────────────────────────────────────────────────┘'));
    console.log();
    console.log(chalk.dim('Press any key to continue...'));

    // Wait for keypress
    return new Promise((resolve) => {
      const stdin = process.stdin;
      if (stdin.isTTY) {
        stdin.resume();
        const listener = () => {
          stdin.removeListener('data', listener);
          stdin.pause();
          resolve();
        };
        stdin.once('data', listener);
      } else {
        setTimeout(() => resolve(), 2000);
      }
    });
  }
}
