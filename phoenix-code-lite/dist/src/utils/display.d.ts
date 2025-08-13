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
export declare class DisplayUtility {
    private static readonly DEFAULT_SEPARATOR_LENGTH;
    private static readonly DEFAULT_SEPARATOR_CHAR;
    private static readonly DEFAULT_DIVIDER_CHAR;
    /**
     * Generate a separator line with consistent styling
     * @param length - Length of separator (default: 60)
     * @param char - Character to use (default: '═')
     * @param color - Chalk color function (default: gray)
     */
    static separator(length?: number, char?: string, color?: chalk.Chalk): string;
    /**
     * Generate a divider line (thinner separator)
     * @param length - Length of divider (default: 60)
     * @param char - Character to use (default: '─')
     * @param color - Chalk color function (default: gray)
     */
    static divider(length?: number, char?: string, color?: chalk.Chalk): string;
    /**
     * Print a separator line to console
     * @param length - Length of separator (default: 60)
     * @param char - Character to use (default: '═')
     * @param color - Chalk color function (default: gray)
     */
    static printSeparator(length?: number, char?: string, color?: chalk.Chalk): void;
    /**
     * Print a divider line to console
     * @param length - Length of divider (default: 60)
     * @param char - Character to use (default: '─')
     * @param color - Chalk color function (default: gray)
     */
    static printDivider(length?: number, char?: string, color?: chalk.Chalk): void;
    /**
     * Generate a header with consistent formatting
     * @param title - Header title
     * @param level - Header level (1-3, affects styling)
     * @param length - Separator length (default: 60)
     */
    static header(title: string, level?: 1 | 2 | 3, length?: number): string;
    /**
     * Print a header to console
     * @param title - Header title
     * @param level - Header level (1-3, affects styling)
     * @param length - Separator length (default: 60)
     */
    static printHeader(title: string, level?: 1 | 2 | 3, length?: number): void;
    /**
     * Generate a section separator with title
     * @param title - Section title
     * @param length - Separator length (default: 60)
     */
    static section(title: string, length?: number): string;
    /**
     * Print a section separator to console
     * @param title - Section title
     * @param length - Separator length (default: 60)
     */
    static printSection(title: string, length?: number): void;
    /**
     * Context-aware separator lengths for different UI contexts
     */
    static readonly LENGTHS: {
        readonly MAIN_MENU: 70;
        readonly SUB_MENU: 60;
        readonly COMMAND: 50;
        readonly HELP: 80;
        readonly COMPACT: 40;
    };
    /**
     * Get context-appropriate separator length
     * @param context - UI context
     */
    static getLength(context?: keyof typeof DisplayUtility.LENGTHS): number;
}
export declare const display: {
    separator: typeof DisplayUtility.separator;
    divider: typeof DisplayUtility.divider;
    printSeparator: typeof DisplayUtility.printSeparator;
    printDivider: typeof DisplayUtility.printDivider;
    header: typeof DisplayUtility.header;
    printHeader: typeof DisplayUtility.printHeader;
    section: typeof DisplayUtility.section;
    printSection: typeof DisplayUtility.printSection;
    getLength: typeof DisplayUtility.getLength;
    LENGTHS: {
        readonly MAIN_MENU: 70;
        readonly SUB_MENU: 60;
        readonly COMMAND: 50;
        readonly HELP: 80;
        readonly COMPACT: 40;
    };
};
//# sourceMappingURL=display.d.ts.map