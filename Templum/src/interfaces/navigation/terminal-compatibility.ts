/**
---
date: 2025-09-12T174343Z
name: CLI Navigation Terminal Compatibility
TASK-ID: [TASK-MCP-006]
category: navigation-system
status: ["[T]"]
patterns: [terminal-detection, compatibility-testing, adaptive-rendering]
components: [CompatibilityDetector, FallbackManager, TerminalProbe]
dependencies: [terminal-capabilities, feature-detection]
tags: [cli, navigation, compatibility, cross-platform]
---
 * 
 * Terminal Compatibility Detection System
 * 
 * Provides comprehensive terminal capability detection, compatibility testing,
 * and adaptive fallback management. Ensures the navigation system works
 * consistently across different terminal emulators and platforms.
 * 
 * Generated: 2025-09-12T174343Z
 * TASK-ID: TASK-MCP-006 Pattern: terminal-detection | Complexity: 5 | Dependencies: feature-detection,platform-detection
 * Context: Comprehensive terminal compatibility system for cross-platform navigation
 * Validation-Required: multi-platform-testing, edge-case-handling, performance-impact
 * Pattern-Info: { approach: "comprehensive-detection", alternatives: "basic-environment-check", trade-offs: "accuracy-complexity" }
 */

import { EventEmitter } from 'events';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

// TODO: [TASK-ID-013] Pattern: terminal-detection | Complexity: 4 | Dependencies: platform-specific
// Context: Platform-specific terminal detection and capability probing
// Validation-Required: windows-compatibility, macos-compatibility, linux-distribution-testing
// Pattern-Info: { approach: "multi-platform-detection", alternatives: "single-platform-focus", trade-offs: "coverage-complexity" }

/**
 * Comprehensive terminal capabilities
 */
export interface TerminalCapabilities {
  // Basic properties
  name: string;
  version: string;
  platform: string;
  width: number;
  height: number;
  
  // Color support
  supportsColor: boolean;
  colorDepth: number; // 0, 4, 8, 24 bit
  supportsTrueColor: boolean;
  
  // Character support
  supportsUnicode: boolean;
  supportsBoxDrawing: boolean;
  supportsEmojis: boolean;
  fontSupportsSymbols: boolean;
  
  // Input capabilities
  supportsMouseInput: boolean;
  supportsKeyboardShortcuts: boolean;
  supportsRawMode: boolean;
  
  // Advanced features
  supportsAlternateScreen: boolean;
  supportsCursorControl: boolean;
  supportsScrolling: boolean;
  supportsResizeEvents: boolean;
  
  // Performance characteristics
  renderingSpeed: 'fast' | 'medium' | 'slow';
  refreshRate: number; // Hz, if detectable
  
  // Accessibility
  screenReaderCompatible: boolean;
  highContrastMode: boolean;
  
  // Known issues and limitations
  knownIssues: string[];
  limitations: string[];
  
  // Confidence scores (0-100)
  detectionConfidence: number;
  featureReliability: number;
}

/**
 * Terminal identification result
 */
export interface TerminalIdentification {
  terminalName: string;
  confidence: number;
  detectionMethod: string;
  evidence: string[];
  parentProcess?: string;
  executablePath?: string;
}

/**
 * Feature test result
 */
export interface FeatureTestResult {
  feature: string;
  supported: boolean;
  confidence: number;
  testMethod: string;
  evidence: any;
  fallbackAvailable: boolean;
}

/**
 * Compatibility test suite result
 */
export interface CompatibilityTestResult {
  overall: 'excellent' | 'good' | 'fair' | 'poor' | 'incompatible';
  score: number; // 0-100
  capabilities: TerminalCapabilities;
  tests: FeatureTestResult[];
  recommendations: string[];
  fallbacksRequired: string[];
}

/**
 * Known terminal configurations and their capabilities
 */
