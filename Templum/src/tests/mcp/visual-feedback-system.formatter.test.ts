import { VisualFeedbackSystem } from '../../mcp-channel/src/visual-feedback-system';
import type { HealthStatus } from '../../mcp-channel/src/health-monitor';
import {
  createFallbackFormatter,
  createFormatterFixture,
} from '../helpers/terminal-formatter-fixtures';
import {
  configureWindowUtilsFormatter,
  resetWindowUtilsFormatter,
} from '../helpers/window-utils-fixtures';

const stripAnsi = (input: string): string => input.replace(/\u001b\[[0-9;]*m/g, '');

const createHealthStatus = (): HealthStatus => ({
  status: 'healthy',
  timestamp: Date.now(),
  uptime: 1_000,
  checks: {
    mcpServer: { status: 'pass', duration: 5, message: 'ok' },
    ptyManager: { status: 'pass', duration: 5, message: 'ok' },
    performance: { status: 'pass', duration: 5, message: 'ok' },
    resources: { status: 'pass', duration: 5, message: 'ok' },
    communication: { status: 'pass', duration: 5, message: 'ok' },
  },
  metrics: {
    totalRequests: 10,
    averageResponseTime: 5,
    errorRate: 0,
    activeSessions: 1,
    memoryUsage: 128,
    cpuUsage: 5,
    timeoutAdaptations: 0,
    circuitBreakerTrips: 0,
    communicationStability: 1,
  },
});

describe('VisualFeedbackSystem — formatter integration', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'clear').mockImplementation(() => undefined);
  });

  afterEach(() => {
    resetWindowUtilsFormatter();
    jest.restoreAllMocks();
  });

  test('status indicators use formatter fallbacks when unicode support is disabled', () => {
    const formatter = createFallbackFormatter();
    const system = new VisualFeedbackSystem({
      enableColors: true,
      enableProgressBars: false,
      refreshRate: 2500,
      formatter,
    } as any);

    (console.log as jest.Mock).mockClear();

    system.addIndicator({
      status: 'success',
      message: 'Connected',
      category: 'mcp',
    });

    const output = (console.log as jest.Mock).mock.calls[0]?.[0] ?? '';
    const expected = formatter.status.success('Connected');

    expect(output).toContain(expected);
    expect(output).not.toContain('✓');

    system.dispose();
  });

  test('progress display delegates to formatter progress helper', () => {
    const formatter = createFallbackFormatter();
    const system = new VisualFeedbackSystem({
      enableColors: true,
      enableProgressBars: true,
      formatter,
    } as any);

    const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    system.showProgress({
      label: 'Sync',
      current: 15,
      total: 30,
      showPercentage: true,
    });

    const output = writeSpy.mock.calls[0]?.[0] ?? '';
    const expected = formatter.data.progress(15, 30, 'Sync');

    expect(output).toContain(expected);
    expect(output).not.toContain('█');
    expect(output).not.toContain('░');

    system.dispose();
  });

  test('dashboard windows render via WindowUtils with ascii fallback when unicode is disabled', () => {
    const capabilities = {
      supportsColor: false,
      supportsUnicode: false,
      width: 48,
      height: 20,
    } as const;

    const formatter = createFormatterFixture({ capabilities });

    configureWindowUtilsFormatter({ capabilities });

    const system = new VisualFeedbackSystem({
      formatter,
      refreshRate: 2_000,
    } as any);

    try {
      system.createDashboard('MCP Health', [
        { title: 'Health', type: 'health', content: createHealthStatus(), priority: 'high' },
      ]);

      system.startDashboard();

      const windowCall = (console.log as jest.Mock).mock.calls.find(([value]) =>
        typeof value === 'string' && value.includes('MCP Health')
      );

      expect(windowCall).toBeDefined();

      const windowOutput = String(windowCall?.[0] ?? '');
      const lines = windowOutput.split('\n').filter(Boolean);

      expect(lines[0]?.trim().startsWith('+')).toBe(true);
      expect(lines[0]?.trim().endsWith('+')).toBe(true);
      expect(lines.some(line => line.includes('|'))).toBe(true);
    } finally {
      system.dispose();
    }
  });

  test('health dashboard sections delegate to formatter status helpers', () => {
    const formatter = createFormatterFixture();
    const successSpy = jest.spyOn(formatter.status, 'success');

    const system = new VisualFeedbackSystem({
      formatter,
      refreshRate: 2_000,
    } as any);

    try {
      system.createDashboard('Observability', [
        { title: 'Health', type: 'health', content: createHealthStatus(), priority: 'high' },
      ]);

      system.startDashboard();

      expect(successSpy).toHaveBeenCalled();
    } finally {
      system.dispose();
    }
  });

  test('progress output respects terminal width constraints', () => {
    const width = 42;
    const formatter = createFormatterFixture({
      capabilities: { width },
    });

    const system = new VisualFeedbackSystem({
      formatter,
      enableProgressBars: true,
    } as any);

    const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);

    system.showProgress({
      label: 'Extremely long operation label to test clamp',
      current: 21,
      total: 42,
      showPercentage: true,
    });

    const output = String(writeSpy.mock.calls[0]?.[0] ?? '');
    const stripped = stripAnsi(output).replace(/\r/g, '');

    expect(stripped.length).toBeLessThanOrEqual(width);

    system.dispose();
  });

  test('progress sections reuse formatter progress helpers for rendering', () => {
    const formatter = createFallbackFormatter();
    const system = new VisualFeedbackSystem({
      formatter,
      enableProgressBars: true,
    } as any);

    const progressSpy = jest.spyOn(formatter.data, 'progress');

    const output = (system as any).renderProgressSection([
      { current: 4, total: 8, label: 'Deploy', showPercentage: true }
    ]);

    const rendered = String(progressSpy.mock.results[0]?.value ?? '').trim();

    expect(progressSpy).toHaveBeenCalledWith(4, 8, 'Deploy');
    expect(output.some((line: string) => line.includes(rendered))).toBe(true);

    progressSpy.mockRestore();
    system.dispose();
  });

  test('health sections strip formatter glyphs while retaining indicator icons', () => {
    const formatter = createFallbackFormatter();
    const system = new VisualFeedbackSystem({
      formatter,
      refreshRate: 2_000,
    } as any);

    const healthStatus: HealthStatus = createHealthStatus();

    const output = (system as any).renderHealthSection(healthStatus);

    expect(output.some((line: string) => line.includes('Overall: 🟢 HEALTHY'))).toBe(true);
    expect(output.join('\n')).not.toContain('[OK]');

    system.dispose();
  });
});
