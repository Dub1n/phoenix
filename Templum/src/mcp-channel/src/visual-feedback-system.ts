/**
 * @fileoverview Visual Feedback System for MCP Integration
 * 
 * date: 2025-09-13T103229Z
 * name: visual-feedback-system
 * TASK-ID: ["TASK-MCP-009"]
 * category: mcp-visual-feedback
 * status: ["[~]"]
 * patterns: ["real-time-feedback", "visual-status-indicators", "progressive-display"]
 * components: ["visual-feedback-system", "real-time-monitors", "status-indicators"]
 * dependencies: ["chalk", "cli-cursor", "terminal-kit"]
 * tags: ["mcp-integration", "visual-feedback", "real-time-monitoring"]
 * 
 * Implements comprehensive visual feedback loops for MCP integration with:
 * - Real-time status indicators
 * - Visual timeout adaptation displays
 * - Circuit breaker status visualization
 * - Color-coded health monitoring
 * - Progressive feedback for operations
 * 
 * @author VDL Vault Execution Agent
 * @since 2025-09-13
 */

import chalk from 'chalk';
import { HealthStatus, HealthCheckResult } from './health-monitor';
import { ProgressiveTimeoutManager } from './progressive-timeout-manager';

export interface VisualFeedbackConfig {
  enableColors: boolean;
  enableProgressBars: boolean;
  refreshRate: number;
  verbosityLevel: 'minimal' | 'standard' | 'detailed' | 'debug';
  displayWidth: number;
}

export interface StatusIndicator {
  status: 'success' | 'warning' | 'error' | 'info' | 'progress';
  message: string;
  details?: string;
  timestamp: number;
  category: string;
}

export interface ProgressBar {
  current: number;
  total: number;
  label: string;
  showPercentage: boolean;
}

export interface VisualDashboard {
  title: string;
  sections: VisualSection[];
  refreshRate: number;
  isActive: boolean;
}

export interface VisualSection {
  title: string;
  type: 'status' | 'metrics' | 'progress' | 'health' | 'logs';
  content: any;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Visual Feedback System
 * 
 * Provides comprehensive visual feedback for MCP integration including:
 * - Real-time status indicators with color coding
 * - Progress visualization for operations
 * - Health monitoring dashboards
 * - Visual error handling and recovery indicators
 */
export class VisualFeedbackSystem {
  private config: VisualFeedbackConfig;
  private indicators: StatusIndicator[];
  private maxIndicators: number = 50;
  private dashboard: VisualDashboard | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private currentLine: number = 0;
  private terminalWidth: number;

  constructor(config?: Partial<VisualFeedbackConfig>) {
    this.config = {
      enableColors: true,
      enableProgressBars: true,
      refreshRate: 1000, // 1 second
      verbosityLevel: 'standard',
      displayWidth: 80,
      ...config
    };

    this.indicators = [];
    this.terminalWidth = process.stdout.columns || this.config.displayWidth;

    // Initialize terminal settings
    this.initializeTerminal();
  }

  /**
   * Initialize terminal settings for visual feedback
   */
  private initializeTerminal(): void {
    // TODO: [TASK-MCP-009-VISUAL-001] Pattern: terminal-initialization | Complexity: 3 | Dependencies: terminal-kit,chalk
    // Context: Initialize terminal for optimal visual feedback display with color support
    // Validation-Required: terminal-compatibility, color-support, display-optimization
    // Pattern-Info: { approach: "terminal-detection", alternatives: "static-config,auto-detection", trade-offs: "compatibility-vs-features" }
    
    if (this.config.enableColors) {
      // Enable color support detection
      process.env.FORCE_COLOR = '1';
    }

    // Handle terminal resize events
    process.stdout.on('resize', () => {
      this.terminalWidth = process.stdout.columns || this.config.displayWidth;
      this.refreshDashboard();
    });
  }

  /**
   * Add status indicator with visual feedback
   */
  addIndicator(indicator: Omit<StatusIndicator, 'timestamp'>): void {
    const fullIndicator: StatusIndicator = {
      ...indicator,
      timestamp: Date.now()
    };

    this.indicators.push(fullIndicator);

    // Maintain max indicators limit
    if (this.indicators.length > this.maxIndicators) {
      this.indicators.shift();
    }

    // Display indicator immediately
    this.displayIndicator(fullIndicator);

    // Update dashboard if active
    if (this.dashboard?.isActive) {
      this.updateDashboardSection('logs', this.getRecentIndicators(10));
    }
  }

