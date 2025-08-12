/**
 * Example migration from hardcoded separators to content-driven composition
 * Shows before/after comparison for the config menu
 */

import chalk from 'chalk';
import { display } from '../utils/display';
import { menuComposer } from './menu-composer';
import type { MenuContent, MenuDisplayContext } from './menu-types';

/**
 * BEFORE: Original hardcoded approach
 * Manual separator calls scattered throughout the function
 */
export class OldMenuSystem {
  private showConfigMenuOld(context: MenuDisplayContext): void {
    const title = context.currentItem ? 
      `📋 Configuration › ${context.currentItem}` : 
      '📋 Configuration Management Hub';
      
    console.log(chalk.green.bold(title));
    display.printSeparator(display.LENGTHS.SUB_MENU); // HARDCODED LENGTH
    console.log(chalk.dim('Manage Phoenix Code Lite settings and preferences'));
    console.log();
    
    console.log(chalk.yellow.bold('🔧 Configuration Commands:'));
    console.log(chalk.green('  1. show      ') + chalk.gray('- Display current configuration with validation status'));
    console.log(chalk.green('  2. edit      ') + chalk.gray('- Interactive configuration editor with guided setup'));
    console.log(chalk.green('  3. templates ') + chalk.gray('- Browse and apply configuration templates'));
    console.log(chalk.green('  4. framework ') + chalk.gray('- Framework-specific optimization settings'));
    console.log(chalk.green('  5. quality   ') + chalk.gray('- Quality gates and testing thresholds'));
    console.log(chalk.green('  6. security  ') + chalk.gray('- Security policies and guardrails'));
    console.log();
    console.log(chalk.blue('💡 Navigation: ') + chalk.cyan('command name') + chalk.gray(', ') + chalk.cyan('number') + chalk.gray(', ') + chalk.cyan('"back"') + chalk.gray(' to return, ') + chalk.cyan('"quit"') + chalk.gray(' to exit'));
    console.log();
  }
}

/**
 * AFTER: Content-driven approach
 * Declarative menu structure with procedural separator calculation
 */
export class NewMenuSystem {
  private showConfigMenuNew(context: MenuDisplayContext): void {
    // Define menu content as structured data
    const content: MenuContent = {
      title: context.currentItem ? 
        `📋 Configuration › ${context.currentItem}` : 
        '📋 Configuration Management Hub',
      
      subtitle: 'Manage Phoenix Code Lite settings and preferences',
      
      sections: [{
        heading: '🔧 Configuration Commands:',
        theme: {
          headingColor: 'yellow',
          bold: true
        },
        items: [
          {
            label: '1. show',
            description: 'Display current configuration with validation status',
            commands: ['show', '1'],
            type: 'command'
          },
          {
            label: '2. edit',
            description: 'Interactive configuration editor with guided setup',
            commands: ['edit', '2'],
            type: 'command'
          },
          {
            label: '3. templates',
            description: 'Browse and apply configuration templates',
            commands: ['templates', '3'],
            type: 'navigation'
          },
          {
            label: '4. framework',
            description: 'Framework-specific optimization settings',
            commands: ['framework', '4'],
            type: 'setting'
          },
          {
            label: '5. quality',
            description: 'Quality gates and testing thresholds',
            commands: ['quality', '5'],
            type: 'setting'
          },
          {
            label: '6. security',
            description: 'Security policies and guardrails',
            commands: ['security', '6'],
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

    // Single function call handles all separator logic
    menuComposer.compose(content, {
      level: 'config',
      parentMenu: 'main',
      currentItem: context.currentItem,
      breadcrumb: context.breadcrumb
    });
  }
}

/**
 * COMPARISON: Benefits of the new approach
 */
export const comparisonDemo = {
  benefits: {
    'Automatic Separator Sizing': 'Content determines separator length - no hardcoded values',
    'Visual Consistency': 'Uniform calculation ensures consistent spacing across all menus',
    'Maintainability': 'Adding items automatically adjusts separators - no manual recalculation',
    'Separation of Concerns': 'Menu logic separate from display formatting',
    'Type Safety': 'Structured data prevents menu definition errors',
    'Extensibility': 'Easy to add themes, responsive sizing, accessibility features'
  },

  'Migration Strategy': {
    'Phase 1': 'Build composer alongside existing system',
    'Phase 2': 'Migrate one menu at a time using pattern above',
    'Phase 3': 'Remove old hardcoded separator calls',
    'Phase 4': 'Add advanced features (themes, responsive sizing)'
  },

  'Performance Impact': 'Content analysis adds <1ms per menu render',
  'Backward Compatibility': 'Old display utility methods remain functional during migration'
};

/**
 * Example of how different content automatically gets different separator lengths
 */
export const separatorLengthExamples = {
  simpleMenu: {
    content: { title: 'Help', sections: [{ heading: 'Commands', items: [{ label: 'quit', description: 'Exit', commands: ['quit'] }] }] },
    calculatedLength: 45 // Automatically smaller for simple content
  },
  
  complexMenu: {
    content: { 
      title: '🔧 Advanced Configuration Management System', 
      sections: [
        { heading: 'Primary Configuration Options', items: [/* 6 items */] },
        { heading: 'Advanced Settings and Preferences', items: [/* 8 items */] }
      ] 
    },
    calculatedLength: 75 // Automatically larger for complex content
  }
};

/**
 * Usage pattern that replaces all hardcoded separator calls
 */
export const usagePattern = `
// OLD WAY (scattered throughout codebase):
display.printSeparator(display.LENGTHS.SUB_MENU);
display.printDivider(display.LENGTHS.MAIN_MENU);
console.log(chalk.gray('═'.repeat(60))); // Manual calculation

// NEW WAY (single intelligent call):
menuComposer.compose(menuContent, context);
// ^ This handles ALL separator logic procedurally
`;
