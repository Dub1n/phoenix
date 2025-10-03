import { DisplayUtils, DisplayStandards } from '../utils/display-utils';

export interface DisplayLayoutOptions {
  padding?: number;
  minWidth?: number;
  maxWidth?: number;
  borderWidth?: number;
}

export interface DisplayLayoutMetrics {
  standards: DisplayStandards;
  padding: number;
  contentWidth: number;
  windowWidth: number;
  separatorLength: number;
}

export function computeDisplayLayout(
  content: string[] | string,
  options: DisplayLayoutOptions = {}
): DisplayLayoutMetrics {
  const standards = DisplayUtils.standards;
  const items = Array.isArray(content) ? content : [content];
  const padding = options.padding ?? standards.defaultPadding;
  const minWidth = options.minWidth ?? standards.minWidth;
  const maxWidth = options.maxWidth ?? Math.min(standards.maxWidth, standards.terminalWidth);
  const borderWidth = options.borderWidth ?? standards.borderWidth;

  const responsiveWidth = Math.min(
    DisplayUtils.responsiveWidth(items, {
      padding,
      minWidth,
      maxWidth
    }),
    standards.separatorLength
  );

  const layout = DisplayUtils.calculate()
    .width(responsiveWidth)
    .padding(padding)
    .layout();

  const windowWidth = layout.totalWidth + borderWidth;

  return {
    standards,
    padding,
    contentWidth: layout.contentWidth,
    windowWidth,
    separatorLength: layout.separatorLength
  };
}
