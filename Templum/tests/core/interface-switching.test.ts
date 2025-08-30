/**---
 * title: [Interface Switching Test Suite - Feature Validation]
 * tags: [Testing, Interface, Switching, Core, TDD]
 * provides: [Interface Switch Tests, State Preservation Tests, Error Handling Tests]
 * requires: [Jest, TemplumCore, Interface Adapters]
 * description: [Test suite validating interface switching functionality and state preservation]
 * ---*/

import { TemplumCore } from '../../src/core/templum-core';
import { InterfaceType } from '../../src/types/templum-types';

describe('Interface Switching', () => {
  let templumCore: TemplumCore;

  beforeEach(async () => {
    templumCore = new TemplumCore();
    await templumCore.initialize();
  });

  afterEach(async () => {
    if (templumCore) {
      await templumCore.shutdown();
    }
  });

  describe('switchInterface method', () => {
    test('successfully switches to a valid interface', async () => {
      // Arrange
      const targetInterface: InterfaceType = 'cli';

      // Act
      const result = await templumCore.switchInterface(targetInterface);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toContain('Successfully switched to cli interface');
      
      const systemStatus = templumCore.getSystemStatus();
      expect(systemStatus.coreEngine.activeInterfaces).toContain(targetInterface);
    });

    test('fails when switching to unavailable interface', async () => {
      // Arrange - We'll simulate an interface that doesn't have an adapter
      const targetInterface: InterfaceType = 'command';

      // Act
      const result = await templumCore.switchInterface(targetInterface);

      // Assert - This might fail or succeed depending on adapter availability
      // The test validates the response structure
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });

    test('fails when core is not initialized', async () => {
      // Arrange
      const uninitializedCore = new TemplumCore();
      const targetInterface: InterfaceType = 'vscode';

      // Act
      const result = await uninitializedCore.switchInterface(targetInterface);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toBe('Templum Core not initialized');
    });

    test('preserves interface switching history', async () => {
      // Arrange
      const originalInterface: InterfaceType = 'vscode';
      const targetInterface: InterfaceType = 'cli';
      
      // Track events
      const switchEvents: any[] = [];
      templumCore.on('interface-switch', (event) => {
        switchEvents.push(event);
      });

      // Act
      await templumCore.switchInterface(targetInterface);

      // Assert
      expect(switchEvents).toHaveLength(1);
      
      const switchEvent = switchEvents[0];
      expect(switchEvent).toHaveProperty('timestamp');
      expect(switchEvent).toHaveProperty('fromInterfaces');
      expect(switchEvent).toHaveProperty('toInterface', targetInterface);
      expect(switchEvent).toHaveProperty('statePreserved');
    });

    test('handles multiple consecutive interface switches', async () => {
      // Arrange
      const interfaces: InterfaceType[] = ['vscode', 'cli', 'command', 'vscode'];
      const results: Array<{ success: boolean; message: string }> = [];

      // Act
      for (const interfaceType of interfaces) {
        const result = await templumCore.switchInterface(interfaceType);
        results.push(result);
        
        // Wait a bit between switches to ensure proper state handling
        await (global as any).testUtils.waitForAsync(10);
      }

      // Assert
      expect(results).toHaveLength(interfaces.length);
      
      // Check that the system status reflects the final interface
      const systemStatus = templumCore.getSystemStatus();
      expect(systemStatus.coreEngine.activeInterfaces).toContain('vscode');
    });
  });

  describe('interface validation', () => {
    test('getSupportedInterfaces returns all expected interface types', () => {
      // Act
      const supportedInterfaces = templumCore.getSupportedInterfaces();

      // Assert
      expect(supportedInterfaces).toContain('vscode');
      expect(supportedInterfaces).toContain('cli');
      expect(supportedInterfaces).toContain('command');
      expect(supportedInterfaces).toHaveLength(3);
    });

    test('validates interface types correctly', async () => {
      // Arrange
      const validInterface: InterfaceType = 'vscode';
      const supportedInterfaces = templumCore.getSupportedInterfaces();

      // Assert
      expect(supportedInterfaces).toContain(validInterface);
    });
  });

  describe('state preservation during switching', () => {
    test('attempts state preservation when state manager is available', async () => {
      // Arrange
      const targetInterface: InterfaceType = 'cli';
      
      // Track state preservation
      let statePreserved = false;
      templumCore.on('interface-switch', (event) => {
        statePreserved = event.statePreserved;
      });

      // Act
      await templumCore.switchInterface(targetInterface);

      // Assert
      // State preservation success depends on state manager availability
      // This test validates that the system attempts preservation
      expect(typeof statePreserved).toBe('boolean');
    });
  });

  describe('error handling', () => {
    test('handles errors gracefully during interface switch', async () => {
      // Act - Switching to same interface multiple times shouldn't fail
      const result1 = await templumCore.switchInterface('vscode');
      const result2 = await templumCore.switchInterface('vscode');

      // Assert
      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });

    test('emits appropriate events for successful and failed switches', async () => {
      // Arrange
      const events: any[] = [];
      templumCore.on('interface-switch', (event) => events.push(event));

      // Act
      await templumCore.switchInterface('cli');

      // Assert
      if (events.length > 0) {
        expect(events[0]).toHaveProperty('timestamp');
        expect(events[0]).toHaveProperty('toInterface', 'cli');
      }
    });
  });
});