import {
  UniversalSkinDefinition,
  InterfaceType,
  AdvancedCompatibilityOptions,
  AdvancedCompatibilityReport,
  StructuralCompatibilityResult,
  FeatureCompatibilityResult,
  AssetCompatibilityResult,
  PerformanceCompatibilityResult,
  CrossInterfaceCompatibilityResult,
  InterfaceRequirements,
  InterfaceCapabilityMatrix,
  AssetRequirements
} from '../../types/universal-skin-engine-types';
import { createTemplumError } from '../../types/templum-types';

export interface AdvancedCompatibilityDependencies {
  validatorVersionProvider: () => string;
  measureSkinBytes: (skin: UniversalSkinDefinition, context: string) => number;
}

export class AdvancedCompatibilityService {
  constructor(
    private readonly interfaceRequirements: Map<InterfaceType, InterfaceRequirements>,
    private readonly interfaceCapabilityMatrix: InterfaceCapabilityMatrix,
    private readonly deps: AdvancedCompatibilityDependencies
  ) {}

  async validate(
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

    const structuralResult = await this.validateStructuralCompatibility(skin, targetInterface, opts);
    const featureResult = await this.validateFeatureCompatibility(skin, targetInterface, opts);
    const assetResult = opts.validateAssets
      ? await this.validateAssetCompatibility(skin, targetInterface, opts)
      : this.createSkippedAssetResult();
    const performanceResult = opts.checkPerformance
      ? await this.validatePerformanceCompatibility(skin, targetInterface, opts)
      : this.createSkippedPerformanceResult();
    const crossInterfaceResult = opts.crossInterfaceValidation
      ? await this.validateCrossInterfaceCompatibility(skin, targetInterface, opts)
      : undefined;

    const scores = [
      structuralResult.score,
      featureResult.score,
      assetResult.score,
      performanceResult.score
    ];
    const overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);

    let overall: 'compatible' | 'partially-compatible' | 'incompatible';
    if (overallScore >= 90 && structuralResult.compatible && featureResult.compatible) {
      overall = 'compatible';
    } else if (overallScore >= 60 && (structuralResult.compatible || featureResult.compatible)) {
      overall = 'partially-compatible';
    } else {
      overall = 'incompatible';
    }

    const recommendations: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    if (!structuralResult.compatible) {
      errors.push(...structuralResult.missingComponents.map(component => `Missing required component: ${component}`));
      structuralResult.invalidComponents.forEach(component => {
        errors.push(`Invalid component ${component.component}: ${component.issues.join(', ')}`);
      });
    }

    if (!featureResult.compatible) {
      if (featureResult.unsupportedFeatures.length > 0) {
        errors.push(`Unsupported features: ${featureResult.unsupportedFeatures.join(', ')}`);
      }
      featureResult.partiallySupported.forEach(partial => {
        warnings.push(`Feature ${partial.feature} partially supported: ${partial.limitations.join(', ')}`);
      });
    }

    if (!assetResult.compatible && opts.validateAssets) {
      if (assetResult.missingAssets.length > 0) {
        errors.push(`Missing required assets: ${assetResult.missingAssets.join(', ')}`);
      }
      assetResult.invalidAssets.forEach(asset => {
        errors.push(`Invalid asset ${asset.asset}: ${asset.issues.join(', ')}`);
      });
      assetResult.oversizedAssets.forEach(oversized => {
        warnings.push(`Asset ${oversized.asset} exceeds size limit: ${oversized.size} > ${oversized.limit} bytes`);
      });
    }

