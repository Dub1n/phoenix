/**
 * Phase 5: Universal Skin System Cross-Interface Consistency Tests
 * 
 * Generated: 2025-08-21-124000
 * Purpose: Comprehensive TDD validation for Universal Skin System enhancement
 * Context: Phase 5 implementation with cross-interface rendering and performance targets
 */

import { UniversalSkinDefinition, InterfaceType, SkinRenderResult } from '../../src/types/universal-skin-engine-types';
import { UniversalSkinEngine } from '../../src/skin/universal-skin-engine-impl';
import { validateSkinDefinition } from '../../src/validation/skin-validator';
import universalSkinEngineValidationSchema from '../../schemas/universal-skin-engine-validation.json';

describe('Phase 5: Universal Skin System Cross-Interface Consistency', () => {
  let skinEngine: UniversalSkinEngine;
  let defaultUserPreferences: any;
  let vscodeCapabilities: any;
  let currentSession: any;

  beforeEach(async () => {
    skinEngine = new UniversalSkinEngine();
    
    defaultUserPreferences = {
      theme: 'default-light',
      accessibility: true,
      animations: true,
      fontSize: 'medium'
    };
    
    vscodeCapabilities = {
      treeViews: true,
      panels: true,
      statusBar: true,
      decorations: true,
      commands: true,
      contextMenus: true
    };
    
    currentSession = {
      id: 'test-session-001',
      user: 'test-user',
      workspace: '/test/workspace',
      activeInterface: 'vscode',
      timestamp: Date.now()
    };
  });

  afterEach(async () => {
    // Cleanup engine resources
    await skinEngine?.cleanup?.();
  });

  describe('Universal Skin System Core Functionality', () => {
    test('renders all backend skins consistently across interfaces', async () => {
      // Create test skin definition following specification
      const pclSkin = createTestPCLSkinDefinition();
      await skinEngine.registerSkin(pclSkin);
      
      const renderingContext = {
        interface: 'vscode' as InterfaceType,
        theme: 'default-light',
        preferences: defaultUserPreferences,
        capabilities: vscodeCapabilities,
        session: currentSession
      };
      
      // Test rendering across all interfaces
      const vscodeRender = await skinEngine.renderForInterface(pclSkin, 'vscode', renderingContext);
      const cliRender = await skinEngine.renderForInterface(pclSkin, 'cli', {
        ...renderingContext,
        interface: 'cli' as InterfaceType,
        capabilities: { interactiveMenus: true, keyboardNavigation: true }
      });
      const cmdRender = await skinEngine.renderForInterface(pclSkin, 'command', {
        ...renderingContext,
        interface: 'command' as InterfaceType,
        capabilities: { flagParsing: true, helpGeneration: true }
      });
      
      // Validate interface-specific rendering
      expect(vscodeRender.interface).toBe('vscode');
      expect(cliRender.interface).toBe('cli');
      expect(cmdRender.interface).toBe('command');
      
      // Verify consistent functionality across interfaces
      expect(vscodeRender.components.length).toBeGreaterThan(0);
      expect(cliRender.components.length).toBeGreaterThan(0);
      expect(cmdRender.components.length).toBeGreaterThan(0);
      
      // Validate core functionality consistency
      expect(vscodeRender.metadata.skinId).toBe(pclSkin.metadata.id);
      expect(cliRender.metadata.skinId).toBe(pclSkin.metadata.id);
      expect(cmdRender.metadata.skinId).toBe(pclSkin.metadata.id);
      
      // Verify successful rendering
      expect(vscodeRender.success).toBe(true);
      expect(cliRender.success).toBe(true);
      expect(cmdRender.success).toBe(true);
    });

    test('validates skin definitions against JSON schema', async () => {
      const testSkinDefinition: UniversalSkinDefinition = {
        id: 'test-haruspex-skin',
        name: 'Haruspex Analysis Skin',
        version: '1.0.0',
        description: 'Test skin for Haruspex analysis features',
        pclCompatibility: {
          enabled: true,
          version: '1.0.0',
          reusePercentage: 75,
          inheritancePatterns: ['command-pattern', 'factory-pattern'],
          optimizations: ['lazy-loading', 'caching']
        },
        metadata: {
          id: 'test-haruspex-skin',
          name: 'Haruspex Analysis Skin',
          version: '1.0.0',
          description: 'Test skin for Haruspex analysis features',
          targetInterfaces: ['vscode', 'cli', 'command'],
          backendService: 'haruspex',
          minimumVersion: '2.0.0',
          features: createTestFeatureMatrix(),
          performance: createTestPerformanceHints()
        },
        views: {
          treeViews: [
            {
              id: 'haruspex-analysis',
              name: 'Analysis Results',
              icon: 'analysis',
              dataProvider: 'haruspex.analysisProvider',
              refreshCommand: 'haruspex.refreshAnalysis'
            }
          ],
          panels: [
            {
              id: 'prediction-dashboard',
              name: 'Prediction Dashboard',
              type: 'webview',
              showOnStartup: false,
              retainContextWhenHidden: true
            }
          ]
        },
        menus: {
          main: {
            id: 'haruspex-main',
            title: 'Haruspex Analysis',
            items: [
              {
                id: 'analyze-code',
                label: 'Analyze Code',
                command: 'haruspex.analyzeCode',
                shortcut: 'Ctrl+Shift+A'
              },
              {
                id: 'predictions',
                label: 'View Predictions',
                command: 'haruspex.viewPredictions',
                shortcut: 'Ctrl+Shift+P'
              }
            ]
          }
        },
        commands: {
          primary: [
            {
              id: 'haruspex.analyzeCode',
              name: 'analyze',
              title: 'Analyze Code',
              description: 'Analyze code patterns and complexity',
              category: 'Haruspex',
              parameters: [
                {
                  name: 'file',
                  type: 'string',
                  required: true,
                  description: 'File path to analyze'
                }
              ]
            }
          ],
          help: {
            format: 'markdown',
            sections: [
              {
                title: 'Analysis Commands',
                content: 'Commands for code analysis and prediction'
              }
            ]
          }
        },
        workflows: {
          workflows: [
            {
              id: 'full-analysis',
              name: 'Complete Analysis Workflow',
              title: 'Complete Analysis Workflow',
              description: 'Run full analysis pipeline',
              steps: [
                { id: 'step-1', command: 'haruspex.analyzeCode', waitForCompletion: true },
                { id: 'step-2', command: 'haruspex.generatePredictions', waitForCompletion: true },
                { id: 'step-3', command: 'haruspex.showResults', waitForCompletion: false }
              ]
            }
          ]
        },
        shortcuts: {
          'analyze': 'Ctrl+Shift+A',
          'predict': 'Ctrl+Shift+P',
          'refresh': 'F5'
        },
        themes: {
          'default': {
            name: 'Haruspex Default',
            type: 'light',
            colors: {
            primary: { 50: '#E3F2FD', 100: '#BBDEFB', 200: '#90CAF9', 300: '#64B5F6', 400: '#42A5F5', 500: '#007ACC', 600: '#1E88E5', 700: '#1976D2', 800: '#1565C0', 900: '#0D47A1' },
            secondary: { 50: '#F8F9FA', 100: '#E9ECEF', 200: '#DEE2E6', 300: '#CED4DA', 400: '#ADB5BD', 500: '#6C757D', 600: '#5A6268', 700: '#495057', 800: '#343A40', 900: '#212529' },
            accent: { 50: '#F1F8E9', 100: '#DCEDC8', 200: '#C5E1A5', 300: '#AED581', 400: '#9CCC65', 500: '#28A745', 600: '#689F38', 700: '#558B2F', 800: '#33691E', 900: '#1B5E20' },
            neutral: { 50: '#FAFAFA', 100: '#F5F5F5', 200: '#EEEEEE', 300: '#E0E0E0', 400: '#BDBDBD', 500: '#9E9E9E', 600: '#757575', 700: '#616161', 800: '#424242', 900: '#212121' },
            semantic: {
              success: { 50: '#F1F8E9', 100: '#DCEDC8', 200: '#C5E1A5', 300: '#AED581', 400: '#9CCC65', 500: '#28A745', 600: '#689F38', 700: '#558B2F', 800: '#33691E', 900: '#1B5E20' },
              warning: { 50: '#FFFDE7', 100: '#FFF9C4', 200: '#FFF59D', 300: '#FFF176', 400: '#FFEE58', 500: '#FFC107', 600: '#FDD835', 700: '#F9A825', 800: '#F57F17', 900: '#FF8F00' },
              error: { 50: '#FFEBEE', 100: '#FFCDD2', 200: '#EF9A9A', 300: '#E57373', 400: '#EF5350', 500: '#DC3545', 600: '#E53935', 700: '#D32F2F', 800: '#C62828', 900: '#B71C1C' },
              info: { 50: '#E3F2FD', 100: '#BBDEFB', 200: '#90CAF9', 300: '#64B5F6', 400: '#42A5F5', 500: '#2196F3', 600: '#1E88E5', 700: '#1976D2', 800: '#1565C0', 900: '#0D47A1' }
            },
            background: {
              primary: '#FFFFFF',
              secondary: '#F8F9FA',
              tertiary: '#E9ECEF',
              overlay: 'rgba(0, 0, 0, 0.5)'
            },
            text: {
              primary: '#212529',
              secondary: '#6C757D',
              disabled: '#ADB5BD',
              inverse: '#FFFFFF'
            },
            border: {
              primary: '#DEE2E6',
              secondary: '#ADB5BD',
              focus: '#007ACC',
              error: '#DC3545'
            }
          },
          typography: {
            fontFamilies: { primary: 'Segoe UI, sans-serif', secondary: 'Arial, sans-serif', monospace: 'Monaco, monospace' },
            fontSizes: { small: '12px', medium: '14px', large: '16px' },
            fontWeights: { normal: 400, bold: 700 },
            lineHeights: { normal: 1.5, tight: 1.2 },
            letterSpacing: { normal: '0px', wide: '0.1em' }
          },
          spacing: {
            unit: 8,
            scale: { xs: 0.5, sm: 1, md: 2, lg: 3, xl: 4 }
          },
          borders: {
            radii: { sm: '4px', md: '8px', lg: '12px' },
            widths: { thin: '1px', medium: '2px', thick: '4px' },
            styles: { solid: 'solid', dashed: 'dashed' }
          },
          shadows: {
            elevations: { low: '0 2px 4px rgba(0,0,0,0.1)', medium: '0 4px 8px rgba(0,0,0,0.15)', high: '0 8px 16px rgba(0,0,0,0.2)' },
            colors: { default: 'rgba(0,0,0,0.1)' }
          },
          animations: {
            durations: { fast: '150ms', normal: '300ms', slow: '500ms' },
            easings: { ease: 'ease', easeIn: 'ease-in', easeOut: 'ease-out' },
            transitions: { default: 'all 300ms ease' }
          },
          customProperties: {}
          },
          typography: {
            fontFamilies: {
              primary: 'Segoe UI, sans-serif',
              secondary: 'Arial, sans-serif',
              monospace: 'Monaco, monospace'
            },
            fontSizes: {
              small: '12px',
              medium: '14px',
              large: '16px'
            },
            fontWeights: {
              normal: 400,
              bold: 700
            },
            lineHeights: {
              normal: 1.5,
              tight: 1.2
            },
            letterSpacing: {
              normal: '0px',
              wide: '0.1em'
            }
          }
        },
        backendConfig: {
          protocol: 'http',
          endpoint: 'http://localhost:3000',
          service: 'haruspex',
          version: '2.0.0',
          endpoints: {
            analyze: '/api/analyze',
            predict: '/api/predict',
            health: '/health'
          },
          authentication: {
            type: 'api-key',
            required: false
          }
        },
        caching: {
          strategy: 'lru',
          maxAge: 300000, // 5 minutes
          maxSize: 100
        },
        validation: {
          schema: 'universal-skin-engine-v1.0',
          strictMode: true,
          validateOnLoad: true
        }
      };
      
      const validationResult = validateSkinDefinition(testSkinDefinition, universalSkinEngineValidationSchema);
      expect(validationResult.valid).toBe(true);
      expect(validationResult.errors).toHaveLength(0);
    });

    test('supports interface switching with state preservation', async () => {
      // Register test skin
      const testSkin = createTestPCLSkinDefinition();
      await skinEngine.registerSkin(testSkin);
      
      // Set initial state
      const initialState = {
        activeMenu: 'main',
        selectedItem: 'analyze',
        userPreferences: defaultUserPreferences
      };
      
      await skinEngine.setState('vscode', initialState);
      
      const startTime = Date.now();
      const switchResult = await skinEngine.switchInterface('vscode', 'cli', true);
      const switchTime = Date.now() - startTime;
      
      expect(switchResult.success).toBe(true);
      expect(switchTime).toBeLessThan(100); // <100ms target from specification
      expect(switchResult.preservedState).toBe(true);
      
      // Verify state preservation
      const cliState = await skinEngine.getState('cli');
      expect(cliState.activeMenu).toBe(initialState.activeMenu);
      expect(cliState.selectedItem).toBe(initialState.selectedItem);
      expect(cliState.userPreferences).toEqual(initialState.userPreferences);
    });
  });

  describe('Performance Target Validation', () => {
    test('skin generation meets <100ms target', async () => {
      const testSkin = createTestHaruspexSkinDefinition();
      
      const startTime = Date.now();
      await skinEngine.registerSkin(testSkin);
      const registrationTime = Date.now() - startTime;
      
      expect(registrationTime).toBeLessThan(100); // <100ms skin generation target
    });

    test('component rendering meets <50ms target', async () => {
      const testSkin = createTestPCLSkinDefinition();
      await skinEngine.registerSkin(testSkin);
      
      const startTime = Date.now();
      const renderResult = await skinEngine.renderForInterface(
        testSkin,
        'vscode',
        {
          interface: 'vscode' as InterfaceType,
          theme: 'default-light',
          preferences: defaultUserPreferences,
          capabilities: vscodeCapabilities,
          session: currentSession
        }
      );
      const renderTime = Date.now() - startTime;
      
      expect(renderTime).toBeLessThan(50); // <50ms component rendering target
      expect(renderResult.performance.renderTime).toBeLessThan(50);
    });

    test('cache hit rate achieves 85%+ target', async () => {
      const testSkin = createTestPCLSkinDefinition();
      await skinEngine.registerSkin(testSkin);
      
      const renderContext = {
        interface: 'vscode' as InterfaceType,
        theme: 'default-light',
        preferences: defaultUserPreferences,
        capabilities: vscodeCapabilities,
        session: currentSession
      };
      
      // First render (cache miss)
      const firstRender = await skinEngine.renderForInterface(testSkin, 'vscode', renderContext);
      expect(firstRender.performance.cacheHit).toBe(false);
      
      // Multiple subsequent renders (should hit cache)
      const cacheTestResults = [];
      for (let i = 0; i < 20; i++) {
        const result = await skinEngine.renderForInterface(testSkin, 'vscode', renderContext);
        cacheTestResults.push(result.performance.cacheHit);
      }
      
      const cacheHits = cacheTestResults.filter(hit => hit).length;
      const cacheHitRate = (cacheHits / cacheTestResults.length) * 100;
      
      expect(cacheHitRate).toBeGreaterThanOrEqual(85); // 85%+ cache hit rate target
    });

    test('state synchronization meets <150ms target', async () => {
      const testSkin = createTestPCLSkinDefinition();
      await skinEngine.registerSkin(testSkin);
      
      const testState = {
        activeView: 'analysis',
        filters: { complexity: 'high', type: 'typescript' }
      };
      
      const startTime = Date.now();
      await skinEngine.setState('vscode', testState);
      const syncedState = await skinEngine.getState('cli');
      const syncTime = Date.now() - startTime;
      
      expect(syncTime).toBeLessThan(150); // <150ms state synchronization target
      expect(syncedState.activeView).toBe(testState.activeView);
      expect(syncedState.filters).toEqual(testState.filters);
    });
  });

  describe('Multi-Backend Integration', () => {
    test('supports PCL backend integration', async () => {
      const pclSkin = createTestPCLSkinDefinition();
      await skinEngine.registerSkin(pclSkin);
      
      const renderResult = await skinEngine.renderForInterface(
        pclSkin,
        'cli',
        {
          interface: 'cli' as InterfaceType,
          theme: 'default-light',
          preferences: defaultUserPreferences,
          capabilities: { interactiveMenus: true },
          session: currentSession
        }
      );
      
      expect(renderResult.success).toBe(true);
      expect(renderResult.metadata.backendService).toBe('pcl');
      expect(renderResult.components).toContainEqual(expect.objectContaining({
        type: 'menu',
        backend: 'pcl'
      }));
    });

    test('supports Haruspex backend integration', async () => {
      const haruspexSkin = createTestHaruspexSkinDefinition();
      await skinEngine.registerSkin(haruspexSkin);
      
      const renderResult = await skinEngine.renderForInterface(
        haruspexSkin,
        'vscode',
        {
          interface: 'vscode' as InterfaceType,
          theme: 'default-light',
          preferences: defaultUserPreferences,
          capabilities: vscodeCapabilities,
          session: currentSession
        }
      );
      
      expect(renderResult.success).toBe(true);
      expect(renderResult.metadata.backendService).toBe('haruspex');
      expect(renderResult.components).toContainEqual(expect.objectContaining({
        type: 'treeView',
        backend: 'haruspex'
      }));
    });
  });

  describe('Advanced Features', () => {
    test('skin inheritance and priority system', async () => {
      const baseSkin = createBaseSkinDefinition();
      const childSkin = createChildSkinDefinition(baseSkin.metadata.id);
      
      await skinEngine.registerSkin(baseSkin);
      await skinEngine.registerSkin(childSkin);
      
      const renderResult = await skinEngine.renderForInterface(
        childSkin,
        'vscode',
        {
          interface: 'vscode' as InterfaceType,
          theme: 'default-light',
          preferences: defaultUserPreferences,
          capabilities: vscodeCapabilities,
          session: currentSession
        }
      );
      
      expect(renderResult.success).toBe(true);
      expect(renderResult.inheritance.parentSkin).toBe(baseSkin.metadata.id);
      expect(renderResult.inheritance.applied).toBe(true);
    });

    test('dynamic skin generation based on context', async () => {
      const dynamicSkin = createTestHaruspexSkinDefinition();
      await skinEngine.registerSkin(dynamicSkin);
      
      // Test context-aware customization
      const contextA = {
        interface: 'vscode' as InterfaceType,
        theme: 'default-light',
        preferences: { ...defaultUserPreferences, analysisMode: 'detailed' },
        capabilities: vscodeCapabilities,
        session: currentSession
      };
      
      const contextB = {
        interface: 'cli' as InterfaceType,
        theme: 'default-dark',
        preferences: { ...defaultUserPreferences, analysisMode: 'quick' },
        capabilities: { interactiveMenus: true },
        session: currentSession
      };
      
      const renderA = await skinEngine.renderForInterface(dynamicSkin, 'vscode', contextA);
      const renderB = await skinEngine.renderForInterface(dynamicSkin, 'cli', contextB);
      
      expect(renderA.success).toBe(true);
      expect(renderB.success).toBe(true);
      expect(renderA.customization.analysisMode).toBe('detailed');
      expect(renderB.customization.analysisMode).toBe('quick');
    });
  });
});

