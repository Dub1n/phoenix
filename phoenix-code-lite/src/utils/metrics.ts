/**---
 * title: [Metrics Collector - Workflow Metrics]
 * tags: [Utility, Metrics]
 * provides: [MetricsCollector Class, Metrics Aggregation]
 * requires: []
 * description: [Collects and aggregates workflow metrics such as duration, phase counts, and success rates.]
 * ---*/

import { promises as fs } from 'fs';
import { join } from 'path';
import { WorkflowResult } from '../types/workflow';

export interface WorkflowMetrics {
  totalWorkflows: number;
  successfulWorkflows: number;
  failedWorkflows: number;
  successRate: number;
  averageDuration: number;
  totalTokensUsed: number;
  averageQualityScore: number;
}

export interface AnalyticsReport {
  timeRange: {
    start: Date;
    end: Date;
  };
  totalWorkflows: number;
  successRate: number;
  averageDuration: number;
  phaseMetrics: {
    [phaseName: string]: {
      successRate: number;
      averageDuration: number;
      failureReasons: string[];
    };
  };
  qualityTrends: {
    averageScore: number;
    trendDirection: 'up' | 'down' | 'stable';
  };
  recommendations: string[];
}

export class MetricsCollector {
  private metricsPath: string;
  
  constructor(basePath?: string) {
    this.metricsPath = join(basePath || process.cwd(), '.phoenix-code-lite', 'metrics');
  }
  
  async recordWorkflow(result: WorkflowResult): Promise<void> {
    try {
      await fs.mkdir(this.metricsPath, { recursive: true });
      
      const filename = `workflow-${Date.now()}.json`;
      const filepath = join(this.metricsPath, filename);
      
      const metrics = {
        timestamp: new Date(),
        taskDescription: result.taskDescription,
        success: result.success,
        duration: result.duration,
        phases: result.phases.length,
        qualityScore: (result.metadata as any)?.overallQualityScore,
        tokenUsage: this.extractTokenUsage(result),
        error: result.error,
      };
      
      await fs.writeFile(filepath, JSON.stringify(metrics, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to record workflow metrics:', error);
    }
  }
  
  async getWorkflowMetrics(): Promise<WorkflowMetrics> {
    const workflowData = await this.loadWorkflowData();
    
    const totalWorkflows = workflowData.length;
    const successfulWorkflows = workflowData.filter(w => w.success).length;
    const failedWorkflows = totalWorkflows - successfulWorkflows;
    const successRate = totalWorkflows > 0 ? successfulWorkflows / totalWorkflows : 0;
    
    const totalDuration = workflowData.reduce((sum, w) => sum + (w.duration || 0), 0);
    const averageDuration = totalWorkflows > 0 ? totalDuration / totalWorkflows : 0;
    
    const totalTokens = workflowData.reduce((sum, w) => sum + (w.tokenUsage?.total || 0), 0);
    
    const qualityScores = workflowData.filter(w => w.qualityScore != null).map(w => w.qualityScore);
    const averageQualityScore = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 0;
    
    return {
      totalWorkflows,
      successfulWorkflows,
      failedWorkflows,
      successRate,
      averageDuration,
      totalTokensUsed: totalTokens,
      averageQualityScore,
    };
  }
  
  async generateAnalyticsReport(daysBack: number = 30): Promise<AnalyticsReport> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (daysBack * 24 * 60 * 60 * 1000));
    
    const workflowData = await this.loadWorkflowData();
    const filteredData = workflowData.filter(w => 
      new Date(w.timestamp) >= startDate && new Date(w.timestamp) <= endDate
    );
    
    const metrics = await this.calculateMetricsForData(filteredData);
    
    return {
      timeRange: { start: startDate, end: endDate },
      totalWorkflows: filteredData.length,
      successRate: metrics.successRate,
      averageDuration: metrics.averageDuration,
      phaseMetrics: await this.calculatePhaseMetrics(filteredData),
      qualityTrends: await this.calculateQualityTrends(filteredData),
      recommendations: this.generateRecommendations(metrics),
    };
  }
  
