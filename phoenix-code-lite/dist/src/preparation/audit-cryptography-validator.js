"use strict";
/**
 * Audit Cryptography Validator
 *
 * Validates cryptographic functions specifically for QMS audit trails
 * and immutable record keeping
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditCryptographyValidator = void 0;
const crypto = __importStar(require("crypto"));
const forge = __importStar(require("node-forge"));
class AuditCryptographyValidator {
    /**
     * Test immutable hash generation for audit trails
     */
    async testImmutableHash() {
        try {
            const auditData = {
                timestamp: new Date().toISOString(),
                action: 'QMS_DOCUMENT_PROCESSED',
                documentId: 'EN62304-2006+A1-2015',
                processor: 'QMS_System',
                version: '1.0.0'
            };
            // Create immutable hash
            const dataString = JSON.stringify(auditData, Object.keys(auditData).sort());
            const hash = crypto.createHash('sha256').update(dataString).digest('hex');
            // Verify hash is deterministic
            const hash2 = crypto.createHash('sha256').update(dataString).digest('hex');
            if (hash !== hash2) {
                throw new Error('Hash is not deterministic');
            }
            return {
                success: true,
                hash
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Immutable hash test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Test audit trail integrity verification
     */
    async testAuditTrailIntegrity() {
        try {
            // Create sample audit trail
            const auditTrail = [
                {
                    id: '1',
                    timestamp: new Date().toISOString(),
                    action: 'DOCUMENT_LOADED',
                    hash: crypto.createHash('sha256').update('DOCUMENT_LOADED').digest('hex')
                },
                {
                    id: '2',
                    timestamp: new Date().toISOString(),
                    action: 'REQUIREMENTS_EXTRACTED',
                    hash: crypto.createHash('sha256').update('REQUIREMENTS_EXTRACTED').digest('hex')
                },
                {
                    id: '3',
                    timestamp: new Date().toISOString(),
                    action: 'COMPLIANCE_VALIDATED',
                    hash: crypto.createHash('sha256').update('COMPLIANCE_VALIDATED').digest('hex')
                }
            ];
            // Verify integrity of each entry
            let integrity = true;
            for (const entry of auditTrail) {
                const expectedHash = crypto.createHash('sha256').update(entry.action).digest('hex');
                if (entry.hash !== expectedHash) {
                    integrity = false;
                    break;
                }
            }
            return {
                success: true,
                integrity
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Audit trail integrity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Test digital signature for audit trail entries
     */
    async testAuditTrailSignature() {
        try {
            const auditEntry = {
                id: 'QMS_AUDIT_001',
                timestamp: new Date().toISOString(),
                action: 'REQUIREMENT_PROCESSED',
                documentId: 'EN62304-2006+A1-2015',
                requirementId: '4.1.1'
            };
            // Generate key pair for signing
            const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
            // Create signature
            const dataString = JSON.stringify(auditEntry);
            const md = forge.md.sha256.create();
            md.update(dataString, 'utf8');
            const signature = keypair.privateKey.sign(md);
            // Verify signature
            const verification = keypair.publicKey.verify(md.digest().bytes(), signature);
            return {
                success: true,
                signature: forge.util.encode64(signature),
                verification
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Audit trail signature test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    /**
     * Test chain of custody for audit trail
     */
    async testChainOfCustody() {
        try {
            // Create chain of custody entries
            const chain = [
                { step: 1, action: 'DOCUMENT_RECEIVED', hash: '' },
                { step: 2, action: 'DOCUMENT_PROCESSED', hash: '' },
                { step: 3, action: 'REQUIREMENTS_EXTRACTED', hash: '' },
                { step: 4, action: 'COMPLIANCE_VALIDATED', hash: '' }
            ];
            // Calculate chain hashes
            let previousHash = '';
            for (const entry of chain) {
                const data = `${entry.step}:${entry.action}:${previousHash}`;
                entry.hash = crypto.createHash('sha256').update(data).digest('hex');
                previousHash = entry.hash;
            }
            // Verify chain integrity
            let chainIntegrity = true;
            previousHash = '';
            for (const entry of chain) {
                const data = `${entry.step}:${entry.action}:${previousHash}`;
                const expectedHash = crypto.createHash('sha256').update(data).digest('hex');
                if (entry.hash !== expectedHash) {
                    chainIntegrity = false;
                    break;
                }
                previousHash = entry.hash;
            }
            return {
                success: true,
                chainIntegrity
            };
        }
        catch (error) {
            return {
                success: false,
                error: `Chain of custody test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
}
exports.AuditCryptographyValidator = AuditCryptographyValidator;
//# sourceMappingURL=audit-cryptography-validator.js.map