/**---
 * title: [Skin Provider - Dynamic UI Definition Generator for Templum Integration]
 * tags: [Skin-Provider, UI-Generation, Templum-Integration, Dynamic-Interface]
 * provides: [Skin-Definition-Generation, UI-Configuration, Interface-Adaptation]
 * requires: [Skin-Contracts, Backend-Configuration, Interface-Types]
 * description: [Dynamic skin definition generator for Templum Universal Interface Orchestration]
 * ---*/

import {
  HaruspexSkinDefinitionPayload,
  SkinMetadata,
  SkinViews,
  SkinMenus,
  SkinCommands,
  SkinWorkflows,
  SkinTheme,
  BackendConfig,
  TreeViewDefinition,
  PanelDefinition,
  StatusBarDefinition,
  MenuDefinition,
  CommandDefinition,
  WorkflowDefinition
} from '../api/types/api-contracts';

export interface SkinGenerationOptions {
  serviceVersion: string;
  capabilities: string[];
  customization?: {
    showAdvancedFeatures?: boolean;
    enableRealTimeUpdates?: boolean;
    supportStreaming?: boolean;
    theme?: 'light' | 'dark' | 'auto';
    density?: 'compact' | 'normal' | 'comfortable';
  };
  interfacePreferences?: {
    primaryInterface?: 'vscode' | 'cli' | 'command';
    enableShortcuts?: boolean;
    showTooltips?: boolean;
  };
}

/**
 * Skin Provider - Generates dynamic UI definitions for Templum integration
 * 
 * Creates comprehensive skin definitions that adapt to different interface types
 * while providing consistent access to all Haruspex backend capabilities.
 */
export class SkinProvider {
  
  /**
   * Generate complete skin definition for Templum consumption
   */
  async generateSkinDefinition(options: SkinGenerationOptions): Promise<HaruspexSkinDefinitionPayload> {
    const metadata = this.generateMetadata(options);
    const views = this.generateViews(options);
    const menus = this.generateMenus(options);
    const commands = this.generateCommands(options);
    const workflows = this.generateWorkflows(options);
    const shortcuts = this.generateShortcuts(options);
    const theme = this.generateTheme(options);
    const backendConfig = this.generateBackendConfig(options);

    return {
      id: metadata.id,
      name: metadata.name,
      version: metadata.version,
      description: metadata.description,
      metadata,
      views,
      menus,
      commands,
      workflows,
      shortcuts,
      theme,
      backendConfig
    };
  }

  private generateMetadata(options: SkinGenerationOptions): SkinMetadata {
    return {
      id: 'haruspex-analysis',
      name: 'Code Analysis & Prediction',
      backend: 'haruspex',
      backendService: 'haruspex-service',
      version: options.serviceVersion,
      compatibleInterfaces: ['vscode', 'cli', 'command'],
      targetInterfaces: ['vscode', 'cli', 'command'],
      description: 'Advanced code analysis and prediction capabilities with machine learning insights',
      author: 'Haruspex Backend Service',
      capabilities: [
        'code-analysis',
        'pattern-detection',
        'security-scanning',
        'performance-analysis',
        'architecture-analysis',
        'bug-prediction',
        'refactoring-recommendations',
        'evolution-prediction',
        'real-time-streaming',
        'multi-protocol-api',
        'diagnostics',
        ...options.capabilities
      ]
    };
  }

  private generateViews(options: SkinGenerationOptions): SkinViews {
    return {
      treeViews: this.generateTreeViews(options),
      panels: this.generatePanels(options),
      statusBar: this.generateStatusBar(options),
      explorer: []
    };
  }