    if (!performanceResult.compatible && opts.checkPerformance) {
      if (!performanceResult.skinSize.withinLimits) {
        warnings.push(`Skin size ${performanceResult.skinSize.actual} bytes exceeds recommended limit`);
      }
      if (!performanceResult.estimatedRenderTime.withinLimits) {
        warnings.push(`Estimated render time ${performanceResult.estimatedRenderTime.estimated}ms may exceed limit`);
      }
      if (!performanceResult.estimatedMemoryUsage.withinLimits) {
        warnings.push(`Estimated memory usage ${performanceResult.estimatedMemoryUsage.estimated}MB may exceed limit`);
      }
      if (!performanceResult.complexitySupported) {
        errors.push(`Complexity level ${performanceResult.complexityLevel} not supported`);
      }
      warnings.push(...performanceResult.performanceWarnings);
    }

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
      validatorVersion: this.deps.validatorVersionProvider()
    };
  }

  private async validateStructuralCompatibility(
    skin: UniversalSkinDefinition,
    targetInterface: InterfaceType,
    _options: Required<AdvancedCompatibilityOptions>
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

    const totalComponents = requirements.requiredComponents.length;
    const validComponents = requiredComponents.filter(component => component.present && component.valid).length;
    const score = totalComponents > 0 ? Math.round((validComponents / totalComponents) * 100) : 100;

    return {
      compatible: missingComponents.length === 0 && invalidComponents.length === 0,
      requiredComponents,
      missingComponents,
      invalidComponents,
      score
    };
  }

  private async validateFeatureCompatibility(
    skin: UniversalSkinDefinition,
    targetInterface: InterfaceType,
    _options: Required<AdvancedCompatibilityOptions>
  ): Promise<FeatureCompatibilityResult> {
    const interfaceCapabilities = this.interfaceCapabilityMatrix[targetInterface];
    if (!interfaceCapabilities) {
      throw createTemplumError(
        `No capabilities defined for interface: ${targetInterface}`,
        'interface-capabilities-missing',
        'validation'
      );
    }

    const skinFeatures = skin.metadata.features ? Object.keys(skin.metadata.features) : [];
    const supportedFeatures: string[] = [];
    const unsupportedFeatures: string[] = [];
    const partiallySupported: { feature: string; limitations: string[] }[] = [];
    const featureMatrix: Record<string, 'supported' | 'partial' | 'unsupported'> = {};

    for (const feature of skinFeatures) {
      if (interfaceCapabilities.supportedFeatures.includes(feature)) {
        supportedFeatures.push(feature);
        featureMatrix[feature] = 'supported';
      } else if (this.isFeaturePartiallySupported(feature, targetInterface)) {
        partiallySupported.push({ feature, limitations: this.getFeatureLimitations(feature, targetInterface) });
        featureMatrix[feature] = 'partial';
      } else {
        unsupportedFeatures.push(feature);
        featureMatrix[feature] = 'unsupported';
      }
    }

    const totalFeatures = skinFeatures.length || 1;
    const score = Math.round((supportedFeatures.length / totalFeatures) * 100);

    return {
      compatible: unsupportedFeatures.length === 0,
      supportedFeatures,
      unsupportedFeatures,
      partiallySupported,
      featureMatrix,
      score
    };
  }

  private async validateAssetCompatibility(
    skin: UniversalSkinDefinition,
    targetInterface: InterfaceType,
    _options: Required<AdvancedCompatibilityOptions>
  ): Promise<AssetCompatibilityResult> {
    const requirements = this.interfaceRequirements.get(targetInterface);
    if (!requirements) {
      throw createTemplumError(
        `No requirements defined for interface: ${targetInterface}`,
        'interface-requirements-missing',
        'validation'
      );
    }

    const { assetRequirements } = requirements;
    const validAssets: string[] = [];
    const missingAssets: string[] = [];
    const invalidAssets: { asset: string; issues: string[] }[] = [];
    const oversizedAssets: { asset: string; size: number; limit: number }[] = [];
    const unsupportedFormats: AssetCompatibilityResult['unsupportedFormats'] = [];

    const themeAssets = skin.themes || {};
    Object.entries(themeAssets).forEach(([themeName, theme]) => {
      if (!theme) {
        missingAssets.push(`theme:${themeName}`);
        return;
      }

      if ('icons' in theme && theme.icons) {
        Object.entries(theme.icons).forEach(([iconName, icon]) => {
          const valid = this.validateAsset(icon, assetRequirements, 'icon');
          if (valid.length === 0) {
            validAssets.push(`theme:${themeName}:icon:${iconName}`);
          } else {
            invalidAssets.push({ asset: `theme:${themeName}:icon:${iconName}`, issues: valid });
          }
        });
      }

      if ('images' in theme && theme.images) {
        Object.entries(theme.images).forEach(([imageName, image]) => {
          const valid = this.validateAsset(image, assetRequirements, 'image');
          if (valid.length === 0) {
            validAssets.push(`theme:${themeName}:image:${imageName}`);
          } else {
            invalidAssets.push({ asset: `theme:${themeName}:image:${imageName}`, issues: valid });
          }
        });
      }
    });

    const totalAssets = validAssets.length + invalidAssets.length + missingAssets.length || 1;
    const score = Math.round((validAssets.length / totalAssets) * 100);

    return {
      compatible: invalidAssets.length === 0 && missingAssets.length === 0,
      validAssets,
      missingAssets,
      invalidAssets,
      oversizedAssets,
      unsupportedFormats,
      score
    };
  }

  private async validatePerformanceCompatibility(
    skin: UniversalSkinDefinition,
    targetInterface: InterfaceType,
    _options: Required<AdvancedCompatibilityOptions>
  ): Promise<PerformanceCompatibilityResult> {
    const requirements = this.interfaceRequirements.get(targetInterface);
    if (!requirements) {
      return this.createSkippedPerformanceResult();
    }

    const constraints = requirements.performanceConstraints;
    const performanceWarnings: string[] = [];

    const skinSize = this.deps.measureSkinBytes(skin, 'skin:version-manager:performance-evaluation');
    const skinSizeWithinLimits = !constraints.maxSkinSize || skinSize <= constraints.maxSkinSize;

    const componentCount = Object.keys(skin.components || {}).length;
    const themeCount = Object.keys(skin.themes || {}).length;
    const estimatedRenderTime = (componentCount * 10) + (themeCount * 5);
    const renderTimeWithinLimits = !constraints.maxRenderTime || estimatedRenderTime <= constraints.maxRenderTime;

    const estimatedMemory = Math.round(skinSize / 1024);
    const memoryWithinLimits = !constraints.maxMemoryUsage || estimatedMemory <= constraints.maxMemoryUsage;

    let complexityLevel: 'low' | 'medium' | 'high' = 'low';
    if (componentCount > 20 || themeCount > 5) {
      complexityLevel = 'high';
    } else if (componentCount > 10 || themeCount > 2) {
      complexityLevel = 'medium';
    }

    const complexitySupported = this.isComplexitySupportedByInterface(
      complexityLevel,
      constraints.supportedComplexity
    );

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

  private async validateCrossInterfaceCompatibility(
    skin: UniversalSkinDefinition,
    primaryInterface: InterfaceType,
    options: Required<AdvancedCompatibilityOptions>
  ): Promise<CrossInterfaceCompatibilityResult> {
    const allInterfaces: InterfaceType[] = ['vscode', 'cli', 'command'];
    const testedInterfaces = allInterfaces.filter(iface => iface !== primaryInterface);
    const compatibleInterfaces: InterfaceType[] = [primaryInterface];
    const incompatibleInterfaces: { interface: InterfaceType; issues: string[] }[] = [];
    const sharedFeatures: string[] = [];
    const interfaceSpecificFeatures: Record<string, string[]> = {};

    for (const iface of testedInterfaces) {
      const structuralResult = await this.validateStructuralCompatibility(skin, iface, options);
      const featureResult = await this.validateFeatureCompatibility(skin, iface, options);

      if (structuralResult.compatible && featureResult.compatible) {
        compatibleInterfaces.push(iface);
      } else {
        const issues: string[] = [];
        if (!structuralResult.compatible) {
          issues.push(...structuralResult.missingComponents.map(component => `Missing component: ${component}`));
        }
        if (!featureResult.compatible) {
          issues.push(...featureResult.unsupportedFeatures.map(feature => `Unsupported feature: ${feature}`));
        }
        incompatibleInterfaces.push({ interface: iface, issues });
      }
    }

    const skinFeatures = skin.metadata.features ? Object.keys(skin.metadata.features) : [];
    for (const feature of skinFeatures) {
      const supportingInterfaces = allInterfaces.filter(iface => {
        const capabilities = this.interfaceCapabilityMatrix[iface];
        return capabilities && capabilities.supportedFeatures.includes(feature);
      });

      if (supportingInterfaces.length === allInterfaces.length) {
        sharedFeatures.push(feature);
      } else {
        supportingInterfaces.forEach(iface => {
          if (!interfaceSpecificFeatures[iface]) {
            interfaceSpecificFeatures[iface] = [];
          }
          interfaceSpecificFeatures[iface].push(feature);
        });
      }
    }

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

  private isComponentPresent(skin: UniversalSkinDefinition, component: string): boolean {
    switch (component) {
      case 'views':
        return !!(skin.views && Object.keys(skin.views).length > 0);
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

  private isComponentValid(
    skin: UniversalSkinDefinition,
    component: string,
    _targetInterface: InterfaceType
  ): boolean {
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

  private getComponentValidationIssues(
    skin: UniversalSkinDefinition,
    component: string,
    _targetInterface: InterfaceType
  ): string[] {
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
    const partialSupport: Record<string, string[]> = {
      webViews: ['cli'],
      themes: ['command'],
      icons: ['cli', 'command']
    };

    return partialSupport[feature]?.includes(targetInterface) || false;
  }

  private getFeatureLimitations(feature: string, targetInterface: InterfaceType): string[] {
    const limitations: Record<string, Record<string, string[]>> = {
      webViews: {
        cli: ['Limited to text output', 'No interactive elements']
      },
      themes: {
        command: ['Basic color support only', 'No complex styling']
      },
      icons: {
        cli: ['Text-based icons only', 'Limited Unicode support'],
        command: ['Text representation only']
      }
    };

    return limitations[feature]?.[targetInterface] || [];
  }

  private validateAsset(asset: any, _requirements: AssetRequirements, _assetType: string): string[] {
    const issues: string[] = [];
    if (!asset) {
      issues.push('Asset is missing');
    }
    return issues;
  }

  private isComplexitySupportedByInterface(
    skinComplexity: string,
    interfaceSupported: string
  ): boolean {
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

export function createDefaultInterfaceRequirements(): Map<InterfaceType, InterfaceRequirements> {
  const requirements = new Map<InterfaceType, InterfaceRequirements>();

  requirements.set('vscode', {
    interfaceType: 'vscode',
    requiredComponents: ['views', 'commands'],
    supportedFeatures: ['treeViews', 'webViews', 'commands', 'themes', 'icons', 'statusBar', 'notifications'],
    assetRequirements: {
      supportedIconFormats: ['svg', 'png'],
      supportedImageFormats: ['png', 'jpg', 'svg'],
      maxAssetSize: 1024 * 1024,
      requiredThemeProperties: ['colors', 'tokenColors']
    },
    performanceConstraints: {
      maxSkinSize: 5 * 1024 * 1024,
      maxRenderTime: 1000,
      maxMemoryUsage: 50,
      maxStartupTime: 2000,
      supportedComplexity: 'high'
    },
    description: 'VSCode extension interface with rich UI capabilities'
  });

  requirements.set('cli', {
    interfaceType: 'cli',
    requiredComponents: ['menus'],
    supportedFeatures: ['menus', 'commands', 'colors', 'text', 'tables', 'progress'],
    assetRequirements: {
      supportedIconFormats: ['text', 'unicode'],
      supportedImageFormats: [],
      maxAssetSize: 64 * 1024,
      requiredThemeProperties: ['colors']
    },
    performanceConstraints: {
      maxSkinSize: 512 * 1024,
      maxRenderTime: 100,
      maxMemoryUsage: 10,
      maxStartupTime: 500,
      supportedComplexity: 'medium'
    },
    description: 'Command-line interface with terminal-based UI'
  });

  requirements.set('command', {
    interfaceType: 'command',
    requiredComponents: ['commands', 'workflows'],
    supportedFeatures: ['commands', 'workflows', 'parameters', 'validation', 'help'],
    assetRequirements: {
      supportedIconFormats: ['text'],
      supportedImageFormats: [],
      maxAssetSize: 32 * 1024,
      requiredThemeProperties: []
    },
    performanceConstraints: {
      maxSkinSize: 256 * 1024,
      maxRenderTime: 50,
      maxMemoryUsage: 5,
      maxStartupTime: 200,
      supportedComplexity: 'low'
    },
    description: 'Command-line execution interface'
  });

  return requirements;
}

export function createDefaultInterfaceCapabilityMatrix(
  requirements: Map<InterfaceType, InterfaceRequirements>
): InterfaceCapabilityMatrix {
  return {
    vscode: {
      supportedComponents: ['views', 'commands', 'webViews', 'statusBar', 'notifications'],
      supportedFeatures: ['treeViews', 'webViews', 'commands', 'themes', 'icons', 'statusBar', 'notifications', 'hover', 'completion'],
      assetCapabilities: requirements.get('vscode')!.assetRequirements,
      performanceProfile: requirements.get('vscode')!.performanceConstraints,
      specializations: ['extension-host', 'webview-rendering', 'native-ui']
    },
    cli: {
      supportedComponents: ['menus', 'commands', 'tables', 'progress'],
      supportedFeatures: ['menus', 'commands', 'colors', 'text', 'tables', 'progress', 'input', 'selection'],
      assetCapabilities: requirements.get('cli')!.assetRequirements,
      performanceProfile: requirements.get('cli')!.performanceConstraints,
      specializations: ['ansi-colors', 'terminal-ui', 'keyboard-navigation']
    },
    command: {
      supportedComponents: ['commands', 'workflows', 'parameters'],
      supportedFeatures: ['commands', 'workflows', 'parameters', 'validation', 'help', 'pipes'],
      assetCapabilities: requirements.get('command')!.assetRequirements,
      performanceProfile: requirements.get('command')!.performanceConstraints,
      specializations: ['command-parsing', 'workflow-execution', 'parameter-validation']
    }
  };
}
