"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigFormatter = void 0;
const chalk_1 = __importDefault(require("chalk"));
class ConfigFormatter {
    static formatValue(value) {
        if (typeof value === 'boolean') {
            return value ? chalk_1.default.green('Yes') : chalk_1.default.red('No');
        }
        if (typeof value === 'number') {
            return chalk_1.default.cyan(value.toString());
        }
        if (typeof value === 'string') {
            return chalk_1.default.yellow(value);
        }
        if (Array.isArray(value)) {
            return value.join(', ');
        }
        return String(value);
    }
    static humanizeKey(key) {
        return key
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .replace(/\b\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1));
    }
    static formatSection(title, data, prefix = '') {
        const items = [];
        for (const [key, value] of Object.entries(data)) {
            const fullKey = prefix ? `${prefix}.${key}` : key;
            if (value && typeof value === 'object' && !Array.isArray(value)) {
                // Skip nested objects for now - they'll be handled as separate sections
                continue;
            }
            items.push({
                key: this.humanizeKey(key),
                value: this.formatValue(value),
            });
        }
        return { title, items };
    }
    static formatConfig(config) {
        const sections = [];
        // Claude Configuration
        if (config.claude) {
            sections.push(this.formatSection('Claude Settings', config.claude));
        }
        // TDD Configuration
        if (config.tdd) {
            const { qualityGates, ...tddData } = config.tdd;
            sections.push(this.formatSection('TDD Workflow', tddData));
            if (qualityGates) {
                sections.push(this.formatSection('Quality Gates', qualityGates.thresholds, 'Quality Thresholds'));
                sections.push(this.formatSection('Quality Weights', qualityGates.weights, 'Quality Weights'));
            }
        }
        // Agents Configuration
        if (config.agents) {
            const { planningAnalyst, implementationEngineer, qualityReviewer, ...agentsData } = config.agents;
            sections.push(this.formatSection('Agent Settings', agentsData));
            // Individual agent configs
            if (config.agents.planningAnalyst) {
                sections.push(this.formatSection('Planning Analyst', config.agents.planningAnalyst));
            }
            if (config.agents.implementationEngineer) {
                sections.push(this.formatSection('Implementation Engineer', config.agents.implementationEngineer));
            }
            if (config.agents.qualityReviewer) {
                sections.push(this.formatSection('Quality Reviewer', config.agents.qualityReviewer));
            }
        }
        // Output Configuration
        if (config.output) {
            sections.push(this.formatSection('Output Settings', config.output));
        }
        // Quality Configuration
        if (config.quality) {
            sections.push(this.formatSection('Quality Standards', config.quality));
        }
        // Format output
        let output = chalk_1.default.blue.bold('◦ Phoenix Code Lite Configuration\n');
        sections.forEach((section, index) => {
            if (section.items.length === 0)
                return;
            output += '\n' + chalk_1.default.white.bold(`  ${section.title}:\n`);
            section.items.forEach(item => {
                const padding = ' '.repeat(Math.max(0, 25 - item.key.length));
                output += `    ${chalk_1.default.gray(item.key)}:${padding}${item.value}\n`;
            });
        });
        return output;
    }
    static formatConfigSummary(config) {
        const summary = [];
        if (config.claude) {
            summary.push(`Claude: ${config.claude.maxTurns} turns, ${config.claude.timeout / 1000}s timeout`);
        }
        if (config.tdd) {
            summary.push(`TDD: ${config.tdd.maxImplementationAttempts} attempts, ${(config.tdd.testQualityThreshold * 100).toFixed(0)}% quality`);
        }
        if (config.quality) {
            summary.push(`Coverage: ${(config.quality.minTestCoverage * 100).toFixed(0)}%, Complexity: ${config.quality.maxComplexity}`);
        }
        return summary.join(' • ');
    }
}
exports.ConfigFormatter = ConfigFormatter;
//# sourceMappingURL=config-formatter.js.map