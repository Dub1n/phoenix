import { promises as fs } from 'fs';
import { join } from 'path';
import { z } from 'zod';

// Configuration validation schemas
export const AgentConfigSchema = z.object({
  enabled: z.boolean().default(true),
  priority: z.number().min(0).max(1).default(0.8),
  timeout: z.number().min(30000).max(1800000).default(30000), // 30 seconds minimum
  retryAttempts: z.number().min(1).max(5).default(2),
  customPrompts: z.record(z.string(), z.string()).optional(),
});

export const QualityGateConfigSchema = z.object({
  enabled: z.boolean().default(true),
  strictMode: z.boolean().default(false),
  thresholds: z.object({
    syntaxValidation: z.number().min(0).max(1).default(1.0),
    testCoverage: z.number().min(0).max(1).default(0.8),
    codeQuality: z.number().min(0).max(1).default(0.7),
    documentation: z.number().min(0).max(1).default(0.6),
  }),
  weights: z.object({
    syntaxValidation: z.number().min(0).max(1).default(1.0),
    testCoverage: z.number().min(0).max(1).default(0.8),
    codeQuality: z.number().min(0).max(1).default(0.6),
    documentation: z.number().min(0).max(1).default(0.4),
  }),
});

export const PhoenixCodeLiteConfigSchema = z.object({
  version: z.string().default('1.0.0'),
  claude: z.object({
    maxTurns: z.number().min(1).max(10).default(3),
    timeout: z.number().min(30000).max(1800000).default(300000), // 5 minutes
    retryAttempts: z.number().min(1).max(5).default(3),
    model: z.string().optional().default('claude-3-5-sonnet-20241022'),
  }).optional().default({
    maxTurns: 3,
    timeout: 300000,
    retryAttempts: 3,
    model: 'claude-3-5-sonnet-20241022',
  }),
  tdd: z.object({
    maxImplementationAttempts: z.number().min(1).max(10).default(5),
    testQualityThreshold: z.number().min(0).max(1).default(0.8),
    enableRefactoring: z.boolean().default(true),
    skipDocumentation: z.boolean().default(false),
    qualityGates: QualityGateConfigSchema.optional().default({
      enabled: true,
      strictMode: false,
      thresholds: { syntaxValidation: 1.0, testCoverage: 0.8, codeQuality: 0.7, documentation: 0.6 },
      weights: { syntaxValidation: 1.0, testCoverage: 0.8, codeQuality: 0.6, documentation: 0.4 },
    }),
  }).optional().default({
    maxImplementationAttempts: 5,
    testQualityThreshold: 0.8,
    enableRefactoring: true,
    skipDocumentation: false,
    qualityGates: {
      enabled: true,
      strictMode: false,
      thresholds: { syntaxValidation: 1.0, testCoverage: 0.8, codeQuality: 0.7, documentation: 0.6 },
      weights: { syntaxValidation: 1.0, testCoverage: 0.8, codeQuality: 0.6, documentation: 0.4 },
    },
  }),
  agents: z.object({
    planningAnalyst: AgentConfigSchema.optional().default({ enabled: true, priority: 0.8, timeout: 30000, retryAttempts: 2 }),
    implementationEngineer: AgentConfigSchema.optional().default({ enabled: true, priority: 0.8, timeout: 30000, retryAttempts: 2 }),
    qualityReviewer: AgentConfigSchema.optional().default({ enabled: true, priority: 0.8, timeout: 30000, retryAttempts: 2 }),
    enableSpecialization: z.boolean().default(true),
    fallbackToGeneric: z.boolean().default(true),
  }).optional().default({
    planningAnalyst: { enabled: true, priority: 0.8, timeout: 30000, retryAttempts: 2 },
    implementationEngineer: { enabled: true, priority: 0.8, timeout: 30000, retryAttempts: 2 },
    qualityReviewer: { enabled: true, priority: 0.8, timeout: 30000, retryAttempts: 2 },
    enableSpecialization: true,
    fallbackToGeneric: true,
  }),
  output: z.object({
    verbose: z.boolean().default(false),
    showMetrics: z.boolean().default(true),
    saveArtifacts: z.boolean().default(true),
    logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  }).optional().default({
    verbose: false,
    showMetrics: true,
    saveArtifacts: true,
    logLevel: 'info' as const,
  }),
  quality: z.object({
    minTestCoverage: z.number().min(0).max(1).default(0.8),
    maxComplexity: z.number().min(1).max(50).default(10),
    requireDocumentation: z.boolean().default(true),
    enforceStrictMode: z.boolean().default(false),
  }).optional().default({
    minTestCoverage: 0.8,
    maxComplexity: 10,
    requireDocumentation: true,
    enforceStrictMode: false,
  }),
  ui: z.object({
    interactionMode: z.enum(['menu', 'command']).default('menu'),
    showNumbers: z.boolean().default(true), 
    showDescriptions: z.boolean().default(true),
    compactMode: z.boolean().default(false),
    promptSymbol: z.string().default('Phoenix> '),
    allowModeSwitch: z.boolean().default(true),
  }).optional().default({
    interactionMode: 'menu' as const,
    showNumbers: true,
    showDescriptions: true,
    compactMode: false,
    promptSymbol: 'Phoenix> ',
    allowModeSwitch: true,
  }),
});

