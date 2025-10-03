import { DisplayUtils, calculate, orderServices, responsiveWidth, formatItems } from '../../utils/display-utils';
import { TERMINAL_FORMATTER_SPACING, TerminalSeparatorStyle } from '../../utils/terminal-formatter';
import {
  WINDOW_BORDER_GLYPHS,
  WINDOW_CORNER_GLYPHS,
  WINDOW_SPACING,
} from '../../utils/window-theme-constants';
import { configureDisplayColumnsMock } from '../helpers/display-columns-provider';

const stripAnsi = (value: string) => value.replace(/\u001b\[[0-9;]*m/g, '');

describe('DisplayUtils', () => {
  afterEach(() => {
    DisplayUtils.reset();
  });

  it('allows configuring a custom columns provider for standards', () => {
    configureDisplayColumnsMock(96);

    const standards = DisplayUtils.standards;

    expect(standards.terminalWidth).toBe(96);
    expect(standards.minWidth).toBeLessThanOrEqual(standards.terminalWidth);
  });

  it('builds layouts using fluent calculator with injected terminal width', () => {
    configureDisplayColumnsMock(90);

    const layout = calculate().autoWidth().padding(3).order('alphabetical').layout();

    expect(layout.totalWidth).toBe(90);
    expect(layout.contentWidth).toBe(84);
    expect(layout.maxItemLength).toBe(80);
    expect(layout.ordering).toBe('alphabetical');
    expect(layout.separatorLength).toBe(84);
  });

  it('aligns separator defaults with formatter and window spacing constants', () => {
    configureDisplayColumnsMock(160);

    const standards = DisplayUtils.standards;

    expect(standards.defaultPadding).toBe(TERMINAL_FORMATTER_SPACING.defaultPadding);
    expect(standards.defaultPadding).toBe(WINDOW_SPACING.defaultPadding);
    expect(standards.separatorMargin).toBe(TERMINAL_FORMATTER_SPACING.separatorMargin);
    expect(standards.separatorMargin).toBe(WINDOW_SPACING.separatorMargin);
    expect(standards.separatorLength).toBe(TERMINAL_FORMATTER_SPACING.separatorLength);
    expect(standards.separatorLength).toBe(WINDOW_SPACING.separatorLength);
  });

  it('orders services with connected-first strategy and alphabetical fallback', () => {
    const services = [
      { name: 'zeta', status: 'inactive' },
      { name: 'alpha', status: 'connected' },
      { name: 'beta', status: 'healthy' },
      { name: 'gamma', status: 'failed' }
    ];

    const ordered = orderServices(services);

    expect(ordered).not.toBe(services);
    expect(ordered.map(service => service.name)).toEqual(['alpha', 'beta', 'gamma', 'zeta']);
  });

  it('respects disablement of connected-first ordering while keeping original sequence', () => {
    const services = [
      { name: 'first', status: 'inactive' },
      { name: 'second', status: 'connected' }
    ];

    const ordered = orderServices(services, { connectedFirst: false, alphabetical: false });

    expect(ordered).toEqual(services);
    expect(ordered).not.toBe(services);
  });

  it('calculates responsive width based on ANSI-safe content and injected padding', () => {
    configureDisplayColumnsMock(120);

    const width = responsiveWidth('\u001B[31mHello\u001B[0m', { padding: 3, minWidth: 20, maxWidth: 40 });

    expect(width).toBe(20);

    const listWidth = responsiveWidth(['short', 'a much longer piece of text'], { padding: 2, maxWidth: 50 });
    expect(listWidth).toBeGreaterThan(20);
    expect(listWidth).toBeLessThanOrEqual(50);
  });

  it('formats items with numbering, prefix/suffix, and width alignment', () => {
    const formatted = formatItems(['alpha', 'beta'], {
      numbered: true,
      prefix: '>',
      suffix: '<',
      width: 14,
      alignment: 'center'
    });

    expect(formatted).toHaveLength(2);
    expect(formatted[0].includes('>')).toBe(true);
    expect(formatted[0].includes('<')).toBe(true);
    expect(formatted[0].length).toBe(14);
    expect(stripAnsi(formatted[0]).trim().startsWith('> 1. alpha<')).toBe(true);
  });

  it('produces separators using the injected formatter implementation', () => {
    const calls: Array<{ length: number; style: string }> = [];

    DisplayUtils.configure({
      formatter: {
        ui: {
          separator: (length: number, style: TerminalSeparatorStyle) => {
            calls.push({ length, style });
            return '#'.repeat(length);
          }
        }
      } as any
    });

    const separator = DisplayUtils.separator(12, 'double');

    expect(stripAnsi(separator)).toBe('############');
    expect(calls).toEqual([{ length: 12, style: 'double' }]);
  });

  it('exposes shared window border glyph definitions for migration prerequisites', () => {
    const single = WINDOW_BORDER_GLYPHS.single;
    expect(single.corners.topLeft).toBe('┌');
    expect(single.edges.horizontal).toBe('─');
    expect(WINDOW_CORNER_GLYPHS.double.bottomRight).toBe('╝');
  });
});
