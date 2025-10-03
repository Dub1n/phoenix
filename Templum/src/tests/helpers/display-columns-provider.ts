import { DisplayUtils } from '../../utils/display-utils';
import type { TerminalCapabilities } from '../../utils/terminal-formatter';
import {
  DEFAULT_TERMINAL_HEIGHT,
  DEFAULT_TERMINAL_WIDTH,
  createTerminalCapabilities,
} from './terminal-capabilities';

type ColumnsProvider = () => number | undefined;

export const DEFAULT_TEST_TERMINAL_WIDTH = DEFAULT_TERMINAL_WIDTH;
export const DEFAULT_TEST_TERMINAL_HEIGHT = DEFAULT_TERMINAL_HEIGHT;

export const createColumnsProviderMock = (width = DEFAULT_TEST_TERMINAL_WIDTH): ColumnsProvider => () => width;

export const configureDisplayColumnsMock = (width = DEFAULT_TEST_TERMINAL_WIDTH): ColumnsProvider => {
  const provider = createColumnsProviderMock(width);
  DisplayUtils.configure({ columnsProvider: provider });
  return provider;
};

export const createFormatterCapabilitiesMock = (
  overrides: Partial<TerminalCapabilities> = {},
): TerminalCapabilities => createTerminalCapabilities(overrides);
