/**
---
title: [Terminal UI Components - Interactive CLI Elements]
tags: [Terminal, UI, Progress, Spinner, Interactive, CLI]
provides: [ProgressBar, Spinner, InteractivePrompt, ColorTheme, ResponsiveLayout]
requires: [chalk, readline, process]
description: [Terminal UI components for progress indication, user interaction, and responsive layouts]
---
**/

import * as chalk from 'chalk';
import * as readline from 'readline';
import { EventEmitter } from 'events';
import { StringUtils, StringWidthUtils } from '../utils/chainable-string-utils';

// Import consistency framework for table formatting integration
// TODO: [TASK-ID-006] Pattern: consistency-framework-integration | Complexity: 4 | Dependencies: cli-display-consistency-engine
// Context: Integrate terminal UI components with display consistency framework for standardized table formatting
// Validation-Required: table-format-consistency, responsive-layout-preservation, theme-compatibility
// Pattern-Info: { approach: "optional-integration", alternatives: "full-replacement", trade-offs: "backward-compatibility-vs-consistency" }

// Interactive Search and Filtering components - TASK-CLI-002 implementation
// Advanced Menu Navigation integration - TASK-CLI-003 compatibility maintained

/**
 * Color Theme System for Terminal UI
 */
export interface TerminalColorTheme {
  name: string;
  primary: chalk.Chalk;
  secondary: chalk.Chalk;
  success: chalk.Chalk;
  warning: chalk.Chalk;
  error: chalk.Chalk;
  info: chalk.Chalk;
  accent: chalk.Chalk;
  muted: chalk.Chalk;
}

export const DefaultColorThemes: Record<string, TerminalColorTheme> = {
  default: {
    name: 'Default',
    primary: chalk.blue,
    secondary: chalk.cyan,
    success: chalk.green,
    warning: chalk.yellow,
    error: chalk.red,
    info: chalk.blue,
    accent: chalk.magenta,
    muted: chalk.gray
  },
  dark: {
    name: 'Dark',
    primary: chalk.white,
    secondary: chalk.gray,
    success: chalk.greenBright,
    warning: chalk.yellowBright,
    error: chalk.redBright,
    info: chalk.cyanBright,
    accent: chalk.magentaBright,
    muted: chalk.dim
  },
  light: {
    name: 'Light',
    primary: chalk.black,
    secondary: chalk.blue,
    success: chalk.green,
    warning: chalk.yellow, // Custom yellow for light theme
    error: chalk.red,
    info: chalk.blue,
    accent: chalk.magenta,
    muted: chalk.gray
  },
  monochrome: {
    name: 'Monochrome',
    primary: chalk.white,
    secondary: chalk.gray,
    success: chalk.white,
    warning: chalk.white,
    error: chalk.white,
    info: chalk.white,
    accent: chalk.white,
    muted: chalk.gray
  }
};

/**
 * Progress Bar Component
 */
export interface ProgressBarConfig {
  width: number;
  character: string;
  incomplete: string;
  theme: TerminalColorTheme;
  showPercentage: boolean;
  showEta: boolean;
  format?: string; // Custom format string
}

export class ProgressBar extends EventEmitter {
  private config: ProgressBarConfig;
  private current: number = 0;
  private total: number = 100;
  private startTime: number;
  private isActive: boolean = false;

  constructor(config: Partial<ProgressBarConfig> = {}) {
    super();
    
    this.config = {
      width: 40,
      character: '█',
      incomplete: '░',
      theme: DefaultColorThemes.default,
      showPercentage: true,
      showEta: true,
      format: ':bar :percent :eta',
      ...config
    };
    
    this.startTime = Date.now();
  }

  start(total: number = 100): void {
    this.total = total;
    this.current = 0;
    this.startTime = Date.now();
    this.isActive = true;
    this.render();
  }

  update(current: number, message?: string): void {
    if (!this.isActive) return;
    
    this.current = Math.min(current, this.total);
    this.render(message);
    
    if (this.current >= this.total) {
      this.complete();
    }
  }

  increment(step: number = 1, message?: string): void {
    this.update(this.current + step, message);
  }

  complete(message?: string): void {
    this.current = this.total;
    this.isActive = false;
    this.render(message || 'Complete!');
    process.stdout.write('\n');
    this.emit('complete');
  }

  private render(message?: string): void {
    const percentage = (this.current / this.total) * 100;
    const completed = Math.round((percentage / 100) * this.config.width);
    const remaining = this.config.width - completed;

    // Create progress bar visual
    const bar = this.config.theme.success(this.config.character.repeat(completed)) +
                this.config.incomplete.repeat(remaining);

    // Calculate ETA
    let eta = '';
    if (this.config.showEta && this.current > 0) {
      const elapsed = Date.now() - this.startTime;
      const rate = this.current / elapsed;
      const remaining = this.total - this.current;
      const etaMs = remaining / rate;
      eta = `ETA: ${this.formatTime(etaMs)}`;
    }

    // Format output
    let output = this.config.format || ':bar :percent :eta';
    output = output.replace(':bar', `[${bar}]`);
    output = output.replace(':percent', this.config.showPercentage ? 
      this.config.theme.info(`${percentage.toFixed(1)}%`) : '');
    output = output.replace(':eta', this.config.showEta ? eta : '');
    output = output.replace(':current', this.current.toString());
    output = output.replace(':total', this.total.toString());

    if (message) {
      output += ` ${this.config.theme.muted(message)}`;
    }

    // Clear line and render
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(output);
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  }
}

/**
 * Spinner Component
 */
export interface SpinnerConfig {
  frames: string[];
  interval: number;
  theme: TerminalColorTheme;
  text?: string;
}

export const SpinnerFrames = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line: ['|', '/', '─', '\\'],
  arrow: ['←', '↖', '↑', '↗', '→', '↘', '↓', '↙'],
  bounce: ['⠁', '⠂', '⠄', '⠂'],
  pulse: ['●', '○', '●', '○'],
  clock: ['[CLOCK]', '[CLOCK]', '[CLOCK]', '[CLOCK]', '[CLOCK]', '[CLOCK]', '[CLOCK]', '[CLOCK]', '[CLOCK]', '[CLOCK]', '[CLOCK]', '[CLOCK]']
};

export class Spinner extends EventEmitter {
  private config: SpinnerConfig;
  private currentFrame: number = 0;
  private timer: NodeJS.Timeout | null = null;
  private isActive: boolean = false;

  constructor(config: Partial<SpinnerConfig> = {}) {
    super();
    
    this.config = {
      frames: SpinnerFrames.dots,
      interval: 100,
      theme: DefaultColorThemes.default,
      ...config
    };
  }

  start(text?: string): void {
    if (this.isActive) return;
    
    this.isActive = true;
    if (text) this.config.text = text;
    
    this.timer = setInterval(() => {
      this.render();
      this.currentFrame = (this.currentFrame + 1) % this.config.frames.length;
    }, this.config.interval);
    
    this.emit('start');
  }

  updateText(text: string): void {
    this.config.text = text;
  }

  stop(finalMessage?: string): void {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    // Clear the spinner line
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    
    if (finalMessage) {
      process.stdout.write(finalMessage + '\n');
    }
    
    this.emit('stop');
  }

  succeed(message: string): void {
    this.stop(this.config.theme.success('[OK] ' + message));
  }

