/**---
 * title: [Config Formatter - Human-Readable Configuration Output]
 * tags: [CLI, Utility, Formatting, Configuration]
 * provides: [ConfigFormatter Class, Section Formatting, Value Rendering]
 * requires: [chalk, PhoenixCodeLiteConfigData]
 * description: [Formats Phoenix Code Lite configuration into readable sections and items with colorized output suitable for CLI display.]
 * ---*/

import chalk from 'chalk';
import { PhoenixCodeLiteConfigData } from '../config/settings';

interface FormattedSection {
  title: string;
  items: { key: string; value: string; description?: string }[];
}

export class ConfigFormatter {
  private static formatValue(value: any): string {
    if (typeof value === 'boolean') {
      return value ? chalk.green('Yes') : chalk.red('No');
    }
    if (typeof value === 'number') {
      return chalk.cyan(value.toString());
    }
    if (typeof value === 'string') {
      return chalk.yellow(value);
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return String(value);
  }

  private static humanizeKey(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/\b\w+/g, word => word.charAt(0).toUpperCase() + word.slice(1));
  }

  private static formatSection(title: string, data: any, prefix: string = ''): FormattedSection {
    const items: { key: string; value: string; description?: string }[] = [];
    
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

  static formatConfig(config: PhoenixCodeLiteConfigData): string {
    const sections: FormattedSection[] = [];
    
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
    let output = chalk.blue.bold('◦ Phoenix Code Lite Configuration\n');
    
    sections.forEach((section, index) => {
      if (section.items.length === 0) return;
      
      output += '\n' + chalk.white.bold(`  ${section.title}:\n`);
      
      section.items.forEach(item => {
        const padding = ' '.repeat(Math.max(0, 25 - item.key.length));
        output += `    ${chalk.gray(item.key)}:${padding}${item.value}\n`;
      });
    });
    
    return output;
  }

  static formatConfigSummary(config: PhoenixCodeLiteConfigData): string {
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
