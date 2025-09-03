/**
 * Universal Layout Engine
 * 
 * Transferred from Phoenix Code Lite and extended for multi-interface support.
 * Maintains full PCL compatibility while adding VSCode, CLI, and Command interface rendering.
 * 
 * Performance Target: Maintain PCL baseline performance (<100ms interface switching)
 * Compatibility: Full backward compatibility with PCL SkinMenuDefinition
 * 
 * Generated: 2025-08-21
 */

import chalk from 'chalk';
import { InterfaceType } from '../types/templum-types';

// Re-export InterfaceType for other modules
export { InterfaceType };

// Extended interfaces for multi-interface support
export interface UniversalSkinMenuDefinition extends PCLSkinMenuDefinition {
  interfaces: InterfaceType[];
  interfaceConfig?: {
    vscode?: VSCodeInterfaceConfig;
    cli?: CLIInterfaceConfig;
    command?: CommandInterfaceConfig;
  };
}

// Preserve PCL compatibility with original interface
export interface PCLSkinMenuDefinition {
  title: string;
  subtitle?: string;
  items: SkinMenuItem[];
  theme?: SkinTheme;
}

export interface SkinMenuItem {
  id: string;
  label: string;
  description?: string;
  type: 'command' | 'submenu' | 'action';
  command?: string;
  items?: SkinMenuItem[];
  // Extended for multi-interface
  interfaceSpecific?: {
    vscode?: Partial<SkinMenuItem>;
    cli?: Partial<SkinMenuItem>;
    command?: Partial<SkinMenuItem>;
  };
}

export interface SkinTheme {
  primaryColor: 'red' | 'green' | 'blue' | 'yellow' | 'magenta' | 'cyan';
  accentColor: 'red' | 'green' | 'blue' | 'yellow' | 'magenta' | 'cyan';
  separatorChar: string;
  useIcons: boolean;
}

// InterfaceType imported from ../types/templum-types

export interface VSCodeInterfaceConfig {
  treeViewProvider?: boolean;
  webViewPanel?: boolean;
  commandPalette?: boolean;
  statusBar?: boolean;
}

export interface CLIInterfaceConfig {
  interactive?: boolean;
  colorEnabled?: boolean;
  keyboardShortcuts?: boolean;
  clearScreen?: boolean;
}

export interface CommandInterfaceConfig {
  directExecution?: boolean;
  outputFormat?: 'text' | 'json' | 'table';
  verbosityLevel?: 'minimal' | 'normal' | 'verbose';
}

// Extended layout constraints for multi-interface
export interface UniversalLayoutConstraints extends LayoutConstraints {
  interfaceType: InterfaceType;
  interfaceSpecific?: {
    vscode?: VSCodeLayoutConstraints;
    cli?: CLILayoutConstraints;
    command?: CommandLayoutConstraints;
  };
}

export interface LayoutConstraints {
  minHeight: number;
  minWidth: number;
  maxWidth: number;
  textboxLines: number;
  paddingLines: number;
  enforceConsistentHeight: boolean;
}

export interface VSCodeLayoutConstraints {
  treeDepth?: number;
  iconSize?: 'small' | 'medium' | 'large';
  compactMode?: boolean;
}

export interface CLILayoutConstraints {
  terminalWidth?: number;
  colorDepth?: number;
  unicodeSupport?: boolean;
  interactive?: boolean;
}

export interface CommandLayoutConstraints {
  outputWidth?: number;
  includeHeaders?: boolean;
  tableFormat?: boolean;
  outputFormat?: 'text' | 'json' | 'table';
  verbosityLevel?: 'minimal' | 'normal' | 'verbose';
}

export interface UniversalCalculatedLayout extends CalculatedLayout {
  interfaceType: InterfaceType;
  interfaceSpecific?: any;
  compatibilityMode?: 'pcl' | 'universal';
}