  fail(message: string): void {
    this.stop(this.config.theme.error('[FAIL] ' + message));
  }

  warn(message: string): void {
    this.stop(this.config.theme.warning('[WARN] ' + message));
  }

  info(message: string): void {
    this.stop(this.config.theme.info('[INFO] ' + message));
  }

  private render(): void {
    if (!this.isActive) return;
    
    const frame = this.config.theme.primary(this.config.frames[this.currentFrame]);
    const text = this.config.text ? ` ${this.config.text}` : '';
    
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(frame + text);
  }
}

/**
 * Interactive Prompt Component
 */
export interface PromptConfig {
  theme: TerminalColorTheme;
  prefix?: string;
  suffix?: string;
  validate?: (input: string) => boolean | string;
  transform?: (input: string) => string;
  mask?: boolean; // For password inputs
}

export class InteractivePrompt extends EventEmitter {
  private rl: readline.Interface | null = null;
  private config: PromptConfig;

  constructor(config: Partial<PromptConfig> = {}) {
    super();
    
    this.config = {
      theme: DefaultColorThemes.default,
      prefix: '?',
      suffix: ':',
      ...config
    };
  }

  async text(question: string, defaultValue?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.setupReadline();
      
      const prompt = this.formatPrompt(question, defaultValue);
      
      this.rl!.question(prompt, (answer) => {
        this.cleanup();
        
        const value = answer.trim() || defaultValue || '';
        
        if (this.config.validate) {
          const validation = this.config.validate(value);
          if (validation !== true) {
            const errorMessage = typeof validation === 'string' ? validation : 'Invalid input';
            console.log(this.config.theme.error(errorMessage));
            reject(new Error(errorMessage));
            return;
          }
        }
        
        const result = this.config.transform ? this.config.transform(value) : value;
        resolve(result);
      });
    });
  }

  async confirm(question: string, defaultValue: boolean = false): Promise<boolean> {
    const defaultText = defaultValue ? 'Y/n' : 'y/N';
    const answer = await this.text(`${question} (${defaultText})`);
    
    if (!answer) return defaultValue;
    
    const normalized = answer.toLowerCase().trim();
    return normalized === 'y' || normalized === 'yes' || normalized === 'true';
  }

  async select(question: string, choices: string[], defaultIndex: number = 0): Promise<string> {
    return new Promise((resolve, reject) => {
      console.log(this.config.theme.primary(`${this.config.prefix} ${question}`));
      
      // Display choices
      choices.forEach((choice, index) => {
        const indicator = index === defaultIndex ? '>' : ' ';
        const style = index === defaultIndex ? this.config.theme.accent : this.config.theme.muted;
        console.log(`  ${this.config.theme.primary(indicator)} ${style(choice)}`);
      });

      this.setupReadline();
      
      let currentIndex = defaultIndex;
      
      const updateDisplay = () => {
        // Move cursor up to redraw choices
        process.stdout.moveCursor(0, -choices.length);
        
        choices.forEach((choice, index) => {
          const indicator = index === currentIndex ? '>' : ' ';
          const style = index === currentIndex ? this.config.theme.accent : this.config.theme.muted;
          
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          console.log(`  ${this.config.theme.primary(indicator)} ${style(choice)}`);
        });
      };

      // Handle keyboard input
      process.stdin.setRawMode(true);
      process.stdin.on('keypress', (chunk, key) => {
        if (!key) return;

        if (key.name === 'up') {
          currentIndex = Math.max(0, currentIndex - 1);
          updateDisplay();
        } else if (key.name === 'down') {
          currentIndex = Math.min(choices.length - 1, currentIndex + 1);
          updateDisplay();
        } else if (key.name === 'return') {
          process.stdin.setRawMode(false);
          this.cleanup();
          resolve(choices[currentIndex]);
        } else if (key.ctrl && key.name === 'c') {
          process.stdin.setRawMode(false);
          this.cleanup();
          reject(new Error('User cancelled'));
        }
      });
    });
  }

  async multiSelect(question: string, choices: string[]): Promise<string[]> {
    return new Promise((resolve, reject) => {
      console.log(this.config.theme.primary(`${this.config.prefix} ${question} (use space to select, enter to confirm)`));
      
      const selected = new Array(choices.length).fill(false);
      let currentIndex = 0;
      
      const updateDisplay = () => {
        // Move cursor up to redraw choices
        process.stdout.moveCursor(0, -choices.length - 1);
        
        choices.forEach((choice, index) => {
          const indicator = index === currentIndex ? '>' : ' ';
          const checkbox = selected[index] ? '[SELECTED]' : '[ ]';
          const style = index === currentIndex ? this.config.theme.accent : this.config.theme.muted;
          
          process.stdout.clearLine(0);
          process.stdout.cursorTo(0);
          console.log(`  ${this.config.theme.primary(indicator)} ${this.config.theme.primary(checkbox)} ${style(choice)}`);
        });
        
        // Show instruction
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        console.log(this.config.theme.muted('  (Use arrow keys, space to select, enter to confirm)'));
      };

      updateDisplay();

      this.setupReadline();
      process.stdin.setRawMode(true);
      
      process.stdin.on('keypress', (chunk, key) => {
        if (!key) return;

        if (key.name === 'up') {
          currentIndex = Math.max(0, currentIndex - 1);
          updateDisplay();
        } else if (key.name === 'down') {
          currentIndex = Math.min(choices.length - 1, currentIndex + 1);
          updateDisplay();
        } else if (key.name === 'space') {
          selected[currentIndex] = !selected[currentIndex];
          updateDisplay();
        } else if (key.name === 'return') {
          process.stdin.setRawMode(false);
          this.cleanup();
          const result = choices.filter((_, index) => selected[index]);
          resolve(result);
        } else if (key.ctrl && key.name === 'c') {
          process.stdin.setRawMode(false);
          this.cleanup();
          reject(new Error('User cancelled'));
        }
      });
    });
  }

  private formatPrompt(question: string, defaultValue?: string): string {
    const prefix = this.config.theme.primary(this.config.prefix!);
    const questionText = this.config.theme.primary(question);
    const defaultText = defaultValue ? this.config.theme.muted(` (${defaultValue})`) : '';
    const suffix = this.config.theme.primary(this.config.suffix!);
    
    return `${prefix} ${questionText}${defaultText}${suffix} `;
  }

  private setupReadline(): void {
    if (this.rl) return;
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  private cleanup(): void {
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }
}

/**
 * Enhanced Window Layout Renderer for CLI Design Specification
 * Implements the exact CLI design specification with bordered windows, centered titles, and proper padding
 * Pattern: bordered-window-layout - See /dev/patterns/bordered-window-layout.md for reusable implementation guide
 * Validation-Required: window-border-rendering, title-centering, padding-consistency, selector-positioning
 */
export interface WindowLayoutConfig {
  title: string;
  subtitle?: string;
  content: WindowContentSection[];
  width?: number; // Auto-calculated if not provided
  theme: TerminalColorTheme;
}

export interface WindowContentSection {
  id: string;
  heading?: string;
  items: WindowContentItem[];
  type: 'menu' | 'info' | 'separator';
}

export interface WindowContentItem {
  id: string;
  label: string;
  description?: string;
  enabled: boolean;
  selected?: boolean;
  icon?: string;
  data?: any;
}