  async exportMetrics(format: 'json' | 'csv' = 'json'): Promise<string> {
    const workflowData = await this.loadWorkflowData();
    
    if (format === 'csv') {
      const headers = ['timestamp', 'taskDescription', 'success', 'duration', 'phases', 'qualityScore', 'error'];
      const csvRows = [
        headers.join(','),
        ...workflowData.map(w => [
          w.timestamp,
          `"${w.taskDescription.replace(/"/g, '""')}"`,
          w.success,
          w.duration || 0,
          w.phases || 0,
          w.qualityScore || 0,
          `"${(w.error || '').replace(/"/g, '""')}"`,
        ].join(','))
      ];
      
      return csvRows.join('\n');
    }
    
    return JSON.stringify(workflowData, null, 2);
  }
  
  private async loadWorkflowData(): Promise<any[]> {
    try {
      const files = await fs.readdir(this.metricsPath);
      const workflowFiles = files.filter(f => f.startsWith('workflow-') && f.endsWith('.json'));
      
      const data = [];
      for (const file of workflowFiles) {
        try {
          const content = await fs.readFile(join(this.metricsPath, file), 'utf-8');
          const workflow = JSON.parse(content);
          data.push(workflow);
        } catch (error) {
          console.error(`Failed to load workflow file ${file}:`, error);
        }
      }
      
      return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      return [];
    }
  }
  
  private async calculateMetricsForData(data: any[]): Promise<WorkflowMetrics> {
    const totalWorkflows = data.length;
    const successfulWorkflows = data.filter(w => w.success).length;
    const successRate = totalWorkflows > 0 ? successfulWorkflows / totalWorkflows : 0;
    
    const totalDuration = data.reduce((sum, w) => sum + (w.duration || 0), 0);
    const averageDuration = totalWorkflows > 0 ? totalDuration / totalWorkflows : 0;
    
    const qualityScores = data.filter(w => w.qualityScore != null).map(w => w.qualityScore);
    const averageQualityScore = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 0;
    
    return {
      totalWorkflows,
      successfulWorkflows,
      failedWorkflows: totalWorkflows - successfulWorkflows,
      successRate,
      averageDuration,
      totalTokensUsed: 0, // Would calculate from token usage data
      averageQualityScore,
    };
  }
  
  private async calculatePhaseMetrics(data: any[]): Promise<any> {
    // Placeholder for phase-specific metrics
    return {
      'plan-test': { successRate: 0.95, averageDuration: 5000, failureReasons: [] },
      'implement-fix': { successRate: 0.85, averageDuration: 15000, failureReasons: ['test failures'] },
      'refactor-document': { successRate: 0.92, averageDuration: 8000, failureReasons: [] },
    };
  }
  
  private async calculateQualityTrends(data: any[]): Promise<any> {
    const qualityScores = data.filter(w => w.qualityScore != null).map(w => w.qualityScore);
    const averageScore = qualityScores.length > 0 
      ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
      : 0;
    
    return {
      averageScore,
      trendDirection: 'stable' as const,
    };
  }
  
  private generateRecommendations(metrics: WorkflowMetrics): string[] {
    const recommendations = [];
    
    if (metrics.successRate < 0.8) {
      recommendations.push('Consider reviewing failed workflow patterns to improve success rate');
    }
    
    if (metrics.averageDuration > 30000) {
      recommendations.push('Workflows are taking longer than expected - consider performance optimizations');
    }
    
    if (metrics.averageQualityScore < 0.7) {
      recommendations.push('Quality scores are below target - review quality gate thresholds');
    }
    
    return recommendations;
  }
  
  private extractTokenUsage(result: WorkflowResult): any {
    // Extract token usage from workflow metadata
    return (result.metadata as any)?.tokenUsage || { total: 0 };
  }
}
