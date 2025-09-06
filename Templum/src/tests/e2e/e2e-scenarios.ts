/**---
 * title: [E2E Test Scenarios - Complete User Workflow Definitions]
 * tags: [E2E-Scenarios, User-Workflows, Cross-Interface, Performance-Testing]
 * provides: [E2EScenarioLibrary, UserWorkflowScenarios, CrossInterfaceScenarios, PerformanceScenarios]
 * requires: [E2E-Test-Framework, Interface-Adapters, Backend-Services]
 * description: [Comprehensive collection of E2E test scenarios covering complete user workflows, cross-interface coordination, and performance validation]
 * ---*/

import { 
  E2ETestScenario 
} from '../../testing/e2e-test-framework';

// E2E Scenario Library
export class E2EScenarioLibrary {
  
  // Complete User Workflow Scenarios
  static getUserWorkflowScenarios(): E2ETestScenario[] {
    return [
      this.createVSCodeStartupWorkflow(),
      this.createCLISessionWorkflow(), 
      this.createSkinCustomizationWorkflow(),
      this.createMultiInterfaceWorkflow()
    ];
  }

  // Cross-Interface Validation Scenarios  
  static getCrossInterfaceScenarios(): E2ETestScenario[] {
    return [
      this.createInterfaceSwitchingScenario(),
      this.createStateSynchronizationScenario(),
      this.createConcurrentInterfaceScenario()
    ];
  }

  // Performance Validation Scenarios
  static getPerformanceScenarios(): E2ETestScenario[] {
    return [
      this.createPerformanceBaselineScenario(),
      this.createStressTestScenario(),
      this.createMemoryLeakDetectionScenario()
    ];
  }

  // User Workflow: VSCode Extension Startup and Interaction
  private static createVSCodeStartupWorkflow(): E2ETestScenario {
    return {
      id: 'workflow-vscode-startup',
      name: 'VSCode Extension Startup and Basic Interaction',
      description: 'Complete user workflow for VSCode extension activation, interface initialization, and basic operations',
      category: 'user-workflow',
      prerequisites: ['vscode-extension-installed', 'templum-orchestrator-ready'],
      timeoutMs: 30000,
      retryAttempts: 2,
      steps: [
        {
          id: 'step-vscode-init',
          name: 'Initialize VSCode Interface Adapter',
          interface: 'vscode',
          action: {
            type: 'initialize',
            payload: {
              extensionContext: 'mock-vscode-context',
              workspaceFolder: '/test/workspace'
            },
            timeout: 10000
          },
          expectedDuration: 2000,
          validation: {
            type: 'response',
            criteria: { initialized: true, interface: 'vscode' },
            tolerance: 0.1
          }
        },
        {
          id: 'step-backend-discovery',
          name: 'Discover Available Backend Services',
          interface: 'system',
          action: {
            type: 'command',
            payload: {
              command: 'discover-backends',
              args: { timeout: 5000 }
            },
            timeout: 8000
          },
          expectedDuration: 3000,
          validation: {
            type: 'response',
            criteria: { backendsFound: true, count: { min: 1 } },
            tolerance: 0.2
          }
        },
        {
          id: 'step-default-skin',
          name: 'Apply Default Skin Configuration',
          interface: 'vscode',
          action: {
            type: 'skin-apply',
            payload: {
              skinDefinition: {
                metadata: { id: 'default-vscode', name: 'Default VSCode Theme' },
                compatibleInterfaces: ['vscode'],
                themes: { default: { name: 'Default', type: 'light' } }
              }
            },
            timeout: 5000
          },
          expectedDuration: 1500,
          validation: {
            type: 'state',
            criteria: { skinApplied: true, activeTheme: 'default' },
            tolerance: 0.1
          }
        },
        {
          id: 'step-service-status',
          name: 'Check Service Status Display',
          interface: 'vscode',
          action: {
            type: 'command',
            payload: {
              command: 'show-service-status',
              args: {}
            },
            timeout: 3000
          },
          expectedDuration: 1000,
          validation: {
            type: 'side-effect',
            criteria: { webviewUpdated: true, servicesDisplayed: true },
            tolerance: 0.1
          }
        }
      ],
      expectedOutcome: {
        success: true,
        actualDuration: 0,
        performanceMetrics: {
          totalExecutionTime: 0,
          averageStepTime: 0,
          interfaceSwitchTime: 0,
          skinApplicationTime: 0,
          stateSyncTime: 0,
          memoryUsageMax: 0,
          cpuUsageAvg: 0
        },
        validationResults: [],
        errors: [],
        warnings: []
      }
    };
  }