export class EnhancedWindowLayoutRenderer {
  private theme: TerminalColorTheme;
  private currentSelection: number = 0;
  private items: WindowContentItem[] = [];
  private separatorIndices: number[] = [];

  constructor(theme: TerminalColorTheme = DefaultColorThemes.default) {
    this.theme = theme;
  }

  private normalizeWidth(width: number): number {
    return Math.max(1, Math.floor(width));
  }

  private measure(value: string): number {
    return StringWidthUtils.getDisplayWidth(value);
  }

  private truncateToWidth(value: string, width: number, ellipsis = '...'): string {
    const targetWidth = this.normalizeWidth(width);
    return StringUtils.chain(value, { mode: 'terminal' })
      .truncate(targetWidth, ellipsis)
      .value();
  }

  private formatWithinWidth(
    value: string,
    width: number,
    alignment: 'left' | 'right' | 'center' = 'right',
    ellipsis = '...'
  ): string {
    const targetWidth = this.normalizeWidth(width);
    return StringUtils.chain(value, { mode: 'terminal' })
      .truncate(targetWidth, ellipsis)
      .pad(targetWidth, alignment)
      .value();
  }

  /**
   * Render bordered window with CLI design specification compliance
   */
  renderWindow(config: WindowLayoutConfig): string {
    const { title, subtitle, content } = config;
    
    // Build flattened item list for navigation
    this.buildNavigationList(content);
    
    // Calculate window width based on content
    const windowWidth = config.width || this.calculateWindowWidth(config);
    
    const lines: string[] = [];
    
    // Top border with title
    lines.push(this.renderTopBorder(title, windowWidth));
    
    // Subtitle section if present
    if (subtitle) {
      lines.push(this.renderContentLine(subtitle, windowWidth));
      lines.push(this.renderEmptyLine(windowWidth));
    }
    
    // Content sections
    let itemIndex = 0;
    for (const section of content) {
      if (section.type === 'separator') {
        lines.push(this.renderSeparatorLine(windowWidth));
        this.separatorIndices.push(itemIndex);
      } else {
        // Section heading if present
        if (section.heading) {
          lines.push(this.renderContentLine(section.heading, windowWidth));
          lines.push(this.renderEmptyLine(windowWidth));
        }
        
        // Section items
        for (const item of section.items) {
          const isSelected = itemIndex === this.currentSelection;
          lines.push(this.renderMenuItem(item, isSelected, windowWidth));
          itemIndex++;
        }
        
        // Add spacing after section
        if (section !== content[content.length - 1]) {
          lines.push(this.renderEmptyLine(windowWidth));
        }
      }
    }
    
    // Bottom border
    lines.push(this.renderBottomBorder(windowWidth));
    
    // Text box (selector prompt)
    lines.push('');
    lines.push(this.renderTextBox(windowWidth));
    
    return lines.join('\n');
  }

  /**
   * Handle navigation input across separator boundaries
   */
  navigate(direction: 'up' | 'down'): boolean {
    const totalItems = this.items.length;
    if (totalItems === 0) return false;

    let newSelection = this.currentSelection;
    
    if (direction === 'up') {
      newSelection = this.currentSelection > 0 ? this.currentSelection - 1 : totalItems - 1;
    } else {
      newSelection = this.currentSelection < totalItems - 1 ? this.currentSelection + 1 : 0;
    }
    
    // Skip disabled items
    while (!this.items[newSelection].enabled && newSelection !== this.currentSelection) {
      if (direction === 'up') {
        newSelection = newSelection > 0 ? newSelection - 1 : totalItems - 1;
      } else {
        newSelection = newSelection < totalItems - 1 ? newSelection + 1 : 0;
      }
    }
    
    if (newSelection !== this.currentSelection) {
      this.currentSelection = newSelection;
      return true;
    }
    
    return false;
  }

  /**
   * Get currently selected item
   */
  getSelectedItem(): WindowContentItem | null {
    return this.items[this.currentSelection] || null;
  }

  /**
   * Set selection by item ID
   */
  setSelection(itemId: string): boolean {
    const index = this.items.findIndex(item => item.id === itemId);
    if (index >= 0) {
      this.currentSelection = index;
      return true;
    }
    return false;
  }

  private buildNavigationList(content: WindowContentSection[]): void {
    this.items = [];
    this.separatorIndices = [];
    
    for (const section of content) {
      if (section.type !== 'separator') {
        this.items.push(...section.items);
      }
    }
  }

  private calculateWindowWidth(config: WindowLayoutConfig): number {
    const { title, subtitle, content } = config;
    let maxWidth = this.measure(title);

    if (subtitle) {
      maxWidth = Math.max(maxWidth, this.measure(subtitle));
    }

    for (const section of content) {
      if (section.heading) {
        maxWidth = Math.max(maxWidth, this.measure(section.heading));
      }

      for (const item of section.items) {
        const itemText = `${item.icon || ''} ${item.label}${item.description ? ` - ${item.description}` : ''}`.trim();
        maxWidth = Math.max(maxWidth, this.measure(itemText));
      }
    }

    // Add padding (3 characters on each side) and borders (1 character each side)
    return Math.max(maxWidth + 8, 80); // Minimum 80 characters
  }

  private renderTopBorder(title: string, width: number): string {
    const borderWidth = width - 2;
    const centeredTitle = this.formatWithinWidth(title, borderWidth, 'center', '…');

    return this.theme.primary(`┌${'─'.repeat(borderWidth)}┐`) + '\n' +
           this.theme.primary(`│${centeredTitle}│`);
  }

  private renderBottomBorder(width: number): string {
    return this.theme.primary(`└${'─'.repeat(width - 2)}┘`);
  }

  private renderContentLine(content: string, width: number): string {
    const availableWidth = width - 8; // Account for borders and padding
    const formattedContent = this.formatWithinWidth(content, availableWidth, 'left', '...');

    return this.theme.primary('│') +
           '   ' +
           this.theme.secondary(formattedContent) +
           '   ' +
           this.theme.primary('│');
  }

  private renderEmptyLine(width: number): string {
    return this.theme.primary('│') + ' '.repeat(width - 2) + this.theme.primary('│');
  }

  private renderMenuItem(item: WindowContentItem, isSelected: boolean, width: number): string {
    const availableWidth = width - 8; // Account for borders and padding
    const selector = isSelected ? '›' : ' ';
    const icon = item.icon || '';
    const iconText = icon ? `${icon} ` : '';
    const itemText = `${iconText}${item.label}`;
    const description = item.description ? ` - ${item.description}` : '';
    const fullText = itemText + description;
    
    const formattedText = this.formatWithinWidth(fullText, availableWidth - 1, 'left', '...');
    
    const textStyle = item.enabled ? 
      (isSelected ? this.theme.accent : this.theme.primary) : 
      this.theme.muted;
    
    return this.theme.primary('│') + 
           '  ' + 
           (isSelected ? this.theme.accent(selector) : ' ') + 
           ' ' + 
           textStyle(formattedText) + 
           '   ' + 
           this.theme.primary('│');
  }

  private renderSeparatorLine(width: number): string {
    const separatorLength = width - 8;
    const separator = '─'.repeat(separatorLength);
    
    return this.theme.primary('│') + 
           '   ' + 
           this.theme.muted(separator) + 
           '   ' + 
           this.theme.primary('│');
  }

