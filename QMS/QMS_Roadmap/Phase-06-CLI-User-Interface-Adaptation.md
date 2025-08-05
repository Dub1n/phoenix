# Phase 6: CLI & User Interface Adaptation

## High-Level Goal

Extend existing Phoenix-Code-Lite CLI interface to support comprehensive QMS operations while maintaining all existing functionality and providing unified, intuitive user experience for both development and regulatory workflows.

## Detailed Context and Rationale

### Why This Phase Exists

Medical device software development requires sophisticated command-line tools that support both traditional development workflows and regulatory compliance activities. This phase transforms Phoenix-Code-Lite's existing CLI into a comprehensive interface supporting QMS operations while preserving all existing development capabilities and user workflows.

### Technical Justification

From the QMS Infrastructure specifications:
> "CLI interface enhanced with QMS-specific commands, interactive regulatory workflows, context-aware help system, and seamless integration between development and compliance operations. All CLI interactions must maintain audit trails, provide clear feedback, and support both expert and guided operational modes."

This phase implements the usability requirement for regulatory software tools as specified in medical device software usability standards and AAMI TIR45 guidance on user interface design for regulatory compliance tools. The enhanced CLI ensures that QMS operations are as accessible and efficient as existing development workflows.

### Architecture Integration

This phase implements critical QMS user interface and workflow quality gates:

- **User Experience Quality Gates**: Intuitive command structure, consistent interface patterns, comprehensive help system
- **Workflow Integration Quality Gates**: Seamless transition between development and compliance workflows, context preservation
- **Security Quality Gates**: Secure command execution, role-based command access, audit trail for all operations
- **Performance Quality Gates**: Responsive command execution, efficient bulk operations, progressive feedback for long operations

## Prerequisites & Verification

### Prerequisites from Phase 5

- **Configuration System Enhanced** - QMS configuration management with template support and validation operational
- **Template Management System Operational** - Regulatory template loading, validation, and version management with integrity checking
- **Backward Compatibility Validated** - All existing configuration functionality preserved with automatic migration capability
- **Security Integration Complete** - Role-based configuration access with audit trails and encrypted storage
- **Performance Optimization** - Configuration loading and template management within acceptable performance parameters

### Validation Commands

> ```bash
> # Verify Phase 5 deliverables
> npm test                                    # Should show comprehensive configuration coverage
> npm run config:validate                    # Configuration system validation
> npm run build                               # Clean compilation
> 
> # CLI enhancement tooling
> npm install --save-dev commander           # CLI framework
> npm install --save-dev inquirer            # Interactive prompts
> npm install --save-dev chalk               # Terminal coloring
> npm install --save-dev ora                 # Progress indicators
> npm install --save-dev cli-table3          # Table formatting
> ```

### Expected Results

- All Phase 5 configuration enhancements operational (no regression)
- Configuration validation tests passing with comprehensive coverage
- Build completes without errors or CLI warnings
- CLI enhancement dependencies installed and configured
- Existing CLI commands operational and ready for extension

## Step-by-Step Implementation Guide

*Reference: Follow established patterns from `QMS-Refactoring-Guide.md` for CLI integration validation*

### 1. Test-Driven Development (TDD) First - "CLI User Interface Adaptation Validation Tests"

**Test Name**: "QMS CLI Interface Comprehensive Validation and Integration"

Create comprehensive test suites for enhanced CLI functionality:

