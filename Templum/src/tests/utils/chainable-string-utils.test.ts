import { StringUtils } from '../../utils/chainable-string-utils';
import { isTemplumError } from '../../types/templum-types';

describe('Chainable String Utils', () => {
  test('truncate respects plain width and reports truncation state', () => {
    const result = StringUtils.chain('TemplumUtilitySuite').truncate(10).inspect();

    expect(result.value).toBe('TemplumUt…');
    expect(result.truncated).toBe(true);
    expect(result.width).toBeLessThanOrEqual(10);
  });

  test('truncate handles wide unicode characters in terminal mode', () => {
    const value = '渋谷区案内所';
    const result = StringUtils.chain(value, { mode: 'terminal' }).truncate(6).inspect();

    expect(result.value).toBe('渋谷…');
    expect(result.truncated).toBe(true);
    expect(result.width).toBeLessThanOrEqual(6);
  });

  test('pad aligns content according to alignment preference', () => {
    const centered = StringUtils.chain('Pad').pad(9, 'center').value();
    const left = StringUtils.chain('Pad').pad(6, 'left').value();
    const right = StringUtils.chain('Pad').pad(6, 'right').value();

    expect(centered).toBe('   Pad   ');
    expect(left).toBe('   Pad');
    expect(right).toBe('Pad   ');
  });

  test('wrap produces expected segments for soft and hard modes', () => {
    const soft = StringUtils.wrap('Templum CLI Utility Toolkit', 12);
    const hard = StringUtils.chain('Templum', { mode: 'plain' }).wrap(3, { hard: true }).inspect();

    expect(soft).toEqual(['Templum CLI', 'Utility', 'Toolkit']);
    expect(hard.value).toBe('Tem\nplu\nm');
    expect(hard.wrapped).toBe(true);
  });

  test('convertCase transforms text across supported modes', () => {
    const upper = StringUtils.chain('templum toolkit').convertCase('upper').value();
    const lower = StringUtils.chain('Templum Toolkit').convertCase('lower').value();
    const title = StringUtils.chain('templum toolkit experience').convertCase('title').value();
    const sentence = StringUtils.chain('templum toolkit experience').convertCase('sentence').value();

    expect(upper).toBe('TEMPLUM TOOLKIT');
    expect(lower).toBe('templum toolkit');
    expect(title).toBe('Templum Toolkit Experience');
    expect(sentence).toBe('Templum toolkit experience');
  });

  test('collapseWhitespace condenses whitespace per mode', () => {
    const spaces = StringUtils.chain('Templum    Toolkit\n\nUtilities').collapseWhitespace('spaces').value();
    const all = StringUtils.chain('Templum\t\nToolkit  Utilities').collapseWhitespace('all').value();

    expect(spaces).toBe('Templum Toolkit\n\nUtilities');
    expect(all).toBe('Templum Toolkit Utilities');
  });

  test('ensureSuffix appends suffix when missing, preserves when present', () => {
    const appended = StringUtils.chain('Templum').ensureSuffix(':').value();
    const preserved = StringUtils.chain('Templum:').ensureSuffix(':').value();

    expect(appended).toBe('Templum:');
    expect(preserved).toBe('Templum:');
  });

  test('chain applies trim option before operations', () => {
    const result = StringUtils.chain('  templum  ', { trim: 'both' }).truncate(8).inspect();

    expect(result.value).toBe('templum');
    expect(result.truncated).toBe(false);
    expect(result.width).toBe(7);
  });

  test('trim modes handle targeted whitespace and preserve ANSI sequences', () => {
    const startTrimmed = StringUtils.chain('   templum', { trim: 'start' }).value();
    const endTrimmed = StringUtils.chain('templum   ', { trim: 'end' }).value();
    const ansiValue = '  \u001b[31m templum \u001b[0m  ';
    const ansiTrimmed = StringUtils.chain(ansiValue, { trim: 'both' }).value();

    expect(startTrimmed).toBe('templum');
    expect(endTrimmed).toBe('templum');
    const stripped = ansiTrimmed.replace(/\u001b\[[0-9;]*m/g, '');

    expect(ansiTrimmed.startsWith('\u001b[31m')).toBe(true);
    expect(ansiTrimmed.endsWith('\u001b[0m')).toBe(true);
    expect(stripped).toBe(' templum ');
  });

  test('pad respects double-width glyphs for terminal output', () => {
    const result = StringUtils.chain('渋谷', { mode: 'terminal' }).pad(6).inspect();

    expect(result.value).toBe('渋谷  ');
    expect(result.width).toBe(6);
    expect(result.truncated).toBe(false);
  });

  test('truncate leaves shorter strings untouched and preserves width budget', () => {
    const value = 'templum';
    const result = StringUtils.chain(value).truncate(10).inspect();

    expect(result.value).toBe(value);
    expect(result.truncated).toBe(false);
    expect(result.width).toBeLessThanOrEqual(10);
  });

  test('convenience helpers delegate through chain for consistency', () => {
    expect(StringUtils.truncate('TemplumUtility', 9)).toBe('TemplumU…');
    expect(StringUtils.pad('Templum', 10)).toBe('Templum   ');

    const wrapped = StringUtils.wrap('Templum CLI Utility Toolkit', 12);
    expect(wrapped).toEqual(['Templum CLI', 'Utility', 'Toolkit']);
  });

  test('invalid widths surface templum errors via error handler', () => {
    try {
      StringUtils.chain('templum').truncate(0);
      fail('Expected failure for invalid width');
    } catch (error) {
      expect(isTemplumError(error)).toBe(true);
      expect((error as Error).message).toContain('width');
    }
  });
});
