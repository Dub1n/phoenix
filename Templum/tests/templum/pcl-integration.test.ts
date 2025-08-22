/**
 * PCL Component Migration Integration Tests
 * 
 * Comprehensive test suite validating successful transfer of Phoenix Code Lite
 * interface infrastructure to Templum's multi-interface architecture.
 * 
 * Generated: 2025-08-21
 */

import { UniversalLayoutEngine } from '../../src/rendering/universal-layout-engine';
import { UniversalCommandRegistry } from '../../src/commands/universal-command-registry';
import { UniversalMenuRegistry } from '../../src/menus/universal-menu-registry';
import { SessionContextFoundation } from '../../src/session/session-context-foundation';
import { StateSyncFoundation } from '../../src/state/state-sync-foundation';

describe('Phase 3: PCL Component Migration', () => {
  let sessionContext: SessionContextFoundation;
  let stateSync: StateSyncFoundation;

  beforeEach(async () => {
    // Initialize foundational components first
    sessionContext = new SessionContextFoundation();
    stateSync = new StateSyncFoundation();
    await sessionContext.initialize();
    await stateSync.initialize();
  });

  afterEach(async () => {
    await stateSync.cleanup();
    await sessionContext.cleanup();
  });

  describe('Unified Layout Engine Multi-Interface Rendering', () => {
    test('unified layout engine renders across all interfaces', async () => {
      const engine = new UniversalLayoutEngine();
      const skinDef = createTestSkinDefinition();
      
      const vscodeResult = await engine.renderForInterface(skinDef, 'vscode');
      const cliResult = await engine.renderForInterface(skinDef, 'cli');
      const cmdResult = await engine.renderForInterface(skinDef, 'command');
      
      expect(vscodeResult.success).toBe(true);
      expect(cliResult.success).toBe(true);
      expect(cmdResult.success).toBe(true);
      
      // Validate interface-specific rendering characteristics
      expect(vscodeResult.interfaceType).toBe('vscode');
      expect(cliResult.interfaceType).toBe('cli');
      expect(cmdResult.interfaceType).toBe('command');
    });

    test('layout engine maintains PCL compatibility', async () => {
      const engine = new UniversalLayoutEngine();
      const pclSkinDef = createPCLCompatibleSkinDefinition();
      
      const result = await engine.renderForInterface(pclSkinDef, 'cli');
      
      expect(result.success).toBe(true);
      expect(result.compatibilityMode).toBe('pcl');
      expect(result.renderTime).toBeLessThan(100); // Phase 2 baseline
    });
  });

  describe('Command Registry Multi-Backend Routing', () => {
    test('command registry handles multi-backend routing', async () => {
      const registry = new UniversalCommandRegistry(sessionContext);
      await registry.loadBackendCommands(['pcl', 'haruspex']);
      
      const pclCmd = await registry.executeCommand('pcl.analyze', [], {});
      const haruspexCmd = await registry.executeCommand('haruspex.predict', [], {});
      
      expect(pclCmd.backend).toBe('pcl');
      expect(haruspexCmd.backend).toBe('haruspex');
      expect(pclCmd.executionTime).toBeLessThan(50); // Phase 2 baseline
      expect(haruspexCmd.executionTime).toBeLessThan(50);
    });

    test('command registry maintains session context', async () => {
      const registry = new UniversalCommandRegistry(sessionContext);
      const testSessionId = 'test-session-001';
      
      sessionContext.setActiveSession(testSessionId);
      const result = await registry.executeCommand('pcl.status', [], {});
      
      expect(result.sessionId).toBe(testSessionId);
      expect(result.contextPreserved).toBe(true);
    });
  });

  describe('Cross-Interface State Synchronization', () => {
    test('state synchronization across interfaces', async () => {
      const menuRegistry = new UniversalMenuRegistry(sessionContext, stateSync);
      
      // Simulate state change in VSCode interface
      await menuRegistry.updateMenuState('vscode', { activeMenu: 'main' });
      
      // Verify synchronization to CLI interface
      const cliState = await menuRegistry.getMenuState('cli');
      expect(cliState.activeMenu).toBe('main');
      expect(cliState.syncLatency).toBeLessThan(150); // Phase 2 baseline
    });

    test('conflict resolution with coalescing windows', async () => {
      // Simulate rapid state changes from different interfaces
      const promises = [
        stateSync.updateState('vscode', { counter: 1 }),
        stateSync.updateState('cli', { counter: 2 }),
        stateSync.updateState('command', { counter: 3 })
      ];
      
      await Promise.all(promises);
      
      // Wait for coalescing window (100ms from Phase 2)
      await new Promise(resolve => setTimeout(resolve, 150));
      
      const finalState = await stateSync.getState();
      expect(finalState.counter).toBeDefined();
      expect(finalState.conflictsResolved).toBe(true);
    });
  });

  describe('Performance Validation', () => {
    test('maintains Phase 2 performance baselines', async () => {
      const engine = new UniversalLayoutEngine();
      const registry = new UniversalCommandRegistry(sessionContext);
      
      const startTime = Date.now();
      
      // Interface switching test
      await engine.renderForInterface(createTestSkinDefinition(), 'vscode');
      const switchTime = Date.now() - startTime;
      expect(switchTime).toBeLessThan(100);
      
      // Command routing test
      const cmdStartTime = Date.now();
      await registry.executeCommand('test.command', [], {});
      const cmdTime = Date.now() - cmdStartTime;
      expect(cmdTime).toBeLessThan(50);
    });

    test('memory usage within budget', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Initialize all core components
      const engine = new UniversalLayoutEngine();
      const registry = new UniversalCommandRegistry(sessionContext);
      const menuRegistry = new UniversalMenuRegistry(sessionContext, stateSync);
      
      // Perform typical operations
      await engine.renderForInterface(createTestSkinDefinition(), 'vscode');
      await registry.loadBackendCommands(['pcl']);
      await menuRegistry.loadMenus(['main', 'settings']);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
      
      expect(memoryIncrease).toBeLessThan(50); // Within Phase 2 budget
    });
  });

  describe('Integration Architecture Validation', () => {
    test('component dependencies are properly resolved', async () => {
      // Test dependency chain: Session → State → Registry → Engine
      expect(sessionContext.isInitialized()).toBe(true);
      expect(stateSync.isInitialized()).toBe(true);
      
      const registry = new UniversalCommandRegistry(sessionContext);
      expect(registry.hasSessionContext()).toBe(true);
      
      const menuRegistry = new UniversalMenuRegistry(sessionContext, stateSync);
      expect(menuRegistry.hasStateSync()).toBe(true);
    });

    test('interface adapters can be registered', async () => {
      const registry = new UniversalCommandRegistry(sessionContext);
      
      const vscodeAdapter = createMockInterfaceAdapter('vscode');
      const cliAdapter = createMockInterfaceAdapter('cli');
      
      await registry.registerInterfaceAdapter('vscode', vscodeAdapter);
      await registry.registerInterfaceAdapter('cli', cliAdapter);
      
      expect(registry.getRegisteredInterfaces()).toContain('vscode');
      expect(registry.getRegisteredInterfaces()).toContain('cli');
    });
  });
});

