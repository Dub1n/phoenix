/**---
 * title: [Haruspex Workspace Setup Wizard - Fresh Installation UX]
 * tags: [Setup, UX, Wizard, Initialization, Fresh-Workspace]
 * provides: [HaruspexWorkspaceWizard, WorkspaceSetupResult, SetupWizardOptions]
 * requires: [VSCode APIs, File System, Core Engine]
 * description: [Interactive setup wizard for fresh workspace initialization and Haruspex configuration]
 * ---*/

import * as vscode from 'vscode';
import * as path from 'path';
import { HaruspexCoreEngine } from '../core/haruspex-core-engine';
import { TelemetryCollector } from '../core/telemetry-collector';

export interface WorkspaceAnalysis {
  /** Whether workspace has any supported files */
  hasSupportedFiles: boolean;
  /** Count of supported file types */
  supportedFileCount: number;
  /** Count of existing Haruspex files */
  haruspexFileCount: number;
  /** Detected project type */
  projectType: 'typescript' | 'javascript' | 'documentation' | 'mixed' | 'empty';
  /** Main directories found */
  mainDirectories: string[];
  /** Recommended initialization approach */
  recommendedApproach: 'full-init' | 'minimal-init' | 'documentation-only' | 'skip';
}

export interface SetupWizardOptions {
  /** Target directory for initialization */
  targetDirectory?: string;
  /** Whether to run in interactive mode */
  interactive: boolean;
  /** Initialization scope */
  scope: 'workspace' | 'directory' | 'files';
  /** File patterns to include */
  includePatterns: string[];
  /** File patterns to exclude */
  excludePatterns: string[];
}

export interface WorkspaceSetupResult {
  /** Whether setup was successful */
  success: boolean;
  /** Setup duration in milliseconds */
  durationMs: number;
  /** Files processed */
  filesProcessed: number;
  /** Files modified */
  filesModified: number;
  /** Directories created */
  directoriesCreated: string[];
  /** Any errors encountered */
  errors: string[];
  /** Warnings generated */
  warnings: string[];
  /** Next steps for user */
  nextSteps: string[];
}

/**
 * Interactive setup wizard for fresh Haruspex workspace initialization
 * 
 * Provides:
 * - Workspace analysis and project type detection
 * - Interactive setup wizard with user guidance
 * - Automated file stub generation
 * - Directory structure initialization
 * - Configuration recommendations
 */
export class HaruspexWorkspaceWizard {
  constructor(
    private context: vscode.ExtensionContext,
    private engine?: HaruspexCoreEngine,
    private telemetry?: TelemetryCollector
  ) {}

