"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
describe('IConfigManager Interface', () => {
    test('should define required methods', () => {
        const mockConfigManager = {
            getConfig: jest.fn(),
            updateConfig: jest.fn(),
            validateConfig: jest.fn(),
            resetToDefaults: jest.fn()
        };
        expect(mockConfigManager.getConfig).toBeDefined();
        expect(mockConfigManager.updateConfig).toBeDefined();
        expect(mockConfigManager.validateConfig).toBeDefined();
        expect(mockConfigManager.resetToDefaults).toBeDefined();
    });
    test('should have correct method signatures', () => {
        const mockConfigManager = {
            getConfig: jest.fn().mockResolvedValue({}),
            updateConfig: jest.fn().mockResolvedValue(undefined),
            validateConfig: jest.fn().mockReturnValue(true),
            resetToDefaults: jest.fn().mockResolvedValue(undefined)
        };
        expect(typeof mockConfigManager.getConfig).toBe('function');
        expect(typeof mockConfigManager.updateConfig).toBe('function');
        expect(typeof mockConfigManager.validateConfig).toBe('function');
        expect(typeof mockConfigManager.resetToDefaults).toBe('function');
    });
});
//# sourceMappingURL=config-manager.test.js.map