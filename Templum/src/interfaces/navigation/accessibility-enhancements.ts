/**
---
date: 2025-09-12T174343Z
name: CLI Navigation Accessibility Enhancements
TASK-ID: [TASK-MCP-006]
category: navigation-system
status: ["[T]"]
patterns: [accessibility-compliance, keyboard-navigation, screen-reader-support]
components: [AccessibilityManager, KeyboardNavigator, ScreenReaderSupport]
dependencies: [terminal-ui-components, keyboard-input-handling]
tags: [cli, navigation, accessibility, keyboard-support, inclusive-design]
---
 * 
 * Accessibility Enhancements for CLI Navigation
 * 
 * Provides comprehensive accessibility features including keyboard navigation,
 * screen reader support, high contrast mode, and inclusive design patterns.
 * Ensures the navigation system is usable by users with diverse abilities.
 * 
 * Generated: 2025-09-12T174343Z
 * TASK-ID: TASK-MCP-006 Pattern: accessibility-compliance | Complexity: 5 | Dependencies: keyboard-handling,screen-reader
 * Context: Comprehensive accessibility system for inclusive navigation design
 * Validation-Required: screen-reader-testing, keyboard-only-navigation, wcag-compliance
 * Pattern-Info: { approach: "comprehensive-accessibility", alternatives: "basic-keyboard-support", trade-offs: "complexity-inclusivity" }
 */

import { TerminalColorTheme, DefaultColorThemes } from '../terminal-ui-components';
import { TerminalCapabilities } from './terminal-compatibility';
import { EventDrivenComponent } from '../../utils/event-bus-adapter';
import { TypedEventMap } from '../../utils/event-utils';

// TODO: [TASK-ID-014] Pattern: accessibility-compliance | Complexity: 4 | Dependencies: wcag-guidelines
// Context: WCAG 2.1 AA compliance implementation for terminal interfaces
// Validation-Required: wcag-automated-testing, manual-accessibility-review, user-testing
// Pattern-Info: { approach: "wcag-compliance", alternatives: "basic-accessibility", trade-offs: "standards-complexity" }

/**
 * Accessibility configuration options
 */
export interface AccessibilityConfig {
  // Keyboard navigation
  enableKeyboardNavigation: boolean;
  keyboardNavigationMode: 'vim' | 'arrow' | 'both';
  enableTabNavigation: boolean;
  enableShortcuts: boolean;
  
  // Screen reader support
  enableScreenReader: boolean;
  announceChanges: boolean;
  verbosityLevel: 'minimal' | 'standard' | 'verbose';
  
  // Visual accessibility
  highContrastMode: boolean;
  reducedMotion: boolean;
  largeText: boolean;
  colorBlindFriendly: boolean;
  
  // Audio feedback
  enableAudioCues: boolean;
  audioVolume: number; // 0-100
  
  // Focus management
  visibleFocus: boolean;
  focusTrap: boolean;
  skipLinks: boolean;
  
  // Timing
  extendedTimeouts: boolean;
  pausableAnimations: boolean;
  
  // Input assistance
  stickyKeys: boolean;
  keyRepeatDelay: number;
  confirmActions: boolean;
}

/**
 * Keyboard navigation context
 */
export interface NavigationContext {
  currentFocus: string;
  focusStack: string[];
  navigableElements: NavigableElement[];
  currentIndex: number;
  totalElements: number;
  navigationMode: string;
}

/**
 * Navigable element definition
 */
export interface NavigableElement {
  id: string;
  type: 'menu-item' | 'button' | 'input' | 'list' | 'container' | 'link';
  label: string;
  description?: string;
  shortcut?: string;
  isDisabled: boolean;
  isVisible: boolean;
  bounds?: { x: number; y: number; width: number; height: number };
  ariaRole?: string;
  ariaLabel?: string;
  ariaDescription?: string;
}

/**
 * Screen reader announcement
 */
export interface Announcement {
  text: string;
  priority: 'low' | 'medium' | 'high' | 'assertive';
  type: 'navigation' | 'status' | 'alert' | 'error' | 'success';
  timestamp: number;
  context?: string;
}

/**
 * Accessibility events
 */
