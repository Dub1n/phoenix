import { createFormatter, TerminalCapabilities, TerminalFormatter, TerminalTheme } from '../../utils/terminal-formatter';
import { createTerminalCapabilities } from './terminal-capabilities';

export interface FormatterFixtureOptions {
  theme?: Partial<TerminalTheme>;
  capabilities?: Partial<TerminalCapabilities>;
}

export const createFormatterCapabilities = (
  overrides: Partial<TerminalCapabilities> = {},
): TerminalCapabilities => createTerminalCapabilities(overrides);

export const createFormatterFixture = (
  options: FormatterFixtureOptions = {},
): TerminalFormatter => {
  const capabilities = createFormatterCapabilities(options.capabilities);
  const theme = options.theme ?? {};

  return createFormatter(theme, capabilities);
};

export const createFallbackFormatter = (): TerminalFormatter =>
  createFormatterFixture({
    capabilities: {
      supportsColor: false,
      supportsStyles: false,
      supportsUnicode: false,
    },
  });
