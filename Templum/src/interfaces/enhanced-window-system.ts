/**
---
date: 2025-09-12T174343Z
name: enhanced-window-system
TASK-ID: [TASK-MCP-006]
category: cli-enhancement
status: [T]
patterns: [progressive-enhancement, structured-windows, unified-integration]
components: [enhanced-window-system, universal-layout-integration]
dependencies: [border-renderer, window-layout-manager, emoji-remover, terminal-compatibility-detector, universal-layout-engine]
tags: [terminal-ui, integration, progressive-enhancement, window-system]
---
 * 
 * Enhanced Window System
 * 
 * Integrates all window system components with the existing Universal Layout Engine
 * to provide progressive enhancement with structured bordered windows, terminal
 * compatibility detection, and clean emoji-free design.
 * 
 * TASK-MCP-006: Complete integration of structured window system
 */

import chalk from 'chalk';
import { BorderRenderer, WindowContent, WindowOptions, WindowTheme } from './border-renderer';
import { WindowLayoutManager, OptimalLayout } from './window-layout-manager';
import { TerminalCompatibilityDetector, TerminalCapabilities, getTerminalCapabilities } from './terminal-compatibility-detector';
import { UniversalLayoutEngine, UniversalSkinMenuDefinition, PCLSkinMenuDefinition, InterfaceType } from '../rendering/universal-layout-engine';

export interface EnhancedWindowOptions extends WindowOptions {
  enableProgessiveEnhancement?: boolean;
  cleanEmojis?: boolean;
  fallbackMode?: 'ascii' | 'simple' | 'auto';
  preserveOriginalLayout?: boolean;
}

export interface WindowSystemCapabilities {
  supportsStructuredWindows: boolean;
  supportsUnicodeBorders: boolean;
  fallbackMode: 'unicode' | 'ascii' | 'simple';
  terminalCapabilities: TerminalCapabilities;
  recommendedTheme: WindowTheme;
}

export interface EnhancedRenderResult {
  success: boolean;
  mode: 'enhanced' | 'legacy' | 'fallback';
  output: string;
  capabilities: WindowSystemCapabilities;
  renderTime: number;
  cleanupApplied: boolean;
  layoutOptimized: boolean;
}

export class EnhancedWindowSystem {
  private borderRenderer: BorderRenderer;
  private layoutManager: WindowLayoutManager;
  private compatibilityDetector: TerminalCompatibilityDetector;
  private universalLayoutEngine: UniversalLayoutEngine;
  
  // Cache capabilities to avoid repeated detection
  private cachedCapabilities: WindowSystemCapabilities | null = null;

  constructor() {
    this.borderRenderer = new BorderRenderer();
    this.layoutManager = new WindowLayoutManager();
    this.compatibilityDetector = new TerminalCompatibilityDetector();
    this.universalLayoutEngine = new UniversalLayoutEngine();
  }

  /**
   * Main entry point - render menu with progressive enhancement
   */
  async renderMenu(
    menuDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    interfaceType: InterfaceType = 'cli',
    options: EnhancedWindowOptions = {}
  ): Promise<EnhancedRenderResult> {
    const startTime = Date.now();
    
    try {
      // Get or detect system capabilities
      const capabilities = await this.getSystemCapabilities();
      
      // Determine rendering mode based on capabilities and options
      const renderMode = this.determineRenderMode(capabilities, options);
      
      // Apply progressive enhancement if enabled
      if (options.enableProgessiveEnhancement !== false && renderMode === 'enhanced') {
        return this.renderEnhancedMenu(menuDefinition, interfaceType, options, capabilities, startTime);
      } else {
        return this.renderLegacyMenu(menuDefinition, interfaceType, options, capabilities, startTime);
      }
    } catch (error) {
      const renderTime = Date.now() - startTime;
      return {
        success: false,
        mode: 'fallback',
        output: `Error rendering menu: ${error instanceof Error ? error.message : 'Unknown error'}`,
        capabilities: await this.getSystemCapabilities(),
        renderTime,
        cleanupApplied: false,
        layoutOptimized: false
      };
    }
  }

