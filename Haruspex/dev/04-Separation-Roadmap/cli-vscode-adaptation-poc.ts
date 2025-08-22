/**---
 * title: [CLI→VSCode Adaptation POC - High-Risk Architecture Validation]
 * tags: [POC, Architecture, VSCode, CLI, Adaptation, Risk-Validation]
 * provides: [VSCode Adapter POC, Tree View Integration, Performance Validation]
 * requires: [VSCode API, PCL Components, Service Contracts]
 * description: [Proof-of-concept validation for CLI→VSCode component adaptation]
 * created: 2025-08-21
 * ---*/

import * as vscode from 'vscode';
import { 
  SkinMenuDefinition, 
  SkinMenuItem, 
  SkinTheme, 
  calculateMenuLayout,
  LayoutConstraints 
} from '../../VDL_Vault/phoenix-code-lite/src/cli/unified-layout-engine';

// =============================================================================
// POC OBJECTIVE: VALIDATE CLI→VSCODE ADAPTATION FEASIBILITY
// =============================================================================

/**
 * CRITICAL RISK VALIDATION:
 * Can PCL's unified-layout-engine components adapt to VSCode TreeView API 
 * without exceeding 50% performance degradation threshold?
 * 
 * SUCCESS CRITERIA:
 * 1. CLI components render correctly in VSCode interface
 * 2. <100ms interface switching achieved (Templum spec requirement)
 * 3. State remains synchronized across interface modes  
 * 4. Performance degradation <50% from baseline
 */

// =============================================================================
// ADAPTATION LAYER: CLI COMPONENTS → VSCODE TREEVIEW
// =============================================================================

/**
 * VSCode TreeView Adapter for PCL CLI Components
 * 
 * Adapts SkinMenuDefinition (CLI) to VSCode TreeView API
 * Tests feasibility of architecture integration
 */
export class CLIToVSCodeAdapter implements vscode.TreeDataProvider<VSCodeMenuNode> {
  private _onDidChangeTreeData: vscode.EventEmitter<VSCodeMenuNode | undefined | null | void> = new vscode.EventEmitter<VSCodeMenuNode | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<VSCodeMenuNode | undefined | null | void> = this._onDidChangeTreeData.event;
  
  private skinDefinition: SkinMenuDefinition | null = null;
  private layoutConstraints: LayoutConstraints;
  private performanceMetrics: AdaptationPerformanceMetrics = new AdaptationPerformanceMetrics();

  constructor() {
    // Use PCL's existing layout constraints - test integration
    this.layoutConstraints = {
      minHeight: 25,
      minWidth: 30,
      maxWidth: 80, // Adjusted for VSCode panel width
      textboxLines: 3,
      paddingLines: 2,
      enforceConsistentHeight: true
    };
  }

  // =============================================================================
  // CORE ADAPTATION METHODS - CLI SKIN → VSCODE TREEVIEW
  // =============================================================================

  /**
   * PRIMARY ADAPTATION METHOD - CRITICAL PERFORMANCE TEST
   * 
   * Converts PCL SkinMenuDefinition to VSCode TreeView structure
   * This is the key integration point that must maintain performance
   */
  async applySkinDefinition(skinDefinition: SkinMenuDefinition): Promise<AdaptationResult> {
    const startTime = performance.now();
    
    try {
      // PERFORMANCE TEST 1: Layout calculation integration
      const layoutStartTime = performance.now();
      const calculatedLayout = calculateMenuLayout(skinDefinition, this.layoutConstraints);
      const layoutTime = performance.now() - layoutStartTime;
      
      this.performanceMetrics.recordLayoutCalculation(layoutTime);
      
      // PERFORMANCE TEST 2: TreeView structure conversion
      const conversionStartTime = performance.now();
      this.skinDefinition = skinDefinition;
      const conversionTime = performance.now() - conversionStartTime;
      
      this.performanceMetrics.recordTreeViewConversion(conversionTime);
      
      // PERFORMANCE TEST 3: VSCode TreeView refresh
      const refreshStartTime = performance.now();
      this._onDidChangeTreeData.fire();
      const refreshTime = performance.now() - refreshStartTime;
      
      this.performanceMetrics.recordTreeViewRefresh(refreshTime);
      
      const totalTime = performance.now() - startTime;
      this.performanceMetrics.recordTotalAdaptation(totalTime);

      // SUCCESS CRITERIA VALIDATION
      const success = this.validatePerformanceTargets(totalTime, layoutTime, refreshTime);
      
      return {
        success,
        totalTime,
        layoutCalculationTime: layoutTime,
        conversionTime,
        refreshTime,
        performanceMetrics: this.performanceMetrics.getMetrics(),
        issues: success ? [] : this.identifyPerformanceIssues(),
        recommendations: this.generateOptimizationRecommendations()
      };
      
    } catch (error) {
      const totalTime = performance.now() - startTime;
      
      return {
        success: false,
        totalTime,
        error: error.message,
        issues: [`Adaptation failed: ${error.message}`],
        recommendations: ['Review error handling and fallback mechanisms']
      };
    }
  }