// Test Helper Functions
function createTestFeatureMatrix(): any {
  return {
    vscode: {
      treeViews: true,
      panels: true,
      statusBar: true,
      decorations: false,
      commands: true,
      contextMenus: true
    },
    cli: {
      interactiveMenus: true,
      keyboardNavigation: true,
      progressIndicators: true,
      inputValidation: true,
      sessionManagement: true
    },
    command: {
      flagParsing: true,
      pipeSupport: false,
      completions: true,
      helpGeneration: true,
      aliasSupport: true
    },
    shared: {
      workflows: true,
      theming: true,
      caching: true,
      stateSync: true,
      errorHandling: true
    }
  };
}

function createTestPerformanceHints(): any {
  return {
    loadingStrategy: 'lazy',
    cacheStrategy: 'lru',
    preloadComponents: ['main-menu', 'analysis-view'],
    criticalPath: ['metadata', 'commands', 'menus'],
    renderingHints: {
      vscode: { batchUpdates: true, virtualScrolling: false },
      cli: { bufferOutput: true, colorOptimization: true },
      command: { minimalOutput: true, fastHelp: true }
    }
  };
}

function createTestPCLSkinDefinition(): UniversalSkinDefinition {
  return {
    id: 'pcl-tdd-workflow',
    name: 'PCL TDD Workflow Skin',
    version: '1.0.0',
    metadata: {
      id: 'pcl-tdd-workflow',
      name: 'PCL TDD Workflow Skin',
      version: '1.0.0',
      description: 'Phoenix Code Lite TDD workflow interface',
      backend: 'pcl',
      targetInterfaces: ['vscode', 'cli', 'command'],
      compatibleInterfaces: ['vscode', 'cli', 'command'],
      backendService: 'pcl',
      minimumVersion: '2.0.0',
      features: createTestFeatureMatrix(),
      performance: createTestPerformanceHints()
    },
    views: {
      treeViews: [
        {
          id: 'pcl-workflow',
          name: 'TDD Workflow',
          icon: 'workflow',
          dataProvider: 'pcl.workflowProvider'
        }
      ],
      panels: [
        {
          id: 'tdd-dashboard',
          name: 'TDD Dashboard',
          type: 'webview',
          showOnStartup: true
        }
      ]
    },
    menus: {
      main: {
        id: 'pcl-main',
        title: 'Phoenix Code Lite',
        items: [
          {
            id: 'start-tdd',
            label: 'Start TDD Workflow',
            command: 'pcl.startTDD'
          }
        ]
      }
    },
    commands: {
      primary: [
        {
          id: 'pcl.startTDD',
          name: 'start-tdd',
          title: 'Start TDD',
          description: 'Start TDD workflow',
          category: 'PCL'
        }
      ],
      help: {
        format: 'markdown',
        sections: [
          {
            title: 'TDD Commands',
            content: 'Commands for TDD workflow management'
          }
        ]
      }
    },
    workflows: {
      workflows: [
        {
          id: 'red-green-refactor',
          name: 'Red-Green-Refactor Cycle',
          title: 'Red-Green-Refactor Cycle',
          description: 'Standard TDD cycle',
          steps: [
            { id: 'write-test', command: 'pcl.writeTest', waitForCompletion: true },
            { id: 'run-test', command: 'pcl.runTest', waitForCompletion: true },
            { id: 'implement-code', command: 'pcl.implementCode', waitForCompletion: true }
          ]
        }
      ]
    },
    shortcuts: {},
    themes: {
      'default': {
        name: 'PCL Default',
        colors: {
          primary: { 50: '#E3F2FD', 100: '#BBDEFB', 200: '#90CAF9', 300: '#64B5F6', 400: '#42A5F5', 500: '#007ACC', 600: '#1E88E5', 700: '#1976D2', 800: '#1565C0', 900: '#0D47A1' },
          secondary: { 50: '#F8F9FA', 100: '#E9ECEF', 200: '#DEE2E6', 300: '#CED4DA', 400: '#ADB5BD', 500: '#6C757D', 600: '#5A6268', 700: '#495057', 800: '#343A40', 900: '#212529' },
          accent: { 50: '#E8F5E8', 100: '#C8E6C9', 200: '#A5D6A7', 300: '#81C784', 400: '#66BB6A', 500: '#4CAF50', 600: '#43A047', 700: '#388E3C', 800: '#2E7D32', 900: '#1B5E20' },
          neutral: { 50: '#FAFAFA', 100: '#F5F5F5', 200: '#EEEEEE', 300: '#E0E0E0', 400: '#BDBDBD', 500: '#9E9E9E', 600: '#757575', 700: '#616161', 800: '#424242', 900: '#212121' },
          semantic: {
            success: { 50: '#F1F8E9', 100: '#DCEDC8', 200: '#C5E1A5', 300: '#AED581', 400: '#9CCC65', 500: '#8BC34A', 600: '#7CB342', 700: '#689F38', 800: '#558B2F', 900: '#33691E' },
            warning: { 50: '#FFFDE7', 100: '#FFF9C4', 200: '#FFF59D', 300: '#FFF176', 400: '#FFEE58', 500: '#FFEB3B', 600: '#FDD835', 700: '#F9A825', 800: '#F57F17', 900: '#FF8F00' },
            error: { 50: '#FFEBEE', 100: '#FFCDD2', 200: '#EF9A9A', 300: '#E57373', 400: '#EF5350', 500: '#F44336', 600: '#E53935', 700: '#D32F2F', 800: '#C62828', 900: '#B71C1C' },
            info: { 50: '#E3F2FD', 100: '#BBDEFB', 200: '#90CAF9', 300: '#64B5F6', 400: '#42A5F5', 500: '#2196F3', 600: '#1E88E5', 700: '#1976D2', 800: '#1565C0', 900: '#0D47A1' }
          },
          background: { 
            primary: '#FFFFFF', 
            secondary: '#F8F9FA', 
            tertiary: '#E9ECEF', 
            overlay: 'rgba(0, 0, 0, 0.5)' 
          },
          text: { 
            primary: '#212529', 
            secondary: '#6C757D', 
            disabled: '#ADB5BD', 
            inverse: '#FFFFFF' 
          },
          border: {
            primary: '#DEE2E6',
            secondary: '#E9ECEF',
            focus: '#007ACC',
            error: '#DC3545'
          }
        }
      }
    },
    backendConfig: {
      service: 'pcl',
      version: '2.0.0',
      protocol: 'http',
      endpoint: 'http://localhost:3000',
      endpoints: {
        workflow: '/api/workflow',
        health: '/health'
      }
    },
    caching: {
      strategy: 'lru',
      maxAge: 300000,
      maxSize: 50
    },
    validation: {
      schema: 'universal-skin-engine-v1.0'
    }
  };
}