  private generateTreeViews(options: SkinGenerationOptions): TreeViewDefinition[] {
    const treeViews: TreeViewDefinition[] = [
      {
        id: 'haruspex.analysisResults',
        title: 'Analysis Results',
        description: 'Code analysis findings and insights organized by category',
        dataProvider: 'getAnalysisTreeData',
        onSelectionChange: 'haruspex.selectAnalysisItem',
        contextMenu: ['haruspex.exportResults', 'haruspex.refreshAnalysis'],
        dragAndDrop: false
      },
      {
        id: 'haruspex.predictions',
        title: 'Code Predictions',
        description: 'Predictive insights and recommendations for code evolution',
        dataProvider: 'getPredictionTreeData',
        onSelectionChange: 'haruspex.selectPrediction',
        contextMenu: ['haruspex.exportPredictions', 'haruspex.refreshPredictions'],
        dragAndDrop: false
      }
    ];

    // Add advanced tree view if enabled
    if (options.customization?.showAdvancedFeatures) {
      treeViews.push({
        id: 'haruspex.diagnostics',
        title: 'System Diagnostics',
        description: 'Real-time system health and performance monitoring',
        dataProvider: 'getDiagnosticsTreeData',
        onSelectionChange: 'haruspex.selectDiagnostic',
        contextMenu: ['haruspex.exportDiagnostics', 'haruspex.resetMetrics'],
        dragAndDrop: false
      });
    }

    return treeViews;
  }

  private generatePanels(options: SkinGenerationOptions): PanelDefinition[] {
    const panels: PanelDefinition[] = [
      {
        id: 'haruspex.analysisPanel',
        title: 'Analysis Dashboard',
        location: 'main',
        size: 'medium',
        type: 'webview',
        contentUrl: '/analysis-dashboard',
        messageHandler: 'haruspex.handlePanelMessage'
      },
      {
        id: 'haruspex.predictionPanel',
        title: 'Prediction Insights',
        location: 'main',
        size: 'medium',
        type: 'webview',
        contentUrl: '/prediction-dashboard',
        messageHandler: 'haruspex.handlePredictionMessage'
      }
    ];

    // Add streaming panel if supported
    if (options.customization?.supportStreaming) {
      panels.push({
        id: 'haruspex.streamingPanel',
        title: 'Real-time Analysis',
        location: 'side',
        size: 'large',
        type: 'webview',
        contentUrl: '/streaming-dashboard',
        messageHandler: 'haruspex.handleStreamingMessage'
      });
    }

    // Add diagnostics panel for advanced users
    if (options.customization?.showAdvancedFeatures) {
      panels.push({
        id: 'haruspex.diagnosticsPanel',
        title: 'System Diagnostics',
        location: 'bottom',
        size: 'small',
        type: 'webview',
        contentUrl: '/diagnostics-dashboard',
        messageHandler: 'haruspex.handleDiagnosticsMessage'
      });
    }

    return panels;
  }

  private generateStatusBar(options: SkinGenerationOptions): StatusBarDefinition[] {
    const statusItems: StatusBarDefinition[] = [
      {
        id: 'haruspex.status',
        text: 'Haruspex Ready',
        tooltip: 'Haruspex Analysis Service Status - Click for diagnostics',
        priority: 'normal',
        alignment: 'left'
      }
    ];

    if (options.customization?.enableRealTimeUpdates) {
      statusItems.push({
        id: 'haruspex.activity',
        text: '$(sync~spin) Analyzing...',
        tooltip: 'Active analysis operations',
        priority: 'low',
        alignment: 'right'
      });
    }

    return statusItems;
  }

  private generateMenus(options: SkinGenerationOptions): SkinMenus {
    return {
      main: this.generateMainMenu(options),
      context: this.generateContextMenus(options),
      toolbar: this.generateToolbars(options)
    };
  }

