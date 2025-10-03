import { DisplayUtils, type DisplayUtilsDependencies } from './display-utils';
import { WindowUtils, type WindowUtilsDependencies } from './window-utils';
import {
  configureFormatter,
  resetFormatterConfiguration,
  type ConfigureFormatterOptions,
} from './terminal-formatter';

export interface DisplayStackConfiguration {
  columnsProvider?: DisplayUtilsDependencies['columnsProvider'];
  formatter?: WindowUtilsDependencies['formatter'];
  displayFormatter?: DisplayUtilsDependencies['formatter'];
  displayLogger?: DisplayUtilsDependencies['logger'];
  windowLogger?: WindowUtilsDependencies['logger'];
  formatterOptions?: ConfigureFormatterOptions;
}

export const configureDisplayStack = (
  configuration: DisplayStackConfiguration = {},
): void => {
  if (configuration.formatterOptions) {
    configureFormatter(configuration.formatterOptions);
  }

  const displayDependencies: DisplayUtilsDependencies = {};

  if (configuration.columnsProvider) {
    displayDependencies.columnsProvider = configuration.columnsProvider;
  }

  const displayFormatter = configuration.displayFormatter ?? configuration.formatter;
  if (displayFormatter) {
    displayDependencies.formatter = displayFormatter;
  }

  if (configuration.displayLogger) {
    displayDependencies.logger = configuration.displayLogger;
  }

  if (Object.keys(displayDependencies).length > 0) {
    DisplayUtils.configure(displayDependencies);
  }

  const windowDependencies: WindowUtilsDependencies = {};
  const windowLogger = configuration.windowLogger ?? configuration.displayLogger;

  if (windowLogger) {
    windowDependencies.logger = windowLogger;
  }

  if (configuration.formatter) {
    windowDependencies.formatter = configuration.formatter;
  }

  if (Object.keys(windowDependencies).length > 0) {
    WindowUtils.configure(windowDependencies);
  }
};

export const resetDisplayStack = (): void => {
  resetFormatterConfiguration();
  DisplayUtils.reset();
  WindowUtils.reset();
};