export interface AccessibilityEvents extends TypedEventMap {
  'focusChanged': (element: NavigableElement, context: NavigationContext) => void;
  'announcement': (announcement: Announcement) => void;
  'navigationModeChanged': (mode: string) => void;
  'accessibilityViolation': (violation: AccessibilityViolation) => void;
  'keyboardShortcut': (shortcut: string, action: string) => void;
}

/**
 * Accessibility violation report
 */
export interface AccessibilityViolation {
  type: 'missing-label' | 'keyboard-trap' | 'contrast-issue' | 'focus-issue' | 'timing-issue';
  severity: 'error' | 'warning' | 'info';
  element: string;
  description: string;
  recommendation: string;
}

/**
 * Screen reader support system
 */
export class ScreenReaderSupport {
  private config: AccessibilityConfig;
  private announcements: Announcement[] = [];
  private lastAnnouncement: Announcement | null = null;

  constructor(config: AccessibilityConfig) {
    this.config = config;
  }

  /**
   * Make screen reader announcement
   */
  announce(
    text: string, 
    priority: Announcement['priority'] = 'medium',
    type: Announcement['type'] = 'status',
    context?: string
  ): void {
    if (!this.config.enableScreenReader) {
      return;
    }

    const announcement: Announcement = {
      text: this.processAnnouncementText(text),
      priority,
      type,
      timestamp: Date.now(),
      context
    };

    // Prevent duplicate consecutive announcements
    if (this.lastAnnouncement && 
        this.lastAnnouncement.text === announcement.text &&
        Date.now() - this.lastAnnouncement.timestamp < 1000) {
      return;
    }

    this.announcements.push(announcement);
    this.lastAnnouncement = announcement;

    // Output announcement based on verbosity
    this.outputAnnouncement(announcement);

    // Keep only recent announcements
    if (this.announcements.length > 100) {
      this.announcements = this.announcements.slice(-50);
    }
  }

  /**
   * Process announcement text based on verbosity level
   */
  private processAnnouncementText(text: string): string {
    switch (this.config.verbosityLevel) {
      case 'minimal':
        return this.createMinimalAnnouncement(text);
      case 'verbose':
        return this.createVerboseAnnouncement(text);
      case 'standard':
      default:
        return this.createStandardAnnouncement(text);
    }
  }

  /**
   * Create minimal announcement
   */
  private createMinimalAnnouncement(text: string): string {
    // Strip unnecessary words and shorten
    return text
      .replace(/^(navigated to|selected|activated)\s*/i, '')
      .replace(/\s+(menu|item|button|link)$/i, '')
      .trim();
  }

  /**
   * Create standard announcement
   */
  private createStandardAnnouncement(text: string): string {
    return text.trim();
  }

  /**
   * Create verbose announcement
   */
  private createVerboseAnnouncement(text: string): string {
    // Add context and navigation hints
    const enhanced = text.trim();
    
    if (enhanced.includes('menu')) {
      return `${enhanced}. Use arrow keys to navigate, Enter to select, Escape to go back.`;
    }
    
    if (enhanced.includes('selected') || enhanced.includes('activated')) {
      return `${enhanced}. Action completed.`;
    }
    
    return enhanced;
  }

  /**
   * Output announcement to screen reader
   */
  private outputAnnouncement(announcement: Announcement): void {
    // For terminal applications, we output announcements as structured text
    // that can be picked up by screen readers
    
    let output = '';
    
    switch (announcement.priority) {
      case 'assertive':
      case 'high':
        output = `[ALERT] ${announcement.text}`;
        break;
      case 'medium':
        output = `[INFO] ${announcement.text}`;
        break;
      case 'low':
        output = announcement.text;
        break;
    }

    // Output to stderr to avoid interfering with main content
    process.stderr.write(`\n${output}\n`);
  }

