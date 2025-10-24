/**---
 * title: Phase 6 Validation CLI Backend Toggle Tests
 * tags: [Phase-6, CLI, Backend-Toggle, Jest]
 * provides: [Phase6ValidationCLITests]
 * requires: [Phase6ValidationCLI]
 * description: Covers environment flag handling for mock vs real backend execution so the new dual-run automation can rely on deterministic toggles
 * ---*/

import * as fs from 'fs';
import * as path from 'path';
import { Phase6ValidationCLI } from '../../src/scripts/run-phase6-integration-validation';
import { BACKEND_VALIDATION_LOGGER_GUARDRAIL_MESSAGE } from '../../src/tests/backend/__utils__/logger-guardrail';

const resetEnv = (keys: string[]) => {
  for (const key of keys) {
    delete process.env[key];
  }
};

describe('Phase6ValidationCLI backend selection', () => {
  const trackedEnv = ['PHASE6_USE_REAL_BACKENDS', 'PHASE6_SKIP_HARUSPEX'];
  const originalEnv: Record<string, string | undefined> = {};

  beforeAll(() => {
    for (const key of trackedEnv) {
      originalEnv[key] = process.env[key];
    }
  });

  afterAll(() => {
    for (const key of trackedEnv) {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    }
  });

  beforeEach(() => {
    resetEnv(trackedEnv);
  });

  it('defaults to mock backends and sets env flags accordingly', () => {
    const cli = new Phase6ValidationCLI();
    const configureBackendEnv = (cli as any).configureBackendEnv.bind(cli);

    configureBackendEnv(false);

    expect(process.env.PHASE6_USE_REAL_BACKENDS).toBe('0');
    expect(process.env.PHASE6_SKIP_HARUSPEX).toBe('1');
  });

  it('enables real backends when requested via options', () => {
    const cli = new Phase6ValidationCLI();
    const shouldUseRealBackends = (cli as any).shouldUseRealBackends.bind(cli);
    const configureBackendEnv = (cli as any).configureBackendEnv.bind(cli);

    expect(shouldUseRealBackends({ useRealBackends: true })).toBe(true);

    configureBackendEnv(true);

    expect(process.env.PHASE6_USE_REAL_BACKENDS).toBe('1');
    expect(process.env.PHASE6_SKIP_HARUSPEX).toBe('0');
  });

  it('falls back to environment flag when CLI option is absent', () => {
    process.env.PHASE6_USE_REAL_BACKENDS = '1';
    const cli = new Phase6ValidationCLI();
    const shouldUseRealBackends = (cli as any).shouldUseRealBackends.bind(cli);

    expect(shouldUseRealBackends({})).toBe(true);
  });
});

describe('Phase6ValidationCLI guardrails — error handler consolidation', () => {
  const readSource = (relativePath: string): string =>
    fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');

  it('rejects manual catch blocks that call console.error in the CLI implementation', () => {
    const cliSource = readSource('../../src/scripts/run-phase6-integration-validation.ts');
    const catchBlocks = cliSource.match(/catch\s*\([^)]*\)\s*{[\s\S]*?}/g) ?? [];
    const manualConsoleCatches = catchBlocks.filter((block) =>
      block.includes('console.error')
    );

    expect(manualConsoleCatches).toHaveLength(0);
  });

  it('disallows direct process.exit usage in the Phase 6 orchestrator script', () => {
    const orchestratorSource = readSource('../../scripts/run-phase6-full.js');
    const directProcessExit = orchestratorSource.includes('process.exit(');

    expect(directProcessExit).toBe(false);
  });

  it('flags console usage in the Phase 6 dual-run orchestrator until logger migration lands', () => {
    const orchestratorSource = readSource('../../scripts/run-phase6-full.js');
    const consoleUsageMatches = orchestratorSource.match(/console\.(log|warn|error)/g) ?? [];

    if (consoleUsageMatches.length > 0) {
      throw new Error(
        `${BACKEND_VALIDATION_LOGGER_GUARDRAIL_MESSAGE}: scripts/run-phase6-full.js uses console.* (${consoleUsageMatches.join(', ')})`
      );
    }
  });
});
