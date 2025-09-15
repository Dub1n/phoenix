/**
---
date: 2025-09-12T174343Z
name: CLI Navigation Window Stack
TASK-ID: [TASK-MCP-006]
category: navigation-system
status: ["[T]"]
patterns: [window-management, navigation-stack, state-preservation]
components: [WindowStack, WindowDefinition, NavigationHistory]
dependencies: [border-renderer, width-calculator, session-management]
tags: [cli, navigation, windows, state-management]
---
 * 
 * WindowStack - Nested Window State Management
 * 
 * Manages nested window rendering and navigation state with proper
 * history tracking and state preservation. Implements window stacking
 * functionality required for the breadcrumb navigation system.
 * 
 * Generated: 2025-09-12T174343Z
 * TASK-ID: TASK-MCP-006 Pattern: window-management | Complexity: 5 | Dependencies: border-renderer,session-context
 * Context: Manages nested window states for breadcrumb navigation and window stacking
 * Validation-Required: memory-management, state-consistency, navigation-reliability
 * Pattern-Info: { approach: "stack-based-navigation", alternatives: "flat-navigation", trade-offs: "memory-complexity" }
 */

import { EventEmitter } from 'events';
import { BorderRenderer, WindowBorderConfig, createBorderRenderer } from './border-renderer';
import { WidthCalculator, WidthCalculationResult, createWidthCalculator } from './width-calculator';
import { TerminalColorTheme, DefaultColorThemes } from '../terminal-ui-components';

/**
 * Utility type to convert event function signatures to parameter arrays for EventEmitter compatibility
 * This ensures TypeScript compatibility while maintaining type safety
 */
type EventMap<T> = {
  [K in keyof T]: T[K] extends (...args: infer P) => void ? P : never;
};

type TypedEventEmitter<T> = {
  emit<K extends keyof T>(event: K, ...args: EventMap<T>[K]): boolean;
  on<K extends keyof T>(event: K, listener: T[K]): TypedEventEmitter<T>;
  off<K extends keyof T>(event: K, listener: T[K]): TypedEventEmitter<T>;
  once<K extends keyof T>(event: K, listener: T[K]): TypedEventEmitter<T>;
} & EventEmitter;

// TODO: [TASK-ID-005] Pattern: window-management | Complexity: 4 | Dependencies: session-context
// Context: Window state persistence and restoration for session continuity
// Validation-Required: state-serialization, memory-efficiency, error-recovery
// Pattern-Info: { approach: "session-based-persistence", alternatives: "memory-only", trade-offs: "persistence-overhead" }

/**
 * Window definition for stack management
 */
export interface WindowDefinition {
  id: string;
  title?: string;
  subtitle?: string;
  content: string[];
  menuData?: any;
  metadata?: Record<string, any>;
  timestamp: number;
  parentId?: string;
}

/**
 * Window rendering options
 */
export interface WindowRenderOptions {
  showBorders: boolean;
  showTitle: boolean;
  showSubtitle: boolean;
  width?: number;
  height?: number;
  theme?: TerminalColorTheme;
  padding?: number;
  useUnicode?: boolean;
}

/**
 * Navigation context for window operations
 */
export interface NavigationContext {
  currentWindowId: string;
  previousWindowId?: string;
  depth: number;
  path: string[];
  breadcrumbs: BreadcrumbEntry[];
  canGoBack: boolean;
  canGoForward: boolean;
}

/**
 * Breadcrumb entry for navigation tracking
 */
export interface BreadcrumbEntry {
  windowId: string;
  title: string;
  depth: number;
  timestamp: number;
}

/**
 * Window stack events
 */
export interface WindowStackEvents {
  'windowPushed': (window: WindowDefinition, context: NavigationContext) => void;
  'windowPopped': (window: WindowDefinition, context: NavigationContext) => void;
  'navigationChanged': (context: NavigationContext) => void;
  'stackCleared': () => void;
  'stateRestored': (context: NavigationContext) => void;
}

