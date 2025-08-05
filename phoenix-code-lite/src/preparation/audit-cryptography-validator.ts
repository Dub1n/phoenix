/**
 * Audit Cryptography Validator
 * 
 * Validates cryptographic functions specifically for QMS audit trails
 * and immutable record keeping
 */

import * as crypto from 'crypto';
import * as forge from 'node-forge';

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

export class AuditCryptographyValidator {
  
  /**
   * Test immutable hash generation for audit trails
   */
  async testImmutableHash(): Promise<ImmutableHashResult> {
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
    } catch (error) {
      return {
        success: false,
        error: `Immutable hash test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Test audit trail integrity verification
   */
  async testAuditTrailIntegrity(): Promise<AuditTrailIntegrityResult> {
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
    } catch (error) {
      return {
        success: false,
        error: `Audit trail integrity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Test digital signature for audit trail entries
   */
  async testAuditTrailSignature(): Promise<{ success: boolean; signature?: string; verification?: boolean; error?: string }> {
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
    } catch (error) {
      return {
        success: false,
        error: `Audit trail signature test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Test chain of custody for audit trail
   */
  async testChainOfCustody(): Promise<{ success: boolean; chainIntegrity?: boolean; error?: string }> {
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
    } catch (error) {
      return {
        success: false,
        error: `Chain of custody test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 