  private renderTextBox(width: number): string {
    const borderWidth = width - 2;
    const prompt = 'Select an option: (Use arrow keys)';
    const centeredPrompt = this.formatWithinWidth(prompt, borderWidth, 'center', '...');

    return this.theme.info(`┌${'─'.repeat(borderWidth)}┐`) + '\n' +
           this.theme.info(`│${centeredPrompt}│`) + '\n' +
           this.theme.info(`└${'─'.repeat(borderWidth)}┘`);
  }
}

/**
 * Enhanced Interactive Menu System for CLI Design Specification
 * Implements proper menu navigation across separators and exit behavior patterns  
 * Pattern: cross-separator-navigation - See /dev/patterns/cross-separator-navigation.md for reusable implementation guide
 * Validation-Required: separator-navigation, exit-confirmation, keyboard-responsiveness
 */
export interface EnhancedMenuConfig {
  title: string;
  subtitle?: string;
  sections: MenuSection[];
  theme?: TerminalColorTheme;
  onSelection?: (item: WindowContentItem) => Promise<void>;
  onExit?: () => Promise<void>;
}

export interface MenuSection {
  id: string;
  heading?: string;
  items: MenuItemConfig[];
  type?: 'menu' | 'separator';
}

export interface MenuItemConfig {
  id: string;
  label: string;
  description?: string;
  action: string;
  enabled?: boolean;
  icon?: string;
  data?: any;
}

export class EnhancedInteractiveMenu extends EventEmitter {
  private renderer: EnhancedWindowLayoutRenderer;
  private config: EnhancedMenuConfig;
  private isActive: boolean = false;
  private exitConfirmationPending: boolean = false;
  private ctrlCPressed: boolean = false;

  constructor(config: EnhancedMenuConfig) {
    super();
    this.config = config;
    this.renderer = new EnhancedWindowLayoutRenderer(config.theme || DefaultColorThemes.default);
  }

  /**
   * Start the interactive menu session
   */
  async start(): Promise<WindowContentItem | null> {
    return new Promise((resolve, reject) => {
      this.isActive = true;
      this.setupKeyHandling(resolve, reject);
      this.render();
    });
  }

  /**
   * Stop the interactive menu session
   */
  stop(): void {
    this.isActive = false;
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(false);
    }
    process.stdin.removeAllListeners('keypress');
  }

  /**
   * Update menu content and re-render
   */
  updateContent(sections: MenuSection[]): void {
    this.config.sections = sections;
    if (this.isActive) {
      this.render();
    }
  }

  private setupKeyHandling(resolve: (value: WindowContentItem | null) => void, reject: (error: Error) => void): void {
    if (!process.stdin.isTTY) {
      reject(new Error('Not running in a TTY environment'));
      return;
    }

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    const keyPressListener = (chunk: any, key: any) => {
      if (!this.isActive || !key) return;

      try {
        this.handleKeyPress(key, resolve, reject);
      } catch (error) {
        this.stop();
        reject(error instanceof Error ? error : new Error('Key handling error'));
      }
    };

    process.stdin.on('keypress', keyPressListener);
    
    // Setup keypress detection
    if (typeof process.stdin.setRawMode === 'function') {
      const keypress = require('keypress');
      keypress(process.stdin);
    }
  }

  private handleKeyPress(
    key: any, 
    resolve: (value: WindowContentItem | null) => void, 
    reject: (error: Error) => void
  ): void {
    // Handle Ctrl+C exit pattern
    if (key.ctrl && key.name === 'c') {
      if (!this.ctrlCPressed) {
        this.ctrlCPressed = true;
        this.showCtrlCConfirmation();
        return;
      } else {
        // Second Ctrl+C - force exit
        this.stop();
        if (this.config.onExit) {
          this.config.onExit().finally(() => resolve(null));
        } else {
          resolve(null);
        }
        return;
      }
    }

    // Reset Ctrl+C state on other keys
    if (this.ctrlCPressed && !(key.ctrl && key.name === 'c')) {
      this.ctrlCPressed = false;
      this.render(); // Re-render to remove Ctrl+C message
    }

    // Handle arrow key navigation
    if (key.name === 'up' || key.name === 'down') {
      const direction = key.name === 'up' ? 'up' : 'down';
      if (this.renderer.navigate(direction)) {
        this.render();
      }
      return;
    }

    // Handle Enter key
    if (key.name === 'return') {
      const selectedItem = this.renderer.getSelectedItem();
      if (!selectedItem) return;

      // Handle Exit item with confirmation
      if (selectedItem.id === 'exit') {
        if (!this.exitConfirmationPending) {
          this.exitConfirmationPending = true;
          this.showExitConfirmation();
          return;
        } else {
          // Second Enter on exit - confirm exit
          this.stop();
          if (this.config.onExit) {
            this.config.onExit().finally(() => resolve(null));
          } else {
            resolve(null);
          }
          return;
        }
      }

      // Reset exit confirmation on other items
      if (this.exitConfirmationPending && selectedItem.id !== 'exit') {
        this.exitConfirmationPending = false;
        this.render();
      }

      // Handle regular item selection
      this.stop();
      if (this.config.onSelection) {
        this.config.onSelection(selectedItem).finally(() => resolve(selectedItem));
      } else {
        resolve(selectedItem);
      }
      return;
    }

    // Handle Escape key
    if (key.name === 'escape') {
      this.stop();
      resolve(null);
      return;
    }
  }

  private render(): void {
    console.clear();
    
    // Convert menu sections to window content
    const windowContent = this.buildWindowContent();
    
    const windowConfig: WindowLayoutConfig = {
      title: this.config.title,
      subtitle: this.config.subtitle,
      content: windowContent,
      theme: this.config.theme || DefaultColorThemes.default
    };

    const output = this.renderer.renderWindow(windowConfig);
    console.log(output);
  }

  private buildWindowContent(): WindowContentSection[] {
    const sections: WindowContentSection[] = [];
    
    for (const configSection of this.config.sections) {
      if (configSection.type === 'separator') {
        sections.push({
          id: configSection.id,
          heading: configSection.heading,
          items: [],
          type: 'separator'
        });
      } else {
        const items: WindowContentItem[] = configSection.items.map(item => ({
          id: item.id,
          label: item.label,
          description: item.description || '',
          enabled: item.enabled !== false,
          icon: item.icon,
          data: item
        }));

        sections.push({
          id: configSection.id,
          heading: configSection.heading,
          items: items,
          type: 'menu'
        });
      }
    }

    return sections;
  }

  private showExitConfirmation(): void {
    // Update the exit item to show confirmation message
    const exitSection = this.config.sections.find(section => 
      section.items?.some(item => item.id === 'exit')
    );
    
    if (exitSection) {
      const exitItem = exitSection.items.find(item => item.id === 'exit');
      if (exitItem) {
        exitItem.label = 'Press Enter again to shut down Templum CLI';
        this.render();
      }
    }
  }

  private showCtrlCConfirmation(): void {
    console.clear();
    const windowConfig: WindowLayoutConfig = {
      title: this.config.title,
      subtitle: 'Press Ctrl+C again to shut down Templum CLI',
      content: this.buildWindowContent(),
      theme: this.config.theme || DefaultColorThemes.default
    };

    const output = this.renderer.renderWindow(windowConfig);
    console.log(output);
  }

  /**
   * Create default menu sections with proper ordering
   */
  static createDefaultSections(backendServices?: any[]): MenuSection[] {
    const sections: MenuSection[] = [];

    // Main menu items
    sections.push({
      id: 'main-actions',
      items: [
        {
          id: 'backend-services',
          label: 'Backend Services',
          description: 'View and manage connected backend services',
          action: 'navigate:services',
          icon: ''
        },
        {
          id: 'execute-commands',
          label: 'Execute Commands',
          description: 'Run commands on connected backends',
          action: 'navigate:commands',
          icon: ''
        },
        {
          id: 'system-status',
          label: 'System Status',
          description: 'View system health and configuration',
          action: 'execute:status',
          icon: ''
        },
        {
          id: 'settings',
          label: 'Settings',
          description: 'Configure Templum behavior',
          action: 'navigate:settings',
          icon: ''
        }
      ]
    });

    // Backend services if provided (connected first, then alphabetical)
    if (backendServices && backendServices.length > 0) {
      const connectedServices = backendServices
        .filter(service => service.connected)
        .sort((a, b) => a.id.localeCompare(b.id));
      
      const disconnectedServices = backendServices
        .filter(service => !service.connected)
        .sort((a, b) => a.id.localeCompare(b.id));

      const serviceItems = [...connectedServices, ...disconnectedServices].map(service => ({
        id: `service-${service.id}`,
        label: service.id,
        description: `${service.connected ? 'Connected' : 'Disconnected'} - ${service.health || 'Unknown'}`,
        action: `service:info:${service.id}`,
        enabled: true,
        icon: service.connected && service.health === 'healthy' ? '' : ''
      }));

      if (serviceItems.length > 0) {
        sections.push({
          id: 'backend-services',
          heading: 'Available Services',
          items: serviceItems
        });
      }
    }

    // Separator
    sections.push({
      id: 'separator',
      type: 'separator',
      items: []
    });

    // Navigation items
    sections.push({
      id: 'navigation',
      items: [
        {
          id: 'back',
          label: 'Back',
          action: 'navigate:back',
          enabled: true
        },
        {
          id: 'home',
          label: 'Home',
          action: 'navigate:home',
          enabled: true
        },
        {
          id: 'help',
          label: 'Help',
          action: 'show:help',
          enabled: true
        },
        {
          id: 'exit',
          label: 'Exit',
          action: 'system:exit',
          enabled: true
        }
      ]
    });

    return sections;
  }
}

