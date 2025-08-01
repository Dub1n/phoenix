import { ClaudeCodeClient } from '../claude/client';
import { PlanTestPhase } from './phases/plan-test';
import { ImplementFixPhase } from './phases/implement-fix';
import { RefactorDocumentPhase } from './phases/refactor-document';
import { QualityGateManager, QualityGateReport } from './quality-gates';
import { CodebaseScanner, CodebaseScanResult } from './codebase-scanner';
import { TaskContext, WorkflowResult, PhaseResult } from '../types/workflow';

export class TDDOrchestrator {
  private claudeClient: ClaudeCodeClient;
  private planTestPhase: PlanTestPhase;
  private implementFixPhase: ImplementFixPhase;
  private refactorDocumentPhase: RefactorDocumentPhase;
  private qualityGateManager: QualityGateManager;
  private codebaseScanner: CodebaseScanner;
  
  constructor(claudeClient: ClaudeCodeClient) {
    this.claudeClient = claudeClient;
    this.planTestPhase = new PlanTestPhase(claudeClient);
    this.implementFixPhase = new ImplementFixPhase(claudeClient);
    this.refactorDocumentPhase = new RefactorDocumentPhase(claudeClient);
    this.qualityGateManager = new QualityGateManager();
    this.codebaseScanner = new CodebaseScanner(claudeClient);
  }
  
  async executeWorkflow(taskDescription: string, context: TaskContext): Promise<WorkflowResult> {
    const workflow: WorkflowResult = {
      taskDescription,
      startTime: new Date(),
      phases: [],
      success: false,
      artifacts: [],
    };
    
    const qualityReports: QualityGateReport[] = [];
    let codebaseScanResult: CodebaseScanResult;
    
    try {
      // Phase 0: MANDATORY Codebase Scan (Anti-Reimplementation)
      console.log('🔍 PHASE 0: Mandatory codebase scan to prevent reimplementation...');
      codebaseScanResult = await this.codebaseScanner.scanCodebase(taskDescription, context);
      
      // Validate scan completion and agent acknowledgment
      if (!this.validateScanAcknowledgment(codebaseScanResult)) {
        throw new Error('CRITICAL: Agent must acknowledge codebase scan results before proceeding');
      }
      
      // Add scan results to workflow metadata
      workflow.metadata = { 
        codebaseScan: codebaseScanResult,
        ...workflow.metadata 
      };
      
      // Phase 1: Plan & Test with Quality Gates (Enhanced with Scan Results)
      console.log('📋 PHASE 1: Planning and generating tests...');
      const enhancedContext = { 
        ...context, 
        codebaseScan: codebaseScanResult 
      };
      const planResult = await this.planTestPhase.execute(taskDescription, enhancedContext);
      
      // Run quality gates on planning phase
      const planQualityReport = await this.qualityGateManager.runQualityGates(
        { files: [], testFiles: planResult.artifacts },
        context,
        'plan-test'
      );
      qualityReports.push(planQualityReport);
      
      if (!planQualityReport.overallPassed) {
        console.log('⚠  Quality gates failed for planning phase');
        planResult.metadata = { ...planResult.metadata, qualityReport: planQualityReport };
      }
      
      workflow.phases.push(planResult);
      
      if (!planResult.success) {
        throw new Error(`Planning phase failed: ${planResult.error}`);
      }
      
      // Phase 2: Implement & Fix with Quality Gates (Enhanced with Scan Results)
      console.log('⚡ PHASE 2: Implementing code to pass tests...');
      const implementResult = await this.implementFixPhase.execute(planResult, enhancedContext);
      
      // Run quality gates on implementation
      const implementationArtifact = await this.gatherImplementationArtifacts(context);
      const implementQualityReport = await this.qualityGateManager.runQualityGates(
        implementationArtifact,
        context,
        'implement-fix'
      );
      qualityReports.push(implementQualityReport);
      
      // Apply quality gate feedback
      if (!implementQualityReport.overallPassed) {
        console.log('⚠  Quality gates detected issues, attempting improvements...');
        await this.applyQualityImprovements(implementQualityReport, context);
      }
      
      implementResult.metadata = { ...implementResult.metadata, qualityReport: implementQualityReport };
      workflow.phases.push(implementResult);
      
      if (!implementResult.success) {
        throw new Error(`Implementation phase failed: ${implementResult.error}`);
      }
      
      // Phase 3: Refactor & Document with Final Quality Gates (Enhanced with Scan Results)
      console.log('✨ PHASE 3: Refactoring and documenting code...');
      const refactorResult = await this.refactorDocumentPhase.execute(implementResult, enhancedContext);
      
      // Final quality assessment
      const finalArtifact = await this.gatherFinalArtifacts(context);
      const finalQualityReport = await this.qualityGateManager.runQualityGates(
        finalArtifact,
        context,
        'refactor-document'
      );
      qualityReports.push(finalQualityReport);
      
      refactorResult.metadata = { ...refactorResult.metadata, qualityReport: finalQualityReport };
      workflow.phases.push(refactorResult);
      
      // Overall success depends on final phase and quality gates
      workflow.success = refactorResult.success && finalQualityReport.overallPassed;
      workflow.endTime = new Date();
      workflow.duration = workflow.endTime.getTime() - workflow.startTime.getTime();
      
      // Add quality summary to workflow
      workflow.metadata = {
        qualityReports,
        overallQualityScore: this.calculateOverallQualityScore(qualityReports),
        qualitySummary: this.generateQualitySummary(qualityReports),
        ...workflow.metadata,
      };
      
      // Display quality summary
      this.displayQualitySummary(qualityReports);
      
      return workflow;
      
    } catch (error) {
      workflow.success = false;
      workflow.error = error instanceof Error ? error.message : 'Unknown error';
      workflow.endTime = new Date();
      workflow.metadata = { qualityReports, ...workflow.metadata };
      return workflow;
    }
  }
  
