/**---
 * title: [Project Discovery - Stack and Template Analysis]
 * tags: [CLI, Service, Discovery, Analysis]
 * provides: [ProjectDiscovery Class, analyzeProject Function, Stack Knowledge Database]
 * requires: [fs, path, chalk]
 * description: [Analyzes an existing project to infer language, framework, tooling, and recommends an appropriate Phoenix template with confidence scoring.]
 * ---*/
export interface ProjectContext {
    type: 'web' | 'api' | 'library' | 'cli' | 'unknown';
    language: 'javascript' | 'typescript' | 'python' | 'unknown';
    framework: string | null;
    packageManager: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'poetry' | 'unknown';
    hasTests: boolean;
    hasLinting: boolean;
    hasTypeScript: boolean;
    dependencies: string[];
    devDependencies: string[];
    confidence: number;
    detectedFiles: string[];
    suggestedTemplate: 'starter' | 'professional' | 'enterprise' | 'performance';
}
export interface StackKnowledge {
    framework: string;
    type: 'frontend' | 'backend' | 'fullstack' | 'mobile' | 'desktop';
    language: string[];
    testingFrameworks: string[];
    buildTools: string[];
    recommendations: {
        qualityLevel: 'starter' | 'professional' | 'enterprise';
        testCoverage: number;
        additionalTools: string[];
    };
}
export declare class ProjectDiscovery {
    private stackDatabase;
    constructor();
    analyzeProject(projectPath?: string): Promise<ProjectContext>;
    private analyzePackageJson;
    private analyzePythonProject;
    private analyzeFileStructure;
    private analyzeConfigFiles;
    private detectFramework;
    private detectPythonFramework;
    private hasTestingFramework;
    private hasLintingTools;
    private inferProjectType;
    private calculateConfidence;
    private suggestTemplate;
    private initializeStackDatabase;
    getStackKnowledge(framework: string): StackKnowledge | null;
    displayAnalysis(context: ProjectContext): void;
}
//# sourceMappingURL=project-discovery.d.ts.map