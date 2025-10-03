import { TERMINAL_FORMATTER_SPACING } from './terminal-formatter';

export const WINDOW_BORDER_STYLES = ['ascii', 'single', 'double', 'rounded', 'dashed'] as const;

export type WindowBorderStyle = typeof WINDOW_BORDER_STYLES[number];

export interface WindowBorderGlyphSet {
  edges: {
    horizontal: string;
    vertical: string;
  };
  corners: WindowCornerGlyphs;
  junctions: {
    top: string;
    bottom: string;
    left: string;
    right: string;
    cross: string;
  };
}

export interface WindowCornerGlyphs {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
}

export const WINDOW_BORDER_GLYPHS: Record<WindowBorderStyle, WindowBorderGlyphSet> = {
  ascii: {
    edges: {
      horizontal: '-',
      vertical: '|',
    },
    corners: {
      topLeft: '+',
      topRight: '+',
      bottomLeft: '+',
      bottomRight: '+',
    },
    junctions: {
      top: '+',
      bottom: '+',
      left: '+',
      right: '+',
      cross: '+',
    },
  },
  single: {
    edges: {
      horizontal: '─',
      vertical: '│',
    },
    corners: {
      topLeft: '┌',
      topRight: '┐',
      bottomLeft: '└',
      bottomRight: '┘',
    },
    junctions: {
      top: '┬',
      bottom: '┴',
      left: '├',
      right: '┤',
      cross: '┼',
    },
  },
  double: {
    edges: {
      horizontal: '═',
      vertical: '║',
    },
    corners: {
      topLeft: '╔',
      topRight: '╗',
      bottomLeft: '╚',
      bottomRight: '╝',
    },
    junctions: {
      top: '╦',
      bottom: '╩',
      left: '╠',
      right: '╣',
      cross: '╬',
    },
  },
  rounded: {
    edges: {
      horizontal: '─',
      vertical: '│',
    },
    corners: {
      topLeft: '╭',
      topRight: '╮',
      bottomLeft: '╰',
      bottomRight: '╯',
    },
    junctions: {
      top: '┬',
      bottom: '┴',
      left: '├',
      right: '┤',
      cross: '┼',
    },
  },
  dashed: {
    edges: {
      horizontal: '-',
      vertical: '|',
    },
    corners: {
      topLeft: '+',
      topRight: '+',
      bottomLeft: '+',
      bottomRight: '+',
    },
    junctions: {
      top: '+',
      bottom: '+',
      left: '+',
      right: '+',
      cross: '+',
    },
  },
};

export const WINDOW_CORNER_GLYPHS: Record<WindowBorderStyle, WindowCornerGlyphs> = {
  ascii: WINDOW_BORDER_GLYPHS.ascii.corners,
  single: WINDOW_BORDER_GLYPHS.single.corners,
  double: WINDOW_BORDER_GLYPHS.double.corners,
  rounded: WINDOW_BORDER_GLYPHS.rounded.corners,
  dashed: WINDOW_BORDER_GLYPHS.dashed.corners,
};

export const WINDOW_SPACING = {
  defaultPadding: TERMINAL_FORMATTER_SPACING.defaultPadding,
  borderWidth: TERMINAL_FORMATTER_SPACING.borderWidth,
  separatorMargin: TERMINAL_FORMATTER_SPACING.separatorMargin,
  separatorLength: TERMINAL_FORMATTER_SPACING.separatorLength,
  minWidth: TERMINAL_FORMATTER_SPACING.minTerminalWidth,
  maxWidth: TERMINAL_FORMATTER_SPACING.maxTerminalWidth,
} as const;