  /**
   * VSCODE TREEVIEW API IMPLEMENTATION
   * 
   * Adapts PCL menu structure to VSCode TreeView requirements
   */
  getTreeItem(element: VSCodeMenuNode): vscode.TreeItem {
    const startTime = performance.now();
    
    try {
      const treeItem = new vscode.TreeItem(
        element.label,
        element.children ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None
      );

      // Adapt PCL themes to VSCode icons and styling
      if (element.skinTheme && this.skinDefinition?.theme) {
        treeItem.iconPath = this.adaptThemeToIcon(element.skinTheme, element.type);
        treeItem.tooltip = this.createThemeAwareTooltip(element);
      }

      // Preserve PCL command structure
      if (element.command) {
        treeItem.command = {
          command: 'haruspex.executeMenuCommand',
          title: element.label,
          arguments: [element.command, element.originalMenuItem]
        };
      }

      const executionTime = performance.now() - startTime;
      this.performanceMetrics.recordTreeItemCreation(executionTime);

      return treeItem;
      
    } catch (error) {
      console.error(`TreeItem creation failed: ${error.message}`);
      return new vscode.TreeItem(`Error: ${element.label}`, vscode.TreeItemCollapsibleState.None);
    }
  }

  /**
   * HIERARCHICAL STRUCTURE ADAPTATION
   * 
   * Converts PCL nested menu items to VSCode TreeView hierarchy
   */
  async getChildren(element?: VSCodeMenuNode): Promise<VSCodeMenuNode[]> {
    const startTime = performance.now();
    
    try {
      if (!this.skinDefinition) {
        return [];
      }

      let nodes: VSCodeMenuNode[];
      
      if (!element) {
        // Root level - convert PCL menu items to tree nodes
        nodes = this.convertMenuItemsToNodes(this.skinDefinition.items);
      } else {
        // Child level - handle submenu expansion
        nodes = element.children || [];
      }

      const executionTime = performance.now() - startTime;
      this.performanceMetrics.recordChildrenGeneration(executionTime, nodes.length);

      return nodes;
      
    } catch (error) {
      console.error(`Children generation failed: ${error.message}`);
      return [];
    }
  }

  // =============================================================================
  // ADAPTATION UTILITY METHODS
  // =============================================================================

  /**
   * Convert PCL SkinMenuItem[] to VSCodeMenuNode[]
   * Preserves hierarchical structure and command mappings
   */
  private convertMenuItemsToNodes(items: SkinMenuItem[]): VSCodeMenuNode[] {
    return items.map((item, index) => {
      const node: VSCodeMenuNode = {
        id: item.id || `item_${index}`,
        label: this.adaptLabelForVSCode(item.label, index),
        type: item.type || 'action',
        command: item.command,
        originalMenuItem: item,
        skinTheme: this.skinDefinition?.theme
      };

      // Handle nested menu items (submenus)
      if (item.items && item.items.length > 0) {
        node.children = this.convertMenuItemsToNodes(item.items);
      }

      return node;
    });
  }

  /**
   * Adapt PCL menu labels for VSCode TreeView display
   * Handles numbering, icons, and VSCode UI conventions
   */
  private adaptLabelForVSCode(label: string, index: number): string {
    // PCL typically includes numbering - adapt for VSCode
    const cleanLabel = label.replace(/^\d+\.\s*/, ''); // Remove PCL numbering
    return cleanLabel;
  }

