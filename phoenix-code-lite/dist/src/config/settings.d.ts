import { z } from 'zod';
export declare const AgentConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    priority: z.ZodDefault<z.ZodNumber>;
    timeout: z.ZodDefault<z.ZodNumber>;
    retryAttempts: z.ZodDefault<z.ZodNumber>;
    customPrompts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
}, z.core.$strip>;
export declare const QualityGateConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    strictMode: z.ZodDefault<z.ZodBoolean>;
    thresholds: z.ZodObject<{
        syntaxValidation: z.ZodDefault<z.ZodNumber>;
        testCoverage: z.ZodDefault<z.ZodNumber>;
        codeQuality: z.ZodDefault<z.ZodNumber>;
        documentation: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>;
    weights: z.ZodObject<{
        syntaxValidation: z.ZodDefault<z.ZodNumber>;
        testCoverage: z.ZodDefault<z.ZodNumber>;
        codeQuality: z.ZodDefault<z.ZodNumber>;
        documentation: z.ZodDefault<z.ZodNumber>;
    }, z.core.$strip>;
}, z.core.$strip>;
export declare const PhoenixCodeLiteConfigSchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodString>;
    claude: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        maxTurns: z.ZodDefault<z.ZodNumber>;
        timeout: z.ZodDefault<z.ZodNumber>;
        retryAttempts: z.ZodDefault<z.ZodNumber>;
        model: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    }, z.core.$strip>>>;
    tdd: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        maxImplementationAttempts: z.ZodDefault<z.ZodNumber>;
        testQualityThreshold: z.ZodDefault<z.ZodNumber>;
        enableRefactoring: z.ZodDefault<z.ZodBoolean>;
        skipDocumentation: z.ZodDefault<z.ZodBoolean>;
        qualityGates: z.ZodDefault<z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            strictMode: z.ZodDefault<z.ZodBoolean>;
            thresholds: z.ZodObject<{
                syntaxValidation: z.ZodDefault<z.ZodNumber>;
                testCoverage: z.ZodDefault<z.ZodNumber>;
                codeQuality: z.ZodDefault<z.ZodNumber>;
                documentation: z.ZodDefault<z.ZodNumber>;
            }, z.core.$strip>;
            weights: z.ZodObject<{
                syntaxValidation: z.ZodDefault<z.ZodNumber>;
                testCoverage: z.ZodDefault<z.ZodNumber>;
                codeQuality: z.ZodDefault<z.ZodNumber>;
                documentation: z.ZodDefault<z.ZodNumber>;
            }, z.core.$strip>;
        }, z.core.$strip>>>;
    }, z.core.$strip>>>;
    agents: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        planningAnalyst: z.ZodDefault<z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            priority: z.ZodDefault<z.ZodNumber>;
            timeout: z.ZodDefault<z.ZodNumber>;
            retryAttempts: z.ZodDefault<z.ZodNumber>;
            customPrompts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strip>>>;
        implementationEngineer: z.ZodDefault<z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            priority: z.ZodDefault<z.ZodNumber>;
            timeout: z.ZodDefault<z.ZodNumber>;
            retryAttempts: z.ZodDefault<z.ZodNumber>;
            customPrompts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strip>>>;
        qualityReviewer: z.ZodDefault<z.ZodOptional<z.ZodObject<{
            enabled: z.ZodDefault<z.ZodBoolean>;
            priority: z.ZodDefault<z.ZodNumber>;
            timeout: z.ZodDefault<z.ZodNumber>;
            retryAttempts: z.ZodDefault<z.ZodNumber>;
            customPrompts: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
        }, z.core.$strip>>>;
        enableSpecialization: z.ZodDefault<z.ZodBoolean>;
        fallbackToGeneric: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>;
    output: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        verbose: z.ZodDefault<z.ZodBoolean>;
        showMetrics: z.ZodDefault<z.ZodBoolean>;
        saveArtifacts: z.ZodDefault<z.ZodBoolean>;
        logLevel: z.ZodDefault<z.ZodEnum<{
            error: "error";
            warn: "warn";
            info: "info";
            debug: "debug";
        }>>;
    }, z.core.$strip>>>;
    quality: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        minTestCoverage: z.ZodDefault<z.ZodNumber>;
        maxComplexity: z.ZodDefault<z.ZodNumber>;
        requireDocumentation: z.ZodDefault<z.ZodBoolean>;
        enforceStrictMode: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>;
    ui: z.ZodDefault<z.ZodOptional<z.ZodObject<{
        interactionMode: z.ZodDefault<z.ZodEnum<{
            menu: "menu";
            command: "command";
        }>>;
        showNumbers: z.ZodDefault<z.ZodBoolean>;
        showDescriptions: z.ZodDefault<z.ZodBoolean>;
        compactMode: z.ZodDefault<z.ZodBoolean>;
        promptSymbol: z.ZodDefault<z.ZodString>;
        allowModeSwitch: z.ZodDefault<z.ZodBoolean>;
    }, z.core.$strip>>>;
}, z.core.$strip>;
export type PhoenixCodeLiteConfigData = z.infer<typeof PhoenixCodeLiteConfigSchema>;
export type AgentConfig = z.infer<typeof AgentConfigSchema>;
export type QualityGateConfig = z.infer<typeof QualityGateConfigSchema>;
export declare class PhoenixCodeLiteConfig {
    private data;
    private configPath;
    constructor(data: PhoenixCodeLiteConfigData, configPath: string);
    static load(projectPath?: string): Promise<PhoenixCodeLiteConfig>;
    static getDefault(configPath?: string): PhoenixCodeLiteConfig;
    save(force?: boolean): Promise<void>;
    get<T = any>(key: string): T;
    set(key: string, value: any): void;
    getAgentConfig(agentType: 'planningAnalyst' | 'implementationEngineer' | 'qualityReviewer'): AgentConfig;
    getQualityGateConfig(): QualityGateConfig;
    isAgentEnabled(agentType: 'planningAnalyst' | 'implementationEngineer' | 'qualityReviewer'): boolean;
    shouldFallbackToGeneric(): boolean;
    validate(): string[];
    clone(): PhoenixCodeLiteConfig;
    merge(otherConfig: Partial<PhoenixCodeLiteConfigData>): PhoenixCodeLiteConfig;
    export(): PhoenixCodeLiteConfigData;
    private getNestedValue;
    private setNestedValue;
    private deepMerge;
}
//# sourceMappingURL=settings.d.ts.map