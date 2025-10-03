/**
---
date: 2025-09-12T174343Z
name: CLI Navigation Breadcrumb Manager
TASK-ID: [TASK-MCP-006]
category: navigation-system
status: ["[T]"]
patterns: [breadcrumb-navigation, path-tracking, user-guidance]
components: [BreadcrumbManager, PathTracker, NavigationRenderer]
dependencies: [terminal-ui-components, window-stack]
tags: [cli, navigation, breadcrumbs, user-experience]
---
 * 
 * BreadcrumbManager - Advanced Breadcrumb Navigation System
 * 
 * Provides comprehensive breadcrumb navigation with path tracking,
 * interactive navigation, and visual rendering. Enhances the basic
 * breadcrumb functionality from WindowStack with additional features.
 * 
 * Generated: 2025-09-12T174343Z
 * TASK-ID: TASK-MCP-006 Pattern: breadcrumb-navigation | Complexity: 4 | Dependencies: terminal-ui,window-stack
 * Context: Advanced breadcrumb navigation system for nested window management
 * Validation-Required: interactive-navigation, responsive-rendering, accessibility
 * Pattern-Info: { approach: "enhanced-breadcrumbs", alternatives: "simple-path", trade-offs: "complexity-usability" }
 */

import { EventEmitter } from 'events';
import { TerminalColorTheme, DefaultColorThemes } from '../terminal-ui-components';
import { StringUtils, StringWidthUtils } from '../../utils/chainable-string-utils';
import { DisplayUtils } from '../../utils/display-utils';

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

// TODO: [TASK-ID-007] Pattern: breadcrumb-navigation | Complexity: 3 | Dependencies: interactive-navigation
// Context: Interactive breadcrumb selection and navigation with keyboard support
// Validation-Required: keyboard-accessibility, screen-reader-support, visual-feedback
// Pattern-Info: { approach: "interactive-breadcrumbs", alternatives: "read-only-display", trade-offs: "complexity-simplicity" }

/**
 * Enhanced breadcrumb entry with additional metadata
 */
export interface BreadcrumbEntry {
  id: string;
  title: string;
  shortTitle?: string; // For space-constrained displays
  description?: string;
  depth: number;
  timestamp: number;
  isActive: boolean;
  isClickable: boolean;
  metadata?: Record<string, any>;
}

/**
 * Breadcrumb rendering style options
 */
export interface BreadcrumbStyle {
  separator: string;
  activeSeparator?: string;
  maxTitleLength: number;
  showDepthNumbers: boolean;
  showTimestamp: boolean;
  compactMode: boolean;
  highlightActive: boolean;
  theme: TerminalColorTheme;
}

/**
 * Breadcrumb navigation events
 */
export interface BreadcrumbEvents {
  'breadcrumbClicked': (entry: BreadcrumbEntry, index: number) => void;
  'pathChanged': (path: BreadcrumbEntry[], currentIndex: number) => void;
  'styleChanged': (style: BreadcrumbStyle) => void;
  'overflow': (hiddenCount: number, visibleEntries: BreadcrumbEntry[]) => void;
}

/**
 * Path tracking configuration
 */
export interface PathTrackingConfig {
  maxPathLength: number;
  enableAutoTruncation: boolean;
  preserveRoot: boolean;
  preserveLeaves: number; // Number of leaf entries to always preserve
  enablePathOptimization: boolean;
}

/**
 * Responsive breadcrumb configuration
 */
export interface ResponsiveBreadcrumbConfig {
  breakpoints: {
    compact: number;     // Terminal width threshold for compact mode
    minimal: number;     // Terminal width threshold for minimal mode
    hideLabels: number;  // Terminal width threshold for hiding labels
  };
  adaptiveLabels: boolean;
  dynamicSeparators: boolean;
  overflowHandling: 'truncate' | 'scroll' | 'dropdown';
}

/**
 * Main breadcrumb manager configuration
 */
export interface BreadcrumbManagerConfig {
  style: BreadcrumbStyle;
  pathTracking: PathTrackingConfig;
  responsive: ResponsiveBreadcrumbConfig;
  enableInteraction: boolean;
  enableKeyboardNavigation: boolean;
  autoUpdate: boolean;
}

