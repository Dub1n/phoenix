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
  MigrationStep,
  SkinRegistrationRequest,
  SkinRegistrationResult,
  SkinVersionQuery,
  SkinVersionInfo,
  ISkinVersionManager,
  ConflictResolutionStrategy,
  // Advanced compatibility types (TASK-SKIN-002)
  InterfaceRequirements,
  AdvancedCompatibilityOptions,
  AdvancedCompatibilityReport,
  StructuralCompatibilityResult,
  FeatureCompatibilityResult,
  AssetCompatibilityResult,
  PerformanceCompatibilityResult,
  CrossInterfaceCompatibilityResult,
  InterfaceCapabilityMatrix,
  AssetRequirements,
  PerformanceConstraints,
  InterfaceType
} from '../types/universal-skin-engine-types';
import {
  TemplumError,
  isTemplumError,
  createTemplumError,
  Signals,
  ErrorSignalPayload,
  MetricsSignalPayload
} from '../types/templum-types';

/**
 * Comprehensive skin version management with semantic versioning support
 */
export class SkinVersionManager implements ISkinVersionManager {
  private compatibilityRules: Map<string, VersionCompatibilityRule[]> = new Map();
  private migrationStrategies: Map<string, MigrationStrategy[]> = new Map();
  private systemVersion: string = '1.0.0';
  private registeredVersions: Map<string, SemanticVersion[]> = new Map(); // skinId -> versions
  
  // Advanced compatibility support (TASK-SKIN-002)
  private interfaceRequirements: Map<InterfaceType, InterfaceRequirements> = new Map();
  private interfaceCapabilityMatrix: InterfaceCapabilityMatrix = {};
  private validatorVersion: string = '1.0.0';