export type PhoenixCodeLiteConfigData = z.infer<typeof PhoenixCodeLiteConfigSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type QualityGateConfig = z.infer<typeof QualityGateConfigSchema>;

export class PhoenixCodeLiteConfig {
  private data: PhoenixCodeLiteConfigData;
  private configPath: string;
  
  constructor(data: PhoenixCodeLiteConfigData, configPath: string) {
    this.data = data;
    this.configPath = configPath;
  }
  
  static async load(projectPath?: string): Promise<PhoenixCodeLiteConfig> {
    const configPath = join(projectPath || process.cwd(), '.phoenix-code-lite.json');
    
    try {
      const content = await fs.readFile(configPath, 'utf-8');
      const rawData = JSON.parse(content);
      
      // Validate and parse configuration with Zod
      const data = PhoenixCodeLiteConfigSchema.parse(rawData);
      return new PhoenixCodeLiteConfig(data, configPath);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.warn('Configuration validation failed, using defaults:', error.issues);
      }
      // Return default configuration if file doesn't exist or is invalid
      return PhoenixCodeLiteConfig.getDefault(configPath);
    }
  }
  
  static getDefault(configPath?: string): PhoenixCodeLiteConfig {
    const defaultData = PhoenixCodeLiteConfigSchema.parse({});
    
    return new PhoenixCodeLiteConfig(
      defaultData,
      configPath || join(process.cwd(), '.phoenix-code-lite.json')
    );
  }
  
  async save(force: boolean = false): Promise<void> {
    try {
      // Validate configuration before saving
      const validatedData = PhoenixCodeLiteConfigSchema.parse(this.data);
      
      // Check if file exists
      if (!force) {
        try {
          await fs.access(this.configPath);
          throw new Error('Configuration file already exists. Use --force to overwrite.');
        } catch (error) {
          // File doesn't exist, continue with save
          if (error instanceof Error && error.message.includes('already exists')) {
            throw error;
          }
        }
      }
      
      const content = JSON.stringify(validatedData, null, 2);
      await fs.writeFile(this.configPath, content, 'utf-8');
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Configuration validation failed: ${error.issues.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }
  
  get<T = any>(key: string): T {
    return this.getNestedValue(this.data, key) as T;
  }
  
  set(key: string, value: any): void {
    // Create a copy of the data to test the change
    const testData = JSON.parse(JSON.stringify(this.data));
    this.setNestedValue(testData, key, value);
    
    // Validate the modified data before applying the change
    try {
      PhoenixCodeLiteConfigSchema.parse(testData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`Invalid configuration value: ${error.issues.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
    
    // If validation passes, apply the change
    this.setNestedValue(this.data, key, value);
  }
  
  getAgentConfig(agentType: 'planningAnalyst' | 'implementationEngineer' | 'qualityReviewer'): AgentConfig {
    return this.data.agents[agentType];
  }
  
  getQualityGateConfig(): QualityGateConfig {
    return this.data.tdd.qualityGates;
  }
  
  isAgentEnabled(agentType: 'planningAnalyst' | 'implementationEngineer' | 'qualityReviewer'): boolean {
    return this.data.agents.enableSpecialization && this.data.agents[agentType].enabled;
  }
  
  shouldFallbackToGeneric(): boolean {
    return this.data.agents.fallbackToGeneric;
  }
  
  validate(): string[] {
    try {
      PhoenixCodeLiteConfigSchema.parse(this.data);
      return [];
    } catch (error) {
      if (error instanceof z.ZodError) {
        return error.issues.map(e => `${e.path.join('.')}: ${e.message}`);
      }
      return [error instanceof Error ? error.message : 'Unknown validation error'];
    }
  }
  
  // Deep clone configuration for safe modifications
  clone(): PhoenixCodeLiteConfig {
    const clonedData = JSON.parse(JSON.stringify(this.data));
    return new PhoenixCodeLiteConfig(clonedData, this.configPath);
  }
  
  // Merge with another configuration
  merge(otherConfig: Partial<PhoenixCodeLiteConfigData>): PhoenixCodeLiteConfig {
    const mergedData = this.deepMerge(this.data, otherConfig);
    const validatedData = PhoenixCodeLiteConfigSchema.parse(mergedData);
    return new PhoenixCodeLiteConfig(validatedData, this.configPath);
  }
  
  // Export configuration for debugging
  export(): PhoenixCodeLiteConfigData {
    return JSON.parse(JSON.stringify(this.data));
  }
  
  private getNestedValue(obj: any, key: string): any {
    return key.split('.').reduce((current, prop) => current?.[prop], obj);
  }
  
  private setNestedValue(obj: any, key: string, value: any): void {
    const keys = key.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((current, prop) => {
      if (!(prop in current)) {
        current[prop] = {};
      }
      return current[prop];
    }, obj);
    target[lastKey] = value;
  }
  
  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
}