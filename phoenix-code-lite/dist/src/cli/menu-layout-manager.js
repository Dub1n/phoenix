"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.menuLayoutManager = exports.MenuLayoutManager = void 0;
const chalk_1 = __importDefault(require("chalk"));
class MenuLayoutManager {
    constructor(constraints = {}) {
        this.constraints = {
            fixedHeight: 25, // Standard terminal height minus some buffer
            commandTextboxLines: 3, // Space for "Phoenix> " prompt and input
            paddingLines: 2, // Breathing room between menu and textbox
            enforceConsistentHeight: true,
            ...constraints
        };
    }
    /**
     * Calculate layout with consistent height constraints
     * This ensures the command textbox always appears in the same position
     */
    calculateConsistentLayout(content, context, baseLayout) {
        const contentLines = this.estimateContentLines(content);
        const availableContentLines = this.constraints.fixedHeight -
            this.constraints.commandTextboxLines -
            this.constraints.paddingLines;
        const paddingLinesNeeded = Math.max(0, availableContentLines - contentLines);
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
    renderWithConsistentHeight(content, layout, context) {
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
    estimateContentLines(content) {
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
    renderConstrainedContent(content, layout, context) {
        let renderedLines = 0;
        const maxLines = layout.contentLines;
        // Render title (always shown)
        if (renderedLines < maxLines) {
            console.log(chalk_1.default.red.bold(content.title));
            renderedLines++;
        }
        // Render separator (always shown)
        if (renderedLines < maxLines) {
            console.log('═'.repeat(layout.headerSeparatorLength));
            renderedLines++;
        }
        // Render subtitle if present and space available
        if (content.subtitle && renderedLines < maxLines) {
            console.log(chalk_1.default.dim(content.subtitle));
            renderedLines++;
        }
        // Blank line
        if (renderedLines < maxLines) {
            console.log();
            renderedLines++;
        }
        // Render sections within remaining space
        for (const section of content.sections) {
            if (renderedLines >= maxLines)
                break;
            // Section heading
            if (renderedLines < maxLines) {
                const headingColor = section.theme?.headingColor || 'yellow';
                const headingStyle = section.theme?.bold ? chalk_1.default[headingColor].bold : chalk_1.default[headingColor];
                console.log(headingStyle(section.heading));
                renderedLines++;
            }
            // Section items
            for (const item of section.items) {
                if (renderedLines >= maxLines)
                    break;
                const icon = item.icon || '';
                const label = chalk_1.default.green(`  ${item.label}`);
                const description = chalk_1.default.gray(` - ${item.description}`);
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
            console.log(chalk_1.default.yellow('  ... more options available'));
        }
    }
    /**
     * Add blank lines to maintain consistent height
     */
    addConsistentPadding(paddingLinesNeeded) {
        for (let i = 0; i < paddingLinesNeeded; i++) {
            console.log();
        }
    }
    /**
     * Render the static textbox area at consistent position
     */
    renderStaticTextboxArea(context) {
        // Separator line above textbox
        console.log(chalk_1.default.gray('─'.repeat(60)));
        // Navigation hint line
        const navHint = this.generateNavigationHint(context);
        console.log(chalk_1.default.blue('💡 ') + navHint);
        // The actual textbox positioning will be handled by the session manager
        // This just ensures the space is reserved consistently
    }
    /**
     * Generate context-appropriate navigation hint
     */
    generateNavigationHint(context) {
        const hints = [];
        if (context.level !== 'main') {
            hints.push(chalk_1.default.cyan('"back"') + chalk_1.default.gray(' to return'));
        }
        hints.push(chalk_1.default.cyan('"help"') + chalk_1.default.gray(' for commands'));
        hints.push(chalk_1.default.cyan('"quit"') + chalk_1.default.gray(' to exit'));
        return hints.join(chalk_1.default.gray(', '));
    }
    /**
     * Clear screen for consistent positioning (optional)
     */
    clearScreen() {
        // Use ANSI escape sequences to clear screen and position cursor
        process.stdout.write('\x1b[2J\x1b[H');
    }
    /**
     * Get consistent textbox position (lines from top)
     */
    getTextboxPosition() {
        return this.constraints.fixedHeight - this.constraints.commandTextboxLines;
    }
    /**
     * Update constraints (useful for responsive design)
     */
    updateConstraints(newConstraints) {
        Object.assign(this.constraints, newConstraints);
    }
}
exports.MenuLayoutManager = MenuLayoutManager;
// Export convenience instance with default constraints
exports.menuLayoutManager = new MenuLayoutManager();
//# sourceMappingURL=menu-layout-manager.js.map