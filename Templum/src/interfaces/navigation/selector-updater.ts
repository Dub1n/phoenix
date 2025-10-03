/**
---
date: 2025-09-12T174343Z
name: CLI Navigation Selector Updater
TASK-ID: [TASK-MCP-006]
category: navigation-system
status: ["[T]"]
patterns: [selector-updating, menu-formatting, visual-consistency]
components: [SelectorUpdater, MenuFormatter, SelectionIndicator]
dependencies: [terminal-ui-components, menu-registry]
tags: [cli, navigation, selector-character, menu-formatting]
---
 * 
 * SelectorUpdater - Menu Selector Character Implementation
 * 
 * Provides systematic implementation of the › selector character across
 * all menu interfaces, replacing existing selection indicators with
 * the standardized design specification character.
 * 
 * Generated: 2025-09-12T174343Z
 * TASK-ID: TASK-MCP-006 Pattern: selector-updating | Complexity: 3 | Dependencies: terminal-ui,menu-registry
 * Context: Implements › selector character across all menus for visual consistency
 * Validation-Required: visual-consistency, accessibility-compliance, cross-platform-rendering
 * Pattern-Info: { approach: "systematic-replacement", alternatives: "manual-update", trade-offs: "automation-control" }
 */

import { TerminalColorTheme, DefaultColorThemes } from '../terminal-ui-components';
import { TypeGuards, TypeValidators } from '../../utils/type-guards';

// TODO: [TASK-ID-012] Pattern: selector-updating | Complexity: 3 | Dependencies: accessibility
// Context: Accessibility-compliant selector implementation with screen reader support
// Validation-Required: screen-reader-testing, keyboard-navigation, visual-indicators
// Pattern-Info: { approach: "accessible-selectors", alternatives: "visual-only", trade-offs: "complexity-accessibility" }

/**
 * Selector character configuration
 */
export interface SelectorConfig {
  character: string;
  selectedCharacter?: string; // Different character when item is selected
  spacing: number; // Spaces after selector
  alignment: 'left' | 'right' | 'center';
  theme: TerminalColorTheme;
  showForAll: boolean; // Show selector for all items or just interactive ones
  animationEnabled: boolean;
  accessibilityMode: boolean;
}

/**
 * Menu item selection state
 */
export interface SelectionState {
  isSelected: boolean;
  isHovered: boolean;
  isActive: boolean;
  isDisabled: boolean;
  index: number;
  totalItems: number;
}

/**
 * Selector formatting options
 */
export interface SelectorFormatOptions {
  showNumbers: boolean; // Show item numbers alongside selector
  numberFormat: 'plain' | 'bracketed' | 'parentheses';
  maxWidth?: number; // Maximum width for formatting
  compactMode: boolean;
  rightAlign: boolean;
}

/**
 * Menu formatting result
 */
export interface MenuFormatResult {
  formattedText: string;
  originalText: string;
  selectorCount: number;
  changes: Array<{
    position: number;
    before: string;
    after: string;
    type: 'selector-added' | 'selector-updated' | 'selector-removed';
  }>;
}

/**
 * Selection indicator types and their mappings
 */
export const SELECTOR_CHARACTERS = {
  standard: '›',
  selected: '▶',
  disabled: '·',
  hover: '➤',
  active: '➜',
  // Accessibility alternatives
  accessible: '>',
  accessibleSelected: '*',
  // Legacy characters to replace
  legacy: ['>', '→', '->', '=>', '*', '•', '▶', '▷', '►', '⟩', '❯']
} as const;

/**
 * Terminal capability-aware selector
 */
export class AdaptiveSelector {
  private config: SelectorConfig;
  private terminalSupportsUnicode: boolean;

  constructor(config: Partial<SelectorConfig> = {}) {
    this.config = {
      character: SELECTOR_CHARACTERS.standard,
      selectedCharacter: SELECTOR_CHARACTERS.standard,
      spacing: 1,
      alignment: 'left',
      theme: DefaultColorThemes.default,
      showForAll: true,
      animationEnabled: false,
      accessibilityMode: false,
      ...config
    };

    // Ensure selected character defaults to the active character when not provided
    if (!this.config.selectedCharacter) {
      this.config.selectedCharacter = this.config.character;
    }

    this.terminalSupportsUnicode = this.detectUnicodeSupport();
    
    // Use accessible characters if terminal doesn't support Unicode
    if (!this.terminalSupportsUnicode || this.config.accessibilityMode) {
      this.config.character = SELECTOR_CHARACTERS.accessible;
      this.config.selectedCharacter = SELECTOR_CHARACTERS.accessibleSelected;
    }
  }

