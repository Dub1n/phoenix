/**
---
date: 2025-09-12T174343Z
name: CLI Navigation Width Calculator
TASK-ID: [TASK-MCP-006]
category: navigation-system
status: ["[T]"]
patterns: [content-measurement, dynamic-sizing, responsive-layout]
components: [WidthCalculator, ContentAnalyzer, PaddingManager]
dependencies: [string-width, chalk, border-renderer]
tags: [cli, navigation, sizing, responsive]
---
 * 
 * WidthCalculator - Dynamic Window Sizing System
 * 
 * Provides intelligent window width calculation based on content analysis,
 * multi-byte character support, and terminal constraints. Implements the
 * "widest content across all pages" requirement from the design specification.
 * 
 * Generated: 2025-09-12T174343Z
 * TASK-ID: TASK-MCP-006 Pattern: content-measurement | Complexity: 4 | Dependencies: string-width,chalk
 * Context: Dynamic width calculation for bordered windows based on content measurement
 * Validation-Required: multi-byte-character-support, performance-benchmarking, responsive-behavior
 * Pattern-Info: { approach: "content-analysis", alternatives: "fixed-width", trade-offs: "computation-overhead" }
 */

import chalk from 'chalk';
import { BorderCapabilityDetector } from './border-renderer';
import { StringUtils, StringWidthUtils } from '../../utils/chainable-string-utils';

// TODO: [TASK-ID-003] Pattern: content-measurement | Complexity: 3 | Dependencies: string-width
// Context: Multi-byte character width calculation for accurate content measurement
// Validation-Required: unicode-character-support, emoji-handling, performance-testing
// Pattern-Info: { approach: "string-width-library", alternatives: "custom-calculation", trade-offs: "dependency-management" }

/**
 * Content analysis for menu and text measurement
 */
export interface ContentAnalysisResult {
  maxLineWidth: number;
  totalLines: number;
  averageLineWidth: number;
  hasMultiByteChars: boolean;
  hasAnsiCodes: boolean;
  recommendedWidth: number;
  contentComplexity: 'simple' | 'medium' | 'complex';
}

export class ContentAnalyzer {
  /**
   * Analyze content structure and dimensions
   */
  static analyzeContent(lines: string[]): ContentAnalysisResult {
    let maxLineWidth = 0;
    let totalWidth = 0;
    let hasMultiByteChars = false;
    let hasAnsiCodes = false;
    
    for (const line of lines) {
      const lineWidth = StringWidthUtils.getDisplayWidth(line);
      maxLineWidth = Math.max(maxLineWidth, lineWidth);
      totalWidth += lineWidth;
      
      // Check for multi-byte characters
      if (!hasMultiByteChars && StringWidthUtils.getDisplayWidth(line) !== line.length) {
        hasMultiByteChars = true;
      }
      
      // Check for ANSI codes
      if (!hasAnsiCodes && line !== StringWidthUtils.stripAnsi(line)) {
        hasAnsiCodes = true;
      }
    }
    
    const averageLineWidth = lines.length > 0 ? totalWidth / lines.length : 0;
    const recommendedWidth = Math.max(40, maxLineWidth + 8); // +8 for padding and borders
    
    // Determine complexity
    let contentComplexity: 'simple' | 'medium' | 'complex' = 'simple';
    if (hasMultiByteChars || hasAnsiCodes || maxLineWidth > 80) {
      contentComplexity = 'medium';
    }
    if (maxLineWidth > 120 || lines.length > 20) {
      contentComplexity = 'complex';
    }
    
    return {
      maxLineWidth,
      totalLines: lines.length,
      averageLineWidth,
      hasMultiByteChars,
      hasAnsiCodes,
      recommendedWidth,
      contentComplexity
    };
  }

  /**
   * Analyze menu structure for optimal width calculation
   */
  static analyzeMenuContent(menuDefinition: any): ContentAnalysisResult {
    const lines: string[] = [];
    
    // Extract title and subtitle
    if (menuDefinition.title) {
      lines.push(menuDefinition.title);
    }
    if (menuDefinition.subtitle) {
      lines.push(menuDefinition.subtitle);
    }
    
    // Extract menu items
    if (menuDefinition.sections) {
      for (const section of menuDefinition.sections) {
        if (section.heading) {
          lines.push(section.heading);
        }
        
        if (section.items) {
          for (const item of section.items) {
            lines.push(item.label || '');
            if (item.description) {
              lines.push(item.description);
            }
          }
        }
      }
    }
    
    return this.analyzeContent(lines);
  }
}