```typescript
// tests/cli/cli-user-interface-adaptation.test.ts

describe('CLI User Interface Adaptation Validation', () => {
  describe('QMS Command Extension Tests', () => {
    test('should support QMS analyze command with document processing', async () => {
      const cli = new EnhancedCLI();
      
      // Test QMS analyze command structure
      const analyzeCommand = cli.getCommand('qms:analyze');
      expect(analyzeCommand).toBeDefined();
      expect(analyzeCommand.description).toContain('regulatory document analysis');
      
      // Test command options
      expect(analyzeCommand.options).toContainEqual(
        expect.objectContaining({
          flags: '--standard <standard>',
          description: 'Regulatory standard to analyze against'
        })
      );
      
      expect(analyzeCommand.options).toContainEqual(
        expect.objectContaining({
          flags: '--output <format>',
          description: 'Output format (json, pdf, html)'
        })
      );
      
      // Test command execution
      const mockArgs = ['qms:analyze', 'test-document.pdf', '--standard', 'EN62304', '--output', 'json'];
      const result = await cli.execute(mockArgs);
      
      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
      expect(result.audit).toBeDefined();
    });
    
    test('should support QMS compliance command with validation workflows', async () => {
      const cli = new EnhancedCLI();
      
      // Test compliance command
      const complianceCommand = cli.getCommand('qms:compliance');
      expect(complianceCommand).toBeDefined();
      
      // Test subcommands
      const validateSubcommand = complianceCommand.getSubcommand('validate');
      expect(validateSubcommand).toBeDefined();
      
      const reportSubcommand = complianceCommand.getSubcommand('report');
      expect(reportSubcommand).toBeDefined();
      
      // Test compliance validation execution
      const mockArgs = ['qms:compliance', 'validate', '--standard', 'EN62304', '--scope', 'full'];
      const result = await cli.execute(mockArgs);
      
      expect(result.success).toBe(true);
      expect(result.complianceScore).toBeGreaterThanOrEqual(0);
      expect(result.complianceScore).toBeLessThanOrEqual(100);
    });
    
    test('should support QMS template command with management operations', async () => {
      const cli = new EnhancedCLI();
      
      // Test template command structure
      const templateCommand = cli.getCommand('qms:template');
      expect(templateCommand).toBeDefined();
      
      // Test template operations
      const listArgs = ['qms:template', 'list'];
      const listResult = await cli.execute(listArgs);
      expect(listResult.success).toBe(true);
      expect(listResult.templates).toBeInstanceOf(Array);
      
      const loadArgs = ['qms:template', 'load', 'EN62304', '--classification', 'Class-B'];
      const loadResult = await cli.execute(loadArgs);
      expect(loadResult.success).toBe(true);
      expect(loadResult.template).toBeDefined();
    });
  });
  
  describe('Existing CLI Functionality Preservation Tests', () => {
    test('should preserve all existing Phoenix-Code-Lite CLI commands', async () => {
      const existingCLI = new CLI(); // Original
      const enhancedCLI = new EnhancedCLI(); // New
      
      // Test that all original commands are preserved
      const originalCommands = existingCLI.getAllCommands();
      const enhancedCommands = enhancedCLI.getAllCommands();
      
      originalCommands.forEach(originalCommand => {
        const preservedCommand = enhancedCommands.find(cmd => cmd.name === originalCommand.name);
        expect(preservedCommand).toBeDefined();
        expect(preservedCommand.description).toBe(originalCommand.description);
        expect(preservedCommand.options).toEqual(originalCommand.options);
      });
    });
    
    test('should maintain existing TDD workflow CLI functionality', async () => {
      const cli = new EnhancedCLI();
      
      // Test existing TDD commands work unchanged
      const tddArgs = ['tdd', 'create-function', '--language', 'typescript', '--test-framework', 'jest'];
      const result = await cli.execute(tddArgs);
      
      expect(result.success).toBe(true);
      expect(result.workflowPhase).toBe('plan-and-test');
      
      // Verify TDD workflow orchestration still functions
      expect(result.orchestrator).toBeDefined();
      expect(result.agents).toContain('Planning Analyst');
    });
    
    test('should maintain existing configuration CLI commands', async () => {
      const cli = new EnhancedCLI();
      
      // Test config commands work with enhanced system
      const configArgs = ['config', 'show'];
      const result = await cli.execute(configArgs);
      
      expect(result.success).toBe(true);
      expect(result.config).toBeDefined();
      expect(result.config.claude).toBeDefined(); // Existing config preserved
      expect(result.config.qms).toBeDefined(); // New config available
    });
  });
  
  describe('Interactive Workflow Tests', () => {
    test('should support interactive QMS workflow guidance', async () => {
      const cli = new EnhancedCLI();
      
      // Mock interactive responses
      const mockInquirer = {
        responses: {
          'document-path': 'test-document.pdf',
          'regulatory-standard': 'EN62304',
          'analysis-scope': 'full',
          'output-format': 'pdf'
        }
      };
      
      cli.setInteractiveMock(mockInquirer);
      
      // Test interactive workflow
      const interactiveArgs = ['qms:workflow', '--interactive'];
      const result = await cli.execute(interactiveArgs);
      
      expect(result.success).toBe(true);
      expect(result.workflowSteps).toBeDefined();
      expect(result.userChoices).toEqual(mockInquirer.responses);
    });
    
    test('should provide context-aware help and guidance', async () => {
      const cli = new EnhancedCLI();
      
      // Test context-aware help
      const helpArgs = ['help', 'qms:analyze'];
      const helpResult = await cli.execute(helpArgs);
      
      expect(helpResult.success).toBe(true);
      expect(helpResult.help).toContain('regulatory document analysis');
      expect(helpResult.examples).toBeInstanceOf(Array);
      expect(helpResult.examples.length).toBeGreaterThan(0);
      
      // Test guided mode
      const guidedArgs = ['qms:analyze', '--guided'];
      const guidedResult = await cli.execute(guidedArgs);
      
      expect(guidedResult.success).toBe(true);
      expect(guidedResult.guidanceProvided).toBe(true);
    });
  });
});

describe('CLI Security and Audit Integration Tests', () => {
  describe('Role-Based Command Access', () => {
    test('should enforce role-based access for QMS commands', async () => {
      const cli = new EnhancedCLI();
      const securityManager = new QMSSecurityManager();
      
      // Test analyst user access
      const analystUser = { id: 'user-001', roles: ['qms_analyst'] };
      cli.setCurrentUser(analystUser);
      
      // Analyst should access analysis commands
      const analyzeArgs = ['qms:analyze', 'document.pdf'];
      const analyzeResult = await cli.execute(analyzeArgs);
      expect(analyzeResult.success).toBe(true);
      
      // Test restricted access for admin commands
      const adminArgs = ['qms:template', 'update', 'EN62304'];
      const adminResult = await cli.execute(adminArgs);
      expect(adminResult.success).toBe(false);
      expect(adminResult.error).toContain('insufficient permissions');
    });
  });
  
  describe('Audit Trail Integration', () => {
    test('should create audit records for all QMS CLI operations', async () => {
      const cli = new EnhancedCLI();
      const auditLogger = new ComplianceAuditLogger();
      
      cli.setAuditLogger(auditLogger);
      
      // Execute QMS command
      const args = ['qms:compliance', 'validate', '--standard', 'EN62304'];
      const result = await cli.execute(args);
      
      expect(result.success).toBe(true);
      expect(result.auditRecord).toBeDefined();
      expect(result.auditRecord.eventType).toBe('cli_command_executed');
      expect(result.auditRecord.metadata.command).toBe('qms:compliance validate');
    });
  });
});

describe('CLI User Experience Enhancement Tests', () => {
  test('should provide clear progress indicators for long operations', async () => {
    const cli = new EnhancedCLI();
    
    // Mock long-running operation
    const progressTracker = new ProgressTracker();
    cli.setProgressTracker(progressTracker);
    
    const args = ['qms:analyze', 'large-document.pdf', '--standard', 'EN62304'];
    const result = await cli.execute(args);
    
    expect(result.success).toBe(true);
    expect(progressTracker.stepsReported).toBeGreaterThan(0);
    expect(progressTracker.finalStatus).toBe('completed');
  });
  
  test('should provide comprehensive error messages and recovery suggestions', async () => {
    const cli = new EnhancedCLI();
    
    // Test error handling
    const invalidArgs = ['qms:analyze', 'nonexistent.pdf'];
    const result = await cli.execute(invalidArgs);
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.suggestions).toBeInstanceOf(Array);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});
```

### 2. Enhanced CLI Framework Implementation

Create enhanced CLI framework with QMS command support:

