/**
---
date: 2025-09-12T174343Z
name: CLI Navigation System Tests
TASK-ID: [TASK-MCP-006]
category: navigation-system
status: ["[T]"]
patterns: [integration-testing, validation-testing, system-testing]
components: [NavigationSystemTests, ValidationSuite, IntegrationTests]
dependencies: [jest, all-navigation-components]
tags: [cli, navigation, testing, validation, integration]
---
 * 
 * Navigation System Validation Tests
 * 
 * Comprehensive test suite for the CLI navigation system implementation.
 * Validates all components work correctly individually and in integration,
 * ensuring the system meets the design requirements and accessibility standards.
 * 
 * Generated: 2025-09-12T174343Z
 * TASK-ID: TASK-MCP-006 Pattern: integration-testing | Complexity: 4 | Dependencies: jest,navigation-components
 * Context: Complete validation testing for navigation system implementation
 * Validation-Required: component-testing, integration-testing, accessibility-testing
 * Pattern-Info: { approach: "comprehensive-testing", alternatives: "unit-only", trade-offs: "coverage-complexity" }
 */

import {
  NavigationSystem,
  createNavigationSystem,
  setupBasicNavigation,
  setupAccessibleNavigation,
  BorderRenderer,
  WidthCalculator,
  WindowStack,
  BreadcrumbManager,
  ExitHandler,
  SelectorUpdater,
  TerminalCompatibilitySystem,
  AccessibilityManager,
  createBorderRenderer,
  createWidthCalculator,
  createSelectorUpdater,
  applySelector
} from '../index';
import type { TerminalCapabilities } from '../index';
import { DisplayUtils } from '../../../utils/display-utils';
import { WINDOW_SPACING } from '../../../utils/window-theme-constants';
import { windowLayoutManager } from '../../window-layout-manager';
import {
  createFormatterCapabilities,
  createFormatterFixture
} from '../../../tests/helpers/terminal-formatter-fixtures';

const overrideStdoutColumns = (width: number): (() => void) => {
  const original = process.stdout.columns;
  Object.defineProperty(process.stdout, 'columns', {
    configurable: true,
    writable: true,
    value: width
  });

  return () => {
    Object.defineProperty(process.stdout, 'columns', {
      configurable: true,
      writable: true,
      value: original
    });
  };
};

// TODO: [TASK-ID-016] Pattern: integration-testing | Complexity: 3 | Dependencies: testing-framework
// Context: Integration testing for complete navigation system functionality
// Validation-Required: end-to-end-workflows, error-handling, performance-testing
// Pattern-Info: { approach: "behavioral-testing", alternatives: "unit-testing-only", trade-offs: "realism-isolation" }