  /**
   * Create a simple windowed interface around content
   */
  async createWindow(
    title: string,
    content: string[],
    options: EnhancedWindowOptions = {}
  ): Promise<EnhancedRenderResult> {
    const startTime = Date.now();
    const capabilities = await this.getSystemCapabilities();
    
    // Create window content
    const windowContent: WindowContent = {
      title: title,
      content: content
    };
    
    // Render window
    try {
      const output = await this.borderRenderer.renderWindow(windowContent, options);
      const renderTime = Date.now() - startTime;
      
      return {
        success: true,
        mode: 'enhanced',
        output,
        capabilities,
        renderTime,
        cleanupApplied: false,
        layoutOptimized: true
      };
    } catch (error) {
      const renderTime = Date.now() - startTime;
      
      // Fallback to simple text output
      const fallbackOutput = this.createFallbackOutput(windowContent);
      
      return {
        success: true,
        mode: 'fallback',
        output: fallbackOutput,
        capabilities,
        renderTime,
        cleanupApplied: false,
        layoutOptimized: false
      };
    }
  }

  /**
   * Get or detect system capabilities
   */
  async getSystemCapabilities(): Promise<WindowSystemCapabilities> {
    if (this.cachedCapabilities) {
      return this.cachedCapabilities;
    }

    const terminalCapabilities = await this.compatibilityDetector.detectCapabilities();
    
    const supportsStructuredWindows = 
      terminalCapabilities.supportsAnsi && 
      (terminalCapabilities.width >= 40) && 
      (terminalCapabilities.height >= 10);
    
    const supportsUnicodeBorders = 
      terminalCapabilities.supportsUnicode && 
      terminalCapabilities.supportsBoxDrawing;
    
    let fallbackMode: 'unicode' | 'ascii' | 'simple' = 'simple';
    if (supportsUnicodeBorders) {
      fallbackMode = 'unicode';
    } else if (terminalCapabilities.supportsAnsi) {
      fallbackMode = 'ascii';
    }
    
    const recommendedTheme = this.createRecommendedTheme(terminalCapabilities);
    
    this.cachedCapabilities = {
      supportsStructuredWindows,
      supportsUnicodeBorders,
      fallbackMode,
      terminalCapabilities,
      recommendedTheme
    };
    
    return this.cachedCapabilities;
  }

  /**
   * Force refresh of cached capabilities
   */
  async refreshCapabilities(): Promise<WindowSystemCapabilities> {
    this.cachedCapabilities = null;
    await this.compatibilityDetector.refresh();
    return this.getSystemCapabilities();
  }

  /**
   * Render menu with enhanced window system
   */
  private async renderEnhancedMenu(
    menuDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    interfaceType: InterfaceType,
    options: EnhancedWindowOptions,
    capabilities: WindowSystemCapabilities,
    startTime: number
  ): Promise<EnhancedRenderResult> {
    // Use menu definition as-is
    const cleanedDefinition = menuDefinition;
    const cleanupApplied = false;
    
    // Convert menu to window content
    const windowContent = this.menuToWindowContent(cleanedDefinition);
    
    // Calculate optimal layout
    const terminalCapabilities = await getTerminalCapabilities();
    const optimalLayout = this.layoutManager.calculateOptimalLayout(
      windowContent,
      terminalCapabilities,
      options
    );
    
    // Optimize content for the layout
    const optimizedContent = this.layoutManager.optimizeContentForLayout(
      windowContent,
      optimalLayout
    );
    
    // Apply window theme based on capabilities
    const windowOptions: WindowOptions = {
      ...options,
      borderSet: options.fallbackMode || capabilities.fallbackMode,
      theme: options.theme || capabilities.recommendedTheme,
      width: optimalLayout.width,
      height: optimalLayout.height
    };
    
    // Render the window
    const output = await this.borderRenderer.renderWindow(optimizedContent, windowOptions);
    const renderTime = Date.now() - startTime;
    
    return {
      success: true,
      mode: 'enhanced',
      output,
      capabilities,
      renderTime,
      cleanupApplied,
      layoutOptimized: true
    };
  }

  /**
   * Render menu with legacy Universal Layout Engine
   */
  private async renderLegacyMenu(
    menuDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
    interfaceType: InterfaceType,
    options: EnhancedWindowOptions,
    capabilities: WindowSystemCapabilities,
    startTime: number
  ): Promise<EnhancedRenderResult> {
    // Use menu definition as-is
    const cleanedDefinition = menuDefinition;
    const cleanupApplied = false;
    
    // Use original Universal Layout Engine
    const result = await this.universalLayoutEngine.renderForInterface(
      cleanedDefinition,
      interfaceType
    );
    
    const renderTime = Date.now() - startTime;
    
    return {
      success: result.success,
      mode: 'legacy',
      output: result.output || '',
      capabilities,
      renderTime,
      cleanupApplied,
      layoutOptimized: false
    };
  }

