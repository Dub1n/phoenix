/**---
 * title: [Interactive Renderer - Unified Architecture]
 * tags: [Unified, Interaction, Rendering]
 * provides: [Interactive Renderer]
 * requires: []
 * description: [Renderer for interactive (menu) mode in unified CLI system.]
 * ---*/

import chalk from 'chalk';
import inquirer from 'inquirer';
import { 
  InteractionRenderer, 
  InteractionResult, 
  InteractionMode 
} from '../types/interaction-abstraction';
import { 
  MenuDefinition, 
  MenuContext, 
  MenuItem, 
  MenuAction 
} from '../types/menu-definitions';
import { renderLegacyWithUnified } from '../cli/skin-menu-renderer';
import type { MenuContent, MenuDisplayContext } from '../cli/menu-types';

export class InteractiveRenderer implements InteractionRenderer {
  readonly mode: InteractionMode = {
    name: 'interactive',
    displayName: 'Interactive Navigation',
    capabilities: {
      supportsArrowNavigation: true,
      supportsTextInput: true,
      supportsKeyboardShortcuts: true,
      supportsRealTimeValidation: false
    },
    configuration: {
      inputTimeout: 30000,
      displayOptions: {
        showNumbers: true,
        showShortcuts: true,
        compactMode: false
      }
    }
  };

  constructor() {
    // No setup needed for inquirer
  }

  /**
   * Render menu using unified layout engine
   */
  async renderMenu(definition: MenuDefinition, context: MenuContext): Promise<void> {
    // For interactive mode, we don't need to render the old menu display
    // since inquirer will handle the interactive interface
    // Just show a simple header
    console.log(chalk.blue.bold(`* ${definition.title}`));
    if (definition.description) {
      console.log(chalk.gray(definition.description));
    }
    console.log(); // Empty line for spacing
  }

  /**
   * Handle input with interactive selection using arrow keys
   */
  async handleInput(definition: MenuDefinition, context: MenuContext): Promise<InteractionResult> {
    try {
      // Create choices for inquirer
      const choices = this.createChoices(definition, context);
      
      // Add global commands as choices
      choices.push(
        { name: '🔙 Back', value: 'back', short: 'back' },
        { name: '🏠 Home', value: 'home', short: 'home' },
        { name: '❓ Help', value: 'help', short: 'help' },
        { name: '🚪 Quit', value: 'quit', short: 'quit' }
      );
      
      const { choice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'choice',
          message: 'Select an option:',
          choices: choices,
          pageSize: 15
        }
      ]);
      
      // Handle global commands
      if (['back', 'home', 'help', 'quit'].includes(choice)) {
        const result = this.handleGlobalCommands(choice, definition, context);
        if (result) {
          return result;
        }
      }
      
      // Find the selected menu item
      const selectedItem = this.findItemByChoice(choice, definition);
      if (selectedItem) {
        // Check if item is enabled
        if (await this.isItemEnabled(selectedItem, context)) {
          return {
            action: selectedItem.action,
            selectedItem,
            success: true
          };
        } else {
          return {
            action: { type: 'execute' },
            success: false,
            message: `Option "${selectedItem.label}" is currently disabled`
          };
        }
      }
      
      return {
        action: { type: 'execute' },
        success: false,
        message: 'Invalid selection'
      };
      
    } catch (error) {
      // Handle Ctrl+C gracefully
      if (error instanceof Error && error.message.includes('User force closed')) {
        return {
          action: { type: 'exit' },
          success: true
        };
      }
      throw error;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // No cleanup needed for inquirer
  }

  /**
   * Create choices for inquirer from menu definition
   */
  private createChoices(definition: MenuDefinition, context: MenuContext): Array<{name: string, value: string, short?: string}> {
    const choices: Array<{name: string, value: string, short?: string}> = [];
    
    for (const section of definition.sections) {
      // Add section header if it has a heading
      if (section.heading) {
        choices.push({
          name: chalk.cyan(`⋇ ${section.heading}`),
          value: `section-${section.id}`,
          short: section.heading
        });
      }
      
      // Add menu items
      for (const [index, item] of section.items.entries()) {
        const itemNumber = index + 1;
        const shortcuts = item.shortcuts?.join(', ') || '';
        const shortcutText = shortcuts ? ` [${shortcuts}]` : '';
        
        choices.push({
          name: `${itemNumber}. ${item.label}${shortcutText}`,
          value: item.id,
          short: item.id
        });
      }
    }
    
    return choices;
  }

  /**
   * Find menu item by choice value
   */
  private findItemByChoice(choice: string, definition: MenuDefinition): MenuItem | null {
    for (const section of definition.sections) {
      for (const item of section.items) {
        if (item.id === choice) {
          return item;
        }
      }
    }
    return null;
  }

  /**
   * Convert MenuDefinition to MenuContent format
   */
  private convertToMenuContent(definition: MenuDefinition, context: MenuContext): MenuContent {
    return {
      title: definition.title,
      subtitle: definition.description,
      sections: definition.sections.map(section => ({
        heading: section.heading,
        theme: {
          headingColor: (['red', 'green', 'yellow', 'blue', 'magenta', 'cyan'].includes(section.theme?.headingColor || '') 
            ? section.theme?.headingColor as 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan'
            : 'cyan'),
          bold: section.theme?.bold !== undefined ? section.theme.bold : true
        },
        items: section.items.map((item, index) => ({
          label: item.label,
          description: item.description || '',
          commands: [(index + 1).toString(), item.id],
          type: item.action.type === 'navigate' ? 'navigation' : 'command'
        }))
      })),
      footerHints: ['Use arrow keys to navigate, Enter to select'],
      metadata: {
        menuType: definition.metadata?.contextLevel === 'main' ? 'main' : 'sub',
        complexityLevel: 'moderate',
        priority: 'normal',
        autoSize: true
      }
    };
  }

  /**
   * Create display context for rendering
   */
  private createDisplayContext(definition: MenuDefinition, context: MenuContext): MenuDisplayContext {
    return {
      level: context.level as 'main' | 'config' | 'templates' | 'advanced' | 'generate' | 'settings',
      breadcrumb: this.getBreadcrumb(context)
    };
  }

  /**
   * Get breadcrumb from context
   */
  private getBreadcrumb(context: MenuContext): string[] {
    // Extract breadcrumb from session context if available
    const sessionContext = context.sessionContext as any;
    return sessionContext.breadcrumb || ['Phoenix Code Lite'];
  }

  /**
   * Handle global commands that work in all contexts
   */
  private handleGlobalCommands(input: string, definition: MenuDefinition, context: MenuContext): InteractionResult | null {
    const cmd = input.toLowerCase().trim();
    
    switch (cmd) {
      case 'back':
        return { 
          action: { type: 'back' }, 
          success: true 
        };
        
      case 'home':
        return { 
          action: { type: 'navigate', target: 'main' }, 
          success: true 
        };
        
      case 'quit':
        return { 
          action: { type: 'exit' }, 
          success: true 
        };
        
      case 'help':
        return { 
          action: { type: 'execute', handler: 'system:help' }, 
          success: true 
        };
    }
    
    return null;
  }

  /**
   * Check if menu item is enabled
   */
  private async isItemEnabled(item: MenuItem, context: MenuContext): Promise<boolean> {
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
