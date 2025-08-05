/**
 * Cryptographic Library Validator
 *
 * Validates cryptographic libraries availability and functionality
 * for QMS digital signatures and audit trails
 */
export interface DigitalSignatureResult {
    success: boolean;
    signature?: string;
    verification?: boolean;
    error?: string;
}
export declare class CryptoLibraryValidator {
    /**
     * Check if cryptographic libraries are available
     */
    checkCryptoLibraries(): Promise<boolean>;
    /**
     * Test digital signature capability
     */
    testDigitalSignature(): Promise<DigitalSignatureResult>;
    /**
     * Test hash generation for audit trails
     */
    testHashGeneration(): Promise<{
        success: boolean;
        hash?: string;
        error?: string;
    }>;
    /**
     * Test encryption/decryption for secure audit trails
     */
    testEncryption(): Promise<{
        success: boolean;
        encrypted?: string;
        decrypted?: string;
        error?: string;
    }>;
}
//# sourceMappingURL=crypto-library-validator.d.ts.map