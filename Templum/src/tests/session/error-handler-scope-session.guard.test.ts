import { readFileSync } from 'fs';
import { join } from 'path';

const sessionManagerSource = readFileSync(
  join(__dirname, '../../session/templum-universal-session-manager.ts'),
  'utf8'
);

const cliAdapterSource = readFileSync(
  join(__dirname, '../../interfaces/cli-adapter-abstracted.ts'),
  'utf8'
);

describe('ErrorHandler scope guardrail (session layer)', () => {
  it('requires session manager to adopt scoped error handling', () => {
    expect(sessionManagerSource).toMatch(/ErrorHandler\.scope\([^)]*['"]session-manager/);
    expect(sessionManagerSource).toMatch(/ErrorHandler\.formatContext\([^)]*['"]session-manager/);
    expect(sessionManagerSource).not.toMatch(/ErrorHandler\.handle\([^)]*['"]session-manager\./);
  });

  it('requires CLI adapter to adopt scoped error handling', () => {
    expect(cliAdapterSource).toMatch(/ErrorHandler\.scope\([^)]*['"]interfaces\.cli-adapter/);
    expect(cliAdapterSource).toMatch(/ErrorHandler\.formatContext\([^)]*['"]interfaces\.cli-adapter/);
    expect(cliAdapterSource).not.toMatch(/ErrorHandler\.handle\([^)]*['"]interfaces\.cli-adapter\./);
  });
});