  /**
   * Get appropriate selector character for given state
   */
  getSelectorCharacter(state: SelectionState): string {
    if (state.isDisabled) {
      return this.terminalSupportsUnicode && !this.config.accessibilityMode 
        ? SELECTOR_CHARACTERS.disabled 
        : ' ';
    }

    if (state.isSelected || state.isActive) {
      return this.config.selectedCharacter || this.config.character;
    }

    if (state.isHovered && this.terminalSupportsUnicode && !this.config.accessibilityMode) {
      return SELECTOR_CHARACTERS.hover;
    }

    return this.config.character;
  }

  /**
   * Format selector with proper styling
   */
  formatSelector(state: SelectionState, options?: SelectorFormatOptions): string {
    const selectorChar = this.getSelectorCharacter(state);
    const spacing = ' '.repeat(this.config.spacing);
    
    // Apply theme styling
    let styledSelector = selectorChar;
    
    if (state.isSelected || state.isActive) {
      styledSelector = this.config.theme.accent(selectorChar);
    } else if (state.isDisabled) {
      styledSelector = this.config.theme.muted(selectorChar);
    } else {
      styledSelector = this.config.theme.primary(selectorChar);
    }

    // Add number formatting if requested
    if (options?.showNumbers) {
      const number = (state.index + 1).toString();
      const formattedNumber = this.formatNumber(number, options.numberFormat || 'plain');
      const numberStyle = state.isSelected 
        ? this.config.theme.accent(formattedNumber)
        : this.config.theme.muted(formattedNumber);
      
      return `${numberStyle} ${styledSelector}${spacing}`;
    }

    return `${styledSelector}${spacing}`;
  }

  /**
   * Format item number based on specified format
   */
  private formatNumber(number: string, format: SelectorFormatOptions['numberFormat']): string {
    switch (format) {
      case 'bracketed':
        return `[${number}]`;
      case 'parentheses':
        return `(${number})`;
      case 'plain':
      default:
        return number;
    }
  }

  /**
   * Detect Unicode support in terminal
   */
  private detectUnicodeSupport(): boolean {
    // Check environment variables
    const term = process.env.TERM || '';
    const lang = process.env.LANG || '';
    
    // Known terminals with good Unicode support
    const unicodeTerminals = [
      'xterm-256color',
      'screen-256color',
      'tmux-256color'
    ];

    if (unicodeTerminals.includes(term)) {
      return true;
    }

    // Check for UTF-8 locale
    if (lang.includes('UTF-8') || lang.includes('utf8')) {
      return true;
    }

    // Windows-specific checks
    if (process.platform === 'win32') {
      return !!process.env.WT_SESSION; // Windows Terminal
    }

    return term.includes('xterm') || term.includes('color');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SelectorConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Re-evaluate Unicode support if accessibility mode changed
    if (newConfig.accessibilityMode !== undefined) {
      if (newConfig.accessibilityMode || !this.terminalSupportsUnicode) {
        this.config.character = SELECTOR_CHARACTERS.accessible;
        this.config.selectedCharacter = SELECTOR_CHARACTERS.accessibleSelected;
      } else {
        this.config.character = SELECTOR_CHARACTERS.standard;
        this.config.selectedCharacter = SELECTOR_CHARACTERS.standard;
      }
    }

    if (!this.config.selectedCharacter) {
      this.config.selectedCharacter = this.config.character;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): SelectorConfig {
    return { ...this.config };
  }
}

/**
 * Menu formatter for applying selector updates
 */
export class MenuFormatter {
  private selector: AdaptiveSelector;
  private legacySelectorPattern: RegExp;

  constructor(selector: AdaptiveSelector) {
    this.selector = selector;
    
    // Create pattern to match legacy selectors
    const legacyChars = SELECTOR_CHARACTERS.legacy.map(char => 
      char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
    ).join('|');
    
    this.legacySelectorPattern = new RegExp(`^(\\s*)(${legacyChars})(\\s+)`, 'gm');
  }

