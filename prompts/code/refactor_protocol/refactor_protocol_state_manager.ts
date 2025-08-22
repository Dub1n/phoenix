/**
 * Refactor Protocol State Manager
 * 
 * Purpose: Enhanced state persistence, validation, and recovery for the refactor protocol system
 * Implementation: Phase 1 Critical Security & Stability improvements
 * 
 * This module provides comprehensive state management including:
 * - State persistence and serialization
 * - State validation and integrity checks
 * - Backup and recovery mechanisms
 * - State versioning and migration
 * - Rollback capabilities for failed updates
 * 
 * @module RefactorProtocolStateManager
 * @version 1.0.0
 * @requires refactor_protocol_system, self_executing_refactor_protocol
 */

// Enhanced state management with persistence and recovery
export class RefactorProtocolStateManager {
  private currentState: RefactorProtocolState;
  private stateHistory: StateSnapshot[] = [];
  private maxHistorySize: number = 50;
  private backupDirectory: string;
  private stateVersion: string = '1.0.0';
  
  constructor(initialState: RefactorProtocolState, backupDir: string = './state_backups') {
    this.currentState = initialState;
    this.backupDirectory = backupDir;
    this.ensureBackupDirectory();
    this.saveInitialSnapshot();
  }
  
  // Get current state
  getCurrentState(): RefactorProtocolState {
    return this.currentState;
  }
  
  // Update state with validation
  updateState(updates: Partial<RefactorProtocolState>): StateUpdateResult {
    try {
      // Validate updates
      const validationResult = this.validateStateUpdates(updates);
      if (!validationResult.isValid) {
        return {
          success: false,
          error: `State update validation failed: ${validationResult.errors.join(', ')}`,
          validationIssues: validationResult.errors
        };
      }
      
      // Create backup before update
      const backupResult = this.createBackup('pre_update');
      if (!backupResult.success) {
        return {
          success: false,
          error: `Failed to create backup: ${backupResult.error}`,
          backupFailed: true
        };
      }
      
      // Apply updates
      const previousState = { ...this.currentState };
      this.currentState = { ...this.currentState, ...updates };
      
      // Validate state integrity after update
      const integrityResult = this.validateStateIntegrity();
      if (!integrityResult.isValid) {
        // Rollback to previous state
        this.currentState = previousState;
        return {
          success: false,
          error: `State integrity check failed after update: ${integrityResult.issues.join(', ')}`,
          integrityIssues: integrityResult.issues,
          rolledBack: true
        };
      }
      
      // Save snapshot
      this.saveSnapshot('state_update');
      
      return {
        success: true,
        previousState,
        currentState: this.currentState,
        backupCreated: backupResult.backupPath
      };
      
    } catch (error) {
      return {
        success: false,
        error: `State update failed: ${error instanceof Error ? error.message : String(error)}`,
        exception: error
      };
    }
  }
  
  // Serialize current state
  serializeState(): StateSerializationResult {
    try {
      const serialized = {
        version: this.stateVersion,
        timestamp: new Date().toISOString(),
        state: this.currentState,
        metadata: {
          totalSnapshots: this.stateHistory.length,
          lastBackup: this.getLastBackupInfo(),
          checksum: this.calculateStateChecksum()
        }
      };
      
      const jsonString = JSON.stringify(serialized, null, 2);
      const checksum = this.calculateChecksum(jsonString);
      
      return {
        success: true,
        serialized: jsonString,
        checksum,
        metadata: serialized.metadata
      };
      
    } catch (error) {
      return {
        success: false,
        error: `State serialization failed: ${error instanceof Error ? error.message : String(error)}`,
        exception: error
      };
    }
  }
  
