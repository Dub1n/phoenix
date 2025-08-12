import chalk from 'chalk';
import type { MenuContent, MenuDisplayContext, MenuLayout } from './menu-types';

/**
 * Extended menu layout manager that ensures consistent height and textbox positioning
 * Addresses the user's requirement for static menu appearance when navigating submenus
 */

export interface MenuLayoutConstraints {
  /** Fixed height in terminal lines for consistent positioning */
  fixedHeight: number;
  
  /** Reserved lines at bottom for command textbox */
  commandTextboxLines: number;
  
  /** Padding lines between menu content and textbox */
  paddingLines: number;
  
  /** Whether to force consistent height across all menu levels */
  enforceConsistentHeight: boolean;
}

export interface CalculatedMenuLayout extends MenuLayout {
  /** Total lines this menu will consume */
  totalLines: number;
  
  /** Lines available for menu content */
  contentLines: number;
  
  /** Lines reserved for textbox area */
  textboxAreaLines: number;
  
  /** Number of blank lines to add for consistent height */
  paddingLinesNeeded: number;
  
  /** Whether content needs truncation */
  needsTruncation: boolean;
}

export class MenuLayoutManager {
  private readonly constraints: MenuLayoutConstraints;
  
  constructor(constraints: Partial<MenuLayoutConstraints> = {}) {
    this.constraints = {
      fixedHeight: 25,           // Standard terminal height minus some buffer
      commandTextboxLines: 3,    // Space for "Phoenix> " prompt and input
      paddingLines: 2,           // Breathing room between menu and textbox
      enforceConsistentHeight: true,
      ...constraints
    };
  }

  /**
   * Calculate layout with consistent height constraints
   * This ensures the command textbox always appears in the same position
   */
  calculateConsistentLayout(
    content: MenuContent, 
    context: MenuDisplayContext,
    baseLayout: MenuLayout
  ): CalculatedMenuLayout {
    
    const contentLines = this.estimateContentLines(content);
    const availableContentLines = this.constraints.fixedHeight - 
      this.constraints.commandTextboxLines - 
      this.constraints.paddingLines;
    
    const paddingLinesNeeded = Math.max(0, 
      availableContentLines - contentLines
    );
    
    const needsTruncation = contentLines > availableContentLines;
    
    return {
      ...baseLayout,
      totalLines: this.constraints.fixedHeight,
      contentLines: Math.min(contentLines, availableContentLines),
      textboxAreaLines: this.constraints.commandTextboxLines,
      paddingLinesNeeded,
      needsTruncation
    };
  }

  /**
   * Render menu with consistent height and static textbox positioning
   */
  renderWithConsistentHeight(
    content: MenuContent, 
    layout: CalculatedMenuLayout,
    context: MenuDisplayContext
  ): void {
    
    // Clear screen for consistent positioning
    if (this.constraints.enforceConsistentHeight) {
      this.clearScreen();
    }
    
    // Render menu content within height constraints
    this.renderConstrainedContent(content, layout, context);
    
    // Add padding to maintain consistent height
    this.addConsistentPadding(layout.paddingLinesNeeded);
    
    // Render static textbox area
    this.renderStaticTextboxArea(context);
  }

  /**
   * Estimate how many terminal lines the content will consume
   */
  private estimateContentLines(content: MenuContent): number {
    let lines = 0;
    
    // Title line
    lines += 1;
    
    // Header separator line
    lines += 1;
    
    // Subtitle line (if present)
    if (content.subtitle) {
      lines += 1;
    }
    
    // Blank line after subtitle
    lines += 1;
    
    // Section content
    for (const section of content.sections) {
      // Section heading
      lines += 1;
      
      // Section items
      lines += section.items.length;
      
      // Section description (if present)
      if (section.description) {
        lines += 1;
      }
      
      // Blank line between sections
      lines += 1;
    }
    
    // Footer hints
    if (content.footerHints && content.footerHints.length > 0) {
      lines += 1; // Separator
      lines += content.footerHints.length;
    }
    
    return lines;
  }