function createTestHaruspexSkinDefinition(): UniversalSkinDefinition {
  return {
    metadata: {
      id: 'haruspex-analysis',
      name: 'Haruspex Analysis Skin',
      version: '1.0.0',
      description: 'Haruspex code analysis and prediction interface',
      targetInterfaces: ['vscode', 'cli', 'command'],
      backendService: 'haruspex',
      minimumVersion: '2.0.0',
      features: createTestFeatureMatrix(),
      performance: createTestPerformanceHints()
    },
    views: {
      treeViews: [
        {
          id: 'analysis-results',
          name: 'Analysis Results',
          icon: 'analysis',
          dataProvider: 'haruspex.analysisProvider'
        }
      ],
      panels: [
        {
          id: 'prediction-dashboard',
          name: 'Predictions',
          type: 'webview',
          showOnStartup: false
        }
      ]
    },
    menus: {
      main: {
        id: 'haruspex-main',
        title: 'Haruspex',
        items: [
          {
            id: 'analyze',
            label: 'Analyze Code',
            command: 'haruspex.analyze'
          }
        ]
      }
    },
    commands: {
      primary: [
        {
          id: 'haruspex.analyze',
          name: 'analyze',
          title: 'Analyze',
          description: 'Analyze code patterns',
          category: 'Haruspex'
        }
      ],
      help: {
        format: 'markdown',
        sections: [
          {
            title: 'Analysis Commands',
            content: 'Commands for code analysis'
          }
        ]
      }
    },
    workflows: {
      workflows: [
        {
          id: 'full-analysis',
          name: 'Complete Analysis',
          title: 'Complete Analysis',
          description: 'Run full code analysis',
          steps: [
            { id: 'analyze-step', command: 'haruspex.analyze', waitForCompletion: true }
          ]
        }
      ]
    },
    shortcuts: {},
    themes: {
      'default': {
        name: 'Haruspex Default',
        colors: {
          primary: { 50: '#F1F8E9', 100: '#DCEDC8', 200: '#C5E1A5', 300: '#AED581', 400: '#9CCC65', 500: '#28A745', 600: '#689F38', 700: '#558B2F', 800: '#33691E', 900: '#1B5E20' },
          secondary: { 50: '#F8F9FA', 100: '#E9ECEF', 200: '#DEE2E6', 300: '#CED4DA', 400: '#ADB5BD', 500: '#6C757D', 600: '#5A6268', 700: '#495057', 800: '#343A40', 900: '#212529' },
          accent: { 50: '#E8F5E8', 100: '#C8E6C9', 200: '#A5D6A7', 300: '#81C784', 400: '#66BB6A', 500: '#4CAF50', 600: '#43A047', 700: '#388E3C', 800: '#2E7D32', 900: '#1B5E20' },
          neutral: { 50: '#FAFAFA', 100: '#F5F5F5', 200: '#EEEEEE', 300: '#E0E0E0', 400: '#BDBDBD', 500: '#9E9E9E', 600: '#757575', 700: '#616161', 800: '#424242', 900: '#212121' },
          semantic: {
            success: { 50: '#F1F8E9', 100: '#DCEDC8', 200: '#C5E1A5', 300: '#AED581', 400: '#9CCC65', 500: '#8BC34A', 600: '#7CB342', 700: '#689F38', 800: '#558B2F', 900: '#33691E' },
            warning: { 50: '#FFFDE7', 100: '#FFF9C4', 200: '#FFF59D', 300: '#FFF176', 400: '#FFEE58', 500: '#FFEB3B', 600: '#FDD835', 700: '#F9A825', 800: '#F57F17', 900: '#FF8F00' },
            error: { 50: '#FFEBEE', 100: '#FFCDD2', 200: '#EF9A9A', 300: '#E57373', 400: '#EF5350', 500: '#F44336', 600: '#E53935', 700: '#D32F2F', 800: '#C62828', 900: '#B71C1C' },
            info: { 50: '#E3F2FD', 100: '#BBDEFB', 200: '#90CAF9', 300: '#64B5F6', 400: '#42A5F5', 500: '#2196F3', 600: '#1E88E5', 700: '#1976D2', 800: '#1565C0', 900: '#0D47A1' }
          },
          background: { 
            primary: '#FFFFFF', 
            secondary: '#F8F9FA', 
            tertiary: '#E9ECEF', 
            overlay: 'rgba(0, 0, 0, 0.5)' 
          },
          text: { 
            primary: '#212529', 
            secondary: '#6C757D', 
            disabled: '#ADB5BD', 
            inverse: '#FFFFFF' 
          },
          border: {
            primary: '#DEE2E6',
            secondary: '#E9ECEF',
            focus: '#28A745',
            error: '#DC3545'
          }
        }
      }
    },
    backendConfig: {
      service: 'haruspex',
      version: '2.0.0',
      protocol: 'http',
      endpoint: 'http://localhost:3000',
      endpoints: {
        analyze: '/api/analyze',
        health: '/health'
      }
    },
    caching: {
      strategy: 'lru',
      maxAge: 300000,
      maxSize: 50
    },
    validation: {
      schema: 'universal-skin-engine-v1.0'
    }
  };
}

