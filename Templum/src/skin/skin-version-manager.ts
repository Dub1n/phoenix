/**---
 * title: [Skin Version Manager - Semantic Version Management Service]
 * tags: [Version-Management, Semantic-Versioning, Compatibility-Validation, Migration-Strategies]
 * provides: [Version Parsing, Compatibility Checking, Conflict Resolution, Migration Management]
 * requires: [Universal Skin Engine Types, Templum Core Types, Semantic Version Utilities]
 * description: [Complete version management service for Universal Skin Engine with semantic versioning, compatibility validation, and migration strategies]
 * ---*/

import {
  UniversalSkinDefinition,
  SemanticVersion,
  VersionCompatibilityRule,
  VersionConflict,
  MigrationStrategy,
  SkinVersionQuery,
  SkinVersionInfo,
  ISkinVersionManager,
  ConflictResolutionStrategy,
  // Advanced compatibility types (TASK-SKIN-002)
  InterfaceRequirements,
  AdvancedCompatibilityOptions,
  AdvancedCompatibilityReport,
  InterfaceCapabilityMatrix,
  InterfaceType
} from '../types/universal-skin-engine-types';
import {

  isTemplumError,
  createTemplumError,



} from '../types/templum-types';
import { serialization, type SerializationOutcome } from '../utils/serialization-utils';
import { emitSerializationWarnings } from '../backend/backend-serialization-log';
import type { Logger } from '../utils/logger';
import {
  AdvancedCompatibilityService,
  createDefaultInterfaceCapabilityMatrix,
  createDefaultInterfaceRequirements
} from './versioning/advanced-compatibility-service';
import { getSkinLogger } from './skin-logger';
import { createLogger, type Logger } from '../utils/logger';

/**
 * Comprehensive skin version management with semantic versioning support
 */
export class SkinVersionManager implements ISkinVersionManager {
  private compatibilityRules = new Map<string, VersionCompatibilityRule[]>();
  private migrationStrategies = new Map<string, MigrationStrategy[]>();
  private systemVersion = '1.0.0';
  private registeredVersions = new Map<string, SemanticVersion[]>();
  private readonly interfaceRequirements: Map<InterfaceType, InterfaceRequirements>;
  private readonly interfaceCapabilityMatrix: InterfaceCapabilityMatrix;
  private validatorVersion = '1.0.0';
  private readonly advancedCompatibilityService: AdvancedCompatibilityService;
  private readonly coreLogger: Logger;
  private readonly validationLogger: Logger;
  private readonly integrationLogger: Logger;

  constructor(systemVersion?: string) {
    if (systemVersion) {
      this.systemVersion = systemVersion;
    }
    this.coreLogger = getSkinLogger('skin-version-manager');
    this.validationLogger = getSkinLogger('skin-version-manager', 'validation');
    this.integrationLogger = getSkinLogger('skin-version-manager', 'integration');
    this.initializeDefaultRules();
    this.initializeDefaultMigrationStrategies();
    this.interfaceRequirements = createDefaultInterfaceRequirements();
    this.interfaceCapabilityMatrix = createDefaultInterfaceCapabilityMatrix(this.interfaceRequirements);
    this.advancedCompatibilityService = new AdvancedCompatibilityService(
      this.interfaceRequirements,
      this.interfaceCapabilityMatrix,
      {
        validatorVersionProvider: () => this.validatorVersion,
        measureSkinBytes: this.measureSkinBytes.bind(this)
      }
    );
  }

  getValidatorVersion(): string {
    return this.validatorVersion;
  }

  // ============================================================================
  // Version Parsing and Comparison
  // ============================================================================

  /**
   * Parse semantic version string into structured format
   */
  parseVersion(version: string): SemanticVersion {
    try {
      // Basic semver pattern matching
      const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
      const match = version.match(semverRegex);
      
      if (!match) {
        throw createTemplumError(`Invalid semantic version format: ${version}`, 'version-parse-error', 'validation');
      }

      const [, majorStr, minorStr, patchStr, prereleaseStr, buildStr] = match;
      
      return {
        major: parseInt(majorStr, 10),
        minor: parseInt(minorStr, 10),
        patch: parseInt(patchStr, 10),
        prerelease: prereleaseStr ? prereleaseStr.split('.') : undefined,
        build: buildStr ? buildStr.split('.') : undefined,
        raw: version
      };
    } catch (error) {
      if (isTemplumError(error)) {
        throw error;
      }
      throw createTemplumError(`Failed to parse version ${version}: ${error}`, 'version-parse-error', 'validation');
    }
  }

