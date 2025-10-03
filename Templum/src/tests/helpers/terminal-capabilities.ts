import type { TerminalCapabilities } from '../../utils/terminal-formatter';

export const DEFAULT_TERMINAL_WIDTH = 96;
export const DEFAULT_TERMINAL_HEIGHT = 30;

export const BASE_TERMINAL_CAPABILITIES: TerminalCapabilities = {
  supportsColor: true,
  supports256Colors: true,
  supportsTrueColor: true,
  supportsStyles: true,
  supportsUnicode: true,
  width: DEFAULT_TERMINAL_WIDTH,
  height: DEFAULT_TERMINAL_HEIGHT,
  isInteractive: true,
  platform: 'unix',
};

export const createTerminalCapabilities = (
  overrides: Partial<TerminalCapabilities> = {},
): TerminalCapabilities => ({
  ...BASE_TERMINAL_CAPABILITIES,
  ...overrides,
  width: overrides.width ?? BASE_TERMINAL_CAPABILITIES.width,
  height: overrides.height ?? BASE_TERMINAL_CAPABILITIES.height,
  isInteractive: overrides.isInteractive ?? BASE_TERMINAL_CAPABILITIES.isInteractive,
  platform: overrides.platform ?? BASE_TERMINAL_CAPABILITIES.platform,
});

