/**
---
title: [Terminal UI Components - Interactive CLI Elements]
tags: [Terminal, UI, Progress, Spinner, Interactive, CLI]
provides: [ProgressBar, Spinner, InteractivePrompt, ColorTheme, ResponsiveLayout]
requires: [readline, process]
description: [Terminal UI components for progress indication, user interaction, and responsive layouts]
---
**/

import * as readline from 'readline';
import { StringUtils, StringWidthUtils } from '../utils/chainable-string-utils';
import { TerminalFormatter, createFormatter } from '../utils/terminal-formatter';
import { createInterval, createTimeout } from '../utils/async-utils';
import { DisplayUtils, DisplayStandards } from '../utils/display-utils';
import { WindowUtils } from '../utils/window-utils';
import { EventDrivenComponent } from '../utils/event-bus-adapter';
import {
  subscribe,
  cleanupContext,
} from '../utils/event-utils';
import type { TypedEventEmitter, TypedEventMap } from '../utils/event-utils';
import { createLogger, Logger } from '../utils/logger';
import { computeDisplayLayout } from './display-utils-layout';
import {
  DefaultColorThemes,
  TerminalColorTheme,
  ThemeIntegrityResult,
  ensureThemeIntegrity,
  setTerminalUIFormatter,
} from './terminal-ui-theme';

export {
  DefaultColorThemes,
  ensureThemeIntegrity,
  setTerminalUIFormatter,
} from './terminal-ui-theme';

export type {
  TerminalColorTheme,
  ThemeIntegrityResult,
} from './terminal-ui-theme';

let terminalUILogger: Logger = createLogger('terminal-ui-components');

export const setTerminalUILogger = (logger: Logger): void => {
  terminalUILogger = logger;
};

const CLEAR_SEQUENCE = '\u001b[2J\u001b[0f';

function writeLine(value: string = ''): void {
  if (typeof process.stdout?.write !== 'function') {
    return;
  }

  const content = value.endsWith('\n') ? value : `${value}\n`;
  process.stdout.write(content);
}

function clearTerminal(): void {
  if (typeof process.stdout?.write !== 'function') {
    return;
  }

  process.stdout.write(CLEAR_SEQUENCE);
}

// Import consistency framework for table formatting integration
// TODO: [TASK-ID-006] Pattern: consistency-framework-integration | Complexity: 4 | Dependencies: cli-display-consistency-engine
// Context: Integrate terminal UI components with display consistency framework for standardized table formatting
// Validation-Required: table-format-consistency, responsive-layout-preservation, theme-compatibility
// Pattern-Info: { approach: "optional-integration", alternatives: "full-replacement", trade-offs: "backward-compatibility-vs-consistency" }

// Interactive Search and Filtering components - TASK-CLI-002 implementation
// Advanced Menu Navigation integration - TASK-CLI-003 compatibility maintained

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
  formatter?: TerminalFormatter;
}

interface ProgressBarEvents extends TypedEventMap {
  complete: () => void;
}

export class ProgressBar extends EventDrivenComponent<ProgressBarEvents> {
  private static instanceCounter = 0;
  private config: ProgressBarConfig;
  private current: number = 0;
  private total: number = 100;
  private startTime: number;
  private isActive: boolean = false;
  private readonly formatter?: TerminalFormatter;

