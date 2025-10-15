/**
 * Ensures the node-pty mock remains compatible with CommonJS require flows.
 */

describe('node-pty-types CommonJS compatibility', () => {
  afterEach(() => {
    jest.resetModules();
  });

  test('exports spawn via require without default indirection', () => {
    jest.isolateModules(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const cjsModule = require('../node-pty-types') as typeof import('../node-pty-types');
      const pty = cjsModule.spawn('bash', [], {});

      expect(typeof cjsModule.spawn).toBe('function');
      expect(pty.write).toBeDefined();
      expect(pty.kill).toBeDefined();
    });
  });
});