function createBaseSkinDefinition(): UniversalSkinDefinition {
  return {
    metadata: {
      id: 'base-skin',
      name: 'Base Skin',
      version: '1.0.0',
      description: 'Base skin for inheritance',
      targetInterfaces: ['vscode', 'cli'],
      backendService: 'base',
      minimumVersion: '1.0.0',
      features: createTestFeatureMatrix(),
      performance: createTestPerformanceHints()
    },
    views: {
      treeViews: [
        {
          id: 'base-tree',
          name: 'Base Tree',
          icon: 'folder',
          dataProvider: 'base.provider'
        }
      ]
    },
    menus: {
      main: {
        id: 'base-menu',
        title: 'Base Menu',
        items: []
      }
    },
    commands: {
      primary: [],
      help: {
        format: 'markdown',
        sections: []
      }
    },
    workflows: {
      workflows: []
    },
    shortcuts: {},
    themes: {
      'default': {
        name: 'Base Theme',
        colors: {
          primary: { 50: '#F5F5F5', 100: '#E0E0E0', 200: '#BDBDBD', 300: '#9E9E9E', 400: '#757575', 500: '#000000', 600: '#424242', 700: '#303030', 800: '#212121', 900: '#000000' },
          secondary: { 50: '#F8F9FA', 100: '#E9ECEF', 200: '#DEE2E6', 300: '#CED4DA', 400: '#ADB5BD', 500: '#6C757D', 600: '#5A6268', 700: '#495057', 800: '#343A40', 900: '#212529' },
          accent: { 50: '#E8F5E8', 100: '#C8E6C9', 200: '#A5D6A7', 300: '#81C784', 400: '#66BB6A', 500: '#4CAF50', 600: '#43A047', 700: '#388E3C', 800: '#2E7D32', 900: '#1B5E20' },
          neutral: { 50: '#FAFAFA', 100: '#F5F5F5', 200: '#EEEEEE', 300: '#E0E0E0', 400: '#BDBDBD', 500: '#9E9E9E', 600: '#757575', 700: '#616161', 800: '#424242', 900: '#212121' },
          semantic: {
            success: { 50: '#F1F8E9', 100: '#DCEDC8', 200: '#C5E1A5', 300: '#AED581', 400: '#9CCC65', 500: '#8BC34A', 600: '#7CB342', 700: '#689F38', 800: '#558B2F', 900: '#33691E' },
            warning: { 50: '#FFFDE7', 100: '#FFF9C4', 200: '#FFF59D', 300: '#FFF176', 400: '#FFEE58', 500: '#FFEB3B', 600: '#FDD835', 700: '#F9A825', 800: '#F57F17', 900: '#FF8F00' },
            error: { 50: '#FFEBEE', 100: '#FFCDD2', 200: '#EF9A9A', 300: '#E57373', 400: '#EF5350', 500: '#F44336', 600: '#E53935', 700: '#D32F2F', 800: '#C62828', 900: '#B71C1C' },
            info: { 50: '#E3F2FD', 100: '#BBDEFB', 200: '#90CAF9', 300: '#64B5F6', 400: '#42A5F5', 500: '#2196F3', 600: '#1E88E5', 700: '#1976D2', 800: '#1565C0', 900: '#0D47A1' }
          },
          background: { 
            primary: '#FFFFFF', 
            secondary: '#F8F9FA', 
            tertiary: '#E9ECEF', 
            overlay: 'rgba(0, 0, 0, 0.5)' 
          },
          text: { 
            primary: '#000000', 
            secondary: '#6C757D', 
            disabled: '#ADB5BD', 
            inverse: '#FFFFFF' 
          },
          border: {
            primary: '#DEE2E6',
            secondary: '#E9ECEF',
            focus: '#007ACC',
            error: '#DC3545'
          }
        }
      }
    },
    backendConfig: {
      service: 'base',
      version: '1.0.0',
      protocol: 'http',
      endpoint: 'http://localhost:3000',
      endpoints: {}
    },
    caching: {
      strategy: 'lru',
      maxAge: 300000,
      maxSize: 50
    },
    validation: {
      schema: 'universal-skin-engine-v1.0'
    }
  };
}

