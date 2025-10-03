/**---
 * title: [Templum Config Manager Guard Tests]
 * tags: [Testing, Core, Configuration, Guards]
 * provides: [Guard behaviour regression tests for TemplumConfigManager]
 * requires: [Jest, TemplumConfigManager]
 * description: [Validates that configuration manager enforces consolidated guard utilities when registering callbacks.]
 * ---*/

import { TemplumConfigManager } from '../../src/core/templum-config-manager';

describe('TemplumConfigManager guard rails', () => {
  let manager: TemplumConfigManager;

  beforeEach(() => {
    manager = new TemplumConfigManager('/tmp/templum-config-manager-guards.json');
  });

  test('rejects non-function callbacks', () => {
    expect(() => manager.onConfigChange('invalid', {} as any)).toThrow(/callback must be a function/i);
  });

  test('accepts valid callbacks', () => {
    expect(() => manager.onConfigChange('valid', jest.fn())).not.toThrow();
  });
});