/**
 * Padding management for consistent spacing
 */
export interface PaddingConfig {
  left: number;
  right: number;
  top: number;
  bottom: number;
  inner: number; // Padding between border and content
}

export class PaddingManager {
  private config: PaddingConfig;

  constructor(config: Partial<PaddingConfig> = {}) {
    this.config = {
      left: 3,
      right: 3,
      top: 1,
      bottom: 1,
      inner: 3,
      ...config
    };
  }

  /**
   * Apply padding to content lines
   */
  applyPadding(lines: string[], targetWidth: number): string[] {
    const contentWidth = targetWidth - this.config.left - this.config.right - 2; // -2 for borders
    const paddedLines: string[] = [];
    
    // Top padding
    for (let i = 0; i < this.config.top; i++) {
      paddedLines.push('');
    }
    
    // Content with horizontal padding
    const innerPadding = ' '.repeat(this.config.inner);
    const textWidth = Math.max(0, contentWidth - this.config.inner * 2);

    for (const line of lines) {
      const contentSegment = textWidth > 0
        ? StringUtils.chain(line, { mode: 'terminal' })
            .truncate(textWidth)
            .pad(textWidth)
            .value()
        : '';

      paddedLines.push(`${innerPadding}${contentSegment}${innerPadding}`);
    }
    
    // Bottom padding
    for (let i = 0; i < this.config.bottom; i++) {
      paddedLines.push('');
    }
    
    return paddedLines;
  }

  /**
   * Calculate total padding dimensions
   */
  getTotalPaddingDimensions(): { width: number; height: number } {
    return {
      width: this.config.left + this.config.right + (this.config.inner * 2) + 2, // +2 for borders
      height: this.config.top + this.config.bottom + 2 // +2 for top/bottom borders
    };
  }

  /**
   * Validate padding configuration
   */
  validatePadding(terminalWidth: number, terminalHeight: number): boolean {
    const totalPadding = this.getTotalPaddingDimensions();
    
    // Ensure minimum usable space
    const minUsableWidth = 20;
    const minUsableHeight = 5;
    
    return (terminalWidth - totalPadding.width >= minUsableWidth) &&
           (terminalHeight - totalPadding.height >= minUsableHeight);
  }
}

/**
 * Main width calculation system
 */
export interface WidthCalculationOptions {
  minWidth: number;
  maxWidth: number;
  preferredWidth?: number;
  allowShrinking: boolean;
  respectTerminalWidth: boolean;
  paddingConfig?: Partial<PaddingConfig>;
  enforceConsistency: boolean; // Ensure all windows have same width
}

export interface WidthCalculationResult {
  calculatedWidth: number;
  contentWidth: number;
  paddingWidth: number;
  borderWidth: number;
  isOptimal: boolean;
  reasoning: string;
  recommendations: string[];
}

export class WidthCalculator {
  protected options: WidthCalculationOptions;
  private paddingManager: PaddingManager;
  private terminalCapabilities = BorderCapabilityDetector.getCapabilities();

  constructor(options: Partial<WidthCalculationOptions> = {}) {
    this.options = {
      minWidth: 40,
      maxWidth: 120,
      allowShrinking: true,
      respectTerminalWidth: true,
      enforceConsistency: false,
      ...options
    };

    this.paddingManager = new PaddingManager(options.paddingConfig);
  }

  /**
   * Calculate optimal width for single content
   */
  calculateWidth(content: string[] | any): WidthCalculationResult {
    let analysis: ContentAnalysisResult;
    
    if (Array.isArray(content)) {
      analysis = ContentAnalyzer.analyzeContent(content);
    } else {
      analysis = ContentAnalyzer.analyzeMenuContent(content);
    }
    
    return this.calculateWidthFromAnalysis(analysis);
  }