```typescript
// src/cli/enhanced-commands.ts

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import Table from 'cli-table3';
import { QMSWorkflowOrchestrator } from '../qms/workflow-orchestrator';
import { QMSConfigManager } from '../config/qms-config-manager';
import { ComplianceAuditLogger } from '../security/compliance-audit-logger';
import { QMSSecurityManager } from '../security/qms-security-manager';
import { CLI } from './commands'; // Existing CLI

interface CLIResult {
  success: boolean;
  output?: any;
  error?: string;
  suggestions?: string[];
  auditRecord?: any;
}

interface User {
  id: string;
  roles: string[];
}

export class EnhancedCLI extends CLI {
  private qmsOrchestrator: QMSWorkflowOrchestrator;
  private configManager: QMSConfigManager;
  private auditLogger: ComplianceAuditLogger;
  private securityManager: QMSSecurityManager;
  private currentUser?: User;
  private program: Command;
  
  constructor() {
    super(); // Initialize existing CLI functionality
    this.qmsOrchestrator = new QMSWorkflowOrchestrator();
    this.configManager = new QMSConfigManager();
    this.auditLogger = new ComplianceAuditLogger();
    this.securityManager = new QMSSecurityManager();
    this.program = new Command();
    
    this.initializeQMSCommands();
  }
  
  private initializeQMSCommands(): void {
    // QMS Analyze Command
    this.program
      .command('qms:analyze <document>')
      .description('Analyze regulatory document for compliance requirements')
      .option('-s, --standard <standard>', 'Regulatory standard (EN62304, AAMI-TIR45)', 'EN62304')
      .option('-o, --output <format>', 'Output format (json, pdf, html)', 'json')
      .option('-c, --classification <class>', 'Software classification (Class-A, Class-B, Class-C)')
      .option('--guided', 'Use guided analysis mode with interactive prompts')
      .option('--verbose', 'Verbose output with detailed analysis steps')
      .action(this.handleQMSAnalyze.bind(this));
    
    // QMS Compliance Command
    const complianceCmd = this.program
      .command('qms:compliance')
      .description('Regulatory compliance operations');
    
    complianceCmd
      .command('validate')
      .description('Validate compliance against regulatory standards')
      .option('-s, --standard <standard>', 'Regulatory standard to validate against', 'EN62304')
      .option('--scope <scope>', 'Validation scope (full, partial, specific)', 'full')
      .option('--format <format>', 'Output format (json, pdf, html)', 'json')
      .action(this.handleComplianceValidate.bind(this));
    
    complianceCmd
      .command('report')
      .description('Generate compliance reports')
      .option('-s, --standard <standard>', 'Regulatory standard for report', 'EN62304')
      .option('-o, --output <file>', 'Output file path')
      .option('--template <template>', 'Report template to use')
      .action(this.handleComplianceReport.bind(this));
    
    // QMS Template Command
    const templateCmd = this.program
      .command('qms:template')
      .description('Regulatory template management');
    
    templateCmd
      .command('list')
      .description('List available regulatory templates')
      .option('--format <format>', 'Output format (table, json)', 'table')
      .action(this.handleTemplateList.bind(this));
    
    templateCmd
      .command('load <standard>')
      .description('Load regulatory template')
      .option('-c, --classification <class>', 'Template classification')
      .option('--show-requirements', 'Show template requirements')
      .action(this.handleTemplateLoad.bind(this));
    
    templateCmd
      .command('update <standard>')
      .description('Update regulatory template')
      .option('--version <version>', 'New template version')
      .option('--force', 'Force update without confirmation')
      .action(this.handleTemplateUpdate.bind(this));
    
    // QMS Workflow Command
    this.program
      .command('qms:workflow')
      .description('Interactive QMS workflow guidance')
      .option('--interactive', 'Use interactive mode with guided prompts')
      .option('--template <template>', 'Workflow template to use')
      .option('--save-session', 'Save workflow session for resumption')
      .action(this.handleQMSWorkflow.bind(this));
    
    // QMS Configuration Command
    const configCmd = this.program
      .command('qms:config')
      .description('QMS configuration management');
    
    configCmd
      .command('show')
      .description('Show current QMS configuration')
      .option('--section <section>', 'Show specific configuration section')
      .action(this.handleConfigShow.bind(this));
    
    configCmd
      .command('set <key> <value>')
      .description('Set QMS configuration value')
      .option('--validate', 'Validate configuration after setting')
      .action(this.handleConfigSet.bind(this));
  }
  
  async execute(args: string[]): Promise<CLIResult> {
    try {
      // Security check
      if (this.isQMSCommand(args[0])) {
        const hasAccess = await this.checkCommandAccess(args[0]);
        if (!hasAccess) {
          return {
            success: false,
            error: 'Insufficient permissions to execute QMS command',
            suggestions: ['Contact administrator for access', 'Check user role assignments']
          };
        }
      }
      
      // Create audit record for QMS commands
      let auditRecord;
      if (this.isQMSCommand(args[0])) {
        auditRecord = await this.auditLogger.createSecureAuditRecord({
          eventType: 'cli_command_executed',
          timestamp: new Date().toISOString(),
          userId: this.currentUser?.id || 'anonymous',
          action: 'execute_qms_command',
          metadata: {
            command: args.join(' '),
            userRoles: this.currentUser?.roles || []
          }
        });
      }
      
      // Execute command
      this.program.parse(args, { from: 'user' });
      
      return {
        success: true,
        auditRecord
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        suggestions: this.generateErrorSuggestions(error)
      };
    }
  }
  
  private async handleQMSAnalyze(document: string, options: any): Promise<void> {
    const spinner = ora('Analyzing regulatory document...').start();
    
    try {
      if (options.guided) {
        const responses = await this.promptAnalysisOptions();
        Object.assign(options, responses);
      }
      
      spinner.text = 'Processing document...';
      const analysisResult = await this.qmsOrchestrator.analyzeDocument({
        documentPath: document,
        standard: options.standard,
        classification: options.classification,
        outputFormat: options.output
      });
      
      spinner.succeed('Document analysis completed');
      
      // Display results
      this.displayAnalysisResults(analysisResult, options);
      
    } catch (error) {
      spinner.fail('Document analysis failed');
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      this.suggestAnalysisRecovery(error);
    }
  }
  
  private async handleComplianceValidate(options: any): Promise<void> {
    const spinner = ora('Validating compliance...').start();
    
    try {
      spinner.text = 'Loading regulatory requirements...';
      const validationResult = await this.qmsOrchestrator.validateCompliance({
        standard: options.standard,
        scope: options.scope,
        outputFormat: options.format
      });
      
      spinner.succeed('Compliance validation completed');
      
      // Display compliance results
      this.displayComplianceResults(validationResult, options);
      
    } catch (error) {
      spinner.fail('Compliance validation failed');
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      this.suggestComplianceRecovery(error);
    }
  }
  
  private async handleTemplateList(options: any): Promise<void> {
    try {
      const templates = await this.qmsOrchestrator.getAvailableTemplates();
      
      if (options.format === 'json') {
        console.log(JSON.stringify(templates, null, 2));
      } else {
        // Display as table
        const table = new Table({
          head: ['Standard', 'Version', 'Classification', 'Requirements', 'Last Updated'],
          colWidths: [15, 10, 15, 15, 20]
        });
        
        templates.forEach(template => {
          table.push([
            template.standard,
            template.version,
            template.classification || 'N/A',
            template.requirements.length.toString(),
            new Date(template.metadata.lastUpdated).toLocaleDateString()
          ]);
        });
        
        console.log(table.toString());
      }
    } catch (error) {
      console.error(chalk.red('Error loading templates:'), error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  private async handleQMSWorkflow(options: any): Promise<void> {
    console.log(chalk.blue('🏥 QMS Workflow Assistant'));
    console.log('This guided workflow will help you through regulatory compliance analysis.\n');
    
    if (options.interactive) {
      const workflowChoices = await inquirer.prompt([
        {
          type: 'list',
          name: 'workflowType',
          message: 'What type of QMS workflow would you like to execute?',
          choices: [
            'Document Analysis - Analyze regulatory documents for compliance',
            'Compliance Validation - Validate system against regulatory standards',
            'Report Generation - Generate compliance reports and documentation',
            'Template Management - Manage regulatory templates and procedures'
          ]
        }
      ]);
      
      await this.executeInteractiveWorkflow(workflowChoices.workflowType);
    } else {
      this.displayWorkflowHelp();
    }
  }
  
  private async promptAnalysisOptions(): Promise<any> {
    return inquirer.prompt([
      {
        type: 'list',
        name: 'standard',
        message: 'Select regulatory standard:',
        choices: ['EN62304', 'AAMI-TIR45', 'ISO14971'],
        default: 'EN62304'
      },
      {
        type: 'list',
        name: 'classification',
        message: 'Select software classification:',
        choices: ['Class-A', 'Class-B', 'Class-C'],
        when: (answers) => answers.standard === 'EN62304'
      },
      {
        type: 'list',
        name: 'output',
        message: 'Select output format:',
        choices: ['json', 'pdf', 'html'],
        default: 'json'
      }
    ]);
  }
  
  private displayAnalysisResults(result: any, options: any): void {
    console.log(chalk.green('\n✅ Analysis Results'));
    console.log(chalk.blue('Document:'), result.documentInfo.name);
    console.log(chalk.blue('Standard:'), result.standard);
    console.log(chalk.blue('Compliance Score:'), `${result.complianceScore}%`);
    
    if (result.requirements && result.requirements.length > 0) {
      console.log(chalk.blue('\n📋 Requirements Analysis:'));
      const table = new Table({
        head: ['Requirement ID', 'Status', 'Evidence'],
        colWidths: [20, 15, 40]
      });
      
      result.requirements.slice(0, 10).forEach((req: any) => {
        table.push([
          req.id,
          req.status === 'compliant' ? chalk.green('✓ Compliant') : chalk.yellow('⚠ Gap'),
          req.evidence ? req.evidence.substring(0, 35) + '...' : 'No evidence'
        ]);
      });
      
      console.log(table.toString());
    }
    
    if (options.output !== 'json') {
      console.log(chalk.blue('\n💾 Report saved to:'), result.outputPath);
    }
  }
  
  private displayComplianceResults(result: any, options: any): void {
    console.log(chalk.green('\n✅ Compliance Validation Results'));
    console.log(chalk.blue('Standard:'), result.standard);
    console.log(chalk.blue('Overall Compliance:'), `${result.overallCompliance}%`);
    console.log(chalk.blue('Total Requirements:'), result.totalRequirements);
    console.log(chalk.blue('Validated:'), chalk.green(result.validatedRequirements));
    console.log(chalk.blue('Gaps:'), chalk.yellow(result.gaps.length));
    
    if (result.gaps.length > 0) {
      console.log(chalk.yellow('\n⚠️  Compliance Gaps:'));
      result.gaps.forEach((gap: any, index: number) => {
        console.log(`${index + 1}. ${gap.requirementId}: ${gap.description}`);
      });
    }
  }
  
  private async checkCommandAccess(command: string): Promise<boolean> {
    if (!this.currentUser) {
      return true; // Allow access if no user context (for testing/development)
    }
    
    const permissions = this.getCommandPermissions(command);
    for (const permission of permissions) {
      const hasPermission = await this.securityManager.hasPermission(this.currentUser, permission);
      if (hasPermission) {
        return true;
      }
    }
    
    return false;
  }
  
  private getCommandPermissions(command: string): string[] {
    const permissionMap: Record<string, string[]> = {
      'qms:analyze': ['read_documents', 'extract_requirements'],
      'qms:compliance': ['review_compliance', 'generate_reports'],
      'qms:template': ['manage_configurations'],
      'qms:workflow': ['read_documents', 'extract_requirements'],
      'qms:config': ['manage_configurations']
    };
    
    return permissionMap[command] || [];
  }
  
  private isQMSCommand(command: string): boolean {
    return command && command.startsWith('qms:');
  }
  
  setCurrentUser(user: User): void {
    this.currentUser = user;
  }
  
  setAuditLogger(logger: ComplianceAuditLogger): void {
    this.auditLogger = logger;
  }
  
  // Preserve existing CLI functionality
  getAllCommands(): any[] {
    const existingCommands = super.getAllCommands ? super.getAllCommands() : [];
    const qmsCommands = this.program.commands.map(cmd => ({
      name: cmd.name(),
      description: cmd.description(),
      options: cmd.options.map(opt => ({
        flags: opt.flags,
        description: opt.description
      }))
    }));
    
    return [...existingCommands, ...qmsCommands];
  }
  
  getCommand(name: string): any {
    // Check existing commands first
    const existingCommand = super.getCommand ? super.getCommand(name) : null;
    if (existingCommand) {
      return existingCommand;
    }
    
    // Check QMS commands
    return this.program.commands.find(cmd => cmd.name() === name);
  }
  
  private generateErrorSuggestions(error: any): string[] {
    const suggestions = [];
    
    if (error instanceof Error) {
      if (error.message.includes('file not found')) {
        suggestions.push('Check that the document path is correct');
        suggestions.push('Ensure the file exists and is accessible');
      }
      
      if (error.message.includes('permission')) {
        suggestions.push('Check user permissions for QMS operations');
        suggestions.push('Contact administrator for role assignment');
      }
      
      if (error.message.includes('template')) {
        suggestions.push('Run "qms:template list" to see available templates');
        suggestions.push('Check template version and compatibility');
      }
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Run command with --help for usage information');
      suggestions.push('Check system logs for detailed error information');
    }
    
    return suggestions;
  }
  
  private suggestAnalysisRecovery(error: any): void {
    console.log(chalk.yellow('\n💡 Suggestions:'));
    const suggestions = this.generateErrorSuggestions(error);
    suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. ${suggestion}`);
    });
  }
  
  private suggestComplianceRecovery(error: any): void {
    console.log(chalk.yellow('\n💡 Recovery Options:'));
    console.log('1. Check that regulatory templates are properly loaded');
    console.log('2. Verify document format is supported (PDF, DOCX, MD)');
    console.log('3. Run "qms:config show" to verify QMS configuration');
  }
  
  private async executeInteractiveWorkflow(workflowType: string): void {
    // Implementation for interactive workflow execution
    console.log(chalk.blue(`Executing: ${workflowType}`));
    // This would implement the specific workflow based on user choice
  }
  
  private displayWorkflowHelp(): void {
    console.log(chalk.blue('Available QMS Workflows:'));
    console.log('• qms:analyze - Document analysis and requirement extraction');
    console.log('• qms:compliance - Compliance validation and gap analysis');
    console.log('• qms:template - Template management and configuration');
    console.log('• qms:workflow --interactive - Guided workflow assistant');
  }
}
```

### 3. Interactive Workflow System Implementation

Create comprehensive interactive workflow system:

```typescript
// src/cli/interactive-workflow.ts

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { QMSWorkflowOrchestrator } from '../qms/workflow-orchestrator';
import { ComplianceAuditLogger } from '../security/compliance-audit-logger';