// Test Helper Functions
function createTestSkinDefinition(): any {
  return {
    name: 'test-skin',
    version: '1.0.0',
    interfaces: ['vscode', 'cli', 'command'],
    layout: {
      type: 'menu',
      items: [
        { id: 'main', label: 'Main Menu', type: 'submenu' },
        { id: 'settings', label: 'Settings', type: 'command' }
      ]
    },
    theme: {
      primaryColor: '#007ACC',
      backgroundColor: '#1E1E1E'
    }
  };
}

function createPCLCompatibleSkinDefinition(): any {
  return {
    name: 'pcl-compatible',
    version: '1.0.0',
    pclVersion: '2.0.0',
    interfaces: ['cli'], // PCL primary interface
    layout: {
      type: 'menu',
      items: [
        { id: 'analyze', label: 'Analyze', command: 'pcl.analyze' },
        { id: 'generate', label: 'Generate', command: 'pcl.generate' }
      ]
    }
  };
}

function createMockInterfaceAdapter(interfaceType: string): any {
  return {
    type: interfaceType,
    initialize: jest.fn().mockResolvedValue(true),
    render: jest.fn().mockResolvedValue({ success: true }),
    handleInput: jest.fn().mockResolvedValue({ handled: true }),
    cleanup: jest.fn().mockResolvedValue(true)
  };
}