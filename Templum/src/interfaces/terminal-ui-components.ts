/**---
 * title: [Terminal UI Components - Interactive CLI Elements]
 * tags: [Terminal, UI, Progress, Spinner, Interactive, CLI]
 * provides: [ProgressBar, Spinner, InteractivePrompt, ColorTheme, ResponsiveLayout]
 * requires: [chalk, readline, process]
 * description: [Terminal UI components for progress indication, user interaction, and responsive layouts]
 * ---*/

import * as chalk from 'chalk';
import * as readline from 'readline';
import { EventEmitter } from 'events';

// TODO: [TASK-CLI-002] Interactive Search and Filtering implementation will extend these base components
// TODO: [TASK-CLI-003] Advanced Menu Navigation will integrate with these responsive layout components

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
    warning: chalk.rgb(184, 134, 11), // Custom yellow for light theme
    error: chalk.red,
    info: chalk.blue,
    accent: chalk.magenta,
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
  clock: ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛']
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
    this.stop(this.config.theme.success('✓ ' + message));
  }

  fail(message: string): void {
    this.stop(this.config.theme.error('✗ ' + message));
  }

  warn(message: string): void {
    this.stop(this.config.theme.warning('⚠ ' + message));
  }

  info(message: string): void {
    this.stop(this.config.theme.info('ℹ ' + message));
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
        const indicator = index === defaultIndex ? '❯' : ' ';
        const style = index === defaultIndex ? this.config.theme.accent : this.config.theme.muted;
        console.log(`  ${this.config.theme.primary(indicator)} ${style(choice)}`);
      });

      this.setupReadline();
      
      let currentIndex = defaultIndex;
      
      const updateDisplay = () => {
        // Move cursor up to redraw choices
        process.stdout.moveCursor(0, -choices.length);
        
        choices.forEach((choice, index) => {
          const indicator = index === currentIndex ? '❯' : ' ';
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
          const indicator = index === currentIndex ? '❯' : ' ';
          const checkbox = selected[index] ? '◉' : '◯';
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
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).length > width) {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          // Single word longer than width, force break
          lines.push(word.substring(0, width));
          currentLine = word.substring(width);
        }
      } else {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  createTable(data: any[], headers: string[]): string {
    const breakpoint = this.getCurrentBreakpoint();
    const maxWidth = this.currentDimensions.width;
    
    if (breakpoint === 'small') {
      // Compact vertical layout for small screens
      return this.formatCompactTable(data, headers);
    } else {
      // Traditional table layout for medium/large screens
      return this.formatFullTable(data, headers, maxWidth);
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
      const headerWidth = header.length;
      const contentWidth = Math.max(...data.map(row => String(row[header] || '').length));
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
    result += '│' + headers.map((header, i) => 
      ` ${this.config.theme.primary(header.padEnd(colWidths[i]))} `
    ).join('│') + '│\n';
    result += '├' + colWidths.map(w => '─'.repeat(w + 2)).join('┼') + '┤\n';
    
    // Rows
    data.forEach(row => {
      result += '│' + headers.map((header, i) => {
        const value = String(row[header] || '');
        const truncated = value.length > colWidths[i] ? 
          value.substring(0, colWidths[i] - 1) + '…' : value;
        return ` ${truncated.padEnd(colWidths[i])} `;
      }).join('│') + '│\n';
    });
    
    result += '└' + colWidths.map(w => '─'.repeat(w + 2)).join('┴') + '┘\n';
    
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
      theme: this.theme,
      ...config
    });
    
    this.activeComponents.add(progressBar);
    progressBar.on('complete', () => this.activeComponents.delete(progressBar));
    
    return progressBar;
  }

  createSpinner(config?: Partial<SpinnerConfig>): Spinner {
    const spinner = new Spinner({
      theme: this.theme,
      ...config
    });
    
    this.activeComponents.add(spinner);
    spinner.on('stop', () => this.activeComponents.delete(spinner));
    
    return spinner;
  }

  createPrompt(config?: Partial<PromptConfig>): InteractivePrompt {
    const prompt = new InteractivePrompt({
      theme: this.theme,
      ...config
    });
    
    this.activeComponents.add(prompt);
    
    return prompt;
  }

  getLayout(): ResponsiveLayout {
    return this.layout;
  }

  setTheme(theme: TerminalColorTheme): void {
    this.theme = theme;
    this.emit('themeChanged', theme);
  }

  getTheme(): TerminalColorTheme {
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
 * Factory function for creating terminal UI instance
 */
export function createTerminalUI(config?: Partial<TerminalUIConfig>): TerminalUI {
  return new TerminalUI(config);
}