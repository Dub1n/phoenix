/**---
 * title: [Backend Dependencies Factory - Pure Backend Dependency Injection]
 * tags: [Backend, Dependency-Injection, Factory, Pure-Backend, VSCode-Independent]
 * provides: [Backend-Dependencies, Dependency-Factory]
 * requires: [Backend-Implementations, Node.js-Runtime]
 * description: [Factory for creating backend-compatible dependencies for Core Engine dependency injection]
 * ---*/

import { 
  ICoreEngineDependencies, 
  DependencyFactory, 
  IRuntimeConfig, 
  DependencyInjectionError,
  ITelemetryCollector,
  IFileMonitor
} from './abstractions';
import { BackendTelemetryCollector } from './backend-telemetry-collector';
import { BackendFileMonitor } from '../components/backend-file-monitor';

/**
 * Backend Telemetry Adapter
 * 
 * Adapter that makes BackendTelemetryCollector conform to ITelemetryCollector interface
 */
class BackendTelemetryAdapter implements ITelemetryCollector {
  constructor(private impl: BackendTelemetryCollector) {}

  recordEvent(name: string, data: Record<string, unknown>, source?: string, level?: 'info' | 'warning' | 'error'): void {
    this.impl.recordEvent(name, data, source, level);
  }

  recordPerformanceMetric(operation: string, durationMs: number, metadata?: Record<string, unknown>): void {
    this.impl.recordPerformanceMetric(operation, durationMs, metadata);
  }

  recordError(error: Error | string, context?: Record<string, unknown>): void {
    this.impl.recordError(error, context);
  }

  getMetrics() {
    return this.impl.getMetrics();
  }

  setEnabled(enabled: boolean): void {
    this.impl.setEnabled(enabled);
  }

  clearEvents(): void {
    this.impl.clearEvents();
  }

  getRecentEvents(count?: number) {
    return this.impl.getRecentEvents(count);
  }

  dispose(): void {
    this.impl.dispose();
  }
}

/**
 * Backend File Monitor Adapter
 * 
 * Adapter that makes BackendFileMonitor conform to IFileMonitor interface
 */
class BackendFileMonitorAdapter implements IFileMonitor {
  constructor(private impl: BackendFileMonitor) {}

  // EventEmitter methods
  on(event: string, listener: (...args: any[]) => void) {
    this.impl.on(event, listener);
    return this;
  }

  off(event: string, listener: (...args: any[]) => void) {
    this.impl.off(event, listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    return this.impl.emit(event, ...args);
  }

  once(event: string, listener: (...args: any[]) => void) {
    this.impl.once(event, listener);
    return this;
  }

  removeListener(event: string, listener: (...args: any[]) => void) {
    this.impl.removeListener(event, listener);
    return this;
  }

  removeAllListeners(event?: string) {
    this.impl.removeAllListeners(event);
    return this;
  }

  setMaxListeners(n: number) {
    this.impl.setMaxListeners(n);
    return this;
  }

  getMaxListeners(): number {
    return this.impl.getMaxListeners();
  }

  listeners(event: string) {
    return this.impl.listeners(event);
  }

  rawListeners(event: string) {
    return this.impl.rawListeners(event);
  }

  listenerCount(event: string): number {
    return this.impl.listenerCount(event);
  }

  prependListener(event: string, listener: (...args: any[]) => void) {
    this.impl.prependListener(event, listener);
    return this;
  }

  prependOnceListener(event: string, listener: (...args: any[]) => void) {
    this.impl.prependOnceListener(event, listener);
    return this;
  }

  eventNames() {
    return this.impl.eventNames();
  }

  // EventEmitter alias methods
  addListener(event: string, listener: (...args: any[]) => void) {
    return this.on(event, listener);
  }

  // IFileMonitor methods
  async startMonitoring(): Promise<void> {
    return this.impl.startMonitoring();
  }

  async stopMonitoring(): Promise<void> {
    return this.impl.stopMonitoring();
  }

  getMetrics() {
    return this.impl.getMetrics();
  }

  getRecentChanges(count?: number) {
    return this.impl.getRecentChanges(count);
  }

  isFileMonitored(filePath: string): boolean {
    return this.impl.isFileMonitored(filePath);
  }

  clearHistory(): void {
    this.impl.clearHistory();
  }

  dispose(): void {
    this.impl.dispose();
  }
}

/**
 * Create backend dependencies for Core Engine
 * 
 * Factory function that creates pure backend implementations of all Core Engine dependencies
 */
export const createBackendDependencies: DependencyFactory = async (config: IRuntimeConfig): Promise<ICoreEngineDependencies> => {
  if (config.context !== 'backend') {
    throw new DependencyInjectionError(
      `Backend dependencies factory called with wrong context: ${config.context}`,
      'backend-dependencies'
    );
  }

  try {
    console.log('Creating backend dependencies...');

    // Create backend telemetry collector
    const telemetryConfig = {
      ...config.telemetry,
      logLevel: 'info' as const,
      logFilePath: process.env.HARUSPEX_LOG_PATH || undefined
    };

    const backendTelemetry = new BackendTelemetryCollector(telemetryConfig);
    const telemetry = new BackendTelemetryAdapter(backendTelemetry);

    // Create backend file monitor
    const fileMonitorConfig = {
      ...config.fileMonitor,
      rootPath: config.workspaceRoot
    };

    const backendFileMonitor = new BackendFileMonitor(config.workspaceRoot, fileMonitorConfig);
    const fileMonitor = new BackendFileMonitorAdapter(backendFileMonitor);

    console.log('Backend dependencies created successfully');

    return {
      telemetry,
      fileMonitor,
      context: 'backend'
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    throw new DependencyInjectionError(
      `Failed to create backend dependencies: ${message}`,
      'backend-dependencies'
    );
  }
};

/**
 * Validate backend environment
 * 
 * Ensures that the backend environment has all required capabilities
 */
export async function validateBackendEnvironment(): Promise<void> {
  const requiredModules = ['fs', 'path', 'events'];
  const missingModules: string[] = [];

  for (const moduleName of requiredModules) {
    try {
      require(moduleName);
    } catch {
      missingModules.push(moduleName);
    }
  }

  if (missingModules.length > 0) {
    throw new DependencyInjectionError(
      `Missing required Node.js modules: ${missingModules.join(', ')}`,
      'environment-validation'
    );
  }

  // Check for chokidar (optional but recommended for file monitoring)
  try {
    require('chokidar');
    console.log('chokidar available for enhanced file monitoring');
  } catch {
    console.warn('chokidar not available - using basic file monitoring');
  }

  console.log('Backend environment validation passed');
}

/**
 * Create default backend runtime configuration
 */
export function createDefaultBackendConfig(workspaceRoot?: string): IRuntimeConfig {
  return {
    context: 'backend',
    workspaceRoot: workspaceRoot || process.cwd(),
    telemetry: {
      privacyCompliant: true,
      performanceMetrics: true,
      errorReporting: true,
      maxEventHistory: 1000
    },
    fileMonitor: {
      patterns: ['**/*.{ts,tsx,js,jsx,md,json,yml,yaml}'],
      recursive: true,
      debounceMs: 500,
      maxQueueSize: 1000,
      excludePatterns: [
        '**/node_modules/**',
        '**/.git/**',
        '**/.vscode/**',
        '**/dist/**',
        '**/build/**',
        '**/.DS_Store'
      ]
    }
  };
}