  private generateMainMenu(options: SkinGenerationOptions): MenuDefinition {
    const mainItems = [
      {
        id: 'analyze-code',
        label: '1. Analyze Code',
        description: 'Perform comprehensive code analysis with multiple engines',
        action: 'haruspex.analyzeCode',
        icon: 'search',
        shortcut: 'Ctrl+Shift+A'
      },
      {
        id: 'predict-evolution',
        label: '2. Predict Code Evolution',
        description: 'Generate predictive insights for code development and maintenance',
        action: 'haruspex.predictEvolution',
        icon: 'graph',
        shortcut: 'Ctrl+Shift+P'
      },
      {
        id: 'view-diagnostics',
        label: '3. System Diagnostics',
        description: 'View system health, performance metrics, and service status',
        action: 'haruspex.getDiagnostics',
        icon: 'pulse',
        shortcut: 'Ctrl+Shift+D'
      }
    ];

    // Add advanced menu items
    if (options.customization?.showAdvancedFeatures) {
      mainItems.push(
        {
          id: 'separator-1',
          label: '────────────────',
          description: '',
          action: 'separator',
          icon: '',
          shortcut: ''
        },
        {
          id: 'stream-analysis',
          label: '4. Stream Analysis',
          description: 'Start real-time streaming analysis with live updates',
          action: 'haruspex.startStreaming',
          icon: 'radio-tower',
          shortcut: 'Ctrl+Shift+S'
        },
        {
          id: 'export-results',
          label: '5. Export Results',
          description: 'Export analysis results in various formats',
          action: 'haruspex.exportResults',
          icon: 'export',
          shortcut: 'Ctrl+Shift+E'
        },
        {
          id: 'manage-cache',
          label: '6. Cache Management',
          description: 'View and manage analysis result cache',
          action: 'haruspex.manageCache',
          icon: 'database',
          shortcut: 'Ctrl+Shift+C'
        }
      );
    }

    return {
      id: 'haruspex.mainMenu',
      title: 'Haruspex Analysis Service',
      subtitle: 'Code Analysis & Prediction with Machine Learning',
      items: mainItems
    };
  }

  private generateContextMenus(options: SkinGenerationOptions): any[] {
    return [
      {
        id: 'analysisContext',
        target: 'analysis-results',
        items: [
          { id: 'export-item', label: 'Export Result', action: 'haruspex.exportAnalysisItem' },
          { id: 'copy-item', label: 'Copy to Clipboard', action: 'haruspex.copyAnalysisItem' },
          { id: 'view-details', label: 'View Details', action: 'haruspex.viewAnalysisDetails' }
        ]
      },
      {
        id: 'predictionContext',
        target: 'predictions',
        items: [
          { id: 'apply-suggestion', label: 'Apply Suggestion', action: 'haruspex.applySuggestion' },
          { id: 'ignore-prediction', label: 'Ignore Prediction', action: 'haruspex.ignorePrediction' },
          { id: 'feedback', label: 'Provide Feedback', action: 'haruspex.provideFeedback' }
        ]
      }
    ];
  }

  private generateToolbars(options: SkinGenerationOptions): any[] {
    const toolbars = [
      {
        id: 'haruspexMainToolbar',
        position: 'top',
        items: [
          { id: 'quick-analyze', icon: 'search', tooltip: 'Quick Analysis', action: 'haruspex.quickAnalyze' },
          { id: 'separator-1', type: 'separator' },
          { id: 'refresh', icon: 'refresh', tooltip: 'Refresh Results', action: 'haruspex.refresh' },
          { id: 'export', icon: 'export', tooltip: 'Export Results', action: 'haruspex.export' }
        ]
      }
    ];

    if (options.customization?.enableRealTimeUpdates) {
      toolbars[0].items.push(
        { id: 'separator-2', type: 'separator' },
        { id: 'toggle-streaming', icon: 'radio-tower', tooltip: 'Toggle Streaming', action: 'haruspex.toggleStreaming' }
      );
    }

    return toolbars;
  }