export const TERMINAL_PROFILES = new Map<string, Partial<TerminalCapabilities>>([
  ['windows-terminal', {
    name: 'Windows Terminal',
    supportsColor: true,
    colorDepth: 24,
    supportsTrueColor: true,
    supportsUnicode: true,
    supportsBoxDrawing: true,
    supportsEmojis: true,
    supportsMouseInput: true,
    supportsAlternateScreen: true,
    renderingSpeed: 'fast',
    screenReaderCompatible: true
  }],
  ['iterm2', {
    name: 'iTerm2',
    supportsColor: true,
    colorDepth: 24,
    supportsTrueColor: true,
    supportsUnicode: true,
    supportsBoxDrawing: true,
    supportsEmojis: true,
    supportsMouseInput: true,
    supportsAlternateScreen: true,
    renderingSpeed: 'fast',
    screenReaderCompatible: false
  }],
  ['gnome-terminal', {
    name: 'GNOME Terminal',
    supportsColor: true,
    colorDepth: 24,
    supportsTrueColor: true,
    supportsUnicode: true,
    supportsBoxDrawing: true,
    supportsEmojis: true,
    supportsMouseInput: true,
    supportsAlternateScreen: true,
    renderingSpeed: 'medium',
    screenReaderCompatible: true
  }],
  ['cmd', {
    name: 'Command Prompt',
    supportsColor: false,
    colorDepth: 0,
    supportsTrueColor: false,
    supportsUnicode: false,
    supportsBoxDrawing: false,
    supportsEmojis: false,
    supportsMouseInput: false,
    supportsAlternateScreen: false,
    renderingSpeed: 'slow',
    screenReaderCompatible: true,
    knownIssues: ['Poor Unicode support', 'Limited color support', 'No mouse input']
  }],
  ['powershell', {
    name: 'PowerShell',
    supportsColor: true,
    colorDepth: 4,
    supportsTrueColor: false,
    supportsUnicode: true,
    supportsBoxDrawing: true,
    supportsEmojis: false,
    supportsMouseInput: false,
    supportsAlternateScreen: true,
    renderingSpeed: 'medium',
    screenReaderCompatible: true
  }],
  ['vscode-terminal', {
    name: 'VS Code Terminal',
    supportsColor: true,
    colorDepth: 24,
    supportsTrueColor: true,
    supportsUnicode: true,
    supportsBoxDrawing: true,
    supportsEmojis: true,
    supportsMouseInput: true,
    supportsAlternateScreen: true,
    renderingSpeed: 'fast',
    screenReaderCompatible: true
  }],
  ['ssh-terminal', {
    name: 'SSH Terminal',
    supportsColor: true,
    colorDepth: 8,
    supportsTrueColor: false,
    supportsUnicode: true,
    supportsBoxDrawing: true,
    supportsEmojis: false,
    supportsMouseInput: false,
    supportsAlternateScreen: true,
    renderingSpeed: 'slow',
    limitations: ['Network latency affects rendering', 'Limited input support']
  }]
]);

/**
 * Terminal identification patterns
 */
const TERMINAL_IDENTIFICATION_PATTERNS = [
  {
    name: 'windows-terminal',
    patterns: [
      { env: 'WT_SESSION', weight: 100 },
      { env: 'WT_PROFILE_ID', weight: 100 },
      { process: 'WindowsTerminal.exe', weight: 90 }
    ]
  },
  {
    name: 'iterm2',
    patterns: [
      { env: 'TERM_PROGRAM', value: 'iTerm.app', weight: 100 },
      { env: 'ITERM_SESSION_ID', weight: 90 },
      { process: 'iTerm2', weight: 85 }
    ]
  },
  {
    name: 'vscode-terminal',
    patterns: [
      { env: 'TERM_PROGRAM', value: 'vscode', weight: 100 },
      { env: 'VSCODE_INJECTION', weight: 90 },
      { process: 'Code', weight: 80 }
    ]
  },
  {
    name: 'gnome-terminal',
    patterns: [
      { env: 'GNOME_TERMINAL_SERVICE', weight: 100 },
      { env: 'GNOME_TERMINAL_SCREEN', weight: 90 },
      { process: 'gnome-terminal', weight: 85 }
    ]
  },
  {
    name: 'cmd',
    patterns: [
      { process: 'cmd.exe', weight: 90 },
      { env: 'PROMPT', weight: 30 }, // Common but not definitive
      { platform: 'win32', env: 'COMSPEC', weight: 40 }
    ]
  },
  {
    name: 'powershell',
    patterns: [
      { process: 'powershell.exe', weight: 90 },
      { process: 'pwsh.exe', weight: 90 },
      { env: 'PSModulePath', weight: 60 }
    ]
  }
];