/**
 * Window stack configuration
 */
export interface WindowStackConfig {
  maxStackSize: number;
  enablePersistence: boolean;
  defaultRenderOptions: WindowRenderOptions;
  enableBreadcrumbs: boolean;
  maxBreadcrumbLength: number;
  theme: TerminalColorTheme;
}

/**
 * Main window stack implementation
 */
export class WindowStack extends EventEmitter implements TypedEventEmitter<WindowStackEvents> {
  private stack: WindowDefinition[] = [];
  private forwardStack: WindowDefinition[] = []; // For forward navigation
  protected currentIndex = -1;
  private config: WindowStackConfig;
  private borderRenderer: BorderRenderer;
  private widthCalculator: WidthCalculator;
  private persistedState: any = null;

  constructor(config: Partial<WindowStackConfig> = {}) {
    super();
    
    this.config = {
      maxStackSize: 50,
      enablePersistence: true,
      enableBreadcrumbs: true,
      maxBreadcrumbLength: 10,
      theme: DefaultColorThemes.default,
      defaultRenderOptions: {
        showBorders: true,
        showTitle: true,
        showSubtitle: true,
        theme: DefaultColorThemes.default,
        padding: 3,
        useUnicode: true
      },
      ...config
    };

    this.borderRenderer = createBorderRenderer({
      theme: this.config.theme,
      padding: this.config.defaultRenderOptions.padding,
      useUnicode: this.config.defaultRenderOptions.useUnicode
    });

    this.widthCalculator = createWidthCalculator({
      minWidth: 40,
      maxWidth: 120,
      respectTerminalWidth: true
    });
  }

  /**
   * Push a new window onto the stack
   */
  pushWindow(windowDef: Omit<WindowDefinition, 'id' | 'timestamp'>): string {
    const window: WindowDefinition = {
      ...windowDef,
      id: this.generateWindowId(),
      timestamp: Date.now(),
      parentId: this.getCurrentWindow()?.id
    };

    // Clear forward stack when pushing new window
    this.forwardStack = [];

    // Add to stack
    this.stack.push(window);
    this.currentIndex = this.stack.length - 1;

    // Enforce stack size limit
    if (this.stack.length > this.config.maxStackSize) {
      this.stack.shift();
      this.currentIndex--;
    }

    // Emit event
    const context = this.getNavigationContext();
    this.emit('windowPushed', window, context);
    this.emit('navigationChanged', context);

    // Persist state if enabled
    if (this.config.enablePersistence) {
      this.persistState();
    }

    return window.id;
  }

  /**
   * Pop the current window from the stack
   */
  popWindow(): WindowDefinition | null {
    if (this.stack.length <= 1) {
      return null; // Don't pop the last window
    }

    const poppedWindow = this.stack.pop()!;
    this.currentIndex = Math.max(0, this.currentIndex - 1);

    // Add to forward stack for potential forward navigation
    this.forwardStack.push(poppedWindow);

    // Limit forward stack size
    if (this.forwardStack.length > 10) {
      this.forwardStack.shift();
    }

    // Emit event
    const context = this.getNavigationContext();
    this.emit('windowPopped', poppedWindow, context);
    this.emit('navigationChanged', context);

    // Persist state if enabled
    if (this.config.enablePersistence) {
      this.persistState();
    }

    return poppedWindow;
  }

  /**
   * Navigate back to previous window
   */
  goBack(): boolean {
    if (this.currentIndex <= 0) {
      return false;
    }

    this.currentIndex--;
    const context = this.getNavigationContext();
    this.emit('navigationChanged', context);

    if (this.config.enablePersistence) {
      this.persistState();
    }

    return true;
  }

