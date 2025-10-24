/**
---
title: [Interactive Menu Renderer - Visual CLI Navigation]
tags: [Interface, Menu, Interactive, Navigation, CLI]
provides: [InteractiveMenuRenderer, Arrow Key Navigation, Visual Menu Display]
requires: [inquirer, terminal-formatter, ITemplumOrchestrator, UniversalSkinDefinition]
description: [Interactive menu system with arrow key navigation, visual selection, and dynamic menu generation from orchestrator status]
---
**/

import inquirer from 'inquirer';
import { createFormatter, TerminalFormatter } from '../utils/terminal-formatter';
import { ITemplumOrchestrator } from './templum-orchestrator-interface';
import { 
  EnhancedInteractiveMenu, 
  EnhancedMenuConfig, 
  MenuSection, 
  MenuItemConfig,
  DefaultColorThemes,
  WindowContentItem 
} from './terminal-ui-components';
import { 
  CLIDisplayConsistencyEngine, 
  createCLIDisplayConsistencyEngine 
} from './cli-display-consistency-engine';
import { ServiceInfo } from './service-ordering-manager';
import { sleep } from '../utils/async-utils';
import { createLogger, normalizeLoggerError } from '../utils/logger';

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
  private readonly formatter: TerminalFormatter;
  private readonly logger = createLogger('interactive-menu-renderer');
  
  constructor(
    orchestrator: ITemplumOrchestrator,
    dependencies: { formatter?: TerminalFormatter } = {}
  ) {
    this.orchestrator = orchestrator;
    this.initializeDefaultMenus();
    this.formatter = dependencies.formatter ?? createFormatter();
    
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

  private writeLine(message: string = ''): void {
    if (typeof process.stdout?.write !== 'function') {
      return;
    }
    const content = message.endsWith('\n') ? message : `${message}\n`;
    process.stdout.write(content);
  }

  private clearDisplay(): void {
    if (typeof process.stdout?.write !== 'function') {
      return;
    }
    process.stdout.write('\u001b[2J\u001b[0f');
  }

  private logWarning(message: string, cause: unknown): void {
    const normalized = normalizeLoggerError(cause);
    const metadata: Record<string, unknown> = {};
    if (normalized.error) {
      metadata.error = normalized.error;
    }
    if (normalized.data !== undefined) {
      metadata.data = normalized.data;
    }
    this.logger.warn(message, Object.keys(metadata).length === 0 ? undefined : metadata);
  }

  private logError(message: string, cause: unknown): void {
    const normalized = normalizeLoggerError(cause);
    const metadata = normalized.data === undefined ? undefined : normalized.data;
    this.logger.error(message, normalized.error, metadata);
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
      this.writeLine(this.formatter.status.warning('Loading menu data...'));
    }

    // Build enhanced menu configuration
    const menuConfig: EnhancedMenuConfig = {
      title: menu.title,
      subtitle: menu.description,
      sections: this.buildEnhancedSections(menu),
      theme: DefaultColorThemes.default,
      formatter: this.formatter,
      onSelection: async (item: WindowContentItem) => {
        // Handle selection with performance tracking
        const selectionStart = Date.now();
        await this.handleEnhancedSelection(item);
        const selectionTime = Date.now() - selectionStart;
        
        // Log performance for UX optimization
        if (selectionTime > 50) {
          this.writeLine(this.formatter.status.debug(`Selection processed in ${selectionTime}ms`));
        }
      },
      onExit: async () => {
        this.writeLine(this.formatter.status.success('Templum CLI shutting down...'));
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
      this.logError('Enhanced menu error', error);
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
          message: this.formatter.ui.prompt('Select an option', 'select'),
          choices: choices,
          pageSize: 15,
          loop: false
        }
      ]);

      return this.processMenuSelection(selection, menu);

    } catch (error) {
      // Handle Ctrl+C or other interruptions with proper CLI design behavior
      if (error && (error as any).isTtyError === false) {
        this.writeLine('\nPress Ctrl+C again to shut down Templum CLI');
        return { action: 'quit', data: { confirmRequired: true } };
      }
      throw error;
    }
  }

  private buildEnhancedSections(menu: InteractiveMenu): MenuSection[] {
    const primaryItems: MenuItemConfig[] = menu.items.map(item => this.toMenuItemConfig(item));

    const sections: MenuSection[] = [
      {
        id: `${menu.id}-primary`,
        heading: menu.description,
        items: primaryItems,
        type: 'menu'
      }
    ];

    const navigationItems: MenuItemConfig[] = [];

    const previousMenu = this.navigationHistory[this.navigationHistory.length - 1] ?? menu.parent;
    if (previousMenu) {
      navigationItems.push({
        id: 'back',
        label: 'Back',
        description: 'Return to previous menu',
        action: `navigate:${previousMenu}`,
        enabled: true,
        data: { action: `navigate:${previousMenu}` }
      });
    }

    navigationItems.push(
      {
        id: 'home',
        label: 'Home',
        description: 'Jump to main menu',
        action: 'navigate:main',
        enabled: true,
        data: { action: 'navigate:main' }
      },
      {
        id: 'help',
        label: 'Help',
        description: 'View keyboard and navigation tips',
        action: 'show:help',
        enabled: true,
        data: { action: 'show:help' }
      },
      {
        id: 'exit',
        label: 'Exit',
        description: 'Close the Templum CLI session',
        action: 'system:quit',
        enabled: true,
        data: { action: 'system:quit' }
      }
    );

    sections.push({
      id: `${menu.id}-navigation`,
      heading: 'Session Controls',
      items: navigationItems,
      type: 'menu'
    });

    return sections;
  }

  private toMenuItemConfig(item: InteractiveMenuItem): MenuItemConfig {
    const action = this.computeMenuAction(item);
    return {
      id: item.id,
      label: item.title,
      description: item.description,
      action,
      enabled: item.enabled,
      icon: item.icon,
      data: {
        action,
        target: item.target,
        command: item.command
      }
    };
  }

  private computeMenuAction(item: InteractiveMenuItem): string {
    switch (item.action) {
      case 'navigate':
        return `navigate:${item.target ?? item.id}`;
      case 'execute':
        return `execute:${item.command ?? item.id}`;
      case 'system':
        return `system:${item.command ?? item.target ?? item.id}`;
      default:
        return `navigate:${item.target ?? this.currentMenu}`;
    }
  }

  private async handleEnhancedSelection(item: WindowContentItem): Promise<void> {
    const payload = (item.data as { action?: string }) ?? {};
    if (!payload.action) {
      return;
    }

    const [actionType, actionTarget] = payload.action.split(':', 2);

    switch (actionType) {
      case 'navigate': {
        if (item.id === 'back') {
          this.navigateBack();
        } else if (actionTarget) {
          this.navigateToMenu(actionTarget);
        }
        break;
      }
      case 'show': {
        if (actionTarget === 'help') {
          await this.displayEnhancedHelp();
        }
        break;
      }
      case 'system':
        // `system:quit` is handled by EnhancedInteractiveMenu after selection
        break;
      default:
        break;
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
      this.logWarning('Failed to update dynamic menu items', error);
    }
  }

  /**
   * Display menu using new CLI window design - no separate header
   */
  private displayMenuHeader(menu: InteractiveMenu): void {
    this.clearDisplay();
    // Header is now integrated into the window layout - no separate display needed
  }

  /**
   * Create choices for inquirer prompt - simplified for window-based design
   */
  private createMenuChoices(menu: InteractiveMenu): any[] {
    const choices: any[] = [];

    // Add menu items (no icons, description handled in window layout)
    for (const item of menu.items) {
      const formattedTitle = item.enabled
        ? this.formatter.palette.primary(item.title)
        : this.formatter.palette.muted(item.title);
      const formattedDescription = item.description
        ? this.formatter.palette.muted(` - ${item.description}`)
        : '';

      choices.push({
        name: `${formattedTitle}${formattedDescription}`,
        value: item.id,
        disabled: !item.enabled ? this.formatter.palette.muted('Not available') : false
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
  private renderHelpLines(): string[] {
    return [
      this.formatter.status.info('Templum Help'),
      '',
      this.formatter.status.info('Navigation:'),
      this.formatter.palette.muted('  ↑↓    Use arrow keys to navigate menu items'),
      this.formatter.palette.muted('  Enter  Select highlighted option'),
      this.formatter.palette.muted('  Ctrl+C Exit application'),
      '',
      this.formatter.status.info('Menu Items:'),
      this.formatter.palette.muted('  Backend Services  - Manage service connections'),
      this.formatter.palette.muted('  Execute Commands  - Run operations on backends'),
      this.formatter.palette.muted('  System Status     - View health and configuration'),
      this.formatter.palette.muted('  Settings          - Configure Templum behavior'),
    ];
  }

  private async displayHelp(): Promise<void> {
    this.clearDisplay();
    for (const line of this.renderHelpLines()) {
      if (line) {
        this.writeLine(line);
      } else {
        this.writeLine();
      }
    }

    // Return immediately - help display integrates with menu navigation
    // CLI-design compliance: No "Press Enter to continue" messages
    return Promise.resolve();
  }

  private async displayEnhancedHelp(): Promise<void> {
    this.clearDisplay();
    for (const line of this.renderHelpLines()) {
      if (line) {
        this.writeLine(line);
      } else {
        this.writeLine();
      }
    }
    this.writeLine(this.formatter.palette.muted('Press any key to continue...'));

    const stdin = process.stdin;
    if (!stdin.isTTY) {
      await sleep(1500);
      return;
    }

    await new Promise<void>((resolve) => {
      stdin.resume();
      const listener = () => {
        stdin.removeListener('data', listener);
        stdin.pause();
        resolve();
      };
      stdin.once('data', listener);
    });
  }

  private convertToMenuResult(item: WindowContentItem): MenuInteractionResult {
    const payload = (item.data as { action?: string }) ?? {};
    if (!payload.action) {
      return { action: 'navigate', target: this.currentMenu };
    }

    const [actionType, actionTarget] = payload.action.split(':', 2);
    switch (actionType) {
      case 'navigate':
        return { action: 'navigate', target: actionTarget ?? this.currentMenu };
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

}
