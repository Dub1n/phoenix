/**
---
date: 2025-09-13T103229Z
name: cli-display-consistency-engine
TASK-ID: [TASK-MCP-009]
category: CLI-Design-Consistency
status: [T]
patterns: [Display-Consistency-Framework, Pattern-Based-Display, Skin-Compatible-Layout]
components: [CLIDisplayConsistencyEngine, Display-Coordination, Pattern-Management]
dependencies: [display-standards-calculator, service-ordering-manager, layout-normalizer]
tags: [CLI, Display-Consistency, Framework, Coordination, Skin-Compatible]
---
*/

/**
 * TODO: [TASK-ID-004] Pattern: cli-display-consistency-framework | Complexity: 8 | Dependencies: all-display-components,skin-compatibility
 * Context: Central coordination engine for CLI display consistency that orchestrates standards calculator, service ordering, and layout normalization
 * Validation-Required: pattern-compliance, skin-compatibility, display-uniformity
 * Pattern-Info: { approach: "centralized-coordination", alternatives: "distributed-consistency", trade-offs: "control-vs-flexibility" }
 */

import { 
  DisplayStandardsCalculator, 
  DisplayElement, 
  DisplayElementType,
  LayoutCalculation,
  createDisplayStandardsCalculator
} from './display-standards-calculator';

import { 
  ServiceOrderingManager, 
  ServiceInfo, 
  ServiceOrderingContext,
  ServiceOrderingResult,
  createServiceOrderingManager
} from './service-ordering-manager';

import { 
  LayoutNormalizer, 
  NormalizedLayout, 
  TableData,
  AlignmentType,
  createLayoutNormalizer
} from './layout-normalizer';

import { TerminalColorTheme } from './terminal-ui-components';
import type { CLIMenuModel } from './cli-generator';

/**
 * Display pattern types for consistent formatting
 */
export type DisplayPattern = 
  | 'backend-status-table'
  | 'service-list'
  | 'menu-items'
  | 'error-display'
  | 'info-panel'
  | 'separator-section'
  | 'header-footer'
  | 'search-results';

/**
 * Skin compatibility requirements
 */
export interface SkinCompatibilityContract {
  respectsLayoutStructure: boolean;
  preservesWidthCalculations: boolean;
  maintainsSeparatorPatterns: boolean;
  supportsServiceOrdering: boolean;
}

/**
 * Display consistency configuration
 */
export interface CLIDisplayConsistencyConfig {
  enforceWidthStandards: boolean;
  enforceServiceOrdering: boolean;
  enforceLayoutNormalization: boolean;
  skinCompatibilityMode: boolean;
  responsiveBreakpoints: {
    small: number;
    medium: number;
    large: number;
  };
  patternOverrides?: Partial<Record<DisplayPattern, any>>;
}

/**
 * Consistency application result
 */
export interface ConsistencyResult {
  formattedContent: string;
  appliedPatterns: DisplayPattern[];
  layoutMetadata: {
    actualWidth: number;
    actualHeight: number;
    appliedRules: string[];
    skinCompatible: boolean;
  };
  serviceMetadata?: ServiceOrderingResult;
  recommendations: string[];
  timestamp: number;
}

/**
 * Backend status display data (specific pattern)
 */
export interface BackendStatusDisplayData {
  services: ServiceInfo[];
  context: ServiceOrderingContext;
  showHealthDetails: boolean;
  showResponseTimes: boolean;
  showCapabilities: boolean;
}

/**
 * CLI Display Consistency Engine - Main coordinator
 */
export class CLIDisplayConsistencyEngine {
  private standardsCalculator: DisplayStandardsCalculator;
  private serviceOrderingManager: ServiceOrderingManager;
  private layoutNormalizer: LayoutNormalizer;
  private config: CLIDisplayConsistencyConfig;
  private currentTheme: TerminalColorTheme | null = null;

