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

export class CodebaseScanner {
  private claudeClient: ClaudeCodeClient;
  private defaultConfig: ScanConfiguration = {
    fileExtensions: ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.go', '.rs'],
    excludePatterns: ['node_modules', '.git', 'dist', 'build', '__pycache__'],
    includeTests: true,
    maxDepth: 10,
    languageSupport: ['typescript', 'javascript', 'python', 'java', 'go', 'rust'],
  };
  
  constructor(claudeClient: ClaudeCodeClient) {
    this.claudeClient = claudeClient;
  }
  
  async scanCodebase(
    taskDescription: string, 
    context: TaskContext,
    config?: Partial<ScanConfiguration>
  ): Promise<CodebaseScanResult> {
    const scanConfig = { ...this.defaultConfig, ...config };
    const scanId = this.generateScanId();
    
    console.log('🔍 CODEBASE SCAN: Analyzing existing assets to prevent reimplementation...');
    
    try {
      // Step 1: Discover all relevant files
      const projectFiles = await this.discoverProjectFiles(context.projectPath, scanConfig);
      console.log(`   Found ${projectFiles.length} source files to analyze`);
      
      // Step 2: Extract keywords from task description
      const taskKeywords = this.extractTaskKeywords(taskDescription);
      console.log(`   Extracted ${taskKeywords.length} task-relevant keywords`);
      
      // Step 3: Scan for existing assets
      const allAssets = await this.extractAssetsFromFiles(projectFiles, scanConfig);
      console.log(`   Discovered ${allAssets.length} total assets in codebase`);
      
      // Step 4: Filter for task-relevant assets
      const relevantAssets = this.filterRelevantAssets(allAssets, taskKeywords, taskDescription);
      console.log(`   Identified ${relevantAssets.length} potentially relevant existing assets`);
      
      // Step 5: Analyze reuse opportunities and conflicts
      const reuseOpportunities = this.identifyReuseOpportunities(relevantAssets, taskDescription);
      const conflictRisks = this.identifyConflictRisks(relevantAssets, taskDescription);
      
      // Step 6: Generate recommendations
      const recommendations = this.generateRecommendations(
        relevantAssets, 
        reuseOpportunities, 
        conflictRisks, 
        taskDescription
      );
      
      const result: CodebaseScanResult = {
        scanId,
        timestamp: new Date(),
        projectPath: context.projectPath,
        totalFiles: projectFiles.length,
        relevantAssets,
        recommendations,
        reuseOpportunities,
        conflictRisks,
      };
      
      this.displayScanResults(result);
      return result;
      
    } catch (error) {
      console.error('✗ Codebase scan failed:', error instanceof Error ? error.message : 'Unknown error');
      
      // Return minimal safe result to prevent workflow failure
      return {
        scanId,
        timestamp: new Date(),
        projectPath: context.projectPath,
        totalFiles: 0,
        relevantAssets: [],
        recommendations: ['⚠ Codebase scan failed - manually verify no existing implementations'],
        reuseOpportunities: [],
        conflictRisks: [],
      };
    }
  }
  
  private async discoverProjectFiles(projectPath: string, config: ScanConfiguration): Promise<string[]> {
    const searchPrompt = `
Please scan the project directory "${projectPath}" and list all source code files.

Include files with these extensions: ${config.fileExtensions.join(', ')}
Exclude these patterns: ${config.excludePatterns.join(', ')}
Max directory depth: ${config.maxDepth}
Include test files: ${config.includeTests}

Return a JSON array of absolute file paths only.
`;
    
    try {
      const response = await this.claudeClient.query(searchPrompt, { 
        projectPath, 
        taskDescription: 'File discovery',
        language: 'typescript',
        maxTurns: 3
      });
      
      // Parse file list from response
      const fileList = this.parseFileListFromResponse(response.content);
      return fileList.filter(file => this.isValidSourceFile(file, config));
      
    } catch (error) {
      console.warn('File discovery via Claude failed, using fallback method');
      return this.fallbackFileDiscovery(projectPath, config);
    }
  }
  
