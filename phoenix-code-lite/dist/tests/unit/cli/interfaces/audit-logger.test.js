"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
describe('IAuditLogger Interface', () => {
    test('should define required methods', () => {
        const mockAuditLogger = {
            log: jest.fn(),
            flush: jest.fn(),
            destroy: jest.fn(),
            getMetrics: jest.fn()
        };
        expect(mockAuditLogger.log).toBeDefined();
        expect(mockAuditLogger.flush).toBeDefined();
        expect(mockAuditLogger.destroy).toBeDefined();
        expect(mockAuditLogger.getMetrics).toBeDefined();
    });
    test('should have correct method signatures', () => {
        const mockAuditLogger = {
            log: jest.fn(),
            flush: jest.fn().mockResolvedValue(undefined),
            destroy: jest.fn().mockResolvedValue(undefined),
            getMetrics: jest.fn().mockResolvedValue({})
        };
        expect(typeof mockAuditLogger.log).toBe('function');
        expect(typeof mockAuditLogger.flush).toBe('function');
        expect(typeof mockAuditLogger.destroy).toBe('function');
        expect(typeof mockAuditLogger.getMetrics).toBe('function');
    });
});
//# sourceMappingURL=audit-logger.test.js.map