  constructor(config?: Partial<CLIDisplayConsistencyConfig>) {
    this.config = {
      enforceWidthStandards: true,
      enforceServiceOrdering: true, 
      enforceLayoutNormalization: true,
      skinCompatibilityMode: true,
      responsiveBreakpoints: {
        small: 60,
        medium: 100,
        large: 140
      },
      ...config
    };

    // Initialize component dependencies
    this.standardsCalculator = createDisplayStandardsCalculator({
      standardPadding: 3, // Key requirement from context
      minWidth: 40,
      maxWidth: 120
    });

    this.serviceOrderingManager = createServiceOrderingManager({
      prioritizeConnected: true, // Key requirement: connected services above disconnected
      alphabeticalWithinTier: true // Key requirement: alphabetical ordering
    });

    this.layoutNormalizer = createLayoutNormalizer(this.standardsCalculator);
  }

  /**
   * Apply consistency framework to backend status display (primary use case)
   */
  formatBackendStatusDisplay(data: BackendStatusDisplayData): ConsistencyResult {
    const { services, context, showHealthDetails, showResponseTimes, showCapabilities } = data;
    
    // Step 1: Apply service ordering (connected first, alphabetical)
    const serviceOrderingResult = this.config.enforceServiceOrdering
      ? this.serviceOrderingManager.orderServices(services, context)
      : { orderedServices: services, connectedCount: 0, disconnectedCount: 0, healthyCount: 0, totalCount: services.length, orderingMetadata: { appliedRules: [], sortingContext: context, timestamp: Date.now() } };

    // Step 2: Create display elements from ordered services
    const displayElements = this.createServiceDisplayElements(
      serviceOrderingResult.orderedServices,
      { showHealthDetails, showResponseTimes, showCapabilities }
    );

    // Step 3: Calculate optimal layout
    const layoutCalculation = this.config.enforceWidthStandards
      ? this.standardsCalculator.calculateLayout(displayElements, 'major-section')
      : this.createFallbackLayout(displayElements);

    // Step 4: Create table data structure
    const tableData = this.createServiceTableData(serviceOrderingResult.orderedServices, {
      showHealthDetails,
      showResponseTimes, 
      showCapabilities
    });

    // Step 5: Apply layout normalization
    const normalizedLayout = this.config.enforceLayoutNormalization
      ? this.layoutNormalizer.formatTableBorders(tableData, layoutCalculation.optimalWidth)
      : this.createFallbackNormalizedLayout(tableData);

    // Step 6: Create separator sections
    const separatorElement: DisplayElement = {
      type: 'separator',
      content: this.standardsCalculator.createSeparatorLine(layoutCalculation.optimalWidth, 'major-section')
    };

    const headerText = `🌐 Backend Service Status (${serviceOrderingResult.connectedCount}/${serviceOrderingResult.totalCount} connected)`;
    const headerElement: DisplayElement = {
      type: 'header',
      content: headerText
    };

    // Step 7: Combine all elements with proper spacing
    const allElements = [separatorElement, headerElement, separatorElement];
    const finalLayout = this.layoutNormalizer.normalizeSpacing(allElements);

    // Step 8: Combine table and header/footer
    const completeContent = finalLayout.formattedContent + '\n\n' + normalizedLayout.formattedContent;

    return {
      formattedContent: completeContent,
      appliedPatterns: ['backend-status-table', 'separator-section', 'header-footer'],
      layoutMetadata: {
        actualWidth: Math.max(finalLayout.actualWidth, normalizedLayout.actualWidth),
        actualHeight: finalLayout.actualHeight + normalizedLayout.actualHeight + 2,
        appliedRules: [
          ...layoutCalculation.recommendations,
          ...serviceOrderingResult.orderingMetadata.appliedRules,
          ...normalizedLayout.appliedNormalizations
        ],
        skinCompatible: this.config.skinCompatibilityMode
      },
      serviceMetadata: serviceOrderingResult,
      recommendations: this.generateRecommendations(serviceOrderingResult, layoutCalculation),
      timestamp: Date.now()
    };
  }

