import { jest } from '@jest/globals';
import {
  LoggerConfig,
  type LoggerConfiguration,
  LogLevel,
  type LogRecord
} from '../../../utils/logger';

export const MANUAL_OVERRIDE_LOGGER_GUARDRAIL_MESSAGE =
  'Logger guardrail violation (manual override suites)';
export const BACKEND_VALIDATION_LOGGER_GUARDRAIL_MESSAGE =
  'Logger guardrail violation (backend validation suites)';

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

export interface LoggerGuardrailSession {
  evaluate(): Error | null;
  restore(): void;
}

type ConsoleSpy = {
  mock: { calls: unknown[][] };
  mockRestore(): void;
};

function describeViolations(
  spies: Array<{ label: string; spy: ConsoleSpy }>
): string | null {
  const violations = spies
    .map(({ label, spy }) => ({ label, calls: spy.mock.calls.length }))
    .filter(entry => entry.calls > 0);

  if (violations.length === 0) {
    return null;
  }

  return violations
    .map(({ label, calls }) => `${label} called ${calls} time${calls === 1 ? '' : 's'}`)
    .join('; ');
}

function createLoggerGuardrailSession(message: string): LoggerGuardrailSession {
  const originalConfiguration: LoggerConfiguration = LoggerConfig.getConfiguration();
  LoggerConfig.useTransport({
    log(_: LogRecord): void {
      // swallow logger output during guardrail execution
    }
  });
  LoggerConfig.setLevel(LogLevel.DEBUG);
  LoggerConfig.disableStructuredLogging();

  const spies: Array<{ label: string; spy: ConsoleSpy }> = CONSOLE_METHODS.map(method => ({
    label: LABELS[method],
    spy: jest.spyOn(console, method).mockImplementation(() => undefined) as unknown as ConsoleSpy
  }));

  return {
    evaluate(): Error | null {
      const violationDetails = describeViolations(spies);
      if (!violationDetails) {
        return null;
      }

      return new Error(`${message}: ${violationDetails}`);
    },
    restore(): void {
      spies.forEach(({ spy }) => spy.mockRestore());
      LoggerConfig.useTransport(originalConfiguration.transport);
      if (originalConfiguration.structured) {
        LoggerConfig.useStructuredLogging(originalConfiguration.serializer);
      } else {
        LoggerConfig.disableStructuredLogging();
      }
      LoggerConfig.setLevel(originalConfiguration.level);
    }
  };
}

export function createBackendLoggerGuardrail(): LoggerGuardrailSession {
  return createLoggerGuardrailSession(BACKEND_VALIDATION_LOGGER_GUARDRAIL_MESSAGE);
}

export async function withManualOverrideLoggerGuardrail<T>(
  callback: GuardrailCallback<T>
): Promise<T> {
  const guardrail = createLoggerGuardrailSession(MANUAL_OVERRIDE_LOGGER_GUARDRAIL_MESSAGE);

  try {
    const result = await callback();
    const violation = guardrail.evaluate();
    if (violation) {
      throw violation;
    }

    return result;
  } finally {
    guardrail.restore();
  }
}