export interface CalculatedLayout {
  separatorLength: number;
  menuWidth: number;
  totalLines: number;
  contentLines: number;
  textboxAreaLines: number;
  paddingLinesNeeded: number;
  needsTruncation: boolean;
  theme: ResolvedTheme;
  separatorChar: string;
}

export interface ResolvedTheme {
  titleStyle: (text: string) => string;
  headingStyle: (text: string) => string;
  itemStyle: (text: string) => string;
  descriptionStyle: (text: string) => string;
  separatorColor: (text: string) => string;
}

export interface RenderResult {
  success: boolean;
  interfaceType: InterfaceType;
  renderTime: number;
  compatibilityMode?: 'pcl' | 'universal';
  output?: string;
  errors?: string[];
}

/**
 * Universal Layout Engine - Multi-Interface Support
 * Extends PCL unified layout engine for VSCode, CLI, and Command interfaces
 */
export class UniversalLayoutEngine {
  private performanceMetrics: Map<string, number> = new Map();

  /**
   * Main entry point for multi-interface rendering
   */
  async renderForInterface(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    interfaceType: InterfaceType,
    constraints?: Partial<UniversalLayoutConstraints>
  ): Promise<RenderResult> {
    const startTime = Date.now();

    try {
      // Determine if this is PCL compatibility mode
      const isUniversalDef = 'interfaces' in skinDefinition;
      const compatibilityMode = isUniversalDef ? 'universal' : 'pcl';

      // Create universal constraints with interface-specific settings
      const universalConstraints = this.createUniversalConstraints(
        interfaceType,
        constraints
      );

      // Calculate layout for the specific interface
      const layout = this.calculateUniversalLayout(
        skinDefinition,
        universalConstraints
      );

      // Render for the specific interface
      const output = await this.renderForSpecificInterface(
        skinDefinition,
        layout,
        interfaceType
      );

      const renderTime = Date.now() - startTime;
      this.updatePerformanceMetrics(interfaceType, renderTime);

      return {
        success: true,
        interfaceType,
        renderTime,
        compatibilityMode,
        output
      };

    } catch (error) {
      const renderTime = Date.now() - startTime;
      return {
        success: false,
        interfaceType,
        renderTime,
        errors: [error instanceof Error ? error.message : 'Unknown rendering error']
      };
    }
  }

  /**
   * Calculate layout with multi-interface support
   */
  private calculateUniversalLayout(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    constraints: UniversalLayoutConstraints
  ): UniversalCalculatedLayout {
    // Use original PCL calculation as base
    const baseLayout = this.calculateMenuLayout(skinDefinition, constraints);

    // Extend with interface-specific calculations
    const interfaceSpecific = this.calculateInterfaceSpecificLayout(
      skinDefinition,
      constraints
    );

    return {
      ...baseLayout,
      interfaceType: constraints.interfaceType,
      interfaceSpecific,
      compatibilityMode: 'interfaces' in skinDefinition ? 'universal' : 'pcl'
    };
  }

  /**
   * Original PCL layout calculation (preserved for compatibility)
   */
  private calculateMenuLayout(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    constraints: LayoutConstraints
  ): CalculatedLayout {
    // Measure content dimensions
    const measurements = this.measureMenuContent(skinDefinition);
    
    // Calculate width (separator length)
    const separatorLength = this.calculateOptimalWidth(measurements, constraints);
    
    // Calculate height (consistent positioning)
    const heightLayout = this.calculateConsistentHeight(measurements, constraints);
    
    // Resolve theme styling
    const theme = this.resolveTheme(skinDefinition.theme);

    return {
      separatorLength,
      menuWidth: separatorLength,
      totalLines: heightLayout.totalLines,
      contentLines: heightLayout.contentLines,
      textboxAreaLines: constraints.textboxLines,
      paddingLinesNeeded: heightLayout.paddingNeeded,
      needsTruncation: heightLayout.needsTruncation,
      theme,
      separatorChar: skinDefinition.theme?.separatorChar || '═'
    };
  }

