import { UniversalSkinEngine } from '../../src/skin/universal-skin-engine-impl';
import { UniversalSkinDefinition } from '../../src/types/templum-types';
import { validateSkinDefinition } from '../../src/validation/skin-validator';
import { createTestPCLSkinDefinition } from './universal-skin-system.test';

describe('Universal Skin Contract Enforcement', () => {
  let engine: UniversalSkinEngine;

  beforeEach(() => {
    engine = new UniversalSkinEngine();
  });

  const cloneSkin = (skin: UniversalSkinDefinition): UniversalSkinDefinition =>
    JSON.parse(JSON.stringify(skin));

  test('rejects skins missing required metadata via schema validation', async () => {
    const invalidSkin = cloneSkin(createTestPCLSkinDefinition());
    delete (invalidSkin.metadata as any).backendService;

    const failureSpy = jest.fn();
    engine.on('skinRegistrationFailed', failureSpy);

    await expect(engine.registerSkin(invalidSkin)).rejects.toThrow(/Skin validation failed/);

    expect(failureSpy).toHaveBeenCalled();
    const payload = failureSpy.mock.calls[0][0];
    expect(payload.validationErrors).toEqual(
      expect.arrayContaining([expect.stringContaining('metadata.backendService')])
    );
  });

  test('emits schema version when registration succeeds', async () => {
    const validSkin = cloneSkin(createTestPCLSkinDefinition());
    const registered = new Promise<any>(resolve => engine.once('skinRegistered', resolve));

    await expect(engine.registerSkin(validSkin)).resolves.toBeUndefined();

    const payload = await registered;
    expect(payload.schemaVersion).toBe('1.0.0');
    expect(payload.validationWarnings).toBeDefined();
  });

  test('schema version mismatch fails validation', () => {
    const validSkin = cloneSkin(createTestPCLSkinDefinition());
    const result = validateSkinDefinition(validSkin, {
      expectedValidatorVersion: '2.0.0'
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([expect.stringContaining('Schema version mismatch')])
    );
  });
});