/**
 * Responsive Layout Manager for Terminal
 */
export interface TerminalDimensions {
  width: number;
  height: number;
}

export interface ResponsiveLayoutConfig {
  minWidth: number;
  minHeight: number;
  breakpoints: {
    small: number;
    medium: number;
    large: number;
  };
  theme: TerminalColorTheme;
}

export class ResponsiveLayout extends EventEmitter {
  private config: ResponsiveLayoutConfig;
  private currentDimensions: TerminalDimensions;

  constructor(config: Partial<ResponsiveLayoutConfig> = {}) {
    super();
    
    this.config = {
      minWidth: 40,
      minHeight: 10,
      breakpoints: {
        small: 60,
        medium: 100,
        large: 140
      },
      theme: DefaultColorThemes.default,
      ...config
    };
    
    this.currentDimensions = {
      width: process.stdout.columns || 80,
      height: process.stdout.rows || 24
    };
    
    this.setupResizeListener();
  }

  private normalizeWidth(width: number): number {
    return Math.max(1, Math.floor(width));
  }

  private measure(value: string): number {
    return StringWidthUtils.getDisplayWidth(String(value));
  }

  private formatCell(
    value: string,
    width: number,
    alignment: 'left' | 'right' | 'center' = 'left',
    ellipsis = '…'
  ): string {
    const targetWidth = this.normalizeWidth(width);
    return StringUtils.chain(String(value), { mode: 'terminal' })
      .truncate(targetWidth, ellipsis)
      .pad(targetWidth, alignment)
      .value();
  }

  private truncateText(value: string, width: number, ellipsis = '...'): string {
    const targetWidth = this.normalizeWidth(width);
    return StringUtils.chain(String(value), { mode: 'terminal' })
      .truncate(targetWidth, ellipsis)
      .value();
  }

  getCurrentBreakpoint(): 'small' | 'medium' | 'large' {
    const width = this.currentDimensions.width;
    
    if (width < this.config.breakpoints.small) return 'small';
    if (width < this.config.breakpoints.medium) return 'medium';
    return 'large';
  }

  getDimensions(): TerminalDimensions {
    return { ...this.currentDimensions };
  }

  formatForBreakpoint<T>(content: T, formatters: {
    small: (content: T) => string;
    medium: (content: T) => string;
    large: (content: T) => string;
  }): string {
    const breakpoint = this.getCurrentBreakpoint();
    return formatters[breakpoint](content);
  }

  wrapText(text: string, maxWidth?: number): string[] {
    const width = maxWidth || Math.max(this.config.minWidth, this.currentDimensions.width - 4);
    return StringUtils.wrap(text, this.normalizeWidth(width));
  }

  createTable(data: any[], headers: string[]): string {
    const breakpoint = this.getCurrentBreakpoint();
    const maxWidth = this.currentDimensions.width;
    
    if (breakpoint === 'small') {
      // Compact vertical layout for small screens
      return this.formatCompactTable(data, headers);
    } else {
      // Traditional table layout with consistency framework integration
      return this.formatFullTableWithConsistency(data, headers, maxWidth);
    }
  }

  private formatCompactTable(data: any[], headers: string[]): string {
    let result = '';
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      result += this.config.theme.primary(`─── Record ${i + 1} ───\n`);
      
      headers.forEach(header => {
        const value = row[header] || '';
        result += `${this.config.theme.accent(header)}: ${value}\n`;
      });
      
      result += '\n';
    }
    