  /**
   * Compare two semantic versions (-1 if v1 < v2, 0 if equal, 1 if v1 > v2)
   */
  compareVersions(v1: string | SemanticVersion, v2: string | SemanticVersion): number {
    try {
      const version1 = typeof v1 === 'string' ? this.parseVersion(v1) : v1;
      const version2 = typeof v2 === 'string' ? this.parseVersion(v2) : v2;

      // Compare major version
      if (version1.major !== version2.major) {
        return version1.major < version2.major ? -1 : 1;
      }

      // Compare minor version
      if (version1.minor !== version2.minor) {
        return version1.minor < version2.minor ? -1 : 1;
      }

      // Compare patch version
      if (version1.patch !== version2.patch) {
        return version1.patch < version2.patch ? -1 : 1;
      }

      // Compare prerelease
      return this.comparePrereleaseVersions(version1.prerelease, version2.prerelease);
    } catch (error) {
      if (isTemplumError(error)) {
        throw error;
      }
      throw createTemplumError(`Failed to compare versions: ${error}`, 'version-comparison-error', 'validation');
    }
  }

  /**
   * Check if version satisfies a semver range pattern
   */
  satisfiesRange(version: string, range: string): boolean {
    try {
      const parsedVersion = this.parseVersion(version);
      
      // Handle simple range patterns
      if (range === 'latest' || range === '*') {
        return true;
      }

      if (range.includes('*')) {
        return true;
      }

      // Handle exact version match
      if (!range.match(/[<>^~]/)) {
        return this.compareVersions(parsedVersion, range) === 0;
      }

      // Handle caret range (^1.2.3)
      if (range.startsWith('^')) {
        const targetVersion = this.parseVersion(range.slice(1));
        return this.satisfiesCaretRange(parsedVersion, targetVersion);
      }

      // Handle tilde range (~1.2.3)
      if (range.startsWith('~')) {
        const targetVersion = this.parseVersion(range.slice(1));
        return this.satisfiesTildeRange(parsedVersion, targetVersion);
      }

      // Handle greater than/less than patterns
      if (range.includes('>=')) {
        const targetVersion = this.parseVersion(range.replace('>=', '').trim());
        return this.compareVersions(parsedVersion, targetVersion) >= 0;
      }

      if (range.includes('<=')) {
        const targetVersion = this.parseVersion(range.replace('<=', '').trim());
        return this.compareVersions(parsedVersion, targetVersion) <= 0;
      }

      if (range.includes('>')) {
        const targetVersion = this.parseVersion(range.replace('>', '').trim());
        return this.compareVersions(parsedVersion, targetVersion) > 0;
      }

      if (range.includes('<')) {
        const targetVersion = this.parseVersion(range.replace('<', '').trim());
        return this.compareVersions(parsedVersion, targetVersion) < 0;
      }

      // Default to exact match if pattern not recognized
      return this.compareVersions(parsedVersion, range) === 0;
    } catch (error) {
      this.coreLogger.warn('Failed to evaluate version range', {
        version,
        range,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }

  // ============================================================================
  // Compatibility Validation
  // ============================================================================

  /**
   * Validate skin version compatibility with system requirements
   */
  async validateCompatibility(skin: UniversalSkinDefinition, systemVersion?: string): Promise<{
    compatible: boolean;
    level: 'full' | 'partial' | 'breaking' | 'incompatible';
    issues: string[];
    recommendations: string[];
  }> {
    try {
      const issues: string[] = [];
      const recommendations: string[] = [];
      const targetSystemVersion = systemVersion || this.systemVersion;

      // Parse versions
      const skinVersion = this.parseVersion(skin.version);
      const systemSemver = this.parseVersion(targetSystemVersion);

      // Get compatibility rules for this skin
      const rules = this.compatibilityRules.get(skin.id) || this.compatibilityRules.get('default') || [];

      let compatibilityLevel: 'full' | 'partial' | 'breaking' | 'incompatible' = 'full';
      let overallCompatible = true;

      // Check basic version compatibility
      const _versionComparison = this.compareVersions(skinVersion, systemSemver);
      
      // Major version differences indicate breaking changes
      if (skinVersion.major > systemSemver.major) {
        issues.push(`Skin version ${skin.version} requires system version ${skinVersion.major}.x.x or higher`);
        compatibilityLevel = 'incompatible';
        overallCompatible = false;
        recommendations.push('Update system to support this skin version');
      } else if (skinVersion.major < systemSemver.major) {
        issues.push(`Skin version ${skin.version} may be outdated for system version ${targetSystemVersion}`);
        compatibilityLevel = 'partial';
        recommendations.push('Consider updating skin to latest version');
      }

      // Apply compatibility rules
      for (const rule of rules) {
        if (this.satisfiesRange(skin.version, rule.pattern)) {
          if (rule.breaking && compatibilityLevel === 'full') {
            compatibilityLevel = 'breaking';
            issues.push(`Breaking changes detected: ${rule.description}`);
          }
          
          if (rule.migrationRequired) {
            recommendations.push(`Migration required: ${rule.description}`);
          }

          // Check system version requirement
          if (rule.systemVersion && this.compareVersions(targetSystemVersion, rule.systemVersion) < 0) {
            issues.push(`Requires system version ${rule.systemVersion} or higher`);
            overallCompatible = false;
            compatibilityLevel = 'incompatible';
          }
        }
      }

      // Validate skin metadata requirements
      if (skin.metadata.minimumVersion) {
        if (this.compareVersions(targetSystemVersion, skin.metadata.minimumVersion) < 0) {
          issues.push(`Minimum system version ${skin.metadata.minimumVersion} recommended`);
          compatibilityLevel = compatibilityLevel === 'incompatible' ? 'incompatible' : 'partial';
          recommendations.push('Consider upgrading system to meet minimum version requirements');
        }
      }

      // Check interface compatibility
      if (skin.metadata.supportedInterfaces?.length === 0) {
        issues.push('No supported interfaces specified');
        compatibilityLevel = 'partial';
      }

      return {
        compatible: overallCompatible,
        level: compatibilityLevel,
        issues,
        recommendations
      };
    } catch (error) {
      if (isTemplumError(error)) {
        throw error;
      }
      throw createTemplumError(`Failed to validate compatibility: ${error}`, 'compatibility-validation-error', 'validation');
    }
  }

  // ============================================================================
  // Version Resolution
  // ============================================================================

  /**
   * Resolve best matching skin version based on query parameters
   */
  async resolveVersion(query: SkinVersionQuery, availableVersions: Map<string, UniversalSkinDefinition>): Promise<{
    resolved: boolean;
    skin?: UniversalSkinDefinition;
    version?: string;
    fallbackUsed?: boolean;
    reason?: string;
  }> {
    try {
      // Get all versions for the requested skin
      const skinVersions = Array.from(availableVersions.entries())
        .filter(([_id, skin]) => skin.id === query.skinId)
        .map(([id, skin]) => ({ id, skin, version: this.parseVersion(skin.version) }))
        .sort((a, b) => this.compareVersions(b.version, a.version)); // Sort descending (latest first)

      if (skinVersions.length === 0) {
        return {
          resolved: false,
          reason: `No versions found for skin ${query.skinId}`
        };
      }

      // Handle exact version request
      if (query.exactVersion) {
        const exactMatch = skinVersions.find(sv => sv.skin.version === query.exactVersion);
        if (exactMatch) {
          return {
            resolved: true,
            skin: exactMatch.skin,
            version: exactMatch.skin.version,
            fallbackUsed: false
          };
        }
        
        // Exact version not found, try fallback strategy
        return await this.applyFallbackStrategy(query, skinVersions);
      }

      // Handle version pattern request
      if (query.versionPattern) {
        const patternMatches = skinVersions.filter(sv => 
          this.satisfiesRange(sv.skin.version, query.versionPattern!)
        );

        if (patternMatches.length > 0) {
          // Filter prerelease versions if not explicitly included
          let candidates = patternMatches;
          if (!query.includePrerelease) {
            candidates = patternMatches.filter(sv => !sv.version.prerelease);
          }

          if (candidates.length > 0) {
            return {
              resolved: true,
              skin: candidates[0].skin, // Already sorted by version descending
              version: candidates[0].skin.version,
              fallbackUsed: false
            };
          }
        }

        // Pattern not satisfied, try fallback
        return await this.applyFallbackStrategy(query, skinVersions);
      }

      // Default: return latest compatible version
      const latest = skinVersions[0];
      return {
        resolved: true,
        skin: latest.skin,
        version: latest.skin.version,
        fallbackUsed: false,
        reason: 'Latest version selected'
      };
    } catch (error) {
      if (isTemplumError(error)) {
        throw error;
      }
      throw createTemplumError(`Failed to resolve version: ${error}`, 'version-resolution-error', 'validation');
    }
  }

  // ============================================================================
  // Conflict Detection and Resolution
  // ============================================================================

  /**
   * Detect version conflicts between existing and new skin
   */
  detectConflicts(existingSkin: UniversalSkinDefinition, newSkin: UniversalSkinDefinition): VersionConflict[] {
    const conflicts: VersionConflict[] = [];

    try {
      // Only check conflicts for same skin ID
      if (existingSkin.id !== newSkin.id) {
        return conflicts;
      }

      const existingVersion = this.parseVersion(existingSkin.version);
      const newVersion = this.parseVersion(newSkin.version);
      const comparison = this.compareVersions(existingVersion, newVersion);

      // Exact duplicate version
      if (comparison === 0) {
        conflicts.push({
          skinId: existingSkin.id,
          existingVersion: existingSkin.version,
          conflictingVersion: newSkin.version,
          conflictType: 'duplicate',
          resolution: 'last-writer-wins',
          canAutoResolve: true
        });
        return conflicts;
      }

      // Major version conflict (breaking changes)
      if (existingVersion.major !== newVersion.major) {
        conflicts.push({
          skinId: existingSkin.id,
          existingVersion: existingSkin.version,
          conflictingVersion: newSkin.version,
          conflictType: 'major',
          resolution: 'user-intervention',
          canAutoResolve: false
        });
      }

      // Minor version conflict (new features)
      else if (existingVersion.minor !== newVersion.minor) {
        conflicts.push({
          skinId: existingSkin.id,
          existingVersion: existingSkin.version,
          conflictingVersion: newSkin.version,
          conflictType: 'minor',
          resolution: 'last-writer-wins',
          canAutoResolve: true
        });
      }

      // Patch version conflict (bug fixes)
      else if (existingVersion.patch !== newVersion.patch) {
        conflicts.push({
          skinId: existingSkin.id,
          existingVersion: existingSkin.version,
          conflictingVersion: newSkin.version,
          conflictType: 'patch',
          resolution: 'last-writer-wins',
          canAutoResolve: true
        });
      }

      // Prerelease version conflict
      else if (
        this.normalizePrerelease(existingVersion.prerelease, 'skin:version-manager:prerelease:existing') !==
        this.normalizePrerelease(newVersion.prerelease, 'skin:version-manager:prerelease:new')
      ) {
        conflicts.push({
          skinId: existingSkin.id,
          existingVersion: existingSkin.version,
          conflictingVersion: newSkin.version,
          conflictType: 'prerelease',
          resolution: 'last-writer-wins',
          canAutoResolve: true
        });
      }

      return conflicts;
    } catch (error) {
      this.validationLogger.warn('Failed to detect version conflicts', {
        skinId: newSkin.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return conflicts;
    }
  }

  /**
   * Resolve version conflicts based on strategy
   */
  async resolveConflicts(conflicts: VersionConflict[], strategy: ConflictResolutionStrategy): Promise<{
    resolutions: { conflict: VersionConflict; action: string; success: boolean }[];
    overallSuccess: boolean;
  }> {
    const resolutions = conflicts.map(conflict => {
      let action = '';
      let success = false;

      switch (strategy) {
        case 'last-writer-wins':
          if (conflict.canAutoResolve) {
            action = 'Replace existing version with new version';
            success = true;
          } else {
            action = 'Cannot auto-resolve - requires user intervention';
            success = false;
          }
          break;

        case 'merge-compatible':
          if (conflict.conflictType === 'patch' || conflict.conflictType === 'minor') {
            action = 'Merge compatible changes';
            success = true;
          } else {
            action = 'Cannot merge incompatible versions';
            success = false;
          }
          break;

        case 'user-intervention':
          action = 'Requires manual resolution';
          success = false;
          break;

        default:
          action = 'Unknown resolution strategy';
          success = false;
      }

      return { conflict, action, success };
    });

    return {
      resolutions,
      overallSuccess: resolutions.every(r => r.success)
    };
  }

  // ============================================================================
  // Migration Management
  // ============================================================================

  /**
   * Find appropriate migration strategy for version transition
   */
  findMigrationStrategy(fromVersion: string, toVersion: string): MigrationStrategy | null {
    try {
      const fromSemver = this.parseVersion(fromVersion);
      const toSemver = this.parseVersion(toVersion);
      const comparison = this.compareVersions(fromSemver, toSemver);

      // No migration needed for same version
      if (comparison === 0) {
        return null;
      }

      // Get migration strategies
      const allStrategies = Array.from(this.migrationStrategies.values()).flat();
      
      // Find matching strategies
      const matchingStrategies = allStrategies.filter(strategy => {
        return this.satisfiesRange(fromVersion, strategy.fromVersion) &&
               this.satisfiesRange(toVersion, strategy.toVersion);
      });

      // Sort by risk level and estimated time
      matchingStrategies.sort((a, b) => {
        const riskOrder = { 'low': 0, 'medium': 1, 'high': 2 };
        const riskDiff = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        if (riskDiff !== 0) return riskDiff;
        
        return (a.estimatedTime || 0) - (b.estimatedTime || 0);
      });

      return matchingStrategies[0] || this.createDefaultMigrationStrategy(fromVersion, toVersion);
    } catch (error) {
      this.integrationLogger.warn('Failed to determine migration strategy', {
        fromVersion,
        toVersion,
        error: error instanceof Error ? error.message : String(error)
      });
      return null;
    }
  }

  /**
   * Apply migration strategy to skin
   */
  async applyMigration(skin: UniversalSkinDefinition, strategy: MigrationStrategy): Promise<{
    migrated: boolean;
    result?: UniversalSkinDefinition;
    duration?: number;
    errors?: string[];
  }> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      let migratedSkin = { ...skin };

      // Apply migration steps
      if (strategy.migrationSteps) {
        for (const step of strategy.migrationSteps) {
          try {
            // Apply transformer if present
            if (step.transformer) {
              migratedSkin = await step.transformer(migratedSkin);
            }

            // Run validator if present
            if (step.validator) {
              const validation = await step.validator(migratedSkin);
              if (!validation.valid) {
                errors.push(`Migration step ${step.id} validation failed: ${validation.errors.join(', ')}`);
                if (step.required) {
                  return { migrated: false, duration: Date.now() - startTime, errors };
                }
              }
            }
          } catch (stepError) {
            const errorMsg = `Migration step ${step.id} failed: ${stepError}`;
            errors.push(errorMsg);
            if (step.required) {
              return { migrated: false, duration: Date.now() - startTime, errors };
            }
          }
        }
      }

      return {
        migrated: true,
        result: migratedSkin,
        duration: Date.now() - startTime,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      errors.push(`Migration failed: ${error}`);
      return {
        migrated: false,
        duration: Date.now() - startTime,
        errors
      };
    }
  }

  // ============================================================================
  // Version Information
  // ============================================================================

  /**
   * Get comprehensive version information for skin
   */
  async getVersionInfo(skin: UniversalSkinDefinition, systemVersion?: string): Promise<SkinVersionInfo> {
    try {
      const version = this.parseVersion(skin.version);
      const availableVersions = this.registeredVersions.get(skin.id) || [];
      const targetSystemVersion = systemVersion || this.systemVersion;

      // Determine if this is the latest version
      const isLatest = availableVersions.length === 0 || 
                       availableVersions.every(v => this.compareVersions(version, v) >= 0);

      // Determine if this is a stable version (no prerelease)
      const isStable = !version.prerelease || version.prerelease.length === 0;

      // Validate compatibility
      const compatibility = await this.validateCompatibility(skin, targetSystemVersion);

      return {
        version,
        isLatest,
        isStable,
        compatibilityLevel: compatibility.level,
        systemCompatibility: {
          supported: compatibility.compatible,
          minimumSystemVersion: skin.metadata.minimumVersion,
          warnings: compatibility.issues
        }
      };
    } catch (error) {
      if (isTemplumError(error)) {
        throw error;
      }
      throw createTemplumError(`Failed to get version info: ${error}`, 'version-info-error', 'validation');
    }
  }

  /**
   * List all available versions for a skin
   */
  listAvailableVersions(skinId: string): SemanticVersion[] {
    return this.registeredVersions.get(skinId) || [];
  }

  /**
   * Get latest version for a skin
   */
  getLatestVersion(skinId: string, includePrerelease?: boolean): SemanticVersion | null {
    const versions = this.registeredVersions.get(skinId) || [];
    if (versions.length === 0) return null;

    const candidates = includePrerelease ? 
      versions : 
      versions.filter(v => !v.prerelease || v.prerelease.length === 0);

    if (candidates.length === 0) return null;

    return candidates.sort((a, b) => this.compareVersions(b, a))[0];
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private comparePrereleaseVersions(v1?: string[], v2?: string[]): number {
    // No prerelease version has higher precedence than prerelease version
    if (!v1 && v2) return 1;
    if (v1 && !v2) return -1;
    if (!v1 && !v2) return 0;

    // Compare prerelease identifiers
    const maxLength = Math.max(v1!.length, v2!.length);
    for (let i = 0; i < maxLength; i++) {
      const a = v1![i];
      const b = v2![i];

      if (a === undefined) return -1;
      if (b === undefined) return 1;

      // Numeric comparison if both are numbers
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) {
        if (numA !== numB) return numA < numB ? -1 : 1;
      } else {
        // Lexical comparison
        if (a !== b) return a < b ? -1 : 1;
      }
    }

    return 0;
  }

  private satisfiesCaretRange(version: SemanticVersion, target: SemanticVersion): boolean {
    // ^1.2.3 allows changes that do not modify the major version
    if (version.major !== target.major) return false;
    return this.compareVersions(version, target) >= 0;
  }

  private satisfiesTildeRange(version: SemanticVersion, target: SemanticVersion): boolean {
    // ~1.2.3 allows patch-level changes if minor version is specified
    if (version.major !== target.major || version.minor !== target.minor) return false;
    return this.compareVersions(version, target) >= 0;
  }

  private async applyFallbackStrategy(
    query: SkinVersionQuery, 
    skinVersions: Array<{ id: string; skin: UniversalSkinDefinition; version: SemanticVersion }>
  ): Promise<{ resolved: boolean; skin?: UniversalSkinDefinition; version?: string; fallbackUsed?: boolean; reason?: string }> {
    
    const fallbackStrategy = query.fallbackStrategy || 'latest-compatible';

    switch (fallbackStrategy) {
      case 'latest-compatible':
        // Find latest version that's compatible with system
        for (const sv of skinVersions) {
          const compatibility = await this.validateCompatibility(sv.skin);
          if (compatibility.compatible || compatibility.level === 'partial') {
            return {
              resolved: true,
              skin: sv.skin,
              version: sv.skin.version,
              fallbackUsed: true,
              reason: 'Used latest compatible version as fallback'
            };
          }
        }
        break;

      case 'latest-stable':
        // Find latest stable (non-prerelease) version
        const stableVersions = skinVersions.filter(sv => !sv.version.prerelease);
        if (stableVersions.length > 0) {
          return {
            resolved: true,
            skin: stableVersions[0].skin,
            version: stableVersions[0].skin.version,
            fallbackUsed: true,
            reason: 'Used latest stable version as fallback'
          };
        }
        break;

      case 'system-default':
        // This would require system-level default skin configuration
        // For now, just return the latest version
        if (skinVersions.length > 0) {
          return {
            resolved: true,
            skin: skinVersions[0].skin,
            version: skinVersions[0].skin.version,
            fallbackUsed: true,
            reason: 'Used system default fallback'
          };
        }
        break;
    }

    return {
      resolved: false,
      reason: `No compatible version found with fallback strategy: ${fallbackStrategy}`
    };
  }

  private createDefaultMigrationStrategy(fromVersion: string, toVersion: string): MigrationStrategy {
    const fromSemver = this.parseVersion(fromVersion);
    const toSemver = this.parseVersion(toVersion);
    const _comparison = this.compareVersions(fromSemver, toSemver);

    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let strategy: 'automatic' | 'guided' | 'manual' | 'fallback' = 'automatic';
    
    // Major version changes are high risk
    if (fromSemver.major !== toSemver.major) {
      riskLevel = 'high';
      strategy = 'manual';
    }
    // Minor version changes are medium risk
    else if (fromSemver.minor !== toSemver.minor) {
      riskLevel = 'medium';
      strategy = 'guided';
    }

    return {
      id: `default-migration-${fromVersion}-to-${toVersion}`,
      fromVersion,
      toVersion,
      strategy,
      description: `Default migration from version ${fromVersion} to ${toVersion}`,
      estimatedTime: riskLevel === 'high' ? 5000 : (riskLevel === 'medium' ? 2000 : 500),
      riskLevel
    };
  }

  private initializeDefaultRules(): void {
    // Default compatibility rules
    const defaultRules: VersionCompatibilityRule[] = [
      {
        id: 'major-version-breaking',
        description: 'Major version changes indicate breaking changes',
        pattern: '*',
        systemVersion: '1.0.0',
        breaking: true,
        migrationRequired: true
      },
      {
        id: 'prerelease-compatibility',
        description: 'Prerelease versions may have stability issues',
        pattern: '*-*',
        systemVersion: '1.0.0',
        breaking: false,
        migrationRequired: false
      }
    ];

    this.compatibilityRules.set('default', defaultRules);
  }

  private initializeDefaultMigrationStrategies(): void {
    // Default migration strategies
    const defaultStrategies: MigrationStrategy[] = [
      {
        id: 'patch-level-migration',
        fromVersion: '*',
        toVersion: '*',
        strategy: 'automatic',
        description: 'Automatic migration for patch-level changes',
        estimatedTime: 500,
        riskLevel: 'low'
      },
      {
        id: 'minor-version-migration',
        fromVersion: '*',
        toVersion: '*',
        strategy: 'guided',
        description: 'Guided migration for minor version changes',
        estimatedTime: 2000,
        riskLevel: 'medium'
      },
      {
        id: 'major-version-migration',
        fromVersion: '*',
        toVersion: '*',
        strategy: 'manual',
        description: 'Manual migration required for major version changes',
        estimatedTime: 5000,
        riskLevel: 'high'
      }
    ];

    this.migrationStrategies.set('default', defaultStrategies);
  }

  /**
   * Register a skin version for tracking
   */
  registerSkinVersion(skinId: string, version: SemanticVersion): void {
    const versions = this.registeredVersions.get(skinId) || [];
    
    // Add version if not already present
    const exists = versions.some(v => this.compareVersions(v, version) === 0);
    if (!exists) {
      versions.push(version);
      versions.sort((a, b) => this.compareVersions(b, a)); // Sort descending
      this.registeredVersions.set(skinId, versions);
    }
  }

  /**
   * Unregister a skin version
   */
  unregisterSkinVersion(skinId: string, version: string): void {
    const versions = this.registeredVersions.get(skinId) || [];
    const filtered = versions.filter(v => this.compareVersions(v, version) !== 0);
    
    if (filtered.length === 0) {
      this.registeredVersions.delete(skinId);
    } else {
      this.registeredVersions.set(skinId, filtered);
    }
  }

  // ============================================================================
  // Advanced Compatibility Validation (TASK-SKIN-002)
  // ============================================================================

  async validateAdvancedCompatibility(
    skin: UniversalSkinDefinition,
    targetInterface: InterfaceType,
    options?: AdvancedCompatibilityOptions
  ): Promise<AdvancedCompatibilityReport> {
    try {
      return await this.advancedCompatibilityService.validate(skin, targetInterface, options);
    } catch (error) {
      throw createTemplumError(
        `Advanced compatibility validation failed: ${error}`,
        'advanced-compatibility-error',
        'validation'
      );
    }
  }

  private normalizePrerelease(prerelease: string[] | undefined, context: string): string {
    const outcome = this.serializeWithMetrics(prerelease ?? [], context);
    return outcome.value ?? '[]';
  }

  private measureSkinBytes(skin: UniversalSkinDefinition, context: string): number {
    return this.serializeWithMetrics(skin, context).meta.bytes;
  }

  private serializeWithMetrics(value: unknown, context: string): SerializationOutcome<string> {
    const builder = serialization.json(value).context(context).fallback('{}');
    const outcome = builder.stringify();
    emitSerializationWarnings(context, outcome);
    return outcome;
  }
}