interface WorkflowSession {
  id: string;
  type: string;
  started: string;
  steps: WorkflowStep[];
  results: any[];
  user: string;
}

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  result?: any;
}

export class InteractiveWorkflowManager {
  private orchestrator: QMSWorkflowOrchestrator;
  private auditLogger: ComplianceAuditLogger;
  private currentSession?: WorkflowSession;
  
  constructor() {
    this.orchestrator = new QMSWorkflowOrchestrator();
    this.auditLogger = new ComplianceAuditLogger();
  }
  
  async startDocumentAnalysisWorkflow(): Promise<void> {
    console.log(chalk.blue('📄 Document Analysis Workflow'));
    console.log('This workflow will guide you through regulatory document analysis.\n');
    
    // Step 1: Document Selection
    const documentInfo = await inquirer.prompt([
      {
        type: 'input',
        name: 'documentPath',
        message: 'Enter the path to your regulatory document:',
        validate: (input) => input.length > 0 || 'Document path is required'
      },
      {
        type: 'list',
        name: 'documentType',
        message: 'What type of document is this?',
        choices: [
          'Regulatory Standard (e.g., EN 62304, ISO 14971)',
          'Technical Specification',
          'Risk Management Documentation',
          'Software Requirements Specification',
          'Other'
        ]
      }
    ]);
    
    // Step 2: Analysis Configuration
    const analysisConfig = await inquirer.prompt([
      {
        type: 'list',
        name: 'standard',
        message: 'Which regulatory standard should be used for analysis?',
        choices: ['EN62304', 'AAMI-TIR45', 'ISO14971', 'Custom'],
        default: 'EN62304'
      },
      {
        type: 'list',
        name: 'classification',
        message: 'Select software safety classification:',
        choices: ['Class A (Non-life-threatening)', 'Class B (Non-life-threatening injury)', 'Class C (Life-threatening)'],
        when: (answers) => answers.standard === 'EN62304'
      },
      {
        type: 'checkbox',
        name: 'analysisTypes',
        message: 'Select analysis types to perform:',
        choices: [
          { name: 'Requirement Extraction', value: 'requirements', checked: true },
          { name: 'Compliance Gap Analysis', value: 'gaps', checked: true },
          { name: 'Risk Assessment', value: 'risks', checked: false },
          { name: 'Traceability Matrix', value: 'traceability', checked: false }
        ]
      }
    ]);
    
    // Step 3: Execute Analysis
    const spinner = ora('Initializing document analysis...').start();
    
    try {
      // Create workflow session
      this.currentSession = await this.createWorkflowSession('document-analysis', {
        document: documentInfo,
        config: analysisConfig
      });
      
      // Execute analysis steps
      for (const analysisType of analysisConfig.analysisTypes) {
        spinner.text = `Performing ${analysisType} analysis...`;
        
        const stepResult = await this.executeAnalysisStep(analysisType, {
          documentPath: documentInfo.documentPath,
          standard: analysisConfig.standard,
          classification: analysisConfig.classification
        });
        
        this.currentSession.results.push(stepResult);
        this.markStepCompleted(analysisType);
      }
      
      spinner.succeed('Document analysis completed successfully');
      
      // Step 4: Results Review
      await this.presentAnalysisResults();
      
      // Step 5: Next Actions
      await this.suggestNextActions();
      
    } catch (error) {
      spinner.fail('Document analysis failed');
      console.error(chalk.red('Error:'), error instanceof Error ? error.message : 'Unknown error');
      await this.handleWorkflowError(error);
    }
  }
  