  private async gatherImplementationArtifacts(context: TaskContext): Promise<any> {
    // Placeholder for gathering implementation files via Claude Code
    return {
      files: [{ path: 'src/main.ts', content: '// Implementation placeholder' }],
      testFiles: [{ path: 'tests/main.test.ts', content: '// Test placeholder' }],
      metadata: { fileCount: 1, testCount: 1 },
    };
  }
  
  private async gatherFinalArtifacts(context: TaskContext): Promise<any> {
    // Placeholder for gathering all project files via Claude Code
    return {
      files: [
        { path: 'src/main.ts', content: '// Final implementation' },
        { path: 'docs/README.md', content: '# Documentation' }
      ],
      testFiles: [{ path: 'tests/main.test.ts', content: '// Final tests' }],
      metadata: { totalFiles: 2, hasDocumentation: true, hasTests: true },
    };
  }
  
  private async applyQualityImprovements(report: QualityGateReport, context: TaskContext): Promise<void> {
    if (report.recommendations.length > 0) {
      console.log('🔧 Applying quality improvements...');
      
      const improvementPrompt = [
        'Based on the quality analysis, please apply the following improvements:',
        ...report.recommendations.map(rec => `- ${rec}`),
        '',
        'Focus on:',
        '- Fixing syntax issues',
        '- Improving test coverage',
        '- Adding necessary documentation',
        '- Optimizing code structure'
      ].join('\n');
      
      try {
        await this.claudeClient.query(improvementPrompt, context);
      } catch (error) {
        console.log('⚠  Quality improvement failed:', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }
  
  private calculateOverallQualityScore(reports: QualityGateReport[]): number {
    if (reports.length === 0) return 0;
    
    const totalScore = reports.reduce((sum, report) => sum + report.overallScore, 0);
    return totalScore / reports.length;
  }
  
  private generateQualitySummary(reports: QualityGateReport[]): string {
    const overallScore = this.calculateOverallQualityScore(reports);
    const passedGates = reports.filter(r => r.overallPassed).length;
    const totalGates = reports.length;
    
    return `Quality Score: ${(overallScore * 100).toFixed(1)}% | Gates Passed: ${passedGates}/${totalGates}`;
  }
  
  private displayQualitySummary(reports: QualityGateReport[]): void {
    console.log('\n◊ Quality Assessment Summary:');
    console.log('═══════════════════════════════');
    
    reports.forEach((report, index) => {
      const icon = report.overallPassed ? '✓' : '⚠';
      const score = (report.overallScore * 100).toFixed(1);
      
      console.log(`${icon} Phase ${index + 1} (${report.phase}): ${score}%`);
      
      if (report.recommendations.length > 0) {
        console.log(`   Recommendations: ${report.recommendations.length}`);
      }
    });
    
    const overallScore = this.calculateOverallQualityScore(reports);
    console.log(`\n○ Overall Quality Score: ${(overallScore * 100).toFixed(1)}%`);
  }
  
  private validateScanAcknowledgment(scanResult: CodebaseScanResult): boolean {
    // CRITICAL: This method ensures the agent acknowledges scan results
    // before proceeding with implementation
    
    console.log('\n🎯 MANDATORY VALIDATION: Codebase scan acknowledgment required');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Before proceeding with implementation, the agent must acknowledge:');
    console.log(`• Scan found ${scanResult.relevantAssets.length} relevant existing assets`);
    console.log(`• ${scanResult.reuseOpportunities.length} reuse opportunities identified`);
    console.log(`• ${scanResult.conflictRisks.length} potential conflicts detected`);
    
    if (scanResult.conflictRisks.length > 0) {
      console.log('\n⚠ CRITICAL CONFLICTS DETECTED:');
      scanResult.conflictRisks.forEach(conflict => {
        console.log(`   • ${conflict.type}: ${conflict.name} (${conflict.filePath}:${conflict.lineNumber})`);
      });
      console.log('\nAgent must explicitly address these conflicts in implementation plan.');
    }
    
    if (scanResult.reuseOpportunities.length > 0) {
      console.log('\n⇔ REUSE OPPORTUNITIES:');
      scanResult.reuseOpportunities.forEach(opportunity => {
        console.log(`   • Consider reusing: ${opportunity.name} (${opportunity.filePath}:${opportunity.lineNumber})`);
      });
    }
    
    console.log('\n📋 MANDATORY REQUIREMENTS:');
    console.log('• Agent must review all scan results above');
    console.log('• Agent must modify implementation plan to avoid reimplementation');
    console.log('• Agent must explicitly address conflicts and leverage reuse opportunities');
    console.log('• Agent must acknowledge understanding of existing codebase architecture');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // In production, this would include interactive validation
    // For now, we log requirements and assume acknowledgment
    return true;
  }
}