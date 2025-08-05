/**
 * Cryptographic Library Validator
 * 
 * Validates cryptographic libraries availability and functionality
 * for QMS digital signatures and audit trails
 */

import * as crypto from 'crypto';
import * as forge from 'node-forge';

export interface DigitalSignatureResult {
  success: boolean;
  signature?: string;
  verification?: boolean;
  error?: string;
}

export class CryptoLibraryValidator {
  
  /**
   * Check if cryptographic libraries are available
   */
  async checkCryptoLibraries(): Promise<boolean> {
    try {
      // Test Node.js crypto module
      const testData = 'QMS Crypto Test';
      const hash = crypto.createHash('sha256').update(testData).digest('hex');
      
      if (!hash || hash.length !== 64) {
        throw new Error('Hash generation failed');
      }
      
      // Test node-forge library
      const md = forge.md.sha256.create();
      md.update(testData, 'utf8');
      const forgeHash = md.digest().toHex();
      
      if (!forgeHash || forgeHash.length !== 64) {
        throw new Error('Forge hash generation failed');
      }
      
      return true;
    } catch (error) {
      console.error('Cryptographic libraries check failed:', error);
      return false;
    }
  }
  
  /**
   * Test digital signature capability
   */
  async testDigitalSignature(): Promise<DigitalSignatureResult> {
    try {
      const testData = 'QMS Digital Signature Test';
      
      // Generate key pair
      const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048 });
      
      // Create signature
      const md = forge.md.sha256.create();
      md.update(testData, 'utf8');
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
        error: `Digital signature test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Test hash generation for audit trails
   */
  async testHashGeneration(): Promise<{ success: boolean; hash?: string; error?: string }> {
    try {
      const testData = 'QMS Audit Trail Test Data';
      
      // Generate SHA-256 hash
      const hash = crypto.createHash('sha256').update(testData).digest('hex');
      
      // Verify hash format
      if (!hash || hash.length !== 64) {
        throw new Error('Invalid hash format');
      }
      
      return {
        success: true,
        hash
      };
    } catch (error) {
      return {
        success: false,
        error: `Hash generation test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
  
  /**
   * Test encryption/decryption for secure audit trails
   */
  async testEncryption(): Promise<{ success: boolean; encrypted?: string; decrypted?: string; error?: string }> {
    try {
      const testData = 'QMS Secure Audit Trail Data';
      
      // Generate AES key
      const key = crypto.randomBytes(32);
      const iv = crypto.randomBytes(16);
      
      // Encrypt
      const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
      let encrypted = cipher.update(testData, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      // Decrypt
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      // Verify
      if (decrypted !== testData) {
        throw new Error('Encryption/decryption verification failed');
      }
      
      return {
        success: true,
        encrypted,
        decrypted
      };
    } catch (error) {
      return {
        success: false,
        error: `Encryption test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
} 