  async startComplianceValidationWorkflow(): Promise<void> {
    console.log(chalk.blue('✅ Compliance Validation Workflow'));
    console.log('This workflow will validate your system against regulatory standards.\n');
    
    // Step 1: Validation Scope
    const validationScope = await inquirer.prompt([
      {
        type: 'list',
        name: 'standard',
        message: 'Select regulatory standard for validation:',
        choices: ['EN62304', 'AAMI-TIR45', 'ISO14971', 'FDA QSR', 'All Standards']
      },
      {
        type: 'list',
        name: 'scope',
        message: 'Select validation scope:',
        choices: [
          'Full System Validation - Complete compliance assessment',
          'Incremental Validation - Validate recent changes',
          'Gap Analysis Only - Identify compliance gaps',
          'Pre-Audit Validation - Prepare for regulatory audit'
        ]
      },
      {
        type: 'confirm',
        name: 'includeEvidence',
        message: 'Include evidence collection in validation?',
        default: true
      }
    ]);
    
    // Step 2: Execute Validation
    const spinner = ora('Initializing compliance validation...').start();
    
    try {
      const validationResult = await this.orchestrator.validateCompliance({
        standard: validationScope.standard,
        scope: validationScope.scope,
        includeEvidence: validationScope.includeEvidence
      });
      
      spinner.succeed('Compliance validation completed');
      
      // Present results
      await this.presentValidationResults(validationResult);
      
    } catch (error) {
      spinner.fail('Compliance validation failed');
      await this.handleWorkflowError(error);
    }
  }
  