  // User Workflow: CLI Session Management  
  private static createCLISessionWorkflow(): E2ETestScenario {
    return {
      id: 'workflow-cli-session',
      name: 'CLI Session Management and Commands',
      description: 'Complete CLI user workflow including session startup, command execution, and cleanup',
      category: 'user-workflow',
      prerequisites: ['templum-cli-available', 'backend-services-running'],
      timeoutMs: 25000,
      retryAttempts: 1,
      steps: [
        {
          id: 'step-cli-init',
          name: 'Initialize CLI Interface Adapter',
          interface: 'cli',
          action: {
            type: 'initialize',
            payload: {
              args: ['--interface', 'cli'],
              environment: { NODE_ENV: 'test' }
            },
            timeout: 8000
          },
          expectedDuration: 2000,
          validation: {
            type: 'response',
            criteria: { initialized: true, interface: 'cli' },
            tolerance: 0.1
          }
        },
        {
          id: 'step-list-backends',
          name: 'List Available Backend Services',
          interface: 'cli',
          action: {
            type: 'command',
            payload: {
              command: 'list-backends',
              args: ['--format', 'table']
            },
            timeout: 5000
          },
          expectedDuration: 1500,
          validation: {
            type: 'response',
            criteria: { output: { contains: ['Backend', 'Status', 'Health'] } },
            tolerance: 0.2
          }
        },
        {
          id: 'step-interactive-menu',
          name: 'Display Interactive Menu',
          interface: 'cli',
          action: {
            type: 'command',
            payload: {
              command: 'interactive-menu',
              args: ['--skin', 'cli-default']
            },
            timeout: 3000
          },
          expectedDuration: 1000,
          validation: {
            type: 'side-effect',
            criteria: { menuDisplayed: true, interactionReady: true },
            tolerance: 0.1
          }
        }
      ],
      expectedOutcome: {
        success: true,
        actualDuration: 0,
        performanceMetrics: {
          totalExecutionTime: 0,
          averageStepTime: 0,
          interfaceSwitchTime: 0,
          skinApplicationTime: 0,
          stateSyncTime: 0,
          memoryUsageMax: 0,
          cpuUsageAvg: 0
        },
        validationResults: [],
        errors: [],
        warnings: []
      }
    };
  }

  // User Workflow: Skin Customization Process
  private static createSkinCustomizationWorkflow(): E2ETestScenario {
    return {
      id: 'workflow-skin-customization',
      name: 'Skin Customization and Application Process',
      description: 'Complete workflow for customizing and applying skin definitions across interfaces',
      category: 'user-workflow',
      prerequisites: ['universal-skin-engine-ready', 'interface-adapters-ready'],
      timeoutMs: 35000,
      retryAttempts: 2,
      steps: [
        {
          id: 'step-load-base-skin',
          name: 'Load Base Skin Definition',
          interface: 'system',
          action: {
            type: 'skin-apply',
            payload: {
              skinDefinition: {
                metadata: { 
                  id: 'base-customizable', 
                  name: 'Base Customizable Skin',
                  version: '1.0.0'
                },
                compatibleInterfaces: ['vscode', 'cli'],
                themes: {
                  light: { name: 'Light Theme', type: 'light' },
                  dark: { name: 'Dark Theme', type: 'dark' }
                }
              }
            },
            timeout: 8000
          },
          expectedDuration: 2500,
          validation: {
            type: 'state',
            criteria: { baseSkinLoaded: true, themesAvailable: 2 },
            tolerance: 0.1
          }
        },
        {
          id: 'step-customize-colors',
          name: 'Customize Color Palette',
          interface: 'system',
          action: {
            type: 'command',
            payload: {
              command: 'customize-skin',
              args: {
                skinId: 'base-customizable',
                customizations: {
                  colors: {
                    primary: { 500: '#007ACC' },
                    secondary: { 500: '#6C757D' }
                  }
                }
              }
            },
            timeout: 5000
          },
          expectedDuration: 1500,
          validation: {
            type: 'state',
            criteria: { colorsCustomized: true, customizationValid: true },
            tolerance: 0.1
          }
        },
        {
          id: 'step-apply-to-vscode',
          name: 'Apply Customized Skin to VSCode',
          interface: 'vscode',
          action: {
            type: 'skin-apply',
            payload: {
              skinId: 'base-customizable',
              theme: 'light'
            },
            timeout: 6000
          },
          expectedDuration: 2000,
          validation: {
            type: 'side-effect',
            criteria: { vscodeUpdated: true, themeApplied: true },
            tolerance: 0.2
          }
        },
        {
          id: 'step-apply-to-cli',
          name: 'Apply Customized Skin to CLI',
          interface: 'cli',
          action: {
            type: 'skin-apply',
            payload: {
              skinId: 'base-customizable',
              theme: 'dark'
            },
            timeout: 4000
          },
          expectedDuration: 1000,
          validation: {
            type: 'side-effect',
            criteria: { cliUpdated: true, colorsApplied: true },
            tolerance: 0.2
          }
        }
      ],
      expectedOutcome: {
        success: true,
        actualDuration: 0,
        performanceMetrics: {
          totalExecutionTime: 0,
          averageStepTime: 0,
          interfaceSwitchTime: 0,
          skinApplicationTime: 0,
          stateSyncTime: 0,
          memoryUsageMax: 0,
          cpuUsageAvg: 0
        },
        validationResults: [],
        errors: [],
        warnings: []
      }
    };
  }