  /**
   * Interface-specific layout calculations
   */
  private calculateInterfaceSpecificLayout(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    constraints: UniversalLayoutConstraints
  ): any {
    switch (constraints.interfaceType) {
      case 'vscode':
        return this.calculateVSCodeLayout(skinDefinition, constraints);
      case 'cli':
        return this.calculateCLILayout(skinDefinition, constraints);
      case 'command':
        return this.calculateCommandLayout(skinDefinition, constraints);
      default:
        return {};
    }
  }

  /**
   * VSCode-specific layout calculations
   */
  private calculateVSCodeLayout(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    constraints: UniversalLayoutConstraints
  ): any {
    const vscodeConfig = constraints.interfaceSpecific?.vscode || {};
    
    return {
      treeViewData: this.prepareTreeViewData(skinDefinition),
      webViewHtml: this.prepareWebViewHtml(skinDefinition),
      commandRegistrations: this.prepareCommandRegistrations(skinDefinition),
      iconMapping: this.prepareIconMapping(skinDefinition, vscodeConfig.iconSize)
    };
  }

  /**
   * CLI-specific layout calculations
   */
  private calculateCLILayout(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    constraints: UniversalLayoutConstraints
  ): any {
    const cliConfig = constraints.interfaceSpecific?.cli || {};
    
    return {
      terminalFeatures: {
        colorSupport: cliConfig.colorDepth || 8,
        unicodeSupport: cliConfig.unicodeSupport || false,
        interactiveMode: cliConfig.interactive !== false
      },
      keyboardShortcuts: this.prepareKeyboardShortcuts(skinDefinition),
      progressIndicators: this.prepareProgressIndicators(skinDefinition)
    };
  }

  /**
   * Command-specific layout calculations
   */
  private calculateCommandLayout(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    constraints: UniversalLayoutConstraints
  ): any {
    const commandConfig = constraints.interfaceSpecific?.command || {};
    
    return {
      outputFormat: commandConfig.outputFormat || 'text',
      verbosity: commandConfig.verbosityLevel || 'normal',
      directCommands: this.prepareDirectCommands(skinDefinition),
      tableFormat: commandConfig.tableFormat || false
    };
  }

  /**
   * Render for specific interface
   */
  private async renderForSpecificInterface(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    layout: UniversalCalculatedLayout,
    interfaceType: InterfaceType
  ): Promise<string> {
    switch (interfaceType) {
      case 'vscode':
        return this.renderVSCodeInterface(skinDefinition, layout);
      case 'cli':
        return this.renderCLIInterface(skinDefinition, layout);
      case 'command':
        return this.renderCommandInterface(skinDefinition, layout);
      default:
        throw new Error(`Unsupported interface type: ${interfaceType}`);
    }
  }

  /**
   * VSCode interface rendering
   */
  private renderVSCodeInterface(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    layout: UniversalCalculatedLayout
  ): string {
    // Generate VSCode TreeView data structure
    const treeData = layout.interfaceSpecific?.treeViewData || [];
    
    // Generate WebView HTML if needed
    const webViewHtml = layout.interfaceSpecific?.webViewHtml || '';
    
    // Create VSCode-specific output structure
    return JSON.stringify({
      type: 'vscode',
      treeView: treeData,
      webView: webViewHtml,
      commands: layout.interfaceSpecific?.commandRegistrations || [],
      theme: this.adaptThemeForVSCode(layout.theme)
    }, null, 2);
  }

  /**
   * CLI interface rendering (preserves original PCL behavior)
   */
  private renderCLIInterface(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    layout: UniversalCalculatedLayout
  ): string {
    // Use original PCL rendering logic for CLI compatibility
    return this.renderMenuWithLayout(skinDefinition, layout);
  }

  /**
   * Command interface rendering
   */
  private renderCommandInterface(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    layout: UniversalCalculatedLayout
  ): string {
    const commandConfig = layout.interfaceSpecific;
    
    if (commandConfig?.outputFormat === 'json') {
      return this.renderAsJSON(skinDefinition, layout);
    } else if (commandConfig?.tableFormat) {
      return this.renderAsTable(skinDefinition, layout);
    } else {
      return this.renderAsText(skinDefinition, layout);
    }
  }