/**
 * Terminal capability detector
 */
export class TerminalCapabilityDetector extends EventEmitter {
  private cachedCapabilities: TerminalCapabilities | null = null;
  private detectionResults: Map<string, FeatureTestResult> = new Map();
  
  /**
   * Detect comprehensive terminal capabilities
   */
  async detectCapabilities(forceRefresh = false): Promise<TerminalCapabilities> {
    if (this.cachedCapabilities && !forceRefresh) {
      return this.cachedCapabilities;
    }

    this.emit('detectionStarted');

    try {
      // Basic terminal identification
      const identification = await this.identifyTerminal();
      
      // Get base capabilities from known profiles
      const baseCapabilities = this.getBaseCapabilities(identification.terminalName);
      
      // Perform feature tests
      const featureTests = await this.runFeatureTests();
      
      // Combine results
      const capabilities = this.combineCapabilities(
        baseCapabilities,
        featureTests,
        identification
      );

      this.cachedCapabilities = capabilities;
      this.emit('detectionCompleted', capabilities);
      
      return capabilities;
    } catch (error) {
      this.emit('detectionError', error);
      
      // Return minimal safe capabilities
      return this.getFallbackCapabilities();
    }
  }

  /**
   * Identify the current terminal
   */
  private async identifyTerminal(): Promise<TerminalIdentification> {
    const results: Array<{ name: string; score: number; evidence: string[] }> = [];
    
    for (const pattern of TERMINAL_IDENTIFICATION_PATTERNS) {
      let score = 0;
      const evidence: string[] = [];
      
      for (const test of pattern.patterns) {
        if (test.env && process.env[test.env]) {
          if ('value' in test && test.value) {
            if (process.env[test.env] === test.value) {
              score += test.weight;
              evidence.push(`Environment: ${test.env}=${test.value}`);
            }
          } else {
            score += test.weight;
            evidence.push(`Environment: ${test.env}=${process.env[test.env]}`);
          }
        }
        
        if ('platform' in test && test.platform && test.platform === process.platform) {
          score += test.weight;
          evidence.push(`Platform: ${test.platform}`);
        }
        
        if ('process' in test && test.process) {
          const processInfo = await this.getProcessInfo();
          if (processInfo.some(proc => proc.includes(test.process!))) {
            score += test.weight;
            evidence.push(`Process: ${test.process}`);
          }
        }
      }
      
      if (score > 0) {
        results.push({ name: pattern.name, score, evidence });
      }
    }

    // Find best match
    const bestMatch = results.reduce((best, current) => 
      current.score > best.score ? current : best,
      { name: 'unknown', score: 0, evidence: [] }
    );

    return {
      terminalName: bestMatch.name,
      confidence: Math.min(100, bestMatch.score),
      detectionMethod: 'pattern-matching',
      evidence: bestMatch.evidence
    };
  }

  /**
   * Get process information for terminal detection
   */
  private async getProcessInfo(): Promise<string[]> {
    try {
      // This is a simplified version - in reality, you'd use platform-specific methods
      const processes: string[] = [];
      
      if (process.platform === 'win32') {
        // On Windows, check parent processes
        processes.push(process.env.COMSPEC || 'cmd.exe');
      } else {
        // On Unix-like systems, check parent process
        try {
          const ppid = process.ppid;
          if (ppid) {
            // Read process info from /proc (Linux) or use ps command
            processes.push(`pid:${ppid}`);
          }
        } catch (error) {
          // Fallback handling
        }
      }
      
      return processes;
    } catch (error) {
      return [];
    }
  }

  /**
   * Run comprehensive feature tests
   */
  private async runFeatureTests(): Promise<FeatureTestResult[]> {
    const tests: FeatureTestResult[] = [];

    // Color support test
    tests.push(await this.testColorSupport());
    
    // Unicode support test
    tests.push(await this.testUnicodeSupport());
    
    // Box drawing support test
    tests.push(await this.testBoxDrawingSupport());
    
    // Mouse input test
    tests.push(await this.testMouseSupport());
    
    // Resize events test
    tests.push(await this.testResizeSupport());
    
    // Cursor control test
    tests.push(await this.testCursorControl());

    return tests;
  }

