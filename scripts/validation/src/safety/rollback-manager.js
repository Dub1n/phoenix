#!/usr/bin/env node

/**
 * Rollback Manager - Safety Framework Component
 * 
 * Manages safe rollback of validator extensions, including backups,
 * restoration, and validation of rollback operations.
 * 
 * Part of the Enhanced Validation System Safety Framework
 * Version: 3.0.0
 * Date: 2025-09-06
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Rollback Manager implementing IRollbackManager interface
 */
export class RollbackManager {
  constructor(validationPath) {
    this.validationPath = validationPath || path.join(process.cwd(), 'scripts', 'validation');
    this.backupPath = path.join(this.validationPath, 'backups');
    this.extensionsPath = path.join(this.validationPath, 'extensions');
    this.validatorsPath = path.join(this.validationPath, 'validators');
    
    // Ensure backup directory exists
    this.ensureBackupDirectory();
  }

  /**
   * Create backup of current validation system state
   */
  async createBackup(category = null) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = category ? `${category}-${timestamp}` : `full-system-${timestamp}`;
    const backupDir = path.join(this.backupPath, backupId);

    try {
      // Create backup directory
      await fs.promises.mkdir(backupDir, { recursive: true });

      const backupManifest = {
        backupId,
        timestamp,
        category,
        type: category ? 'validator-specific' : 'full-system',
        files: [],
        validationPath: this.validationPath
      };

      if (category) {
        // Backup specific validator and related files
        await this.backupValidator(category, backupDir, backupManifest);
      } else {
        // Full system backup
        await this.backupFullSystem(backupDir, backupManifest);
      }

      // Save backup manifest
      const manifestPath = path.join(backupDir, 'backup-manifest.json');
      await fs.promises.writeFile(
        manifestPath, 
        JSON.stringify(backupManifest, null, 2), 
        'utf8'
      );

      console.log(`✅ Backup created successfully: ${backupId}`);
      return backupDir;

    } catch (error) {
      console.error(`❌ Backup creation failed: ${error.message}`);
      throw new Error(`Backup creation failed: ${error.message}`);
    }
  }

  /**
   * Rollback a specific extension
   */
  async rollbackExtension(category) {
    const rollbackResult = {
      success: false,
      filesRemoved: [],
      registryUpdated: false,
      backupRestored: false,
      error: null
    };

    try {
      console.log(`🔄 Starting rollback for extension: ${category}`);

      // Find the most recent backup for this category
      const backup = await this.findLatestBackup(category);
      if (!backup) {
        throw new Error(`No backup found for category: ${category}`);
      }

      console.log(`📦 Using backup: ${backup.backupId}`);

      // Remove current extension files
      const extensionFiles = await this.findExtensionFiles(category);
      for (const filePath of extensionFiles) {
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
          rollbackResult.filesRemoved.push(filePath);
          console.log(`🗑️ Removed: ${path.basename(filePath)}`);
        }
      }

      // Restore from backup if it contains files for this category
      if (backup.files.length > 0) {
        rollbackResult.backupRestored = await this.restoreFromBackup(backup.backupPath);
        if (rollbackResult.backupRestored) {
          console.log('📁 Files restored from backup');
        }
      }

      // Update capability matrix to remove the extension
      rollbackResult.registryUpdated = await this.updateCapabilityMatrix(category, 'remove');

      // Update extension history
      await this.logExtensionHistory({
        timestamp: new Date().toISOString(),
        action: 'rollback',
        category,
        details: {
          backupUsed: backup.backupId,
          filesRemoved: rollbackResult.filesRemoved.length,
          registryUpdated: rollbackResult.registryUpdated
        },
        success: true
      });

      rollbackResult.success = true;
      console.log(`✅ Rollback completed successfully for: ${category}`);
      
      return rollbackResult;

    } catch (error) {
      rollbackResult.error = error.message;
      console.error(`❌ Rollback failed for ${category}: ${error.message}`);
      
      // Log failed rollback attempt
      await this.logExtensionHistory({
        timestamp: new Date().toISOString(),
        action: 'rollback',
        category,
        details: { error: error.message },
        success: false
      });

      return rollbackResult;
    }
  }

  /**
   * Restore files from a backup
   */
  async restoreFromBackup(backupPath) {
    try {
      const manifestPath = path.join(backupPath, 'backup-manifest.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error('Backup manifest not found');
      }

      const manifest = JSON.parse(await fs.promises.readFile(manifestPath, 'utf8'));
      
      for (const fileInfo of manifest.files) {
        const backupFile = path.join(backupPath, fileInfo.backupName);
        const targetFile = fileInfo.originalPath;
        
        if (fs.existsSync(backupFile)) {
          // Ensure target directory exists
          await fs.promises.mkdir(path.dirname(targetFile), { recursive: true });
          
          // Copy file from backup
          await fs.promises.copyFile(backupFile, targetFile);
          console.log(`📄 Restored: ${path.basename(targetFile)}`);
        }
      }

      return true;

    } catch (error) {
      console.error(`Restore failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Validate that rollback was successful
   */
  async validateRollback(category) {
    try {
      // Check that extension files are removed
      const extensionFiles = await this.findExtensionFiles(category);
      const stillExists = extensionFiles.filter(file => fs.existsSync(file));
      
      if (stillExists.length > 0) {
        console.log(`⚠️ Rollback validation warning: ${stillExists.length} files still exist`);
        return false;
      }

      // Check that capability matrix is updated
      const capabilityMatrix = await this.loadCapabilityMatrix();
      if (capabilityMatrix.categories[category]) {
        console.log(`⚠️ Rollback validation warning: Category still in capability matrix`);
        return false;
      }

      console.log(`✅ Rollback validation passed for: ${category}`);
      return true;

    } catch (error) {
      console.error(`Rollback validation failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Backup a specific validator
   */
  async backupValidator(category, backupDir, manifest) {
    const validatorFile = path.join(this.validatorsPath, `${category}-validator.js`);
    
    if (fs.existsSync(validatorFile)) {
      const backupName = `${category}-validator.js`;
      const backupFile = path.join(backupDir, backupName);
      
      await fs.promises.copyFile(validatorFile, backupFile);
      manifest.files.push({
        originalPath: validatorFile,
        backupName: backupName,
        type: 'validator'
      });
    }

    // Backup related extension files
    const extensionDir = path.join(this.extensionsPath, 'generated');
    if (fs.existsSync(extensionDir)) {
      const extensionFiles = await fs.promises.readdir(extensionDir);
      for (const fileName of extensionFiles) {
        if (fileName.includes(category)) {
          const originalPath = path.join(extensionDir, fileName);
          const backupFile = path.join(backupDir, fileName);
          
          await fs.promises.copyFile(originalPath, backupFile);
          manifest.files.push({
            originalPath,
            backupName: fileName,
            type: 'extension'
          });
        }
      }
    }
  }

  /**
   * Backup full validation system
   */
  async backupFullSystem(backupDir, manifest) {
    // Backup capability matrix
    const capabilityMatrixPath = path.join(this.validationPath, 'capability-matrix.json');
    if (fs.existsSync(capabilityMatrixPath)) {
      await fs.promises.copyFile(
        capabilityMatrixPath, 
        path.join(backupDir, 'capability-matrix.json')
      );
      manifest.files.push({
        originalPath: capabilityMatrixPath,
        backupName: 'capability-matrix.json',
        type: 'configuration'
      });
    }

    // Backup all validators
    if (fs.existsSync(this.validatorsPath)) {
      const validatorFiles = await fs.promises.readdir(this.validatorsPath);
      for (const fileName of validatorFiles) {
        if (fileName.endsWith('-validator.js')) {
          const originalPath = path.join(this.validatorsPath, fileName);
          const backupFile = path.join(backupDir, fileName);
          
          await fs.promises.copyFile(originalPath, backupFile);
          manifest.files.push({
            originalPath,
            backupName: fileName,
            type: 'validator'
          });
        }
      }
    }

    // Backup extension files
    const extensionDir = path.join(this.extensionsPath, 'generated');
    if (fs.existsSync(extensionDir)) {
      const extensionFiles = await fs.promises.readdir(extensionDir);
      for (const fileName of extensionFiles) {
        const originalPath = path.join(extensionDir, fileName);
        const backupFile = path.join(backupDir, fileName);
        
        await fs.promises.copyFile(originalPath, backupFile);
        manifest.files.push({
          originalPath,
          backupName: fileName,
          type: 'extension'
        });
      }
    }
  }

  /**
   * Find extension files for a category
   */
  async findExtensionFiles(category) {
    const files = [];
    
    // Validator file
    const validatorFile = path.join(this.validatorsPath, `${category}-validator.js`);
    if (fs.existsSync(validatorFile)) {
      files.push(validatorFile);
    }

    // Extension files
    const extensionDir = path.join(this.extensionsPath, 'generated');
    if (fs.existsSync(extensionDir)) {
      const extensionFiles = await fs.promises.readdir(extensionDir);
      for (const fileName of extensionFiles) {
        if (fileName.includes(category)) {
          files.push(path.join(extensionDir, fileName));
        }
      }
    }

    return files;
  }

  /**
   * Find the latest backup for a category
   */
  async findLatestBackup(category) {
    try {
      const backups = await fs.promises.readdir(this.backupPath);
      const categoryBackups = backups.filter(backup => 
        backup.startsWith(category) || backup.startsWith('full-system')
      );

      if (categoryBackups.length === 0) {
        return null;
      }

      // Sort by timestamp (latest first)
      categoryBackups.sort((a, b) => b.localeCompare(a));
      const latestBackup = categoryBackups[0];
      const backupPath = path.join(this.backupPath, latestBackup);

      // Load manifest
      const manifestPath = path.join(backupPath, 'backup-manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(await fs.promises.readFile(manifestPath, 'utf8'));
        return {
          ...manifest,
          backupPath
        };
      }

      return {
        backupId: latestBackup,
        backupPath,
        files: []
      };

    } catch (error) {
      console.error(`Error finding backup: ${error.message}`);
      return null;
    }
  }

  /**
   * Update capability matrix to add or remove categories
   */
  async updateCapabilityMatrix(category, action = 'remove') {
    try {
      const capabilityMatrix = await this.loadCapabilityMatrix();
      
      if (action === 'remove') {
        if (capabilityMatrix.categories[category]) {
          delete capabilityMatrix.categories[category];
          capabilityMatrix.metadata.lastUpdated = new Date().toISOString();
          capabilityMatrix.metadata.totalExtensions = Math.max(0, capabilityMatrix.metadata.totalExtensions - 1);
        }
      }
      
      await this.saveCapabilityMatrix(capabilityMatrix);
      return true;

    } catch (error) {
      console.error(`Failed to update capability matrix: ${error.message}`);
      return false;
    }
  }

  /**
   * Load capability matrix
   */
  async loadCapabilityMatrix() {
    const capabilityPath = path.join(this.validationPath, 'capability-matrix.json');
    if (fs.existsSync(capabilityPath)) {
      return JSON.parse(await fs.promises.readFile(capabilityPath, 'utf8'));
    }
    return { categories: {}, metadata: {} };
  }

  /**
   * Save capability matrix
   */
  async saveCapabilityMatrix(matrix) {
    const capabilityPath = path.join(this.validationPath, 'capability-matrix.json');
    await fs.promises.writeFile(capabilityPath, JSON.stringify(matrix, null, 2), 'utf8');
  }

  /**
   * Log extension history
   */
  async logExtensionHistory(entry) {
    try {
      const historyPath = path.join(this.extensionsPath, 'extension-history.json');
      let history = [];
      
      if (fs.existsSync(historyPath)) {
        history = JSON.parse(await fs.promises.readFile(historyPath, 'utf8'));
      }
      
      // Ensure chronological ordering by checking last timestamp
      if (history.length > 0) {
        const lastEntry = history[history.length - 1];
        const lastTimestamp = new Date(lastEntry.timestamp);
        const currentTimestamp = new Date(entry.timestamp);
        
        // If current timestamp is not later, add 1ms to ensure proper ordering
        if (currentTimestamp <= lastTimestamp) {
          const adjustedTimestamp = new Date(lastTimestamp.getTime() + 1);
          entry.timestamp = adjustedTimestamp.toISOString();
        }
      }
      
      history.push(entry);
      
      // Keep only last 100 entries
      if (history.length > 100) {
        history = history.slice(-100);
      }
      
      await fs.promises.mkdir(path.dirname(historyPath), { recursive: true });
      await fs.promises.writeFile(historyPath, JSON.stringify(history, null, 2), 'utf8');
      
    } catch (error) {
      console.error(`Failed to log extension history: ${error.message}`);
    }
  }

  /**
   * Ensure backup directory exists
   */
  ensureBackupDirectory() {
    try {
      if (!fs.existsSync(this.backupPath)) {
        fs.mkdirSync(this.backupPath, { recursive: true });
      }
    } catch (error) {
      console.error(`Failed to create backup directory: ${error.message}`);
    }
  }

  /**
   * Get rollback history for a category
   */
  async getRollbackHistory(category) {
    try {
      const historyPath = path.join(this.extensionsPath, 'extension-history.json');
      if (!fs.existsSync(historyPath)) {
        return [];
      }
      
      const history = JSON.parse(await fs.promises.readFile(historyPath, 'utf8'));
      return history.filter(entry => 
        entry.category === category && entry.action === 'rollback'
      );
      
    } catch (error) {
      console.error(`Failed to get rollback history: ${error.message}`);
      return [];
    }
  }

  /**
   * Clean old backups (keep last 10)
   */
  async cleanOldBackups() {
    try {
      const backups = await fs.promises.readdir(this.backupPath);
      if (backups.length <= 10) {
        return;
      }

      // Sort by date (oldest first)
      backups.sort((a, b) => a.localeCompare(b));
      const toDelete = backups.slice(0, backups.length - 10);

      for (const backup of toDelete) {
        const backupDir = path.join(this.backupPath, backup);
        await fs.promises.rmdir(backupDir, { recursive: true });
        console.log(`🧹 Cleaned old backup: ${backup}`);
      }

    } catch (error) {
      console.error(`Failed to clean old backups: ${error.message}`);
    }
  }
}

export default RollbackManager;