  private generateCommands(options: SkinGenerationOptions): SkinCommands {
    const commands: SkinCommands = {
      'haruspex.analyzeCode': {
        title: 'Analyze Code',
        description: 'Perform comprehensive code analysis including structure, performance, security, and architecture',
        handler: 'analyzeCode',
        shortcuts: ['analyze', 'scan'],
        examples: [
          'haruspex.analyzeCode --file src/main.ts',
          'analyze --directory src/ --deep',
          'scan --language typescript --framework react'
        ],
        parameters: [
          { name: 'file', type: 'string', description: 'File path to analyze' },
          { name: 'directory', type: 'string', description: 'Directory to analyze recursively' },
          { name: 'language', type: 'string', description: 'Programming language', options: ['typescript', 'javascript', 'python', 'java'] },
          { name: 'depth', type: 'string', description: 'Analysis depth', options: ['quick', 'standard', 'deep', 'comprehensive'] },
          { name: 'framework', type: 'string', description: 'Framework context (optional)' }
        ]
      },
      'haruspex.predictEvolution': {
        title: 'Predict Code Evolution',
        description: 'Generate predictive insights for code development patterns and potential issues',
        handler: 'predictCodeEvolution',
        shortcuts: ['predict', 'forecast'],
        examples: [
          'predict --context current-sprint',
          'haruspex.predictEvolution --historical 30d',
          'forecast --timeHorizon 90d --type bug-prediction'
        ],
        parameters: [
          { name: 'context', type: 'string', description: 'Project context for prediction' },
          { name: 'timeHorizon', type: 'string', description: 'Prediction time horizon', options: ['1d', '7d', '30d', '90d', '180d', '1y'] },
          { name: 'type', type: 'string', description: 'Prediction type', options: ['pattern-evolution', 'bug-prediction', 'refactoring-opportunities'] },
          { name: 'historical', type: 'string', description: 'Historical data period to consider' }
        ]
      },
      'haruspex.getDiagnostics': {
        title: 'Get System Diagnostics',
        description: 'Retrieve comprehensive system health, performance metrics, and service status information',
        handler: 'getSystemDiagnostics',
        shortcuts: ['diagnostics', 'status', 'health'],
        examples: [
          'diagnostics',
          'status --detailed',
          'health --components'
        ]
      }
    };

    // Add advanced commands
    if (options.customization?.showAdvancedFeatures) {
      Object.assign(commands, {
        'haruspex.startStreaming': {
          title: 'Start Streaming Analysis',
          description: 'Begin real-time streaming analysis with live updates and continuous monitoring',
          handler: 'startStreamingAnalysis',
          shortcuts: ['stream', 'monitor'],
          examples: [
            'stream --files src/**/*.ts',
            'monitor --realtime --updates'
          ]
        },
        'haruspex.exportResults': {
          title: 'Export Analysis Results',
          description: 'Export analysis and prediction results in various formats (JSON, CSV, PDF, HTML)',
          handler: 'exportResults',
          shortcuts: ['export'],
          examples: [
            'export --format json --output results.json',
            'export --format pdf --include predictions'
          ]
        },
        'haruspex.clearCache': {
          title: 'Clear Analysis Cache',
          description: 'Clear cached analysis results to free memory and ensure fresh analysis',
          handler: 'clearCache',
          shortcuts: ['clearcache', 'cache-clear'],
          examples: [
            'clearcache',
            'haruspex.clearCache',
            'cache-clear --confirm'
          ]
        },
        'haruspex.refreshModels': {
          title: 'Refresh ML Models',
          description: 'Refresh machine learning models for improved prediction accuracy',
          handler: 'refreshModels',
          shortcuts: ['refreshmodels', 'models-refresh'],
          examples: [
            'refreshmodels',
            'haruspex.refreshModels',
            'models-refresh --force'
          ]
        },
        'haruspex.getHealthStatus': {
          title: 'Get Health Status',
          description: 'Get detailed health and performance status of the Haruspex service',
          handler: 'getHealthStatus',
          shortcuts: ['healthstatus', 'service-health'],
          examples: [
            'healthstatus',
            'haruspex.getHealthStatus',
            'service-health --detailed'
          ]
        }
      });
    }

    return commands;
  }

