/**
---
date: 2025-09-12T174343Z
name: terminal-compatibility-detector
TASK-ID: [TASK-MCP-006]
category: cli-enhancement
status: [T]
patterns: [progressive-enhancement, terminal-detection, compatibility-fallback]
components: [terminal-compatibility-detector]
dependencies: [chalk, process.stdout, readline]
tags: [terminal-ui, compatibility, progressive-enhancement, border-rendering]
---
 * 
 * Terminal Compatibility Detector
 * 
 * Detects terminal capabilities for progressive enhancement of UI features.
 * Provides fallback detection for box-drawing characters, Unicode support,
 * and color depth to enable graceful degradation.
 * 
 * TASK-MCP-006: Structured window system with progressive enhancement
 */

import chalk from 'chalk';
import { EventEmitter } from 'events';

export interface TerminalCapabilities {
  supportsBoxDrawing: boolean;
  supportsUnicode: boolean;
  supportsColors: boolean;
  supportsAnsi: boolean;
  colorDepth: 1 | 4 | 8 | 24;
  width: number;
  height: number;
  terminalType: string;
  platform: string;
}

export interface BorderCharacterSet {
  horizontal: string;
  vertical: string;
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  cross: string;
  teeUp: string;
  teeDown: string;
  teeLeft: string;
  teeRight: string;
}

export const BORDER_SETS = {
  unicode: {
    horizontal: '─',
    vertical: '│',
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    cross: '┼',
    teeUp: '┴',
    teeDown: '┬',
    teeLeft: '┤',
    teeRight: '├'
  },
  ascii: {
    horizontal: '-',
    vertical: '|',
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    cross: '+',
    teeUp: '+',
    teeDown: '+',
    teeLeft: '+',
    teeRight: '+'
  },
  simple: {
    horizontal: '=',
    vertical: '|',
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    cross: '+',
    teeUp: '+',
    teeDown: '+',
    teeLeft: '+',
    teeRight: '+'
  }
} as const;

export type BorderSetType = keyof typeof BORDER_SETS;

export class TerminalCompatibilityDetector extends EventEmitter {
  private capabilities: TerminalCapabilities | null = null;
  private detectionCompleted: boolean = false;
  
  constructor() {
    super();
  }

  /**
   * Detect terminal capabilities
   */
  async detectCapabilities(): Promise<TerminalCapabilities> {
    if (this.capabilities && this.detectionCompleted) {
      return this.capabilities;
    }

    const capabilities: TerminalCapabilities = {
      supportsBoxDrawing: false,
      supportsUnicode: false,
      supportsColors: false,
      supportsAnsi: false,
      colorDepth: 1,
      width: process.stdout.columns || 80,
      height: process.stdout.rows || 24,
      terminalType: process.env.TERM || 'unknown',
      platform: process.platform
    };

    // Detect ANSI support
    capabilities.supportsAnsi = this.detectAnsiSupport();
    
    // Detect color support
    capabilities.supportsColors = this.detectColorSupport();
    capabilities.colorDepth = this.detectColorDepth();
    
    // Detect Unicode support
    capabilities.supportsUnicode = await this.detectUnicodeSupport();
    
    // Detect box-drawing character support
    capabilities.supportsBoxDrawing = await this.detectBoxDrawingSupport();

    this.capabilities = capabilities;
    this.detectionCompleted = true;
    
    this.emit('detected', capabilities);
    return capabilities;
  }

  /**
   * Get optimal border character set based on capabilities
   */
  async getOptimalBorderSet(): Promise<BorderCharacterSet> {
    const capabilities = await this.detectCapabilities();
    
    if (capabilities.supportsBoxDrawing && capabilities.supportsUnicode) {
      return BORDER_SETS.unicode;
    } else if (capabilities.supportsAnsi) {
      return BORDER_SETS.ascii;
    } else {
      return BORDER_SETS.simple;
    }
  }

  /**
   * Get border set by type with fallback
   */
  async getBorderSet(preferredType: BorderSetType = 'unicode'): Promise<BorderCharacterSet> {
    const capabilities = await this.detectCapabilities();
    
    switch (preferredType) {
      case 'unicode':
        if (capabilities.supportsBoxDrawing && capabilities.supportsUnicode) {
          return BORDER_SETS.unicode;
        }
        // Fallback to ascii
        return BORDER_SETS.ascii;
      
      case 'ascii':
        if (capabilities.supportsAnsi) {
          return BORDER_SETS.ascii;
        }
        // Fallback to simple
        return BORDER_SETS.simple;
      
      case 'simple':
      default:
        return BORDER_SETS.simple;
    }
  }