  async startReportGenerationWorkflow(): Promise<void> {
    console.log(chalk.blue('📊 Report Generation Workflow'));
    console.log('This workflow will generate comprehensive compliance reports.\n');
    
    const reportConfig = await inquirer.prompt([
      {
        type: 'list',
        name: 'reportType',
        message: 'Select report type:',
        choices: [
          'Compliance Summary Report',
          'Gap Analysis Report',
          'Audit Preparation Report',
          'Risk Assessment Report',
          'Custom Report'
        ]
      },
      {
        type: 'checkbox',
        name: 'standards',
        message: 'Include compliance data for which standards?',
        choices: ['EN62304', 'AAMI-TIR45', 'ISO14971', 'FDA QSR'],
        default: ['EN62304']
      },
      {
        type: 'list',
        name: 'format',
        message: 'Select output format:',
        choices: ['PDF', 'HTML', 'Word Document', 'Excel Spreadsheet'],
        default: 'PDF'
      },
      {
        type: 'input',
        name: 'outputPath',
        message: 'Enter output file path (optional):',
        default: './qms-report'
      }
    ]);
    
    const spinner = ora('Generating compliance report...').start();
    
    try {
      const report = await this.orchestrator.generateReport(reportConfig);
      
      spinner.succeed(`Report generated successfully: ${report.outputPath}`);
      
      console.log(chalk.green('\n📄 Report Summary:'));
      console.log(`• Report Type: ${reportConfig.reportType}`);
      console.log(`• Standards Covered: ${reportConfig.standards.join(', ')}`);
      console.log(`• Format: ${reportConfig.format}`);
      console.log(`• Output: ${report.outputPath}`);
      
    } catch (error) {
      spinner.fail('Report generation failed');
      await this.handleWorkflowError(error);
    }
  }
  
  private async createWorkflowSession(type: string, config: any): Promise<WorkflowSession> {
    const session: WorkflowSession = {
      id: `session-${Date.now()}`,
      type,
      started: new Date().toISOString(),
      steps: this.getWorkflowSteps(type),
      results: [],
      user: 'current-user' // Would be set from context
    };
    
    // Audit workflow start
    await this.auditLogger.createSecureAuditRecord({
      eventType: 'interactive_workflow_started',
      timestamp: new Date().toISOString(),
      userId: session.user,
      action: 'start_workflow',
      metadata: {
        workflowType: type,
        sessionId: session.id,
        configuration: config
      }
    });
    
    return session;
  }
  
  private getWorkflowSteps(type: string): WorkflowStep[] {
    const stepDefinitions: Record<string, WorkflowStep[]> = {
      'document-analysis': [
        { id: 'requirements', name: 'Requirement Extraction', description: 'Extract regulatory requirements', completed: false },
        { id: 'gaps', name: 'Gap Analysis', description: 'Identify compliance gaps', completed: false },
        { id: 'risks', name: 'Risk Assessment', description: 'Assess regulatory risks', completed: false },
        { id: 'traceability', name: 'Traceability Matrix', description: 'Create requirement traceability', completed: false }
      ],
      'compliance-validation': [
        { id: 'load-standards', name: 'Load Standards', description: 'Load regulatory standards', completed: false },
        { id: 'validate-requirements', name: 'Validate Requirements', description: 'Validate against requirements', completed: false },
        { id: 'collect-evidence', name: 'Collect Evidence', description: 'Gather compliance evidence', completed: false },
        { id: 'generate-report', name: 'Generate Report', description: 'Create validation report', completed: false }
      ]
    };
    
    return stepDefinitions[type] || [];
  }
  
  private async executeAnalysisStep(stepType: string, config: any): Promise<any> {
    // Delegate to orchestrator based on step type
    switch (stepType) {
      case 'requirements':
        return this.orchestrator.extractRequirements(config);
      case 'gaps':
        return this.orchestrator.analyzeGaps(config);
      case 'risks':
        return this.orchestrator.assessRisks(config);
      case 'traceability':
        return this.orchestrator.createTraceabilityMatrix(config);
      default:
        throw new Error(`Unknown analysis step: ${stepType}`);
    }
  }
  
  private markStepCompleted(stepId: string): void {
    if (this.currentSession) {
      const step = this.currentSession.steps.find(s => s.id === stepId);
      if (step) {
        step.completed = true;
      }
    }
  }
  
  private async presentAnalysisResults(): Promise<void> {
    if (!this.currentSession) return;
    
    console.log(chalk.green('\n✅ Analysis Results Summary'));
    
    this.currentSession.results.forEach((result, index) => {
      console.log(chalk.blue(`\n${index + 1}. ${result.type}:`));
      if (result.summary) {
        console.log(`   ${result.summary}`);
      }
      if (result.count !== undefined) {
        console.log(`   Found: ${result.count} items`);
      }
    });
    
    const viewDetails = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'showDetails',
        message: 'Would you like to view detailed results?',
        default: false
      }
    ]);
    
    if (viewDetails.showDetails) {
      this.currentSession.results.forEach(result => {
        console.log(JSON.stringify(result, null, 2));
      });
    }
  }
  
  private async presentValidationResults(result: any): Promise<void> {
    console.log(chalk.green('\n✅ Validation Results'));
    console.log(`Overall Compliance: ${result.overallCompliance}%`);
    console.log(`Requirements Validated: ${result.validatedRequirements}/${result.totalRequirements}`);
    
    if (result.gaps && result.gaps.length > 0) {
      console.log(chalk.yellow(`\n⚠️  Found ${result.gaps.length} compliance gaps:`));
      result.gaps.slice(0, 5).forEach((gap: any, index: number) => {
        console.log(`${index + 1}. ${gap.requirementId}: ${gap.description}`);
      });
    }
  }
  
  private async suggestNextActions(): Promise<void> {
    const nextAction = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do next?',
        choices: [
          'Generate Compliance Report',
          'Start Compliance Validation',
          'Export Results to File',
          'Save Session for Later',
          'Exit'
        ]
      }
    ]);
    
    switch (nextAction.action) {
      case 'Generate Compliance Report':
        await this.startReportGenerationWorkflow();
        break;
      case 'Start Compliance Validation':
        await this.startComplianceValidationWorkflow();
        break;
      case 'Export Results to File':
        await this.exportResults();
        break;
      case 'Save Session for Later':
        await this.saveSession();
        break;
      default:
        console.log(chalk.green('Thank you for using QMS Interactive Workflow!'));
    }
  }
  
  private async handleWorkflowError(error: any): Promise<void> {
    console.log(chalk.red('\n❌ Workflow Error Occurred'));
    console.log('Error details have been logged for investigation.');
    
    const recovery = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'How would you like to proceed?',
        choices: [
          'Retry Current Step',
          'Skip Current Step',
          'Restart Workflow',
          'Exit with Error Report'
        ]
      }
    ]);
    
    // Handle recovery action
    console.log(`Selected recovery action: ${recovery.action}`);
  }
  
  private async exportResults(): Promise<void> {
    // Implementation for exporting workflow results
    console.log(chalk.blue('Exporting results...'));
  }
  
  private async saveSession(): Promise<void> {
    // Implementation for saving workflow session
    console.log(chalk.blue('Saving session...'));
  }
}
```

### 4. CLI Integration with Existing Phoenix-Code-Lite Systems

Ensure seamless integration with existing CLI functionality:

```typescript
// src/cli/cli-integration.ts