    return result;
  }

  private formatFullTable(data: any[], headers: string[], maxWidth: number): string {
    if (data.length === 0) return '';
    
    // Calculate column widths
    const colWidths = headers.map(header => {
      const headerWidth = this.measure(header);
      const contentWidth = Math.max(...data.map(row => this.measure(row[header] || '')));
      return Math.max(headerWidth, contentWidth);
    });
    
    // Adjust widths if table is too wide
    const totalWidth = colWidths.reduce((sum, width) => sum + width, 0) + (headers.length * 3);
    if (totalWidth > maxWidth) {
      const availableWidth = maxWidth - (headers.length * 3);
      const avgWidth = Math.floor(availableWidth / headers.length);
      colWidths.forEach((_, index) => {
        colWidths[index] = Math.min(colWidths[index], avgWidth);
      });
    }
    
    // Build table
    let result = '';
    
    // Header
    result += '┌' + colWidths.map(w => '─'.repeat(w + 2)).join('┬') + '┐\n';
    result += '│' + headers.map((header, i) => {
      const formatted = this.formatCell(header, colWidths[i], 'left', '…');
      return ` ${this.config.theme.primary(formatted)} `;
    }).join('│') + '│\n';
    result += '├' + colWidths.map(w => '─'.repeat(w + 2)).join('┼') + '┤\n';
    
    // Rows
    data.forEach(row => {
      result += '│' + headers.map((header, i) => {
        const value = row[header] ?? '';
        const formatted = this.formatCell(value, colWidths[i], 'left', '…');
        return ` ${formatted} `;
      }).join('│') + '│\n';
    });
    
    result += '└' + colWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┘\n';
    
    return result;
  }

  private formatFullTableWithConsistency(data: any[], headers: string[], maxWidth: number): string {
    if (data.length === 0) return '';
    
    // Calculate column widths using consistency framework approach
    // Apply standard 3-character padding as per consistency requirements
    const STANDARD_PADDING = 3;
    const colWidths = headers.map(header => {
      const headerWidth = this.measure(header);
      const contentWidth = Math.max(...data.map(row => this.measure(row[header] || '')));
      return Math.max(headerWidth, contentWidth);
    });
    
    // Apply width standards: minimum width for widest contents + standard padding
    const optimalWidth = Math.max(...colWidths) + (STANDARD_PADDING * 2);
    const constrainedWidth = Math.min(optimalWidth, maxWidth - (headers.length * 3));
    
    // Adjust widths proportionally if table exceeds maxWidth
    const totalContentWidth = colWidths.reduce((sum, width) => sum + width, 0);
    const borderAndPaddingWidth = (headers.length + 1) + (headers.length * 2); // borders + cell padding
    const totalTableWidth = totalContentWidth + borderAndPaddingWidth;
    
    if (totalTableWidth > maxWidth) {
      const availableContentWidth = maxWidth - borderAndPaddingWidth;
      const scaleFactor = availableContentWidth / totalContentWidth;
      colWidths.forEach((width, index) => {
        colWidths[index] = Math.max(8, Math.floor(width * scaleFactor)); // Min 8 chars per column
      });
    }
    
    // Build table with consistency framework separator patterns
    let result = '';
    
    // Use standardized border characters (━ for major sections as per consistency framework)
    const borderChar = '─'; // Horizontal for table borders
    const verticalChar = '│'; // Vertical for table borders
    
    // Header with consistent formatting
    result += '┌' + colWidths.map(w => borderChar.repeat(w + 2)).join('┬') + '┐\n';
    result += verticalChar + headers.map((header, i) => {
      const formattedHeader = this.formatCell(header, colWidths[i], 'left', '…');
      return this.config.theme.primary(` ${formattedHeader} `);
    }).join(verticalChar) + verticalChar + '\n';
    
    // Header separator (major section separator as per consistency framework)
    result += '├' + colWidths.map(w => borderChar.repeat(w + 2)).join('┼') + '┤\n';
    
    // Data rows with consistent spacing
    data.forEach((row, rowIndex) => {
      result += verticalChar + headers.map((header, colIndex) => {
        const value = row[header] ?? '';
        const width = colWidths[colIndex];
        const cellContent = this.formatCell(value, width, 'left', '…');
        return ` ${cellContent} `;
      }).join(verticalChar) + verticalChar + '\n';
    });
    
    // Bottom border
    result += '└' + colWidths.map(w => borderChar.repeat(w + 2)).join('┴') + '┘\n';
    
    return result;
  }

  private setupResizeListener(): void {
    process.stdout.on('resize', () => {
      this.currentDimensions = {
        width: process.stdout.columns || 80,
        height: process.stdout.rows || 24
      };
      
      this.emit('resize', this.currentDimensions);
    });
  }
}

/**
 * Terminal UI Manager - Orchestrates all terminal components
 */
export interface TerminalUIConfig {
  theme: TerminalColorTheme;
  responsive: ResponsiveLayoutConfig;
}

export class TerminalUI extends EventEmitter {
  private theme: TerminalColorTheme;
  private layout: ResponsiveLayout;
  private activeComponents: Set<ProgressBar | Spinner | InteractivePrompt> = new Set();

  constructor(config: Partial<TerminalUIConfig> = {}) {
    super();
    
    this.theme = config.theme || DefaultColorThemes.default;
    this.layout = new ResponsiveLayout(config.responsive);
    
    this.setupEventHandlers();
  }

  createProgressBar(config?: Partial<ProgressBarConfig>): ProgressBar {
    const progressBar = new ProgressBar({
      theme: this.getTheme(),
      ...config
    });
    
    this.activeComponents.add(progressBar);
    progressBar.on('complete', () => this.activeComponents.delete(progressBar));
    
    return progressBar;
  }

  createSpinner(config?: Partial<SpinnerConfig>): Spinner {
    const spinner = new Spinner({
      theme: this.getTheme(),
      ...config
    });
    
    this.activeComponents.add(spinner);
    spinner.on('stop', () => this.activeComponents.delete(spinner));
    
    return spinner;
  }

  createPrompt(config?: Partial<PromptConfig>): InteractivePrompt {
    const prompt = new InteractivePrompt({
      theme: this.getTheme(),
      ...config
    });
    
    this.activeComponents.add(prompt);
    
    return prompt;
  }

  createInteractiveSearch(config?: Partial<InteractiveSearchConfig>): InteractiveSearch {
    const search = new InteractiveSearch({
      theme: this.getTheme(),
      ...config
    });
    
    // Note: InteractiveSearch manages its own lifecycle, no need to track in activeComponents
    
    return search;
  }

  getLayout(): ResponsiveLayout {
    return this.layout;
  }

  setTheme(theme: TerminalColorTheme): void {
    this.theme = theme;
    this.emit('themeChanged', theme);
  }

  getTheme(): TerminalColorTheme {
    // Safety check: ensure theme has proper chalk functions
    const requiredFunctions = ['primary', 'secondary', 'success', 'warning', 'error', 'info', 'accent', 'muted'];
    const isThemeValid = requiredFunctions.every(fn => typeof this.theme[fn as keyof TerminalColorTheme] === 'function');
    
    if (!isThemeValid) {
      console.warn('[TerminalUI] Theme corrupted, restoring default theme');
      this.theme = DefaultColorThemes.default;
      
      // Clear active components since they have corrupted themes
      // They will be recreated with the correct theme when needed
      this.activeComponents.clear();
    }
    return this.theme;
  }

  clearScreen(): void {
    console.clear();
  }

  async cleanup(): Promise<void> {
    // Stop all active components
    const components = Array.from(this.activeComponents);
    for (const component of components) {
      if (component instanceof ProgressBar) {
        component.complete();
      } else if (component instanceof Spinner) {
        component.stop();
      }
    }
    
    this.activeComponents.clear();
  }

  private setupEventHandlers(): void {
    // Handle process cleanup
    process.on('SIGINT', async () => {
      await this.cleanup();
    });
    
    process.on('SIGTERM', async () => {
      await this.cleanup();
    });
  }
}

/**
 * Interactive Search and Filtering Component - TASK-CLI-002 Implementation
 */
export interface SearchableItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  data: any;
}

export interface SearchResult extends SearchableItem {
  score: number;
  highlightedTitle: string;
  matchedFields: string[];
}

export interface InteractiveSearchConfig {
  theme: TerminalColorTheme;
  placeholder: string;
  minSearchLength: number;
  maxResults: number;
  enableFuzzySearch: boolean;
  enableCategoryFilter: boolean;
  categories?: string[];
  keyBindings?: {
    search: string;
    filter: string;
    navigate: string[];
    select: string;
    cancel: string;
  };
}

