import { ClaudeCodeClient } from '../claude/client';
import { TaskContext } from '../types/workflow';
export interface AssetReference {
    type: 'function' | 'class' | 'interface' | 'type' | 'constant' | 'component';
    name: string;
    filePath: string;
    lineNumber: number;
    signature?: string;
    description?: string;
    dependencies?: string[];
}
export interface CodebaseScanResult {
    scanId: string;
    timestamp: Date;
    projectPath: string;
    totalFiles: number;
    relevantAssets: AssetReference[];
    recommendations: string[];
    reuseOpportunities: AssetReference[];
    conflictRisks: AssetReference[];
}
export interface ScanConfiguration {
    fileExtensions: string[];
    excludePatterns: string[];
    includeTests: boolean;
    maxDepth: number;
    languageSupport: ('typescript' | 'javascript' | 'python' | 'java' | 'go' | 'rust')[];
}
export declare class CodebaseScanner {
    private claudeClient;
    private defaultConfig;
    constructor(claudeClient: ClaudeCodeClient);
    scanCodebase(taskDescription: string, context: TaskContext, config?: Partial<ScanConfiguration>): Promise<CodebaseScanResult>;
    private discoverProjectFiles;
    private extractAssetsFromFiles;
    private extractAssetsFromBatch;
    private extractTaskKeywords;
    private filterRelevantAssets;
    private identifyReuseOpportunities;
    private identifyConflictRisks;
    private generateRecommendations;
    private displayScanResults;
    private generateScanId;
    private parseFileListFromResponse;
    private parseAssetsFromResponse;
    private isValidSourceFile;
    private looksLikeFilePath;
    private hasSemanticSimilarity;
    private calculateSimilarityScore;
    private detectCategoryOverlap;
    private fallbackFileDiscovery;
}
//# sourceMappingURL=codebase-scanner.d.ts.map