  /**
   * Display individual status indicator
   */
  private displayIndicator(indicator: StatusIndicator): void {
    if (this.config.verbosityLevel === 'minimal' && indicator.status === 'info') {
      return; // Skip info messages in minimal mode
    }

    const timestamp = new Date(indicator.timestamp).toISOString().substr(11, 12);
    let coloredStatus: string;
    let icon: string;

    // Color and icon based on status
    switch (indicator.status) {
      case 'success':
        coloredStatus = this.config.enableColors ? chalk.green('SUCCESS') : 'SUCCESS';
        icon = '✓';
        break;
      case 'warning':
        coloredStatus = this.config.enableColors ? chalk.yellow('WARNING') : 'WARNING';
        icon = '⚠';
        break;
      case 'error':
        coloredStatus = this.config.enableColors ? chalk.red('ERROR') : 'ERROR';
        icon = '✗';
        break;
      case 'progress':
        coloredStatus = this.config.enableColors ? chalk.blue('PROGRESS') : 'PROGRESS';
        icon = '⏳';
        break;
      default:
        coloredStatus = this.config.enableColors ? chalk.cyan('INFO') : 'INFO';
        icon = 'ℹ';
    }

    const categoryColor = this.config.enableColors ? chalk.magenta(indicator.category) : indicator.category;
    const message = `${timestamp} ${icon} ${coloredStatus} [${categoryColor}] ${indicator.message}`;

    console.log(message);

    // Show details in detailed/debug mode
    if (indicator.details && (this.config.verbosityLevel === 'detailed' || this.config.verbosityLevel === 'debug')) {
      const detailsColor = this.config.enableColors ? chalk.gray(indicator.details) : indicator.details;
      console.log(`   └─ ${detailsColor}`);
    }
  }

  /**
   * Show progress bar with visual feedback
   */
  showProgress(progress: ProgressBar): void {
    if (!this.config.enableProgressBars) {
      return;
    }

    const percentage = Math.round((progress.current / progress.total) * 100);
    const completed = Math.round((progress.current / progress.total) * 30); // 30 char width
    const remaining = 30 - completed;

    let bar = '█'.repeat(completed) + '░'.repeat(remaining);
    
    if (this.config.enableColors) {
      const completedColor = percentage >= 100 ? chalk.green : chalk.blue;
      bar = completedColor('█'.repeat(completed)) + chalk.gray('░'.repeat(remaining));
    }

    const progressText = progress.showPercentage ? ` ${percentage}%` : '';
    const message = `${progress.label}: [${bar}]${progressText} (${progress.current}/${progress.total})`;

    // Use carriage return to update same line
    process.stdout.write(`\r${message}`);

    // Move to next line when complete
    if (progress.current >= progress.total) {
      process.stdout.write('\n');
      this.addIndicator({
        status: 'success',
        message: `${progress.label} completed`,
        category: 'progress'
      });
    }
  }

  /**
   * Create real-time monitoring dashboard
   */
  createDashboard(title: string, sections: VisualSection[]): VisualDashboard {
    this.dashboard = {
      title,
      sections,
      refreshRate: this.config.refreshRate,
      isActive: false
    };

    return this.dashboard;
  }

  /**
   * Start dashboard monitoring with real-time updates
   */
  startDashboard(): void {
    if (!this.dashboard) {
      throw new Error('No dashboard configured');
    }

    this.dashboard.isActive = true;
    this.clearScreen();
    this.renderDashboard();

    // Set up periodic refresh
    this.refreshInterval = setInterval(() => {
      this.refreshDashboard();
    }, this.dashboard.refreshRate);

    this.addIndicator({
      status: 'info',
      message: 'Visual dashboard started',
      category: 'dashboard'
    });
  }

  /**
   * Stop dashboard monitoring
   */
  stopDashboard(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }

    if (this.dashboard) {
      this.dashboard.isActive = false;
    }

    this.addIndicator({
      status: 'info',
      message: 'Visual dashboard stopped',
      category: 'dashboard'
    });
  }

  /**
   * Update specific dashboard section
   */
  updateDashboardSection(sectionType: string, content: any): void {
    if (!this.dashboard) return;

    const section = this.dashboard.sections.find(s => s.type === sectionType);
    if (section) {
      section.content = content;
    }
  }

