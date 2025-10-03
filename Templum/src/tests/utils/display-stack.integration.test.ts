import { configureDisplayStack, resetDisplayStack } from '../../utils/display-stack';
import { DisplayUtils, responsiveWidth } from '../../utils/display-utils';
import { WindowUtils } from '../../utils/window-utils';
import { createFormatter } from '../../utils/terminal-formatter';
import { WINDOW_SPACING } from '../../utils/window-theme-constants';
import { createFormatterCapabilitiesMock } from '../helpers/display-columns-provider';

describe('Display stack configuration', () => {
  afterEach(() => {
    resetDisplayStack();
  });

  test('applies shared formatter and columns provider to display and window utilities', () => {
    const logger = { debug: jest.fn() };
    const capabilities = createFormatterCapabilitiesMock({
      width: 72,
      height: 24,
      supportsUnicode: true,
      supportsColor: true,
    });
    const formatter = createFormatter({}, capabilities);

    configureDisplayStack({
      columnsProvider: () => capabilities.width,
      formatter,
      displayLogger: logger as any,
      windowLogger: logger as any,
    });

    const layout = DisplayUtils.calculate().autoWidth().layout();
    expect(layout.totalWidth).toBe(capabilities.width);

    const content = ['X'.repeat(50)];
    WindowUtils.render({ content, style: 'single' });

    expect(logger.debug).toHaveBeenCalledWith(
      'Rendered window',
      expect.objectContaining({
        width: responsiveWidth(content, { padding: WINDOW_SPACING.defaultPadding }),
        supportsUnicode: true,
        supportsColor: true,
      }),
    );
  });

  test('resetDisplayStack restores default column calculations', () => {
    resetDisplayStack();
    const baselineWidth = DisplayUtils.calculate().autoWidth().layout().totalWidth;

    configureDisplayStack({
      columnsProvider: () => 60,
    });

    expect(DisplayUtils.calculate().autoWidth().layout().totalWidth).toBe(60);

    resetDisplayStack();

    expect(DisplayUtils.calculate().autoWidth().layout().totalWidth).toBe(baselineWidth);
  });
});