  /**
   * Announce navigation change
   */
  announceNavigation(element: NavigableElement, context: NavigationContext): void {
    let announcement = '';

    if (element.ariaLabel) {
      announcement = element.ariaLabel;
    } else {
      announcement = `${element.label}`;
      
      if (element.type !== 'menu-item') {
        announcement += ` ${element.type}`;
      }
    }

    // Add position information for lists
    if (context.totalElements > 1) {
      announcement += `, ${context.currentIndex + 1} of ${context.totalElements}`;
    }

    // Add description if available
    if (element.description && this.config.verbosityLevel !== 'minimal') {
      announcement += `. ${element.description}`;
    }

    // Add shortcut information
    if (element.shortcut && this.config.verbosityLevel === 'verbose') {
      announcement += `. Shortcut: ${element.shortcut}`;
    }

    this.announce(announcement, 'medium', 'navigation');
  }

  /**
   * Announce status change
   */
  announceStatus(status: string, type: Announcement['type'] = 'status'): void {
    this.announce(status, 'medium', type);
  }

  /**
   * Get announcement history
   */
  getAnnouncementHistory(): Announcement[] {
    return [...this.announcements];
  }

  /**
   * Clear announcement history
   */
  clearHistory(): void {
    this.announcements = [];
    this.lastAnnouncement = null;
  }
}

/**
 * Keyboard navigation manager
 */
interface KeyboardNavigatorEvents extends TypedEventMap {
  keyboardShortcut: (shortcut: string, action: string) => void;
  navigationBack: () => void;
  elementActivated: (element: NavigableElement) => void;
  helpRequested: () => void;
  focusChanged: (element: NavigableElement, context: NavigationContext) => void;
  navigationModeChanged: (mode: string) => void;
}

export class KeyboardNavigator extends EventDrivenComponent<KeyboardNavigatorEvents> {
  private static instanceCounter = 0;
  private config: AccessibilityConfig;
  private context: NavigationContext;
  private keyboardHandlers = new Map<string, (event: any) => void>();
  private focusHistory: string[] = [];

  constructor(config: AccessibilityConfig) {
    super(`keyboard-navigator:${KeyboardNavigator.instanceCounter++}`, 25);
    this.config = config;
    this.context = {
      currentFocus: '',
      focusStack: [],
      navigableElements: [],
      currentIndex: -1,
      totalElements: 0,
      navigationMode: config.keyboardNavigationMode
    };

    this.setupKeyboardHandlers();
  }

  /**
   * Setup keyboard event handlers
   */
  private setupKeyboardHandlers(): void {
    // Arrow key navigation
    this.keyboardHandlers.set('ArrowUp', () => this.navigateUp());
    this.keyboardHandlers.set('ArrowDown', () => this.navigateDown());
    this.keyboardHandlers.set('ArrowLeft', () => this.navigateLeft());
    this.keyboardHandlers.set('ArrowRight', () => this.navigateRight());

    // Vim-style navigation (if enabled)
    if (this.config.keyboardNavigationMode === 'vim' || 
        this.config.keyboardNavigationMode === 'both') {
      this.keyboardHandlers.set('k', () => this.navigateUp());
      this.keyboardHandlers.set('j', () => this.navigateDown());
      this.keyboardHandlers.set('h', () => this.navigateLeft());
      this.keyboardHandlers.set('l', () => this.navigateRight());
      this.keyboardHandlers.set('g', () => this.navigateToFirst());
      this.keyboardHandlers.set('G', () => this.navigateToLast());
    }

    // Tab navigation
    if (this.config.enableTabNavigation) {
      this.keyboardHandlers.set('Tab', () => this.navigateNext());
      this.keyboardHandlers.set('Shift+Tab', () => this.navigatePrevious());
    }

    // Action keys
    this.keyboardHandlers.set('Enter', () => this.activateElement());
    this.keyboardHandlers.set('Space', () => this.activateElement());
    this.keyboardHandlers.set('Escape', () => this.navigateBack());

    // Navigation shortcuts
    this.keyboardHandlers.set('Home', () => this.navigateToFirst());
    this.keyboardHandlers.set('End', () => this.navigateToLast());
    this.keyboardHandlers.set('PageUp', () => this.navigatePageUp());
    this.keyboardHandlers.set('PageDown', () => this.navigatePageDown());

    // Accessibility shortcuts
    this.keyboardHandlers.set('Alt+1', () => this.skipToMain());
    this.keyboardHandlers.set('Alt+2', () => this.skipToNavigation());
    this.keyboardHandlers.set('Alt+h', () => this.showHelp());
  }