  /**
   * Render content within height constraints
   */
  private renderConstrainedContent(
    content: MenuContent, 
    layout: CalculatedMenuLayout,
    context: MenuDisplayContext
  ): void {
    
    let renderedLines = 0;
    const maxLines = layout.contentLines;
    
    // Render title (always shown)
    if (renderedLines < maxLines) {
      console.log(chalk.red.bold(content.title));
      renderedLines++;
    }
    
    // Render separator (always shown)
    if (renderedLines < maxLines) {
      console.log('═'.repeat(layout.headerSeparatorLength));
      renderedLines++;
    }
    
    // Render subtitle if present and space available
    if (content.subtitle && renderedLines < maxLines) {
      console.log(chalk.dim(content.subtitle));
      renderedLines++;
    }
    
    // Blank line
    if (renderedLines < maxLines) {
      console.log();
      renderedLines++;
    }
    
    // Render sections within remaining space
    for (const section of content.sections) {
      if (renderedLines >= maxLines) break;
      
      // Section heading
      if (renderedLines < maxLines) {
        const headingColor = section.theme?.headingColor || 'yellow';
        const headingStyle = section.theme?.bold ? chalk[headingColor].bold : chalk[headingColor];
        console.log(headingStyle(section.heading));
        renderedLines++;
      }
      
      // Section items
      for (const item of section.items) {
        if (renderedLines >= maxLines) break;
        
        const icon = item.icon || '';
        const label = chalk.green(`  ${item.label}`);
        const description = chalk.gray(` - ${item.description}`);
        console.log(`${icon}${label}${description}`);
        renderedLines++;
      }
      
      // Add spacing between sections if space available
      if (renderedLines < maxLines) {
        console.log();
        renderedLines++;
      }
    }
    
    // Show truncation indicator if needed
    if (layout.needsTruncation) {
      console.log(chalk.yellow('  ... more options available'));
    }
  }

  /**
   * Add blank lines to maintain consistent height
   */
  private addConsistentPadding(paddingLinesNeeded: number): void {
    for (let i = 0; i < paddingLinesNeeded; i++) {
      console.log();
    }
  }

  /**
   * Render the static textbox area at consistent position
   */
  private renderStaticTextboxArea(context: MenuDisplayContext): void {
    // Separator line above textbox
    console.log(chalk.gray('─'.repeat(60)));
    
    // Navigation hint line
    const navHint = this.generateNavigationHint(context);
    console.log(chalk.blue('💡 ') + navHint);
    
    // The actual textbox positioning will be handled by the session manager
    // This just ensures the space is reserved consistently
  }

  /**
   * Generate context-appropriate navigation hint
   */
  private generateNavigationHint(context: MenuDisplayContext): string {
    const hints = [];
    
    if (context.level !== 'main') {
      hints.push(chalk.cyan('"back"') + chalk.gray(' to return'));
    }
    
    hints.push(chalk.cyan('"help"') + chalk.gray(' for commands'));
    hints.push(chalk.cyan('"quit"') + chalk.gray(' to exit'));
    
    return hints.join(chalk.gray(', '));
  }

  /**
   * Clear screen for consistent positioning (optional)
   */
  private clearScreen(): void {
    // Use ANSI escape sequences to clear screen and position cursor
    process.stdout.write('\x1b[2J\x1b[H');
  }

  /**
   * Get consistent textbox position (lines from top)
   */
  getTextboxPosition(): number {
    return this.constraints.fixedHeight - this.constraints.commandTextboxLines;
  }

  /**
   * Update constraints (useful for responsive design)
   */
  updateConstraints(newConstraints: Partial<MenuLayoutConstraints>): void {
    Object.assign(this.constraints, newConstraints);
  }
}

// Export convenience instance with default constraints
export const menuLayoutManager = new MenuLayoutManager();