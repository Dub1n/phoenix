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

import { createFormatter, TerminalFormatter } from '../utils/terminal-formatter';
import { createLogger, LogLevel } from '../utils/logger';
import { DisplayUtils } from '../utils/display-utils';
import { InterfaceType } from '../types/templum-types';
import { StringUtils, StringWidthUtils } from '../utils/chainable-string-utils';
import { 
  ContentLayoutSystem, 
  WindowContent, 
  ContentSection, 
  ContentItem,
  WindowLayoutConfig,
  CalculatedLayout as WindowCalculatedLayout,
  TerminalCapabilities as LayoutTerminalCapabilities
} from './content-layout-system';
import { computeDisplayLayout } from '../interfaces/display-utils-layout';
import type { UniversalSkinDefinition, MenuDefinition as SkinMenuDefinition } from '../types/universal-skin-definition';

// Re-export InterfaceType for other modules
export type { InterfaceType };

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
  totalWidth?: number;
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
  windowSet?: ProceduralCLIWindowSet;
}

export interface ProceduralCLIWindow {
  menuId: string;
  parentMenuId?: string;
  title: string;
  output: string;
  content: WindowContent;
  layout: WindowCalculatedLayout;
  capabilities: LayoutTerminalCapabilities;
  navigation: {
    breadcrumb: string[];
    items: ContentItem[];
  };
  isNested: boolean;
}

export interface ProceduralCLIWindowSet {
  activeMenuId: string;
  navigationHistory: string[];
  windows: ProceduralCLIWindow[];
}

export interface ProceduralCLIOptions {
  menuId?: string;
  navigationHistory?: string[];
}

/**
 * Universal Layout Engine - Multi-Interface Support
 * Extends PCL unified layout engine for VSCode, CLI, and Command interfaces
 */
export class UniversalLayoutEngine {
  private performanceMetrics: Map<string, number> = new Map();
  private contentLayoutSystem: ContentLayoutSystem;
  private readonly formatter: TerminalFormatter;
  private readonly logger = createLogger('universal-layout-engine', { level: LogLevel.ERROR });

  constructor(formatter: TerminalFormatter = createFormatter()) {
    this.formatter = formatter;
    this.contentLayoutSystem = new ContentLayoutSystem();
  }

  private isUniversalSkinDefinition(
    skin: UniversalSkinDefinition | UniversalSkinMenuDefinition | PCLSkinMenuDefinition
  ): skin is UniversalSkinDefinition {
    return (
      typeof (skin as UniversalSkinDefinition)?.id === 'string' &&
      typeof (skin as UniversalSkinDefinition)?.metadata === 'object' &&
      !!(skin as UniversalSkinDefinition)?.menus
    );
  }

  private getDefaultMenuId(skin: UniversalSkinDefinition): string {
    const main = skin.menus?.main;
    if (main?.id) {
      return main.id;
    }
    return 'main';
  }

  private extractSubmenuTargets(menu: SkinMenuDefinition): string[] {
    if (!menu.items) {
      return [];
    }

    const targets: string[] = [];
    for (const item of menu.items) {
      if (item.type === 'submenu') {
        if (typeof item.submenu === 'string') {
          targets.push(item.submenu);
        }
      }
    }
    return targets;
  }

  private normalizeWidth(width: number): number {
    return Math.max(1, Math.floor(width));
  }

  private formatCell(
    value: string,
    width: number,
    alignment: 'left' | 'right' | 'center' = 'left',
    ellipsis = '…'
  ): string {
    const targetWidth = this.normalizeWidth(width);
    return StringUtils.chain(String(value), { mode: 'terminal' })
      .truncate(targetWidth, ellipsis)
      .pad(targetWidth, alignment)
      .value();
  }