  /**
   * Render complete dashboard
   */
  private renderDashboard(): void {
    if (!this.dashboard) return;

    let output = '';

    // Header
    const headerLine = '═'.repeat(this.terminalWidth);
    const titleLine = this.centerText(this.dashboard.title, this.terminalWidth);
    
    if (this.config.enableColors) {
      output += chalk.cyan(headerLine) + '\n';
      output += chalk.cyan.bold(titleLine) + '\n';
      output += chalk.cyan(headerLine) + '\n';
    } else {
      output += headerLine + '\n' + titleLine + '\n' + headerLine + '\n';
    }

    // Sections
    for (const section of this.dashboard.sections) {
      output += this.renderSection(section) + '\n';
    }

    // Footer with timestamp
    const timestamp = new Date().toISOString();
    const footerText = `Last updated: ${timestamp}`;
    const footer = this.centerText(footerText, this.terminalWidth);
    
    if (this.config.enableColors) {
      output += chalk.gray('─'.repeat(this.terminalWidth)) + '\n';
      output += chalk.gray(footer) + '\n';
    } else {
      output += '─'.repeat(this.terminalWidth) + '\n' + footer + '\n';
    }

    console.log(output);
  }

  /**
   * Render individual dashboard section
   */
  private renderSection(section: VisualSection): string {
    let output = '';

    // Section header
    const sectionTitle = ` ${section.title} `;
    if (this.config.enableColors) {
      output += chalk.yellow.bold(sectionTitle) + '\n';
    } else {
      output += sectionTitle + '\n';
    }

    // Section content based on type
    switch (section.type) {
      case 'health':
        output += this.renderHealthSection(section.content);
        break;
      case 'metrics':
        output += this.renderMetricsSection(section.content);
        break;
      case 'status':
        output += this.renderStatusSection(section.content);
        break;
      case 'progress':
        output += this.renderProgressSection(section.content);
        break;
      case 'logs':
        output += this.renderLogsSection(section.content);
        break;
      default:
        output += JSON.stringify(section.content, null, 2);
    }

    return output;
  }

  /**
   * Render health monitoring section
   */
  private renderHealthSection(healthStatus: HealthStatus): string {
    let output = '';

    // Overall status
    const statusIcon = this.getHealthIcon(healthStatus.status);
    const statusColor = this.getHealthColor(healthStatus.status);
    
    if (this.config.enableColors) {
      output += `  Overall: ${statusColor(statusIcon + ' ' + healthStatus.status.toUpperCase())}\n`;
    } else {
      output += `  Overall: ${statusIcon} ${healthStatus.status.toUpperCase()}\n`;
    }

    // Individual checks
    const checks = healthStatus.checks;
    for (const [checkName, result] of Object.entries(checks)) {
      const checkIcon = this.getHealthCheckIcon(result.status);
      const checkColor = this.getHealthCheckColor(result.status);
      const duration = `(${result.duration}ms)`;
      
      if (this.config.enableColors) {
        output += `  ${checkName}: ${checkColor(checkIcon + ' ' + result.status)} ${chalk.gray(duration)}\n`;
      } else {
        output += `  ${checkName}: ${checkIcon} ${result.status} ${duration}\n`;
      }

      if (result.status !== 'pass' && result.message) {
        if (this.config.enableColors) {
          output += `    └─ ${chalk.gray(result.message)}\n`;
        } else {
          output += `    └─ ${result.message}\n`;
        }
      }
    }

    return output;
  }

  /**
   * Render metrics section
   */
  private renderMetricsSection(metrics: any): string {
    let output = '';

    if (typeof metrics === 'object') {
      for (const [key, value] of Object.entries(metrics)) {
        const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        let formattedValue: string;

        if (typeof value === 'number') {
          if (key.includes('Rate') || key.includes('Stability')) {
            formattedValue = `${(value * 100).toFixed(1)}%`;
          } else if (key.includes('Time') && value > 1000) {
            formattedValue = `${(value / 1000).toFixed(2)}s`;
          } else if (key.includes('Time')) {
            formattedValue = `${value}ms`;
          } else {
            formattedValue = value.toString();
          }
        } else {
          formattedValue = String(value);
        }

        if (this.config.enableColors) {
          output += `  ${chalk.cyan(formattedKey)}: ${chalk.white.bold(formattedValue)}\n`;
        } else {
          output += `  ${formattedKey}: ${formattedValue}\n`;
        }
      }
    }

    return output;
  }