  /**
   * Determine the appropriate rendering mode
   */
  private determineRenderMode(
    capabilities: WindowSystemCapabilities,
    options: EnhancedWindowOptions
  ): 'enhanced' | 'legacy' | 'fallback' {
    // Force legacy mode if requested
    if (options.preserveOriginalLayout) {
      return 'legacy';
    }
    
    // Use enhanced mode if terminal supports it
    if (capabilities.supportsStructuredWindows) {
      return 'enhanced';
    }
    
    // Fallback to legacy
    return 'legacy';
  }


  /**
   * Convert menu definition to window content
   */
  private menuToWindowContent(
    menuDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition
  ): WindowContent {
    const content: string[] = [];
    
    // Add subtitle if present
    if (menuDefinition.subtitle) {
      content.push(menuDefinition.subtitle);
      content.push(''); // Empty line
    }
    
    // Add menu items
    menuDefinition.items.forEach((item, index) => {
      const number = index + 1;
      const label = `${number}. ${item.label}`;
      const description = item.description ? ` - ${item.description}` : '';
      content.push(`  ${label}${description}`);
    });
    
    // Add spacing and help text
    content.push('');
    content.push('Enter number to select, "back" to return, "quit" to exit');
    
    return {
      title: menuDefinition.title,
      content
    };
  }

  /**
   * Create recommended theme based on terminal capabilities
   */
  private createRecommendedTheme(capabilities: TerminalCapabilities): WindowTheme {
    if (capabilities.supportsColors && capabilities.colorDepth >= 8) {
      // Full color theme
      return {
        border: chalk.gray,
        title: chalk.blue.bold,
        content: chalk.white,
        footer: chalk.gray
      };
    } else if (capabilities.supportsColors && capabilities.colorDepth >= 4) {
      // Basic color theme
      return {
        border: chalk.white,
        title: chalk.green.bold,
        content: chalk.white,
        footer: chalk.gray
      };
    } else {
      // Monochrome theme
      return {
        border: (text: string) => text,
        title: (text: string) => text.toUpperCase(),
        content: (text: string) => text,
        footer: (text: string) => text
      };
    }
  }

  /**
   * Create fallback output when window rendering fails
   */
  private createFallbackOutput(windowContent: WindowContent): string {
    let output = '';
    
    if (windowContent.title) {
      output += windowContent.title.toUpperCase() + '\n';
      output += '='.repeat(windowContent.title.length) + '\n\n';
    }
    
    output += windowContent.content.join('\n');
    
    if (windowContent.footer) {
      output += '\n\n' + windowContent.footer;
    }
    
    return output;
  }

  /**
   * Generate diagnostic information
   */
  async generateDiagnostics(): Promise<string> {
    const capabilities = await this.getSystemCapabilities();
    const terminalSummary = await this.compatibilityDetector.getCompatibilitySummary();
    
    return `Enhanced Window System Diagnostics:
  
${terminalSummary}
  
Window System Status:
  Structured Windows: ${capabilities.supportsStructuredWindows ? 'Supported' : 'Not Supported'}
  Unicode Borders: ${capabilities.supportsUnicodeBorders ? 'Supported' : 'Not Supported'}
  Recommended Mode: ${capabilities.fallbackMode}
  
Performance Metrics:
${Array.from(this.universalLayoutEngine.getPerformanceMetrics().entries())
  .map(([key, value]) => `  ${key}: ${value.toFixed(1)}ms`)
  .join('\n')}`;
  }
}

// Export singleton instance  
export const enhancedWindowSystem = new EnhancedWindowSystem();

/**
 * Quick access functions
 */
export async function renderEnhancedMenu(
  menuDefinition: UniversalSkinMenuDefinition | PCLSkinMenuDefinition,
  interfaceType: InterfaceType = 'cli',
  options?: EnhancedWindowOptions
): Promise<EnhancedRenderResult> {
  return enhancedWindowSystem.renderMenu(menuDefinition, interfaceType, options);
}

export async function createEnhancedWindow(
  title: string,
  content: string[],
  options?: EnhancedWindowOptions
): Promise<EnhancedRenderResult> {
  return enhancedWindowSystem.createWindow(title, content, options);
}

export async function getWindowSystemCapabilities(): Promise<WindowSystemCapabilities> {
  return enhancedWindowSystem.getSystemCapabilities();
}
