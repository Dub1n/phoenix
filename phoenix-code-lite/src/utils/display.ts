/**---
 * title: [Display Utilities - Terminal Formatting]
 * tags: [Utility, Display, Formatting]
 * provides: [display Functions, Color Helpers]
 * requires: [chalk]
 * description: [Terminal output helpers for consistent formatting and color usage across CLI components.]
 * ---*/

import chalk from 'chalk';

/**
 * Display utility for consistent UI formatting across Phoenix Code Lite
 * Centralizes separator, header, and menu formatting logic
 */
export class DisplayUtility {
  private static readonly DEFAULT_SEPARATOR_LENGTH = 60;
  private static readonly DEFAULT_SEPARATOR_CHAR = '═';
  private static readonly DEFAULT_DIVIDER_CHAR = '─';

  /**
   * Generate a separator line with consistent styling
   * @param length - Length of separator (default: 60)
   * @param char - Character to use (default: '═')
   * @param color - Chalk color function (default: gray)
   */
  static separator(length: number = this.DEFAULT_SEPARATOR_LENGTH, char: string = this.DEFAULT_SEPARATOR_CHAR, color = chalk.gray): string {
    return color(char.repeat(length));
  }

  /**
   * Generate a divider line (thinner separator)
   * @param length - Length of divider (default: 60)
   * @param char - Character to use (default: '─')
   * @param color - Chalk color function (default: gray)
   */
  static divider(length: number = this.DEFAULT_SEPARATOR_LENGTH, char: string = this.DEFAULT_DIVIDER_CHAR, color = chalk.gray): string {
    return color(char.repeat(length));
  }

  /**
   * Print a separator line to console
   * @param length - Length of separator (default: 60)
   * @param char - Character to use (default: '═')
   * @param color - Chalk color function (default: gray)
   */
  static printSeparator(length: number = this.DEFAULT_SEPARATOR_LENGTH, char: string = this.DEFAULT_SEPARATOR_CHAR, color = chalk.gray): void {
    console.log(this.separator(length, char, color));
  }

  /**
   * Print a divider line to console
   * @param length - Length of divider (default: 60)
   * @param char - Character to use (default: '─')
   * @param color - Chalk color function (default: gray)
   */
  static printDivider(length: number = this.DEFAULT_SEPARATOR_LENGTH, char: string = this.DEFAULT_DIVIDER_CHAR, color = chalk.gray): void {
    console.log(this.divider(length, char, color));
  }

  /**
   * Generate a header with consistent formatting
   * @param title - Header title
   * @param level - Header level (1-3, affects styling)
   * @param length - Separator length (default: 60)
   */
  static header(title: string, level: 1 | 2 | 3 = 1, length: number = this.DEFAULT_SEPARATOR_LENGTH): string {
    const separator = this.separator(length);
    const titleStyle = level === 1 ? chalk.red.bold : level === 2 ? chalk.blue.bold : chalk.cyan.bold;
    
    return `${separator}\n${titleStyle(title)}\n${separator}`;
  }

  /**
   * Print a header to console
   * @param title - Header title
   * @param level - Header level (1-3, affects styling)
   * @param length - Separator length (default: 60)
   */
  static printHeader(title: string, level: 1 | 2 | 3 = 1, length: number = this.DEFAULT_SEPARATOR_LENGTH): void {
    console.log(this.header(title, level, length));
  }

  /**
   * Generate a section separator with title
   * @param title - Section title
   * @param length - Separator length (default: 60)
   */
  static section(title: string, length: number = this.DEFAULT_SEPARATOR_LENGTH): string {
    const separator = this.separator(length);
    return `${separator}\n${chalk.cyan.bold(title)}\n${separator}`;
  }

  /**
   * Print a section separator to console
   * @param title - Section title
   * @param length - Separator length (default: 60)
   */
  static printSection(title: string, length: number = this.DEFAULT_SEPARATOR_LENGTH): void {
    console.log(this.section(title, length));
  }

  /**
   * Context-aware separator lengths for different UI contexts
   */
  static readonly LENGTHS = {
    MAIN_MENU: 70,
    SUB_MENU: 60,
    COMMAND: 50,
    HELP: 80,
    COMPACT: 40
  } as const;

  /**
   * Get context-appropriate separator length
   * @param context - UI context
   */
  static getLength(context: keyof typeof DisplayUtility.LENGTHS = 'COMMAND'): number {
    return this.LENGTHS[context];
  }
}

// Export convenience functions for direct use
export const display = {
  separator: DisplayUtility.separator.bind(DisplayUtility),
  divider: DisplayUtility.divider.bind(DisplayUtility),
  printSeparator: DisplayUtility.printSeparator.bind(DisplayUtility),
  printDivider: DisplayUtility.printDivider.bind(DisplayUtility),
  header: DisplayUtility.header.bind(DisplayUtility),
  printHeader: DisplayUtility.printHeader.bind(DisplayUtility),
  section: DisplayUtility.section.bind(DisplayUtility),
  printSection: DisplayUtility.printSection.bind(DisplayUtility),
  getLength: DisplayUtility.getLength.bind(DisplayUtility),
  LENGTHS: DisplayUtility.LENGTHS
}; 