  /**
   * Render status section
   */
  private renderStatusSection(status: any): string {
    return `  ${JSON.stringify(status, null, 2)}\n`;
  }

  /**
   * Render progress section
   */
  private renderProgressSection(progress: any): string {
    let output = '';

    if (Array.isArray(progress)) {
      for (const item of progress) {
        if (item.current !== undefined && item.total !== undefined) {
          const percentage = Math.round((item.current / item.total) * 100);
          const bar = this.createProgressBar(item.current, item.total, 20);
          
          if (this.config.enableColors) {
            output += `  ${chalk.yellow(item.label || 'Progress')}: ${bar} ${chalk.bold(percentage + '%')}\n`;
          } else {
            output += `  ${item.label || 'Progress'}: ${bar} ${percentage}%\n`;
          }
        }
      }
    }

    return output;
  }

  /**
   * Render logs section
   */
  private renderLogsSection(logs: StatusIndicator[]): string {
    let output = '';

    if (Array.isArray(logs)) {
      for (const log of logs.slice(-5)) { // Show last 5 logs
        const time = new Date(log.timestamp).toISOString().substr(11, 8);
        const icon = this.getStatusIcon(log.status);
        
        if (this.config.enableColors) {
          const statusColor = this.getStatusColor(log.status);
          output += `  ${chalk.gray(time)} ${statusColor(icon)} ${log.message}\n`;
        } else {
          output += `  ${time} ${icon} ${log.message}\n`;
        }
      }
    }

    return output;
  }

  /**
   * Visual timeout adaptation feedback
   */
  showTimeoutAdaptation(level: number, reason: string, duration: number): void {
    const levelNames = ['Initial', 'Escalated', 'Maximum', 'Fallback'];
    const levelName = levelNames[level - 1] || 'Unknown';
    
    const timeoutValue = [30, 60, 120, 180][level - 1] || 0;
    
    let icon: string;
    let color: (text: string) => string;

    if (level === 1) {
      icon = '🟢';
      color = this.config.enableColors ? chalk.green : (t: string) => t;
    } else if (level === 2) {
      icon = '🟡';
      color = this.config.enableColors ? chalk.yellow : (t: string) => t;
    } else if (level === 3) {
      icon = '🟠';
      color = this.config.enableColors ? chalk.hex('#FFA500') : (t: string) => t;
    } else {
      icon = '🔴';
      color = this.config.enableColors ? chalk.red : (t: string) => t;
    }

    const message = `${icon} Timeout adapted to ${color(levelName)} (${timeoutValue}s) - ${reason}`;
    console.log(message);

    this.addIndicator({
      status: level <= 2 ? 'info' : 'warning',
      message: `Timeout level ${level}: ${levelName} (${timeoutValue}s)`,
      details: reason,
      category: 'timeout-adaptation'
    });

    // Show progress bar for adaptation
    this.showProgress({
      current: level,
      total: 4,
      label: 'Timeout Level',
      showPercentage: false
    });
  }

  /**
   * Visual circuit breaker status feedback
   */
  showCircuitBreakerStatus(state: 'closed' | 'open' | 'half-open', failureRate: number, details?: string): void {
    let icon: string;
    let color: (text: string) => string;
    let status: StatusIndicator['status'];

    switch (state) {
      case 'closed':
        icon = '🟢';
        color = this.config.enableColors ? chalk.green : (t: string) => t;
        status = 'success';
        break;
      case 'half-open':
        icon = '🟡';
        color = this.config.enableColors ? chalk.yellow : (t: string) => t;
        status = 'warning';
        break;
      case 'open':
        icon = '🔴';
        color = this.config.enableColors ? chalk.red : (t: string) => t;
        status = 'error';
        break;
    }

    const failureRateText = `${(failureRate * 100).toFixed(1)}%`;
    const message = `${icon} Circuit Breaker: ${color(state.toUpperCase())} (failure rate: ${failureRateText})`;
    
    console.log(message);

    this.addIndicator({
      status,
      message: `Circuit breaker ${state} (${failureRateText} failure rate)`,
      details,
      category: 'circuit-breaker'
    });
  }