  /**
   * Analyze current workspace for Haruspex compatibility
   */
  async analyzeWorkspace(): Promise<WorkspaceAnalysis> {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return {
        hasSupportedFiles: false,
        supportedFileCount: 0,
        haruspexFileCount: 0,
        projectType: 'empty',
        mainDirectories: [],
        recommendedApproach: 'skip'
      };
    }

    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    
    try {
      // Find supported files
      const supportedFiles = await vscode.workspace.findFiles(
        '**/*.{ts,tsx,js,jsx,md,json}',
        '**/node_modules/**',
        1000
      );

      // Analyze project structure
      const directories = new Set<string>();
      let tsFiles = 0;
      let jsFiles = 0;
      let mdFiles = 0;
      let haruspexFiles = 0;

      for (const file of supportedFiles) {
        const relativePath = path.relative(workspaceRoot, file.fsPath);
        const dir = path.dirname(relativePath);
        if (dir !== '.') {
          directories.add(dir.split(path.sep)[0]);
        }

        const ext = path.extname(file.fsPath).toLowerCase();
        if (ext === '.ts' || ext === '.tsx') tsFiles++;
        else if (ext === '.js' || ext === '.jsx') jsFiles++;
        else if (ext === '.md') mdFiles++;

        // Check for existing Haruspex stubs
        if (ext === '.md' || ext === '.ts' || ext === '.js') {
          try {
            const content = await vscode.workspace.fs.readFile(file);
            const text = content.toString();
            if (text.includes('/**---') || text.includes('title:') || text.includes('provides:')) {
              haruspexFiles++;
            }
          } catch {
            // Ignore file read errors
          }
        }
      }

      // Determine project type
      let projectType: WorkspaceAnalysis['projectType'] = 'empty';
      if (tsFiles > jsFiles && tsFiles > 0) projectType = 'typescript';
      else if (jsFiles > 0) projectType = 'javascript';
      else if (mdFiles > 0) projectType = 'documentation';
      else if (supportedFiles.length > 0) projectType = 'mixed';

      // Recommend approach
      let recommendedApproach: WorkspaceAnalysis['recommendedApproach'] = 'skip';
      if (haruspexFiles > 0) {
        recommendedApproach = 'minimal-init'; // Already has some Haruspex files
      } else if (supportedFiles.length > 20) {
        recommendedApproach = 'full-init';
      } else if (supportedFiles.length > 0) {
        recommendedApproach = projectType === 'documentation' ? 'documentation-only' : 'minimal-init';
      }

      return {
        hasSupportedFiles: supportedFiles.length > 0,
        supportedFileCount: supportedFiles.length,
        haruspexFileCount: haruspexFiles,
        projectType,
        mainDirectories: Array.from(directories).sort(),
        recommendedApproach
      };

    } catch (error) {
      console.error('Error analyzing workspace:', error);
      return {
        hasSupportedFiles: false,
        supportedFileCount: 0,
        haruspexFileCount: 0,
        projectType: 'empty',
        mainDirectories: [],
        recommendedApproach: 'skip'
      };
    }
  }

  /**
   * Run interactive setup wizard
   */
  async runSetupWizard(): Promise<WorkspaceSetupResult | undefined> {
    const analysis = await this.analyzeWorkspace();
    
    // Show welcome screen with analysis
    const welcomeChoice = await this.showWelcomeScreen(analysis);
    if (!welcomeChoice) {
      return undefined; // User cancelled
    }

    // Configure setup options
    const setupOptions = await this.configureSetupOptions(analysis);
    if (!setupOptions) {
      return undefined; // User cancelled
    }

    // Show confirmation and execute setup
    const confirmed = await this.confirmSetup(setupOptions, analysis);
    if (!confirmed) {
      return undefined; // User cancelled
    }

    // Execute setup
    return await this.executeSetup(setupOptions, analysis);
  }

  /**
   * Show welcome screen with workspace analysis
   */
  private async showWelcomeScreen(analysis: WorkspaceAnalysis): Promise<boolean> {
    let message: string;
    let detail: string;
    let buttons: string[];

    if (analysis.haruspexFileCount > 0) {
      message = `Welcome to Haruspex! Found ${analysis.haruspexFileCount} existing Haruspex files.`;
      detail = `Your workspace already has some Haruspex documentation. You can enhance it further or skip setup.`;
      buttons = ['Enhance Documentation', 'Skip Setup', 'Show Diagnostics'];
    } else if (analysis.hasSupportedFiles) {
      message = `Welcome to Haruspex! Found ${analysis.supportedFileCount} files in your ${analysis.projectType} project.`;
      detail = `Would you like to initialize Haruspex documentation for your workspace?`;
      buttons = ['Initialize Workspace', 'Skip Setup', 'Show Diagnostics'];
    } else {
      message = 'Welcome to Haruspex! No supported files found in this workspace.';
      detail = 'This workspace appears to be empty or contains no supported file types. You can still create documentation structure.';
      buttons = ['Create Documentation Structure', 'Skip Setup', 'Open Different Folder'];
    }

    const choice = await vscode.window.showInformationMessage(
      message,
      { detail, modal: true },
      ...buttons
    );

    switch (choice) {
      case 'Skip Setup':
        return false;
      case 'Show Diagnostics':
        // Show diagnostic info
        await vscode.commands.executeCommand('haruspex.debug.showInfo');
        return false;
      case 'Open Different Folder':
        await vscode.commands.executeCommand('vscode.openFolder');
        return false;
      default:
        return true; // Continue with setup
    }
  }

  /**
   * Configure setup options with user input
   */
  private async configureSetupOptions(analysis: WorkspaceAnalysis): Promise<SetupWizardOptions | undefined> {
    // Choose scope
    let scope: SetupWizardOptions['scope'];
    if (analysis.mainDirectories.length > 1) {
      const scopeChoice = await vscode.window.showQuickPick([
        {
          label: 'Entire Workspace',
          description: 'Initialize all supported files in the workspace',
          detail: `${analysis.supportedFileCount} files across ${analysis.mainDirectories.length} directories`,
          value: 'workspace'
        },
        {
          label: 'Specific Directory',
          description: 'Choose a specific directory to initialize',
          detail: 'Select from main directories in your project',
          value: 'directory'
        },
        {
          label: 'Selected Files',
          description: 'Manually select files to initialize',
          detail: 'Pick individual files for documentation',
          value: 'files'
        }
      ], {
        title: 'Choose Initialization Scope',
        placeHolder: 'How much of your workspace should be initialized?'
      });

      if (!scopeChoice) return undefined;
      scope = scopeChoice.value as SetupWizardOptions['scope'];
    } else {
      scope = 'workspace';
    }

    // Choose target directory if needed
    let targetDirectory: string | undefined;
    if (scope === 'directory') {
      const dirChoice = await vscode.window.showQuickPick(
        analysis.mainDirectories.map(dir => ({
          label: dir,
          description: `Initialize documentation for ./${dir}`,
          value: dir
        })),
        {
          title: 'Select Directory',
          placeHolder: 'Which directory should be initialized?'
        }
      );

      if (!dirChoice) return undefined;
      targetDirectory = dirChoice.value;
    }

    // Configure file patterns
    const includePatterns = ['**/*.{ts,tsx,js,jsx,md,json}'];
    const excludePatterns = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'];

    return {
      targetDirectory: targetDirectory || undefined,
      interactive: true,
      scope,
      includePatterns,
      excludePatterns
    } as SetupWizardOptions;
  }

  /**
   * Confirm setup with preview
   */
  private async confirmSetup(options: SetupWizardOptions, analysis: WorkspaceAnalysis): Promise<boolean> {
    const scopeDescription = options.scope === 'workspace' ? 'entire workspace' :
                           options.scope === 'directory' ? `directory: ${options.targetDirectory}` :
                           'selected files';

    const message = `Ready to initialize Haruspex documentation`;
    const detail = `Scope: ${scopeDescription}\nFiles: ~${analysis.supportedFileCount} supported files\nType: ${analysis.projectType} project`;

    const choice = await vscode.window.showWarningMessage(
      message,
      { detail, modal: true },
      'Initialize', 'Cancel'
    );

    return choice === 'Initialize';
  }

  /**
   * Execute the setup process
   */
  private async executeSetup(options: SetupWizardOptions, analysis: WorkspaceAnalysis): Promise<WorkspaceSetupResult> {
    const startTime = Date.now();
    const result: WorkspaceSetupResult = {
      success: false,
      durationMs: 0,
      filesProcessed: 0,
      filesModified: 0,
      directoriesCreated: [],
      errors: [],
      warnings: [],
      nextSteps: []
    };

    try {
      // Show progress
      await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Initializing Haruspex workspace...',
        cancellable: false
      }, async (progress) => {
        progress.report({ increment: 0, message: 'Analyzing files...' });

        // Find files to process
        const workspaceRoot = vscode.workspace.workspaceFolders![0].uri.fsPath;
        let pattern = options.includePatterns[0];
        
        if (options.scope === 'directory' && options.targetDirectory) {
          pattern = `${options.targetDirectory}/**/*.{ts,tsx,js,jsx,md,json}`;
        }

        const files = await vscode.workspace.findFiles(pattern, options.excludePatterns[0], 1000);
        result.filesProcessed = files.length;

        progress.report({ increment: 20, message: `Processing ${files.length} files...` });

        // Process files
        let processed = 0;
        for (const file of files) {
          try {
            const modified = await this.processFile(file);
            if (modified) {
              result.filesModified++;
            }
            processed++;
            
            if (processed % 10 === 0) {
              progress.report({ 
                increment: (processed / files.length) * 60, 
                message: `Processed ${processed}/${files.length} files...` 
              });
            }
          } catch (error) {
            result.errors.push(`Error processing ${file.fsPath}: ${error}`);
          }
        }

        progress.report({ increment: 80, message: 'Creating directory structure...' });

        // Create documentation directories if needed
        await this.createDocumentationStructure(workspaceRoot, result);

        progress.report({ increment: 100, message: 'Setup complete!' });
      });

      // Setup completion
      result.success = result.errors.length === 0;
      result.durationMs = Date.now() - startTime;

      // Generate next steps
      result.nextSteps = this.generateNextSteps(result, analysis);

      // Record telemetry
      this.telemetry?.recordEvent('workspace_setup_completed', {
        success: result.success,
        files_processed: result.filesProcessed,
        files_modified: result.filesModified,
        duration_ms: result.durationMs,
        project_type: analysis.projectType
      });

      // Show completion message
      if (result.success) {
        vscode.window.showInformationMessage(
          `Haruspex workspace initialized successfully! Modified ${result.filesModified} files.`,
          'Show Results', 'Refresh Extension'
        ).then(choice => {
          if (choice === 'Show Results') {
            this.showSetupResults(result);
          } else if (choice === 'Refresh Extension') {
            vscode.commands.executeCommand('haruspex.refreshAll');
          }
        });
      } else {
        vscode.window.showErrorMessage(
          `Haruspex setup completed with ${result.errors.length} errors.`,
          'Show Details'
        ).then(choice => {
          if (choice === 'Show Details') {
            this.showSetupResults(result);
          }
        });
      }

    } catch (error) {
      result.errors.push(`Setup failed: ${error}`);
      result.durationMs = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Process individual file for Haruspex initialization
   */
  private async processFile(file: vscode.Uri): Promise<boolean> {
    try {
      const content = await vscode.workspace.fs.readFile(file);
      const text = content.toString();
      
      // Check if file already has Haruspex stub
      if (text.includes('/**---') || text.includes('title:') || text.includes('provides:')) {
        return false; // Already has stub, skip
      }

      const ext = path.extname(file.fsPath).toLowerCase();
      let stub: string | null = null;

      if (ext === '.ts' || ext === '.tsx') {
        stub = this.generateTypeScriptStub(file.fsPath, text);
      } else if (ext === '.js' || ext === '.jsx') {
        stub = this.generateJavaScriptStub(file.fsPath, text);
      } else if (ext === '.md') {
        stub = this.generateMarkdownStub(file.fsPath, text);
      }

      if (stub) {
        const newContent = stub + '\n\n' + text;
        await vscode.workspace.fs.writeFile(file, Buffer.from(newContent));
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error processing file ${file.fsPath}:`, error);
      return false;
    }
  }

  /**
   * Generate TypeScript file stub
   */
  private generateTypeScriptStub(filePath: string, content: string): string {
    const filename = path.basename(filePath, path.extname(filePath));
    const className = this.extractClassName(content);
    const functions = this.extractFunctions(content);
    const interfaces = this.extractInterfaces(content);
    
    const provides = [
      ...(className ? [className] : []),
      ...functions,
      ...interfaces
    ];

    return `/**---
 * title: [${this.toTitleCase(filename)} - TypeScript Module]
 * tags: [TypeScript, Module, ${this.inferTags(filePath, content).join(', ')}]
 * provides: [${provides.join(', ')}]
 * requires: [${this.extractImports(content).join(', ')}]
 * description: [${this.generateDescription(filename, content)}]
 * ---*/`;
  }

  /**
   * Generate JavaScript file stub
   */
  private generateJavaScriptStub(filePath: string, content: string): string {
    const filename = path.basename(filePath, path.extname(filePath));
    const functions = this.extractFunctions(content);
    
    return `/**---
 * title: [${this.toTitleCase(filename)} - JavaScript Module]
 * tags: [JavaScript, Module, ${this.inferTags(filePath, content).join(', ')}]
 * provides: [${functions.join(', ')}]
 * requires: [${this.extractImports(content).join(', ')}]
 * description: [${this.generateDescription(filename, content)}]
 * ---*/`;
  }

  /**
   * Generate Markdown file stub
   */
  private generateMarkdownStub(filePath: string, content: string): string {
    const filename = path.basename(filePath, path.extname(filePath));
    const headings = this.extractMarkdownHeadings(content);
    
    return `<!--
title: [${this.toTitleCase(filename)} - Documentation]
tags: [Documentation, ${this.inferTags(filePath, content).join(', ')}]
provides: [${headings.join(', ')}]
requires: [Related Documentation]
description: [${this.generateDescription(filename, content)}]
-->`;
  }

  /**
   * Create documentation directory structure
   */
  private async createDocumentationStructure(workspaceRoot: string, result: WorkspaceSetupResult): Promise<void> {
    const docsDir = path.join(workspaceRoot, 'docs');
    const haruspexDir = path.join(docsDir, 'haruspex');
    
    try {
      // Create docs directory if it doesn't exist
      const docsUri = vscode.Uri.file(docsDir);
      try {
        await vscode.workspace.fs.stat(docsUri);
      } catch {
        await vscode.workspace.fs.createDirectory(docsUri);
        result.directoriesCreated.push('docs');
      }

      // Create haruspex subdirectory
      const haruspexUri = vscode.Uri.file(haruspexDir);
      try {
        await vscode.workspace.fs.stat(haruspexUri);
      } catch {
        await vscode.workspace.fs.createDirectory(haruspexUri);
        result.directoriesCreated.push('docs/haruspex');
      }

      // Create getting started guide
      const gettingStartedPath = path.join(haruspexDir, 'getting-started.md');
      const gettingStartedContent = this.generateGettingStartedContent();
      await vscode.workspace.fs.writeFile(
        vscode.Uri.file(gettingStartedPath),
        Buffer.from(gettingStartedContent)
      );

    } catch (error) {
      result.warnings.push(`Could not create documentation structure: ${error}`);
    }
  }

  /**
   * Generate next steps for user
   */
  private generateNextSteps(result: WorkspaceSetupResult, analysis: WorkspaceAnalysis): string[] {
    const steps: string[] = [];

    if (result.success) {
      steps.push('Open the Haruspex activity bar to explore your documentation');
      steps.push('Use "Haruspex: Refresh All" command to update views');
      
      if (result.filesModified > 0) {
        steps.push(`Review the ${result.filesModified} files with new documentation stubs`);
        steps.push('Enhance the generated stubs with project-specific details');
      }
      
      if (result.directoriesCreated.length > 0) {
        steps.push('Check the docs/haruspex/getting-started.md guide');
      }
      
      steps.push('Generate documentation stubs for new files as you create them');
    } else {
      steps.push('Review the setup errors in the diagnostic report');
      steps.push('Try running setup again after resolving issues');
      steps.push('Use "Haruspex: Show Diagnostics" command for troubleshooting');
    }

    return steps;
  }

  /**
   * Show setup results in detail
   */
  private async showSetupResults(result: WorkspaceSetupResult): Promise<void> {
    const panel = vscode.window.createWebviewPanel(
      'haruspexSetupResults',
      'Haruspex Setup Results',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    panel.webview.html = this.generateSetupResultsHtml(result);
  }

  // Helper methods for stub generation
  private extractClassName(content: string): string | null {
    const match = content.match(/export\s+class\s+(\w+)/);
    return match ? match[1] : null;
  }

  private extractFunctions(content: string): string[] {
    const matches = content.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/g) || [];
    return matches.map(match => {
      const nameMatch = match.match(/function\s+(\w+)/);
      return nameMatch ? nameMatch[1] : '';
    }).filter(name => name.length > 0);
  }

  private extractInterfaces(content: string): string[] {
    const matches = content.match(/(?:export\s+)?interface\s+(\w+)/g) || [];
    return matches.map(match => {
      const nameMatch = match.match(/interface\s+(\w+)/);
      return nameMatch ? nameMatch[1] : '';
    }).filter(name => name.length > 0);
  }

  private extractImports(content: string): string[] {
    const matches = content.match(/from\s+['"]([^'"]+)['"]/g) || [];
    return matches.map(match => {
      const moduleMatch = match.match(/from\s+['"]([^'"]+)['"]/);
      return moduleMatch ? moduleMatch[1] : '';
    }).filter(module => module.length > 0 && !module.startsWith('.'));
  }

  private extractMarkdownHeadings(content: string): string[] {
    const matches = content.match(/^#+\s+(.+)$/gm) || [];
    return matches.map(match => {
      const headingMatch = match.match(/^#+\s+(.+)$/);
      return headingMatch ? headingMatch[1].trim() : '';
    }).filter(heading => heading.length > 0);
  }

  private inferTags(filePath: string, content: string): string[] {
    const tags: string[] = [];
    
    if (filePath.includes('test')) tags.push('Testing');
    if (filePath.includes('spec')) tags.push('Specification');
    if (filePath.includes('component')) tags.push('Component');
    if (filePath.includes('service')) tags.push('Service');
    if (filePath.includes('util')) tags.push('Utility');
    if (content.includes('React')) tags.push('React');
    if (content.includes('Vue')) tags.push('Vue');
    if (content.includes('express')) tags.push('Express');
    if (content.includes('class ')) tags.push('Class');
    if (content.includes('interface ')) tags.push('Interface');
    
    return tags.length > 0 ? tags : ['Module'];
  }

  private generateDescription(filename: string, content: string): string {
    if (content.includes('test') || content.includes('spec')) {
      return `Test suite for ${filename} functionality`;
    }
    if (content.includes('component')) {
      return `React/Vue component implementing ${filename}`;
    }
    if (content.includes('service')) {
      return `Service layer for ${filename} operations`;
    }
    if (content.includes('util')) {
      return `Utility functions for ${filename}`;
    }
    return `Implementation module for ${filename}`;
  }

  private toTitleCase(str: string): string {
    return str.replace(/[-_]/g, ' ')
              .replace(/\b\w/g, l => l.toUpperCase());
  }

  private generateGettingStartedContent(): string {
    return `# Getting Started with Haruspex

Welcome to your Haruspex-enabled workspace! This guide will help you get the most out of your documentation system.

## What is Haruspex?

Haruspex is a documentation analysis and visualization tool that helps you understand and maintain your codebase through:

- **Documentation Tree**: Navigate your project structure and documentation
- **Architecture Diagrams**: Visual representation of your system architecture  
- **Health Dashboard**: Monitor the health and completeness of your documentation
- **TDD Workflow**: Track your development progress and testing status

## Quick Start

1. **Explore the Haruspex Activity Bar**: Click the Haruspex icon in the left sidebar to see all available views
2. **Review Generated Stubs**: Check the files that were modified during setup - they now have documentation stubs
3. **Enhance Documentation**: Add project-specific details to the generated stubs
4. **Use Commands**: Access Haruspex commands via Ctrl+Shift+P → "Haruspex:"

## Documentation Stubs

Files in your workspace now include documentation stubs with the following format:

\`\`\`typescript
/**---
 * title: [Module Name - Type]
 * tags: [Category, Function, Framework]
 * provides: [Exports, Functions, Classes]
 * requires: [Dependencies, Imports]
 * description: [Purpose and functionality]
 * ---*/
\`\`\`

## Next Steps

- Customize the generated stubs with your project's specific details
- Add stubs to new files as you create them
- Use "Haruspex: Refresh All" command to update views after changes
- Explore the different views in the Haruspex activity bar

## Need Help?

- Use "Haruspex: Show Diagnostics" for troubleshooting
- Check the debug output for detailed logs
- Review the setup results for any warnings or errors

Happy documenting! 🔮
`;
  }

  private generateSetupResultsHtml(result: WorkspaceSetupResult): string {
    const statusIcon = result.success ? '✅' : '❌';
    const statusColor = result.success ? '#28a745' : '#dc3545';
    
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Haruspex Setup Results</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            margin: 0;
            padding: 20px;
            line-height: 1.6;
        }
        .header {
            display: flex;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        .status-icon {
            font-size: 2em;
            margin-right: 15px;
        }
        .status {
            color: ${statusColor};
            font-weight: bold;
            font-size: 1.2em;
        }
        .metric {
            display: inline-block;
            margin: 5px 10px 5px 0;
            padding: 5px 10px;
            background: var(--vscode-badge-background);
            color: var(--vscode-badge-foreground);
            border-radius: 3px;
            font-size: 0.9em;
        }
        .section {
            margin-bottom: 30px;
            padding: 20px;
            background: var(--vscode-editor-inlayHint-background);
            border-radius: 8px;
            border: 1px solid var(--vscode-panel-border);
        }
        .next-steps {
            list-style: none;
            padding: 0;
        }
        .next-steps li {
            padding: 10px;
            margin: 5px 0;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-radius: 4px;
            position: relative;
            padding-left: 40px;
        }
        .next-steps li:before {
            content: "→";
            position: absolute;
            left: 15px;
            font-weight: bold;
        }
        .error-list, .warning-list {
            margin: 10px 0;
            padding: 0;
            list-style: none;
        }
        .error-list li {
            color: var(--vscode-errorForeground);
            background: var(--vscode-inputValidation-errorBackground);
            padding: 8px;
            margin: 4px 0;
            border-radius: 3px;
        }
        .warning-list li {
            color: var(--vscode-warningForeground);
            background: var(--vscode-inputValidation-warningBackground);
            padding: 8px;
            margin: 4px 0;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="status-icon">${statusIcon}</div>
        <div>
            <h1>Haruspex Setup Results</h1>
            <div class="status">${result.success ? 'Setup Successful' : 'Setup Completed with Errors'}</div>
        </div>
    </div>

    <div class="section">
        <h2>Summary</h2>
        <div class="metric">Duration: ${Math.round(result.durationMs / 1000)}s</div>
        <div class="metric">Files Processed: ${result.filesProcessed}</div>
        <div class="metric">Files Modified: ${result.filesModified}</div>
        <div class="metric">Directories Created: ${result.directoriesCreated.length}</div>
        ${result.errors.length > 0 ? `<div class="metric">Errors: ${result.errors.length}</div>` : ''}
        ${result.warnings.length > 0 ? `<div class="metric">Warnings: ${result.warnings.length}</div>` : ''}
    </div>

    ${result.nextSteps.length > 0 ? `
    <div class="section">
        <h2>Next Steps</h2>
        <ul class="next-steps">
            ${result.nextSteps.map(step => `<li>${step}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    ${result.errors.length > 0 ? `
    <div class="section">
        <h2>Errors</h2>
        <ul class="error-list">
            ${result.errors.map(error => `<li>${error}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    ${result.warnings.length > 0 ? `
    <div class="section">
        <h2>Warnings</h2>
        <ul class="warning-list">
            ${result.warnings.map(warning => `<li>${warning}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    ${result.directoriesCreated.length > 0 ? `
    <div class="section">
        <h2>Created Directories</h2>
        <ul>
            ${result.directoriesCreated.map(dir => `<li>${dir}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    <div style="text-align: center; margin-top: 30px; color: var(--vscode-descriptionForeground);">
        <p>Setup completed at ${new Date().toLocaleString()}</p>
    </div>
</body>
</html>`;
  }
}