  /**
   * Calculate consistent width across multiple content pieces
   */
  calculateConsistentWidth(contents: (string[] | any)[]): WidthCalculationResult {
    const analyses = contents.map(content => 
      Array.isArray(content) 
        ? ContentAnalyzer.analyzeContent(content)
        : ContentAnalyzer.analyzeMenuContent(content)
    );
    
    // Find maximum width requirements across all content
    const maxContentWidth = Math.max(...analyses.map(a => a.maxLineWidth));
    const maxRecommendedWidth = Math.max(...analyses.map(a => a.recommendedWidth));
    
    // Create combined analysis
    const combinedAnalysis: ContentAnalysisResult = {
      maxLineWidth: maxContentWidth,
      totalLines: Math.max(...analyses.map(a => a.totalLines)),
      averageLineWidth: analyses.reduce((sum, a) => sum + a.averageLineWidth, 0) / analyses.length,
      hasMultiByteChars: analyses.some(a => a.hasMultiByteChars),
      hasAnsiCodes: analyses.some(a => a.hasAnsiCodes),
      recommendedWidth: maxRecommendedWidth,
      contentComplexity: this.getMaxComplexity(analyses.map(a => a.contentComplexity))
    };
    
    return this.calculateWidthFromAnalysis(combinedAnalysis);
  }

  /**
   * Calculate width from content analysis
   */
  private calculateWidthFromAnalysis(analysis: ContentAnalysisResult): WidthCalculationResult {
    const paddingDimensions = this.paddingManager.getTotalPaddingDimensions();
    const borderWidth = 2; // Left and right borders
    const paddingWidth = paddingDimensions.width - borderWidth;
    
    // Start with content requirements
    let targetWidth = analysis.maxLineWidth + paddingWidth + borderWidth;
    
    // Apply preferred width if set
    if (this.options.preferredWidth) {
      targetWidth = Math.max(targetWidth, this.options.preferredWidth);
    }
    
    // Apply terminal width constraints
    if (this.options.respectTerminalWidth) {
      const terminalWidth = this.terminalCapabilities.width;
      const maxAllowedWidth = Math.min(this.options.maxWidth, terminalWidth - 4); // -4 for margin
      targetWidth = Math.min(targetWidth, maxAllowedWidth);
    } else {
      targetWidth = Math.min(targetWidth, this.options.maxWidth);
    }
    
    // Ensure minimum width
    targetWidth = Math.max(targetWidth, this.options.minWidth);
    
    // Calculate final dimensions
    const calculatedWidth = targetWidth;
    const contentWidth = calculatedWidth - paddingWidth - borderWidth;
    const isOptimal = contentWidth >= analysis.maxLineWidth;
    
    // Generate reasoning and recommendations
    const reasoning = this.generateReasoning(analysis, calculatedWidth, contentWidth, isOptimal);
    const recommendations = this.generateRecommendations(analysis, calculatedWidth, contentWidth, isOptimal);
    
    return {
      calculatedWidth,
      contentWidth,
      paddingWidth,
      borderWidth,
      isOptimal,
      reasoning,
      recommendations
    };
  }

  /**
   * Generate reasoning for width calculation
   */
  private generateReasoning(analysis: ContentAnalysisResult, calculatedWidth: number, contentWidth: number, isOptimal: boolean): string {
    const factors = [];
    
    factors.push(`Content width: ${analysis.maxLineWidth}`);
    factors.push(`Recommended width: ${analysis.recommendedWidth}`);
    factors.push(`Terminal width: ${this.terminalCapabilities.width}`);
    factors.push(`Final width: ${calculatedWidth}`);
    
    if (analysis.hasMultiByteChars) {
      factors.push('Multi-byte characters detected');
    }
    
    if (analysis.hasAnsiCodes) {
      factors.push('ANSI formatting detected');
    }
    
    if (!isOptimal) {
      factors.push('Content may be truncated');
    }
    
    return factors.join(', ');
  }

  /**
   * Generate recommendations for optimization
   */
  private generateRecommendations(analysis: ContentAnalysisResult, calculatedWidth: number, contentWidth: number, isOptimal: boolean): string[] {
    const recommendations = [];
    
    if (!isOptimal) {
      recommendations.push('Consider increasing terminal width or reducing content length');
    }
    
    if (analysis.contentComplexity === 'complex') {
      recommendations.push('Complex content detected - consider pagination or scrolling');
    }
    
    if (analysis.hasMultiByteChars) {
      recommendations.push('Multi-byte characters present - verify terminal font support');
    }
    
    const utilizationRatio = contentWidth / calculatedWidth;
    if (utilizationRatio < 0.6) {
      recommendations.push('Low content utilization - consider reducing padding or width');
    }
    
    if (calculatedWidth > this.terminalCapabilities.width * 0.9) {
      recommendations.push('Width approaching terminal limits - consider responsive design');
    }
    
    return recommendations;
  }

