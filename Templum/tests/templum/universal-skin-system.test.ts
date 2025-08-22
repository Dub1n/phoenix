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
              description: 'Run full analysis pipeline',
              steps: [
                { command: 'haruspex.analyzeCode', waitForCompletion: true },
                { command: 'haruspex.generatePredictions', waitForCompletion: true },
                { command: 'haruspex.showResults', waitForCompletion: false }
              ]
            }
          ]
        },
        shortcuts: {
          'analyze': 'Ctrl+Shift+A',
          'predict': 'Ctrl+Shift+P',
          'refresh': 'F5'
        },
        theme: {
          name: 'Haruspex Default',
          colors: {
            primary: '#007ACC',
            secondary: '#6C757D',
            success: '#28A745',
            warning: '#FFC107',
            error: '#DC3545',
            background: {
              primary: '#FFFFFF',
              secondary: '#F8F9FA'
            },
            text: {
              primary: '#212529',
              secondary: '#6C757D'
            }
          },
          typography: {
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: {
              small: '12px',
              medium: '14px',
              large: '16px'
            }
          }
        },
        backendConfig: {
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
    metadata: {
      id: 'pcl-tdd-workflow',
      name: 'PCL TDD Workflow Skin',
      version: '1.0.0',
      description: 'Phoenix Code Lite TDD workflow interface',
      targetInterfaces: ['vscode', 'cli', 'command'],
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
          description: 'Standard TDD cycle',
          steps: [
            { command: 'pcl.writeTest', waitForCompletion: true },
            { command: 'pcl.runTest', waitForCompletion: true },
            { command: 'pcl.implementCode', waitForCompletion: true }
          ]
        }
      ]
    },
    shortcuts: {},
    theme: {
      name: 'PCL Default',
      colors: {
        primary: '#007ACC',
        secondary: '#6C757D',
        background: { primary: '#FFFFFF' },
        text: { primary: '#212529' }
      }
    },
    backendConfig: {
      service: 'pcl',
      version: '2.0.0',
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
          description: 'Run full code analysis',
          steps: [
            { command: 'haruspex.analyze', waitForCompletion: true }
          ]
        }
      ]
    },
    shortcuts: {},
    theme: {
      name: 'Haruspex Default',
      colors: {
        primary: '#28A745',
        secondary: '#6C757D',
        background: { primary: '#FFFFFF' },
        text: { primary: '#212529' }
      }
    },
    backendConfig: {
      service: 'haruspex',
      version: '2.0.0',
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
    theme: {
      name: 'Base Theme',
      colors: {
        primary: '#000000',
        background: { primary: '#FFFFFF' },
        text: { primary: '#000000' }
      }
    },
    backendConfig: {
      service: 'base',
      version: '1.0.0',
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
    theme: {
      name: 'Child Theme',
      colors: {
        primary: '#007ACC',
        background: { primary: '#F8F9FA' },
        text: { primary: '#212529' }
      }
    },
    backendConfig: {
      service: 'child',
      version: '1.0.0',
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