  // Deserialize state from string
  deserializeState(serializedState: string): StateDeserializationResult {
    try {
      // Parse JSON
      const parsed = JSON.parse(serializedState);
      
      // Validate structure
      if (!this.validateSerializedStructure(parsed)) {
        return {
          success: false,
          error: 'Invalid serialized state structure',
          structureValidationFailed: true
        };
      }
      
      // Validate version compatibility
      if (!this.isVersionCompatible(parsed.version)) {
        return {
          success: false,
          error: `Version incompatibility: current ${this.stateVersion}, serialized ${parsed.version}`,
          versionIncompatible: true,
          currentVersion: this.stateVersion,
          serializedVersion: parsed.version
        };
      }
      
      // Validate checksum
      const expectedChecksum = parsed.metadata?.checksum;
      if (expectedChecksum) {
        const actualChecksum = this.calculateChecksum(serializedState);
        if (expectedChecksum !== actualChecksum) {
          return {
            success: false,
            error: 'State checksum validation failed - data corruption detected',
            checksumMismatch: true,
            expected: expectedChecksum,
            actual: actualChecksum
          };
        }
      }
      
      // Validate state integrity
      const integrityResult = this.validateDeserializedState(parsed.state);
      if (!integrityResult.isValid) {
        return {
          success: false,
          error: `Deserialized state integrity check failed: ${integrityResult.issues.join(', ')}`,
          integrityIssues: integrityResult.issues
        };
      }
      
      // Apply deserialized state
      const previousState = this.currentState;
      this.currentState = parsed.state;
      
      // Save snapshot
      this.saveSnapshot('state_deserialization');
      
      return {
        success: true,
        previousState,
        currentState: this.currentState,
        metadata: parsed.metadata,
        restoredFrom: parsed.timestamp
      };
      
    } catch (error) {
      return {
        success: false,
        error: `State deserialization failed: ${error instanceof Error ? error.message : String(error)}`,
        exception: error
      };
    }
  }
  
  // Validate state integrity
  validateStateIntegrity(): StateIntegrityResult {
    const issues: string[] = [];
    
    try {
      // Check required fields
      if (!this.currentState.projectContext) {
        issues.push('Missing required project context');
      }
      
      if (!this.currentState.currentPhase) {
        issues.push('Missing current phase information');
      }
      
      if (!this.currentState.phaseResults) {
        issues.push('Missing phase results');
      }
      
      // Validate project context
      if (this.currentState.projectContext) {
        const contextValidation = this.validateProjectContext(this.currentState.projectContext);
        if (!contextValidation.isValid) {
          issues.push(`Project context validation failed: ${contextValidation.errors.join(', ')}`);
        }
      }
      
      // Validate phase results
      if (this.currentState.phaseResults) {
        const resultsValidation = this.validatePhaseResults(this.currentState.phaseResults);
        if (!resultsValidation.isValid) {
          issues.push(`Phase results validation failed: ${resultsValidation.errors.join(', ')}`);
        }
      }
      
      // Check for circular references
      if (this.hasCircularReferences(this.currentState)) {
        issues.push('State contains circular references');
      }
      
      // Validate file paths
      if (this.currentState.fileAnalysis) {
        const pathValidation = this.validateFilePaths(this.currentState.fileAnalysis);
        if (!pathValidation.isValid) {
          issues.push(`File path validation failed: ${pathValidation.errors.join(', ')}`);
        }
      }
      
      return {
        isValid: issues.length === 0,
        issues,
        integrityScore: this.calculateIntegrityScore(issues)
      };
      
    } catch (error) {
      issues.push(`Integrity check error: ${error instanceof Error ? error.message : String(error)}`);
      return {
        isValid: false,
        issues,
        integrityScore: 0,
        error: error
      };
    }
  }
  