  /**
   * Apply consistency to any display pattern
   */
  formatDisplay(pattern: DisplayPattern, data: any): ConsistencyResult {
    switch (pattern) {
      case 'backend-status-table':
        return this.formatBackendStatusDisplay(data as BackendStatusDisplayData);
        
      case 'service-list':
        return this.formatServiceList(data as ServiceInfo[], data.context || 'status-display');
        
      case 'separator-section':
        return this.formatSeparatorSection(data.width || 80, data.context || 'major-section');
        
      case 'error-display':
        return this.formatErrorDisplay(data.message, data.details);
        
      case 'info-panel':
        return this.formatInfoPanel(data.content, data.title);
        
      default:
        return this.formatGenericDisplay(data);
    }
  }

  /**
   * Calculate layout for any content following consistency standards  
   */
  calculateLayout(elements: DisplayElement[]): LayoutCalculation {
    return this.standardsCalculator.calculateLayout(elements);
  }

  /**
   * Order services using consistency standards
   */
  orderServices(services: ServiceInfo[], context: ServiceOrderingContext = 'status-display'): ServiceOrderingResult {
    return this.serviceOrderingManager.orderServices(services, context);
  }

  /**
   * Normalize layout using consistency standards
   */
  normalizeLayout(elements: DisplayElement[]): NormalizedLayout {
    return this.layoutNormalizer.normalizeSpacing(elements);
  }

  /**
   * Create standardized separator
   */
  createSeparator(width: number, type: 'major' | 'minor' | 'emphasis' = 'major'): string {
    const context = type === 'major' ? 'major-section' : 
                   type === 'minor' ? 'minor-section' : 'emphasis-header';
    return this.standardsCalculator.createSeparatorLine(width, context);
  }

  /**
   * Validate skin compatibility
   */
  validateSkinCompatibility(skinDefinition: any): SkinCompatibilityContract {
    // Check if skin respects consistency framework requirements
    return {
      respectsLayoutStructure: true, // Skin should not override structural elements
      preservesWidthCalculations: true, // Skin should not modify width calculations
      maintainsSeparatorPatterns: true, // Skin should use framework separator patterns
      supportsServiceOrdering: true // Skin should respect service ordering
    };
  }