  /**
   * Test color support capabilities
   */
  private async testColorSupport(): Promise<FeatureTestResult> {
    let colorDepth = 0;
    let supportsColor = false;
    let supportsTrueColor = false;
    
    // Check environment variables
    const colorTerm = process.env.COLORTERM;
    const term = process.env.TERM || '';
    
    if (colorTerm === 'truecolor' || colorTerm === '24bit') {
      supportsTrueColor = true;
      colorDepth = 24;
      supportsColor = true;
    } else if (term.includes('256color')) {
      colorDepth = 8;
      supportsColor = true;
    } else if (term.includes('color')) {
      colorDepth = 4;
      supportsColor = true;
    }
    
    // Check for NO_COLOR environment variable
    if (process.env.NO_COLOR) {
      supportsColor = false;
      colorDepth = 0;
    }

    return {
      feature: 'color-support',
      supported: supportsColor,
      confidence: 85,
      testMethod: 'environment-variable-check',
      evidence: {
        colorDepth,
        supportsTrueColor,
        COLORTERM: colorTerm,
        TERM: term,
        NO_COLOR: !!process.env.NO_COLOR
      },
      fallbackAvailable: true
    };
  }

  /**
   * Test Unicode support
   */
  private async testUnicodeSupport(): Promise<FeatureTestResult> {
    const lang = process.env.LANG || process.env.LC_ALL || '';
    const supportsUnicode = lang.includes('UTF-8') || lang.includes('utf8') ||
                          process.platform === 'darwin' || // macOS defaults to UTF-8
                          !!process.env.WT_SESSION; // Windows Terminal

    return {
      feature: 'unicode-support',
      supported: supportsUnicode,
      confidence: 80,
      testMethod: 'locale-detection',
      evidence: {
        LANG: process.env.LANG,
        LC_ALL: process.env.LC_ALL,
        platform: process.platform,
        windowsTerminal: !!process.env.WT_SESSION
      },
      fallbackAvailable: true
    };
  }

  /**
   * Test box drawing character support
   */
  private async testBoxDrawingSupport(): Promise<FeatureTestResult> {
    // Box drawing support usually correlates with Unicode support
    const unicodeTest = await this.testUnicodeSupport();
    const supportsBoxDrawing = unicodeTest.supported && 
                              process.platform !== 'win32' || 
                              !!process.env.WT_SESSION;

    return {
      feature: 'box-drawing-support',
      supported: supportsBoxDrawing,
      confidence: 75,
      testMethod: 'unicode-correlation',
      evidence: {
        unicodeSupported: unicodeTest.supported,
        platform: process.platform,
        windowsTerminal: !!process.env.WT_SESSION
      },
      fallbackAvailable: true
    };
  }

  /**
   * Test mouse input support
   */
  private async testMouseSupport(): Promise<FeatureTestResult> {
    const term = process.env.TERM || '';
    const supportsMouseInput = term.includes('xterm') ||
                              !!process.env.WT_SESSION ||
                              process.env.TERM_PROGRAM === 'iTerm.app' ||
                              process.env.TERM_PROGRAM === 'vscode';

    return {
      feature: 'mouse-support',
      supported: supportsMouseInput,
      confidence: 70,
      testMethod: 'terminal-type-detection',
      evidence: {
        TERM: term,
        TERM_PROGRAM: process.env.TERM_PROGRAM,
        windowsTerminal: !!process.env.WT_SESSION
      },
      fallbackAvailable: false
    };
  }

  /**
   * Test resize event support
   */
  private async testResizeSupport(): Promise<FeatureTestResult> {
    const supportsResize = typeof process.stdout.on === 'function' &&
                          process.stdout.isTTY === true;

    return {
      feature: 'resize-support',
      supported: supportsResize,
      confidence: 95,
      testMethod: 'runtime-capability-check',
      evidence: {
        isTTY: process.stdout.isTTY,
        hasEventSupport: typeof process.stdout.on === 'function'
      },
      fallbackAvailable: false
    };
  }

  /**
   * Test cursor control capabilities
   */
  private async testCursorControl(): Promise<FeatureTestResult> {
    const supportsCursorControl = process.stdout.isTTY === true;

    return {
      feature: 'cursor-control',
      supported: supportsCursorControl,
      confidence: 90,
      testMethod: 'tty-check',
      evidence: {
        isTTY: process.stdout.isTTY
      },
      fallbackAvailable: false
    };
  }