/**
 * Path tracker for managing navigation history
 */
export class PathTracker {
  private path: BreadcrumbEntry[] = [];
  private currentIndex = -1;
  private config: PathTrackingConfig;

  constructor(config: Partial<PathTrackingConfig> = {}) {
    this.config = {
      maxPathLength: 20,
      enableAutoTruncation: true,
      preserveRoot: true,
      preserveLeaves: 3,
      enablePathOptimization: true,
      ...config
    };
  }

  /**
   * Add new entry to path
   */
  addEntry(entry: Omit<BreadcrumbEntry, 'isActive'>): void {
    const newEntry: BreadcrumbEntry = {
      ...entry,
      isActive: true
    };

    // Deactivate previous active entry
    if (this.currentIndex >= 0 && this.currentIndex < this.path.length) {
      this.path[this.currentIndex].isActive = false;
    }

    // Add new entry
    this.path.push(newEntry);
    this.currentIndex = this.path.length - 1;

    // Apply path length limits
    this.enforcePathLimits();

    // Optimize path if enabled
    if (this.config.enablePathOptimization) {
      this.optimizePath();
    }
  }

  /**
   * Navigate to specific entry in path
   */
  navigateTo(index: number): boolean {
    if (index < 0 || index >= this.path.length) {
      return false;
    }

    // Update active states
    this.path.forEach((entry, i) => {
      entry.isActive = i === index;
    });

    this.currentIndex = index;
    return true;
  }

  /**
   * Navigate to entry by ID
   */
  navigateToId(id: string): boolean {
    const index = this.path.findIndex(entry => entry.id === id);
    return index !== -1 ? this.navigateTo(index) : false;
  }

  /**
   * Get current path
   */
  getPath(): BreadcrumbEntry[] {
    return [...this.path];
  }

  /**
   * Get current active entry
   */
  getCurrentEntry(): BreadcrumbEntry | null {
    return this.currentIndex >= 0 ? this.path[this.currentIndex] : null;
  }

  /**
   * Remove entries after current position (when navigating to earlier position)
   */
  truncateAfterCurrent(): void {
    if (this.currentIndex >= 0) {
      this.path = this.path.slice(0, this.currentIndex + 1);
    }
  }

  /**
   * Clear entire path
   */
  clearPath(): void {
    this.path = [];
    this.currentIndex = -1;
  }

  /**
   * Enforce path length limits
   */
  private enforcePathLimits(): void {
    if (!this.config.enableAutoTruncation || this.path.length <= this.config.maxPathLength) {
      return;
    }

    const excessCount = this.path.length - this.config.maxPathLength;
    let startIndex = 0;

    // Preserve root if configured
    if (this.config.preserveRoot && this.path.length > 0) {
      startIndex = 1; // Keep first entry
    }

    // Calculate entries to remove
    const endPreserveCount = Math.min(this.config.preserveLeaves, this.path.length - startIndex);
    const removeCount = Math.min(excessCount, this.path.length - startIndex - endPreserveCount);

    if (removeCount > 0) {
      const newPath: BreadcrumbEntry[] = [];
      
      // Add preserved root
      if (startIndex > 0) {
        newPath.push(this.path[0]);
      }
      
      // Skip removed entries and add remaining
      const remainingStart = startIndex + removeCount;
      newPath.push(...this.path.slice(remainingStart));
      
      // Update path and current index
      this.path = newPath;
      this.currentIndex = Math.max(0, this.currentIndex - removeCount);
    }
  }

  /**
   * Optimize path by removing redundant entries
   */
  private optimizePath(): void {
    // Remove consecutive duplicate entries (same ID)
    const optimized: BreadcrumbEntry[] = [];
    
    for (let i = 0; i < this.path.length; i++) {
      const current = this.path[i];
      const previous = i > 0 ? this.path[i - 1] : null;
      
      // Keep entry if it's different from previous or is the active entry
      if (!previous || previous.id !== current.id || current.isActive) {
        optimized.push(current);
      }
    }

    if (optimized.length !== this.path.length) {
      this.path = optimized;
      this.currentIndex = this.path.findIndex(entry => entry.isActive);
    }
  }
}

/**
 * Breadcrumb navigation renderer
 */