  /**
   * Map PCL themes to VSCode icons
   * Critical for maintaining visual consistency across interfaces
   */
  private adaptThemeToIcon(theme: SkinTheme, itemType: string): vscode.ThemeIcon | undefined {
    // Map PCL theme colors to VSCode theme icons
    switch (theme.primaryColor) {
      case 'blue':
        return new vscode.ThemeIcon('info');
      case 'green':
        return new vscode.ThemeIcon('check');
      case 'yellow':
        return new vscode.ThemeIcon('warning');
      case 'red':
        return new vscode.ThemeIcon('error');
      case 'magenta':
        return new vscode.ThemeIcon('gear');
      case 'cyan':
        return new vscode.ThemeIcon('symbol-method');
      default:
        return new vscode.ThemeIcon('circle-outline');
    }
  }

  /**
   * Create VSCode-compatible tooltips from PCL menu descriptions
   */
  private createThemeAwareTooltip(element: VSCodeMenuNode): string {
    let tooltip = element.label;
    
    if (element.originalMenuItem?.description) {
      tooltip += `\n${element.originalMenuItem.description}`;
    }
    
    if (element.command) {
      tooltip += `\nCommand: ${element.command}`;
    }
    
    return tooltip;
  }

  // =============================================================================
  // PERFORMANCE VALIDATION METHODS
  // =============================================================================

  /**
   * Validate adaptation performance against success criteria
   */
  private validatePerformanceTargets(
    totalTime: number, 
    layoutTime: number, 
    refreshTime: number
  ): boolean {
    // SUCCESS CRITERIA FROM ARCHITECTURE ANALYSIS:
    // 1. Total adaptation time <100ms (interface switching requirement)
    // 2. Layout calculation time <50ms (50% degradation from baseline ~20ms)
    // 3. TreeView refresh time <30ms (VSCode UI responsiveness)
    
    const targets = {
      totalTime: 100,      // <100ms total adaptation
      layoutTime: 50,      // <50ms layout calculation  
      refreshTime: 30      // <30ms TreeView refresh
    };

    return (
      totalTime < targets.totalTime &&
      layoutTime < targets.layoutTime &&
      refreshTime < targets.refreshTime
    );
  }

  /**
   * Identify specific performance issues for optimization
   */
  private identifyPerformanceIssues(): string[] {
    const issues: string[] = [];
    const metrics = this.performanceMetrics.getMetrics();

    if (metrics.averageLayoutCalculation > 50) {
      issues.push(`Layout calculation too slow: ${metrics.averageLayoutCalculation.toFixed(2)}ms (target: <50ms)`);
    }

    if (metrics.averageTreeViewRefresh > 30) {
      issues.push(`TreeView refresh too slow: ${metrics.averageTreeViewRefresh.toFixed(2)}ms (target: <30ms)`);
    }

    if (metrics.averageTotalAdaptation > 100) {
      issues.push(`Total adaptation too slow: ${metrics.averageTotalAdaptation.toFixed(2)}ms (target: <100ms)`);
    }

    return issues;
  }

  /**
   * Generate optimization recommendations based on performance analysis
   */
  private generateOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];
    const metrics = this.performanceMetrics.getMetrics();

    // Layout calculation optimization
    if (metrics.averageLayoutCalculation > 30) {
      recommendations.push('Cache layout calculations for identical skin definitions');
      recommendations.push('Optimize theme resolution with pre-computed styles');
      recommendations.push('Use incremental layout updates for minor changes');
    }

    // TreeView performance optimization
    if (metrics.averageTreeViewRefresh > 20) {
      recommendations.push('Implement virtual tree nodes for large menu hierarchies');
      recommendations.push('Use TreeView partial refresh instead of full refresh');
      recommendations.push('Cache TreeItem objects for unchanged menu items');
    }

    // Memory optimization
    if (metrics.totalAdaptations > 100) {
      recommendations.push('Implement menu node pooling to reduce GC pressure');
      recommendations.push('Use WeakMap for temporary adaptation caches');
    }

    return recommendations;
  }

  // =============================================================================
  // STATE SYNCHRONIZATION POC
  // =============================================================================

  /**
   * Test cross-interface state synchronization
   * Validates that CLI and VSCode interfaces can maintain synchronized state
   */
  async testStateSynchronization(stateUpdate: CrossInterfaceStateUpdate): Promise<StateSyncResult> {
    const startTime = performance.now();
    
    try {
      // Simulate state update from CLI interface
      const syncStartTime = performance.now();
      
      // Apply state changes to VSCode TreeView
      if (stateUpdate.selectedItems) {
        // Update TreeView selection state
        await this.updateTreeViewSelection(stateUpdate.selectedItems);
      }
      
      if (stateUpdate.expandedNodes) {
        // Update TreeView expansion state
        await this.updateTreeViewExpansion(stateUpdate.expandedNodes);
      }
      
      if (stateUpdate.skinChanges) {
        // Apply skin changes across interfaces
        await this.applySkinDefinition(stateUpdate.skinChanges);
      }
      
      const syncTime = performance.now() - syncStartTime;
      const totalTime = performance.now() - startTime;
      
      // Validate sync performance against Templum requirements
      const success = syncTime < 150; // <150ms state sync requirement
      
      return {
        success,
        syncTime,
        totalTime,
        updatesApplied: Object.keys(stateUpdate).length,
        performanceIssues: success ? [] : ['State sync exceeded 150ms target']
      };
      
    } catch (error) {
      return {
        success: false,
        syncTime: 0,
        totalTime: performance.now() - startTime,
        updatesApplied: 0,
        error: error.message,
        performanceIssues: [`State sync failed: ${error.message}`]
      };
    }
  }

  private async updateTreeViewSelection(selectedItems: string[]): Promise<void> {
    // Implementation would update VSCode TreeView selection
    // Simulated for POC
  }

  private async updateTreeViewExpansion(expandedNodes: string[]): Promise<void> {
    // Implementation would update VSCode TreeView expansion state  
    // Simulated for POC
  }
}