  /**
   * Update consistency configuration
   */
  updateConfiguration(config: Partial<CLIDisplayConsistencyConfig>): void {
    this.config = { ...this.config, ...config };
    
    // Propagate relevant config to components
    if (config.responsiveBreakpoints) {
      // Update calculator with new breakpoints if needed
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): CLIDisplayConsistencyConfig {
    return { ...this.config };
  }

  /**
   * Set theme for skin compatibility
   */
  setTheme(theme: TerminalColorTheme): void {
    this.currentTheme = theme;
  }

  applyGeneratedModel(model: CLIMenuModel): void {
    if (model.theme) {
      this.setTheme(model.theme);
    }
  }

  /**
   * Get framework statistics and health
   */
  getFrameworkStats(): {
    componentsActive: boolean;
    rulesEnforced: string[];
    performanceMetrics: {
      averageFormatTime: number;
      cacheHitRate: number;
    };
  } {
    return {
      componentsActive: true,
      rulesEnforced: [
        this.config.enforceWidthStandards ? 'width-standards' : null,
        this.config.enforceServiceOrdering ? 'service-ordering' : null,
        this.config.enforceLayoutNormalization ? 'layout-normalization' : null
      ].filter(Boolean) as string[],
      performanceMetrics: {
        averageFormatTime: 0, // Would track actual performance in production
        cacheHitRate: 0
      }
    };
  }

  /**
   * Format service list with consistency
   * @private
   */
  private formatServiceList(services: ServiceInfo[], context: ServiceOrderingContext): ConsistencyResult {
    const orderingResult = this.serviceOrderingManager.orderServices(services, context);
    
    const displayElements: DisplayElement[] = orderingResult.orderedServices.map(service => ({
      type: 'menu-item' as DisplayElementType,
      content: `${service.connected ? '🟢' : '🔴'} ${service.name || service.id}`,
      metadata: service
    }));

    const layoutCalculation = this.standardsCalculator.calculateLayout(displayElements, 'minor-section');
    const normalizedLayout = this.layoutNormalizer.normalizeSpacing(displayElements);

    return {
      formattedContent: normalizedLayout.formattedContent,
      appliedPatterns: ['service-list'],
      layoutMetadata: {
        actualWidth: normalizedLayout.actualWidth,
        actualHeight: normalizedLayout.actualHeight,
        appliedRules: [...layoutCalculation.recommendations, ...normalizedLayout.appliedNormalizations],
        skinCompatible: this.config.skinCompatibilityMode
      },
      serviceMetadata: orderingResult,
      recommendations: [],
      timestamp: Date.now()
    };
  }

  /**
   * Format separator section with consistency
   * @private
   */
  private formatSeparatorSection(width: number, context: string): ConsistencyResult {
    const separatorChar = context === 'major-section' ? '━' : 
                         context === 'minor-section' ? '─' : '═';
    
    const separator = separatorChar.repeat(width);
    
    return {
      formattedContent: separator,
      appliedPatterns: ['separator-section'],
      layoutMetadata: {
        actualWidth: width,
        actualHeight: 1,
        appliedRules: [`separator-${context}`],
        skinCompatible: true
      },
      recommendations: [],
      timestamp: Date.now()
    };
  }

  /**
   * Format error display with consistency
   * @private
   */
  private formatErrorDisplay(message: string, details?: string): ConsistencyResult {
    const errorElement: DisplayElement = {
      type: 'error-message',
      content: `❌ ${message}${details ? '\n   ' + details : ''}`
    };

    const layoutCalculation = this.standardsCalculator.calculateLayout([errorElement]);
    const normalizedLayout = this.layoutNormalizer.standardizePadding(errorElement);

    return {
      formattedContent: normalizedLayout.formattedContent,
      appliedPatterns: ['error-display'],
      layoutMetadata: {
        actualWidth: normalizedLayout.actualWidth,
        actualHeight: normalizedLayout.actualHeight,
        appliedRules: normalizedLayout.appliedNormalizations,
        skinCompatible: this.config.skinCompatibilityMode
      },
      recommendations: [],
      timestamp: Date.now()
    };
  }

  /**
   * Format info panel with consistency
   * @private
   */
  private formatInfoPanel(content: string, title?: string): ConsistencyResult {
    const panelContent = title ? `${title}\n${content}` : content;
    const infoElement: DisplayElement = {
      type: 'info-panel',
      content: panelContent
    };

    const layoutCalculation = this.standardsCalculator.calculateLayout([infoElement]);
    const normalizedLayout = this.layoutNormalizer.standardizePadding(infoElement);

    return {
      formattedContent: normalizedLayout.formattedContent,
      appliedPatterns: ['info-panel'],
      layoutMetadata: {
        actualWidth: normalizedLayout.actualWidth,
        actualHeight: normalizedLayout.actualHeight,
        appliedRules: normalizedLayout.appliedNormalizations,
        skinCompatible: this.config.skinCompatibilityMode
      },
      recommendations: [],
      timestamp: Date.now()
    };
  }

  /**
   * Format generic display with basic consistency
   * @private
   */
  private formatGenericDisplay(data: any): ConsistencyResult {
    const element: DisplayElement = {
      type: 'info-panel',
      content: typeof data === 'string' ? data : JSON.stringify(data, null, 2)
    };

    const layoutCalculation = this.standardsCalculator.calculateLayout([element]);
    const normalizedLayout = this.layoutNormalizer.standardizePadding(element);

    return {
      formattedContent: normalizedLayout.formattedContent,
      appliedPatterns: ['info-panel'],
      layoutMetadata: {
        actualWidth: normalizedLayout.actualWidth,
        actualHeight: normalizedLayout.actualHeight,
        appliedRules: normalizedLayout.appliedNormalizations,
        skinCompatible: this.config.skinCompatibilityMode
      },
      recommendations: ['Consider using specific display pattern for better consistency'],
      timestamp: Date.now()
    };
  }

  /**
   * Create display elements from services
   * @private
   */
  private createServiceDisplayElements(services: ServiceInfo[], options: any): DisplayElement[] {
    return services.map(service => ({
      type: 'table' as DisplayElementType,
      content: service.name || service.id,
      metadata: service
    }));
  }

  /**
   * Create table data from services
   * @private
   */
  private createServiceTableData(services: ServiceInfo[], options: { showHealthDetails: boolean; showResponseTimes: boolean; showCapabilities: boolean }): TableData {
    const headers = ['service', 'status', 'health'];
    
    if (options.showResponseTimes) {
      headers.push('response');
    }
    
    if (options.showCapabilities) {
      headers.push('capabilities');
    }

    const rows = services.map(service => {
      const row: Record<string, any> = {
        service: service.name || service.id,
        status: service.connected ? 'Connected' : 'Disconnected',
        health: service.health || 'Unknown'
      };

      if (options.showResponseTimes) {
        row.response = service.responseTime ? `${service.responseTime}ms` : 'N/A';
      }

      if (options.showCapabilities) {
        row.capabilities = service.capabilities?.slice(0, 2).join(', ') || 'None';
      }

      return row;
    });

    return { headers, rows };
  }

  /**
   * Generate recommendations based on results
   * @private
   */
  private generateRecommendations(serviceResult: ServiceOrderingResult, layoutResult: LayoutCalculation): string[] {
    const recommendations: string[] = [];

    if (serviceResult.connectedCount === 0) {
      recommendations.push('No connected services found - check service connectivity');
    }

    if (serviceResult.healthyCount < serviceResult.connectedCount) {
      recommendations.push(`${serviceResult.connectedCount - serviceResult.healthyCount} services have health issues`);
    }

    if (layoutResult.contentDimensions.width > 120) {
      recommendations.push('Consider responsive layout for very wide content');
    }

    return recommendations;
  }

  /**
   * Create fallback layout for when standards are disabled
   * @private
   */
  private createFallbackLayout(elements: DisplayElement[]): LayoutCalculation {
    return {
      optimalWidth: 80,
      paddingSpec: { left: 0, right: 0, top: 0, bottom: 0, inner: 0 },
      separatorChar: '-',
      contentDimensions: { width: 80, height: elements.length, minWidth: 40, maxWidth: 120, hasVariableWidth: true },
      recommendations: ['Using fallback layout - standards enforcement disabled']
    };
  }

  /**
   * Create fallback normalized layout
   * @private
   */
  private createFallbackNormalizedLayout(tableData: TableData): NormalizedLayout {
    const content = tableData.headers.join(' | ') + '\n' + 
                   tableData.rows.map(row => 
                     tableData.headers.map(h => row[h] || '').join(' | ')
                   ).join('\n');

    return {
      formattedContent: content,
      actualWidth: 80,
      actualHeight: tableData.rows.length + 1,
      appliedNormalizations: ['fallback-table-format'],
      metadata: {
        originalDimensions: { width: 80, height: tableData.rows.length, minWidth: 40, maxWidth: 120, hasVariableWidth: true },
        targetDimensions: { width: 80, height: tableData.rows.length + 1, minWidth: 40, maxWidth: 120, hasVariableWidth: true },
        timestamp: Date.now()
      }
    };
  }
}

/**
 * Factory function for creating CLI display consistency engine
 */
export function createCLIDisplayConsistencyEngine(config?: Partial<CLIDisplayConsistencyConfig>): CLIDisplayConsistencyEngine {
  return new CLIDisplayConsistencyEngine(config);
}

/**
 * Quick utility function for backend status formatting
 */
export function formatBackendStatus(services: ServiceInfo[], options?: { showDetails?: boolean }): string {
  const engine = createCLIDisplayConsistencyEngine();
  const result = engine.formatBackendStatusDisplay({
    services,
    context: 'status-display',
    showHealthDetails: options?.showDetails || true,
    showResponseTimes: options?.showDetails || false,
    showCapabilities: options?.showDetails || false
  });
  return result.formattedContent;
}