export class NavigationRenderer {
  private style: BreadcrumbStyle;
  private responsive: ResponsiveBreadcrumbConfig;

  constructor(
    style: BreadcrumbStyle,
    responsive: ResponsiveBreadcrumbConfig
  ) {
    this.style = style;
    this.responsive = responsive;
  }

  /**
   * Render breadcrumb navigation
   */
  render(entries: BreadcrumbEntry[], terminalWidth: number): string {
    if (entries.length === 0) {
      return '';
    }

    // Determine rendering mode based on terminal width
    const renderingMode = this.determineRenderingMode(terminalWidth);
    
    switch (renderingMode) {
      case 'full':
        return this.renderFullBreadcrumbs(entries, terminalWidth);
      case 'compact':
        return this.renderCompactBreadcrumbs(entries, terminalWidth);
      case 'minimal':
        return this.renderMinimalBreadcrumbs(entries, terminalWidth);
      case 'hidden':
        return this.renderHiddenBreadcrumbs(entries);
      default:
        return this.renderFullBreadcrumbs(entries, terminalWidth);
    }
  }

  /**
   * Determine appropriate rendering mode
   */
  private determineRenderingMode(terminalWidth: number): 'full' | 'compact' | 'minimal' | 'hidden' {
    if (terminalWidth <= this.responsive.breakpoints.hideLabels) {
      return 'hidden';
    } else if (terminalWidth <= this.responsive.breakpoints.minimal) {
      return 'minimal';
    } else if (terminalWidth <= this.responsive.breakpoints.compact) {
      return 'compact';
    } else {
      return 'full';
    }
  }

  /**
   * Render full breadcrumbs with all details
   */
  private renderFullBreadcrumbs(entries: BreadcrumbEntry[], terminalWidth: number): string {
    const availableWidth = terminalWidth - 20; // Reserve space for margins
    const rawSeparator = DisplayUtils.separator(1);
    const separator = this.style.theme.muted(rawSeparator || this.style.separator);
    const parts: string[] = [];
    let currentWidth = 0;

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const isLast = i === entries.length - 1;
      
      // Format entry title
      let title = this.formatEntryTitle(entry, 'full');
      const titleWidth = StringWidthUtils.getDisplayWidth(title);
      const separatorWidth = isLast ? 0 : StringWidthUtils.getDisplayWidth(this.style.separator);
      
      // Check if adding this entry would exceed available width
      if (currentWidth + titleWidth + separatorWidth > availableWidth && parts.length > 0) {
        // Handle overflow
        if (this.responsive.overflowHandling === 'truncate') {
          parts.push(this.style.theme.muted('...'));
          break;
        }
        // For scroll/dropdown, we'd need interactive handling
      }

      parts.push(title);
      currentWidth += titleWidth;

      if (!isLast) {
        parts.push(separator);
        currentWidth += separatorWidth;
      }
    }