  /**
   * Main entry point for multi-interface rendering
   */
  async renderForInterface(
    skinDefinition: UniversalSkinDefinition | UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    interfaceType: InterfaceType,
    constraints?: Partial<UniversalLayoutConstraints>
  ): Promise<RenderResult> {
    const startTime = Date.now();

    if (interfaceType === 'cli' && this.isUniversalSkinDefinition(skinDefinition)) {
      try {
        const cliOptions: ProceduralCLIOptions = {
          menuId: (constraints?.interfaceSpecific as any)?.cli?.activeMenuId ??
                  (constraints?.interfaceSpecific as any)?.cli?.currentMenu ??
                  undefined,
          navigationHistory: (constraints?.interfaceSpecific as any)?.cli?.navigationHistory,
        };

        const windowSet = await this.renderForCLI(skinDefinition, cliOptions);
        const renderTime = Date.now() - startTime;
        this.updatePerformanceMetrics(interfaceType, renderTime);

        return {
          success: true,
          interfaceType,
          renderTime,
          compatibilityMode: 'universal',
          output: windowSet.windows[0]?.output,
          windowSet,
        };
      } catch (error) {
        const renderTime = Date.now() - startTime;
        return {
          success: false,
          interfaceType,
          renderTime,
          errors: [error instanceof Error ? error.message : 'Unknown rendering error'],
        };
      }
    }

    try {
      // TASK-MCP-009: Verify and adapt skin compatibility
      const compatibilityCheck = this.verifySkinCompatibility(skinDefinition, interfaceType);
      const adaptedSkinDefinition = compatibilityCheck.compatible 
        ? skinDefinition 
        : this.applySkinAdaptations(skinDefinition, compatibilityCheck.adaptations);
      
      // Log compatibility issues for debugging
      if (!compatibilityCheck.compatible) {
        this.logger.warn('Skin compatibility issues detected', { issues: compatibilityCheck.issues });
        this.logger.info('Applied adaptations', { adaptations: compatibilityCheck.adaptations });
      }
      
      if (compatibilityCheck.recommendations.length > 0) {
        this.logger.info('Skin optimization recommendations', { recommendations: compatibilityCheck.recommendations });
      }
      
      // Determine if this is PCL compatibility mode
      const compatibilityMode = this.determineCompatibilityMode(adaptedSkinDefinition, interfaceType);

      // Create content-driven constraints for algorithmic consistency
      const universalConstraints = this.createContentDrivenConstraints(
        adaptedSkinDefinition,
        interfaceType,
        constraints
      );

      // Calculate layout for the specific interface
      const layout = this.calculateUniversalLayout(
        adaptedSkinDefinition,
        universalConstraints
      );

      // Render for the specific interface
      const output = await this.renderForSpecificInterface(
        adaptedSkinDefinition,
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

  async renderForCLI(
    skinDefinition: UniversalSkinDefinition,
    options: ProceduralCLIOptions = {}
  ): Promise<ProceduralCLIWindowSet> {
    const activeMenuId = options.menuId ?? this.getDefaultMenuId(skinDefinition);
    const navigationHistory = options.navigationHistory ?? [];
    const windows: ProceduralCLIWindow[] = [];
    const visited = new Set<string>();

    type QueueItem = { menuId: string; parentMenuId?: string; history: string[] };
    const queue: QueueItem[] = [{ menuId: activeMenuId, history: navigationHistory }];

    while (queue.length > 0) {
      const { menuId, parentMenuId, history } = queue.shift()!;
      if (visited.has(menuId)) {
        continue;
      }
      visited.add(menuId);

      const composition = this.contentLayoutSystem.composeWindow({
        skin: skinDefinition,
        menuId,
        navigationHistory: history,
        parentMenuId,
      });

      const rendered = this.contentLayoutSystem.renderContent(composition.content);

      windows.push({
        menuId,
        parentMenuId,
        title: composition.content.title ?? menuId,
        output: rendered.output,
        content: composition.content,
        layout: rendered.layout,
        capabilities: rendered.capabilities,
        navigation: {
          breadcrumb: composition.navigation.breadcrumb,
          items: composition.navigation.items,
        },
        isNested: composition.isNested,
      });

      const submenuTargets = this.extractSubmenuTargets(composition.sourceMenu);
      for (const submenuId of submenuTargets) {
        if (!visited.has(submenuId)) {
          queue.push({
            menuId: submenuId,
            parentMenuId: menuId,
            history: [...history, menuId],
          });
        }
      }
    }

    return {
      activeMenuId,
      navigationHistory,
      windows,
    };
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
      compatibilityMode: this.determineCompatibilityMode(skinDefinition, constraints.interfaceType)
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
   * CLI interface rendering with enhanced content layout system
   */
  private renderCLIInterface(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    layout: UniversalCalculatedLayout
  ): string {
    // Check if enhanced rendering is enabled via interface config
    const cliConfig = layout.interfaceSpecific as any;
    const useEnhancedRendering = cliConfig?.terminalFeatures?.enhancedBorders !== false;
    
    if (useEnhancedRendering) {
      // Use enhanced content layout system
      return this.renderCLIWithContentLayout(skinDefinition, layout);
    } else {
      // Use original PCL rendering logic for compatibility
      return this.renderMenuWithLayout(skinDefinition, layout);
    }
  }

  /**
   * Enhanced CLI rendering using the new content layout system
   * TASK-MCP-009: CLI Design Spec compliance with algorithmic consistency
   */
  private renderCLIWithContentLayout(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    layout: UniversalCalculatedLayout
  ): string {
    try {
      // Convert skin definition to WindowContent format with CLI Design Spec compliance
      // Pass navigation context for dynamic routing
      const navigationContext = {
        currentMenuId: layout.interfaceSpecific?.currentMenu || 'main',
        navigationHistory: layout.interfaceSpecific?.navigationHistory || []
      };
      const windowContent = this.convertToWindowContentWithDesignSpec(skinDefinition, navigationContext);
      const cliSpecific = layout.interfaceSpecific?.cli;
      const minWidth = Math.max(
        DisplayUtils.standards.minWidth,
        cliSpecific?.minContentWidth || 0
      );
      const maxWidth = Math.min(
        DisplayUtils.standards.maxWidth,
        cliSpecific?.maxContentWidth ?? DisplayUtils.standards.maxWidth
      );

      const samples = this.collectWindowSamples(windowContent, skinDefinition);
      const layoutMetrics = computeDisplayLayout(samples, {
        padding: DisplayUtils.standards.defaultPadding,
        minWidth,
        maxWidth,
        borderWidth: DisplayUtils.standards.borderWidth,
      });

      const layoutConfig: WindowLayoutConfig = {
        minWidth: Math.max(minWidth, layoutMetrics.windowWidth),
        maxWidth: Math.max(minWidth, layoutMetrics.windowWidth),
        padding: layoutMetrics.padding,
        borderStyle: 'unicode',
        enableColors: true,
      };

      const result = this.contentLayoutSystem.renderContent(windowContent, layoutConfig);
      const renderedOutput = result.output;
      const promptBox = this.createDesignSpecFooter(layoutMetrics.windowWidth);

      return `${renderedOutput}\n\n${promptBox}`;
      
    } catch (error) {
      console.warn('Enhanced CLI rendering failed, falling back to original:', error);
      // Fallback to original rendering
      return this.renderMenuWithLayout(skinDefinition, layout);
    }
  }

  /**
   * Convert skin definition to WindowContent with CLI Design Spec compliance
   * TASK-MCP-009: Uses dynamic routing instead of hardcoded navigation
   */
  private convertToWindowContentWithDesignSpec(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    navigationContext?: {
      currentMenuId?: string;
      navigationHistory?: string[];
    }
  ): WindowContent {
    const sections: ContentSection[] = [];
    
    // Build dynamic routing from skin definition
    const skinRouting = this.buildDynamicMenuRouting(skinDefinition);
    
    // Generate navigation context for current position
    const currentMenuId = navigationContext?.currentMenuId || 'main';
    const navigationHistory = navigationContext?.navigationHistory || [];
    const navContext = this.generateNavigationContext(currentMenuId, navigationHistory, skinRouting);
    
    // Group items into sections with proper CLI Design Spec formatting
    if (skinDefinition.items && skinDefinition.items.length > 0) {
      const mainItems: ContentItem[] = [];
      
      // Process main menu items with procedural numbering (dynamic from skin)
      skinDefinition.items.forEach((item, index) => {
        mainItems.push({
          id: item.id,
          label: item.label,
          description: item.description,
          enabled: true,
          selected: false,
          prefix: `${index + 1}.` // Procedural numbering as per CLI Design Spec
        });
      });
      
      // Add main items section
      sections.push({
        id: 'main',
        heading: undefined, // No section heading for simple menus
        items: mainItems
      });
      
      // Add DYNAMIC navigation items based on skin routing and context
      const dynamicNavigationItems: ContentItem[] = [];
      
      for (const navItem of navContext.contextualNavigation) {
        dynamicNavigationItems.push({
          id: navItem.id,
          label: navItem.label,
          enabled: true,
          selected: false
        });
      }
      
      // Only add navigation section if there are navigation items
      if (dynamicNavigationItems.length > 0) {
        sections.push({
          id: 'navigation',
          heading: '───────────────────────────────────────────────────────────────────', // Menu separator
          items: dynamicNavigationItems
        });
      }
    }
    
    // Add breadcrumb support for CLI Design Spec
    const breadcrumbSubtitle = navContext.breadcrumb.length > 1 
      ? `${skinDefinition.subtitle || ''} │ ${navContext.breadcrumb.join(' › ')}`
      : skinDefinition.subtitle;
    
    return {
      title: skinDefinition.title,
      subtitle: breadcrumbSubtitle,
      sections,
      footer: undefined // Footer handled separately for input prompt box
    };
  }

  private collectWindowSamples(
    windowContent: WindowContent,
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
  ): string[] {
    const samples: string[] = [];

    if (skinDefinition.title) {
      samples.push(skinDefinition.title);
    }

    if (skinDefinition.subtitle) {
      samples.push(skinDefinition.subtitle);
    }

    if (windowContent.title && windowContent.title !== skinDefinition.title) {
      samples.push(windowContent.title);
    }

    if (windowContent.subtitle && windowContent.subtitle !== skinDefinition.subtitle) {
      samples.push(windowContent.subtitle);
    }

    for (const section of windowContent.sections) {
      if (section.heading) {
        samples.push(section.heading);
      }

      for (const item of section.items) {
        samples.push(item.label);
        if (item.description) {
          samples.push(item.description);
        }
        if (item.prefix) {
          samples.push(item.prefix);
        }
      }
    }

    if (windowContent.navigationItems) {
      for (const navItem of windowContent.navigationItems) {
        samples.push(navItem.label);
        if (navItem.description) {
          samples.push(navItem.description);
        }
      }
    }

    return samples
      .filter(sample => sample !== undefined && sample !== null)
      .map(sample => String(sample));
  }

  /**
   * Create CLI Design Spec compliant footer with input prompt box
   */
  private createDesignSpecFooter(windowWidth: number): string {
    const borderChar = '─';
    const topBorder = '┌' + borderChar.repeat(windowWidth - 2) + '┐';
    const bottomBorder = '└' + borderChar.repeat(windowWidth - 2) + '┘';
    const promptText = 'Select an option: (Use arrow keys)';
    const innerWidth = Math.max(1, windowWidth - 4);
    const formattedPrompt = StringUtils.chain(promptText, { mode: 'terminal' })
      .truncate(innerWidth, '...')
      .pad(innerWidth)
      .value();
    const paddedPrompt = `│ ${formattedPrompt} │`;

    return [topBorder, paddedPrompt, bottomBorder].join('\n');
  }

  /**
   * Convert skin menu definition to WindowContent format with CLI design compliance
   */
  private convertToWindowContent(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    selectedItemId?: string,
    isNestedWindow?: boolean,
    parentTitle?: string
  ): WindowContent {
    const sections: ContentSection[] = [];
    
    // Group items into sections
    if (skinDefinition.items && skinDefinition.items.length > 0) {
      const items: ContentItem[] = skinDefinition.items.map((item) => ({
        id: item.id,
        label: item.label,
        description: item.description,
        enabled: true,
        selected: item.id === selectedItemId,
        isSelector: item.id === selectedItemId // Use selector character for selected item
      }));
      
      sections.push({
        id: 'main',
        heading: undefined, // No section heading for simple menus
        items
      });
    }
    
    // Create navigation items (Back, Home, Help, Exit)
    const navigationItems: ContentItem[] = [
      { id: 'back', label: 'Back', enabled: isNestedWindow || false },
      { id: 'home', label: 'Home', enabled: true },
      { id: 'help', label: 'Help', enabled: true },
      { id: 'exit', label: 'Exit', enabled: true }
    ];
    
    return {
      title: skinDefinition.title,
      subtitle: skinDefinition.subtitle,
      sections,
      navigationItems,
      isNestedWindow,
      parentTitle
    };
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
    const hintPrefix = this.formatter.palette.primary('* ');
    output += `${hintPrefix}${layout.theme.descriptionStyle(this.generateHint(context))}\n`;
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

  /**
   * TASK-MCP-009: Algorithmic content-driven layout calculation
   * Replaces hardcoded layout constraints with content analysis
   */
  private createContentDrivenConstraints(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    interfaceType: InterfaceType,
    partialConstraints?: Partial<UniversalLayoutConstraints>
  ): UniversalLayoutConstraints {
    // Analyze skin definition content to determine optimal constraints
    const contentAnalysis = this.analyzeSkinContent(skinDefinition);
    
    // Calculate minimum width based on content (CLI Design Spec requirement)
    // "WindowWidth is set to the minimum width required to display the widest contents 
    // of any Page with 3 character padding between the contents and the border"
    const paddingChars = 3;
    const borderWidth = 2; // Left and right borders
    const calculatedMinWidth = contentAnalysis.maxContentWidth + (paddingChars * 2) + borderWidth;
    
    // Respect terminal constraints but prioritize content-driven sizing
    const terminalWidth = process.stdout.columns || 100;
    const maxAvailableWidth = Math.min(terminalWidth - 4, 120); // Leave margin
    
    const baseConstraints: LayoutConstraints = {
      minHeight: Math.max(15, contentAnalysis.minRequiredHeight),
      minWidth: Math.max(40, Math.min(calculatedMinWidth, maxAvailableWidth)),
      maxWidth: partialConstraints?.maxWidth || maxAvailableWidth,
      textboxLines: partialConstraints?.textboxLines || 3,
      paddingLines: partialConstraints?.paddingLines || 2,
      enforceConsistentHeight: partialConstraints?.enforceConsistentHeight !== false
    };

    // Apply interface-specific constraints
    const interfaceSpecific = this.getInterfaceSpecificConstraints(
      interfaceType, 
      contentAnalysis,
      partialConstraints?.interfaceSpecific
    );

    return {
      ...baseConstraints,
      interfaceType,
      interfaceSpecific
    };
  }

  /**
   * TASK-MCP-009: Content analysis for layout calculation
   */
  private analyzeSkinContent(skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition): {
    maxContentWidth: number;
    minRequiredHeight: number;
    titleWidth: number;
    itemCount: number;
    longestItemWidth: number;
  } {
    let maxContentWidth = 0;
    let itemCount = 0;
    let longestItemWidth = 0;
    
    // Measure title
    const titleWidth = skinDefinition.title ? this.getDisplayWidth(skinDefinition.title) : 0;
    maxContentWidth = Math.max(maxContentWidth, titleWidth);
    
    // Measure subtitle
    if (skinDefinition.subtitle) {
      maxContentWidth = Math.max(maxContentWidth, this.getDisplayWidth(skinDefinition.subtitle));
    }
    
    const items = this.normalizeSkinItems(skinDefinition);

    // Measure menu items
    for (const item of items) {
      itemCount++;
      
      // Build item text as it would be displayed with procedural numbering
      const displayLabel = `${itemCount}. ${item.label}`;
      const descriptionText = item.description ? ` - ${item.description}` : '';
      const fullItemText = `  ${displayLabel}${descriptionText}`;
      
      const itemWidth = this.getDisplayWidth(fullItemText);
      maxContentWidth = Math.max(maxContentWidth, itemWidth);
      longestItemWidth = Math.max(longestItemWidth, itemWidth);
    }
    
    // Calculate minimum required height
    let minRequiredHeight = 5; // Base: title + separator + padding + textbox
    
    if (skinDefinition.subtitle) minRequiredHeight += 2; // subtitle + blank line
    minRequiredHeight += itemCount; // One line per item
    minRequiredHeight += Math.ceil(itemCount / 10); // Spacing between groups of 10
    
    return {
      maxContentWidth,
      minRequiredHeight,
      titleWidth,
      itemCount,
      longestItemWidth
    };
  }

  /**
   * Interface-specific constraint adjustments
   */
  private getInterfaceSpecificConstraints(
    interfaceType: InterfaceType,
    contentAnalysis: any,
    existingSpecific?: any
  ): any {
    const specific = existingSpecific || {};
    
    switch (interfaceType) {
      case 'cli':
        return {
          ...specific,
          cli: {
            // Enable enhanced rendering for CLI Design Spec compliance
            enhancedBorders: true,
            contentDrivenWidth: true,
            algorithmicConsistency: true,
            minContentWidth: contentAnalysis.maxContentWidth,
            itemCount: contentAnalysis.itemCount,
            ...specific.cli
          }
        };
      case 'vscode':
        return {
          ...specific,
          vscode: {
            treeDepth: Math.min(3, Math.ceil(contentAnalysis.itemCount / 10)),
            iconSize: contentAnalysis.itemCount > 20 ? 'small' : 'medium',
            compactMode: contentAnalysis.itemCount > 15,
            ...specific.vscode
          }
        };
      case 'command':
        return {
          ...specific,
          command: {
            outputFormat: contentAnalysis.itemCount > 10 ? 'table' : 'text',
            verbosityLevel: contentAnalysis.itemCount > 20 ? 'minimal' : 'normal',
            includeHeaders: true,
            ...specific.command
          }
        };
      default:
        return specific;
    }
  }

  /**
   * Get display width of text (strips ANSI codes)
   */
  private getDisplayWidth(text: string): number {
    return this.stripAnsi(text).length;
  }

  /**
   * TASK-MCP-009: Dynamic skin-definition routing system
   * Replaces hardcoded menu navigation with skin-driven routing
   */
  private buildDynamicMenuRouting(skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition): {
    availableRoutes: Map<string, any>;
    navigationItems: any[];
    menuRelationships: Map<string, string[]>;
  } {
    const availableRoutes = new Map<string, any>();
    const navigationItems: any[] = [];
    const menuRelationships = new Map<string, string[]>();
    
    // Analyze skin definition structure for dynamic routing
    const skinItems = skinDefinition.items || [];
    
    // Build route map from skin items
    for (const item of skinItems) {
      if (item.type === 'submenu' && item.command) {
        // This item leads to another menu
        availableRoutes.set(item.id, {
          targetMenu: item.command,
          label: item.label,
          description: item.description
        });
        
        // Track parent-child relationships
        const currentMenu = 'main'; // Assume we're analyzing from main
        if (!menuRelationships.has(currentMenu)) {
          menuRelationships.set(currentMenu, []);
        }
        menuRelationships.get(currentMenu)!.push(item.command);
      } else if (item.type === 'command') {
        // This item executes a command
        availableRoutes.set(item.id, {
          command: item.command,
          label: item.label,
          description: item.description,
          type: 'command'
        });
      }
    }
    
    // Build dynamic navigation items based on context
    // These should be contextual rather than always the same
    if (availableRoutes.size > 0) {
      // Only add Back if we're not at root level
      navigationItems.push({
        id: 'back',
        label: 'Back',
        type: 'navigation',
        condition: 'not-root'
      });
    }
    
    // Always available navigation
    navigationItems.push(
      {
        id: 'home',
        label: 'Home', 
        type: 'navigation',
        condition: 'always'
      },
      {
        id: 'help',
        label: 'Help',
        type: 'navigation', 
        condition: 'always'
      },
      {
        id: 'exit',
        label: 'Exit',
        type: 'navigation',
        condition: 'always'
      }
    );
    
    return {
      availableRoutes,
      navigationItems,
      menuRelationships
    };
  }

  /**
   * TASK-MCP-009: Generate navigation context for current menu
   */
  private generateNavigationContext(
    currentMenuId: string,
    navigationHistory: string[],
    skinRouting: any
  ): {
    breadcrumb: string[];
    availableActions: any[];
    contextualNavigation: any[];
  } {
    const breadcrumb: string[] = [];
    const availableActions: any[] = [];
    const contextualNavigation: any[] = [];
    
    // Build breadcrumb from navigation history
    breadcrumb.push('Templum'); // Root
    for (const historyItem of navigationHistory) {
      if (historyItem !== currentMenuId) {
        breadcrumb.push(historyItem);
      }
    }
    breadcrumb.push(currentMenuId);
    
    // Get available actions from skin routing
    for (const [actionId, actionData] of skinRouting.availableRoutes) {
      availableActions.push({
        id: actionId,
        ...actionData
      });
    }
    
    // Build contextual navigation based on current position
    for (const navItem of skinRouting.navigationItems) {
      let shouldInclude = false;
      
      switch (navItem.condition) {
        case 'always':
          shouldInclude = true;
          break;
        case 'not-root':
          shouldInclude = navigationHistory.length > 0;
          break;
        case 'has-parent':
          shouldInclude = breadcrumb.length > 2; // More than root + current
          break;
      }
      
      if (shouldInclude) {
        contextualNavigation.push(navItem);
      }
    }
    
    return {
      breadcrumb,
      availableActions,
      contextualNavigation
    };
  }

  private measureMenuContent(menuDef: UniversalSkinMenuDefinition | PCLSkinMenuDefinition): {
    titleLength: number;
    longestItemLength: number;
    totalItems: number;
    estimatedLines: number;
    samples: string[];
  } {
    const samples: string[] = [];
    const titleLength = this.stripAnsi(menuDef.title || '').length;
    const subtitleLength = menuDef.subtitle ? this.stripAnsi(menuDef.subtitle).length : 0;

    if (menuDef.title) {
      samples.push(menuDef.title);
    }

    if (menuDef.subtitle) {
      samples.push(menuDef.subtitle);
    }

    let longestItemLength = 0;
    let totalItems = 0;

    for (const item of menuDef.items) {
      totalItems++;
      const displayLabel = `${totalItems}. ${item.label}`;
      const itemText = `  ${displayLabel}${item.description ? ` - ${item.description}` : ''}`;
      longestItemLength = Math.max(longestItemLength, this.stripAnsi(itemText).length);
      samples.push(displayLabel);
      if (item.description) {
        samples.push(item.description);
      }
    }

    const estimatedLines = 4 + totalItems + (menuDef.subtitle ? 1 : 0); // title + separator + subtitle + blank + items

    return {
      titleLength: Math.max(titleLength, subtitleLength),
      longestItemLength,
      totalItems,
      estimatedLines,
      samples
    };
  }

  private calculateOptimalWidth(measurements: any, constraints: LayoutConstraints): number {
    const samples: string[] = Array.isArray(measurements.samples) && measurements.samples.length > 0
      ? measurements.samples
      : [''];

    const responsiveWidth = DisplayUtils.responsiveWidth(samples, {
      padding: DisplayUtils.standards.defaultPadding,
      minWidth: constraints.minWidth,
      maxWidth: constraints.maxWidth
    });

    return Math.max(
      constraints.minWidth,
      Math.min(constraints.maxWidth, responsiveWidth)
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

  private resolveTheme(_skinTheme?: SkinTheme): ResolvedTheme {
    return {
      titleStyle: (text: string) => this.formatter.palette.accent(text),
      headingStyle: (text: string) => this.formatter.palette.primary(text),
      itemStyle: (text: string) => this.formatter.palette.primary(text),
      descriptionStyle: (text: string) => this.formatter.palette.muted(text),
      separatorColor: (text: string) => this.formatter.palette.muted(text)
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
    return skinDefinition.items.map((item, _index) => ({
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
    const _theme = this.resolveTheme(skinDefinition.theme);
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

  private prepareIconMapping(skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition, _iconSize?: string): Record<string, string> {
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

  private prepareProgressIndicators(_skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition): any {
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

  private adaptThemeForVSCode(_theme: ResolvedTheme): any {
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

  private renderAsTable(skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition, _layout: UniversalCalculatedLayout): string {
    let table = `┌─────┬──────────────┬──────────────┬──────────────┐\n`;
    table += `│ ID  │ Label        │ Description  │ Type         │\n`;
    table += `├─────┼──────────────┼──────────────┼──────────────┤\n`;
    
    for (const item of skinDefinition.items) {
      const id = this.formatCell(item.id, 3, 'left', '…');
      const label = this.formatCell(item.label, 12, 'left', '…');
      const desc = this.formatCell(item.description || '', 12, 'left', '…');
      const type = this.formatCell(item.type, 12, 'left', '…');
      table += `│ ${id} │ ${label} │ ${desc} │ ${type} │\n`;
    }
    
    table += `└─────┴──────────────┴──────────────┴──────────────┘\n`;
    return table;
  }

  private renderAsText(skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition, _layout: UniversalCalculatedLayout): string {
    let output = `${skinDefinition.title}\n`;
    if (skinDefinition.subtitle) {
      output += `${skinDefinition.subtitle}\n`;
    }
    output += '\n';
    
    skinDefinition.items.forEach((item, index) => {
      const formattedLabel = StringUtils.chain(item.label, { mode: 'terminal' })
        .truncate(40, '...')
        .value();
      output += `${index + 1}. ${formattedLabel}`;
      if (item.description) {
        const formattedDescription = StringUtils.chain(item.description, { mode: 'terminal' })
          .truncate(80, '...')
          .value();
        output += ` - ${formattedDescription}`;
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

  /**
   * Get the content layout system for advanced CLI rendering
   */
  getContentLayoutSystem(): ContentLayoutSystem {
    return this.contentLayoutSystem;
  }

  /**
   * Test terminal compatibility for enhanced rendering
   */
  testTerminalCompatibility(): {
    capabilities: any;
    compatibilityLevel: 'full' | 'partial' | 'basic';
    recommendations: string[];
  } {
    return this.contentLayoutSystem.testTerminalCompatibility();
  }

  /**
   * Force terminal capabilities for testing
   */
  forceTerminalCapabilities(capabilities: any): void {
    this.contentLayoutSystem.forceTerminalCapabilities(capabilities);
  }

  /**
   * Clean text of emojis using the content layout system
   */
  cleanTextOfEmojis(text: string): string {
    return this.contentLayoutSystem.cleanTextOfEmojis(text);
  }

  /**
   * TASK-MCP-009: Dynamic skin compatibility verification system
   * Ensures any backend skin definition can work with the CLI rendering system
   */
  verifySkinCompatibility(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    interfaceType: InterfaceType
  ): {
    compatible: boolean;
    issues: string[];
    recommendations: string[];
    adaptations: any;
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const adaptations: any = {};
    
    const normalizedItems = this.normalizeSkinItems(skinDefinition);

    // Check basic structure requirements
    if (!skinDefinition.title) {
      issues.push('Missing title - CLI Design Spec requires window title');
      adaptations.title = (skinDefinition as any).name ?? 'Untitled Menu';
    }
    
    if (normalizedItems.length === 0) {
      issues.push('No menu items - CLI requires at least one actionable item');
      adaptations.items = [{
        id: 'placeholder',
        label: 'No actions available',
        type: 'command' as const,
        command: 'help'
      }];
    } else if (!skinDefinition.items || skinDefinition.items.length === 0) {
      adaptations.items = normalizedItems;
    }
    
    // Check content width compatibility
    const contentAnalysis = this.analyzeSkinContent(skinDefinition);
    const terminalWidth = process.stdout.columns || 100;
    
    if (contentAnalysis.maxContentWidth > terminalWidth - 10) {
      issues.push('Content width exceeds terminal constraints');
      recommendations.push('Consider shorter labels and descriptions for better display');
      adaptations.truncateContent = true;
    }
    
    // Check for CLI Design Spec compliance issues
    const hasLongItems = normalizedItems.some(item => 
      (item.label.length + (item.description?.length || 0)) > 80
    );
    
    if (hasLongItems) {
      recommendations.push('Some items have very long labels/descriptions - may need truncation');
      adaptations.enableTruncation = true;
    }
    
    // Check navigation compatibility
    const skinRouting = this.buildDynamicMenuRouting({
      ...(skinDefinition as unknown as Record<string, unknown>),
      items: normalizedItems
    } as UniversalSkinMenuDefinition | PCLSkinMenuDefinition);
    const hasValidRoutes = skinRouting.availableRoutes.size > 0;
    
    if (!hasValidRoutes) {
      recommendations.push('No navigation routes detected - consider adding submenu items');
    }
    
    // Interface-specific compatibility checks
    switch (interfaceType) {
      case 'cli':
        // CLI-specific compatibility checks
        if (contentAnalysis.itemCount > 50) {
          issues.push('Too many items for optimal CLI display');
          recommendations.push('Consider grouping items or using pagination');
          adaptations.enablePagination = true;
        }
        break;
        
      case 'vscode':
        // VSCode-specific compatibility checks
        if (contentAnalysis.itemCount > 100) {
          recommendations.push('Large menu - consider tree view optimization');
          adaptations.useCompactMode = true;
        }
        break;
        
      case 'command':
        // Command-specific compatibility checks
        if (!normalizedItems.every(item => item.command)) {
          issues.push('Not all items have executable commands');
          adaptations.filterNonExecutable = true;
        }
        break;
    }
    
    const compatible = issues.length === 0;
    
    return {
      compatible,
      issues,
      recommendations,
      adaptations
    };
  }

  /**
   * Apply adaptations for skin compatibility
   */
  applySkinAdaptations(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    adaptations: any
  ): UniversalSkinMenuDefinition | PCLSkinMenuDefinition {
    let adaptedSkin = { ...skinDefinition };
    const layoutDefinition = (skinDefinition as { layout?: { items?: Array<Record<string, unknown>> } }).layout;

    if ((!adaptedSkin.items || adaptedSkin.items.length === 0) && layoutDefinition?.items?.length) {
      adaptedSkin.items = this.normalizeSkinItems(skinDefinition);
    }
    
    // Apply title adaptation
    if (adaptations.title && !adaptedSkin.title) {
      adaptedSkin.title = adaptations.title;
    }
    
    // Apply items adaptation
    if (adaptations.items && (!adaptedSkin.items || adaptedSkin.items.length === 0)) {
      adaptedSkin.items = adaptations.items;
    }
    
    // Apply truncation if needed
    if (adaptations.enableTruncation) {
      adaptedSkin.items = adaptedSkin.items?.map(item => ({
        ...item,
        label: StringUtils.chain(item.label, { mode: 'terminal' })
          .truncate(40, '...')
          .value(),
        description: item.description
          ? StringUtils.chain(item.description, { mode: 'terminal' })
              .truncate(60, '...')
              .value()
          : item.description
      }));
    }
    
    // Filter non-executable items for command interface
    if (adaptations.filterNonExecutable) {
      adaptedSkin.items = adaptedSkin.items?.filter(item => item.command);
    }
    
    return adaptedSkin;
  }

  private determineCompatibilityMode(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    interfaceType: InterfaceType
  ): 'pcl' | 'universal' {
    const metadata = (skinDefinition as { metadata?: { compatibilityMode?: string } }).metadata;
    if ((skinDefinition as { pclVersion?: string }).pclVersion) {
      return 'pcl';
    }

    if (metadata?.compatibilityMode && metadata.compatibilityMode.toLowerCase() === 'pcl') {
      return 'pcl';
    }

    const interfacesList = Array.isArray((skinDefinition as { interfaces?: InterfaceType[] | string[] }).interfaces)
      ? ((skinDefinition as { interfaces?: InterfaceType[] | string[] }).interfaces ?? [])
      : [];
    const normalized = interfacesList.map((iface) =>
      typeof iface === 'string' ? iface.toLowerCase() : String(iface)
    );

    if (normalized.length === 0) {
      return 'pcl';
    }

    const cliAliases = new Set(['cli', 'command-line', 'terminal']);
    if (normalized.every((iface) => cliAliases.has(iface))) {
      return 'pcl';
    }

    if (interfaceType === 'cli' && normalized.every((iface) => cliAliases.has(iface) || iface === 'universal')) {
      return 'pcl';
    }

    return 'universal';
  }

  private normalizeSkinItems(
    skinDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition
  ): SkinMenuItem[] {
    if (Array.isArray(skinDefinition.items) && skinDefinition.items.length > 0) {
      return skinDefinition.items;
    }

    const layoutItems = (skinDefinition as { layout?: { items?: Array<Record<string, unknown>> } }).layout?.items;
    if (!Array.isArray(layoutItems)) {
      return [];
    }

    return layoutItems.map((item, index) => ({
      id: (item.id as string) ?? `item-${index + 1}`,
      label: (item.label as string) ?? `Item ${index + 1}`,
      description: item.description as string | undefined,
      type: (item.type as SkinMenuItem['type']) ?? 'command',
      command:
        (item.command as string | undefined) ??
        ((item.type as SkinMenuItem['type']) === 'command' ? (item.id as string) ?? `command-${index + 1}` : undefined)
    }));
  }
}
