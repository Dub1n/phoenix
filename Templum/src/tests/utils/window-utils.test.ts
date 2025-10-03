import { WindowUtils } from '../../utils/window-utils';
import {
  configureFormatter,
  createFormatter,
} from '../../utils/terminal-formatter';
import { resetDisplayStack } from '../../utils/display-stack';
import { createFormatterCapabilitiesMock } from '../helpers/display-columns-provider';

const asciiCapabilities = () =>
  createFormatterCapabilitiesMock({ supportsUnicode: false, supportsColor: false, width: 48, height: 18 });

const unicodeCapabilities = () =>
  createFormatterCapabilitiesMock({ supportsUnicode: true, supportsColor: true, width: 48, height: 18 });

describe('WindowUtils', () => {
  afterEach(() => {
    resetDisplayStack();
  });

  test('renders ASCII borders when unicode support is unavailable', () => {
    configureFormatter({
      capabilitiesProvider: asciiCapabilities,
    });

    WindowUtils.reset();

    const output = WindowUtils.render({
      content: ['Hello world'],
      style: 'double',
      title: 'Menu',
    });

    const [header, , footer] = output.split('\n');
    expect(header.startsWith('+')).toBe(true);
    expect(footer.endsWith('+')).toBe(true);
  });

  test('uses injected formatter dependencies when provided', () => {
    const capabilities = unicodeCapabilities();
    const separator = jest.fn(() => '====');

    WindowUtils.configure({
      formatter: {
        getCapabilities: () => capabilities,
        ui: {
          separator,
        },
      } as any,
      logger: {
        debug: jest.fn(),
      } as any,
    });

    const output = WindowUtils.render({
      content: ['Injected'],
      style: 'single',
      title: 'Config',
    });

    expect(separator).toHaveBeenCalled();
    expect(separator.mock.calls[0][0]).toBeGreaterThan(0);
  });

  test('respects global formatter configuration when no custom dependencies are set', () => {
    const formatter = createFormatter({}, unicodeCapabilities());

    WindowUtils.configure({ formatter });

    const output = WindowUtils.render({
      content: ['Unicode'],
      style: 'rounded',
      title: 'Fmt',
    });

    const [header] = output.split('\n');
    expect(header.includes('╭')).toBe(true);
  });
});