  /**
   * Set navigable elements
   */
  setNavigableElements(elements: NavigableElement[]): void {
    this.context.navigableElements = elements.filter(el => el.isVisible && !el.isDisabled);
    this.context.totalElements = this.context.navigableElements.length;
    
    // Maintain focus if possible
    if (this.context.currentFocus) {
      const newIndex = this.context.navigableElements.findIndex(
        el => el.id === this.context.currentFocus
      );
      this.context.currentIndex = newIndex >= 0 ? newIndex : 0;
    } else {
      this.context.currentIndex = 0;
    }

    this.updateFocus();
  }

  /**
   * Handle keyboard input
   */
  handleKeyboard(key: string, modifiers: string[] = []): boolean {
    const fullKey = modifiers.length > 0 ? `${modifiers.join('+')}+${key}` : key;
    const handler = this.keyboardHandlers.get(fullKey) || this.keyboardHandlers.get(key);

    if (handler) {
      handler({ key, modifiers });
      this.emit('keyboardShortcut', fullKey, 'navigation');
      return true;
    }

    // Handle number shortcuts for quick selection
    if (/^\d$/.test(key)) {
      const index = parseInt(key, 10) - 1;
      if (index >= 0 && index < this.context.totalElements) {
        this.navigateToIndex(index);
        return true;
      }
    }

    return false;
  }

  /**
   * Navigation methods
   */
  private navigateUp(): void {
    if (this.context.currentIndex > 0) {
      this.context.currentIndex--;
      this.updateFocus();
    }
  }

  private navigateDown(): void {
    if (this.context.currentIndex < this.context.totalElements - 1) {
      this.context.currentIndex++;
      this.updateFocus();
    }
  }

  private navigateLeft(): void {
    // For horizontal navigation or breadcrumbs
    this.navigateBack();
  }

  private navigateRight(): void {
    // For horizontal navigation or activating current element
    this.activateElement();
  }

  private navigateNext(): void {
    this.navigateDown();
  }

  private navigatePrevious(): void {
    this.navigateUp();
  }

  private navigateToFirst(): void {
    if (this.context.totalElements > 0) {
      this.context.currentIndex = 0;
      this.updateFocus();
    }
  }

  private navigateToLast(): void {
    if (this.context.totalElements > 0) {
      this.context.currentIndex = this.context.totalElements - 1;
      this.updateFocus();
    }
  }

  private navigateToIndex(index: number): void {
    if (index >= 0 && index < this.context.totalElements) {
      this.context.currentIndex = index;
      this.updateFocus();
    }
  }

  private navigatePageUp(): void {
    const pageSize = Math.min(10, Math.ceil(this.context.totalElements / 4));
    const newIndex = Math.max(0, this.context.currentIndex - pageSize);
    this.context.currentIndex = newIndex;
    this.updateFocus();
  }

  private navigatePageDown(): void {
    const pageSize = Math.min(10, Math.ceil(this.context.totalElements / 4));
    const newIndex = Math.min(this.context.totalElements - 1, this.context.currentIndex + pageSize);
    this.context.currentIndex = newIndex;
    this.updateFocus();
  }

  private navigateBack(): void {
    if (this.focusHistory.length > 0) {
      const previousFocus = this.focusHistory.pop()!;
      const previousIndex = this.context.navigableElements.findIndex(el => el.id === previousFocus);
      
      if (previousIndex >= 0) {
        this.context.currentIndex = previousIndex;
        this.updateFocus(false); // Don't add to history
      }
    }
    
    this.emit('navigationBack');
  }

  private activateElement(): void {
    const currentElement = this.getCurrentElement();
    if (currentElement && !currentElement.isDisabled) {
      this.emit('elementActivated', currentElement);
    }
  }

  private skipToMain(): void {
    // Find main content area
    const mainElement = this.context.navigableElements.find(el => 
      el.type === 'container' && el.ariaRole === 'main'
    );
    
    if (mainElement) {
      const index = this.context.navigableElements.indexOf(mainElement);
      this.navigateToIndex(index);
    }
  }

