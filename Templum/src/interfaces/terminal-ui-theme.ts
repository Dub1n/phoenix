import { TypeGuards } from '../utils/type-guards';
import {
  ColorSpec,
  TerminalFormatter,
  createFormatter,
} from '../utils/terminal-formatter';

type ThemeColor = (value: string) => string;

export interface TerminalColorTheme {
  name: string;
  primary: ThemeColor;
  secondary: ThemeColor;
  success: ThemeColor;
  warning: ThemeColor;
  error: ThemeColor;
  info: ThemeColor;
  accent: ThemeColor;
  muted: ThemeColor;
}

export interface ThemeIntegrityResult {
  theme: TerminalColorTheme;
  resetRequired: boolean;
  issues: string[];
}

interface ThemePalette {
  name: string;
  primary: ColorSpec;
  secondary: ColorSpec;
  success: ColorSpec;
  warning: ColorSpec;
  error: ColorSpec;
  info: ColorSpec;
  accent: ColorSpec;
  muted: ColorSpec;
}

const DEFAULT_THEME_PALETTES: Record<string, ThemePalette> = {
  default: {
    name: 'Default',
    primary: { fg: '#2196f3', modifiers: ['bold'] },
    secondary: { fg: '#00bcd4' },
    success: { fg: '#4caf50', modifiers: ['bold'] },
    warning: { fg: '#ffb300', modifiers: ['bold'] },
    error: { fg: '#f44336', modifiers: ['bold'] },
    info: { fg: '#03a9f4' },
    accent: { fg: '#9c27b0' },
    muted: { fg: '#757575' },
  },
  dark: {
    name: 'Dark',
    primary: { fg: '#f5f5f5', modifiers: ['bold'] },
    secondary: { fg: '#bdbdbd' },
    success: { fg: '#69f0ae', modifiers: ['bold'] },
    warning: { fg: '#ffee58', modifiers: ['bold'] },
    error: { fg: '#ef5350', modifiers: ['bold'] },
    info: { fg: '#4dd0e1' },
    accent: { fg: '#ba68c8' },
    muted: { fg: '#9e9e9e' },
  },
  light: {
    name: 'Light',
    primary: { fg: '#263238', modifiers: ['bold'] },
    secondary: { fg: '#1976d2' },
    success: { fg: '#2e7d32' },
    warning: { fg: '#f9a825', modifiers: ['bold'] },
    error: { fg: '#c62828', modifiers: ['bold'] },
    info: { fg: '#1565c0' },
    accent: { fg: '#8e24aa' },
    muted: { fg: '#78909c' },
  },
  monochrome: {
    name: 'Monochrome',
    primary: { fg: '#ffffff' },
    secondary: { fg: '#bdbdbd' },
    success: { fg: '#fafafa' },
    warning: { fg: '#e0e0e0' },
    error: { fg: '#eeeeee' },
    info: { fg: '#f5f5f5' },
    accent: { fg: '#ffffff', modifiers: ['bold'] },
    muted: { fg: '#9e9e9e' },
  },
};

let sharedFormatter: TerminalFormatter | null = null;

const getFormatter = (): TerminalFormatter => {
  if (!sharedFormatter) {
    sharedFormatter = createFormatter();
  }
  return sharedFormatter;
};

export const setTerminalUIFormatter = (formatter: TerminalFormatter): void => {
  sharedFormatter = formatter;
};

const style = (spec: ColorSpec): ThemeColor => (value: string) => {
  return getFormatter().formatWithSpec(spec, value);
};

const createTheme = (palette: ThemePalette): TerminalColorTheme => ({
  name: palette.name,
  primary: style(palette.primary),
  secondary: style(palette.secondary),
  success: style(palette.success),
  warning: style(palette.warning),
  error: style(palette.error),
  info: style(palette.info),
  accent: style(palette.accent),
  muted: style(palette.muted),
});

export const DefaultColorThemes: Record<string, TerminalColorTheme> = Object.fromEntries(
  Object.entries(DEFAULT_THEME_PALETTES).map(([key, palette]) => [key, createTheme(palette)]),
);

export function ensureThemeIntegrity(
  candidate: unknown,
  fallback: TerminalColorTheme = DefaultColorThemes.default,
): ThemeIntegrityResult {
  const issues: string[] = [];

  if (!TypeGuards.isPlainObject(candidate)) {
    return {
      theme: fallback,
      resetRequired: true,
      issues: ['theme is not a plain object'],
    };
  }

  const themeCandidate = candidate as Partial<TerminalColorTheme> & Record<string, unknown>;
  const requiredFunctions: (keyof TerminalColorTheme)[] = [
    'primary',
    'secondary',
    'success',
    'warning',
    'error',
    'info',
    'accent',
    'muted',
  ];

  for (const key of requiredFunctions) {
    if (!TypeGuards.isFunction(themeCandidate[key])) {
      issues.push(String(key));
    }
  }

  if (!TypeGuards.isNonEmptyString(themeCandidate.name)) {
    issues.push('name');
  }

  if (issues.length > 0) {
    return {
      theme: fallback,
      resetRequired: true,
      issues,
    };
  }

  return {
    theme: themeCandidate as TerminalColorTheme,
    resetRequired: false,
    issues,
  };
}