  /**
   * Original PCL menu rendering (preserved)
   */
  private renderMenuWithLayout(
    skinMenuDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    layout: CalculatedLayout,
    context?: { skinId?: string; level?: string }
  ): string {
    let output = '';
    let renderedLines = 0;
    const maxContentLines = layout.contentLines;
    
    // Clear screen for consistent positioning (optional)
    if (layout.totalLines > 0) {
      output += '\x1b[2J\x1b[H';
    }
    
    // Render title
    if (renderedLines < maxContentLines) {
      output += layout.theme.titleStyle(skinMenuDefinition.title) + '\n';
      renderedLines++;
    }
    
    // Render separator with calculated width
    if (renderedLines < maxContentLines) {
      output += layout.theme.separatorColor(layout.separatorChar.repeat(layout.separatorLength)) + '\n';
      renderedLines++;
    }
    
    // Render subtitle if present
    if (skinMenuDefinition.subtitle && renderedLines < maxContentLines) {
      output += layout.theme.descriptionStyle(skinMenuDefinition.subtitle) + '\n';
      renderedLines++;
    }
    
    // Blank line
    if (renderedLines < maxContentLines) {
      output += '\n';
      renderedLines++;
    }
    
    // Render menu items within height constraints
    let itemNumber = 1;
    for (const item of skinMenuDefinition.items) {
      if (renderedLines >= maxContentLines) break;
      
      // Always generate numbers procedurally
      const displayLabel = `${itemNumber}. ${item.label}`;
      
      const label = layout.theme.itemStyle(`  ${displayLabel}`);
      const description = item.description ? layout.theme.descriptionStyle(` - ${item.description}`) : '';
      
      output += `${label}${description}\n`;
      renderedLines++;
      itemNumber++;
    }
    
    // Show truncation indicator if needed
    if (layout.needsTruncation && renderedLines < maxContentLines) {
      output += layout.theme.descriptionStyle('  ... more options available') + '\n';
      renderedLines++;
    }
    
    // Add padding to maintain consistent height
    for (let i = 0; i < layout.paddingLinesNeeded; i++) {
      output += '\n';
    }
    
    // Render static textbox area
    output += layout.theme.separatorColor('─'.repeat(layout.separatorLength)) + '\n';
    output += chalk.blue('* ') + layout.theme.descriptionStyle(this.generateHint(context)) + '\n';
    output += '\n'; // Space for command prompt
    
    return output;
  }

  // Helper methods (preserved from PCL and extended)
  private createUniversalConstraints(
    interfaceType: InterfaceType,
    partialConstraints?: Partial<UniversalLayoutConstraints>
  ): UniversalLayoutConstraints {
    const baseConstraints: LayoutConstraints = {
      minHeight: partialConstraints?.minHeight || 15,
      minWidth: partialConstraints?.minWidth || 40,
      maxWidth: partialConstraints?.maxWidth || 100,
      textboxLines: partialConstraints?.textboxLines || 3,
      paddingLines: partialConstraints?.paddingLines || 2,
      enforceConsistentHeight: partialConstraints?.enforceConsistentHeight !== false
    };

    return {
      ...baseConstraints,
      interfaceType,
      interfaceSpecific: partialConstraints?.interfaceSpecific || {}
    };
  }