  constructor(config: Partial<ProgressBarConfig> = {}) {
    super(`progress-bar:${ProgressBar.instanceCounter++}`, 10);
    
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

    this.formatter = config.formatter;
    
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
    const percentage = (this.current / Math.max(this.total, 1)) * 100;
    const completed = Math.round((percentage / 100) * this.config.width);
    const remaining = this.config.width - completed;

    if (this.formatter) {
      const progressLabel = message ?? undefined;
      let formatted = this.formatter.data.progress(this.current, this.total, progressLabel);

      if (!this.config.showPercentage) {
        formatted = formatted.replace(/\s+\d{1,3}%/, '');
      }

      if (!this.config.showEta) {
        formatted = formatted.replace(/\s+ETA:\s*[^\s]+/i, '');
      }

      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(formatted.trimEnd());
      return;
    }

    // Create progress bar visual
    const bar = this.config.theme.success(this.config.character.repeat(completed)) +
                this.config.incomplete.repeat(remaining);

    // Calculate ETA
    let eta = '';
    if (this.config.showEta && this.current > 0) {
      const elapsed = Date.now() - this.startTime;
      const rate = this.current / elapsed;
      const remainingUnits = this.total - this.current;
      const etaMs = rate > 0 ? remainingUnits / rate : 0;
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

interface SpinnerEvents extends TypedEventMap {
  start: () => void;
  stop: () => void;
}

export class Spinner extends EventDrivenComponent<SpinnerEvents> {
  private static instanceCounter = 0;
  private config: SpinnerConfig;
  private currentFrame: number = 0;
  private timer: ReturnType<typeof createInterval> | null = null;
  private isActive: boolean = false;

  constructor(config: Partial<SpinnerConfig> = {}) {
    super(`spinner:${Spinner.instanceCounter++}`, 10);
    
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
    
    this.timer = createInterval(() => {
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
      this.timer.stop();
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
  formatter?: TerminalFormatter;
}

interface InteractivePromptEvents extends TypedEventMap {}

export class InteractivePrompt extends EventDrivenComponent<InteractivePromptEvents> {
  private static instanceCounter = 0;
  private rl: readline.Interface | null = null;
  private config: PromptConfig;
  private readonly formatter?: TerminalFormatter;

  constructor(config: Partial<PromptConfig> = {}) {
    super(`interactive-prompt:${InteractivePrompt.instanceCounter++}`, 10);
    
    this.config = {
      theme: DefaultColorThemes.default,
      prefix: '?',
      suffix: ':',
      ...config
    };

    this.formatter = config.formatter;
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
            writeLine(this.config.theme.error(errorMessage));
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
      writeLine(this.config.theme.primary(`${this.config.prefix} ${question}`));
      
      // Display choices
      choices.forEach((choice, index) => {
        const indicator = index === defaultIndex ? '>' : ' ';
        const style = index === defaultIndex ? this.config.theme.accent : this.config.theme.muted;
        writeLine(`  ${this.config.theme.primary(indicator)} ${style(choice)}`);
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
          writeLine(`  ${this.config.theme.primary(indicator)} ${style(choice)}`);
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
      writeLine(this.config.theme.primary(`${this.config.prefix} ${question} (use space to select, enter to confirm)`));
      
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
          writeLine(`  ${this.config.theme.primary(indicator)} ${this.config.theme.primary(checkbox)} ${style(choice)}`);
        });
        
        // Show instruction
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        writeLine(this.config.theme.muted('  (Use arrow keys, space to select, enter to confirm)'));
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
    if (this.formatter) {
      const base = this.formatter.ui.prompt(question, 'input');
      const defaultText = defaultValue ? this.formatter.palette.muted(` (${defaultValue})`) : '';
      return `${base}${defaultText} `;
    }

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
  padding?: number;
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

interface WindowRenderMetrics {
  standards: DisplayStandards;
  windowWidth: number;
  contentWidth: number;
  separatorLength: number;
  padding: number;
}

export class EnhancedWindowLayoutRenderer {
  private readonly theme: TerminalColorTheme;
  private readonly formatter: TerminalFormatter;
  private items: WindowContentItem[] = [];
  private currentSelection = 0;

  constructor(
    theme: TerminalColorTheme = DefaultColorThemes.default,
    formatter: TerminalFormatter = createFormatter(),
  ) {
    this.theme = theme;
    this.formatter = formatter;
  }

  private deriveRenderMetrics(config: WindowLayoutConfig): WindowRenderMetrics {
    const samples = this.collectContentSamples(config);
    const metrics = computeDisplayLayout(samples, { borderWidth: 2 });

    return {
      standards: metrics.standards,
      windowWidth: metrics.windowWidth,
      contentWidth: metrics.contentWidth,
      separatorLength: metrics.separatorLength,
      padding: metrics.padding,
    };
  }

  private collectContentSamples(config: WindowLayoutConfig): string[] {
    const samples: string[] = [config.title];

    if (config.subtitle) {
      samples.push(config.subtitle);
    }

    for (const section of config.content) {
      if (section.heading) {
        samples.push(section.heading);
      }

      if (section.type !== 'separator') {
        for (const item of section.items) {
          const parts: string[] = [];
          if (item.icon) {
            parts.push(item.icon);
          }
          parts.push(item.label);
          const base = parts.join(' ').replace(/\s+/g, ' ').trim();
          const description = item.description ? ` - ${item.description}` : '';
          samples.push(`${base}${description}`.trim());
        }
      }
    }

    return samples;
  }

  renderWindow(config: WindowLayoutConfig): string {
    setTerminalUIFormatter(this.formatter);
    this.buildNavigationList(config.content);

    const metrics = this.deriveRenderMetrics(config);
    const padding = config.padding ?? metrics.padding;
    const width = config.width ?? metrics.windowWidth;
    const subtitleLines = config.subtitle ? [config.subtitle, ''] : [];
    const contentLines = [...subtitleLines, ...this.composeContentLines(config, metrics)];

    const rendered = WindowUtils.render({
      title: config.title,
      content: contentLines,
      width,
      padding,
    });

    const prompt = this.theme.info('Select an option: (Use arrow keys)');
    return `${rendered}\n\n${prompt}`;
  }

  navigate(direction: 'up' | 'down'): boolean {
    const totalItems = this.items.length;
    if (totalItems === 0) {
      return false;
    }

    const originalSelection = this.currentSelection;
    let attempts = 0;

    do {
      if (direction === 'up') {
        this.currentSelection = (this.currentSelection - 1 + totalItems) % totalItems;
      } else {
        this.currentSelection = (this.currentSelection + 1) % totalItems;
      }
      attempts += 1;
      if (this.items[this.currentSelection].enabled) {
        break;
      }
    } while (attempts <= totalItems);

    return this.currentSelection !== originalSelection;
  }

  getSelection(): WindowContentItem | null {
    return this.items[this.currentSelection] ?? null;
  }

  getSelectedItem(): WindowContentItem | null {
    return this.getSelection();
  }

  setSelection(itemId: string): boolean {
    const index = this.items.findIndex(item => item.id === itemId);
    if (index >= 0) {
      this.currentSelection = index;
      return true;
    }
    return false;
  }

  private composeContentLines(config: WindowLayoutConfig, metrics: WindowRenderMetrics): string[] {
    const lines: string[] = [];
    let itemIndex = 0;

    for (const section of config.content) {
      if (section.type === 'separator') {
        lines.push(DisplayUtils.separator(metrics.separatorLength));
        continue;
      }

      if (section.heading) {
        lines.push(section.heading);
      }

      for (const item of section.items) {
        const isSelected = itemIndex === this.currentSelection;
        lines.push(this.formatMenuItem(item, isSelected, metrics));
        itemIndex += 1;
      }

      if (section.items.length > 0 && section !== config.content[config.content.length - 1]) {
        lines.push('');
      }
    }

    return lines;
  }

  private formatMenuItem(item: WindowContentItem, isSelected: boolean, metrics: WindowRenderMetrics): string {
    const selector = isSelected ? '›' : ' ';
    const icon = item.icon ? `${item.icon}` : '';
    const fragments = [selector, icon, item.label].filter(fragment => fragment && fragment.trim().length > 0);
    let raw = fragments.join(' ').replace(/\s+/g, ' ').trim();
    if (item.description) {
      raw = `${raw} - ${item.description}`;
    }

    const [formatted] = DisplayUtils.formatItems([raw], {
      numbered: false,
      width: metrics.contentWidth,
      alignment: 'left',
    });

    if (!item.enabled) {
      return this.theme.muted(formatted);
    }

    return isSelected ? this.theme.accent(formatted) : this.theme.primary(formatted);
  }

  private buildNavigationList(content: WindowContentSection[]): void {
    this.items = [];
    for (const section of content) {
      if (section.type !== 'separator') {
        this.items.push(...section.items);
      }
    }
    if (this.currentSelection >= this.items.length) {
      this.currentSelection = Math.max(0, this.items.length - 1);
    }
  }
}

export interface EnhancedMenuConfig {
  title: string;
  subtitle?: string;
  sections: MenuSection[];
  theme?: TerminalColorTheme;
  formatter?: TerminalFormatter;
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

interface EnhancedInteractiveMenuEvents extends TypedEventMap {}

export class EnhancedInteractiveMenu extends EventDrivenComponent<EnhancedInteractiveMenuEvents> {
  private static instanceCounter = 0;
  private renderer: EnhancedWindowLayoutRenderer;
  private config: EnhancedMenuConfig;
  private isActive: boolean = false;
  private exitConfirmationPending: boolean = false;
  private ctrlCPressed: boolean = false;

  constructor(config: EnhancedMenuConfig) {
    super(`enhanced-interactive-menu:${EnhancedInteractiveMenu.instanceCounter++}`, 25);
    const formatter = config.formatter ?? createFormatter();
    this.config = { ...config, formatter };
    this.renderer = new EnhancedWindowLayoutRenderer(
      this.config.theme || DefaultColorThemes.default,
      formatter,
    );
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
    clearTerminal();
    
    // Convert menu sections to window content
    const windowContent = this.buildWindowContent();
    
    const windowConfig: WindowLayoutConfig = {
      title: this.config.title,
      subtitle: this.config.subtitle,
      content: windowContent,
      theme: this.config.theme || DefaultColorThemes.default
    };

    const output = this.renderer.renderWindow(windowConfig);
    writeLine(output);
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
    clearTerminal();
    const windowConfig: WindowLayoutConfig = {
      title: this.config.title,
      subtitle: 'Press Ctrl+C again to shut down Templum CLI',
      content: this.buildWindowContent(),
      theme: this.config.theme || DefaultColorThemes.default
    };

    const output = this.renderer.renderWindow(windowConfig);
    writeLine(output);
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

interface ResponsiveLayoutEvents extends TypedEventMap {
  resize: (dimensions: TerminalDimensions) => void;
}

export class ResponsiveLayout extends EventDrivenComponent<ResponsiveLayoutEvents> {
  private static instanceCounter = 0;
  private config: ResponsiveLayoutConfig;
  private currentDimensions: TerminalDimensions;
  private resizeListener: (() => void) | null = null;

  constructor(config: Partial<ResponsiveLayoutConfig> = {}) {
    super(`responsive-layout:${ResponsiveLayout.instanceCounter++}`, 20);
    
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
    this.resizeListener = () => {
      this.currentDimensions = {
        width: process.stdout.columns || 80,
        height: process.stdout.rows || 24
      };
      
      this.emit('resize', this.currentDimensions);
    };

    process.stdout.on('resize', this.resizeListener);
  }

  dispose(): void {
    if (this.resizeListener) {
      const stdout = process.stdout as typeof process.stdout & {
        off?: (event: string | symbol, listener: (...args: any[]) => void) => typeof process.stdout;
      };

      if (typeof stdout.off === 'function') {
        stdout.off('resize', this.resizeListener);
      } else {
        stdout.removeListener('resize', this.resizeListener);
      }

      this.resizeListener = null;
    }
  }
}

/**
 * Terminal UI Manager - Orchestrates all terminal components
 */
export interface TerminalUIConfig {
  theme: TerminalColorTheme;
  responsive: ResponsiveLayoutConfig;
  formatter?: TerminalFormatter;
  columnsProvider?: () => number | undefined;
  logger?: Logger;
}

type TerminalProcessEvents = {
  SIGINT: () => void;
  SIGTERM: () => void;
};

interface TerminalUIEvents extends TypedEventMap {
  themeChanged: (theme: TerminalColorTheme) => void;
}

export class TerminalUI extends EventDrivenComponent<TerminalUIEvents> {
  private static instanceCounter = 0;

  private theme: TerminalColorTheme;
  private layout: ResponsiveLayout;
  private activeComponents: Set<ProgressBar | Spinner | InteractivePrompt> = new Set();
  private readonly formatter: TerminalFormatter;
  private readonly logger: Logger;
  private readonly eventScope: string;
  private cleanupPromise: Promise<void> | null = null;
  private readonly handleCleanupSignal = async () => {
    await this.cleanup();
  };

  constructor(config: Partial<TerminalUIConfig> = {}) {
    const scope = `terminal-ui:${TerminalUI.instanceCounter++}`;
    super(scope, 50);
    process.setMaxListeners(0);

    this.eventScope = scope;
    const baseLogger = config.logger ?? terminalUILogger;
    this.logger = baseLogger.child(scope);
    
    this.formatter = config.formatter ?? createFormatter();
    setTerminalUIFormatter(this.formatter);
    const themeIntegrity = ensureThemeIntegrity(config.theme ?? DefaultColorThemes.default, DefaultColorThemes.default);
    if (themeIntegrity.resetRequired) {
      this.logger.warn('Theme failed integrity check during initialization; default theme applied');
    }
    this.theme = themeIntegrity.theme;
    this.layout = new ResponsiveLayout(config.responsive);

    const columnsProvider =
      config.columnsProvider ??
      (() => (typeof process.stdout?.columns === 'number' ? process.stdout.columns : undefined));
    DisplayUtils.configure({ formatter: this.formatter, columnsProvider });
    WindowUtils.configure({ formatter: this.formatter });

    this.setupEventHandlers();
  }

  createProgressBar(config?: Partial<ProgressBarConfig>): ProgressBar {
    const progressBar = new ProgressBar({
      theme: this.getTheme(),
      formatter: this.formatter,
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
      formatter: this.formatter,
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
    setTerminalUIFormatter(this.formatter);
    const integrity = ensureThemeIntegrity(theme, DefaultColorThemes.default);
    this.theme = integrity.theme;
    if (integrity.resetRequired) {
      this.logger.warn('Provided theme failed integrity checks; default theme applied');
    }
    this.emit('themeChanged', this.theme);
  }

  getTheme(): TerminalColorTheme {
    const integrity = ensureThemeIntegrity(this.theme, DefaultColorThemes.default);
    if (integrity.resetRequired) {
      this.logger.warn('Theme corrupted, restoring default theme');
      this.theme = integrity.theme;
      this.activeComponents.clear();
      setTerminalUIFormatter(this.formatter);
    }
    return this.theme;
  }

  clearScreen(): void {
    clearTerminal();
  }

  async cleanup(): Promise<void> {
    if (this.cleanupPromise) {
      return this.cleanupPromise;
    }

    this.cleanupPromise = (async () => {
      const waiters: Promise<unknown>[] = [];

      for (const component of Array.from(this.activeComponents)) {
        if (component instanceof ProgressBar) {
          const waiter = new Promise<void>(resolve => {
            let settled = false;
            const timeout = createTimeout(() => {
              if (settled) {
                return;
              }
              settled = true;
              resolve();
            }, 250, { unref: true });
            component.once('complete', () => {
              if (settled) {
                return;
              }
              settled = true;
              timeout.cancel();
              resolve();
            });
          }).catch(() => undefined);
          component.complete();
          waiters.push(waiter);
          component.removeAllListeners();
        } else if (component instanceof Spinner) {
          const waiter = new Promise<void>(resolve => {
            let settled = false;
            const timeout = createTimeout(() => {
              if (settled) {
                return;
              }
              settled = true;
              resolve();
            }, 250, { unref: true });
            component.once('stop', () => {
              if (settled) {
                return;
              }
              settled = true;
              timeout.cancel();
              resolve();
            });
          }).catch(() => undefined);
          component.stop();
          waiters.push(waiter);
          component.removeAllListeners();
        } else if (component instanceof InteractivePrompt) {
          component.removeAllListeners();
        }
      }

      if (waiters.length > 0) {
        await Promise.all(waiters);
      }

      this.activeComponents.clear();
      this.removeAllListeners();
      cleanupContext(this.eventScope);
      DisplayUtils.reset();
      WindowUtils.reset();
      this.layout.dispose();
      setTerminalUIFormatter(createFormatter());
    })();

    try {
      await this.cleanupPromise;
    } finally {
      this.cleanupPromise = null;
    }
  }

  private setupEventHandlers(): void {
    const processEmitter = process as unknown as TypedEventEmitter<TerminalProcessEvents>;

    subscribe(processEmitter, 'SIGINT', this.handleCleanupSignal, { context: this.eventScope });
    subscribe(processEmitter, 'SIGTERM', this.handleCleanupSignal, { context: this.eventScope });
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

interface InteractiveSearchEvents extends TypedEventMap {
  itemsUpdated: (totalItems: number) => void;
  cancel: () => void;
  error: (error: unknown) => void;
  complete: (result: SearchResult) => void;
  searchUpdated: (query: string, totalMatches: number) => void;
}

export class InteractiveSearch extends EventDrivenComponent<InteractiveSearchEvents> {
  private static instanceCounter = 0;
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
    super(`interactive-search:${InteractiveSearch.instanceCounter++}`, 50);
    
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

      const onError = (error: unknown) => {
        this.cleanup();
        reject(error instanceof Error ? error : new Error(String(error)));
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
    clearTerminal();

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
      writeLine(`${title}\n${subtitle}`);
    } else {
      writeLine(`${title} - ${subtitle}`);
    }
    writeLine(this.config.theme.muted('-'.repeat(Math.min(60, process.stdout.columns || 80))));
  }

  private renderSearchInput(_breakpoint: 'small' | 'medium' | 'large'): void {
    const prompt = this.config.theme.accent('Search: ');
    const query = this.currentQuery || this.config.theme.muted('(type to search)');
    const cursor = this.isActive ? this.config.theme.primary('|') : '';
    
    writeLine(`${prompt}${query}${cursor}`);
    writeLine('');
  }

  private renderCategoryFilter(breakpoint: 'small' | 'medium' | 'large'): void {
    if (!this.config.categories) return;
    
    const prefix = this.config.theme.muted('Filter: ');
    const activeCategory = this.activeCategory || 'All';
    const categories = ['All', ...this.config.categories];
    
    if (breakpoint === 'small') {
      writeLine(`${prefix}${this.config.theme.info(activeCategory)} (tab to change)`);
    } else {
      const categoryList = categories.map(cat => 
        cat === activeCategory 
          ? this.config.theme.accent(`[${cat}]`)
          : this.config.theme.muted(cat)
      ).join(' ');
      writeLine(`${prefix}${categoryList}`);
    }
    writeLine('');
  }

  private renderResults(breakpoint: 'small' | 'medium' | 'large', dimensions: TerminalDimensions): void {
    if (this.filteredItems.length === 0) {
      writeLine(this.config.theme.warning('No results found'));
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
      writeLine(this.config.theme.muted(`... and ${remaining} more results`));
    }
  }

  private renderResultItem(result: SearchResult, isSelected: boolean, breakpoint: 'small' | 'medium' | 'large'): void {
    const indicator = isSelected ? '>' : ' ';
    const theme = isSelected ? this.config.theme.accent : this.config.theme.primary;
    
    if (breakpoint === 'small') {
      // Compact format for small screens
      writeLine(`${this.config.theme.primary(indicator)} ${theme(result.highlightedTitle)}`);
      if (result.description) {
        const truncated = this.truncateResultText(result.description, 50, '...');
        writeLine(`  ${this.config.theme.muted(truncated)}`);
      }
    } else {
      // Full format for larger screens
      const category = this.config.theme.muted(`[${result.category}]`);
      const score = this.config.enableFuzzySearch ? 
        this.config.theme.muted(` (${result.score.toFixed(1)})`) : '';
      
      writeLine(`${this.config.theme.primary(indicator)} ${theme(result.highlightedTitle)} ${category}${score}`);
      
      if (result.description) {
        const desc = breakpoint === 'medium'
          ? this.truncateResultText(result.description, 80, '...')
          : result.description;
        writeLine(`  ${this.config.theme.muted(desc)}`);
      }
    }
    
    writeLine('');
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
    
    writeLine(this.config.theme.muted('-'.repeat(Math.min(60, process.stdout.columns || 80))));
    writeLine(this.config.theme.muted(help));
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
    this.layout.dispose();
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
export function createDefaultTerminalUI(
  themeName: keyof typeof DefaultColorThemes = 'default',
  dependencies: {
    formatter?: TerminalFormatter;
    columnsProvider?: () => number | undefined;
    logger?: Logger;
  } = {},
): TerminalUI {
  const theme = DefaultColorThemes[themeName] || DefaultColorThemes.default;
  const formatter = dependencies.formatter ?? createFormatter();
  const columnsProvider = dependencies.columnsProvider ?? (() => (typeof process.stdout?.columns === 'number' ? process.stdout.columns : undefined));
  return createTerminalUI({
    theme,
    formatter,
    columnsProvider,
    responsive: DEFAULT_TERMINAL_UI_CONFIG.responsive,
    logger: dependencies.logger
  });
}

/**
 * Factory function for creating terminal UI instance
 */
export function createTerminalUI(config?: Partial<TerminalUIConfig>): TerminalUI {
  return new TerminalUI(config);
}
