/**---
 * title: [Menu Composer - Content-Driven Menu Assembly]
 * tags: [CLI, Menu, Composition, Formatting]
 * provides: [MenuComposer Class, Separator Sizing, Content Formatting]
 * requires: [display Utils, MenuLayoutManager, Menu Types]
 * description: [Constructs formatted menus from content with procedural sizing and layout preparation for consistent CLI rendering.]
 * ---*/

import chalk from 'chalk';
import { display } from '../utils/display';
import { MenuLayoutManager, type CalculatedMenuLayout } from './menu-layout-manager';
import type { 
  MenuContent, 
  MenuDisplayContext, 
  MenuLayout, 
  ContentMeasurements,
  MenuComposerOptions,
  MenuItem,
  MenuSection 
} from './menu-types';

/**
 * Content-driven menu composition system
 * Procedurally determines separator lengths and handles all menu formatting
 */
export class MenuComposer {
  private readonly options: MenuComposerOptions;
  private readonly layoutManager: MenuLayoutManager;

  constructor(options: Partial<MenuComposerOptions> = {}) {
    this.options = {
      autoSize: true,
      minSeparatorLength: 40,
      maxSeparatorLength: 100,
      defaultPadding: 2,
      debug: false,
      ...options
    };
    
    this.layoutManager = new MenuLayoutManager({
      fixedHeight: 25,
      commandTextboxLines: 3,
      paddingLines: 2,
      enforceConsistentHeight: true
    });
  }

  /**
   * Main composition function with consistent height support
   * Handles both separator calculation AND static textbox positioning
   */
  public compose(content: MenuContent, context: MenuDisplayContext): void {
    const baseLayout = this.calculateLayout(content, context);
    const consistentLayout = this.layoutManager.calculateConsistentLayout(
      content, 
      context, 
      baseLayout
    );
    
    if (this.options.debug) {
      this.debugLayout(content, consistentLayout);
    }
    
    // Use layout manager for consistent height rendering
    this.layoutManager.renderWithConsistentHeight(content, consistentLayout, context);
  }

  /**
   * Original compose method for backward compatibility
   */
  public composeBasic(content: MenuContent, context: MenuDisplayContext): void {
    const layout = this.calculateLayout(content, context);
    this.renderMenu(content, layout, context);
  }

  /**
   * Procedurally determines separator lengths based on content
   * Core intelligence that replaces hardcoded length decisions
   */
  private calculateLayout(content: MenuContent, context: MenuDisplayContext): MenuLayout {
    const measurements = this.measureContent(content);
    
    return {
      headerSeparatorLength: this.calculateHeaderLength(measurements, content, context),
      sectionSeparatorLength: this.calculateSectionLength(measurements, content, context),
      footerSeparatorLength: this.calculateFooterLength(measurements, content, context),
      menuWidth: this.calculateMenuWidth(measurements, content, context),
      padding: {
        left: this.options.defaultPadding,
        right: this.options.defaultPadding,
        top: 1,
        bottom: 1
      }
    };
  }

  /**
   * Intelligent content measurement
   * Analyzes menu content to determine optimal separator lengths
   */
  private measureContent(content: MenuContent): ContentMeasurements {
    const titleLength = this.measureText(content.title);
    const subtitleLength = content.subtitle ? this.measureText(content.subtitle) : 0;
    const longestItemLength = this.findLongestItem(content);
    const sectionCount = content.sections.length;
    const totalItems = this.countTotalItems(content);
    
    // Calculate complexity score based on content characteristics
    const complexityScore = this.calculateComplexityScore({
      titleLength,
      subtitleLength,
      sectionCount,
      totalItems,
      longestItemLength
    });
    
    const minimumWidth = Math.max(titleLength, subtitleLength, longestItemLength);
    
    return {
      titleLength,
      longestItemLength,
      sectionCount,
      totalItems,
      complexityScore,
      minimumWidth
    };
  }

  /**
   * Calculate header separator length based on content
   */
  private calculateHeaderLength(measurements: ContentMeasurements, content: MenuContent, context: MenuDisplayContext): number {
    const baseLength = Math.max(measurements.titleLength, measurements.minimumWidth);
    const contextMultiplier = this.getContextMultiplier(context.level);
    const complexityAdjustment = Math.floor(measurements.complexityScore * 5);
    
    const calculatedLength = Math.floor(baseLength * contextMultiplier) + complexityAdjustment;
    
    return this.clampLength(calculatedLength);
  }

  /**
   * Calculate section separator length
   */
  private calculateSectionLength(measurements: ContentMeasurements, content: MenuContent, context: MenuDisplayContext): number {
    // Section separators are typically shorter than headers
    const headerLength = this.calculateHeaderLength(measurements, content, context);
    const sectionLength = Math.floor(headerLength * 0.85);
    
    return this.clampLength(sectionLength);
  }

  /**
   * Calculate footer separator length
   */
  private calculateFooterLength(measurements: ContentMeasurements, content: MenuContent, context: MenuDisplayContext): number {
    // Footer separators match header length for symmetry
    return this.calculateHeaderLength(measurements, content, context);
  }

