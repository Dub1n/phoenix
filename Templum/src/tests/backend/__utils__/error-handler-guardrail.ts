import { jest } from '@jest/globals';
import { ErrorHandler } from '../../../utils/error-handler';

interface ErrorHandlerGuardrailOptions {
  expectedContext: string | RegExp;
  lane: '4d';
  scenario: string;
}

export async function withErrorHandlerGuardrail(
  action: () => Promise<unknown>,
  options: ErrorHandlerGuardrailOptions
): Promise<void> {
  const handleSpy = jest.spyOn(ErrorHandler, 'handle');

  try {
    await action();
  } finally {
    const calls = handleSpy.mock.calls;
    handleSpy.mockRestore();

    const matchedCall = calls.find(([, context]) => {
      if (typeof options.expectedContext === 'string') {
        return context.includes(options.expectedContext);
      }

      return options.expectedContext.test(context);
    });

    if (!matchedCall) {
      const observedContexts =
        calls.length === 0
          ? 'none'
          : calls
              .map(([, context]) => (typeof context === 'string' ? context : String(context)))
              .join(', ');

      const signature =
        `[ERROR_HANDLER_GUARDRAIL lane=${options.lane}] ${options.scenario} expected ErrorHandler.handle context matching ` +
        `${String(options.expectedContext)}, observed: ${observedContexts}`;

      console.error(signature);
      throw new Error(signature);
    }
  }
}