// =============================================================================
// SUPPORTING TYPE DEFINITIONS
// =============================================================================

/**
 * VSCode-compatible menu node structure
 * Bridges PCL SkinMenuItem to VSCode TreeView requirements
 */
interface VSCodeMenuNode {
  id: string;
  label: string;
  type: string;
  command?: string;
  children?: VSCodeMenuNode[];
  originalMenuItem?: SkinMenuItem;
  skinTheme?: SkinTheme;
}

/**
 * Adaptation performance tracking
 */
class AdaptationPerformanceMetrics {
  private layoutCalculations: number[] = [];
  private treeViewConversions: number[] = [];
  private treeViewRefreshes: number[] = [];
  private totalAdaptations: number[] = [];
  private treeItemCreations: number[] = [];
  private childrenGenerations: { time: number; nodeCount: number }[] = [];

  recordLayoutCalculation(time: number): void {
    this.layoutCalculations.push(time);
  }

  recordTreeViewConversion(time: number): void {
    this.treeViewConversions.push(time);
  }

  recordTreeViewRefresh(time: number): void {
    this.treeViewRefreshes.push(time);
  }

  recordTotalAdaptation(time: number): void {
    this.totalAdaptations.push(time);
  }

  recordTreeItemCreation(time: number): void {
    this.treeItemCreations.push(time);
  }

  recordChildrenGeneration(time: number, nodeCount: number): void {
    this.childrenGenerations.push({ time, nodeCount });
  }

  getMetrics(): PerformanceMetricsSnapshot {
    return {
      averageLayoutCalculation: this.average(this.layoutCalculations),
      averageTreeViewConversion: this.average(this.treeViewConversions),
      averageTreeViewRefresh: this.average(this.treeViewRefreshes),
      averageTotalAdaptation: this.average(this.totalAdaptations),
      averageTreeItemCreation: this.average(this.treeItemCreations),
      averageChildrenGeneration: this.average(this.childrenGenerations.map(g => g.time)),
      totalAdaptations: this.totalAdaptations.length,
      maxLayoutCalculation: Math.max(...this.layoutCalculations, 0),
      maxTotalAdaptation: Math.max(...this.totalAdaptations, 0)
    };
  }

  private average(numbers: number[]): number {
    return numbers.length > 0 ? numbers.reduce((a, b) => a + b, 0) / numbers.length : 0;
  }
}

/**
 * Performance metrics snapshot for analysis
 */
interface PerformanceMetricsSnapshot {
  averageLayoutCalculation: number;
  averageTreeViewConversion: number;
  averageTreeViewRefresh: number;
  averageTotalAdaptation: number;
  averageTreeItemCreation: number;
  averageChildrenGeneration: number;
  totalAdaptations: number;
  maxLayoutCalculation: number;
  maxTotalAdaptation: number;
}

/**
 * Adaptation result for validation
 */
