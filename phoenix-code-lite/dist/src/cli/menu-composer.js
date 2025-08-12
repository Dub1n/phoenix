"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuComposer = exports.MenuComposer = void 0;
const chalk_1 = __importDefault(require("chalk"));
const display_1 = require("../utils/display");
const menu_layout_manager_1 = require("./menu-layout-manager");
/**
 * Content-driven menu composition system
 * Procedurally determines separator lengths and handles all menu formatting
 */
class MenuComposer {
    constructor(options = {}) {
        this.options = {
            autoSize: true,
            minSeparatorLength: 40,
            maxSeparatorLength: 100,
            defaultPadding: 2,
            debug: false,
            ...options
        };
        this.layoutManager = new menu_layout_manager_1.MenuLayoutManager({
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
    compose(content, context) {
        const baseLayout = this.calculateLayout(content, context);
        const consistentLayout = this.layoutManager.calculateConsistentLayout(content, context, baseLayout);
        if (this.options.debug) {
            this.debugLayout(content, consistentLayout);
        }
        // Use layout manager for consistent height rendering
        this.layoutManager.renderWithConsistentHeight(content, consistentLayout, context);
    }
    /**
     * Original compose method for backward compatibility
     */
    composeBasic(content, context) {
        const layout = this.calculateLayout(content, context);
        this.renderMenu(content, layout, context);
    }
    /**
     * Procedurally determines separator lengths based on content
     * Core intelligence that replaces hardcoded length decisions
     */
    calculateLayout(content, context) {
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
    measureContent(content) {
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
    calculateHeaderLength(measurements, content, context) {
        const baseLength = Math.max(measurements.titleLength, measurements.minimumWidth);
        const contextMultiplier = this.getContextMultiplier(context.level);
        const complexityAdjustment = Math.floor(measurements.complexityScore * 5);
        const calculatedLength = Math.floor(baseLength * contextMultiplier) + complexityAdjustment;
        return this.clampLength(calculatedLength);
    }
    /**
     * Calculate section separator length
     */
    calculateSectionLength(measurements, content, context) {
        // Section separators are typically shorter than headers
        const headerLength = this.calculateHeaderLength(measurements, content, context);
        const sectionLength = Math.floor(headerLength * 0.85);
        return this.clampLength(sectionLength);
    }
    /**
     * Calculate footer separator length
     */
    calculateFooterLength(measurements, content, context) {
        // Footer separators match header length for symmetry
        return this.calculateHeaderLength(measurements, content, context);
    }
    /**
     * Calculate overall menu width
     */
    calculateMenuWidth(measurements, content, context) {
        return this.calculateHeaderLength(measurements, content, context);
    }
    /**
     * Measure text length accounting for ANSI color codes
     */
    measureText(text) {
        // Remove ANSI escape codes for accurate length measurement
        const cleanText = text.replace(/\u001b\[[0-9;]*m/g, '');
        return cleanText.length;
    }
    /**
     * Find the longest item in all menu sections
     */
    findLongestItem(content) {
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
    countTotalItems(content) {
        return content.sections.reduce((total, section) => total + section.items.length, 0);
    }
    /**
     * Calculate complexity score for adaptive sizing
     */
    calculateComplexityScore(metrics) {
        const lengthFactor = (metrics.titleLength + metrics.longestItemLength) / 200;
        const itemFactor = metrics.totalItems / 20;
        const sectionFactor = metrics.sectionCount / 5;
        return Math.min(1.0, lengthFactor + itemFactor + sectionFactor);
    }
    /**
     * Get context-specific multiplier for different menu levels
     */
    getContextMultiplier(level) {
        const multipliers = {
            main: 1.2, // Main menus get longer separators
            config: 1.0, // Standard length
            templates: 1.0, // Standard length
            advanced: 1.1, // Slightly longer
            generate: 1.0, // Standard length
            help: 0.9 // Shorter for help content
        };
        return multipliers[level] || 1.0;
    }
    /**
     * Clamp separator length within acceptable bounds
     */
    clampLength(length) {
        return Math.max(this.options.minSeparatorLength, Math.min(this.options.maxSeparatorLength, length));
    }
    /**
     * Render the complete menu using calculated layout
     */
    renderMenu(content, layout, context) {
        // Render title
        console.log(chalk_1.default.red.bold(content.title));
        // Render header separator (procedurally calculated)
        display_1.display.printSeparator(layout.headerSeparatorLength);
        // Render subtitle if present
        if (content.subtitle) {
            console.log(chalk_1.default.dim(content.subtitle));
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
            display_1.display.printDivider(layout.footerSeparatorLength);
            for (const hint of content.footerHints) {
                console.log(chalk_1.default.blue('💡 ') + hint);
            }
            console.log();
        }
    }
    /**
     * Render a menu section with its items
     */
    renderSection(section, layout) {
        // Section heading with theme support
        const headingColor = section.theme?.headingColor || 'yellow';
        const headingStyle = section.theme?.bold ? chalk_1.default[headingColor].bold : chalk_1.default[headingColor];
        console.log(headingStyle(section.heading));
        // Render section items
        for (const item of section.items) {
            this.renderMenuItem(item);
        }
        // Add description if present
        if (section.description) {
            console.log(chalk_1.default.gray(`  ${section.description}`));
        }
    }
    /**
     * Render an individual menu item
     */
    renderMenuItem(item) {
        const icon = item.icon || '';
        const label = chalk_1.default.green(`  ${item.label}`);
        const description = chalk_1.default.gray(` - ${item.description}`);
        console.log(`${icon}${label}${description}`);
    }
    /**
     * Debug output for layout calculation
     */
    debugLayout(content, layout) {
        console.log(chalk_1.default.cyan('\n=== Menu Layout Debug ==='));
        console.log(`Header Separator: ${layout.headerSeparatorLength} chars`);
        console.log(`Section Separator: ${layout.sectionSeparatorLength} chars`);
        console.log(`Footer Separator: ${layout.footerSeparatorLength} chars`);
        console.log(`Menu Width: ${layout.menuWidth} chars`);
        console.log(chalk_1.default.cyan('========================\n'));
    }
}
exports.MenuComposer = MenuComposer;
// Export convenience instance with default options
exports.menuComposer = new MenuComposer();
//# sourceMappingURL=menu-composer.js.map