  /**
   * Get base capabilities from known terminal profile
   */
  private getBaseCapabilities(terminalName: string): Partial<TerminalCapabilities> {
    const profile = TERMINAL_PROFILES.get(terminalName);
    
    if (profile) {
      return { ...profile };
    }

    // Return generic capabilities for unknown terminals
    return {
      name: 'Unknown Terminal',
      supportsColor: true,
      colorDepth: 8,
      supportsTrueColor: false,
      supportsUnicode: false,
      supportsBoxDrawing: false,
      supportsEmojis: false,
      supportsMouseInput: false,
      renderingSpeed: 'medium',
      screenReaderCompatible: false,
      detectionConfidence: 30
    };
  }

  /**
   * Combine base capabilities with test results
   */
  private combineCapabilities(
    baseCapabilities: Partial<TerminalCapabilities>,
    featureTests: FeatureTestResult[],
    identification: TerminalIdentification
  ): TerminalCapabilities {
    const capabilities: TerminalCapabilities = {
      name: baseCapabilities.name || 'Unknown Terminal',
      version: baseCapabilities.version || 'unknown',
      platform: process.platform,
      width: process.stdout.columns || 80,
      height: process.stdout.rows || 24,
      
      // Default values
      supportsColor: false,
      colorDepth: 0,
      supportsTrueColor: false,
      supportsUnicode: false,
      supportsBoxDrawing: false,
      supportsEmojis: false,
      fontSupportsSymbols: false,
      supportsMouseInput: false,
      supportsKeyboardShortcuts: true,
      supportsRawMode: process.stdin.isTTY === true,
      supportsAlternateScreen: false,
      supportsCursorControl: false,
      supportsScrolling: true,
      supportsResizeEvents: false,
      renderingSpeed: 'medium',
      refreshRate: 60,
      screenReaderCompatible: false,
      highContrastMode: false,
      knownIssues: [],
      limitations: [],
      detectionConfidence: identification.confidence,
      featureReliability: 85,
      
      // Override with base capabilities
      ...baseCapabilities
    };

    // Apply test results
    for (const test of featureTests) {
      switch (test.feature) {
        case 'color-support':
          capabilities.supportsColor = test.supported;
          capabilities.colorDepth = test.evidence.colorDepth || 0;
          capabilities.supportsTrueColor = test.evidence.supportsTrueColor || false;
          break;
          
        case 'unicode-support':
          capabilities.supportsUnicode = test.supported;
          break;
          
        case 'box-drawing-support':
          capabilities.supportsBoxDrawing = test.supported;
          break;
          
        case 'mouse-support':
          capabilities.supportsMouseInput = test.supported;
          break;
          
        case 'resize-support':
          capabilities.supportsResizeEvents = test.supported;
          break;
          
        case 'cursor-control':
          capabilities.supportsCursorControl = test.supported;
          break;
      }
    }

    // Derive additional capabilities
    capabilities.supportsEmojis = capabilities.supportsUnicode && 
                                 capabilities.fontSupportsSymbols;
    
    capabilities.supportsAlternateScreen = capabilities.supportsCursorControl;

    return capabilities;
  }

  /**
   * Get fallback capabilities for error cases
   */
  private getFallbackCapabilities(): TerminalCapabilities {
    return {
      name: 'Fallback Terminal',
      version: 'unknown',
      platform: process.platform,
      width: 80,
      height: 24,
      supportsColor: false,
      colorDepth: 0,
      supportsTrueColor: false,
      supportsUnicode: false,
      supportsBoxDrawing: false,
      supportsEmojis: false,
      fontSupportsSymbols: false,
      supportsMouseInput: false,
      supportsKeyboardShortcuts: true,
      supportsRawMode: false,
      supportsAlternateScreen: false,
      supportsCursorControl: false,
      supportsScrolling: true,
      supportsResizeEvents: false,
      renderingSpeed: 'slow',
      refreshRate: 30,
      screenReaderCompatible: true,
      highContrastMode: false,
      knownIssues: ['Capabilities could not be detected'],
      limitations: ['Using minimal safe feature set'],
      detectionConfidence: 0,
      featureReliability: 50
    };
  }