  /**
   * Calculate overall menu width
   */
  private calculateMenuWidth(measurements: ContentMeasurements, content: MenuContent, context: MenuDisplayContext): number {
    return this.calculateHeaderLength(measurements, content, context);
  }

  /**
   * Measure text length accounting for ANSI color codes
   */
  private measureText(text: string): number {
    // Remove ANSI escape codes for accurate length measurement
    const cleanText = text.replace(/\u001b\[[0-9;]*m/g, '');
    return cleanText.length;
  }

  /**
   * Find the longest item in all menu sections
   */
  private findLongestItem(content: MenuContent): number {
    let longestLength = 0;
    
    for (const section of content.sections) {
      const sectionHeaderLength = this.measureText(section.heading);
      longestLength = Math.max(longestLength, sectionHeaderLength);
      
      for (const item of section.items) {
        const itemLength = this.measureText(`${item.label} - ${item.description}`);
        longestLength = Math.max(longestLength, itemLength);
      }
    }
    
    return longestLength;
  }

  /**
   * Count total menu items across all sections
   */
  private countTotalItems(content: MenuContent): number {
    return content.sections.reduce((total, section) => total + section.items.length, 0);
  }

  /**
   * Calculate complexity score for adaptive sizing
   */
  private calculateComplexityScore(metrics: {
    titleLength: number;
    subtitleLength: number;
    sectionCount: number;
    totalItems: number;
    longestItemLength: number;
  }): number {
    const lengthFactor = (metrics.titleLength + metrics.longestItemLength) / 200;
    const itemFactor = metrics.totalItems / 20;
    const sectionFactor = metrics.sectionCount / 5;
    
    return Math.min(1.0, lengthFactor + itemFactor + sectionFactor);
  }

  /**
   * Get context-specific multiplier for different menu levels
   */
  private getContextMultiplier(level: string): number {
    const multipliers: Record<string, number> = {
      main: 1.2,      // Main menus get longer separators
      config: 1.0,    // Standard length
      templates: 1.0, // Standard length
      advanced: 1.1,  // Slightly longer
      generate: 1.0,  // Standard length
      help: 0.9       // Shorter for help content
    };
    
    return multipliers[level] || 1.0;
  }

  /**
   * Clamp separator length within acceptable bounds
   */
  private clampLength(length: number): number {
    return Math.max(
      this.options.minSeparatorLength,
      Math.min(this.options.maxSeparatorLength, length)
    );
  }

  /**
   * Render the complete menu using calculated layout
   */
  private renderMenu(content: MenuContent, layout: MenuLayout, context: MenuDisplayContext): void {
    // Render title
    console.log(chalk.red.bold(content.title));
    
    // Render header separator (procedurally calculated)
    display.printSeparator(layout.headerSeparatorLength);
    
    // Render subtitle if present
    if (content.subtitle) {
      console.log(chalk.dim(content.subtitle));
      console.log();
    }
    
    // Render sections
    for (let i = 0; i < content.sections.length; i++) {
      const section = content.sections[i];
      this.renderSection(section, layout);
      
      // Add spacing between sections
      if (i < content.sections.length - 1) {
        console.log();
      }
    }
    
    // Render footer separator
    if (content.footerHints && content.footerHints.length > 0) {
      display.printDivider(layout.footerSeparatorLength);
      
      for (const hint of content.footerHints) {
        console.log(chalk.blue('* ') + hint);
      }
      console.log();
    }
  }

  /**
   * Render a menu section with its items
   */
  private renderSection(section: MenuSection, layout: MenuLayout): void {
    // Section heading with theme support
    const headingColor = section.theme?.headingColor || 'yellow';
    const headingStyle = section.theme?.bold ? chalk[headingColor].bold : chalk[headingColor];
    
    console.log(headingStyle(section.heading));
    
    // Render section items
    for (const item of section.items) {
      this.renderMenuItem(item);
    }
    
    // Add description if present
    if (section.description) {
      console.log(chalk.gray(`  ${section.description}`));
    }
  }

  /**
   * Render an individual menu item
   */
  private renderMenuItem(item: MenuItem): void {
    const icon = item.icon || '';
    const label = chalk.green(`  ${item.label}`);
    const description = chalk.gray(` - ${item.description}`);
    
    console.log(`${icon}${label}${description}`);
  }

  /**
   * Debug output for layout calculation
   */
  private debugLayout(content: MenuContent, layout: MenuLayout): void {
    console.log(chalk.cyan('\n=== Menu Layout Debug ==='));
    console.log(`Header Separator: ${layout.headerSeparatorLength} chars`);
    console.log(`Section Separator: ${layout.sectionSeparatorLength} chars`);
    console.log(`Footer Separator: ${layout.footerSeparatorLength} chars`);
    console.log(`Menu Width: ${layout.menuWidth} chars`);
    console.log(chalk.cyan('========================\n'));
  }
}

// Export convenience instance with default options
export const menuComposer = new MenuComposer();