  constructor(systemVersion?: string) {
    if (systemVersion) {
      this.systemVersion = systemVersion;
    }
    this.initializeDefaultRules();
    this.initializeDefaultMigrationStrategies();
    // Initialize advanced compatibility system (TASK-SKIN-002)
    this.initializeInterfaceRequirements();
    this.initializeInterfaceCapabilityMatrix();
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
      console.warn(`SkinVersionManager: Failed to evaluate range ${range} for version ${version}:`, error);
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
      const versionComparison = this.compareVersions(skinVersion, systemSemver);
      
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
          issues.push(`Minimum system version ${skin.metadata.minimumVersion} required`);
          overallCompatible = false;
          compatibilityLevel = 'incompatible';
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
        .filter(([id, skin]) => skin.id === query.skinId)
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
      else if (JSON.stringify(existingVersion.prerelease) !== JSON.stringify(newVersion.prerelease)) {
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
      console.warn(`SkinVersionManager: Failed to detect conflicts:`, error);
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
      console.warn(`SkinVersionManager: Failed to find migration strategy:`, error);
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
    const comparison = this.compareVersions(fromSemver, toSemver);

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

  /**
   * Comprehensive advanced compatibility validation for skin and interface
   */
  async validateAdvancedCompatibility(
    skin: UniversalSkinDefinition,
    targetInterface: InterfaceType,
    options?: AdvancedCompatibilityOptions
  ): Promise<AdvancedCompatibilityReport> {
    const startTime = Date.now();
    const opts = {
      includeWarnings: true,
      validateAssets: true,
      checkPerformance: true,
      crossInterfaceValidation: false,
      strictMode: false,
      ...options
    };

    try {
      // Perform individual compatibility checks
      const structuralResult = await this.validateStructuralCompatibility(skin, targetInterface, opts);
      const featureResult = await this.validateFeatureCompatibility(skin, targetInterface, opts);
      const assetResult = opts.validateAssets ? 
        await this.validateAssetCompatibility(skin, targetInterface, opts) : this.createSkippedAssetResult();
      const performanceResult = opts.checkPerformance ?
        await this.validatePerformanceCompatibility(skin, targetInterface, opts) : this.createSkippedPerformanceResult();
      const crossInterfaceResult = opts.crossInterfaceValidation ?
        await this.validateCrossInterfaceCompatibility(skin, targetInterface, opts) : undefined;

      // Calculate overall compatibility score and status
      const scores = [structuralResult.score, featureResult.score, assetResult.score, performanceResult.score];
      const overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
      
      // Determine overall compatibility status
      let overall: 'compatible' | 'partially-compatible' | 'incompatible';
      if (overallScore >= 90 && structuralResult.compatible && featureResult.compatible) {
        overall = 'compatible';
      } else if (overallScore >= 60 && (structuralResult.compatible || featureResult.compatible)) {
        overall = 'partially-compatible';
      } else {
        overall = 'incompatible';
      }

      // Compile recommendations, warnings, and errors
      const recommendations: string[] = [];
      const warnings: string[] = [];
      const errors: string[] = [];

      // Structural issues
      if (!structuralResult.compatible) {
        errors.push(...structuralResult.missingComponents.map(c => `Missing required component: ${c}`));
        structuralResult.invalidComponents.forEach(ic => {
          errors.push(`Invalid component ${ic.component}: ${ic.issues.join(', ')}`);
        });
      }

      // Feature compatibility issues
      if (!featureResult.compatible) {
        if (featureResult.unsupportedFeatures.length > 0) {
          errors.push(`Unsupported features: ${featureResult.unsupportedFeatures.join(', ')}`);
        }
        featureResult.partiallySupported.forEach(ps => {
          warnings.push(`Feature ${ps.feature} partially supported: ${ps.limitations.join(', ')}`);
        });
      }

      // Asset issues
      if (!assetResult.compatible && opts.validateAssets) {
        if (assetResult.missingAssets.length > 0) {
          errors.push(`Missing required assets: ${assetResult.missingAssets.join(', ')}`);
        }
        assetResult.invalidAssets.forEach(ia => {
          errors.push(`Invalid asset ${ia.asset}: ${ia.issues.join(', ')}`);
        });
        assetResult.oversizedAssets.forEach(oa => {
          warnings.push(`Asset ${oa.asset} exceeds size limit: ${oa.size} > ${oa.limit} bytes`);
        });
      }

      // Performance issues
      if (!performanceResult.compatible && opts.checkPerformance) {
        if (!performanceResult.skinSize.withinLimits) {
          warnings.push(`Skin size may be too large: ${performanceResult.skinSize.actual} bytes`);
        }
        if (!performanceResult.complexitySupported) {
          errors.push(`Complexity level ${performanceResult.complexityLevel} not supported`);
        }
        warnings.push(...performanceResult.performanceWarnings);
      }

      // Generate recommendations
      if (overallScore < 90) {
        recommendations.push('Consider optimizing skin for better compatibility');
      }
      if (structuralResult.score < 80) {
        recommendations.push('Review and implement missing required components');
      }
      if (featureResult.score < 80) {
        recommendations.push('Reduce dependency on unsupported features or provide fallbacks');
      }

      return {
        overall,
        skinId: skin.id,
        targetInterface,
        structuralCompatibility: structuralResult,
        featureCompatibility: featureResult,
        assetCompatibility: assetResult,
        performanceCompatibility: performanceResult,
        crossInterfaceCompatibility: crossInterfaceResult,
        score: overallScore,
        recommendations,
        warnings: opts.includeWarnings ? warnings : [],
        errors,
        validationDate: new Date(),
        validationDuration: Date.now() - startTime,
        validatorVersion: this.validatorVersion
      };

    } catch (error) {
      throw createTemplumError(
        `Advanced compatibility validation failed: ${error}`,
        'advanced-compatibility-error',
        'validation'
      );
    }
  }

  /**
   * Validate structural compatibility (components match interface requirements)
   */
  private async validateStructuralCompatibility(
    skin: UniversalSkinDefinition,
    targetInterface: InterfaceType,
    options: Required<AdvancedCompatibilityOptions>
  ): Promise<StructuralCompatibilityResult> {
    const requirements = this.interfaceRequirements.get(targetInterface);
    if (!requirements) {
      throw createTemplumError(
        `No requirements defined for interface: ${targetInterface}`,
        'interface-requirements-missing',
        'validation'
      );
    }

    const requiredComponents: { component: string; present: boolean; valid: boolean }[] = [];
    const missingComponents: string[] = [];
    const invalidComponents: { component: string; issues: string[] }[] = [];

    // Check each required component
    for (const component of requirements.requiredComponents) {
      const present = this.isComponentPresent(skin, component);
      const valid = present ? this.isComponentValid(skin, component, targetInterface) : false;
      
      requiredComponents.push({ component, present, valid });
      
      if (!present) {
        missingComponents.push(component);
      } else if (!valid) {
        const issues = this.getComponentValidationIssues(skin, component, targetInterface);
        invalidComponents.push({ component, issues });
      }
    }

    // Calculate structural compatibility score
    const totalComponents = requirements.requiredComponents.length;
    const validComponents = requiredComponents.filter(rc => rc.present && rc.valid).length;
    const score = totalComponents > 0 ? Math.round((validComponents / totalComponents) * 100) : 100;
    
    return {
      compatible: missingComponents.length === 0 && invalidComponents.length === 0,
      requiredComponents,
      missingComponents,
      invalidComponents,
      score
    };
  }

  /**
   * Validate feature compatibility (features supported by interface)
   */
  private async validateFeatureCompatibility(
    skin: UniversalSkinDefinition,
    targetInterface: InterfaceType,
    options: Required<AdvancedCompatibilityOptions>
  ): Promise<FeatureCompatibilityResult> {
    const interfaceCapabilities = this.interfaceCapabilityMatrix[targetInterface];
    if (!interfaceCapabilities) {
      throw createTemplumError(
        `No capabilities defined for interface: ${targetInterface}`,
        'interface-capabilities-missing',
        'validation'
      );
    }

    // Extract features from skin metadata
    const skinFeatures = skin.metadata.features ? Object.keys(skin.metadata.features) : [];
    const supportedFeatures: string[] = [];
    const unsupportedFeatures: string[] = [];
    const partiallySupported: { feature: string; limitations: string[] }[] = [];
    const featureMatrix: Record<string, 'supported' | 'partial' | 'unsupported'> = {};

    // Check each skin feature against interface capabilities
    for (const feature of skinFeatures) {
      if (interfaceCapabilities.supportedFeatures.includes(feature)) {
        supportedFeatures.push(feature);
        featureMatrix[feature] = 'supported';
      } else if (this.isFeaturePartiallySupported(feature, targetInterface)) {
        const limitations = this.getFeatureLimitations(feature, targetInterface);
        partiallySupported.push({ feature, limitations });
        featureMatrix[feature] = 'partial';
      } else {
        unsupportedFeatures.push(feature);
        featureMatrix[feature] = 'unsupported';
      }
    }

    // Calculate feature compatibility score
    const totalFeatures = skinFeatures.length;
    const supportedCount = supportedFeatures.length + (partiallySupported.length * 0.5);
    const score = totalFeatures > 0 ? Math.round((supportedCount / totalFeatures) * 100) : 100;

    return {
      compatible: unsupportedFeatures.length === 0,
      supportedFeatures,
      unsupportedFeatures,
      partiallySupported,
      featureMatrix,
      score
    };
  }

  /**
   * Validate asset compatibility (assets exist and in correct formats)
   */
  private async validateAssetCompatibility(
    skin: UniversalSkinDefinition,
    targetInterface: InterfaceType,
    options: Required<AdvancedCompatibilityOptions>
  ): Promise<AssetCompatibilityResult> {
    const requirements = this.interfaceRequirements.get(targetInterface);
    if (!requirements) {
      return this.createSkippedAssetResult();
    }

    const validAssets: string[] = [];
    const missingAssets: string[] = [];
    const invalidAssets: { asset: string; issues: string[] }[] = [];
    const oversizedAssets: { asset: string; size: number; limit: number }[] = [];
    const unsupportedFormats: { asset: string; format: string; supportedFormats: string[] }[] = [];

    // Validate icons
    if (skin.assets?.icons) {
      for (const [iconName, iconDef] of Object.entries(skin.assets.icons)) {
        const issues = this.validateAsset(iconDef, requirements.assetRequirements, 'icon');
        if (issues.length === 0) {
          validAssets.push(iconName);
        } else {
          invalidAssets.push({ asset: iconName, issues });
        }
      }
    }

    // Validate required icons
    if (requirements.assetRequirements.requiredIcons) {
      for (const requiredIcon of requirements.assetRequirements.requiredIcons) {
        if (!skin.assets?.icons?.[requiredIcon]) {
          missingAssets.push(requiredIcon);
        }
      }
    }

    // Calculate asset compatibility score
    const totalAssets = (skin.assets?.icons ? Object.keys(skin.assets.icons).length : 0) + 
                       (requirements.assetRequirements.requiredIcons?.length || 0);
    const validAssetCount = validAssets.length;
    const score = totalAssets > 0 ? Math.round((validAssetCount / totalAssets) * 100) : 100;

    return {
      compatible: missingAssets.length === 0 && invalidAssets.length === 0,
      validAssets,
      missingAssets,
      invalidAssets,
      oversizedAssets,
      unsupportedFormats,
      score
    };
  }

  /**
   * Validate performance compatibility (meets interface constraints)
   */
  private async validatePerformanceCompatibility(
    skin: UniversalSkinDefinition,
    targetInterface: InterfaceType,
    options: Required<AdvancedCompatibilityOptions>
  ): Promise<PerformanceCompatibilityResult> {
    const requirements = this.interfaceRequirements.get(targetInterface);
    if (!requirements) {
      return this.createSkippedPerformanceResult();
    }

    const constraints = requirements.performanceConstraints;
    const performanceWarnings: string[] = [];

    // Estimate skin size
    const skinSize = JSON.stringify(skin).length;
    const skinSizeWithinLimits = !constraints.maxSkinSize || skinSize <= constraints.maxSkinSize;

    // Estimate render time (simplified calculation)
    const componentCount = Object.keys(skin.components || {}).length;
    const themeCount = Object.keys(skin.themes || {}).length;
    const estimatedRenderTime = (componentCount * 10) + (themeCount * 5); // milliseconds
    const renderTimeWithinLimits = !constraints.maxRenderTime || estimatedRenderTime <= constraints.maxRenderTime;

    // Estimate memory usage (simplified)
    const estimatedMemory = Math.round(skinSize / 1024); // KB to MB approximation
    const memoryWithinLimits = !constraints.maxMemoryUsage || estimatedMemory <= constraints.maxMemoryUsage;

    // Determine complexity level
    let complexityLevel: 'low' | 'medium' | 'high' = 'low';
    if (componentCount > 20 || themeCount > 5) {
      complexityLevel = 'high';
    } else if (componentCount > 10 || themeCount > 2) {
      complexityLevel = 'medium';
    }

    const complexitySupported = this.isComplexitySupportedByInterface(complexityLevel, constraints.supportedComplexity);

    // Generate performance warnings
    if (!skinSizeWithinLimits) {
      performanceWarnings.push(`Skin size ${skinSize} bytes exceeds recommended limit`);
    }
    if (!renderTimeWithinLimits) {
      performanceWarnings.push(`Estimated render time ${estimatedRenderTime}ms may exceed limit`);
    }
    if (!memoryWithinLimits) {
      performanceWarnings.push(`Estimated memory usage ${estimatedMemory}MB may exceed limit`);
    }
    if (!complexitySupported) {
      performanceWarnings.push(`Complexity level ${complexityLevel} may not be fully supported`);
    }

    // Calculate performance score
    const checks = [skinSizeWithinLimits, renderTimeWithinLimits, memoryWithinLimits, complexitySupported];
    const passedChecks = checks.filter(Boolean).length;
    const score = Math.round((passedChecks / checks.length) * 100);

    return {
      compatible: skinSizeWithinLimits && renderTimeWithinLimits && memoryWithinLimits && complexitySupported,
      skinSize: { actual: skinSize, limit: constraints.maxSkinSize, withinLimits: skinSizeWithinLimits },
      estimatedRenderTime: { estimated: estimatedRenderTime, limit: constraints.maxRenderTime, withinLimits: renderTimeWithinLimits },
      estimatedMemoryUsage: { estimated: estimatedMemory, limit: constraints.maxMemoryUsage, withinLimits: memoryWithinLimits },
      complexityLevel,
      complexitySupported,
      performanceWarnings,
      score
    };
  }

  /**
   * Validate cross-interface compatibility
   */
  private async validateCrossInterfaceCompatibility(
    skin: UniversalSkinDefinition,
    primaryInterface: InterfaceType,
    options: Required<AdvancedCompatibilityOptions>
  ): Promise<CrossInterfaceCompatibilityResult> {
    const allInterfaces: InterfaceType[] = ['vscode', 'cli', 'command'];
    const testedInterfaces = allInterfaces.filter(iface => iface !== primaryInterface);
    const compatibleInterfaces: InterfaceType[] = [primaryInterface]; // primary is assumed compatible
    const incompatibleInterfaces: { interface: InterfaceType; issues: string[] }[] = [];
    const sharedFeatures: string[] = [];
    const interfaceSpecificFeatures: Record<string, string[]> = {};

    // Test compatibility with other interfaces
    for (const iface of testedInterfaces) {
      const structuralResult = await this.validateStructuralCompatibility(skin, iface, options);
      const featureResult = await this.validateFeatureCompatibility(skin, iface, options);
      
      if (structuralResult.compatible && featureResult.compatible) {
        compatibleInterfaces.push(iface);
      } else {
        const issues: string[] = [];
        if (!structuralResult.compatible) {
          issues.push(...structuralResult.missingComponents.map(c => `Missing component: ${c}`));
        }
        if (!featureResult.compatible) {
          issues.push(...featureResult.unsupportedFeatures.map(f => `Unsupported feature: ${f}`));
        }
        incompatibleInterfaces.push({ interface: iface, issues });
      }
    }

    // Analyze feature portability
    const skinFeatures = skin.metadata.features ? Object.keys(skin.metadata.features) : [];
    for (const feature of skinFeatures) {
      const supportingInterfaces = allInterfaces.filter(iface => {
        const capabilities = this.interfaceCapabilityMatrix[iface];
        return capabilities && capabilities.supportedFeatures.includes(feature);
      });

      if (supportingInterfaces.length === allInterfaces.length) {
        sharedFeatures.push(feature);
      } else {
        for (const iface of supportingInterfaces) {
          if (!interfaceSpecificFeatures[iface]) {
            interfaceSpecificFeatures[iface] = [];
          }
          interfaceSpecificFeatures[iface].push(feature);
        }
      }
    }

    // Calculate portability score
    const portabilityScore = Math.round((compatibleInterfaces.length / allInterfaces.length) * 100);

    return {
      compatible: incompatibleInterfaces.length === 0,
      testedInterfaces: allInterfaces,
      compatibleInterfaces,
      incompatibleInterfaces,
      sharedFeatures,
      interfaceSpecificFeatures,
      portabilityScore
    };
  }

  // ============================================================================
  // Advanced Compatibility Helper Methods
  // ============================================================================

  private initializeInterfaceRequirements(): void {
    // VSCode interface requirements
    this.interfaceRequirements.set('vscode', {
      interfaceType: 'vscode',
      requiredComponents: ['views', 'commands'],
      supportedFeatures: ['treeViews', 'webViews', 'commands', 'themes', 'icons', 'statusBar', 'notifications'],
      assetRequirements: {
        supportedIconFormats: ['svg', 'png'],
        supportedImageFormats: ['png', 'jpg', 'svg'],
        maxAssetSize: 1024 * 1024, // 1MB
        requiredThemeProperties: ['colors', 'tokenColors']
      },
      performanceConstraints: {
        maxSkinSize: 5 * 1024 * 1024, // 5MB
        maxRenderTime: 1000, // 1 second
        maxMemoryUsage: 50, // 50MB
        maxStartupTime: 2000, // 2 seconds
        supportedComplexity: 'high'
      },
      description: 'VSCode extension interface with rich UI capabilities'
    });

    // CLI interface requirements
    this.interfaceRequirements.set('cli', {
      interfaceType: 'cli',
      requiredComponents: ['menus'],
      supportedFeatures: ['menus', 'commands', 'colors', 'text', 'tables', 'progress'],
      assetRequirements: {
        supportedIconFormats: ['text', 'unicode'],
        supportedImageFormats: [],
        maxAssetSize: 64 * 1024, // 64KB
        requiredThemeProperties: ['colors']
      },
      performanceConstraints: {
        maxSkinSize: 512 * 1024, // 512KB
        maxRenderTime: 100, // 100ms
        maxMemoryUsage: 10, // 10MB
        maxStartupTime: 500, // 500ms
        supportedComplexity: 'medium'
      },
      description: 'Command-line interface with terminal-based UI'
    });

    // Command interface requirements
    this.interfaceRequirements.set('command', {
      interfaceType: 'command',
      requiredComponents: ['commands', 'workflows'],
      supportedFeatures: ['commands', 'workflows', 'parameters', 'validation', 'help'],
      assetRequirements: {
        supportedIconFormats: ['text'],
        supportedImageFormats: [],
        maxAssetSize: 32 * 1024, // 32KB
        requiredThemeProperties: []
      },
      performanceConstraints: {
        maxSkinSize: 256 * 1024, // 256KB
        maxRenderTime: 50, // 50ms
        maxMemoryUsage: 5, // 5MB
        maxStartupTime: 200, // 200ms
        supportedComplexity: 'low'
      },
      description: 'Command-line execution interface'
    });
  }

  private initializeInterfaceCapabilityMatrix(): void {
    this.interfaceCapabilityMatrix = {
      vscode: {
        supportedComponents: ['views', 'commands', 'webViews', 'statusBar', 'notifications'],
        supportedFeatures: ['treeViews', 'webViews', 'commands', 'themes', 'icons', 'statusBar', 'notifications', 'hover', 'completion'],
        assetCapabilities: this.interfaceRequirements.get('vscode')!.assetRequirements,
        performanceProfile: this.interfaceRequirements.get('vscode')!.performanceConstraints,
        specializations: ['extension-host', 'webview-rendering', 'native-ui']
      },
      cli: {
        supportedComponents: ['menus', 'commands', 'tables', 'progress'],
        supportedFeatures: ['menus', 'commands', 'colors', 'text', 'tables', 'progress', 'input', 'selection'],
        assetCapabilities: this.interfaceRequirements.get('cli')!.assetRequirements,
        performanceProfile: this.interfaceRequirements.get('cli')!.performanceConstraints,
        specializations: ['ansi-colors', 'terminal-ui', 'keyboard-navigation']
      },
      command: {
        supportedComponents: ['commands', 'workflows', 'parameters'],
        supportedFeatures: ['commands', 'workflows', 'parameters', 'validation', 'help', 'pipes'],
        assetCapabilities: this.interfaceRequirements.get('command')!.assetRequirements,
        performanceProfile: this.interfaceRequirements.get('command')!.performanceConstraints,
        specializations: ['command-parsing', 'workflow-execution', 'parameter-validation']
      }
    };
  }

  private isComponentPresent(skin: UniversalSkinDefinition, component: string): boolean {
    switch (component) {
      case 'views':
        return !!(skin.views && Object.keys(skin.views).length > 0);
      case 'menus':
        return !!(skin.menus && Object.keys(skin.menus).length > 0);
      case 'commands':
        return !!(skin.commands && Object.keys(skin.commands).length > 0);
      case 'workflows':
        return !!(skin.workflows && Object.keys(skin.workflows).length > 0);
      default:
        return false;
    }
  }

  private isComponentValid(skin: UniversalSkinDefinition, component: string, targetInterface: InterfaceType): boolean {
    // Simplified validation - in a real implementation, this would be more comprehensive
    switch (component) {
      case 'views':
        return !!(skin.views && typeof skin.views === 'object');
      case 'menus':
        return !!(skin.menus && typeof skin.menus === 'object');
      case 'commands':
        return !!(skin.commands && typeof skin.commands === 'object');
      case 'workflows':
        return !!(skin.workflows && typeof skin.workflows === 'object');
      default:
        return false;
    }
  }

  private getComponentValidationIssues(skin: UniversalSkinDefinition, component: string, targetInterface: InterfaceType): string[] {
    const issues: string[] = [];
    
    switch (component) {
      case 'views':
        if (!skin.views) {
          issues.push('Views component is missing');
        } else if (typeof skin.views !== 'object') {
          issues.push('Views component must be an object');
        }
        break;
      case 'menus':
        if (!skin.menus) {
          issues.push('Menus component is missing');
        } else if (typeof skin.menus !== 'object') {
          issues.push('Menus component must be an object');
        }
        break;
      case 'commands':
        if (!skin.commands) {
          issues.push('Commands component is missing');
        } else if (typeof skin.commands !== 'object') {
          issues.push('Commands component must be an object');
        }
        break;
      case 'workflows':
        if (!skin.workflows) {
          issues.push('Workflows component is missing');
        } else if (typeof skin.workflows !== 'object') {
          issues.push('Workflows component must be an object');
        }
        break;
    }

    return issues;
  }

  private isFeaturePartiallySupported(feature: string, targetInterface: InterfaceType): boolean {
    // Define partial support scenarios
    const partialSupport: Record<string, string[]> = {
      'webViews': ['cli'], // CLI can show limited web content
      'themes': ['command'], // Command interface has limited theme support
      'icons': ['cli', 'command'] // CLI/command can use text-based icons
    };

    return partialSupport[feature]?.includes(targetInterface) || false;
  }

  private getFeatureLimitations(feature: string, targetInterface: InterfaceType): string[] {
    const limitations: Record<string, Record<string, string[]>> = {
      'webViews': {
        'cli': ['Limited to text output', 'No interactive elements']
      },
      'themes': {
        'command': ['Basic color support only', 'No complex styling']
      },
      'icons': {
        'cli': ['Text-based icons only', 'Limited Unicode support'],
        'command': ['Text representation only']
      }
    };

    return limitations[feature]?.[targetInterface] || [];
  }

  private validateAsset(asset: any, requirements: AssetRequirements, assetType: string): string[] {
    const issues: string[] = [];
    
    // This is a simplified validation - real implementation would check file existence, format, etc.
    if (!asset) {
      issues.push('Asset is missing');
    }
    
    // Add more specific validation based on asset type and requirements
    return issues;
  }

  private isComplexitySupportedByInterface(skinComplexity: string, interfaceSupported: string): boolean {
    const complexityLevels = { low: 1, medium: 2, high: 3 };
    const skinLevel = complexityLevels[skinComplexity as keyof typeof complexityLevels] || 1;
    const supportedLevel = complexityLevels[interfaceSupported as keyof typeof complexityLevels] || 1;
    
    return skinLevel <= supportedLevel;
  }

  private createSkippedAssetResult(): AssetCompatibilityResult {
    return {
      compatible: true,
      validAssets: [],
      missingAssets: [],
      invalidAssets: [],
      oversizedAssets: [],
      unsupportedFormats: [],
      score: 100
    };
  }

  private createSkippedPerformanceResult(): PerformanceCompatibilityResult {
    return {
      compatible: true,
      skinSize: { actual: 0, withinLimits: true },
      estimatedRenderTime: { estimated: 0, withinLimits: true },
      estimatedMemoryUsage: { estimated: 0, withinLimits: true },
      complexityLevel: 'low',
      complexitySupported: true,
      performanceWarnings: [],
      score: 100
    };
  }
}