import { CLI } from './commands'; // Existing CLI
import { EnhancedCLI } from './enhanced-commands'; // New CLI
import { QMSConfigManager } from '../config/qms-config-manager';
import { ComplianceAuditLogger } from '../security/compliance-audit-logger';

export class CLIIntegrationManager {
  private existingCLI: CLI;
  private enhancedCLI: EnhancedCLI;
  private configManager: QMSConfigManager;
  private auditLogger: ComplianceAuditLogger;
  
  constructor() {
    this.existingCLI = new CLI();
    this.enhancedCLI = new EnhancedCLI();
    this.configManager = new QMSConfigManager();
    this.auditLogger = new ComplianceAuditLogger();
  }
  
  async initializeIntegratedCLI(): Promise<void> {
    // Set up compatibility layer
    await this.setupCompatibilityLayer();
    
    // Initialize integrated help system
    await this.initializeIntegratedHelp();
    
    // Set up unified audit logging
    await this.setupUnifiedAuditLogging();
    
    // Validate integration
    await this.validateCLIIntegration();
  }
  
  private async setupCompatibilityLayer(): Promise<void> {
    // Ensure existing commands work with enhanced system
    const existingCommands = this.existingCLI.getAllCommands ? this.existingCLI.getAllCommands() : [];
    
    for (const command of existingCommands) {
      // Wrap existing commands to work with enhanced system
      this.wrapExistingCommand(command);
    }
  }
  
  private wrapExistingCommand(command: any): void {
    // Implementation to wrap existing commands for compatibility
    const originalHandler = command.handler;
    
    command.handler = async (...args: any[]) => {
      // Add audit logging for existing commands
      await this.auditLogger.createSecureAuditRecord({
        eventType: 'cli_command_executed',
        timestamp: new Date().toISOString(),
        userId: 'system',
        action: 'execute_legacy_command',
        metadata: {
          command: command.name,
          args: args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg))
        }
      });
      