  /**
   * Format menu text with updated selectors
   */
  formatMenuText(
    text: string, 
    selectedIndex: number = -1, 
    options?: SelectorFormatOptions
  ): MenuFormatResult {
    const lines = text.split('\n');
    const changes: MenuFormatResult['changes'] = [];
    let formattedLines: string[] = [];
    let selectorCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const result = this.formatMenuLine(
        line, 
        i, 
        selectedIndex, 
        lines.length, 
        options
      );
      
      if (result.changed) {
        changes.push(...result.changes);
        selectorCount++;
      }
      
      formattedLines.push(result.formatted);
    }

    return {
      formattedText: formattedLines.join('\n'),
      originalText: text,
      selectorCount,
      changes
    };
  }

  /**
   * Format individual menu line
   */
  formatMenuLine(
    line: string, 
    lineIndex: number, 
    selectedIndex: number, 
    totalLines: number,
    options?: SelectorFormatOptions
  ): { formatted: string; changed: boolean; changes: MenuFormatResult['changes'] } {
    
    const changes: MenuFormatResult['changes'] = [];
    let formatted = line;
    let changed = false;

    // Skip empty lines or lines that don't look like menu items
    if (!line.trim() || !this.isMenuItemLine(line)) {
      return { formatted, changed, changes };
    }

    const state: SelectionState = {
      isSelected: lineIndex === selectedIndex,
      isHovered: false,
      isActive: lineIndex === selectedIndex,
      isDisabled: this.isDisabledLine(line),
      index: lineIndex,
      totalItems: totalLines
    };

    // Check for existing legacy selectors
    const legacyMatch = line.match(this.legacySelectorPattern);
    
    if (legacyMatch) {
      // Replace existing selector
      const [fullMatch, leadingSpace, oldSelector, trailingSpace] = legacyMatch;
      const newSelector = this.selector.formatSelector(state, options);
      
      formatted = line.replace(this.legacySelectorPattern, leadingSpace + newSelector);
      changed = true;
      
      changes.push({
        position: leadingSpace.length,
        before: oldSelector + trailingSpace,
        after: newSelector,
        type: 'selector-updated'
      });
    } else if (this.shouldAddSelector(line, state)) {
      // Add new selector
      const newSelector = this.selector.formatSelector(state, options);
      const leadingSpaceMatch = line.match(/^(\s*)/);
      const leadingSpace = leadingSpaceMatch ? leadingSpaceMatch[1] : '';
      const content = line.substring(leadingSpace.length);
      
      formatted = leadingSpace + newSelector + content;
      changed = true;
      
      changes.push({
        position: leadingSpace.length,
        before: '',
        after: newSelector,
        type: 'selector-added'
      });
    }

    return { formatted, changed, changes };
  }

  /**
   * Determine if line looks like a menu item
   */
  private isMenuItemLine(line: string): boolean {
    const trimmed = line.trim();
    
    // Skip obvious non-menu lines
    if (trimmed.length === 0 || 
        trimmed.startsWith('=') || 
        trimmed.startsWith('-') || 
        trimmed.startsWith('_') ||
        trimmed.match(/^[─━═]+$/)) {
      return false;
    }

    // Look for patterns that suggest menu items
    return true; // For now, assume most non-empty lines are menu items
  }

  /**
   * Determine if line represents a disabled menu item
   */
  private isDisabledLine(line: string): boolean {
    const lowerLine = line.toLowerCase();
    return lowerLine.includes('disabled') || 
           lowerLine.includes('unavailable') || 
           lowerLine.includes('(coming soon)') ||
           line.includes('...') ||
           line.match(/\[.*disabled.*\]/i) !== null;
  }

  /**
   * Determine if selector should be added to line
   */
  private shouldAddSelector(line: string, state: SelectionState): boolean {
    const config = this.selector.getConfig();
    
    // Always add if configured to show for all
    if (config.showForAll) {
      return true;
    }

    // Only add for interactive items if configured selectively
    return !state.isDisabled;
  }

