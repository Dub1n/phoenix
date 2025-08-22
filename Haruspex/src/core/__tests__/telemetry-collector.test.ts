/**
 * Unit tests for TelemetryCollector implementation
 * 
 * @implementation Based on Phase 2 Core Engine Implementation
 * @created 2025-08-14
 */

import * as vscode from 'vscode';
import { TelemetryCollector, TelemetryConfig } from '../telemetry-collector';

// Mock VSCode APIs
jest.mock('vscode', () => ({
  window: {
    createOutputChannel: jest.fn().mockReturnValue({
      appendLine: jest.fn(),
      dispose: jest.fn()
    }),
    showWarningMessage: jest.fn()
  }
}));

describe('TelemetryCollector', () => {
  const defaultConfig: TelemetryConfig = {
    privacyCompliant: true,
    performanceMetrics: true,
    errorReporting: true,
    outputChannel: true,
    statusBarNotifications: false
  };

  describe('Constructor', () => {
    it('should create telemetry collector with privacy compliance enabled', () => {
      const collector = new TelemetryCollector(defaultConfig);
      expect(collector).toBeInstanceOf(TelemetryCollector);
    });

    it('should throw error when privacy compliance is disabled', () => {
      const invalidConfig = { ...defaultConfig, privacyCompliant: false };
      expect(() => new TelemetryCollector(invalidConfig)).toThrow('TelemetryCollector requires privacyCompliant to be true');
    });

    it('should create output channel when enabled', () => {
      new TelemetryCollector(defaultConfig);
      expect(vscode.window.createOutputChannel).toHaveBeenCalledWith('Haruspex Telemetry');
    });

    it('should not create output channel when disabled', () => {
      const config = { ...defaultConfig, outputChannel: false };
      (vscode.window.createOutputChannel as jest.Mock).mockClear();
      
      new TelemetryCollector(config);
      expect(vscode.window.createOutputChannel).not.toHaveBeenCalled();
    });
  });

  describe('Event Recording', () => {
    let collector: TelemetryCollector;

    beforeEach(() => {
      collector = new TelemetryCollector(defaultConfig);
    });

    it('should record basic events', () => {
      collector.recordEvent('test_event', { value: 42 }, 'test-source');
      
      const metrics = collector.getMetrics();
      expect(metrics.totalEvents).toBe(1);
      expect(metrics.eventsByType['test_event']).toBe(1);
      expect(metrics.eventsBySource['test-source']).toBe(1);
    });

    it('should record events with default parameters', () => {
      collector.recordEvent('simple_event');
      
      const metrics = collector.getMetrics();
      expect(metrics.totalEvents).toBe(1);
      expect(metrics.eventsBySource['unknown']).toBe(1);
    });

    it('should sanitize PII from event data', () => {
      collector.recordEvent('test_event', {
        filePath: '/Users/john/project/file.ts',
        userName: 'john.doe',
        email: 'john@example.com',
        safeValue: 42
      });
      
      const recentEvents = collector.getMetrics().recentEvents;
      const event = recentEvents[0];
      
      // PII fields should be removed
      expect(event.data).not.toHaveProperty('filePath');
      expect(event.data).not.toHaveProperty('userName');
      expect(event.data).not.toHaveProperty('email');
      
      // Safe values should remain
      expect(event.data.safeValue).toBe(42);
    });

    it('should sanitize file paths in string values', () => {
      collector.recordEvent('path_event', {
        message: 'Error in /Users/john/project/src/file.ts at line 42',
        description: 'Processing C:\\Users\\jane\\Documents\\project\\file.js'
      });
      
      const recentEvents = collector.getMetrics().recentEvents;
      const event = recentEvents[0];
      
      expect(event.data.message).toContain('[PATH]/');
      expect(event.data.message).toContain('[USER]');
      expect(event.data.description).toContain('[PATH]\\');
      expect(event.data.description).toContain('[USER]');
    });

    it('should sanitize email addresses', () => {
      collector.recordEvent('email_event', {
        message: 'Contact john.doe@example.com for support'
      });
      
      const recentEvents = collector.getMetrics().recentEvents;
      const event = recentEvents[0];
      
      expect(event.data.message).toBe('Contact [EMAIL] for support');
    });

    it('should handle nested objects in data', () => {
      collector.recordEvent('nested_event', {
        config: {
          filePath: '/secret/path/config.json',
          settings: {
            userName: 'secret_user',
            timeout: 5000
          }
        }
      });
      
      const recentEvents = collector.getMetrics().recentEvents;
      const event = recentEvents[0];
      
      // Nested PII should be removed
      const eventData = event.data as any;
      expect(eventData.config).not.toHaveProperty('filePath');
      expect(eventData.config.settings).not.toHaveProperty('userName');
      
      // Safe nested values should remain
      expect(eventData.config.settings.timeout).toBe(5000);
    });

    it('should handle arrays in data', () => {
      collector.recordEvent('array_event', {
        files: ['/path/to/file1.ts', '/path/to/file2.ts'],
        numbers: [1, 2, 3]
      });
      
      const recentEvents = collector.getMetrics().recentEvents;
      const event = recentEvents[0];
      
      // Arrays should be processed but PII sanitized
      const eventData = event.data as any;
      expect(eventData.files).toHaveLength(2);
      expect(eventData.files[0]).toContain('[PATH]/');
      expect(eventData.numbers).toEqual([1, 2, 3]);
    });
  });

  describe('Specialized Event Methods', () => {
    let collector: TelemetryCollector;

    beforeEach(() => {
      collector = new TelemetryCollector(defaultConfig);
    });

    it('should record performance events when enabled', () => {
      collector.recordPerformanceEvent('file_parsing', 150, { fileCount: 5 });
      
      const metrics = collector.getMetrics();
      expect(metrics.totalEvents).toBe(1);
      expect(metrics.eventsByType['performance']).toBe(1);
      
      const events = collector.getEventsByType('performance');
      expect(events[0].data.operation).toBe('file_parsing');
      expect(events[0].data.duration_ms).toBe(150);
    });

    it('should not record performance events when disabled', () => {
      const config = { ...defaultConfig, performanceMetrics: false };
      collector = new TelemetryCollector(config);
      
      collector.recordPerformanceEvent('file_parsing', 150);
      
      const metrics = collector.getMetrics();
      expect(metrics.totalEvents).toBe(0);
    });

    it('should record error events when enabled', () => {
      collector.recordErrorEvent('validation_failed', 'validator', { code: 'E001' });
      
      const metrics = collector.getMetrics();
      expect(metrics.totalEvents).toBe(1);
      expect(metrics.eventsByType['error']).toBe(1);
      
      const events = collector.getEventsByType('error');
      expect(events[0].data.error_type).toBe('validation_failed');
      expect(events[0].data.component).toBe('validator');
      expect(events[0].level).toBe('error');
    });

    it('should not record error events when disabled', () => {
      const config = { ...defaultConfig, errorReporting: false };
      collector = new TelemetryCollector(config);
      
      collector.recordErrorEvent('validation_failed', 'validator');
      
      const metrics = collector.getMetrics();
      expect(metrics.totalEvents).toBe(0);
    });

    it('should record startup events', () => {
      collector.recordStartupEvent('extension_activated', { loadTime: 250 });
      
      const events = collector.getEventsByType('startup.extension_activated');
      expect(events).toHaveLength(1);
      expect(events[0].source).toBe('core');
      expect(events[0].level).toBe('info');
    });

    it('should record compatibility events', () => {
      collector.recordCompatibilityEvent(85, 8, 2);
      
      const events = collector.getEventsByType('pcl_compatibility_validated');
      expect(events).toHaveLength(1);
      expect(events[0].data.score).toBe(85);
      expect(events[0].data.components_validated).toBe(8);
      expect(events[0].data.issues_found).toBe(2);
      expect(events[0].source).toBe('compatibility');
    });
  });

  describe('Event Management', () => {
    let collector: TelemetryCollector;

    beforeEach(() => {
      collector = new TelemetryCollector({ ...defaultConfig, maxEventHistory: 5 });
    });

    it('should maintain event history within limits', () => {
      // Generate more events than the limit
      for (let i = 0; i < 8; i++) {
        collector.recordEvent(`event_${i}`);
      }
      
      const metrics = collector.getMetrics();
      expect(metrics.totalEvents).toBe(8);
      expect(metrics.recentEvents.length).toBe(5); // Limited by maxEventHistory
    });

    it('should filter events by type', () => {
      collector.recordEvent('type_a');
      collector.recordEvent('type_b');
      collector.recordEvent('type_a');
      
      const typeAEvents = collector.getEventsByType('type_a');
      expect(typeAEvents).toHaveLength(2);
      
      const typeBEvents = collector.getEventsByType('type_b');
      expect(typeBEvents).toHaveLength(1);
    });

    it('should limit events by type when requested', () => {
      // Generate multiple events of same type
      for (let i = 0; i < 5; i++) {
        collector.recordEvent('repeated_event', { index: i });
      }
      
      const limitedEvents = collector.getEventsByType('repeated_event', 3);
      expect(limitedEvents).toHaveLength(3);
      
      // Should return the most recent events
      expect(limitedEvents[2].data.index).toBe(4); // Most recent
    });

    it('should clear all events when requested', () => {
      collector.recordEvent('test_event_1');
      collector.recordEvent('test_event_2');
      
      collector.clear();
      
      const metrics = collector.getMetrics();
      expect(metrics.totalEvents).toBe(0);
      expect(metrics.eventsByType).toEqual({});
      expect(metrics.eventsBySource).toEqual({});
      expect(metrics.recentEvents).toHaveLength(0);
    });
  });

  describe('Output Integration', () => {
    let mockOutputChannel: { appendLine: jest.Mock; dispose: jest.Mock };

    beforeEach(() => {
      mockOutputChannel = {
        appendLine: jest.fn(),
        dispose: jest.fn()
      };
      (vscode.window.createOutputChannel as jest.Mock).mockReturnValue(mockOutputChannel);
    });

    it('should emit events to output channel when enabled', () => {
      const collector = new TelemetryCollector({ ...defaultConfig, outputChannel: true });
      
      collector.recordEvent('test_event', { value: 42 }, 'test-source', 'warning');
      
      expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
        expect.stringMatching(/WARNING test-source: test_event {"value":42}/)
      );
    });

    it('should not emit to output channel when disabled', () => {
      new TelemetryCollector({ ...defaultConfig, outputChannel: false });
      
      expect(vscode.window.createOutputChannel).not.toHaveBeenCalled();
    });

    it('should show status bar notifications for error events when enabled', () => {
      const collector = new TelemetryCollector({ 
        ...defaultConfig, 
        statusBarNotifications: true 
      });
      
      collector.recordEvent('critical_error', {}, 'test-source', 'error');
      
      expect(vscode.window.showWarningMessage).toHaveBeenCalledWith('Haruspex: critical_error');
    });

    it('should not show status bar notifications when disabled', () => {
      const collector = new TelemetryCollector({ 
        ...defaultConfig, 
        statusBarNotifications: false 
      });
      
      collector.recordEvent('critical_error', {}, 'test-source', 'error');
      
      expect(vscode.window.showWarningMessage).not.toHaveBeenCalled();
    });

    it('should dispose output channel when collector is disposed', () => {
      const collector = new TelemetryCollector(defaultConfig);
      
      collector.dispose();
      
      expect(mockOutputChannel.dispose).toHaveBeenCalled();
    });
  });

  describe('Privacy Compliance', () => {
    let collector: TelemetryCollector;

    beforeEach(() => {
      collector = new TelemetryCollector(defaultConfig);
    });

    it('should not record events when privacy compliance is disabled', () => {
      // This test ensures the constructor throws, so we test indirectly
      expect(() => {
        new TelemetryCollector({ ...defaultConfig, privacyCompliant: false });
      }).toThrow();
    });

    it('should remove all PII patterns comprehensively', () => {
      collector.recordEvent('comprehensive_pii_test', {
        filePath: '/Users/john/project/secret.ts',
        fileName: 'secret.ts',
        path: '/absolute/path/to/file',
        userName: 'john_doe',
        user: 'john',
        email: 'john.doe@company.com',
        projectName: 'secret-project',
        projectPath: '/Users/john/projects/secret-project',
        workspacePath: '/workspace/secret',
        absolutePath: '/absolute/secret/path',
        directory: '/secret/directory',
        folder: '/secret/folder',
        personalData: 'personal-info',
        sensitiveData: 'sensitive-info',
        safeData: 'this-should-remain'
      });
      
      const recentEvents = collector.getMetrics().recentEvents;
      const event = recentEvents[0];
      
      // All PII fields should be removed
      expect(event.data).not.toHaveProperty('filePath');
      expect(event.data).not.toHaveProperty('fileName');
      expect(event.data).not.toHaveProperty('path');
      expect(event.data).not.toHaveProperty('userName');
      expect(event.data).not.toHaveProperty('user');
      expect(event.data).not.toHaveProperty('email');
      expect(event.data).not.toHaveProperty('projectName');
      expect(event.data).not.toHaveProperty('projectPath');
      expect(event.data).not.toHaveProperty('workspacePath');
      expect(event.data).not.toHaveProperty('absolutePath');
      expect(event.data).not.toHaveProperty('directory');
      expect(event.data).not.toHaveProperty('folder');
      expect(event.data).not.toHaveProperty('personalData');
      expect(event.data).not.toHaveProperty('sensitiveData');
      
      // Safe data should remain
      expect(event.data.safeData).toBe('this-should-remain');
    });

    it('should sanitize complex file paths and project names', () => {
      collector.recordEvent('path_test', {
        message: 'Failed to process /Users/john.doe/My Projects/Secret App/src/components/Auth.tsx',
        error: 'Cannot read C:\\Users\\jane smith\\Documents\\Projects\\secret-project\\config.json'
      });
      
      const event = collector.getMetrics().recentEvents[0];
      
      expect(event.data.message).not.toContain('john.doe');
      expect(event.data.message).not.toContain('Secret App');
      expect(event.data.error).not.toContain('jane smith');
      expect(event.data.error).not.toContain('secret-project');
    });
  });

  describe('Metrics and Analytics', () => {
    let collector: TelemetryCollector;

    beforeEach(() => {
      collector = new TelemetryCollector(defaultConfig);
    });

    it('should track collection start time', () => {
      const beforeCreation = Date.now();
      const newCollector = new TelemetryCollector(defaultConfig);
      const afterCreation = Date.now();
      
      const metrics = newCollector.getMetrics();
      expect(metrics.collectionStartTime).toBeGreaterThanOrEqual(beforeCreation);
      expect(metrics.collectionStartTime).toBeLessThanOrEqual(afterCreation);
    });

    it('should provide comprehensive metrics', () => {
      collector.recordEvent('type_a', {}, 'source_1');
      collector.recordEvent('type_b', {}, 'source_1'); 
      collector.recordEvent('type_a', {}, 'source_2');
      
      const metrics = collector.getMetrics();
      
      expect(metrics.totalEvents).toBe(3);
      expect(metrics.eventsByType).toEqual({ type_a: 2, type_b: 1 });
      expect(metrics.eventsBySource).toEqual({ source_1: 2, source_2: 1 });
      expect(metrics.recentEvents).toHaveLength(3);
    });
  });
});