import { readFileSync } from 'fs';
import { resolve } from 'path';

const guardrailPattern = /ErrorHandler\.scope\(\s*ErrorHandler\.formatContext\(/;

describe('Pattern 2 Stage 4h guardrail', () => {
  const guardrailCases: Array<[string, string]> = [
    ['Templum Core orchestration', 'templum-core.ts'],
    ['Adapter registry container', 'adapter-registry.ts']
  ];

  it.each(guardrailCases)(
    'requires %s to wire ErrorHandler.scope(ErrorHandler.formatContext(...))',
    (_description, filename) => {
      const filePath = resolve(__dirname, '../../core', filename);
      const contents = readFileSync(filePath, 'utf8');

      if (!guardrailPattern.test(contents)) {
        throw new Error(
          `Expected ${filename} to call ErrorHandler.scope(ErrorHandler.formatContext(...)) so Stage 6 lane 6h can migrate catch blocks onto scoped handlers.`
        );
      }
    }
  );
});