  /**
   * Process menu object structure
   */
  processMenuObject(
    menuData: any, 
    options?: SelectorFormatOptions
  ): { processed: any; changes: MenuFormatResult['changes'] } {
    if (!TypeGuards.isPlainObject(menuData)) {
      return { processed: menuData, changes: [] };
    }

    const processed = JSON.parse(JSON.stringify(menuData)); // Deep copy
    const allChanges: MenuFormatResult['changes'] = [];

    // Process menu sections
    if (
      processed.sections &&
      TypeValidators.isArrayOf(processed.sections, (section): section is Record<string, unknown> => TypeGuards.isPlainObject(section))
    ) {
      for (const section of processed.sections as Array<Record<string, unknown>>) {
        if (
          section.items &&
          TypeValidators.isArrayOf(
            section.items,
            (item): item is Record<string, unknown> => TypeGuards.isPlainObject(item),
          )
        ) {
          const items = section.items as Array<Record<string, any>>;
          for (let i = 0; i < items.length; i++) {
            const item = items[i];

            if (TypeGuards.isNonEmptyString(item.label)) {
              const state: SelectionState = {
                isSelected: false,
                isHovered: false,
                isActive: false,
                isDisabled: item.enabled === false,
                index: i,
                totalItems: items.length,
              };

              const selector = this.selector.formatSelector(state, options);
              const originalLabel = item.label as string;

              // Add selector if not already present
              if (!this.hasSelector(originalLabel)) {
                item.label = `${selector}${originalLabel}`;

                allChanges.push({
                  position: 0,
                  before: originalLabel,
                  after: item.label,
                  type: 'selector-added'
                });
              }
            }
          }
        }
      }
    }

    return { processed, changes: allChanges };
  }

  /**
   * Check if text already has a selector
   */
  private hasSelector(text: string): boolean {
    const allSelectors = [
      SELECTOR_CHARACTERS.standard,
      SELECTOR_CHARACTERS.selected,
      SELECTOR_CHARACTERS.accessible,
      ...SELECTOR_CHARACTERS.legacy
    ];

    return allSelectors.some(selector => 
      text.trim().startsWith(selector) ||
      text.match(new RegExp(`^\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+`))
    );
  }
}

/**
 * Main selector updater implementation
 */
export class SelectorUpdater {
  private selector: AdaptiveSelector;
  private formatter: MenuFormatter;
  private statistics = {
    totalMenusProcessed: 0,
    totalSelectorsAdded: 0,
    totalSelectorsUpdated: 0,
    totalLinesProcessed: 0
  };

  constructor(config?: Partial<SelectorConfig>) {
    this.selector = new AdaptiveSelector(config);
    this.formatter = new MenuFormatter(this.selector);
  }

  /**
   * Update selectors in text content
   */
  updateSelectors(
    text: string, 
    selectedIndex?: number,
    options?: SelectorFormatOptions
  ): MenuFormatResult {
    const result = this.formatter.formatMenuText(text, selectedIndex, options);
    
    // Update statistics
    this.statistics.totalMenusProcessed++;
    this.statistics.totalLinesProcessed += text.split('\n').length;
    
    result.changes.forEach(change => {
      if (change.type === 'selector-added') {
        this.statistics.totalSelectorsAdded++;
      } else if (change.type === 'selector-updated') {
        this.statistics.totalSelectorsUpdated++;
      }
    });

    return result;
  }

  /**
   * Update selectors in menu object
   */
  updateMenuObject(
    menuData: any,
    options?: SelectorFormatOptions
  ): { processed: any; changes: MenuFormatResult['changes'] } {
    const result = this.formatter.processMenuObject(menuData, options);
    
    // Update statistics
    this.statistics.totalMenusProcessed++;
    result.changes.forEach(change => {
      if (change.type === 'selector-added') {
        this.statistics.totalSelectorsAdded++;
      } else if (change.type === 'selector-updated') {
        this.statistics.totalSelectorsUpdated++;
      }
    });

    return result;
  }

  /**
   * Batch update multiple texts
   */
  batchUpdate(
    texts: string[],
    options?: SelectorFormatOptions
  ): Array<{ original: string; result: MenuFormatResult }> {
    return texts.map(text => ({
      original: text,
      result: this.updateSelectors(text, undefined, options)
    }));
  }

  /**
   * Apply selector to single menu item
   */
  applySelector(
    itemText: string,
    state: SelectionState,
    options?: SelectorFormatOptions
  ): string {
    const selector = this.selector.formatSelector(state, options);
    
    // Remove existing selector if present
    const cleanText = this.removeExistingSelector(itemText);
    
    return selector + cleanText;
  }