  /**
   * Comprehensive validation feedback
   */
  showValidationFeedback(operation: string, success: boolean, duration: number, details?: any): void {
    const icon = success ? '✅' : '❌';
    const statusText = success ? 'PASSED' : 'FAILED';
    const color = success ? 
      (this.config.enableColors ? chalk.green : (t: string) => t) : 
      (this.config.enableColors ? chalk.red : (t: string) => t);

    const message = `${icon} Validation ${color(statusText)}: ${operation} (${duration}ms)`;
    console.log(message);

    this.addIndicator({
      status: success ? 'success' : 'error',
      message: `${operation} validation ${statusText.toLowerCase()}`,
      details: details ? JSON.stringify(details) : undefined,
      category: 'validation'
    });
  }

  /**
   * Helper methods
   */

  private clearScreen(): void {
    console.clear();
  }

  private refreshDashboard(): void {
    if (this.dashboard?.isActive) {
      this.clearScreen();
      this.renderDashboard();
    }
  }

  private centerText(text: string, width: number): string {
    const padding = Math.max(0, width - text.length);
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return ' '.repeat(leftPad) + text + ' '.repeat(rightPad);
  }

  private createProgressBar(current: number, total: number, width: number): string {
    const completed = Math.round((current / total) * width);
    const remaining = width - completed;
    
    let bar = '█'.repeat(completed) + '░'.repeat(remaining);
    
    if (this.config.enableColors) {
      const completedColor = current >= total ? chalk.green : chalk.blue;
      bar = completedColor('█'.repeat(completed)) + chalk.gray('░'.repeat(remaining));
    }

    return `[${bar}]`;
  }

  private getHealthIcon(status: string): string {
    switch (status) {
      case 'healthy': return '🟢';
      case 'degraded': return '🟡';
      case 'unhealthy': return '🔴';
      default: return '⚪';
    }
  }

  private getHealthColor(status: string): (text: string) => string {
    if (!this.config.enableColors) return (t: string) => t;
    
    switch (status) {
      case 'healthy': return chalk.green;
      case 'degraded': return chalk.yellow;
      case 'unhealthy': return chalk.red;
      default: return chalk.gray;
    }
  }

  private getHealthCheckIcon(status: string): string {
    switch (status) {
      case 'pass': return '✓';
      case 'warn': return '⚠';
      case 'fail': return '✗';
      default: return '?';
    }
  }

  private getHealthCheckColor(status: string): (text: string) => string {
    if (!this.config.enableColors) return (t: string) => t;
    
    switch (status) {
      case 'pass': return chalk.green;
      case 'warn': return chalk.yellow;
      case 'fail': return chalk.red;
      default: return chalk.gray;
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'success': return '✓';
      case 'warning': return '⚠';
      case 'error': return '✗';
      case 'progress': return '⏳';
      default: return 'ℹ';
    }
  }

  private getStatusColor(status: string): (text: string) => string {
    if (!this.config.enableColors) return (t: string) => t;
    
    switch (status) {
      case 'success': return chalk.green;
      case 'warning': return chalk.yellow;
      case 'error': return chalk.red;
      case 'progress': return chalk.blue;
      default: return chalk.cyan;
    }
  }

  private getRecentIndicators(count: number): StatusIndicator[] {
    return this.indicators.slice(-count);
  }

  /**
   * Get current visual feedback statistics
   */
  getStats(): {
    totalIndicators: number;
    recentIndicators: number;
    dashboardActive: boolean;
    successRate: number;
  } {
    const recentCount = this.indicators.filter(i => Date.now() - i.timestamp < 60000).length;
    const successCount = this.indicators.filter(i => i.status === 'success').length;
    const successRate = this.indicators.length > 0 ? successCount / this.indicators.length : 0;

    return {
      totalIndicators: this.indicators.length,
      recentIndicators: recentCount,
      dashboardActive: this.dashboard?.isActive || false,
      successRate
    };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    if (this.dashboard) {
      this.dashboard.isActive = false;
    }

    this.addIndicator({
      status: 'info',
      message: 'Visual feedback system cleaned up',
      category: 'system'
    });
  }
}

/**
 * Create visual feedback system with MCP-optimized configuration
 */
export function createVisualFeedbackSystem(config?: Partial<VisualFeedbackConfig>): VisualFeedbackSystem {
  const defaultConfig: Partial<VisualFeedbackConfig> = {
    enableColors: true,
    enableProgressBars: true,
    refreshRate: 1000,
    verbosityLevel: 'standard'
  };

  return new VisualFeedbackSystem({ ...defaultConfig, ...config });
}