  private measureMenuContent(menuDef: UniversalSkinMenuDefinition | PCLSkinMenuDefinition): {
    titleLength: number;
    longestItemLength: number;
    totalItems: number;
    estimatedLines: number;
  } {
    const titleLength = this.stripAnsi(menuDef.title).length;
    const subtitleLength = menuDef.subtitle ? this.stripAnsi(menuDef.subtitle).length : 0;
    
    let longestItemLength = 0;
    let totalItems = 0;
    
    for (const item of menuDef.items) {
      totalItems++;
      // Always account for procedural numbering
      const displayLabel = `${totalItems}. ${item.label}`;
      const itemText = `  ${displayLabel}${item.description ? ` - ${item.description}` : ''}`;
      longestItemLength = Math.max(longestItemLength, this.stripAnsi(itemText).length);
    }
    
    const estimatedLines = 4 + totalItems + (menuDef.subtitle ? 1 : 0); // title + separator + subtitle + blank + items
    
    return {
      titleLength: Math.max(titleLength, subtitleLength),
      longestItemLength,
      totalItems,
      estimatedLines
    };
  }

  private calculateOptimalWidth(measurements: any, constraints: LayoutConstraints): number {
    const contentWidth = Math.max(measurements.titleLength, measurements.longestItemLength);
    const calculatedWidth = Math.floor(contentWidth * 1.1) + 5; // 10% padding + 5 chars buffer
    
    return Math.max(
      constraints.minWidth,
      Math.min(constraints.maxWidth, calculatedWidth)
    );
  }

  private calculateConsistentHeight(measurements: any, constraints: LayoutConstraints): {
    totalLines: number;
    contentLines: number; 
    paddingNeeded: number;
    needsTruncation: boolean;
  } {
    const minRequiredLines = constraints.minHeight - constraints.textboxLines - constraints.paddingLines;
    const actualContentLines = Math.max(measurements.estimatedLines, minRequiredLines);
    const totalLines = actualContentLines + constraints.textboxLines + constraints.paddingLines;
    const needsTruncation = false; // Never truncate with minHeight approach
    const paddingNeeded = Math.max(0, minRequiredLines - measurements.estimatedLines);
    
    return {
      totalLines,
      contentLines: actualContentLines,
      paddingNeeded,
      needsTruncation
    };
  }

  private resolveTheme(skinTheme?: SkinTheme): ResolvedTheme {
    const primaryColor = skinTheme?.primaryColor || 'red';
    const accentColor = skinTheme?.accentColor || 'gray';
    
    return {
      titleStyle: chalk[primaryColor].bold,
      headingStyle: chalk[accentColor].bold,
      itemStyle: chalk.green,
      descriptionStyle: chalk.gray,
      separatorColor: chalk.gray
    };
  }