  // User Workflow: Multi-Interface Coordination
  private static createMultiInterfaceWorkflow(): E2ETestScenario {
    return {
      id: 'workflow-multi-interface',
      name: 'Multi-Interface Coordination Workflow',
      description: 'Workflow demonstrating coordination between multiple active interfaces',
      category: 'user-workflow',
      prerequisites: ['multiple-interfaces-supported', 'state-sync-ready'],
      timeoutMs: 40000,
      retryAttempts: 1,
      steps: [
        {
          id: 'step-init-multiple',
          name: 'Initialize Multiple Interface Adapters',
          interface: 'system',
          action: {
            type: 'initialize',
            payload: {
              interfaces: ['vscode', 'cli', 'command'],
              concurrent: true
            },
            timeout: 12000
          },
          expectedDuration: 4000,
          validation: {
            type: 'response',
            criteria: { interfacesInitialized: 3, allReady: true },
            tolerance: 0.2
          }
        },
        {
          id: 'step-sync-state',
          name: 'Synchronize State Across Interfaces',
          interface: 'system',
          action: {
            type: 'state-sync',
            payload: {
              stateUpdate: {
                globalState: { theme: 'unified', mode: 'production' },
                sessionState: { user: 'test-user', workspace: '/test' }
              },
              targetInterfaces: ['vscode', 'cli', 'command']
            },
            timeout: 8000
          },
          expectedDuration: 2500,
          validation: {
            type: 'state',
            criteria: { stateSynced: true, interfaceConsistency: 100 },
            tolerance: 0.1
          }
        },
        {
          id: 'step-command-propagation',
          name: 'Test Command Propagation Between Interfaces',
          interface: 'vscode',
          action: {
            type: 'command',
            payload: {
              command: 'broadcast-command',
              args: {
                targetCommand: 'refresh-all',
                propagateToInterfaces: ['cli', 'command']
              }
            },
            timeout: 6000
          },
          expectedDuration: 2000,
          validation: {
            type: 'side-effect',
            criteria: { commandPropagated: true, interfacesResponded: 2 },
            tolerance: 0.2
          }
        }
      ],
      expectedOutcome: {
        success: true,
        actualDuration: 0,
        performanceMetrics: {
          totalExecutionTime: 0,
          averageStepTime: 0,
          interfaceSwitchTime: 0,
          skinApplicationTime: 0,
          stateSyncTime: 0,
          memoryUsageMax: 0,
          cpuUsageAvg: 0
        },
        validationResults: [],
        errors: [],
        warnings: []
      }
    };
  }