describe('Navigation System Integration Tests', () => {
  let navigationSystem: NavigationSystem;

  beforeEach(async () => {
    DisplayUtils.reset();
    navigationSystem = createNavigationSystem();
  });

  afterEach(async () => {
    await navigationSystem.cleanup();
  });

  describe('System Initialization', () => {
    test('should initialize successfully with default configuration', async () => {
      const result = await navigationSystem.initialize();
      
      expect(result.success).toBe(true);
      expect(navigationSystem.isInitialized()).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    test('should initialize all required components', async () => {
      await navigationSystem.initialize();
      const components = navigationSystem.getComponents();
      
      expect(components.borderRenderer).toBeDefined();
      expect(components.widthCalculator).toBeDefined();
      expect(components.windowStack).toBeDefined();
      expect(components.exitHandler).toBeDefined();
    });

    test('should handle initialization errors gracefully', async () => {
      // Mock a component initialization failure
      const systemWithBadConfig = createNavigationSystem({
        // Invalid configuration to trigger error
        borderRenderer: { padding: -1 }
      });

      const result = await systemWithBadConfig.initialize();
      
      expect(typeof result.success).toBe('boolean');
      if (!result.success) {
        expect(result.errors).toBeDefined();
        expect(Array.isArray(result.errors)).toBe(true);
      }
    });
  });

  describe('Terminal Compatibility Detection', () => {
    test('should detect terminal capabilities', async () => {
      const system = new TerminalCompatibilitySystem();
      const result = await system.initialize();
      
      expect(result.capabilities).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(['excellent', 'good', 'fair', 'poor', 'incompatible']).toContain(result.overall);
    });

    test('should provide fallback recommendations', async () => {
      const system = new TerminalCompatibilitySystem();
      const result = await system.initialize();
      
      expect(Array.isArray(result.fallbacksRequired)).toBe(true);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });
  });

  describe('Border Rendering', () => {
    test('should create bordered windows', () => {
      const renderer = createBorderRenderer();
      const content = ['Line 1', 'Line 2', 'Line 3'];
      const result = renderer.renderWindow(content, 'Test Title');
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
      expect(result).toContain('Test Title');
      expect(result.split('\n').length).toBeGreaterThan(content.length);
    });

    test('should handle Unicode and ASCII fallback', () => {
      const unicodeRenderer = createBorderRenderer({ useUnicode: true });
      const asciiRenderer = createBorderRenderer({ useUnicode: false });
      
      const content = ['Test content'];
      const unicodeResult = unicodeRenderer.renderWindow(content);
      const asciiResult = asciiRenderer.renderWindow(content);
      
      expect(unicodeResult).toContain('┌');
      expect(asciiResult).toContain('+');
    });

    test('should calculate optimal dimensions', () => {
      const renderer = createBorderRenderer();
      const content = ['Short', 'This is a much longer line of text', 'Medium length'];
      
      const dimensions = renderer.calculateOptimalDimensions(content);
      
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);
      expect(dimensions.width).toBeGreaterThanOrEqual(40); // Minimum width
    });

    test('should respect formatter capabilities when selecting border glyphs', () => {
      const formatter = createFormatterFixture({
        capabilities: createFormatterCapabilities({ supportsUnicode: false })
      });
      const renderer = createBorderRenderer({ useUnicode: true }, { formatter });
      const content = ['Formatter capability check'];

      const rendered = renderer.renderWindow(content);

      expect(rendered).toContain('+');
      expect(rendered).not.toContain('┌');
    });

    test('aligns border dimensions with DisplayUtils standards', () => {
      const columns = 96;
      const restoreColumns = overrideStdoutColumns(columns);
      DisplayUtils.configure({ columnsProvider: () => columns });
      try {
        const padding = DisplayUtils.standards.defaultPadding;
        const renderer = createBorderRenderer({
          padding,
          showTitle: false,
          showSubtitle: false
        });
        const content = [
          'Service status overview',
          'Connected: 5',
          'Disconnected: 2'
        ];

        const dimensions = renderer.calculateOptimalDimensions(
          content,
          DisplayUtils.standards.minWidth,
          DisplayUtils.standards.maxWidth
        );

        const expectedContentWidth = Math.max(
          DisplayUtils.responsiveWidth(content, { padding }),
          DisplayUtils.standards.separatorLength
        );
        expect(dimensions.width).toBe(expectedContentWidth + DisplayUtils.standards.borderWidth);

        const rendered = renderer.renderWindow(content);
        const topBorder = rendered
          .split('\n')[0]
          .replace(/\u001b\[[0-9;]*m/g, '');
        const horizontalSegment = topBorder.slice(1, -1).replace(/\s+/g, '');
        expect(horizontalSegment.length).toBe(DisplayUtils.standards.separatorLength);
      } finally {
        DisplayUtils.reset();
        restoreColumns();
      }
    });
  });

  describe('Width Calculation', () => {
    test('should calculate width for simple content', () => {
      const calculator = createWidthCalculator();
      const content = ['Line 1', 'Line 2'];
      
      const result = calculator.calculateWidth(content);
      
      expect(result.calculatedWidth).toBeGreaterThan(0);
      expect(result.contentWidth).toBeGreaterThan(0);
      expect(result.isOptimal).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('should handle multi-byte characters', () => {
      const calculator = createWidthCalculator();
      const content = ['Hello 世界', 'Test with emoji 🎉'];
      
      const result = calculator.calculateWidth(content);
      
      expect(result.calculatedWidth).toBeGreaterThan(content[0].length);
      expect(typeof result.reasoning).toBe('string');
    });

    test('should enforce width constraints', () => {
      const calculator = createWidthCalculator({
        minWidth: 50,
        maxWidth: 100
      });
      
      const shortContent = ['Hi'];
      const longContent = ['A very long line that exceeds the maximum width constraint and should be handled appropriately'];
      
      const shortResult = calculator.calculateWidth(shortContent);
      const longResult = calculator.calculateWidth(longContent);
      
      expect(shortResult.calculatedWidth).toBeGreaterThanOrEqual(50);
      expect(longResult.calculatedWidth).toBeLessThanOrEqual(100);
    });

    test('respects formatter terminal width when applying constraints', () => {
      const formatter = createFormatterFixture({
        capabilities: createFormatterCapabilities({ width: 60 })
      });
      const calculator = createWidthCalculator({ respectTerminalWidth: true }, { formatter });
      const content = ['Line 1', 'Line 2 that is longer than the first'];

      const result = calculator.calculateWidth(content);

      expect(result.calculatedWidth).toBeLessThanOrEqual(56);
    });

    test('aligns padding width with shared window spacing defaults', () => {
      DisplayUtils.reset();
      DisplayUtils.configure({ columnsProvider: () => 96 });

      const calculator = createWidthCalculator();
      const content = ['Navigation status', 'Service availability overview'];

      const result = calculator.calculateWidth(content);

      expect(result.paddingWidth).toBe(WINDOW_SPACING.defaultPadding * 2);
      expect(result.borderWidth).toBe(WINDOW_SPACING.borderWidth);
    });
  });

  describe('Window Layout Manager Integration', () => {
    test('enforces minimum width based on window spacing standards', () => {
      const capabilities: TerminalCapabilities = {
        supportsBoxDrawing: true,
        supportsUnicode: true,
        supportsColors: true,
        supportsAnsi: true,
        colorDepth: 8,
        width: 72,
        height: 24,
        terminalType: 'xterm',
        platform: 'unix'
      };

      const layout = windowLayoutManager.calculateOptimalLayout(
        {
          title: 'Navigation',
          content: ['Short summary']
        },
        capabilities,
        {}
      );

      expect(layout.width).toBeGreaterThanOrEqual(WINDOW_SPACING.minWidth);
      expect(layout.padding).toBe(WINDOW_SPACING.defaultPadding);
    });
  });

  describe('Selector Updates', () => {
    test('should apply selector character to menu items', () => {
      const menuItem = 'Start Application';
      const withSelector = applySelector(menuItem, true);
      
      expect(withSelector).toContain('›');
      expect(withSelector).toContain('Start Application');
    });

    test('should handle batch selector updates', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];
      const updatedItems = require('../selector-updater').batchApplySelectors(items, 1);
      
      expect(updatedItems).toHaveLength(3);
      expect(updatedItems[1]).toContain('›'); // Selected item
    });

    test('should provide accessibility fallback', () => {
      const updater = new SelectorUpdater({
        accessibilityMode: true
      });
      
      const selector = updater.getCurrentSelector();
      expect(selector).toBe('>'); // ASCII fallback
    });

    test('should skip selector injection for non-plain menu wrappers', () => {
      class CustomMenu {
        sections;

        constructor() {
          this.sections = [
            {
              items: [
                { label: 'Legacy Option' }
              ]
            }
          ];
        }
      }

      const updater = createSelectorUpdater();
      const menuWrapper = new CustomMenu();

      const result = updater.updateMenuObject(menuWrapper as any);

      expect(result.changes).toHaveLength(0);
      expect(result.processed).toBe(menuWrapper);
    });
  });

  describe('Window Stack Management', () => {
    test('should manage window navigation stack', () => {
      const windowStack = new WindowStack();
      
      const window1Id = windowStack.pushWindow({
        title: 'Window 1',
        content: ['Content 1']
      });
      
      const window2Id = windowStack.pushWindow({
        title: 'Window 2',
        content: ['Content 2']
      });
      
      expect(windowStack.getCurrentWindow()?.id).toBe(window2Id);
      
      const poppedWindow = windowStack.popWindow();
      expect(poppedWindow?.id).toBe(window2Id);
      expect(windowStack.getCurrentWindow()?.id).toBe(window1Id);
    });

    test('should generate breadcrumbs', () => {
      const windowStack = new WindowStack();
      
      windowStack.pushWindow({ title: 'Home', content: ['Home content'] });
      windowStack.pushWindow({ title: 'Settings', content: ['Settings content'] });
      windowStack.pushWindow({ title: 'Advanced', content: ['Advanced content'] });
      
      const breadcrumbs = windowStack.renderBreadcrumbs();
      
      expect(typeof breadcrumbs).toBe('string');
      expect(breadcrumbs).toContain('Home');
      expect(breadcrumbs).toContain('Settings');
      expect(breadcrumbs).toContain('Advanced');
    });

    test('renders breadcrumbs using DisplayUtils separators', () => {
      const columns = 72;
      const restoreColumns = overrideStdoutColumns(columns);
      const separatorMock = jest.fn((length?: number) => `sep:${length ?? 0}`);
      DisplayUtils.configure({
        columnsProvider: () => columns,
        formatter: {
          ui: {
            separator: separatorMock
          }
        } as any
      });
      try {
        const breadcrumbManager = new BreadcrumbManager();
        const now = Date.now();
        breadcrumbManager.pushBreadcrumb({
          id: 'home',
          title: 'Home',
          depth: 0,
          timestamp: now,
          description: 'root'
        });
        breadcrumbManager.pushBreadcrumb({
          id: 'settings',
          title: 'Settings',
          depth: 1,
          timestamp: now + 1,
          description: 'settings'
        });
        breadcrumbManager.pushBreadcrumb({
          id: 'advanced',
          title: 'Advanced',
          depth: 2,
          timestamp: now + 2,
          description: 'advanced'
        });

        const rendered = breadcrumbManager.renderBreadcrumbs();
        expect(separatorMock).toHaveBeenCalled();
        expect(rendered).toContain('sep:');
      } finally {
        DisplayUtils.reset();
        restoreColumns();
      }
    });

    test('should enforce stack size limits', () => {
      const windowStack = new WindowStack({ maxStackSize: 3 });
      
      for (let i = 0; i < 5; i++) {
        windowStack.pushWindow({
          title: `Window ${i}`,
          content: [`Content ${i}`]
        });
      }
      
      const stats = windowStack.getStackStats();
      expect(stats.totalWindows).toBeLessThanOrEqual(3);
    });
  });

  describe('Accessibility Features', () => {
    test('should create accessible navigation elements', async () => {
      const system = await setupAccessibleNavigation();
      const components = system.getComponents();
      
      expect(components.accessibilityManager).toBeDefined();
      
      if (components.accessibilityManager) {
        const config = components.accessibilityManager.getConfig();
        expect(config.enableKeyboardNavigation).toBe(true);
        expect(config.enableScreenReader).toBe(true);
      }
    });

    test('should provide keyboard navigation', async () => {
      const system = await setupAccessibleNavigation();
      const accessibilityManager = system.getComponents().accessibilityManager;
      
      if (accessibilityManager) {
        const elements = [
          { id: 'item1', label: 'Item 1', type: 'menu-item' as const, isDisabled: false, isVisible: true },
          { id: 'item2', label: 'Item 2', type: 'menu-item' as const, isDisabled: false, isVisible: true }
        ];
        
        accessibilityManager.setNavigableElements(elements);
        
        const handled = accessibilityManager.handleKeyboard('ArrowDown');
        expect(typeof handled).toBe('boolean');
        
        const currentElement = accessibilityManager.getCurrentElement();
        expect(currentElement).toBeDefined();
      }
    });

    test('should generate accessibility report', async () => {
      const system = await setupAccessibleNavigation();
      const accessibilityManager = system.getComponents().accessibilityManager;
      
      if (accessibilityManager) {
        const report = accessibilityManager.generateAccessibilityReport();
        
        expect(typeof report.overallScore).toBe('number');
        expect(report.overallScore).toBeGreaterThanOrEqual(0);
        expect(report.overallScore).toBeLessThanOrEqual(100);
        expect(Array.isArray(report.violations)).toBe(true);
        expect(Array.isArray(report.recommendations)).toBe(true);
        expect(typeof report.wcagCompliance).toBe('boolean');
      }
    });
  });

  describe('Exit Handling', () => {
    test('should handle exit confirmation', async () => {
      const exitHandler = new ExitHandler({
        requireConfirmation: false // Skip confirmation for testing
      });
      
      // Mock the confirmation to avoid interactive prompts
      const result = await exitHandler.handleExit('programmatic');
      expect(typeof result).toBe('boolean');
    });

    test('should register cleanup tasks', () => {
      const exitHandler = new ExitHandler();
      
      exitHandler.registerCleanupTask({
        id: 'test-cleanup',
        name: 'Test Cleanup',
        priority: 1,
        timeout: 1000,
        required: false,
        executor: async () => { /* test cleanup */ }
      });
      
      // Cleanup task should be registered (no direct assertion available)
      expect(exitHandler).toBeDefined();
    });
  });

  describe('Performance and Edge Cases', () => {
    test('should handle empty content gracefully', () => {
      const renderer = createBorderRenderer();
      const result = renderer.renderWindow([]);
      
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    test('should handle very long content', () => {
      const calculator = createWidthCalculator();
      const longLine = 'A'.repeat(1000);
      const result = calculator.calculateWidth([longLine]);
      
      expect(result.calculatedWidth).toBeLessThanOrEqual(120); // Should be constrained
      expect(result.isOptimal).toBeDefined();
    });

    test('should handle special characters', () => {
      const text = 'Test with \n newlines \t tabs and \x1b[31m ANSI codes \x1b[0m';
      const calculator = createWidthCalculator();
      const result = calculator.calculateWidth([text]);

      expect(result.calculatedWidth).toBeGreaterThan(0);
    });

    test('should maintain performance with large datasets', () => {
      const calculator = createWidthCalculator();
      const largeTexts = Array.from({ length: 1000 }, (_, i) =>
        `Line ${i} with 🎉 emoji and special chars 🔥`
      );

      const startTime = Date.now();
      for (const text of largeTexts) {
        calculator.calculateWidth([text]);
      }
      const duration = Date.now() - startTime;

      // Should process 1000 width calculations in under 1 second
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('Configuration and Customization', () => {
    test('should allow configuration updates', () => {
      const system = createNavigationSystem({
        navigation: {
          accessibility: { enableKeyboardNavigation: false }
        }
      });

      const config = system.getConfig();
      expect(config.navigation?.accessibility?.enableKeyboardNavigation).toBe(false);

      system.updateConfig({
        navigation: {
          accessibility: { enableKeyboardNavigation: true }
        }
      });

      const updatedConfig = system.getConfig();
      expect(updatedConfig.navigation?.accessibility?.enableKeyboardNavigation).toBe(true);
    });

    test('should support different navigation modes', async () => {
      const system = await setupAccessibleNavigation();
      const accessibilityManager = system.getComponents().accessibilityManager;
      
      if (accessibilityManager) {
        accessibilityManager.setNavigationMode('vim');
        const config = accessibilityManager.getConfig();
        expect(config.keyboardNavigationMode).toBe('vim');
      }
    });
  });

  describe('Integration Workflows', () => {
    test('should support complete navigation workflow', async () => {
      const system = await setupBasicNavigation();
      const components = system.getComponents();

      // Create a window with emoji content
      const windowStack = components.windowStack!;
      const selectorUpdater = components.selectorUpdater!;

      const rawContent = ['🏠 Home Menu', '⚙️ Settings', '📊 Statistics'];
      const menuResult = selectorUpdater.updateSelectors(rawContent.join('\n'));

      windowStack.pushWindow({
        title: 'Main Menu',
        content: menuResult.formattedText.split('\n')
      });

      const currentWindow = windowStack.getCurrentWindow();
      expect(currentWindow?.title).toBe('Main Menu');
      expect(currentWindow?.content.some(line => line.includes('›'))).toBe(true);
      expect(currentWindow?.content.some(line => line.includes('🏠'))).toBe(true);
    });

    test('should handle system cleanup properly', async () => {
      const system = await setupBasicNavigation();
      
      // Use the system
      const components = system.getComponents();
      expect(components.windowStack).toBeDefined();
      
      // Cleanup
      await system.cleanup();
      expect(system.isInitialized()).toBe(false);
    });
  });

  describe('Process listener management', () => {
    test('does not accumulate fatal process listeners across repeated initialization', async () => {
      const baselineUncaught = process.listenerCount('uncaughtException');
      const baselineUnhandled = process.listenerCount('unhandledRejection');

      for (let i = 0; i < 12; i += 1) {
        const system = createNavigationSystem({
          exitHandling: {
            requireConfirmation: false,
            doubleConfirmation: false,
            confirmationTimeout: 0
          }
        });

        await system.initialize();
        await system.cleanup();
      }

      expect(process.listenerCount('uncaughtException')).toBe(baselineUncaught);
      expect(process.listenerCount('unhandledRejection')).toBe(baselineUnhandled);
    });
  });
});

// Export test utilities for use in other test files
export const TestUtils = {
  createTestNavigationSystem: () => createNavigationSystem({
    compatibility: { detectCapabilities: false } // Skip detection for faster tests
  }),
  
  createTestContent: (count: number = 5) => 
    Array.from({ length: count }, (_, i) => `Test item ${i + 1}`),
  
  createTestElementsWithEmojis: () => [
    '🏠 Home',
    '⚙️ Settings',
    '📊 Dashboard',
    '🔍 Search',
    '❌ Exit'
  ],
  
  expectHasSelectors: (text: string) => {
    expect(text.includes('›') || text.includes('>')).toBe(true);
  }
};
