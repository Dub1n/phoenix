const baseConfig = require('./jest.config');
const { coverageThresholds } = require('./scripts/coverage-thresholds');

module.exports = {
  ...baseConfig,
  displayName: 'interface-adapter-guardrail',
  collectCoverageFrom: [
    'src/interfaces/vscode-adapter-abstracted.ts'
  ],
  coverageDirectory: '<rootDir>/coverage/interface-adapter-guardrail',
  coverageThreshold: {
    global: coverageThresholds.guardrailInterfaceAdapter,
    'src/interfaces/vscode-adapter-abstracted.ts': coverageThresholds.guardrailInterfaceAdapter
  }
};