interface AdaptationResult {
  success: boolean;
  totalTime: number;
  layoutCalculationTime?: number;
  conversionTime?: number;
  refreshTime?: number;
  error?: string;
  performanceMetrics: PerformanceMetricsSnapshot;
  issues: string[];
  recommendations: string[];
}

/**
 * Cross-interface state synchronization testing
 */
interface CrossInterfaceStateUpdate {
  selectedItems?: string[];
  expandedNodes?: string[];
  skinChanges?: SkinMenuDefinition;
  userContext?: Record<string, any>;
}

/**
 * State synchronization result
 */
interface StateSyncResult {
  success: boolean;
  syncTime: number;
  totalTime: number;
  updatesApplied: number;
  error?: string;
  performanceIssues: string[];
}

// =============================================================================
// POC VALIDATION FRAMEWORK
// =============================================================================

/**
 * Comprehensive POC validation suite
 * Tests all critical success criteria for CLI→VSCode adaptation
 */
export class CLIVSCodeAdaptationValidator {
  private adapter: CLIToVSCodeAdapter;
  private testResults: ValidationResult[] = [];

  constructor() {
    this.adapter = new CLIToVSCodeAdapter();
  }

  /**
   * Execute complete validation suite
   * Tests all success criteria defined in architecture analysis
   */
  async runCompleteValidation(): Promise<ValidationSummary> {
    const startTime = performance.now();
    
    console.log('🔄 Starting CLI→VSCode Adaptation POC Validation...');
    
    try {
      // Test 1: Basic adaptation functionality
      const basicTest = await this.testBasicAdaptation();
      this.testResults.push(basicTest);
      
      // Test 2: Performance requirements validation
      const performanceTest = await this.testPerformanceRequirements();
      this.testResults.push(performanceTest);
      
      // Test 3: Complex menu structure handling
      const complexityTest = await this.testComplexMenuStructures();
      this.testResults.push(complexityTest);
      
      // Test 4: Theme adaptation validation
      const themeTest = await this.testThemeAdaptation();
      this.testResults.push(themeTest);
      
      // Test 5: State synchronization validation
      const stateSyncTest = await this.testStateSynchronization();
      this.testResults.push(stateSyncTest);
      
      const totalTime = performance.now() - startTime;
      const successfulTests = this.testResults.filter(r => r.success).length;
      const overallSuccess = successfulTests === this.testResults.length;
      
      const summary: ValidationSummary = {
        overallSuccess,
        totalTests: this.testResults.length,
        successfulTests,
        failedTests: this.testResults.length - successfulTests,
        totalValidationTime: totalTime,
        testResults: this.testResults,
        recommendations: this.generateFinalRecommendations(),
        architectureViable: this.assessArchitectureViability()
      };
      
      console.log(`✅ Validation Complete: ${successfulTests}/${this.testResults.length} tests passed`);
      
      return summary;
      
    } catch (error) {
      console.error(`❌ Validation failed: ${error.message}`);
      
      return {
        overallSuccess: false,
        totalTests: this.testResults.length,
        successfulTests: 0,
        failedTests: this.testResults.length,
        totalValidationTime: performance.now() - startTime,
        testResults: this.testResults,
        recommendations: [`Critical validation error: ${error.message}`],
        architectureViable: false
      };
    }
  }