  /**
   * Test if terminal supports box drawing by attempting to render
   */
  private async detectBoxDrawingSupport(): Promise<boolean> {
    // Check environment variables first
    const term = process.env.TERM?.toLowerCase() || '';
    const termProgram = process.env.TERM_PROGRAM?.toLowerCase() || '';
    
    // Known terminals that support box drawing
    const supportedTerminals = [
      'xterm', 'xterm-256color', 'screen', 'tmux',
      'alacritty', 'kitty', 'gnome-terminal', 'konsole',
      'iterm', 'hyper', 'wezterm'
    ];
    
    const supportedPrograms = [
      'vscode', 'iterm.app', 'hyper', 'alacritty', 'kitty'
    ];
    
    // Check for known good terminals
    if (supportedTerminals.some(t => term.includes(t)) || 
        supportedPrograms.some(p => termProgram.includes(p))) {
      return true;
    }
    
    // Check for known bad terminals
    const unsupportedTerminals = ['dumb', 'cons25', 'emacs'];
    if (unsupportedTerminals.some(t => term.includes(t))) {
      return false;
    }
    
    // For Windows Command Prompt, check if we're in a modern terminal
    if (process.platform === 'win32') {
      // Windows Terminal and newer PowerShell support Unicode
      if (termProgram === 'windows terminal' || process.env.WT_SESSION) {
        return true;
      }
      
      // Traditional cmd.exe typically doesn't support box drawing well
      if (term === '' || term === 'dumb') {
        return false;
      }
    }
    
    // Default to assuming support if we can't determine
    return true;
  }

  /**
   * Test Unicode support
   */
  private async detectUnicodeSupport(): Promise<boolean> {
    // Check locale settings
    const locale = process.env.LC_ALL || process.env.LANG || '';
    if (locale.includes('UTF-8') || locale.includes('utf8')) {
      return true;
    }
    
    // Check if stdout supports Unicode
    if (process.stdout.isTTY) {
      const encoding = (process.stdout as any)._writableState?.encoding;
      if (encoding === 'utf8' || encoding === 'utf-8') {
        return true;
      }
    }
    
    // Platform-specific checks
    if (process.platform === 'win32') {
      // Modern Windows typically supports Unicode in newer terminals
      return !!process.env.WT_SESSION || process.env.TERM_PROGRAM === 'vscode';
    }
    
    // Unix-like systems typically support Unicode
    return true;
  }

  /**
   * Detect ANSI escape sequence support
   */
  private detectAnsiSupport(): boolean {
    return process.stdout.isTTY !== false && process.env.TERM !== 'dumb';
  }

  /**
   * Detect color support
   */
  private detectColorSupport(): boolean {
    return chalk.supportsColor !== false;
  }

  /**
   * Detect color depth
   */
  private detectColorDepth(): 1 | 4 | 8 | 24 {
    if (!chalk.supportsColor) {
      return 1;
    }
    
    const level = chalk.supportsColor.level;
    switch (level) {
      case 3: return 24; // 16 million colors
      case 2: return 8;  // 256 colors  
      case 1: return 4;  // 16 colors
      default: return 1; // No color
    }
  }

  /**
   * Get capabilities (cached after first detection)
   */
  getCapabilities(): TerminalCapabilities | null {
    return this.capabilities;
  }

  /**
   * Force re-detection of capabilities
   */
  async refresh(): Promise<TerminalCapabilities> {
    this.capabilities = null;
    this.detectionCompleted = false;
    return this.detectCapabilities();
  }

  /**
   * Get terminal compatibility summary
   */
  async getCompatibilitySummary(): Promise<string> {
    const capabilities = await this.detectCapabilities();
    const borderSet = await getOptimalBorderSet();
    
    return `Terminal Compatibility:
  Type: ${capabilities.terminalType}
  Platform: ${capabilities.platform}  
  Dimensions: ${capabilities.width}x${capabilities.height}
  ANSI Support: ${capabilities.supportsAnsi ? 'Yes' : 'No'}
  Color Support: ${capabilities.supportsColors ? `Yes (${capabilities.colorDepth}-bit)` : 'No'}
  Unicode Support: ${capabilities.supportsUnicode ? 'Yes' : 'No'}
  Box Drawing: ${capabilities.supportsBoxDrawing ? 'Yes' : 'No'}
  Border Set: ${borderSet === BORDER_SETS.unicode ? 'Unicode' : borderSet === BORDER_SETS.ascii ? 'ASCII' : 'Simple'}`;
  }
}

// Export singleton instance
export const terminalCompatibility = new TerminalCompatibilityDetector();

/**
 * Quick access function for getting optimal border set
 */
export async function getOptimalBorderSet(): Promise<BorderCharacterSet> {
  return terminalCompatibility.getOptimalBorderSet();
}

/**
 * Quick access function for getting terminal capabilities
 */
export async function getTerminalCapabilities(): Promise<TerminalCapabilities> {
  return terminalCompatibility.detectCapabilities();
}
