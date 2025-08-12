# CLI Menu Separator Architecture Design

## Current Architecture Issues

### Problems Identified

1. **Hardcoded Separator Calls**: Each menu manually calls `display.printSeparator()` with specific lengths
2. **Inconsistent Approaches**: Mixed manual calculations and predefined lengths
3. **Tight Coupling**: Menu content logic mixed with display formatting concerns
4. **Code Duplication**: Similar separator patterns repeated across menu functions
5. **Manual Maintenance**: Adding new menu items requires manual separator length adjustments

### Current Implementation Pattern

```typescript
// Current approach in menu-system.ts
private showMainMenu(): void {
  console.log(chalk.red.bold('🔥 Phoenix Code Lite') + chalk.gray(' • ') + chalk.blue('TDD Workflow Orchestrator'));
  display.printSeparator(display.LENGTHS.MAIN_MENU); // Manual call
  console.log(chalk.dim('Transform natural language into production-ready code through TDD'));
  // ... menu content ...
  display.printDivider(display.LENGTHS.MAIN_MENU); // Another manual call
}
```

## Proposed Architecture: Content-Driven Menu Composer

### Design Philosophy

- **Content Determines Form**: Menu content procedurally dictates separator requirements
- **Single Responsibility**: Dedicated menu composition system handles all formatting
- **Intelligent Calculation**: Automatic separator length based on content analysis
- **Separation of Concerns**: Menu logic separate from display formatting

### Core Components

#### 1. Menu Content Definition Interface

```typescript
interface MenuContent {
  title: string;
  subtitle?: string;
  sections: MenuSection[];
  footerHints?: string[];
  breadcrumb?: string[];
}

interface MenuSection {
  heading: string;
  items: MenuItem[];
  description?: string;
}

interface MenuItem {
  label: string;
  description: string;
  commands: string[];
  icon?: string;
}
```

#### 2. Intelligent Menu Composer

```typescript
class MenuComposer {
  /**
   * Main composition function - replaces all manual separator calls
   */
  public compose(content: MenuContent, context: MenuContext): void {
    const layout = this.calculateLayout(content);
    this.renderMenu(content, layout);
  }

  /**
   * Procedurally determines separator lengths based on content
   */
  private calculateLayout(content: MenuContent): MenuLayout {
    const measurements = this.measureContent(content);
    return {
      headerSeparatorLength: this.calculateHeaderLength(measurements),
      sectionSeparatorLength: this.calculateSectionLength(measurements),
      footerSeparatorLength: this.calculateFooterLength(measurements)
    };
  }

  /**
   * Content-aware length calculation
   */
  private measureContent(content: MenuContent): ContentMeasurements {
    return {
      titleLength: this.measureText(content.title),
      longestItemLength: this.findLongestItem(content),
      sectionCount: content.sections.length,
      totalItems: this.countTotalItems(content)
    };
  }
}
```

#### 3. Enhanced Display Utility Integration

```typescript
// Enhanced display.ts methods
export class DisplayUtility {
  /**
   * Context-aware separator with intelligent sizing
   */
  static contextSeparator(context: MenuDisplayContext): string {
    const length = this.calculateContextLength(context);
    return this.separator(length, this.getContextChar(context), this.getContextColor(context));
  }

  /**
   * Smart length calculation based on content metrics
   */
  private static calculateContextLength(context: MenuDisplayContext): number {
    const baseLength = this.LENGTHS[context.menuType];
    const contentAdjustment = this.calculateContentAdjustment(context);
    const complexityAdjustment = this.calculateComplexityAdjustment(context);
    
    return Math.max(
      this.MIN_SEPARATOR_LENGTH,
      Math.min(this.MAX_SEPARATOR_LENGTH, baseLength + contentAdjustment + complexityAdjustment)
    );
  }
}
```

### Implementation Strategy

#### Phase 1: Core Infrastructure

1. **Menu Content Types**: Define TypeScript interfaces for structured menu data
2. **Layout Calculator**: Implement content measurement and length calculation algorithms
3. **Menu Composer Class**: Build the main composition engine

#### Phase 2: Display Integration

1. **Enhanced Display Utility**: Extend with context-aware methods
2. **Content Measurement**: Implement text measurement and content analysis
3. **Layout Engine**: Build the procedural layout determination system

#### Phase 3: Menu System Refactor

1. **Data Extraction**: Convert existing hardcoded menus to structured data
2. **Composer Integration**: Replace manual separator calls with composer usage
3. **Validation**: Ensure visual consistency and proper spacing

### Architectural Benefits

#### 1. Content-Driven Design

- **Automatic Adaptation**: Separator lengths adjust to content changes
- **Consistent Spacing**: Unified calculation ensures visual consistency
- **Maintainable**: Adding menu items doesn't require manual separator adjustments

#### 2. Separation of Concerns

- **Menu Logic**: Focused on content structure and navigation
- **Display Logic**: Centralized in composer and display utilities
- **Layout Logic**: Procedural calculation based on content metrics

#### 3. Extensibility

- **Theme Support**: Easy to add different separator styles and lengths
- **Responsive Design**: Could adapt to terminal width in future
- **Accessibility**: Centralized place to add accessibility features

### Usage Example

#### Before (Current)

```typescript
private showConfigMenu(context: SessionContext): void {
  const title = context.currentItem ? 
    `📋 Configuration › ${context.currentItem}` : 
    '📋 Configuration Management Hub';
    
  console.log(chalk.green.bold(title));
  display.printSeparator(display.LENGTHS.SUB_MENU); // Manual
  console.log(chalk.dim('Manage Phoenix Code Lite settings and preferences'));
  console.log();
  
  console.log(chalk.yellow.bold('🔧 Configuration Commands:'));
  console.log(chalk.green('  1. show      ') + chalk.gray('- Display current configuration with validation status'));
  // ... more content ...
}
```

#### After (Proposed)

```typescript
private showConfigMenu(context: SessionContext): void {
  const content: MenuContent = {
    title: context.currentItem ? 
      `📋 Configuration › ${context.currentItem}` : 
      '📋 Configuration Management Hub',
    subtitle: 'Manage Phoenix Code Lite settings and preferences',
    sections: [{
      heading: '🔧 Configuration Commands:',
      items: [
        { label: '1. show', description: 'Display current configuration with validation status', commands: ['show', '1'] },
        { label: '2. edit', description: 'Interactive configuration editor with guided setup', commands: ['edit', '2'] },
        // ... more items ...
      ]
    }],
    footerHints: ['command name, number, "back" to return, "quit" to exit']
  };

  this.menuComposer.compose(content, { level: 'config', parentMenu: 'main' });
}
```

## Implementation Specification

### File Changes Required

#### 1. New Files

- `src/cli/menu-composer.ts` - Main composition engine
- `src/cli/menu-types.ts` - TypeScript interfaces for menu structure
- `src/cli/layout-calculator.ts` - Content measurement and layout logic

#### 2. Enhanced Files

- `src/utils/display.ts` - Add context-aware methods
- `src/cli/menu-system.ts` - Refactor to use composer pattern

#### 3. Migration Strategy

- **Phase 1**: Build composer infrastructure alongside existing code
- **Phase 2**: Migrate one menu at a time to new system
- **Phase 3**: Remove old separator calls once all menus migrated

### Quality Gates

- **Visual Consistency**: All menus maintain proper spacing and alignment
- **Performance**: Content measurement should be <1ms per menu
- **Type Safety**: All menu content properly typed with TypeScript
- **Backward Compatibility**: Existing display utility methods remain functional

This architecture addresses the user's vision of procedural separator determination while providing a more maintainable, extensible, and architecturally sound solution.