  private skipToNavigation(): void {
    // Find navigation area
    const navElement = this.context.navigableElements.find(el => 
      el.type === 'container' && el.ariaRole === 'navigation'
    );
    
    if (navElement) {
      const index = this.context.navigableElements.indexOf(navElement);
      this.navigateToIndex(index);
    }
  }

  private showHelp(): void {
    this.emit('helpRequested');
  }

  /**
   * Update focus and emit events
   */
  private updateFocus(addToHistory = true): void {
    const currentElement = this.getCurrentElement();
    
    if (currentElement) {
      // Add previous focus to history
      if (addToHistory && this.context.currentFocus && 
          this.context.currentFocus !== currentElement.id) {
        this.focusHistory.push(this.context.currentFocus);
        
        // Limit history size
        if (this.focusHistory.length > 20) {
          this.focusHistory = this.focusHistory.slice(-10);
        }
      }

      this.context.currentFocus = currentElement.id;
      this.emit('focusChanged', currentElement, this.context);
    }
  }

  /**
   * Get current focused element
   */
  getCurrentElement(): NavigableElement | null {
    if (this.context.currentIndex >= 0 && 
        this.context.currentIndex < this.context.totalElements) {
      return this.context.navigableElements[this.context.currentIndex];
    }
    return null;
  }

  /**
   * Get navigation context
   */
  getContext(): NavigationContext {
    return { ...this.context };
  }

  /**
   * Focus specific element by ID
   */
  focusElement(elementId: string): boolean {
    const index = this.context.navigableElements.findIndex(el => el.id === elementId);
    
    if (index >= 0) {
      this.navigateToIndex(index);
      return true;
    }
    
    return false;
  }

  /**
   * Update navigation mode
   */
  setNavigationMode(mode: AccessibilityConfig['keyboardNavigationMode']): void {
    this.config.keyboardNavigationMode = mode;
    this.context.navigationMode = mode;
    this.setupKeyboardHandlers(); // Refresh handlers
    this.emit('navigationModeChanged', mode);
  }
}

/**
 * Accessibility validator
 */
export class AccessibilityValidator {
  private violations: AccessibilityViolation[] = [];

  /**
   * Validate navigable elements for accessibility compliance
   */
  validateElements(elements: NavigableElement[]): AccessibilityViolation[] {
    this.violations = [];

    for (const element of elements) {
      this.validateElement(element);
    }

    return [...this.violations];
  }

  /**
   * Validate individual element
   */
  private validateElement(element: NavigableElement): void {
    // Check for missing labels
    if (!element.label && !element.ariaLabel) {
      this.addViolation({
        type: 'missing-label',
        severity: 'error',
        element: element.id,
        description: `Element ${element.id} has no accessible label`,
        recommendation: 'Add a label or aria-label attribute'
      });
    }

    // Check for disabled elements without proper indication
    if (element.isDisabled && !element.ariaDescription?.includes('disabled')) {
      this.addViolation({
        type: 'focus-issue',
        severity: 'warning',
        element: element.id,
        description: `Disabled element ${element.id} may not be properly announced`,
        recommendation: 'Add "disabled" to aria-description'
      });
    }

    // Check for interactive elements without proper roles
    if (element.type === 'button' && !element.ariaRole) {
      this.addViolation({
        type: 'missing-label',
        severity: 'info',
        element: element.id,
        description: `Button element ${element.id} should have explicit role`,
        recommendation: 'Add aria-role="button"'
      });
    }
  }

  /**
   * Add violation to list
   */
  private addViolation(violation: AccessibilityViolation): void {
    this.violations.push(violation);
  }

  /**
   * Get violations by severity
   */
  getViolationsBySeverity(severity: AccessibilityViolation['severity']): AccessibilityViolation[] {
    return this.violations.filter(v => v.severity === severity);
  }

  /**
   * Check if validation passed
   */
  isValid(): boolean {
    return this.getViolationsBySeverity('error').length === 0;
  }
}

/**
 * Main accessibility manager
 */
