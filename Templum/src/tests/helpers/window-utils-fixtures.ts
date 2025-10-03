import { WindowUtils } from '../../utils/window-utils';
import { createFormatterFixture, FormatterFixtureOptions } from './terminal-formatter-fixtures';

export const configureWindowUtilsFormatter = (
  options: FormatterFixtureOptions = {},
) => {
  const formatter = createFormatterFixture(options);
  WindowUtils.configure({ formatter });
  return formatter;
};

export const resetWindowUtilsFormatter = () => {
  WindowUtils.reset();
};
