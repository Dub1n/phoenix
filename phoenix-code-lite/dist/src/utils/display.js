"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.display = exports.DisplayUtility = void 0;
const chalk_1 = __importDefault(require("chalk"));
/**
 * Display utility for consistent UI formatting across Phoenix Code Lite
 * Centralizes separator, header, and menu formatting logic
 */
class DisplayUtility {
    /**
     * Generate a separator line with consistent styling
     * @param length - Length of separator (default: 60)
     * @param char - Character to use (default: '═')
     * @param color - Chalk color function (default: gray)
     */
    static separator(length = this.DEFAULT_SEPARATOR_LENGTH, char = this.DEFAULT_SEPARATOR_CHAR, color = chalk_1.default.gray) {
        return color(char.repeat(length));
    }
    /**
     * Generate a divider line (thinner separator)
     * @param length - Length of divider (default: 60)
     * @param char - Character to use (default: '─')
     * @param color - Chalk color function (default: gray)
     */
    static divider(length = this.DEFAULT_SEPARATOR_LENGTH, char = this.DEFAULT_DIVIDER_CHAR, color = chalk_1.default.gray) {
        return color(char.repeat(length));
    }
    /**
     * Print a separator line to console
     * @param length - Length of separator (default: 60)
     * @param char - Character to use (default: '═')
     * @param color - Chalk color function (default: gray)
     */
    static printSeparator(length = this.DEFAULT_SEPARATOR_LENGTH, char = this.DEFAULT_SEPARATOR_CHAR, color = chalk_1.default.gray) {
        console.log(this.separator(length, char, color));
    }
    /**
     * Print a divider line to console
     * @param length - Length of divider (default: 60)
     * @param char - Character to use (default: '─')
     * @param color - Chalk color function (default: gray)
     */
    static printDivider(length = this.DEFAULT_SEPARATOR_LENGTH, char = this.DEFAULT_DIVIDER_CHAR, color = chalk_1.default.gray) {
        console.log(this.divider(length, char, color));
    }
    /**
     * Generate a header with consistent formatting
     * @param title - Header title
     * @param level - Header level (1-3, affects styling)
     * @param length - Separator length (default: 60)
     */
    static header(title, level = 1, length = this.DEFAULT_SEPARATOR_LENGTH) {
        const separator = this.separator(length);
        const titleStyle = level === 1 ? chalk_1.default.red.bold : level === 2 ? chalk_1.default.blue.bold : chalk_1.default.cyan.bold;
        return `${separator}\n${titleStyle(title)}\n${separator}`;
    }
    /**
     * Print a header to console
     * @param title - Header title
     * @param level - Header level (1-3, affects styling)
     * @param length - Separator length (default: 60)
     */
    static printHeader(title, level = 1, length = this.DEFAULT_SEPARATOR_LENGTH) {
        console.log(this.header(title, level, length));
    }
    /**
     * Generate a section separator with title
     * @param title - Section title
     * @param length - Separator length (default: 60)
     */
    static section(title, length = this.DEFAULT_SEPARATOR_LENGTH) {
        const separator = this.separator(length);
        return `${separator}\n${chalk_1.default.cyan.bold(title)}\n${separator}`;
    }
    /**
     * Print a section separator to console
     * @param title - Section title
     * @param length - Separator length (default: 60)
     */
    static printSection(title, length = this.DEFAULT_SEPARATOR_LENGTH) {
        console.log(this.section(title, length));
    }
    /**
     * Get context-appropriate separator length
     * @param context - UI context
     */
    static getLength(context = 'COMMAND') {
        return this.LENGTHS[context];
    }
}
exports.DisplayUtility = DisplayUtility;
DisplayUtility.DEFAULT_SEPARATOR_LENGTH = 60;
DisplayUtility.DEFAULT_SEPARATOR_CHAR = '═';
DisplayUtility.DEFAULT_DIVIDER_CHAR = '─';
/**
 * Context-aware separator lengths for different UI contexts
 */
DisplayUtility.LENGTHS = {
    MAIN_MENU: 70,
    SUB_MENU: 60,
    COMMAND: 50,
    HELP: 80,
    COMPACT: 40
};
// Export convenience functions for direct use
exports.display = {
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
//# sourceMappingURL=display.js.map