export class InteractiveSearch extends EventEmitter {
  private config: InteractiveSearchConfig;
  private items: SearchableItem[] = [];
  private filteredItems: SearchResult[] = [];
  private currentQuery = '';
  private activeCategory: string | null = null;
  private selectedIndex = 0;
  private isActive = false;
  private rl: readline.Interface | null = null;
  private layout: ResponsiveLayout;

  constructor(config: Partial<InteractiveSearchConfig> = {}) {
    super();
    
    this.config = {
      theme: DefaultColorThemes.default,
      placeholder: 'Search... (type to filter, tab for categories, ↑↓ to navigate, enter to select)',
      minSearchLength: 1,
      maxResults: 10,
      enableFuzzySearch: true,
      enableCategoryFilter: true,
      keyBindings: {
        search: 'type',
        filter: 'tab',
        navigate: ['up', 'down'],
        select: 'return',
        cancel: 'escape'
      },
      ...config
    };

    this.layout = new ResponsiveLayout({
      minWidth: 40,
      minHeight: 10
      // Let ResponsiveLayout use its safe DefaultColorThemes.default
    });
  }

  setItems(items: SearchableItem[]): void {
    this.items = items;
    this.filteredItems = [];
    this.currentQuery = '';
    this.selectedIndex = 0;
    
    // Extract categories if not provided
    if (this.config.enableCategoryFilter && !this.config.categories) {
      this.config.categories = Array.from(new Set(items.map(item => item.category)));
    }
    
    this.emit('itemsUpdated', items.length);
  }

  async start(): Promise<SearchResult | null> {
    if (this.isActive) {
      throw new Error('Interactive search is already active');
    }

    return new Promise((resolve, reject) => {
      this.isActive = true;
      this.filteredItems = this.items.map(item => ({
        ...item,
        score: 1.0,
        highlightedTitle: item.title,
        matchedFields: ['title']
      }));
      
      this.setupReadline();
      this.render();
      
      // Set up event handlers
      const onComplete = (result: SearchResult | null) => {
        this.cleanup();
        resolve(result);
      };

      const onError = (error: Error) => {
        this.cleanup();
        reject(error);
      };

      this.once('complete', onComplete);
      this.once('cancel', () => onComplete(null));
      this.once('error', onError);

      // Handle keyboard input
      this.setupKeyboardHandlers();
    });
  }

  stop(): void {
    if (this.isActive) {
      this.emit('cancel');
    }
  }