export class AccessibilityManager extends EventDrivenComponent<AccessibilityEvents> {
  private static instanceCounter = 0;
  private config: AccessibilityConfig;
  private screenReader: ScreenReaderSupport;
  private keyboardNavigator: KeyboardNavigator;
  private validator: AccessibilityValidator;
  private terminalCapabilities: TerminalCapabilities | null = null;

  constructor(config: Partial<AccessibilityConfig> = {}) {
    super(`accessibility-manager:${AccessibilityManager.instanceCounter++}`, 50);

    this.config = {
      enableKeyboardNavigation: true,
      keyboardNavigationMode: 'arrow',
      enableTabNavigation: true,
      enableShortcuts: true,
      enableScreenReader: true,
      announceChanges: true,
      verbosityLevel: 'standard',
      highContrastMode: false,
      reducedMotion: false,
      largeText: false,
      colorBlindFriendly: false,
      enableAudioCues: false,
      audioVolume: 50,
      visibleFocus: true,
      focusTrap: false,
      skipLinks: true,
      extendedTimeouts: false,
      pausableAnimations: false,
      stickyKeys: false,
      keyRepeatDelay: 500,
      confirmActions: false,
      ...config
    };

    this.screenReader = new ScreenReaderSupport(this.config);
    this.keyboardNavigator = new KeyboardNavigator(this.config);
    this.validator = new AccessibilityValidator();

    this.setupEventHandlers();
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.keyboardNavigator.on('focusChanged', (element, context) => {
      this.screenReader.announceNavigation(element, context);
      this.emit('focusChanged', element, context);
    });

    this.keyboardNavigator.on('elementActivated', (element) => {
      this.screenReader.announce(`Activated ${element.label}`, 'medium', 'status');
    });

    this.keyboardNavigator.on('navigationModeChanged', (mode) => {
      this.screenReader.announce(`Navigation mode changed to ${mode}`, 'low', 'status');
      this.emit('navigationModeChanged', mode);
    });

    this.keyboardNavigator.on('keyboardShortcut', (shortcut, action) => {
      this.emit('keyboardShortcut', shortcut, action);
    });
  }

  /**
   * Initialize accessibility system with terminal capabilities
   */
  initialize(capabilities: TerminalCapabilities): void {
    this.terminalCapabilities = capabilities;
    
    // Adjust configuration based on terminal capabilities
    if (!capabilities.supportsColor) {
      this.config.highContrastMode = true;
    }

    if (!capabilities.supportsUnicode) {
      this.config.verbosityLevel = 'verbose'; // Need more verbal cues
    }

    if (capabilities.screenReaderCompatible) {
      this.config.enableScreenReader = true;
      this.config.announceChanges = true;
    }
  }

  /**
   * Set navigable elements
   */
  setNavigableElements(elements: NavigableElement[]): void {
    // Validate elements for accessibility
    const violations = this.validator.validateElements(elements);
    
    violations.forEach(violation => {
      this.emit('accessibilityViolation', violation);
    });

    // Set elements for keyboard navigation
    this.keyboardNavigator.setNavigableElements(elements);
  }

  /**
   * Handle keyboard input
   */
  handleKeyboard(key: string, modifiers: string[] = []): boolean {
    if (!this.config.enableKeyboardNavigation) {
      return false;
    }

    return this.keyboardNavigator.handleKeyboard(key, modifiers);
  }

  /**
   * Make announcement
   */
  announce(text: string, priority?: Announcement['priority'], type?: Announcement['type']): void {
    this.screenReader.announce(text, priority, type);
    
    const announcement: Announcement = {
      text,
      priority: priority || 'medium',
      type: type || 'status',
      timestamp: Date.now()
    };
    
    this.emit('announcement', announcement);
  }

  /**
   * Focus specific element
   */
  focusElement(elementId: string): boolean {
    return this.keyboardNavigator.focusElement(elementId);
  }

  /**
   * Get current focused element
   */
  getCurrentElement(): NavigableElement | null {
    return this.keyboardNavigator.getCurrentElement();
  }

  /**
   * Get navigation context
   */
  getNavigationContext(): NavigationContext {
    return this.keyboardNavigator.getContext();
  }

