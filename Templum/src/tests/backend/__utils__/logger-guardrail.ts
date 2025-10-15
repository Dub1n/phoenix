import { jest } from '@jest/globals';
import { LoggerConfig, type LoggerConfiguration, LogLevel, type LogRecord } from '../../../utils/logger';

export const MANUAL_OVERRIDE_LOGGER_GUARDRAIL_MESSAGE =
  'Logger guardrail violation (manual override suites)';

type GuardrailCallback<T> = () => T | Promise<T>;

const CONSOLE_METHODS = ['log', 'info', 'warn', 'error', 'debug'] as const;

type ConsoleMethod = (typeof CONSOLE_METHODS)[number];

const LABELS: Record<ConsoleMethod, string> = {
  log: 'console.log',
  info: 'console.info',
  warn: 'console.warn',
  error: 'console.error',
  debug: 'console.debug'
};

export async function withManualOverrideLoggerGuardrail<T>(
  callback: GuardrailCallback<T>
): Promise<T> {
  const originalConfiguration: LoggerConfiguration = LoggerConfig.getConfiguration();
  LoggerConfig.useTransport({
    log(_: LogRecord): void {
      // swallow logger output during guardrail execution
    }
  });
  LoggerConfig.setLevel(LogLevel.DEBUG);
  LoggerConfig.disableStructuredLogging();

  const spies = CONSOLE_METHODS.map(method => ({
    label: LABELS[method],
    spy: jest.spyOn(console, method).mockImplementation(() => undefined)
  }));

  try {
    const result = await callback();
    const violations = spies
      .map(({ label, spy }) => ({ label, calls: spy.mock.calls.length }))
      .filter(entry => entry.calls > 0);

    if (violations.length > 0) {
      const details = violations
        .map(({ label, calls }) => `${label} called ${calls} time${calls === 1 ? '' : 's'}`)
        .join('; ');
      throw new Error(`${MANUAL_OVERRIDE_LOGGER_GUARDRAIL_MESSAGE}: ${details}`);
    }

    return result;
  } finally {
    spies.forEach(({ spy }) => spy.mockRestore());
    LoggerConfig.useTransport(originalConfiguration.transport);
    if (originalConfiguration.structured) {
      LoggerConfig.useStructuredLogging(originalConfiguration.serializer);
    } else {
      LoggerConfig.disableStructuredLogging();
    }
    LoggerConfig.setLevel(originalConfiguration.level);
  }
}