  private async extractAssetsFromFiles(files: string[], config: ScanConfiguration): Promise<AssetReference[]> {
    const assets: AssetReference[] = [];
    
    // Process files in batches to avoid overwhelming Claude
    const batchSize = 5;
    for (let i = 0; i < files.slice(0, 20).length; i += batchSize) { // Limit to first 20 files for performance
      const batch = files.slice(i, i + batchSize);
      const batchAssets = await this.extractAssetsFromBatch(batch, config);
      assets.push(...batchAssets);
    }
    
    return assets;
  }
  
  private async extractAssetsFromBatch(files: string[], config: ScanConfiguration): Promise<AssetReference[]> {
    const analysisPrompt = `
Analyze these source files and extract all reusable assets:

Files to analyze: ${files.join(', ')}

For each file, identify:
1. Functions (with signatures)
2. Classes (with key methods)
3. Interfaces and types
4. Constants and configurations
5. React/Vue components (if applicable)

Return results as JSON array with this structure:
{
  "type": "function|class|interface|type|constant|component",
  "name": "asset name",
  "filePath": "file path",
  "lineNumber": number,
  "signature": "function signature or class definition",
  "description": "brief description",
  "dependencies": ["list of dependencies"]
}

Focus on public/exported assets only.
`;
    
    try {
      const response = await this.claudeClient.query(analysisPrompt, {
        projectPath: files[0].split('/').slice(0, -1).join('/'),
        taskDescription: 'Asset extraction',
        language: 'typescript',
        maxTurns: 3
      });
      
      return this.parseAssetsFromResponse(response.content);
      
    } catch (error) {
      console.warn(`Asset extraction failed for batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
  }
  
  private extractTaskKeywords(taskDescription: string): string[] {
    // Extract meaningful keywords from task description
    const words = taskDescription.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    // Filter out common stop words
    const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use']);
    
    return words.filter(word => !stopWords.has(word));
  }
  
  private filterRelevantAssets(
    assets: AssetReference[], 
    keywords: string[], 
    taskDescription: string
  ): AssetReference[] {
    return assets.filter(asset => {
      const assetText = `${asset.name} ${asset.description || ''} ${asset.signature || ''}`.toLowerCase();
      
      // Check for keyword matches
      const keywordMatches = keywords.some(keyword => assetText.includes(keyword));
      
      // Check for semantic similarity (simple heuristic)
      const semanticMatch = this.hasSemanticSimilarity(assetText, taskDescription.toLowerCase());
      
      return keywordMatches || semanticMatch;
    });
  }
  
  private identifyReuseOpportunities(assets: AssetReference[], taskDescription: string): AssetReference[] {
    // Identify assets that could be reused for the current task
    return assets.filter(asset => {
      const assetPurpose = `${asset.name} ${asset.description || ''}`.toLowerCase();
      const task = taskDescription.toLowerCase();
      
      // Look for assets that might fulfill similar purposes
      return this.calculateSimilarityScore(assetPurpose, task) > 0.3;
    });
  }
  
  private identifyConflictRisks(assets: AssetReference[], taskDescription: string): AssetReference[] {
    // Identify assets that might conflict with new implementation
    const taskKeywords = this.extractTaskKeywords(taskDescription);
    
    return assets.filter(asset => {
      // Assets with similar names might indicate potential conflicts
      const nameSimilarity = taskKeywords.some(keyword => 
        asset.name.toLowerCase().includes(keyword) || keyword.includes(asset.name.toLowerCase())
      );
      
      // Assets in same category might indicate reimplementation risk
      const categoryOverlap = this.detectCategoryOverlap(asset.type, taskDescription);
      
      return nameSimilarity || categoryOverlap;
    });
  }
  
  private generateRecommendations(
    relevantAssets: AssetReference[],
    reuseOpportunities: AssetReference[],
    conflictRisks: AssetReference[],
    taskDescription: string
  ): string[] {
    const recommendations: string[] = [];
    
    if (reuseOpportunities.length > 0) {
      recommendations.push(
        `⇔ REUSE OPPORTUNITIES: Consider reusing existing assets: ${reuseOpportunities.map(a => `${a.name} (${a.filePath})`).join(', ')}`
      );
    }
    
    if (conflictRisks.length > 0) {
      recommendations.push(
        `⚠ CONFLICT RISKS: Potential conflicts with existing: ${conflictRisks.map(a => `${a.name} (${a.filePath})`).join(', ')}`
      );
    }
    
    if (relevantAssets.length > 5) {
      recommendations.push(
        `📊 ARCHITECTURE REVIEW: ${relevantAssets.length} related assets found - consider architectural consistency`
      );
    }
    
    if (relevantAssets.length === 0) {
      recommendations.push(
        `✓ CLEAR TO IMPLEMENT: No conflicting assets found for this task`
      );
    }
    
    // Always add the mandatory verification step
    recommendations.push(
      `🎯 MANDATORY: Agent must acknowledge scan results before proceeding with implementation`
    );
    
    return recommendations;
  }
  
  private displayScanResults(result: CodebaseScanResult): void {
    console.log('\n◊ CODEBASE SCAN RESULTS:');
    console.log('═══════════════════════════════════════');
    console.log(`Scan ID: ${result.scanId}`);
    console.log(`Files Analyzed: ${result.totalFiles}`);
    console.log(`Relevant Assets: ${result.relevantAssets.length}`);
    console.log(`Reuse Opportunities: ${result.reuseOpportunities.length}`);
    console.log(`Conflict Risks: ${result.conflictRisks.length}`);
    
    if (result.recommendations.length > 0) {
      console.log('\n📋 RECOMMENDATIONS:');
      result.recommendations.forEach(rec => console.log(`   ${rec}`));
    }
    
    if (result.conflictRisks.length > 0) {
      console.log('\n⚠ CONFLICT WARNINGS:');
      result.conflictRisks.forEach(asset => {
        console.log(`   ${asset.type}: ${asset.name} (${asset.filePath}:${asset.lineNumber})`);
      });
    }
    
    console.log('═══════════════════════════════════════\n');
  }
  
  // Utility methods
  private generateScanId(): string {
    return `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private parseFileListFromResponse(response: string): string[] {
    try {
      // Try to extract JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: extract file paths from lines
      return response
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('//') && !line.startsWith('#'))
        .filter(line => this.looksLikeFilePath(line));
        
    } catch (error) {
      console.warn('Failed to parse file list from response');
      return [];
    }
  }
  
  private parseAssetsFromResponse(response: string): AssetReference[] {
    try {
      // Try to extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return Array.isArray(parsed) ? parsed : [];
      }
      
      return [];
    } catch (error) {
      console.warn('Failed to parse assets from response');
      return [];
    }
  }
  
  private isValidSourceFile(filePath: string, config: ScanConfiguration): boolean {
    const extension = filePath.substring(filePath.lastIndexOf('.'));
    return config.fileExtensions.includes(extension) && 
           !config.excludePatterns.some(pattern => filePath.includes(pattern));
  }
  
  private looksLikeFilePath(text: string): boolean {
    return text.includes('/') || text.includes('\\') || text.includes('.');
  }
  
  private hasSemanticSimilarity(text1: string, text2: string): boolean {
    // Simple heuristic for semantic similarity
    const words1 = new Set(text1.split(/\s+/));
    const words2 = new Set(text2.split(/\s+/));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size > 0.1;
  }
  
  private calculateSimilarityScore(text1: string, text2: string): number {
    const words1 = text1.split(/\s+/);
    const words2 = text2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    
    return commonWords.length / Math.max(words1.length, words2.length);
  }
  
  private detectCategoryOverlap(assetType: string, taskDescription: string): boolean {
    const task = taskDescription.toLowerCase();
    
    switch (assetType) {
      case 'function':
        return task.includes('function') || task.includes('method') || task.includes('utility');
      case 'class':
        return task.includes('class') || task.includes('service') || task.includes('manager');
      case 'component':
        return task.includes('component') || task.includes('widget') || task.includes('ui');
      case 'interface':
        return task.includes('interface') || task.includes('contract') || task.includes('api');
      default:
        return false;
    }
  }
  
  private fallbackFileDiscovery(projectPath: string, config: ScanConfiguration): string[] {
    // Fallback method for when Claude client is unavailable
    console.warn('Using fallback file discovery - may miss some files');
    return []; // Would implement filesystem scanning in production
  }
}