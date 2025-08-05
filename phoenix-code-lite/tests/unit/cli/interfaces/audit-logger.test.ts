import { IAuditLogger } from '../../../../src/cli/interfaces/audit-logger';

describe('IAuditLogger Interface', () => {
  test('should define required methods', () => {
    const mockAuditLogger: IAuditLogger = {
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
    const mockAuditLogger: IAuditLogger = {
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