  /**
   * Get maximum complexity from multiple analyses
   */
  private getMaxComplexity(complexities: ('simple' | 'medium' | 'complex')[]): 'simple' | 'medium' | 'complex' {
    if (complexities.includes('complex')) return 'complex';
    if (complexities.includes('medium')) return 'medium';
    return 'simple';
  }

  /**
   * Update calculation options
   */
  updateOptions(options: Partial<WidthCalculationOptions>): void {
    this.options = { ...this.options, ...options };
    
    if (options.paddingConfig) {
      this.paddingManager = new PaddingManager(options.paddingConfig);
    }
  }

  /**
   * Get current terminal dimensions
   */
  getTerminalDimensions(): { width: number; height: number } {
    return {
      width: this.terminalCapabilities.width,
      height: this.terminalCapabilities.height
    };
  }

  /**
   * Test width calculation with sample content
   */
  testCalculation(sampleContent: string[]): WidthCalculationResult {
    return this.calculateWidth(sampleContent);
  }
}

// TODO: [TASK-ID-004] Pattern: responsive-design | Complexity: 3 | Dependencies: terminal-detection
// Context: Responsive width adjustment based on terminal size changes
// Validation-Required: resize-handling, performance-testing, layout-consistency
// Pattern-Info: { approach: "event-driven-resize", alternatives: "polling-based", trade-offs: "event-reliability" }

/**
 * Responsive width calculator that adapts to terminal size changes
 */
export class ResponsiveWidthCalculator extends WidthCalculator {
  private resizeListeners: (() => void)[] = [];
  private lastKnownDimensions: { width: number; height: number };

  constructor(options: Partial<WidthCalculationOptions> = {}) {
    super(options);
    this.lastKnownDimensions = this.getTerminalDimensions();
    this.setupResizeListener();
  }

  /**
   * Setup terminal resize listener
   */
  private setupResizeListener(): void {
    process.stdout.on('resize', () => {
      const newDimensions = this.getTerminalDimensions();
      
      if (newDimensions.width !== this.lastKnownDimensions.width ||
          newDimensions.height !== this.lastKnownDimensions.height) {
        
        this.lastKnownDimensions = newDimensions;
        this.notifyResizeListeners();
      }
    });
  }

  /**
   * Add resize listener
   */
  onResize(listener: () => void): void {
    this.resizeListeners.push(listener);
  }

  /**
   * Remove resize listener
   */
  removeResizeListener(listener: () => void): void {
    const index = this.resizeListeners.indexOf(listener);
    if (index > -1) {
      this.resizeListeners.splice(index, 1);
    }
  }

  /**
   * Notify all resize listeners
   */
  private notifyResizeListeners(): void {
    this.resizeListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('Error in resize listener:', error);
      }
    });
  }

  /**
   * Calculate responsive width that adapts to current terminal size
   */
  calculateResponsiveWidth(content: string[] | any): WidthCalculationResult {
    // Update options based on current terminal size
    const dimensions = this.getTerminalDimensions();
    const responsiveMaxWidth = Math.min(
      this.options.maxWidth,
      Math.max(40, dimensions.width - 8) // -8 for margins
    );
    
    const originalMaxWidth = this.options.maxWidth;
    this.updateOptions({ maxWidth: responsiveMaxWidth });
    
    const result = this.calculateWidth(content);
    
    // Restore original max width
    this.updateOptions({ maxWidth: originalMaxWidth });
    
    return result;
  }

  /**
   * Cleanup resize listeners
   */
  cleanup(): void {
    this.resizeListeners = [];
    process.stdout.removeAllListeners('resize');
  }
}

/**
 * Factory function for creating width calculator
 */
export function createWidthCalculator(options?: Partial<WidthCalculationOptions>): WidthCalculator {
  return new WidthCalculator(options);
}

/**
 * Factory function for creating responsive width calculator
 */
export function createResponsiveWidthCalculator(options?: Partial<WidthCalculationOptions>): ResponsiveWidthCalculator {
  return new ResponsiveWidthCalculator(options);
}