  // Cross-Interface: Interface Switching Validation
  private static createInterfaceSwitchingScenario(): E2ETestScenario {
    return {
      id: 'cross-interface-switching',
      name: 'Interface Switching and State Preservation',
      description: 'Validates smooth interface switching while preserving user state and context',
      category: 'cross-interface',
      prerequisites: ['multiple-interfaces-ready', 'state-persistence-enabled'],
      timeoutMs: 20000,
      retryAttempts: 1,
      steps: [
        {
          id: 'step-establish-vscode-state',
          name: 'Establish State in VSCode Interface',
          interface: 'vscode',
          action: {
            type: 'command',
            payload: {
              command: 'setup-workspace',
              args: { workspace: '/test/project', skin: 'vscode-dark' }
            },
            timeout: 5000
          },
          expectedDuration: 2000,
          validation: {
            type: 'state',
            criteria: { workspaceActive: true, skinApplied: 'vscode-dark' },
            tolerance: 0.1
          }
        },
        {
          id: 'step-switch-to-cli',
          name: 'Switch to CLI Interface',
          interface: 'system',
          action: {
            type: 'interface-switch',
            payload: {
              fromInterface: 'vscode',
              toInterface: 'cli',
              preserveState: true
            },
            timeout: 4000
          },
          expectedDuration: 1500,
          validation: {
            type: 'response',
            criteria: { switchSuccessful: true, statePreserved: true },
            tolerance: 0.2
          }
        },
        {
          id: 'step-verify-cli-state',
          name: 'Verify State Preservation in CLI',
          interface: 'cli',
          action: {
            type: 'command',
            payload: {
              command: 'verify-workspace-state',
              args: {}
            },
            timeout: 3000
          },
          expectedDuration: 1000,
          validation: {
            type: 'response',
            criteria: { workspace: '/test/project', skinConsistent: true },
            tolerance: 0.1
          }
        }
      ],
      expectedOutcome: {
        success: true,
        actualDuration: 0,
        performanceMetrics: {
          totalExecutionTime: 0,
          averageStepTime: 0,
          interfaceSwitchTime: 0,
          skinApplicationTime: 0,
          stateSyncTime: 0,
          memoryUsageMax: 0,
          cpuUsageAvg: 0
        },
        validationResults: [],
        errors: [],
        warnings: []
      }
    };
  }

  // Cross-Interface: State Synchronization Validation
  private static createStateSynchronizationScenario(): E2ETestScenario {
    return {
      id: 'cross-interface-state-sync',
      name: 'Cross-Interface State Synchronization',
      description: 'Validates state synchronization mechanisms across multiple active interfaces',
      category: 'cross-interface',
      prerequisites: ['state-sync-system-ready', 'multiple-interfaces-active'],
      timeoutMs: 15000,
      retryAttempts: 2,
      steps: [
        {
          id: 'step-concurrent-state-changes',
          name: 'Generate Concurrent State Changes',
          interface: 'system',
          action: {
            type: 'state-sync',
            payload: {
              concurrentUpdates: [
                { interface: 'vscode', state: { currentFile: 'test.ts' } },
                { interface: 'cli', state: { currentDirectory: '/test' } },
                { interface: 'command', state: { lastCommand: 'status' } }
              ]
            },
            timeout: 6000
          },
          expectedDuration: 2000,
          validation: {
            type: 'state',
            criteria: { allUpdatesProcessed: true, conflictsResolved: true },
            tolerance: 0.2
          }
        },
        {
          id: 'step-verify-sync-consistency',
          name: 'Verify Synchronization Consistency',
          interface: 'system',
          action: {
            type: 'performance-check',
            payload: {
              checkType: 'state-consistency',
              interfaces: ['vscode', 'cli', 'command']
            },
            timeout: 4000
          },
          expectedDuration: 1500,
          validation: {
            type: 'performance',
            criteria: { consistencyScore: { min: 95 } },
            tolerance: 5
          }
        }
      ],
      expectedOutcome: {
        success: true,
        actualDuration: 0,
        performanceMetrics: {
          totalExecutionTime: 0,
          averageStepTime: 0,
          interfaceSwitchTime: 0,
          skinApplicationTime: 0,
          stateSyncTime: 0,
          memoryUsageMax: 0,
          cpuUsageAvg: 0
        },
        validationResults: [],
        errors: [],
        warnings: []
      }
    };
  }