    return parts.join('');
  }

  /**
   * Render compact breadcrumbs with shortened titles
   */
  private renderCompactBreadcrumbs(entries: BreadcrumbEntry[], terminalWidth: number): string {
    const availableWidth = terminalWidth - 15;
    const compactSeparator = DisplayUtils.separator(1);
    const separator = this.style.theme.muted(compactSeparator || ' › ');
    const parts: string[] = [];

    // Show first, ellipsis, and last few entries
    if (entries.length <= 4) {
      entries.forEach((entry, i) => {
        const title = this.formatEntryTitle(entry, 'compact');
        parts.push(title);
        
        if (i < entries.length - 1) {
          parts.push(separator);
        }
      });
    } else {
      // First entry
      parts.push(this.formatEntryTitle(entries[0], 'compact'));
      parts.push(separator);
      
      // Ellipsis
      parts.push(this.style.theme.muted('...'));
      parts.push(separator);
      
      // Last two entries
      const lastEntries = entries.slice(-2);
      lastEntries.forEach((entry, i) => {
        parts.push(this.formatEntryTitle(entry, 'compact'));
        if (i < lastEntries.length - 1) {
          parts.push(separator);
        }
      });
    }

    return parts.join('');
  }

  /**
   * Render minimal breadcrumbs (current + parent)
   */
  private renderMinimalBreadcrumbs(entries: BreadcrumbEntry[], terminalWidth?: number): string {
    const activeEntry = entries.find(e => e.isActive);
    if (!activeEntry) {
      return '';
    }

    const activeIndex = entries.indexOf(activeEntry);
    const parentEntry = activeIndex > 0 ? entries[activeIndex - 1] : null;

    if (parentEntry) {
      const parent = this.formatEntryTitle(parentEntry, 'minimal');
      const current = this.formatEntryTitle(activeEntry, 'minimal');
      const minimalSeparator = DisplayUtils.separator(1);
      const renderedSeparator = this.style.theme.muted(minimalSeparator || '›');
      return `${parent} ${renderedSeparator} ${current}`;
    } else {
      return this.formatEntryTitle(activeEntry, 'minimal');
    }
  }

  /**
   * Render hidden breadcrumbs (just depth indicator)
   */
  private renderHiddenBreadcrumbs(entries: BreadcrumbEntry[]): string {
    const depth = entries.length;
    return this.style.theme.muted(`[${depth}]`);
  }

  /**
   * Format entry title based on rendering mode
   */
  private formatEntryTitle(entry: BreadcrumbEntry, mode: 'full' | 'compact' | 'minimal'): string {
    const theme = this.style.theme;
    let title = entry.title;
    let maxLength = this.style.maxTitleLength;

    // Adjust max length based on mode
    switch (mode) {
      case 'compact':
        maxLength = Math.min(15, maxLength);
        title = entry.shortTitle || entry.title;
        break;
      case 'minimal':
        maxLength = Math.min(10, maxLength);
        title = entry.shortTitle || entry.title;
        break;
    }

    const safeMaxLength = Math.max(1, maxLength);
    title = StringUtils.chain(title, { mode: 'terminal' })
      .truncate(safeMaxLength)
      .value();

    // Apply styling
    if (entry.isActive) {
      return theme.accent(title);
    } else if (entry.isClickable) {
      return theme.primary(title);
    } else {
      return theme.muted(title);
    }
  }

  /**
   * Update rendering style
   */
  updateStyle(newStyle: Partial<BreadcrumbStyle>): void {
    this.style = { ...this.style, ...newStyle };
  }

  /**
   * Update responsive configuration
   */
  updateResponsive(newResponsive: Partial<ResponsiveBreadcrumbConfig>): void {
    this.responsive = { ...this.responsive, ...newResponsive };
  }
}

/**
 * Main breadcrumb manager
 */
export class BreadcrumbManager extends EventEmitter implements TypedEventEmitter<BreadcrumbEvents> {
  private pathTracker: PathTracker;
  private renderer: NavigationRenderer;
  private config: BreadcrumbManagerConfig;
  private terminalWidth: number;

  constructor(config: Partial<BreadcrumbManagerConfig> = {}) {
    super();

    this.config = {
      style: {
        separator: ' › ',
        maxTitleLength: 25,
        showDepthNumbers: false,
        showTimestamp: false,
        compactMode: false,
        highlightActive: true,
        theme: DefaultColorThemes.default
      },
      pathTracking: {
        maxPathLength: 15,
        enableAutoTruncation: true,
        preserveRoot: true,
        preserveLeaves: 3,
        enablePathOptimization: true
      },
      responsive: {
        breakpoints: {
          compact: 80,
          minimal: 60,
          hideLabels: 40
        },
        adaptiveLabels: true,
        dynamicSeparators: true,
        overflowHandling: 'truncate'
      },
      enableInteraction: true,
      enableKeyboardNavigation: true,
      autoUpdate: true,
      ...config
    };

    this.pathTracker = new PathTracker(this.config.pathTracking);
    this.renderer = new NavigationRenderer(this.config.style, this.config.responsive);
    this.terminalWidth = process.stdout.columns || 80;

    this.setupTerminalResize();
  }

  /**
   * Push new breadcrumb entry
   */
  pushBreadcrumb(entry: Omit<BreadcrumbEntry, 'isActive' | 'isClickable'>): void {
    const breadcrumbEntry: BreadcrumbEntry = {
      ...entry,
      isActive: false,
      isClickable: this.config.enableInteraction
    };

    this.pathTracker.addEntry(breadcrumbEntry);
    
    if (this.config.autoUpdate) {
      const path = this.pathTracker.getPath();
      const currentIndex = path.findIndex(e => e.isActive);
      this.emit('pathChanged', path, currentIndex);
    }
  }