  private stripAnsi(text: string): string {
    return text.replace(/\u001b\[[0-9;]*m/g, '');
  }

  private generateHint(context?: { skinId?: string; level?: string }): string {
    const hints = [];
    if (context?.level !== 'main') hints.push('"back" to return');
    hints.push('"help" for commands', '"quit" to exit');
    return hints.join(', ');
  }

  // Interface-specific helper methods
  private prepareTreeViewData(skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition): any[] {
    return skinDefinition.items.map((item, index) => ({
      id: item.id,
      label: item.label,
      description: item.description,
      collapsibleState: item.type === 'submenu' ? 1 : 0, // TreeItemCollapsibleState.Collapsed
      command: item.command ? {
        command: item.command,
        title: item.label,
        arguments: [item.id]
      } : undefined
    }));
  }

  private prepareWebViewHtml(skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition): string {
    // Generate basic HTML structure for WebView
    const theme = this.resolveTheme(skinDefinition.theme);
    return `
      <html>
        <head>
          <style>
            body { font-family: monospace; padding: 20px; }
            .menu-title { font-weight: bold; color: #007ACC; }
            .menu-item { margin: 5px 0; padding: 5px; }
            .menu-item:hover { background-color: #f0f0f0; cursor: pointer; }
          </style>
        </head>
        <body>
          <h1 class="menu-title">${skinDefinition.title}</h1>
          ${skinDefinition.subtitle ? `<p>${skinDefinition.subtitle}</p>` : ''}
          <div class="menu-items">
            ${skinDefinition.items.map(item => 
              `<div class="menu-item" onclick="executeCommand('${item.command || item.id}')">
                ${item.label} ${item.description ? `- ${item.description}` : ''}
               </div>`
            ).join('')}
          </div>
          <script>
            function executeCommand(command) {
              vscode.postMessage({ command: 'execute', value: command });
            }
          </script>
        </body>
      </html>
    `;
  }

  private prepareCommandRegistrations(skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition): any[] {
    return skinDefinition.items
      .filter(item => item.command)
      .map(item => ({
        command: item.command!,
        title: item.label,
        category: skinDefinition.title
      }));
  }

  private prepareIconMapping(skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition, iconSize?: string): Record<string, string> {
    const icons: Record<string, string> = {};
    
    for (const item of skinDefinition.items) {
      if (item.type === 'submenu') {
        icons[item.id] = 'folder';
      } else if (item.type === 'command') {
        icons[item.id] = 'play';
      } else {
        icons[item.id] = 'circle-outline';
      }
    }
    
    return icons;
  }

  private prepareKeyboardShortcuts(skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition): Record<string, string> {
    const shortcuts: Record<string, string> = {};
    
    skinDefinition.items.forEach((item, index) => {
      shortcuts[`${index + 1}`] = item.id;
    });
    
    return shortcuts;
  }

  private prepareProgressIndicators(skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition): any {
    return {
      enabled: true,
      style: 'spinner',
      colors: ['cyan', 'magenta', 'yellow', 'green']
    };
  }

  private prepareDirectCommands(skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition): string[] {
    return skinDefinition.items
      .filter(item => item.command)
      .map(item => item.command!);
  }

  private adaptThemeForVSCode(theme: ResolvedTheme): any {
    return {
      titleColor: '#007ACC',
      itemColor: '#CCCCCC',
      descriptionColor: '#888888',
      accentColor: '#0078D4'
    };
  }

  private renderAsJSON(skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition, layout: UniversalCalculatedLayout): string {
    return JSON.stringify({
      title: skinDefinition.title,
      subtitle: skinDefinition.subtitle,
      items: skinDefinition.items,
      theme: skinDefinition.theme,
      layout: layout
    }, null, 2);
  }

  private renderAsTable(skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition, layout: UniversalCalculatedLayout): string {
    let table = `┌─────┬──────────────┬──────────────┬──────────────┐\n`;
    table += `│ ID  │ Label        │ Description  │ Type         │\n`;
    table += `├─────┼──────────────┼──────────────┼──────────────┤\n`;
    
    for (const item of skinDefinition.items) {
      const id = item.id.padEnd(3).substr(0, 3);
      const label = item.label.padEnd(12).substr(0, 12);
      const desc = (item.description || '').padEnd(12).substr(0, 12);
      const type = item.type.padEnd(12).substr(0, 12);
      table += `│ ${id} │ ${label} │ ${desc} │ ${type} │\n`;
    }
    
    table += `└─────┴──────────────┴──────────────┴──────────────┘\n`;
    return table;
  }

  private renderAsText(skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition, layout: UniversalCalculatedLayout): string {
    let output = `${skinDefinition.title}\n`;
    if (skinDefinition.subtitle) {
      output += `${skinDefinition.subtitle}\n`;
    }
    output += '\n';
    
    skinDefinition.items.forEach((item, index) => {
      output += `${index + 1}. ${item.label}`;
      if (item.description) {
        output += ` - ${item.description}`;
      }
      output += '\n';
    });
    
    return output;
  }

  private updatePerformanceMetrics(interfaceType: InterfaceType, renderTime: number): void {
    const key = `${interfaceType}_render_time`;
    const existingMetrics = this.performanceMetrics.get(key) || 0;
    this.performanceMetrics.set(key, (existingMetrics + renderTime) / 2); // Simple moving average
    
    // Warn if performance exceeds baseline
    if (renderTime > 100) {
      console.warn(`Interface rendering time exceeded 100ms baseline: ${renderTime}ms for ${interfaceType}`);
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): Map<string, number> {
    return new Map(this.performanceMetrics);
  }
}