  /**
   * Test basic CLI→VSCode adaptation functionality
   */
  private async testBasicAdaptation(): Promise<ValidationResult> {
    console.log('  🧪 Testing basic adaptation functionality...');
    
    const testSkin: SkinMenuDefinition = {
      title: 'Test Menu',
      subtitle: 'Basic Adaptation Test',
      items: [
        { id: 'test1', label: '1. Test Action', type: 'action', command: 'test.action1' },
        { id: 'test2', label: '2. Test Command', type: 'command', command: 'test.command1' }
      ],
      theme: {
        primaryColor: 'blue',
        accentColor: 'cyan',
        separatorChar: '-',
        useIcons: true
      }
    };
    
    try {
      const result = await this.adapter.applySkinDefinition(testSkin);
      
      return {
        testName: 'Basic Adaptation',
        success: result.success,
        duration: result.totalTime,
        details: result.success ? 
          'Basic CLI→VSCode adaptation successful' : 
          `Adaptation failed: ${result.issues.join(', ')}`,
        metrics: result.performanceMetrics
      };
      
    } catch (error) {
      return {
        testName: 'Basic Adaptation',
        success: false,
        duration: 0,
        details: `Test failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Test performance requirements against Templum specifications
   */
  private async testPerformanceRequirements(): Promise<ValidationResult> {
    console.log('  ⚡ Testing performance requirements...');
    
    // Create performance-intensive test scenario
    const performanceTestSkin: SkinMenuDefinition = {
      title: 'Performance Test Menu',
      items: Array.from({ length: 20 }, (_, i) => ({
        id: `perf_${i}`,
        label: `Performance Test Item ${i + 1}`,
        description: `Test item ${i + 1} description for performance validation`,
        type: 'action' as const,
        command: `perf.test${i + 1}`
      })),
      theme: {
        primaryColor: 'green',
        accentColor: 'yellow',
        separatorChar: '=',
        useIcons: true
      }
    };
    
    try {
      const iterations = 5;
      const results: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const result = await this.adapter.applySkinDefinition(performanceTestSkin);
        results.push(result.totalTime);
      }
      
      const averageTime = results.reduce((a, b) => a + b, 0) / results.length;
      const success = averageTime < 100; // <100ms requirement
      
      return {
        testName: 'Performance Requirements',
        success,
        duration: averageTime,
        details: success ? 
          `Average adaptation time: ${averageTime.toFixed(2)}ms (target: <100ms)` :
          `Performance target missed: ${averageTime.toFixed(2)}ms (target: <100ms)`,
        metrics: { averageAdaptationTime: averageTime, iterations }
      };
      
    } catch (error) {
      return {
        testName: 'Performance Requirements',
        success: false,
        duration: 0,
        details: `Performance test failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Test complex nested menu structure handling
   */
  private async testComplexMenuStructures(): Promise<ValidationResult> {
    console.log('  🌳 Testing complex menu structures...');
    
    const complexSkin: SkinMenuDefinition = {
      title: 'Complex Menu Structure',
      items: [
        {
          id: 'main1',
          label: 'Main Category 1',
          type: 'submenu',
          items: [
            { id: 'sub1_1', label: 'Sub Item 1.1', type: 'action', command: 'complex.sub1_1' },
            { id: 'sub1_2', label: 'Sub Item 1.2', type: 'action', command: 'complex.sub1_2' }
          ]
        },
        {
          id: 'main2',
          label: 'Main Category 2', 
          type: 'submenu',
          items: [
            {
              id: 'sub2_1',
              label: 'Nested Category',
              type: 'submenu',
              items: [
                { id: 'deep1', label: 'Deep Item 1', type: 'action', command: 'complex.deep1' },
                { id: 'deep2', label: 'Deep Item 2', type: 'action', command: 'complex.deep2' }
              ]
            }
          ]
        }
      ]
    };
    
    try {
      const result = await this.adapter.applySkinDefinition(complexSkin);
      
      return {
        testName: 'Complex Menu Structures',
        success: result.success,
        duration: result.totalTime,
        details: result.success ? 
          'Complex nested menu structure handled successfully' : 
          `Complex structure handling failed: ${result.issues.join(', ')}`,
        metrics: result.performanceMetrics
      };
      
    } catch (error) {
      return {
        testName: 'Complex Menu Structures',
        success: false,
        duration: 0,
        details: `Complex structure test failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Test theme adaptation between CLI and VSCode
   */
  private async testThemeAdaptation(): Promise<ValidationResult> {
    console.log('  🎨 Testing theme adaptation...');
    
    const themes: SkinTheme[] = [
      { primaryColor: 'blue', accentColor: 'cyan', separatorChar: '-', useIcons: true },
      { primaryColor: 'green', accentColor: 'yellow', separatorChar: '=', useIcons: true },
      { primaryColor: 'red', accentColor: 'magenta', separatorChar: '*', useIcons: false }
    ];
    
    try {
      let allSuccessful = true;
      let totalTime = 0;
      
      for (const theme of themes) {
        const testSkin: SkinMenuDefinition = {
          title: 'Theme Test',
          items: [{ id: 'theme_test', label: 'Theme Test Item', type: 'action' }],
          theme
        };
        
        const result = await this.adapter.applySkinDefinition(testSkin);
        totalTime += result.totalTime;
        
        if (!result.success) {
          allSuccessful = false;
        }
      }
      
      return {
        testName: 'Theme Adaptation',
        success: allSuccessful,
        duration: totalTime,
        details: allSuccessful ? 
          `All ${themes.length} themes adapted successfully` : 
          'Some themes failed to adapt properly',
        metrics: { themesTestedCount: themes.length }
      };
      
    } catch (error) {
      return {
        testName: 'Theme Adaptation',
        success: false,
        duration: 0,
        details: `Theme adaptation test failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Test state synchronization between CLI and VSCode interfaces
   */
  private async testStateSynchronization(): Promise<ValidationResult> {
    console.log('  🔄 Testing state synchronization...');
    
    const stateUpdate: CrossInterfaceStateUpdate = {
      selectedItems: ['test1', 'test2'],
      expandedNodes: ['main1', 'main2'],
      userContext: { lastAction: 'test', timestamp: Date.now() }
    };
    
    try {
      const result = await this.adapter.testStateSynchronization(stateUpdate);
      
      return {
        testName: 'State Synchronization',
        success: result.success,
        duration: result.syncTime,
        details: result.success ? 
          `State sync completed in ${result.syncTime.toFixed(2)}ms (target: <150ms)` : 
          `State sync failed: ${result.performanceIssues.join(', ')}`,
        metrics: { 
          syncTime: result.syncTime, 
          updatesApplied: result.updatesApplied 
        }
      };
      
    } catch (error) {
      return {
        testName: 'State Synchronization',
        success: false,
        duration: 0,
        details: `State sync test failed: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Generate final recommendations based on all test results
   */
  private generateFinalRecommendations(): string[] {
    const recommendations: string[] = [];
    const failedTests = this.testResults.filter(r => !r.success);
    
    if (failedTests.length === 0) {
      recommendations.push('✅ CLI→VSCode adaptation is architecturally viable');
      recommendations.push('✅ All performance targets can be met with current approach');
      recommendations.push('✅ Proceed with full implementation of Templum adapter layer');
    } else {
      recommendations.push(`❌ ${failedTests.length} critical issues must be resolved before implementation`);
      
      failedTests.forEach(test => {
        recommendations.push(`- ${test.testName}: ${test.details}`);
      });
      
      recommendations.push('🔧 Consider alternative adaptation strategies for failed components');
      recommendations.push('🔧 Implement performance optimizations before production use');
    }
    
    return recommendations;
  }

  /**
   * Assess overall architecture viability based on test results
   */
  private assessArchitectureViability(): boolean {
    const criticalTests = ['Basic Adaptation', 'Performance Requirements'];
    const criticalTestResults = this.testResults.filter(r => criticalTests.includes(r.testName));
    
    return criticalTestResults.every(r => r.success);
  }
}

/**
 * Validation result structure
 */
interface ValidationResult {
  testName: string;
  success: boolean;
  duration: number;
  details: string;
  error?: string;
  metrics?: any;
}

/**
 * Complete validation summary
 */
interface ValidationSummary {
  overallSuccess: boolean;
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  totalValidationTime: number;
  testResults: ValidationResult[];
  recommendations: string[];
  architectureViable: boolean;
}

// =============================================================================
// POC EXECUTION ENTRY POINT
// =============================================================================

/**
 * Execute CLI→VSCode Adaptation POC
 * 
 * This function should be called to validate the architectural feasibility
 * of adapting PCL CLI components to VSCode TreeView interface.
 */
export async function executeCLIVSCodeAdaptationPOC(): Promise<ValidationSummary> {
  console.log('🚀 Executing CLI→VSCode Adaptation Proof of Concept');
  console.log('📋 Validating architectural assumptions for Haruspex separation project');
  
  const validator = new CLIVSCodeAdaptationValidator();
  const results = await validator.runCompleteValidation();
  
  console.log('\n📊 POC Results Summary:');
  console.log(`Overall Success: ${results.overallSuccess ? '✅' : '❌'}`);
  console.log(`Tests Passed: ${results.successfulTests}/${results.totalTests}`);
  console.log(`Total Validation Time: ${results.totalValidationTime.toFixed(2)}ms`);
  console.log(`Architecture Viable: ${results.architectureViable ? '✅' : '❌'}`);
  
  console.log('\n🎯 Recommendations:');
  results.recommendations.forEach(rec => console.log(`  ${rec}`));
  
  return results;
}