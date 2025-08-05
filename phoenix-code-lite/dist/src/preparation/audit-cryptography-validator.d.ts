/**
 * Audit Cryptography Validator
 *
 * Validates cryptographic functions specifically for QMS audit trails
 * and immutable record keeping
 */
export interface AuditTrailIntegrityResult {
    success: boolean;
    integrity?: boolean;
    error?: string;
}
export interface ImmutableHashResult {
    success: boolean;
    hash?: string;
    error?: string;
}
export declare class AuditCryptographyValidator {
    /**
     * Test immutable hash generation for audit trails
     */
    testImmutableHash(): Promise<ImmutableHashResult>;
    /**
     * Test audit trail integrity verification
     */
    testAuditTrailIntegrity(): Promise<AuditTrailIntegrityResult>;
    /**
     * Test digital signature for audit trail entries
     */
    testAuditTrailSignature(): Promise<{
        success: boolean;
        signature?: string;
        verification?: boolean;
        error?: string;
    }>;
    /**
     * Test chain of custody for audit trail
     */
    testChainOfCustody(): Promise<{
        success: boolean;
        chainIntegrity?: boolean;
        error?: string;
    }>;
}
//# sourceMappingURL=audit-cryptography-validator.d.ts.map