function createChildSkinDefinition(parentId: string): UniversalSkinDefinition {
  return {
    metadata: {
      id: 'child-skin',
      name: 'Child Skin',
      version: '1.0.0',
      description: 'Child skin inheriting from base',
      targetInterfaces: ['vscode', 'cli'],
      backendService: 'child',
      minimumVersion: '1.0.0',
      features: createTestFeatureMatrix(),
      performance: createTestPerformanceHints(),
      parentSkin: parentId
    },
    views: {
      treeViews: [
        {
          id: 'child-tree',
          name: 'Child Tree',
          icon: 'file',
          dataProvider: 'child.provider'
        }
      ]
    },
    menus: {
      main: {
        id: 'child-menu',
        title: 'Child Menu',
        items: [
          {
            id: 'child-action',
            label: 'Child Action',
            command: 'child.action'
          }
        ]
      }
    },
    commands: {
      primary: [
        {
          id: 'child.action',
          name: 'action',
          title: 'Action',
          description: 'Child-specific action',
          category: 'Child'
        }
      ],
      help: {
        format: 'markdown',
        sections: []
      }
    },
    workflows: {
      workflows: []
    },
    shortcuts: {},
    themes: {
      'default': {
        name: 'Child Theme',
        colors: {
          primary: { 50: '#E3F2FD', 100: '#BBDEFB', 200: '#90CAF9', 300: '#64B5F6', 400: '#42A5F5', 500: '#007ACC', 600: '#1E88E5', 700: '#1976D2', 800: '#1565C0', 900: '#0D47A1' },
          secondary: { 50: '#F8F9FA', 100: '#E9ECEF', 200: '#DEE2E6', 300: '#CED4DA', 400: '#ADB5BD', 500: '#6C757D', 600: '#5A6268', 700: '#495057', 800: '#343A40', 900: '#212529' },
          accent: { 50: '#E8F5E8', 100: '#C8E6C9', 200: '#A5D6A7', 300: '#81C784', 400: '#66BB6A', 500: '#4CAF50', 600: '#43A047', 700: '#388E3C', 800: '#2E7D32', 900: '#1B5E20' },
          neutral: { 50: '#FAFAFA', 100: '#F5F5F5', 200: '#EEEEEE', 300: '#E0E0E0', 400: '#BDBDBD', 500: '#9E9E9E', 600: '#757575', 700: '#616161', 800: '#424242', 900: '#212121' },
          semantic: {
            success: { 50: '#F1F8E9', 100: '#DCEDC8', 200: '#C5E1A5', 300: '#AED581', 400: '#9CCC65', 500: '#8BC34A', 600: '#7CB342', 700: '#689F38', 800: '#558B2F', 900: '#33691E' },
            warning: { 50: '#FFFDE7', 100: '#FFF9C4', 200: '#FFF59D', 300: '#FFF176', 400: '#FFEE58', 500: '#FFEB3B', 600: '#FDD835', 700: '#F9A825', 800: '#F57F17', 900: '#FF8F00' },
            error: { 50: '#FFEBEE', 100: '#FFCDD2', 200: '#EF9A9A', 300: '#E57373', 400: '#EF5350', 500: '#F44336', 600: '#E53935', 700: '#D32F2F', 800: '#C62828', 900: '#B71C1C' },
            info: { 50: '#E3F2FD', 100: '#BBDEFB', 200: '#90CAF9', 300: '#64B5F6', 400: '#42A5F5', 500: '#2196F3', 600: '#1E88E5', 700: '#1976D2', 800: '#1565C0', 900: '#0D47A1' }
          },
          background: { 
            primary: '#F8F9FA', 
            secondary: '#E9ECEF', 
            tertiary: '#DEE2E6', 
            overlay: 'rgba(0, 0, 0, 0.5)' 
          },
          text: { 
            primary: '#212529', 
            secondary: '#6C757D', 
            disabled: '#ADB5BD', 
            inverse: '#FFFFFF' 
          },
          border: {
            primary: '#DEE2E6',
            secondary: '#E9ECEF',
            focus: '#007ACC',
            error: '#DC3545'
          }
        }
      }
    },
    backendConfig: {
      service: 'child',
      version: '1.0.0',
      protocol: 'http',
      endpoint: 'http://localhost:3000',
      endpoints: {}
    },
    caching: {
      strategy: 'lru',
      maxAge: 300000,
      maxSize: 50
    },
    validation: {
      schema: 'universal-skin-engine-v1.0'
    }
  };
}