  // Cross-Interface: Concurrent Interface Operations
  private static createConcurrentInterfaceScenario(): E2ETestScenario {
    return {
      id: 'cross-interface-concurrent',
      name: 'Concurrent Interface Operations',
      description: 'Validates system behavior under concurrent operations across multiple interfaces',
      category: 'cross-interface',
      prerequisites: ['concurrent-operations-supported', 'resource-management-ready'],
      timeoutMs: 25000,
      retryAttempts: 1,
      steps: [
        {
          id: 'step-concurrent-commands',
          name: 'Execute Concurrent Commands Across Interfaces',
          interface: 'system',
          action: {
            type: 'command',
            payload: {
              concurrentCommands: [
                { interface: 'vscode', command: 'heavy-computation', args: {} },
                { interface: 'cli', command: 'file-operations', args: { count: 100 } },
                { interface: 'command', command: 'batch-process', args: { items: 50 } }
              ]
            },
            timeout: 15000
          },
          expectedDuration: 8000,
          validation: {
            type: 'performance',
            criteria: { 
              allCompleted: true, 
              maxResponseTime: { max: 10000 },
              resourceUsage: { max: 80 }
            },
            tolerance: 10
          }
        },
        {
          id: 'step-resource-monitoring',
          name: 'Monitor System Resources During Concurrent Operations',
          interface: 'system',
          action: {
            type: 'performance-check',
            payload: {
              checkType: 'resource-monitoring',
              duration: 5000,
              metrics: ['memory', 'cpu', 'io']
            },
            timeout: 8000
          },
          expectedDuration: 5000,
          validation: {
            type: 'performance',
            criteria: {
              memoryLeakDetected: false,
              cpuUsage: { max: 90 },
              ioBottleneck: false
            },
            tolerance: 15
          }
        }
      ],
      expectedOutcome: {
        success: true,
        actualDuration: 0,
        performanceMetrics: {
          totalExecutionTime: 0,
          averageStepTime: 0,
          interfaceSwitchTime: 0,
          skinApplicationTime: 0,
          stateSyncTime: 0,
          memoryUsageMax: 0,
          cpuUsageAvg: 0
        },
        validationResults: [],
        errors: [],
        warnings: []
      }
    };
  }

  // Performance: Performance Baseline Establishment
  private static createPerformanceBaselineScenario(): E2ETestScenario {
    return {
      id: 'performance-baseline',
      name: 'Performance Baseline Establishment',
      description: 'Establishes performance baselines for system operations under normal load',
      category: 'performance',
      prerequisites: ['system-idle', 'performance-monitoring-ready'],
      timeoutMs: 30000,
      retryAttempts: 3,
      steps: [
        {
          id: 'step-measure-startup-time',
          name: 'Measure System Startup Performance',
          interface: 'system',
          action: {
            type: 'performance-check',
            payload: {
              checkType: 'startup-performance',
              iterations: 5
            },
            timeout: 15000
          },
          expectedDuration: 10000,
          validation: {
            type: 'performance',
            criteria: {
              averageStartupTime: { max: 3000 },
              consistentPerformance: true
            },
            tolerance: 500
          }
        },
        {
          id: 'step-measure-operation-times',
          name: 'Measure Standard Operation Performance',
          interface: 'system',
          action: {
            type: 'performance-check',
            payload: {
              checkType: 'operation-performance',
              operations: [
                'skin-application',
                'interface-switching',
                'state-synchronization',
                'command-execution'
              ]
            },
            timeout: 12000
          },
          expectedDuration: 8000,
          validation: {
            type: 'performance',
            criteria: {
              skinApplicationTime: { max: 2000 },
              interfaceSwitchTime: { max: 1500 },
              stateSyncTime: { max: 1000 },
              commandExecutionTime: { max: 500 }
            },
            tolerance: 200
          }
        }
      ],
      expectedOutcome: {
        success: true,
        actualDuration: 0,
        performanceMetrics: {
          totalExecutionTime: 0,
          averageStepTime: 0,
          interfaceSwitchTime: 0,
          skinApplicationTime: 0,
          stateSyncTime: 0,
          memoryUsageMax: 0,
          cpuUsageAvg: 0
        },
        validationResults: [],
        errors: [],
        warnings: []
      }
    };
  }