  /**
   * Remove existing selector from text
   */
  private removeExistingSelector(text: string): string {
    // Remove any existing selectors
    const allSelectors = [
      SELECTOR_CHARACTERS.standard,
      SELECTOR_CHARACTERS.selected,
      SELECTOR_CHARACTERS.accessible,
      SELECTOR_CHARACTERS.accessibleSelected,
      ...SELECTOR_CHARACTERS.legacy
    ];

    let cleanText = text;
    
    for (const selector of allSelectors) {
      const pattern = new RegExp(`^(\\s*)(${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(\\s*)`);
      cleanText = cleanText.replace(pattern, '$1');
    }
    
    return cleanText;
  }

  /**
   * Validate selector implementation
   */
  validateImplementation(text: string): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    const lines = text.split('\n');

    let hasSelectors = false;
    let inconsistentSelectors = false;
    let accessibilityIssues = false;

    for (const line of lines) {
      if (this.formatter['isMenuItemLine'](line)) {
        const hasSelector = this.formatter['hasSelector'](line);
        
        if (hasSelector) {
          hasSelectors = true;
          
          // Check for consistent selector usage
          const config = this.selector.getConfig();
          if (!line.includes(config.character)) {
            inconsistentSelectors = true;
          }
        }
      }
    }

    if (!hasSelectors) {
      issues.push('No selectors found in menu items');
      recommendations.push('Add selectors to improve navigation clarity');
    }

    if (inconsistentSelectors) {
      issues.push('Inconsistent selector characters used');
      recommendations.push('Use consistent selector character throughout');
    }

    if (this.selector.getConfig().accessibilityMode && accessibilityIssues) {
      issues.push('Accessibility mode enabled but Unicode characters detected');
      recommendations.push('Ensure all selectors use ASCII characters for accessibility');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  /**
   * Get processing statistics
   */
  getStatistics(): typeof this.statistics {
    return { ...this.statistics };
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.statistics = {
      totalMenusProcessed: 0,
      totalSelectorsAdded: 0,
      totalSelectorsUpdated: 0,
      totalLinesProcessed: 0
    };
  }

  /**
   * Update selector configuration
   */
  updateConfig(newConfig: Partial<SelectorConfig>): void {
    this.selector.updateConfig(newConfig);
  }

  /**
   * Get current selector character
   */
  getCurrentSelector(): string {
    return this.selector.getConfig().character;
  }

  /**
   * Test selector rendering in current terminal
   */
  testSelectorRendering(): {
    unicodeSupported: boolean;
    recommendedCharacter: string;
    testResults: Array<{ character: string; renders: boolean; description: string }>;
  } {
    const testChars = [
      { char: SELECTOR_CHARACTERS.standard, desc: 'Standard Unicode selector' },
      { char: SELECTOR_CHARACTERS.selected, desc: 'Selected item indicator' },
      { char: SELECTOR_CHARACTERS.accessible, desc: 'ASCII fallback selector' },
      { char: '→', desc: 'Arrow alternative' },
      { char: '*', desc: 'Asterisk fallback' }
    ];

    const results = testChars.map(({ char, desc }) => ({
      character: char,
      renders: true, // In a real implementation, we'd test actual rendering
      description: desc
    }));

    const unicodeSupported = this.selector['terminalSupportsUnicode'];
    const recommendedCharacter = unicodeSupported 
      ? SELECTOR_CHARACTERS.standard 
      : SELECTOR_CHARACTERS.accessible;

    return {
      unicodeSupported,
      recommendedCharacter,
      testResults: results
    };
  }
}

/**
 * Factory function for creating selector updater
 */
export function createSelectorUpdater(config?: Partial<SelectorConfig>): SelectorUpdater {
  return new SelectorUpdater(config);
}

/**
 * Utility function for quick selector application
 */
export function applySelector(
  text: string, 
  isSelected = false, 
  options?: Partial<SelectorConfig>
): string {
  const updater = new SelectorUpdater(options);
  const state: SelectionState = {
    isSelected,
    isHovered: false,
    isActive: isSelected,
    isDisabled: false,
    index: 0,
    totalItems: 1
  };
  
  return updater.applySelector(text, state);
}

/**
 * Utility function for batch selector updates
 */
export function batchApplySelectors(
  texts: string[], 
  selectedIndex = -1,
  options?: Partial<SelectorConfig>
): string[] {
  const updater = new SelectorUpdater(options);
  
  return texts.map((text, index) => {
    const state: SelectionState = {
      isSelected: index === selectedIndex,
      isHovered: false,
      isActive: index === selectedIndex,
      isDisabled: false,
      index,
      totalItems: texts.length
    };
    
    return updater.applySelector(text, state);
  });
}