  /**
   * Navigate forward (if available)
   */
  goForward(): boolean {
    if (this.currentIndex >= this.stack.length - 1 || this.forwardStack.length === 0) {
      return false;
    }

    this.currentIndex++;
    const context = this.getNavigationContext();
    this.emit('navigationChanged', context);

    if (this.config.enablePersistence) {
      this.persistState();
    }

    return true;
  }

  /**
   * Navigate directly to a window by ID
   */
  navigateToWindow(windowId: string): boolean {
    const index = this.stack.findIndex(w => w.id === windowId);
    
    if (index === -1) {
      return false;
    }

    this.currentIndex = index;
    const context = this.getNavigationContext();
    this.emit('navigationChanged', context);

    if (this.config.enablePersistence) {
      this.persistState();
    }

    return true;
  }

  /**
   * Get the current active window
   */
  getCurrentWindow(): WindowDefinition | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.stack.length) {
      return null;
    }
    
    return this.stack[this.currentIndex];
  }

  /**
   * Get window by ID
   */
  getWindow(windowId: string): WindowDefinition | null {
    return this.stack.find(w => w.id === windowId) || null;
  }

  /**
   * Get all windows in stack
   */
  getAllWindows(): WindowDefinition[] {
    return [...this.stack];
  }

  /**
   * Get navigation context
   */
  getNavigationContext(): NavigationContext {
    const currentWindow = this.getCurrentWindow();
    const previousWindow = this.currentIndex > 0 ? this.stack[this.currentIndex - 1] : null;
    
    const path = this.stack.slice(0, this.currentIndex + 1).map(w => w.id);
    const breadcrumbs = this.generateBreadcrumbs();

    return {
      currentWindowId: currentWindow?.id || '',
      previousWindowId: previousWindow?.id,
      depth: this.currentIndex + 1,
      path,
      breadcrumbs,
      canGoBack: this.currentIndex > 0,
      canGoForward: this.currentIndex < this.stack.length - 1 && this.forwardStack.length > 0
    };
  }

  /**
   * Generate breadcrumb navigation trail
   */
  private generateBreadcrumbs(): BreadcrumbEntry[] {
    const breadcrumbs: BreadcrumbEntry[] = [];
    const maxLength = this.config.maxBreadcrumbLength;
    
    // Get the path from root to current window
    const pathWindows = this.stack.slice(0, this.currentIndex + 1);
    
    // If path is longer than max, show first few, ellipsis, and last few
    if (pathWindows.length <= maxLength) {
      pathWindows.forEach((window, index) => {
        breadcrumbs.push({
          windowId: window.id,
          title: window.title || `Window ${index + 1}`,
          depth: index,
          timestamp: window.timestamp
        });
      });
    } else {
      // Show first 2, ellipsis, and last (maxLength - 3)
      const firstPart = pathWindows.slice(0, 2);
      const lastPart = pathWindows.slice(-(maxLength - 3));
      
      firstPart.forEach((window, index) => {
        breadcrumbs.push({
          windowId: window.id,
          title: window.title || `Window ${index + 1}`,
          depth: index,
          timestamp: window.timestamp
        });
      });
      
      // Add ellipsis indicator
      breadcrumbs.push({
        windowId: 'ellipsis',
        title: '...',
        depth: -1,
        timestamp: 0
      });
      
      lastPart.forEach((window, index) => {
        const actualIndex = pathWindows.length - lastPart.length + index;
        breadcrumbs.push({
          windowId: window.id,
          title: window.title || `Window ${actualIndex + 1}`,
          depth: actualIndex,
          timestamp: window.timestamp
        });
      });
    }
    
    return breadcrumbs;
  }

  /**
   * Render current window
   */
  renderCurrentWindow(options?: Partial<WindowRenderOptions>): string {
    const currentWindow = this.getCurrentWindow();
    
    if (!currentWindow) {
      return 'No active window';
    }

    return this.renderWindow(currentWindow, options);
  }

  /**
   * Render specific window
   */
  renderWindow(window: WindowDefinition, options?: Partial<WindowRenderOptions>): string {
    const renderOptions = {
      ...this.config.defaultRenderOptions,
      ...options
    };

    if (!renderOptions.showBorders) {
      // Plain text rendering
      const lines = [];
      
      if (renderOptions.showTitle && window.title) {
        lines.push(`=== ${window.title} ===`);
        if (renderOptions.showSubtitle && window.subtitle) {
          lines.push(window.subtitle);
        }
        lines.push('');
      }
      
      lines.push(...window.content);
      
      return lines.join('\n');
    }

    // Calculate optimal width
    const widthResult = this.widthCalculator.calculateWidth(window.content);
    const width = renderOptions.width || widthResult.calculatedWidth;

    // Configure border renderer
    this.borderRenderer.setTheme(renderOptions.theme || this.config.theme);
    this.borderRenderer.setUnicodeMode(renderOptions.useUnicode !== false);

    // Render with borders
    return this.borderRenderer.renderWindow(
      window.content,
      renderOptions.showTitle ? window.title : undefined,
      renderOptions.showSubtitle ? window.subtitle : undefined
    );
  }

  /**
   * Render breadcrumb navigation
   */
  renderBreadcrumbs(): string {
    if (!this.config.enableBreadcrumbs) {
      return '';
    }

    const breadcrumbs = this.generateBreadcrumbs();
    
    if (breadcrumbs.length <= 1) {
      return '';
    }

    const theme = this.config.theme;
    const separator = theme.muted(' › ');
    
    const breadcrumbText = breadcrumbs
      .map((crumb, index) => {
        if (crumb.windowId === 'ellipsis') {
          return theme.muted('...');
        }
        
        const isLast = index === breadcrumbs.length - 1;
        const isCurrent = index === breadcrumbs.length - 1;
        
        let text = crumb.title;
        if (text.length > 20) {
          text = text.substring(0, 17) + '...';
        }
        
        if (isCurrent) {
          return theme.accent(text);
        } else {
          return theme.primary(text);
        }
      })
      .join(separator);

    return theme.muted('Navigation: ') + breadcrumbText;
  }

  /**
   * Clear the entire stack
   */
  clearStack(): void {
    this.stack = [];
    this.forwardStack = [];
    this.currentIndex = -1;
    
    this.emit('stackCleared');
    
    if (this.config.enablePersistence) {
      this.persistState();
    }
  }

  /**
   * Get stack statistics
   */
  getStackStats(): {
    totalWindows: number;
    currentDepth: number;
    forwardWindows: number;
    memoryUsage: string;
  } {
    const memoryUsage = this.calculateMemoryUsage();
    
    return {
      totalWindows: this.stack.length,
      currentDepth: this.currentIndex + 1,
      forwardWindows: this.forwardStack.length,
      memoryUsage: this.formatBytes(memoryUsage)
    };
  }

  /**
   * Calculate approximate memory usage
   */
  private calculateMemoryUsage(): number {
    let bytes = 0;
    
    for (const window of this.stack) {
      bytes += JSON.stringify(window).length * 2; // Rough estimate
    }
    
    for (const window of this.forwardStack) {
      bytes += JSON.stringify(window).length * 2;
    }
    
    return bytes;
  }

  /**
   * Format bytes into human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate unique window ID
   */
  private generateWindowId(): string {
    return `window_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Persist current state
   */
  private persistState(): void {
    if (!this.config.enablePersistence) {
      return;
    }

    this.persistedState = {
      stack: this.stack,
      forwardStack: this.forwardStack,
      currentIndex: this.currentIndex,
      timestamp: Date.now()
    };
  }

  /**
   * Restore state from persistence
   */
  restoreState(state?: any): boolean {
    const stateToRestore = state || this.persistedState;
    
    if (!stateToRestore) {
      return false;
    }

    try {
      this.stack = stateToRestore.stack || [];
      this.forwardStack = stateToRestore.forwardStack || [];
      this.currentIndex = stateToRestore.currentIndex || -1;
      
      // Validate state
      if (this.currentIndex >= this.stack.length) {
        this.currentIndex = this.stack.length - 1;
      }
      
      const context = this.getNavigationContext();
      this.emit('stateRestored', context);
      this.emit('navigationChanged', context);
      
      return true;
    } catch (error) {
      console.error('Failed to restore window stack state:', error);
      return false;
    }
  }

  /**
   * Export current state for serialization
   */
  exportState(): any {
    return {
      stack: this.stack,
      forwardStack: this.forwardStack,
      currentIndex: this.currentIndex,
      timestamp: Date.now(),
      version: '1.0'
    };
  }

  /**
   * Import state from serialized data
   */
  importState(serializedState: any): boolean {
    if (!serializedState || serializedState.version !== '1.0') {
      return false;
    }

    return this.restoreState(serializedState);
  }

  /**
   * Update window stack configuration
   */
  updateConfig(newConfig: Partial<WindowStackConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update renderer configurations
    if (newConfig.theme) {
      this.borderRenderer.setTheme(newConfig.theme);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.removeAllListeners();
    this.clearStack();
    this.persistedState = null;
  }
}

// TODO: [TASK-ID-006] Pattern: navigation-enhancement | Complexity: 3 | Dependencies: event-handling
// Context: Enhanced navigation features for window stack management
// Validation-Required: keyboard-shortcuts, gesture-support, accessibility
// Pattern-Info: { approach: "event-driven-navigation", alternatives: "command-based", trade-offs: "complexity-usability" }

/**
 * Enhanced window stack with additional navigation features
 */
export class EnhancedWindowStack extends WindowStack {
  private keyboardShortcuts: Map<string, () => void> = new Map();
  private gestureHistory: string[] = [];
  private lastGestureTime = 0;

  constructor(config: Partial<WindowStackConfig> = {}) {
    super(config);
    this.setupKeyboardShortcuts();
  }

  /**
   * Setup default keyboard shortcuts
   */
  private setupKeyboardShortcuts(): void {
    this.keyboardShortcuts.set('ctrl+left', () => this.goBack());
    this.keyboardShortcuts.set('ctrl+right', () => this.goForward());
    this.keyboardShortcuts.set('alt+home', () => this.navigateToRoot());
    this.keyboardShortcuts.set('ctrl+w', () => this.popWindow());
  }

  /**
   * Navigate to root window
   */
  navigateToRoot(): boolean {
    if (this.getAllWindows().length === 0) {
      return false;
    }

    this.currentIndex = 0;
    const context = this.getNavigationContext();
    this.emit('navigationChanged', context);
    return true;
  }

  /**
   * Handle keyboard shortcut
   */
  handleKeyboardShortcut(shortcut: string): boolean {
    const handler = this.keyboardShortcuts.get(shortcut);
    
    if (handler) {
      handler();
      return true;
    }
    
    return false;
  }

  /**
   * Add custom keyboard shortcut
   */
  addKeyboardShortcut(shortcut: string, handler: () => void): void {
    this.keyboardShortcuts.set(shortcut, handler);
  }

  /**
   * Remove keyboard shortcut
   */
  removeKeyboardShortcut(shortcut: string): boolean {
    return this.keyboardShortcuts.delete(shortcut);
  }

  /**
   * Get available keyboard shortcuts
   */
  getKeyboardShortcuts(): string[] {
    return Array.from(this.keyboardShortcuts.keys());
  }
}

/**
 * Factory function for creating window stack
 */
export function createWindowStack(config?: Partial<WindowStackConfig>): WindowStack {
  return new WindowStack(config);
}

/**
 * Factory function for creating enhanced window stack
 */
export function createEnhancedWindowStack(config?: Partial<WindowStackConfig>): EnhancedWindowStack {
  return new EnhancedWindowStack(config);
}