  private generateWorkflows(options: SkinGenerationOptions): SkinWorkflows {
    const workflows: SkinWorkflows = {
      'deepAnalysis': {
        title: 'Deep Code Analysis',
        description: 'Comprehensive multi-phase code analysis with predictions and recommendations',
        steps: [
          { 
            id: 'scan', 
            command: 'haruspex.analyzeCode', 
            description: 'Initial code structure and quality scan',
            parameters: { depth: 'comprehensive' }
          },
          { 
            id: 'predict', 
            command: 'haruspex.predictEvolution', 
            description: 'Generate evolution and maintenance predictions',
            parameters: { timeHorizon: '90d' }
          },
          { 
            id: 'report', 
            command: 'haruspex.generateReport', 
            description: 'Create comprehensive analysis report',
            parameters: { format: 'detailed' }
          }
        ],
        parallelSteps: false,
        errorHandling: {
          strategy: 'continue-on-error',
          maxRetries: 2,
          fallbackActions: ['haruspex.exportPartialResults']
        }
      }
    };

    if (options.customization?.supportStreaming) {
      workflows['streamingWorkflow'] = {
        title: 'Real-time Analysis Monitoring',
        description: 'Continuous monitoring workflow with real-time updates and alerting',
        steps: [
          { id: 'setup', command: 'haruspex.setupStreaming', description: 'Configure streaming parameters' },
          { id: 'monitor', command: 'haruspex.startStreaming', description: 'Begin real-time monitoring' },
          { id: 'alert', command: 'haruspex.configureAlerts', description: 'Setup quality and security alerts' }
        ],
        parallelSteps: true
      };
    }

    return workflows;
  }

  private generateShortcuts(options: SkinGenerationOptions): Record<string, string> {
    const shortcuts: Record<string, string> = {
      'ctrl+shift+a': 'haruspex.analyzeCode',
      'ctrl+shift+p': 'haruspex.predictEvolution',
      'ctrl+shift+d': 'haruspex.getDiagnostics'
    };

    if (options.interfacePreferences?.enableShortcuts !== false) {
      Object.assign(shortcuts, {
        'ctrl+shift+r': 'haruspex.refresh',
        'ctrl+shift+e': 'haruspex.exportResults',
        'ctrl+shift+s': 'haruspex.startStreaming',
        'f5': 'haruspex.refresh',
        'ctrl+alt+d': 'haruspex.toggleDiagnosticsPanel'
      });
    }

    return shortcuts;
  }

  private generateTheme(options: SkinGenerationOptions): SkinTheme {
    const baseTheme = {
      primary: '#2E86AB',
      secondary: '#A23B72',
      accent: '#F18F01',
      success: '#28A745',
      warning: '#FFC107',
      error: '#DC3545',
      background: '#F8F9FA',
      foreground: '#212529'
    };

    // Adapt theme based on customization
    if (options.customization?.theme === 'dark') {
      return {
        ...baseTheme,
        background: '#1E1E1E',
        foreground: '#FFFFFF',
        primary: '#4FC3F7',
        secondary: '#CE93D8'
      };
    }

    return baseTheme;
  }

  private generateBackendConfig(options: SkinGenerationOptions): BackendConfig {
    // Use dynamic port from configuration (defaulting to standard HTTP port)
    const httpPort = process.env.HARUSPEX_HTTP_PORT || '3002';
    const wsPort = process.env.HARUSPEX_WS_PORT || '3004';
    
    return {
      service: 'haruspex-service',
      version: options.serviceVersion,
      protocol: 'http',
      endpoint: `http://localhost:${httpPort}`,
      timeout: 30000,
      retries: 3,
      keepAlive: true,
      authentication: { type: 'none' },
      capabilities: options.capabilities,
      healthEndpoint: `http://localhost:${httpPort}/health`,
      capabilitiesEndpoint: `http://localhost:${httpPort}/capabilities`,
      versionEndpoint: `http://localhost:${httpPort}/version`,
      endpoints: {
        skin: `http://localhost:${httpPort}/getSkinDefinition`,
        command: `http://localhost:${httpPort}/executeCommand`,
        websocket: `ws://localhost:${wsPort}`
      }
    };
  }
}