  // Performance: Stress Testing
  private static createStressTestScenario(): E2ETestScenario {
    return {
      id: 'performance-stress-test',
      name: 'System Stress Testing',
      description: 'Tests system behavior under high load and stress conditions',
      category: 'performance',
      prerequisites: ['system-ready', 'resource-monitoring-enabled'],
      timeoutMs: 60000,
      retryAttempts: 1,
      steps: [
        {
          id: 'step-high-frequency-operations',
          name: 'Execute High-Frequency Operations',
          interface: 'system',
          action: {
            type: 'command',
            payload: {
              stressTest: {
                operationsPerSecond: 50,
                duration: 20000,
                operationTypes: ['command', 'state-sync', 'skin-apply']
              }
            },
            timeout: 25000
          },
          expectedDuration: 20000,
          validation: {
            type: 'performance',
            criteria: {
              operationsCompleted: { min: 900 },
              errorRate: { max: 5 },
              averageResponseTime: { max: 1000 }
            },
            tolerance: 100
          }
        },
        {
          id: 'step-memory-stress',
          name: 'Memory Stress Testing',
          interface: 'system',
          action: {
            type: 'performance-check',
            payload: {
              checkType: 'memory-stress',
              allocateMemory: 100, // MB
              duration: 10000
            },
            timeout: 15000
          },
          expectedDuration: 10000,
          validation: {
            type: 'performance',
            criteria: {
              memoryLeaksDetected: false,
              gcEfficiency: { min: 80 },
              memoryRecovered: { min: 90 }
            },
            tolerance: 10
          }
        }
      ],
      expectedOutcome: {
        success: true,
        actualDuration: 0,
        performanceMetrics: {
          totalExecutionTime: 0,
          averageStepTime: 0,
          interfaceSwitchTime: 0,
          skinApplicationTime: 0,
          stateSyncTime: 0,
          memoryUsageMax: 0,
          cpuUsageAvg: 0
        },
        validationResults: [],
        errors: [],
        warnings: []
      }
    };
  }

  // Performance: Memory Leak Detection
  private static createMemoryLeakDetectionScenario(): E2ETestScenario {
    return {
      id: 'performance-memory-leak',
      name: 'Memory Leak Detection and Prevention',
      description: 'Detects potential memory leaks through extended operation monitoring',
      category: 'performance',
      prerequisites: ['memory-monitoring-enabled', 'extended-test-environment'],
      timeoutMs: 120000,
      retryAttempts: 1,
      steps: [
        {
          id: 'step-baseline-memory',
          name: 'Establish Memory Usage Baseline',
          interface: 'system',
          action: {
            type: 'performance-check',
            payload: {
              checkType: 'memory-baseline',
              stabilizationTime: 5000
            },
            timeout: 8000
          },
          expectedDuration: 5000,
          validation: {
            type: 'performance',
            criteria: { baselineEstablished: true },
            tolerance: 0.1
          }
        },
        {
          id: 'step-extended-operations',
          name: 'Execute Extended Operations Cycle',
          interface: 'system',
          action: {
            type: 'command',
            payload: {
              extendedTest: {
                cycles: 100,
                operationsPerCycle: 10,
                cycleDelay: 500,
                monitorMemory: true
              }
            },
            timeout: 60000
          },
          expectedDuration: 50000,
          validation: {
            type: 'performance',
            criteria: {
              cyclesCompleted: 100,
              memoryGrowthRate: { max: 2 }, // % per cycle
              memoryStabilized: true
            },
            tolerance: 5
          }
        },
        {
          id: 'step-cleanup-verification',
          name: 'Verify Resource Cleanup',
          interface: 'system',
          action: {
            type: 'performance-check',
            payload: {
              checkType: 'cleanup-verification',
              gcTrigger: true,
              verificationDelay: 10000
            },
            timeout: 15000
          },
          expectedDuration: 10000,
          validation: {
            type: 'performance',
            criteria: {
              memoryRecovered: { min: 85 },
              resourcesReleased: true,
              noHandleLeaks: true
            },
            tolerance: 10
          }
        }
      ],
      expectedOutcome: {
        success: true,
        actualDuration: 0,
        performanceMetrics: {
          totalExecutionTime: 0,
          averageStepTime: 0,
          interfaceSwitchTime: 0,
          skinApplicationTime: 0,
          stateSyncTime: 0,
          memoryUsageMax: 0,
          cpuUsageAvg: 0
        },
        validationResults: [],
        errors: [],
        warnings: []
      }
    };
  }

  // Get All Scenarios
  static getAllScenarios(): E2ETestScenario[] {
    return [
      ...this.getUserWorkflowScenarios(),
      ...this.getCrossInterfaceScenarios(),
      ...this.getPerformanceScenarios()
    ];
  }

  // Get Scenarios by Category
  static getScenariosByCategory(category: 'user-workflow' | 'cross-interface' | 'performance' | 'integration'): E2ETestScenario[] {
    return this.getAllScenarios().filter(scenario => scenario.category === category);
  }
}