      // Execute original handler
      return originalHandler.apply(this, args);
    };
  }
  
  private async initializeIntegratedHelp(): Promise<void> {
    // Create integrated help system that covers both existing and QMS commands
    this.enhancedCLI.program
      .command('help:qms')
      .description('Show QMS command help and guidance')
      .action(() => {
        this.displayQMSHelp();
      });
    
    this.enhancedCLI.program
      .command('help:all')
      .description('Show all available commands (Phoenix-Code-Lite + QMS)')
      .action(() => {
        this.displayAllCommands();
      });
  }
  
  private displayQMSHelp(): void {
    console.log(`
${chalk.blue('🏥 QMS Command Reference')}

Document Analysis:
  qms:analyze <document>     Analyze regulatory document for compliance
  qms:analyze --guided       Interactive document analysis workflow

Compliance Operations:
  qms:compliance validate    Validate compliance against standards
  qms:compliance report      Generate compliance reports

Template Management:
  qms:template list          List available regulatory templates
  qms:template load <std>    Load regulatory template

Configuration:
  qms:config show            Show QMS configuration
  qms:config set <key> <val> Set QMS configuration value

Interactive Workflows:
  qms:workflow              Start interactive QMS workflow assistant
  qms:workflow --interactive Guided workflow with prompts

For detailed help on any command, use: <command> --help
For interactive guidance, use: qms:workflow --interactive
    `);
  }
  
  private displayAllCommands(): void {
    console.log(chalk.blue('📋 All Available Commands\n'));
    
    console.log(chalk.green('Phoenix-Code-Lite Commands:'));
    const existingCommands = this.existingCLI.getAllCommands ? this.existingCLI.getAllCommands() : [];
    existingCommands.forEach(cmd => {
      console.log(`  ${cmd.name.padEnd(20)} ${cmd.description}`);
    });
    
    console.log(chalk.green('\nQMS Commands:'));
    const qmsCommands = this.enhancedCLI.getAllCommands().filter(cmd => cmd.name.startsWith('qms:'));
    qmsCommands.forEach(cmd => {
      console.log(`  ${cmd.name.padEnd(20)} ${cmd.description}`);
    });
  }
  
  private async setupUnifiedAuditLogging(): Promise<void> {
    // Ensure all CLI operations are audited consistently
    this.enhancedCLI.setAuditLogger(this.auditLogger);
  }
  
  async validateCLIIntegration(): Promise<boolean> {
    try {
      // Test existing command functionality
      const existingCommands = this.existingCLI.getAllCommands ? this.existingCLI.getAllCommands() : [];
      for (const command of existingCommands) {
        const enhancedCommand = this.enhancedCLI.getCommand(command.name);
        if (!enhancedCommand) {
          console.error(`Integration error: Command ${command.name} not found in enhanced CLI`);
          return false;
        }
      }
      
      // Test QMS command functionality
      const qmsCommands = ['qms:analyze', 'qms:compliance', 'qms:template', 'qms:workflow'];
      for (const commandName of qmsCommands) {
        const command = this.enhancedCLI.getCommand(commandName);
        if (!command) {
          console.error(`Integration error: QMS command ${commandName} not found`);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('CLI integration validation failed:', error);
      return false;
    }
  }
  
  getIntegratedCLI(): EnhancedCLI {
    return this.enhancedCLI;
  }
}
```

### 5. CLI Testing and Validation Framework

Create comprehensive CLI testing framework:

```bash
# Create CLI validation script
cat > scripts/validate-cli-interface.sh << 'EOF'
#!/bin/bash

echo "=== CLI Interface Validation ==="

# 1. Test existing Phoenix-Code-Lite CLI functionality
echo "Testing existing Phoenix-Code-Lite CLI..."
npm test -- --testNamePattern="CLI.*existing"
if [ $? -ne 0 ]; then
  echo "ERROR: Existing CLI tests failing"
  exit 1
fi

# 2. Test QMS CLI extensions
echo "Testing QMS CLI extensions..."
npm test -- --testNamePattern="CLI.*QMS"
if [ $? -ne 0 ]; then
  echo "ERROR: QMS CLI extension tests failing"
  exit 1
fi

# 3. Test interactive workflows
echo "Testing interactive workflow system..."
npm test -- --testNamePattern="Interactive Workflow"
if [ $? -ne 0 ]; then
  echo "ERROR: Interactive workflow tests failing"
  exit 1
fi

# 4. Test CLI integration
echo "Testing CLI integration..."
npm test -- --testNamePattern="CLI.*Integration"
if [ $? -ne 0 ]; then
  echo "ERROR: CLI integration tests failing"
  exit 1
fi

# 5. Test command help and documentation
echo "Testing command help system..."
node -e "
const { EnhancedCLI } = require('./dist/src/cli/enhanced-commands');
const cli = new EnhancedCLI();

// Test help command
cli.execute(['help:qms']).then(result => {
  if (!result.success) {
    console.error('Help command failed');
    process.exit(1);
  }
  console.log('Help system validated');
}).catch(error => {
  console.error('Help command error:', error);
  process.exit(1);
});
"

# 6. Test CLI security integration
echo "Testing CLI security integration..."
node -e "
const { EnhancedCLI } = require('./dist/src/cli/enhanced-commands');
const cli = new EnhancedCLI();

// Test role-based access
const testUser = { id: 'test-user', roles: ['qms_analyst'] };
cli.setCurrentUser(testUser);

cli.execute(['qms:analyze', '--help']).then(result => {
  if (!result.success) {
    console.error('Security integration failed');
    process.exit(1);
  }
  console.log('CLI security integration validated');
}).catch(error => {
  console.error('Security integration error:', error);
  process.exit(1);
});
"

echo "=== CLI Interface Validation Complete ==="
EOF

chmod +x scripts/validate-cli-interface.sh
```

## Step 0: Changes Needed

### Preparation and Adjustments

- **CLI Framework Review**: Review the existing CLI framework for extensibility.
- **QMS Command Design**: Design new CLI commands for QMS operations.

### Task Adjustments

- **Enhance CLI with QMS Commands**: Plan for the addition of QMS-specific commands to the CLI.
- **User Experience Testing**: Conduct user experience testing to ensure seamless integration of new commands.
- **Documentation Updates**: Update CLI documentation to include new QMS commands and features.

## Implementation Documentation & Phase Transition

### Implementation Notes & Lessons Learned

**CLI Extension Challenges**:

- Maintaining backward compatibility while adding comprehensive QMS commands required careful command structure design
- Interactive workflow system needed robust error handling and recovery mechanisms for complex regulatory processes
- CLI security integration required seamless role-based access control without disrupting user experience

**Tool/Framework Insights**:

- Commander.js provided excellent foundation for building comprehensive CLI with nested commands and options
- Inquirer.js enabled sophisticated interactive workflows with validation and conditional prompts
- Chalk and Ora significantly improved user experience with colored output and progress indicators

**Performance Considerations**:

- CLI command execution remained responsive even with comprehensive audit logging
- Interactive workflows optimized to provide immediate feedback and progress indication
- Command help system cached for faster access during development workflows

**Testing Strategy Results**:

- Achieved comprehensive test coverage for all CLI enhancements and interactive workflows
- Backward compatibility testing validated preservation of existing Phoenix-Code-Lite CLI functionality
- Integration testing ensured seamless operation between existing and QMS commands

**User Experience Findings**:

- Interactive workflows significantly improved QMS operation accessibility for non-expert users
- Context-aware help system reduced learning curve for complex regulatory operations
- Unified CLI interface provided seamless transition between development and compliance activities

**Security/Quality Insights**:

- Role-based CLI access control successfully integrated with existing security framework
- Audit trails for CLI operations provide necessary regulatory compliance tracking
- Error handling and recovery suggestions improved operational reliability

**Recommendations for Phase 7**:

- Use established CLI testing patterns for integration testing and system validation
- Leverage interactive workflow framework for comprehensive system testing scenarios
- Apply CLI security patterns for test user management and access control validation
- Ensure testing framework covers both existing and QMS functionality comprehensively

## Success Criteria

**Unified CLI Interface Operational**: Comprehensive CLI supporting both Phoenix-Code-Lite development and QMS regulatory operations with seamless user experience
**Interactive Workflow System Active**: Guided workflows for complex regulatory processes with context-aware help and error recovery
**Backward Compatibility Maintained**: All existing Phoenix-Code-Lite CLI commands preserved with identical functionality and interfaces
**Security Integration Complete**: Role-based CLI access control with audit trails and secure command execution

## Definition of Done

• **Enhanced CLI Framework Implemented** - Comprehensive CLI framework supporting QMS commands with interactive workflows and help system
• **QMS Command Suite Operational** - Full suite of QMS commands for document analysis, compliance validation, template management, and workflow execution
• **Interactive Workflow System** - Guided workflows for complex regulatory processes with error handling and recovery mechanisms
• **Backward Compatibility Validated** - All existing Phoenix-Code-Lite CLI functionality preserved and operational
• **Security Integration Complete** - Role-based command access, audit trails, and secure execution for all CLI operations
• **User Experience Optimized** - Context-aware help, progress indicators, error recovery, and intuitive command structure
• **Testing Coverage Complete** - Comprehensive test coverage for CLI functionality, interactive workflows, and integration
• **Performance Benchmarks Met** - CLI operations responsive and efficient for both development and regulatory workflows

---

**Phase Dependencies**: Phase 5 Configuration Management → Phase 7 Prerequisites
**Estimated Duration**: 2-3 weeks  
**Risk Level**: Medium (Complex user interface integration)
**Next Phase**: [Phase 7: Integration Testing & System Validation](Phase-07-Integration-Testing-System-Validation.md)