  /**
   * Clear cached capabilities
   */
  clearCache(): void {
    this.cachedCapabilities = null;
    this.detectionResults.clear();
  }

  /**
   * Get detailed test results
   */
  getTestResults(): Map<string, FeatureTestResult> {
    return new Map(this.detectionResults);
  }
}

/**
 * Fallback management system
 */
export class FallbackManager {
  private capabilities: TerminalCapabilities;
  private fallbackStrategies = new Map<string, () => any>();

  constructor(capabilities: TerminalCapabilities) {
    this.capabilities = capabilities;
    this.setupDefaultFallbacks();
  }

  /**
   * Setup default fallback strategies
   */
  private setupDefaultFallbacks(): void {
    // Unicode fallbacks
    this.fallbackStrategies.set('unicode', () => ({
      useAscii: true,
      replacements: {
        '›': '>',
        '┌': '+',
        '┐': '+',
        '└': '+',
        '┘': '+',
        '─': '-',
        '│': '|'
      }
    }));

    // Color fallbacks
    this.fallbackStrategies.set('color', () => ({
      useMonochrome: true,
      emphasizeWithCaps: true,
      useSymbols: false
    }));

    // Box drawing fallbacks
    this.fallbackStrategies.set('box-drawing', () => ({
      useAsciiArt: true,
      simplifiedBorders: true,
      textOnlyMode: false
    }));

    // Mouse input fallbacks
    this.fallbackStrategies.set('mouse', () => ({
      useKeyboardOnly: true,
      showInstructions: true,
      enhancedKeyboardShortcuts: true
    }));
  }

  /**
   * Get appropriate fallback for feature
   */
  getFallback(feature: string): any {
    const strategy = this.fallbackStrategies.get(feature);
    return strategy ? strategy() : null;
  }

  /**
   * Check if fallback is needed for feature
   */
  needsFallback(feature: string): boolean {
    switch (feature) {
      case 'unicode':
        return !this.capabilities.supportsUnicode;
      case 'color':
        return !this.capabilities.supportsColor;
      case 'box-drawing':
        return !this.capabilities.supportsBoxDrawing;
      case 'mouse':
        return !this.capabilities.supportsMouseInput;
      default:
        return false;
    }
  }

  /**
   * Get all required fallbacks
   */
  getAllRequiredFallbacks(): Map<string, any> {
    const required = new Map<string, any>();
    
    this.fallbackStrategies.forEach((strategy, feature) => {
      if (this.needsFallback(feature)) {
        required.set(feature, this.getFallback(feature));
      }
    });
    
    return required;
  }

  /**
   * Add custom fallback strategy
   */
  addFallbackStrategy(feature: string, strategy: () => any): void {
    this.fallbackStrategies.set(feature, strategy);
  }

  /**
   * Remove fallback strategy
   */
  removeFallbackStrategy(feature: string): boolean {
    return this.fallbackStrategies.delete(feature);
  }
}

/**
 * Complete terminal compatibility system
 */
export class TerminalCompatibilitySystem extends EventEmitter {
  private detector: TerminalCapabilityDetector;
  private fallbackManager: FallbackManager | null = null;
  private capabilities: TerminalCapabilities | null = null;

  constructor() {
    super();
    this.detector = new TerminalCapabilityDetector();
    
    // Forward detector events
    this.detector.on('detectionStarted', () => this.emit('detectionStarted'));
    this.detector.on('detectionCompleted', (caps) => {
      this.capabilities = caps;
      this.fallbackManager = new FallbackManager(caps);
      this.emit('detectionCompleted', caps);
    });
    this.detector.on('detectionError', (error) => this.emit('detectionError', error));
  }

  /**
   * Initialize compatibility system
   */
  async initialize(forceRefresh = false): Promise<CompatibilityTestResult> {
    const capabilities = await this.detector.detectCapabilities(forceRefresh);
    const testResult = this.evaluateCompatibility(capabilities);
    
    this.emit('initialized', testResult);
    return testResult;
  }

