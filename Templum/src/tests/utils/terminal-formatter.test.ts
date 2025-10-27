import {
  TerminalFormatter,
  TerminalTheme,
  TERMINAL_FORMATTER_SPACING,
  configureFormatter,
  createFormatter,
  resetFormatterConfiguration,
  type FormatterFactoryOptions,
} from '../../utils/terminal-formatter';
import { isTemplumError } from '../../types/templum-types';
import {
  createFormatterCapabilitiesMock
} from '../helpers/display-columns-provider';
import { runContentLayoutTests } from '../../testing/content-layout-test';

const baseCapabilities = () => createFormatterCapabilitiesMock({ width: 120, height: 30 });

describe('TerminalFormatter', () => {
  describe('validation', () => {
    test('throws templum error when capabilities are structurally invalid', () => {
      const invalidCapabilities = { ...baseCapabilities(), width: 'wide' } as unknown as ReturnType<typeof baseCapabilities>;

      expect(() => new TerminalFormatter({}, invalidCapabilities)).toThrow();

      try {
        void new TerminalFormatter({}, invalidCapabilities);
      } catch (error) {
        expect(isTemplumError(error)).toBe(true);
        if (isTemplumError(error)) {
          expect(error.code).toBe('TERMINAL_FORMATTER_INVALID_CAPABILITIES');
          expect(error.context).toMatchObject({ field: 'width' });
        }
      }
    });

    test('merges partial themes while preserving defaults', () => {
      const formatter = new TerminalFormatter(
        {
          status: {
            success: { fg: '#00ff00' },
          },
        } as Partial<TerminalTheme>,
        baseCapabilities(),
      );

      const output = formatter.status.success('Great');
      expect(typeof output).toBe('string');
      expect(output).toContain('Great');
    });

    test('throws when theme modifiers are not arrays of supported values', () => {
      try {
        void new TerminalFormatter(
          {
            status: {
              success: { modifiers: 'bold' as unknown as string[] },
            },
          } as Partial<TerminalTheme>,
          baseCapabilities(),
        );
        fail('Expected theme validation to throw');
      } catch (error) {
        expect(isTemplumError(error)).toBe(true);
        if (isTemplumError(error)) {
          expect(error.code).toBe('TERMINAL_FORMATTER_INVALID_THEME');
          expect(error.context).toMatchObject({ path: 'status.success.modifiers' });
        }
      }
    });
  });

  describe('status helpers', () => {
    test('uses ASCII fallback glyphs when unicode is unavailable', () => {
      const formatter = new TerminalFormatter({}, {
        ...baseCapabilities(),
        supportsColor: false,
        supportsUnicode: false,
      });

      const output = formatter.status.success('All good');
      expect(output).toBe('[OK] All good');
      expect(formatter.getCacheStats()).toMatchObject({ entries: 1, hits: 0, misses: 1 });

      const cached = formatter.status.success('All good');
      expect(cached).toBe('[OK] All good');
      expect(formatter.getCacheStats()).toMatchObject({ entries: 1, hits: 1, misses: 1 });
    });
  });

  describe('text helpers', () => {
    test('formats muted text with caching and falls back when color disabled', () => {
      const formatter = new TerminalFormatter({}, baseCapabilities());
      const message = 'Muted diagnostic message';

      const first = formatter.text.muted(message);
      const second = formatter.text.muted(message);

      expect(first).toContain(message);
      expect(formatter.getCacheStats()).toMatchObject({ entries: 1, hits: 1, misses: 1 });
      expect(second).toBe(first);

      const monochromeFormatter = new TerminalFormatter({}, {
        ...baseCapabilities(),
        supportsColor: false,
        supportsStyles: false,
      });

      expect(monochromeFormatter.text.muted(message)).toBe(message);
    });

    test('plain text helper returns the original string', () => {
      const formatter = new TerminalFormatter({}, baseCapabilities());
      const sample = 'Plain output';

      expect(formatter.text.plain(sample)).toBe(sample);
    });
  });

  describe('cache management', () => {
    test('clears entries and stats', () => {
      const formatter = new TerminalFormatter({}, baseCapabilities());
      formatter.status.info('First');
      expect(formatter.getCacheStats()).toMatchObject({ entries: 1, hits: 0, misses: 1 });

      formatter.clearCache();
      expect(formatter.getCacheStats()).toEqual({ entries: 0, hits: 0, misses: 0, hitRate: 0 });
    });

    test('evicts least-recent entries when cache exceeds capacity', () => {
      const formatter = new TerminalFormatter({}, baseCapabilities());

      for (let index = 0; index < 205; index += 1) {
        formatter.status.info(`Message ${index}`);
      }

      const stats = formatter.getCacheStats();
      expect(stats.entries).toBeLessThan(200);
      expect(stats.misses).toBe(205);
      expect(stats.hits).toBe(0);
    });

    test('does not cache long code snippets', () => {
      const formatter = new TerminalFormatter({}, baseCapabilities());
      formatter.clearCache();

      const longSnippet = 'const output = doWork("value");'.repeat(7);
      const shortSnippet = 'logger.info("short");';

      formatter.data.code(shortSnippet, 'ts');
      formatter.data.code(shortSnippet, 'ts');

      formatter.data.code(longSnippet, 'ts');
      formatter.data.code(longSnippet, 'ts');

      const stats = formatter.getCacheStats();
      expect(stats.entries).toBe(1);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(3);
    });
  });

  describe('data and ui helpers', () => {
    test('clamps separator length based on shared spacing defaults', () => {
      const formatter = new TerminalFormatter({}, {
        ...baseCapabilities(),
        width: 48,
      });

      const separator = formatter.ui.separator(200, 'double');
      const visibleLength = separator.replace(/\u001b\[[0-9;]*m/g, '').length;

      expect(visibleLength).toBe(48 - TERMINAL_FORMATTER_SPACING.separatorMargin);
    });

    test('renders table rows with highlight fallback when unicode and color disabled', () => {
      const formatter = new TerminalFormatter({}, {
        ...baseCapabilities(),
        supportsColor: false,
        supportsUnicode: false,
      });

      const table = formatter.data.table([
        { service: 'Auth', status: 'OK' },
        { service: 'Billing', status: 'Fail' },
      ], {
        headers: ['Service', 'Status'],
        highlightRow: 1,
      });

      const lines = table.split('\n');
      expect(lines[0]).toContain('Service');
      expect(lines.some(line => line.includes('Billing'))).toBe(true);
      expect(lines[1]).toMatch(/^-+$/);
    });

    test('formats prompts with cached ascii fallbacks', () => {
      const formatter = new TerminalFormatter({}, {
        ...baseCapabilities(),
        supportsUnicode: false,
      });

      const prompt = formatter.ui.prompt('Continue', 'confirm');
      expect(prompt).toBe('Continue (y/n)');

      const cached = formatter.ui.prompt('Continue', 'confirm');
      expect(cached).toBe('Continue (y/n)');
      expect(formatter.getCacheStats()).toEqual({ entries: 1, hits: 1, misses: 1, hitRate: 0.5 });
    });

    test('formats menu items with disabled and selected styling cues', () => {
      const formatter = new TerminalFormatter({}, {
        ...baseCapabilities(),
        supportsColor: false,
      });

      const menu = formatter.ui.menu([
        { label: 'First' },
        { label: 'Second', disabled: true },
        { label: 'Third' },
      ], 2);

      const lines = menu.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toContain('First');
      expect(lines[1]).toContain('Second');
      expect(lines[2]).toContain('Third');
    });

    test('breadcrumbs fall back to ASCII separator when unicode unsupported', () => {
      const formatter = new TerminalFormatter({}, {
        ...baseCapabilities(),
        supportsUnicode: false,
      });

      const breadcrumb = formatter.ui.breadcrumb(['Root', 'Section', 'Item']);
      expect(breadcrumb).toBe('Root > Section > Item');
    });
  });

  describe('palette helpers', () => {
    test('formats primary tone strings using formatter caching', () => {
      const formatter = new TerminalFormatter({}, baseCapabilities());
      formatter.clearCache();

      const first = formatter.palette.primary('Primary text');
      const second = formatter.palette.primary('Primary text');

      expect(first).toContain('Primary text');
      expect(second).toBe(first);
      expect(formatter.getCacheStats()).toMatchObject({ entries: 1, hits: 1, misses: 1 });
    });

    test('returns unstyled muted text when colour support disabled', () => {
      const formatter = new TerminalFormatter({}, {
        ...baseCapabilities(),
        supportsColor: false,
      });

      const value = formatter.palette.muted('Muting');

      expect(value).toBe('Muting');
      expect(formatter.getCacheStats().entries).toBeGreaterThanOrEqual(1);
    });
  });

  describe('system helpers', () => {
    test('returns copies of capabilities to maintain immutability', () => {
      const formatter = new TerminalFormatter({}, baseCapabilities());
      const caps = formatter.getCapabilities();
      caps.width = 10;

      expect(formatter.getCapabilities().width).toBe(120);
    });
  });

  describe('static utilities', () => {
    test('withFallback uses fallback when color or unicode support is missing', () => {
      const noColor = TerminalFormatter.withFallback('fancy', 'plain', {
        ...baseCapabilities(),
        supportsColor: false,
      });

      const noUnicode = TerminalFormatter.withFallback('fancy', 'plain', {
        ...baseCapabilities(),
        supportsUnicode: false,
      });

      const full = TerminalFormatter.withFallback('fancy', 'plain', baseCapabilities());

      expect(noColor).toBe('plain');
      expect(noUnicode).toBe('plain');
      expect(full).toBe('fancy');
    });
  });

  describe('configuration seams', () => {
    afterEach(() => {
      resetFormatterConfiguration();
    });

    test('createFormatter uses configured factory and capabilities provider', () => {
      const configuredCapabilities = {
        ...baseCapabilities(),
        supportsUnicode: false,
        supportsColor: false,
      };

      const captured: FormatterFactoryOptions[] = [];
      const factory = jest.fn((options: FormatterFactoryOptions) => {
        captured.push(options);
        return new TerminalFormatter(options.theme, options.capabilities);
      });

      configureFormatter({
        capabilitiesProvider: () => configuredCapabilities,
        factory,
      });

      createFormatter({
        status: {
          success: { fg: '#abcdef' },
        },
      });

      expect(factory).toHaveBeenCalledTimes(1);
      expect(captured[0].capabilities).toEqual(configuredCapabilities);
      expect(captured[0].theme.status?.success?.fg).toBe('#abcdef');
    });

    test('configured default theme merges with call-time overrides', () => {
      const captured: FormatterFactoryOptions[] = [];
      const factory = jest.fn((options: FormatterFactoryOptions) => {
        captured.push(options);
        return new TerminalFormatter(options.theme, options.capabilities);
      });

      configureFormatter({
        defaultTheme: {
          status: {
            info: { fg: '#123456' },
          },
        },
        factory,
        capabilitiesProvider: () => baseCapabilities(),
      });

      createFormatter({
        status: {
          info: { modifiers: ['underline'] },
        },
      });

      expect(factory).toHaveBeenCalledTimes(1);
      expect(captured[0].theme.status?.info?.fg).toBe('#123456');
      expect(captured[0].theme.status?.info?.modifiers).toEqual(['underline']);
    });

    test('resetFormatterConfiguration clears custom configuration', () => {
      const factory = jest.fn((options: FormatterFactoryOptions) => new TerminalFormatter(options.theme, options.capabilities));

      configureFormatter({ factory });
      resetFormatterConfiguration();

      const formatter = createFormatter({}, baseCapabilities());

      expect(factory).not.toHaveBeenCalled();
      expect(formatter).toBeInstanceOf(TerminalFormatter);
    });
  });

  describe('logger consolidation guardrail', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('content layout harness delegates logging to consolidated sinks', async () => {
      const logSpy = jest.spyOn(console, 'log');
      const warnSpy = jest.spyOn(console, 'warn');
      const errorSpy = jest.spyOn(console, 'error');
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation((() => undefined) as unknown as typeof process.exit);

      await runContentLayoutTests();

      expect(logSpy).not.toHaveBeenCalled();
      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});