  /**
   * Navigate to breadcrumb by path
   */
  navigateToPath(path: string[]): boolean {
    // Implementation would depend on how paths are structured
    // For now, navigate by ID if path has IDs
    if (path.length > 0) {
      return this.navigateToId(path[path.length - 1]);
    }
    return false;
  }

  /**
   * Navigate to breadcrumb by ID
   */
  navigateToId(id: string): boolean {
    const success = this.pathTracker.navigateToId(id);
    
    if (success) {
      const entry = this.pathTracker.getCurrentEntry();
      if (entry) {
        const path = this.pathTracker.getPath();
        const currentIndex = path.findIndex(e => e.isActive);
        this.emit('breadcrumbClicked', entry, currentIndex);
        this.emit('pathChanged', path, currentIndex);
      }
    }
    
    return success;
  }

  /**
   * Render current breadcrumbs
   */
  renderBreadcrumbs(): string {
    const entries = this.pathTracker.getPath();
    return this.renderer.render(entries, this.terminalWidth);
  }

  /**
   * Get current breadcrumb path
   */
  getCurrentPath(): BreadcrumbEntry[] {
    return this.pathTracker.getPath();
  }

  /**
   * Get current active entry
   */
  getCurrentEntry(): BreadcrumbEntry | null {
    return this.pathTracker.getCurrentEntry();
  }

  /**
   * Clear all breadcrumbs
   */
  clear(): void {
    this.pathTracker.clearPath();
    this.emit('pathChanged', [], -1);
  }

  /**
   * Handle keyboard navigation
   */
  handleKeyboardNavigation(key: string): boolean {
    if (!this.config.enableKeyboardNavigation) {
      return false;
    }

    const entries = this.pathTracker.getPath();
    const currentIndex = entries.findIndex(e => e.isActive);

    switch (key) {
      case 'left':
      case 'ArrowLeft':
        if (currentIndex > 0) {
          return this.pathTracker.navigateTo(currentIndex - 1);
        }
        break;
        
      case 'right':
      case 'ArrowRight':
        if (currentIndex < entries.length - 1) {
          return this.pathTracker.navigateTo(currentIndex + 1);
        }
        break;
        
      case 'home':
      case 'Home':
        if (entries.length > 0) {
          return this.pathTracker.navigateTo(0);
        }
        break;
        
      case 'end':
      case 'End':
        if (entries.length > 0) {
          return this.pathTracker.navigateTo(entries.length - 1);
        }
        break;
    }

    return false;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<BreadcrumbManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.style) {
      this.renderer.updateStyle(newConfig.style);
      this.emit('styleChanged', this.config.style);
    }
    
    if (newConfig.responsive) {
      this.renderer.updateResponsive(newConfig.responsive);
    }
  }

  /**
   * Setup terminal resize handling
   */
  private setupTerminalResize(): void {
    process.stdout.on('resize', () => {
      this.terminalWidth = process.stdout.columns || 80;
      
      if (this.config.autoUpdate) {
        const path = this.pathTracker.getPath();
        const currentIndex = path.findIndex(e => e.isActive);
        this.emit('pathChanged', path, currentIndex);
      }
    });
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.removeAllListeners();
    process.stdout.removeAllListeners('resize');
  }
}

/**
 * Factory function for creating breadcrumb manager
 */
export function createBreadcrumbManager(config?: Partial<BreadcrumbManagerConfig>): BreadcrumbManager {
  return new BreadcrumbManager(config);
}

/**
 * Utility function for creating breadcrumb entry
 */
export function createBreadcrumbEntry(
  id: string,
  title: string,
  options: Partial<Pick<BreadcrumbEntry, 'shortTitle' | 'description' | 'depth' | 'metadata'>> = {}
): Omit<BreadcrumbEntry, 'isActive' | 'isClickable' | 'timestamp'> {
  return {
    id,
    title,
    shortTitle: options.shortTitle,
    description: options.description,
    depth: options.depth || 0,
    metadata: options.metadata
  };
}