  /**
   * Evaluate overall compatibility
   */
  private evaluateCompatibility(capabilities: TerminalCapabilities): CompatibilityTestResult {
    let score = 0;
    const maxScore = 100;
    const recommendations: string[] = [];
    const fallbacksRequired: string[] = [];

    // Color support (20 points)
    if (capabilities.supportsTrueColor) {
      score += 20;
    } else if (capabilities.supportsColor) {
      score += 15;
    } else {
      score += 5;
      recommendations.push('Consider using a terminal with color support');
      fallbacksRequired.push('color');
    }

    // Unicode support (25 points)
    if (capabilities.supportsUnicode && capabilities.supportsBoxDrawing) {
      score += 25;
    } else if (capabilities.supportsUnicode) {
      score += 15;
      fallbacksRequired.push('box-drawing');
    } else {
      score += 5;
      recommendations.push('Enable UTF-8 support for better display');
      fallbacksRequired.push('unicode', 'box-drawing');
    }

    // Input capabilities (15 points)
    if (capabilities.supportsMouseInput) {
      score += 15;
    } else {
      score += 10;
      fallbacksRequired.push('mouse');
    }

    // Advanced features (20 points)
    if (capabilities.supportsAlternateScreen) score += 5;
    if (capabilities.supportsCursorControl) score += 5;
    if (capabilities.supportsResizeEvents) score += 5;
    if (capabilities.renderingSpeed === 'fast') score += 5;

    // Reliability (10 points)
    score += Math.round(capabilities.detectionConfidence / 10);

    // Accessibility (10 points)
    if (capabilities.screenReaderCompatible) {
      score += 10;
    } else {
      score += 5;
      recommendations.push('Consider accessibility features');
    }

    // Determine overall rating
    let overall: CompatibilityTestResult['overall'];
    if (score >= 85) overall = 'excellent';
    else if (score >= 70) overall = 'good';
    else if (score >= 50) overall = 'fair';
    else if (score >= 30) overall = 'poor';
    else overall = 'incompatible';

    return {
      overall,
      score: Math.min(maxScore, score),
      capabilities,
      tests: Array.from(this.detector.getTestResults().values()),
      recommendations,
      fallbacksRequired
    };
  }

  /**
   * Get current capabilities
   */
  getCapabilities(): TerminalCapabilities | null {
    return this.capabilities;
  }

  /**
   * Get fallback manager
   */
  getFallbackManager(): FallbackManager | null {
    return this.fallbackManager;
  }

  /**
   * Check if specific feature is supported
   */
  isFeatureSupported(feature: string): boolean {
    if (!this.capabilities) return false;

    switch (feature) {
      case 'color': return this.capabilities.supportsColor;
      case 'unicode': return this.capabilities.supportsUnicode;
      case 'box-drawing': return this.capabilities.supportsBoxDrawing;
      case 'mouse': return this.capabilities.supportsMouseInput;
      case 'emoji': return this.capabilities.supportsEmojis;
      default: return false;
    }
  }

  /**
   * Get appropriate configuration for current terminal
   */
  getOptimalConfiguration(): any {
    if (!this.capabilities) return {};

    return {
      useUnicode: this.capabilities.supportsUnicode,
      useColors: this.capabilities.supportsColor,
      colorDepth: this.capabilities.colorDepth,
      enableMouse: this.capabilities.supportsMouseInput,
      enableBoxDrawing: this.capabilities.supportsBoxDrawing,
      renderingMode: this.capabilities.renderingSpeed,
      accessibilityMode: !this.capabilities.supportsUnicode || 
                        this.capabilities.screenReaderCompatible,
      fallbacks: this.fallbackManager?.getAllRequiredFallbacks() || new Map()
    };
  }

  /**
   * Refresh capabilities (useful after terminal changes)
   */
  async refresh(): Promise<CompatibilityTestResult> {
    this.detector.clearCache();
    return this.initialize(true);
  }
}

/**
 * Factory function for creating compatibility system
 */
export function createTerminalCompatibilitySystem(): TerminalCompatibilitySystem {
  return new TerminalCompatibilitySystem();
}

/**
 * Quick compatibility check utility
 */
export async function checkTerminalCompatibility(): Promise<CompatibilityTestResult> {
  const system = new TerminalCompatibilitySystem();
  return system.initialize();
}

/**
 * Utility function to get safe terminal configuration
 */
export async function getSafeTerminalConfig(): Promise<any> {
  const system = new TerminalCompatibilitySystem();
  await system.initialize();
  return system.getOptimalConfiguration();
}