  // Create backup of current state
  createBackup(reason: string = 'manual'): BackupResult {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `state_backup_${reason}_${timestamp}.json`;
      const backupPath = require('path').join(this.backupDirectory, filename);
      
      // Serialize current state
      const serialization = this.serializeState();
      if (!serialization.success) {
        return {
          success: false,
          error: `Serialization failed: ${serialization.error}`,
          serializationFailed: true
        };
      }
      
      // Write backup file
      const fs = require('fs');
      fs.writeFileSync(backupPath, serialization.serialized, 'utf8');
      
      // Create backup metadata
      const backupMetadata: BackupMetadata = {
        filename,
        path: backupPath,
        timestamp: new Date().toISOString(),
        reason,
        stateChecksum: serialization.checksum,
        stateSize: serialization.serialized.length,
        stateVersion: this.stateVersion
      };
      
      // Save backup metadata
      this.saveBackupMetadata(backupMetadata);
      
      return {
        success: true,
        backupPath,
        metadata: backupMetadata
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Backup creation failed: ${error instanceof Error ? error.message : String(error)}`,
        exception: error
      };
    }
  }
  
  // Recover from backup
  recoverFromBackup(backupPath: string): RecoveryResult {
    try {
      // Read backup file
      const fs = require('fs');
      if (!fs.existsSync(backupPath)) {
        return {
          success: false,
          error: 'Backup file not found',
          fileNotFound: true
        };
      }
      
      const backupContent = fs.readFileSync(backupPath, 'utf8');
      
      // Validate backup file
      const backupValidation = this.validateBackupFile(backupContent);
      if (!backupValidation.isValid) {
        return {
          success: false,
          error: `Backup validation failed: ${backupValidation.errors.join(', ')}`,
          validationFailed: true,
          validationErrors: backupValidation.errors
        };
      }
      
      // Create backup of current state before recovery
      const currentBackup = this.createBackup('pre_recovery');
      if (!currentBackup.success) {
        return {
          success: false,
          error: `Failed to backup current state before recovery: ${currentBackup.error}`,
          currentBackupFailed: true
        };
      }
      
      // Deserialize backup state
      const deserialization = this.deserializeState(backupContent);
      if (!deserialization.success) {
        return {
          success: false,
          error: `Failed to deserialize backup state: ${deserialization.error}`,
          deserializationFailed: true,
          deserializationError: deserialization.error
        };
      }
      
      return {
        success: true,
        recoveredState: this.currentState,
        backupUsed: backupPath,
        currentStateBackedUp: currentBackup.backupPath,
        recoveryTimestamp: new Date().toISOString()
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Recovery failed: ${error instanceof Error ? error.message : String(error)}`,
        exception: error
      };
    }
  }
  
  // List available backups
  listBackups(): BackupListResult {
    try {
      const fs = require('fs');
      const path = require('path');
      
      if (!fs.existsSync(this.backupDirectory)) {
        return {
          success: true,
          backups: [],
          totalBackups: 0
        };
      }
      
      const files = fs.readdirSync(this.backupDirectory);
      const backupFiles = files.filter(file => file.endsWith('.json'));
      
      const backups: BackupInfo[] = [];
      for (const file of backupFiles) {
        const filePath = path.join(this.backupDirectory, file);
        const stats = fs.statSync(filePath);
        
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(content);
          
          backups.push({
            filename: file,
            path: filePath,
            size: stats.size,
            created: stats.birthtime.toISOString(),
            stateVersion: parsed.version || 'unknown',
            reason: this.extractBackupReason(file),
            checksum: parsed.metadata?.checksum || 'unknown'
          });
        } catch (parseError) {
          // Skip corrupted backup files
          continue;
        }
      }
      
      // Sort by creation date (newest first)
      backups.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
      
      return {
        success: true,
        backups,
        totalBackups: backups.length
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Failed to list backups: ${error instanceof Error ? error.message : String(error)}`,
        exception: error
      };
    }
  }
  
  // Clean up old backups
  cleanupOldBackups(maxAgeDays: number = 30, maxBackups: number = 20): CleanupResult {
    try {
      const backups = this.listBackups();
      if (!backups.success) {
        return {
          success: false,
          error: `Failed to list backups: ${backups.error}`,
          listingFailed: true
        };
      }
      
      const now = new Date();
      const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
      
      let deletedCount = 0;
      let failedDeletions: string[] = [];
      
      for (const backup of backups.backups) {
        const backupAge = now.getTime() - new Date(backup.created).getTime();
        const isOld = backupAge > maxAgeMs;
        const isExcess = backups.backups.indexOf(backup) >= maxBackups;
        
        if (isOld || isExcess) {
          try {
            const fs = require('fs');
            fs.unlinkSync(backup.path);
            deletedCount++;
          } catch (deleteError) {
            failedDeletions.push(`${backup.filename}: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`);
          }
        }
      }
      
      return {
        success: true,
        deletedCount,
        failedDeletions,
        remainingBackups: backups.totalBackups - deletedCount
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Cleanup failed: ${error instanceof Error ? error.message : String(error)}`,
        exception: error
      };
    }
  }
  
  // Private helper methods
  
  private ensureBackupDirectory(): void {
    const fs = require('fs');
    if (!fs.existsSync(this.backupDirectory)) {
      fs.mkdirSync(this.backupDirectory, { recursive: true });
    }
  }
  
  private saveInitialSnapshot(): void {
    this.saveSnapshot('initial_state');
  }
  
  private saveSnapshot(reason: string): void {
    const snapshot: StateSnapshot = {
      timestamp: new Date().toISOString(),
      reason,
      state: { ...this.currentState },
      checksum: this.calculateStateChecksum()
    };
    
    this.stateHistory.push(snapshot);
    
    // Limit history size
    if (this.stateHistory.length > this.maxHistorySize) {
      this.stateHistory.shift();
    }
  }
  
  private calculateStateChecksum(): string {
    const stateString = JSON.stringify(this.currentState);
    return this.calculateChecksum(stateString);
  }
  
  private calculateChecksum(data: string): string {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(data).digest('hex');
  }
  
  private getLastBackupInfo(): string | null {
    const backups = this.listBackups();
    if (backups.success && backups.backups.length > 0) {
      return backups.backups[0].created;
    }
    return null;
  }
  
  private extractBackupReason(filename: string): string {
    const match = filename.match(/state_backup_(.+?)_/);
    return match ? match[1] : 'unknown';
  }
  
  private saveBackupMetadata(metadata: BackupMetadata): void {
    const metadataPath = require('path').join(this.backupDirectory, 'backup_metadata.json');
    const fs = require('fs');
    
    let existingMetadata: BackupMetadata[] = [];
    if (fs.existsSync(metadataPath)) {
      try {
        const content = fs.readFileSync(metadataPath, 'utf8');
        existingMetadata = JSON.parse(content);
      } catch (error) {
        // If metadata file is corrupted, start fresh
        existingMetadata = [];
      }
    }
    
    existingMetadata.push(metadata);
    
    // Keep only recent metadata
    if (existingMetadata.length > 100) {
      existingMetadata = existingMetadata.slice(-100);
    }
    
    fs.writeFileSync(metadataPath, JSON.stringify(existingMetadata, null, 2), 'utf8');
  }
  
  private validateStateUpdates(updates: Partial<RefactorProtocolState>): ValidationResult {
    const errors: string[] = [];
    
    // Validate project context updates
    if (updates.projectContext) {
      const contextValidation = this.validateProjectContext(updates.projectContext);
      if (!contextValidation.isValid) {
        errors.push(...contextValidation.errors);
      }
    }
    
    // Validate phase results updates
    if (updates.phaseResults) {
      const resultsValidation = this.validatePhaseResults(updates.phaseResults);
      if (!resultsValidation.isValid) {
        errors.push(...resultsValidation.errors);
      }
    }
    
    // Validate file analysis updates
    if (updates.fileAnalysis) {
      const analysisValidation = this.validateFileAnalysis(updates.fileAnalysis);
      if (!analysisValidation.isValid) {
        errors.push(...analysisValidation.errors);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  private validateProjectContext(context: ProjectContext): ValidationResult {
    const errors: string[] = [];
    
    if (!context.language || typeof context.language !== 'string') {
      errors.push('Project language must be a non-empty string');
    }
    
    if (!context.framework || typeof context.framework !== 'string') {
      errors.push('Project framework must be a non-empty string');
    }
    
    if (context.coverage_target !== undefined) {
      if (typeof context.coverage_target !== 'number' || context.coverage_target < 0 || context.coverage_target > 100) {
        errors.push('Coverage target must be a number between 0 and 100');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  private validatePhaseResults(results: PhaseResult[]): ValidationResult {
    const errors: string[] = [];
    
    if (!Array.isArray(results)) {
      errors.push('Phase results must be an array');
      return { isValid: false, errors };
    }
    
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      
      if (!result.phase || typeof result.phase !== 'string') {
        errors.push(`Phase result ${i}: phase must be a non-empty string`);
      }
      
      if (!result.status || !['pending', 'in_progress', 'completed', 'failed'].includes(result.status)) {
        errors.push(`Phase result ${i}: status must be one of: pending, in_progress, completed, failed`);
      }
      
      if (result.completion_percentage !== undefined) {
        if (typeof result.completion_percentage !== 'number' || result.completion_percentage < 0 || result.completion_percentage > 100) {
          errors.push(`Phase result ${i}: completion percentage must be a number between 0 and 100`);
        }
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  private validateFileAnalysis(analysis: FileAnalysis): ValidationResult {
    const errors: string[] = [];
    
    if (typeof analysis.total_files !== 'number' || analysis.total_files < 0) {
      errors.push('Total files must be a non-negative number');
    }
    
    if (!Array.isArray(analysis.files)) {
      errors.push('Files must be an array');
      return { isValid: false, errors };
    }
    
    if (analysis.files.length !== analysis.total_files) {
      errors.push('Files array length must match total_files count');
    }
    
    for (let i = 0; i < analysis.files.length; i++) {
      const file = analysis.files[i];
      
      if (!file.name || typeof file.name !== 'string') {
        errors.push(`File ${i}: name must be a non-empty string`);
      }
      
      if (!file.path || typeof file.path !== 'string') {
        errors.push(`File ${i}: path must be a non-empty string`);
      }
      
      if (typeof file.size !== 'number' || file.size < 0) {
        errors.push(`File ${i}: size must be a non-negative number`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  private validateFilePaths(analysis: FileAnalysis): ValidationResult {
    const errors: string[] = [];
    
    for (const file of analysis.files) {
      if (file.path.includes('..') || file.path.includes('/etc') || file.path.includes('/sys')) {
        errors.push(`File path contains dangerous patterns: ${file.path}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  private hasCircularReferences(obj: any, visited: Set<any> = new Set()): boolean {
    if (obj === null || typeof obj !== 'object') {
      return false;
    }
    
    if (visited.has(obj)) {
      return true;
    }
    
    visited.add(obj);
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (this.hasCircularReferences(obj[key], visited)) {
          return true;
        }
      }
    }
    
    visited.delete(obj);
    return false;
  }
  
  private validateSerializedStructure(parsed: any): boolean {
    return parsed && 
           typeof parsed === 'object' &&
           typeof parsed.version === 'string' &&
           typeof parsed.timestamp === 'string' &&
           typeof parsed.state === 'object' &&
           typeof parsed.metadata === 'object';
  }
  
  private isVersionCompatible(version: string): boolean {
    const current = this.parseVersion(this.stateVersion);
    const target = this.parseVersion(version);
    
    // Major version must match
    return current.major === target.major;
  }
  
  private parseVersion(version: string): { major: number, minor: number, patch: number } {
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  }
  
  private validateDeserializedState(state: any): ValidationResult {
    const errors: string[] = [];
    
    if (!state || typeof state !== 'object') {
      errors.push('Deserialized state must be an object');
      return { isValid: false, errors };
    }
    
    // Validate basic structure
    if (!state.projectContext) {
      errors.push('Deserialized state missing project context');
    }
    
    if (!state.currentPhase) {
      errors.push('Deserialized state missing current phase');
    }
    
    if (!state.phaseResults) {
      errors.push('Deserialized state missing phase results');
    }
    
    // Validate components if they exist
    if (state.projectContext) {
      const contextValidation = this.validateProjectContext(state.projectContext);
      if (!contextValidation.isValid) {
        errors.push(...contextValidation.errors);
      }
    }
    
    if (state.phaseResults) {
      const resultsValidation = this.validatePhaseResults(state.phaseResults);
      if (!resultsValidation.isValid) {
        errors.push(...resultsValidation.errors);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  private validateBackupFile(content: string): ValidationResult {
    const errors: string[] = [];
    
    try {
      const parsed = JSON.parse(content);
      
      if (!this.validateSerializedStructure(parsed)) {
        errors.push('Invalid backup file structure');
      }
      
      if (parsed.metadata?.checksum) {
        const actualChecksum = this.calculateChecksum(content);
        if (parsed.metadata.checksum !== actualChecksum) {
          errors.push('Backup file checksum validation failed');
        }
      }
      
    } catch (parseError) {
      errors.push('Backup file is not valid JSON');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  private calculateIntegrityScore(issues: string[]): number {
    let score = 100;
    
    for (const issue of issues) {
      if (issue.includes('critical') || issue.includes('Missing required')) {
        score -= 25;
      } else if (issue.includes('validation failed')) {
        score -= 15;
      } else {
        score -= 5;
      }
    }
    
    return Math.max(0, score);
  }
}

// Core State Types

// Main protocol state interface
export interface RefactorProtocolState {
  projectContext: ProjectContext;
  currentPhase: string;
  phaseResults: PhaseResult[];
  fileAnalysis: FileAnalysis;
  testCoverage: TestCoverage;
  separationStrategy: SeparationStrategy;
  metadata: StateMetadata;
}

// Project context information
export interface ProjectContext {
  language: string;
  framework: string;
  testing_framework?: string;
  coverage_target?: number;
  project_path: string;
  analysis_timestamp: string;
}

// Phase execution results
export interface PhaseResult {
  phase: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  start_time: string;
  end_time?: string;
  completion_percentage: number;
  errors?: string[];
  warnings?: string[];
  artifacts?: string[];
}

// File analysis results
export interface FileAnalysis {
  total_files: number;
  files: FileInfo[];
  analysis_timestamp: string;
}

// Individual file information
export interface FileInfo {
  name: string;
  path: string;
  size: number;
  language?: string;
  complexity_score?: number;
  test_coverage?: number;
}

// Test coverage information
export interface TestCoverage {
  overall: number;
  modules: ModuleCoverage[];
  last_updated: string;
}

// Module coverage details
export interface ModuleCoverage {
  name: string;
  coverage: number;
  lines: number;
  covered_lines: number;
  uncovered_lines: number;
}

// Separation strategy information
export interface SeparationStrategy {
  file1: string;
  file2: string;
  purpose1: string;
  purpose2: string;
  strategy: string;
  confidence: number;
}

// State metadata
export interface StateMetadata {
  created: string;
  last_modified: string;
  version: string;
  checksum: string;
  backup_count: number;
}

// State Management Types

// State snapshot for history tracking
export interface StateSnapshot {
  timestamp: string;
  reason: string;
  state: RefactorProtocolState;
  checksum: string;
}

// Backup metadata
export interface BackupMetadata {
  filename: string;
  path: string;
  timestamp: string;
  reason: string;
  stateChecksum: string;
  stateSize: number;
  stateVersion: string;
}

// Backup information for listing
export interface BackupInfo {
  filename: string;
  path: string;
  size: number;
  created: string;
  stateVersion: string;
  reason: string;
  checksum: string;
}

// Result types for operations
export interface StateUpdateResult {
  success: boolean;
  error?: string;
  previousState?: RefactorProtocolState;
  currentState?: RefactorProtocolState;
  backupCreated?: string;
  validationIssues?: string[];
  integrityIssues?: string[];
  rolledBack?: boolean;
  backupFailed?: boolean;
  exception?: Error;
}

export interface StateSerializationResult {
  success: boolean;
  serialized?: string;
  checksum?: string;
  metadata?: any;
  error?: string;
  exception?: Error;
}

export interface StateDeserializationResult {
  success: boolean;
  previousState?: RefactorProtocolState;
  currentState?: RefactorProtocolState;
  metadata?: any;
  restoredFrom?: string;
  error?: string;
  structureValidationFailed?: boolean;
  versionIncompatible?: boolean;
  currentVersion?: string;
  serializedVersion?: string;
  checksumMismatch?: boolean;
  expected?: string;
  actual?: string;
  integrityIssues?: string[];
  exception?: Error;
}

export interface StateIntegrityResult {
  isValid: boolean;
  issues: string[];
  integrityScore: number;
  error?: Error;
}

export interface BackupResult {
  success: boolean;
  backupPath?: string;
  metadata?: BackupMetadata;
  error?: string;
  exception?: Error;
}

export interface RecoveryResult {
  success: boolean;
  recoveredState?: RefactorProtocolState;
  backupUsed?: string;
  currentStateBackedUp?: string;
  recoveryTimestamp?: string;
  error?: string;
  fileNotFound?: boolean;
  validationFailed?: boolean;
  validationErrors?: string[];
  currentBackupFailed?: boolean;
  deserializationFailed?: boolean;
  deserializationError?: string;
  exception?: Error;
}

export interface BackupListResult {
  success: boolean;
  backups: BackupInfo[];
  totalBackups: number;
  error?: string;
  exception?: Error;
}

export interface CleanupResult {
  success: boolean;
  deletedCount: number;
  failedDeletions: string[];
  remainingBackups: number;
  error?: string;
  exception?: Error;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
