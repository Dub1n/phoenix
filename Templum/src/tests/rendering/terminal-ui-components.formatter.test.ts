import { createTerminalUI } from '../../interfaces/terminal-ui-components';
import { TerminalFormatter } from '../../utils/terminal-formatter';
import { createFallbackFormatter, createFormatterCapabilities } from '../helpers/terminal-formatter-fixtures';

const createFormatterDouble = () => ({
  data: {
    progress: jest.fn(() => 'progress-output'),
    table: jest.fn(() => 'table-output'),
    highlight: jest.fn(() => 'highlight-output'),
    code: jest.fn(() => 'code-output'),
  },
  ui: {
    header: jest.fn(() => 'header-output'),
    separator: jest.fn(() => 'separator-output'),
    menu: jest.fn(() => ['menu-line-1', 'menu-line-2'].join('\n')),
    prompt: jest.fn(() => 'prompt-output'),
    breadcrumb: jest.fn(() => 'breadcrumb-output'),
  },
  status: {
    success: jest.fn(() => 'success-output'),
    error: jest.fn(() => 'error-output'),
    warning: jest.fn(() => 'warning-output'),
    info: jest.fn(() => 'info-output'),
    debug: jest.fn(() => 'debug-output'),
  },
  interactive: {
    selection: jest.fn(() => 'selection-output'),
    navigation: jest.fn(() => 'navigation-output'),
    feedback: jest.fn(() => 'feedback-output'),
  },
  palette: {
    primary: jest.fn((text: string) => `primary:${text}`),
    secondary: jest.fn((text: string) => `secondary:${text}`),
    accent: jest.fn((text: string) => `accent:${text}`),
    muted: jest.fn((text: string) => `muted:${text}`),
  },
  system: {
    timestamp: jest.fn(() => 'timestamp-output'),
    path: jest.fn(() => 'path-output'),
    command: jest.fn(() => 'command-output'),
    version: jest.fn(() => 'version-output'),
  },
  getCapabilities: jest.fn(() => createFormatterCapabilities()),
  getCacheStats: jest.fn(() => ({ entries: 0, hits: 0, misses: 0, hitRate: 0 })),
  clearCache: jest.fn(),
  formatWithSpec: jest.fn((_spec: unknown, text: string) => `formatted:${text}`),
} as unknown as TerminalFormatter);

const ensureStdoutControl = () => {
  if (typeof (process.stdout as any).clearLine !== 'function') {
    Object.defineProperty(process.stdout, 'clearLine', {
      configurable: true,
      writable: true,
      value: () => undefined,
    });
  }

  if (typeof (process.stdout as any).cursorTo !== 'function') {
    Object.defineProperty(process.stdout, 'cursorTo', {
      configurable: true,
      writable: true,
      value: () => undefined,
    });
  }
};

describe('Terminal UI components — formatter integration', () => {
  const restoreStdoutSpies = () => {
    jest.restoreAllMocks();
  };

  afterEach(() => {
    restoreStdoutSpies();
  });

  test('progress output uses formatter fallbacks when unicode support is disabled', async () => {
    const formatter = createFallbackFormatter();
    const expected = formatter.data.progress(50, 100, 'Processing');

    ensureStdoutControl();
    const writeSpy = jest.spyOn(process.stdout, 'write').mockImplementation(() => true);
    jest.spyOn(process.stdout, 'clearLine').mockImplementation(() => true);
    jest.spyOn(process.stdout, 'cursorTo').mockImplementation(() => true);

    const ui = createTerminalUI({ formatter } as any);

    const progressBar = ui.createProgressBar({
      width: 20,
    });

    progressBar.start(100);
    writeSpy.mockClear();

    progressBar.update(50, 'Processing');

    const updateOutput = writeSpy.mock.calls[0]?.[0] ?? '';

    expect(updateOutput.trim()).toBe(expected.trim());
    expect(updateOutput).not.toMatch(/[█░]/);

    progressBar.complete();
    await ui.cleanup();
  });

  test('prompt formatting delegates to the formatter prompt helper', async () => {
    const formatter = createFormatterDouble();

    const ui = createTerminalUI({ formatter } as any);

    const prompt = ui.createPrompt();

    // Access private helper until Stage 5 updates expose formatter wiring publicly
    (prompt as any).formatPrompt('Continue?', 'Y/n');

    expect(formatter.ui.prompt).toHaveBeenCalledWith('Continue?', 'input');
    await ui.cleanup();
  });
});