  /**
   * Update accessibility configuration
   */
  updateConfig(newConfig: Partial<AccessibilityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update components
    this.screenReader = new ScreenReaderSupport(this.config);
    this.keyboardNavigator = new KeyboardNavigator(this.config);
    
    this.setupEventHandlers();
  }

  /**
   * Get accessibility configuration
   */
  getConfig(): AccessibilityConfig {
    return { ...this.config };
  }

  /**
   * Generate accessibility report
   */
  generateAccessibilityReport(): {
    overallScore: number;
    violations: AccessibilityViolation[];
    recommendations: string[];
    wcagCompliance: boolean;
  } {
    const violations = this.validator.getViolationsBySeverity('error');
    const warnings = this.validator.getViolationsBySeverity('warning');
    const infos = this.validator.getViolationsBySeverity('info');
    
    const totalViolations = violations.length + warnings.length + infos.length;
    const overallScore = Math.max(0, 100 - (violations.length * 10 + warnings.length * 5 + infos.length * 2));
    
    const recommendations = [
      ...violations.map(v => v.recommendation),
      ...warnings.map(v => v.recommendation)
    ];

    return {
      overallScore,
      violations: [...violations, ...warnings, ...infos],
      recommendations: Array.from(new Set(recommendations)),
      wcagCompliance: violations.length === 0
    };
  }

  /**
   * Enable/disable screen reader mode
   */
  setScreenReaderMode(enabled: boolean): void {
    this.config.enableScreenReader = enabled;
    this.config.announceChanges = enabled;
    this.screenReader = new ScreenReaderSupport(this.config);
    
    if (enabled) {
      this.announce('Screen reader mode enabled', 'high', 'status');
    }
  }

  /**
   * Set navigation mode
   */
  setNavigationMode(mode: AccessibilityConfig['keyboardNavigationMode']): void {
    this.keyboardNavigator.setNavigationMode(mode);
  }

  /**
   * Toggle high contrast mode
   */
  toggleHighContrastMode(): boolean {
    this.config.highContrastMode = !this.config.highContrastMode;
    this.announce(
      `High contrast mode ${this.config.highContrastMode ? 'enabled' : 'disabled'}`,
      'medium',
      'status'
    );
    return this.config.highContrastMode;
  }

  /**
   * Get high contrast theme if enabled
   */
  getAccessibleTheme(): TerminalColorTheme {
    if (!this.config.highContrastMode) {
      return DefaultColorThemes.default;
    }

    // Return high contrast theme
    return {
      ...DefaultColorThemes.default,
      name: 'High Contrast',
      primary: DefaultColorThemes.default.primary,
      secondary: DefaultColorThemes.default.muted,
      success: DefaultColorThemes.default.primary,
      warning: DefaultColorThemes.default.primary,
      error: DefaultColorThemes.default.primary,
      info: DefaultColorThemes.default.primary,
      accent: DefaultColorThemes.default.primary,
      muted: DefaultColorThemes.default.muted
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.removeAllListeners();
    this.keyboardNavigator.removeAllListeners();
    this.screenReader.clearHistory();
  }
}

/**
 * Factory function for creating accessibility manager
 */
export function createAccessibilityManager(config?: Partial<AccessibilityConfig>): AccessibilityManager {
  return new AccessibilityManager(config);
}

/**
 * Utility function to create accessible navigable element
 */
export function createNavigableElement(
  id: string,
  label: string,
  type: NavigableElement['type'],
  options: Partial<NavigableElement> = {}
): NavigableElement {
  return {
    id,
    label,
    type,
    isDisabled: false,
    isVisible: true,
    ariaRole: type === 'menu-item' ? 'menuitem' : type,
    ariaLabel: options.ariaLabel || label,
    ...options
  };
}

/**
 * Utility function for keyboard event normalization
 */
export function normalizeKeyboardEvent(event: any): { key: string; modifiers: string[] } {
  const modifiers: string[] = [];
  
  if (event.ctrlKey) modifiers.push('Ctrl');
  if (event.altKey) modifiers.push('Alt');
  if (event.shiftKey) modifiers.push('Shift');
  if (event.metaKey) modifiers.push('Meta');

  return {
    key: event.key || event.name || '',
    modifiers
  };
}
