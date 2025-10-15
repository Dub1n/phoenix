/**
 * Centralised coverage threshold definitions so configs, scripts, and docs stay in sync.
 */

const coverageThresholds = {
  unit: {
    statements: 30,
    branches: 22,
    functions: 30,
    lines: 30
  },
  backend: {
    statements: 20,
    branches: 12,
    functions: 20,
    lines: 20
  },
  guardrailInterfaceAdapter: {
    statements: 20,
    branches: 5,
    functions: 20,
    lines: 20
  },
  e2e: {
    statements: 35,
    branches: 12,
    functions: 30,
    lines: 35
  },
  aggregate: {
    statements: 32,
    branches: 22,
    functions: 32,
    lines: 32
  }
};

module.exports = {
  coverageThresholds
};