  private setupReadline(): void {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true
    });

    // Enable keypress events
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(true);
    }
  }

  private setupKeyboardHandlers(): void {
    if (!process.stdin.on) return;

    process.stdin.on('keypress', (chunk, key) => {
      if (!this.isActive || !key) return;

      try {
        this.handleKeypress(chunk, key);
      } catch (error) {
        this.emit('error', error);
      }
    });
  }

  private handleKeypress(chunk: any, key: any): void {
    if (key.ctrl && key.name === 'c') {
      this.emit('cancel');
      return;
    }

    switch (key.name) {
      case 'escape':
        this.emit('cancel');
        break;
      
      case 'return':
      case 'enter':
        if (this.filteredItems.length > 0 && this.selectedIndex < this.filteredItems.length) {
          this.emit('complete', this.filteredItems[this.selectedIndex]);
        } else {
          this.emit('cancel');
        }
        break;
      
      case 'up':
        this.selectedIndex = Math.max(0, this.selectedIndex - 1);
        this.render();
        break;
      
      case 'down':
        this.selectedIndex = Math.min(this.filteredItems.length - 1, this.selectedIndex + 1);
        this.render();
        break;
      
      case 'tab':
        if (this.config.enableCategoryFilter) {
          this.cycleCategoryFilter();
        }
        break;
      
      case 'backspace':
        if (this.currentQuery.length > 0) {
          this.currentQuery = this.currentQuery.slice(0, -1);
          this.updateSearch();
        }
        break;
      
      default:
        // Handle character input
        if (key.sequence && key.sequence.length === 1 && !key.ctrl && !key.meta) {
          const char = key.sequence;
          if (char.match(/[a-zA-Z0-9\s\-_\.]/)) {
            this.currentQuery += char;
            this.updateSearch();
          }
        }
        break;
    }
  }

  private cycleCategoryFilter(): void {
    if (!this.config.categories || this.config.categories.length === 0) return;

    const categories = ['All', ...this.config.categories];
    const currentIndex = this.activeCategory 
      ? categories.indexOf(this.activeCategory) 
      : 0;
    
    const nextIndex = (currentIndex + 1) % categories.length;
    this.activeCategory = categories[nextIndex] === 'All' ? null : categories[nextIndex];
    
    this.updateSearch();
  }

  private updateSearch(): void {
    let results = this.items;

    // Apply category filter first
    if (this.activeCategory) {
      results = results.filter(item => item.category === this.activeCategory);
    }

    // Apply search query
    if (this.currentQuery.length >= this.config.minSearchLength) {
      results = this.config.enableFuzzySearch 
        ? this.performFuzzySearch(results, this.currentQuery)
        : this.performExactSearch(results, this.currentQuery);
    }

    // Convert to SearchResults and limit
    this.filteredItems = results
      .slice(0, this.config.maxResults)
      .map(item => {
        if ('score' in item) {
          return item as SearchResult;
        }
        return {
          ...item,
          score: 1.0,
          highlightedTitle: this.highlightMatch(item.title, this.currentQuery),
          matchedFields: ['title']
        };
      });

    // Reset selection if needed
    this.selectedIndex = Math.min(this.selectedIndex, this.filteredItems.length - 1);
    if (this.selectedIndex < 0) this.selectedIndex = 0;

    this.render();
    this.emit('searchUpdated', this.currentQuery, this.filteredItems.length);
  }

  private performFuzzySearch(items: SearchableItem[], query: string): SearchResult[] {
    const queryLower = query.toLowerCase();
    const results: SearchResult[] = [];

    for (const item of items) {
      const score = this.calculateFuzzyScore(item, queryLower);
      if (score > 0) {
        results.push({
          ...item,
          score,
          highlightedTitle: this.highlightMatch(item.title, query),
          matchedFields: this.getMatchedFields(item, queryLower)
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private performExactSearch(items: SearchableItem[], query: string): SearchResult[] {
    const queryLower = query.toLowerCase();
    return items
      .filter(item => 
        item.title.toLowerCase().includes(queryLower) ||
        item.description?.toLowerCase().includes(queryLower) ||
        item.tags?.some(tag => tag.toLowerCase().includes(queryLower))
      )
      .map(item => ({
        ...item,
        score: 1.0,
        highlightedTitle: this.highlightMatch(item.title, query),
        matchedFields: this.getMatchedFields(item, queryLower)
      }));
  }

  private calculateFuzzyScore(item: SearchableItem, query: string): number {
    let score = 0;
    const titleLower = item.title.toLowerCase();
    const descLower = item.description?.toLowerCase() || '';
    
    // Exact title match gets highest score
    if (titleLower.includes(query)) {
      score += 100;
      if (titleLower.startsWith(query)) score += 50;
      if (titleLower === query) score += 100;
    }
    
    // Description match
    if (descLower.includes(query)) {
      score += 20;
    }
    
    // Tag matches
    if (item.tags) {
      for (const tag of item.tags) {
        if (tag.toLowerCase().includes(query)) {
          score += 30;
        }
      }
    }
    
    // Fuzzy character matching for titles
    const fuzzyScore = this.calculateCharacterScore(titleLower, query);
    score += fuzzyScore;
    
    return score;
  }

  private calculateCharacterScore(text: string, query: string): number {
    let score = 0;
    let queryIndex = 0;
    
    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) {
        score += query.length - queryIndex;
        queryIndex++;
      }
    }
    
    // Bonus for matching all characters
    if (queryIndex === query.length) {
      score += 10;
    }
    
    return score;
  }

  private getMatchedFields(item: SearchableItem, query: string): string[] {
    const fields: string[] = [];
    
    if (item.title.toLowerCase().includes(query)) fields.push('title');
    if (item.description?.toLowerCase().includes(query)) fields.push('description');
    if (item.tags?.some(tag => tag.toLowerCase().includes(query))) fields.push('tags');
    
    return fields;
  }

  private highlightMatch(text: string, query: string): string {
    if (!query) return text;
    
    const regex = new RegExp(`(${this.escapeRegExp(query)})`, 'gi');
    return text.replace(regex, this.config.theme.accent('$1'));
  }

  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private render(): void {
    if (!this.isActive) return;

    // Clear screen and move to top
    console.clear();

    const dimensions = this.layout.getDimensions();
    const breakpoint = this.layout.getCurrentBreakpoint();
    
    // Render header
    this.renderHeader(breakpoint);
    
    // Render search input
    this.renderSearchInput(breakpoint);
    
    // Render category filter if enabled
    if (this.config.enableCategoryFilter && this.config.categories) {
      this.renderCategoryFilter(breakpoint);
    }
    
    // Render results
    this.renderResults(breakpoint, dimensions);
    
    // Render footer with help
    this.renderFooter(breakpoint);
  }

  private renderHeader(breakpoint: 'small' | 'medium' | 'large'): void {
    const title = this.config.theme.primary('[SEARCH] Interactive Search');
    const subtitle = this.config.theme.muted(`${this.filteredItems.length} results`);
    
    if (breakpoint === 'small') {
      console.log(`${title}\n${subtitle}`);
    } else {
      console.log(`${title} - ${subtitle}`);
    }
    console.log(this.config.theme.muted('-'.repeat(Math.min(60, process.stdout.columns || 80))));
  }

  private renderSearchInput(_breakpoint: 'small' | 'medium' | 'large'): void {
    const prompt = this.config.theme.accent('Search: ');
    const query = this.currentQuery || this.config.theme.muted('(type to search)');
    const cursor = this.isActive ? this.config.theme.primary('|') : '';
    
    console.log(`${prompt}${query}${cursor}`);
    console.log('');
  }

  private renderCategoryFilter(breakpoint: 'small' | 'medium' | 'large'): void {
    if (!this.config.categories) return;
    
    const prefix = this.config.theme.muted('Filter: ');
    const activeCategory = this.activeCategory || 'All';
    const categories = ['All', ...this.config.categories];
    
    if (breakpoint === 'small') {
      console.log(`${prefix}${this.config.theme.info(activeCategory)} (tab to change)`);
    } else {
      const categoryList = categories.map(cat => 
        cat === activeCategory 
          ? this.config.theme.accent(`[${cat}]`)
          : this.config.theme.muted(cat)
      ).join(' ');
      console.log(`${prefix}${categoryList}`);
    }
    console.log('');
  }

  private renderResults(breakpoint: 'small' | 'medium' | 'large', dimensions: TerminalDimensions): void {
    if (this.filteredItems.length === 0) {
      console.log(this.config.theme.warning('No results found'));
      return;
    }

    const maxDisplayResults = Math.min(
      this.filteredItems.length,
      Math.max(5, dimensions.height - 10)
    );

    for (let i = 0; i < maxDisplayResults; i++) {
      const item = this.filteredItems[i];
      const isSelected = i === this.selectedIndex;
      
      this.renderResultItem(item, isSelected, breakpoint);
    }

    if (this.filteredItems.length > maxDisplayResults) {
      const remaining = this.filteredItems.length - maxDisplayResults;
      console.log(this.config.theme.muted(`... and ${remaining} more results`));
    }
  }

  private renderResultItem(result: SearchResult, isSelected: boolean, breakpoint: 'small' | 'medium' | 'large'): void {
    const indicator = isSelected ? '>' : ' ';
    const theme = isSelected ? this.config.theme.accent : this.config.theme.primary;
    
    if (breakpoint === 'small') {
      // Compact format for small screens
      console.log(`${this.config.theme.primary(indicator)} ${theme(result.highlightedTitle)}`);
      if (result.description) {
        const truncated = this.truncateResultText(result.description, 50, '...');
        console.log(`  ${this.config.theme.muted(truncated)}`);
      }
    } else {
      // Full format for larger screens
      const category = this.config.theme.muted(`[${result.category}]`);
      const score = this.config.enableFuzzySearch ? 
        this.config.theme.muted(` (${result.score.toFixed(1)})`) : '';
      
      console.log(`${this.config.theme.primary(indicator)} ${theme(result.highlightedTitle)} ${category}${score}`);
      
      if (result.description) {
        const desc = breakpoint === 'medium'
          ? this.truncateResultText(result.description, 80, '...')
          : result.description;
        console.log(`  ${this.config.theme.muted(desc)}`);
      }
    }
    
    console.log('');
  }

  private truncateResultText(value: string, width: number, ellipsis = '...'): string {
    return StringUtils.chain(String(value), { mode: 'terminal' })
      .truncate(Math.max(1, width), ellipsis)
      .value();
  }

  private renderFooter(breakpoint: 'small' | 'medium' | 'large'): void {
    const help = breakpoint === 'small' 
      ? 'ESC: cancel | ENTER: select | UP/DOWN: navigate'
      : 'ESC: cancel | ENTER: select | UP/DOWN: navigate | TAB: filter | Type: search';
    
    console.log(this.config.theme.muted('-'.repeat(Math.min(60, process.stdout.columns || 80))));
    console.log(this.config.theme.muted(help));
  }

  private cleanup(): void {
    this.isActive = false;
    
    if (process.stdin.setRawMode) {
      process.stdin.setRawMode(false);
    }
    
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
    
    process.stdin.removeAllListeners('keypress');
  }
}

/**
 * Default Terminal UI configuration
 */
export const DEFAULT_TERMINAL_UI_CONFIG = {
  responsive: {
    minWidth: 40,
    minHeight: 10,
    breakpoints: {
      small: 60,
      medium: 100,
      large: 140
    },
    theme: DefaultColorThemes.default
  }
};

/**
 * Factory function for creating terminal UI instance with centralized defaults
 */
export function createDefaultTerminalUI(themeName: keyof typeof DefaultColorThemes = 'default'): TerminalUI {
  const theme = DefaultColorThemes[themeName] || DefaultColorThemes.default;
  return createTerminalUI({
    theme,
    responsive: DEFAULT_TERMINAL_UI_CONFIG.responsive
  });
}

/**
 * Factory function for creating terminal UI instance
 */
export function createTerminalUI(config?: Partial<TerminalUIConfig>): TerminalUI {
  return new TerminalUI(config);
}
