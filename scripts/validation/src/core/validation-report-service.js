import fs from 'fs';
import path from 'path';

// Handles report directory validation and Markdown generation for validation runs
export class ValidationReportService {
  validateReportDirectories(projectConfig, projectInfo) {
    const issues = [];

    if (projectConfig.report_location) {
      let reportPath = projectConfig.report_location;
      if (!path.isAbsolute(reportPath)) {
        reportPath = path.resolve(projectInfo.path, reportPath);
      }

      if (!fs.existsSync(reportPath)) {
        issues.push(`Report directory does not exist: ${reportPath}`);
      } else {
        try {
          const testFile = path.join(reportPath, '.write-test');
          fs.writeFileSync(testFile, 'test');
          fs.unlinkSync(testFile);
        } catch (error) {
          issues.push(`Report directory not writable: ${reportPath}`);
        }
      }
    }

    return issues;
  }

  async generateValidationReport(result, projectInfo, category, projectConfig) {
    try {
      const reportPath = this.resolveReportPath(projectInfo, category, projectConfig, result.taskId);
      const reportContent = this.formatValidationReport(result, projectInfo, category);
      fs.writeFileSync(reportPath, reportContent, 'utf8');
      console.log(`[x] Validation report generated: ${reportPath}`);
      return reportPath;
    } catch (error) {
      console.error(`[F] Failed to generate validation report: ${error.message}`);
      throw error;
    }
  }

  resolveReportPath(projectInfo, category, projectConfig, taskId = 'UNKNOWN') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `${timestamp}-${taskId}-${category}-validation-report.md`;

    let reportDir = projectConfig.report_location || 'validation-reports';
    if (!path.isAbsolute(reportDir)) {
      reportDir = path.resolve(projectInfo.path, reportDir);
    }

    return path.join(reportDir, filename);
  }

  formatValidationReport(result, projectInfo, category) {
    const timestamp = new Date().toISOString();
    const statusMap = {
      'PASS': 'VALIDATION_PASSED',
      'WARN': 'VALIDATION_PASSED_WITH_WARNINGS',
      'FAIL': 'VALIDATION_FAILED'
    };

    const frontmatter = `---
author: validation-system
source: validation-system
validation_type: ${category}
category: ${category}
priority: medium
complexity: TBD
components: [validation-generated]
initial_status: [~]
end_status: [${result.status === 'PASS' ? 'P' : result.status === 'FAIL' ? 'F' : 'W'}]
tags: ${category}, validation, automated-testing
---

# Validation Report - ${result.taskId || 'UNKNOWN'} - ${timestamp.replace(/[:.]/g, '-').slice(0, 16)}

## Validation Category: ${this.getCategoryDescription(category)}

**Overall Status**: ${statusMap[result.status] || result.status}
**Execution Time**: ${result.duration}ms
**Tests Executed**: ${result.tests.length}

## Tests Executed

${this.formatTestResults(result.tests)}

## Evidence Collected

${this.formatEvidence(result.evidence)}

## Test Results Detail

${this.formatTestResultsDetail(result.tests)}

${result.errors.length > 0 ? `## Errors

${this.formatErrors(result.errors)}
` : ''}
${result.warnings.length > 0 ? `## Warnings

${this.formatWarnings(result.warnings)}
` : ''}

## Summary

- **Project**: ${projectInfo.name}
- **Category**: ${category}
- **Status**: ${result.status}
- **Duration**: ${result.duration}ms
- **Timestamp**: ${timestamp}
- **Tests Passed**: ${result.tests.filter(t => t.status === 'PASS').length}
- **Tests Failed**: ${result.tests.filter(t => t.status === 'FAIL').length}
- **Tests Warned**: ${result.tests.filter(t => t.status === 'WARN').length}
`;

    return frontmatter;
  }

  getCategoryDescription(category) {
    const descriptions = {
      'build': 'Compilation/Build Tasks',
      'quality': 'Code Quality Assessment',
      'architecture': 'Architecture Validation',
      'backend': 'Backend/Service Tasks',
      'feature': 'Feature Implementation',
      'core': 'Core System Validation',
      'ui': 'User Interface Testing',
      'lint': 'Code Linting and Style'
    };
    return descriptions[category] || `${category} Validation`;
  }

  formatTestResults(tests) {
    return tests.map(test => {
      const icon = test.status === 'PASS' ? '[x]' : test.status === 'FAIL' ? '[F]' : '[!]';
      return `- [ ] ${test.name} - ${icon} ${test.status}`;
    }).join('\n');
  }

  formatEvidence(evidence) {
    if (!evidence || evidence.length === 0) {
      return 'No evidence collected';
    }

    return evidence.map((item, index) => `${index + 1}. ${item}`).join('\n');
  }

  formatTestResultsDetail(tests) {
    return tests.map(test => {
      const evidenceDetail = this.formatTestEvidenceDetail(test);
      return `### ${test.name}

**Status**: ${test.status}
**Message**: ${test.message || 'N/A'}
${evidenceDetail}
`;
    }).join('\n');
  }

  formatTestEvidenceDetail(test) {
    if (Array.isArray(test.fileFindings) && test.fileFindings.length > 0) {
      const formatted = test.fileFindings.map(finding => {
        const metricsPart = finding.metrics && Object.keys(finding.metrics).length > 0
          ? ` (${Object.entries(finding.metrics)
              .map(([key, value]) => `${key}:${value}`)
              .join(', ')})`
          : '';
        const summaryPart = finding.summary ? ` - ${finding.summary}` : '';
        const header = `- ${finding.file}${metricsPart}${summaryPart}`;
        const detailLines = Array.isArray(finding.findings) && finding.findings.length > 0
          ? finding.findings.map(item => {
              const linesPart = item.lines && item.lines.length > 0 ? ` [lines ${item.lines.join(', ')}]` : '';
              const base = `${item.message}${linesPart}`;
              const recommendationPart = item.recommendation ? ` Recommendation: ${item.recommendation}.` : '';
              const snippetPart = item.snippet ? ` Example: ${item.snippet}` : '';
              return `  - ${base}.${recommendationPart}${snippetPart}`;
            }).join('\n')
          : '';
        return detailLines ? `${header}\n${detailLines}` : header;
      }).join('\n');
      return `**Per-file Findings:**\n${formatted}`;
    }

    if (Array.isArray(test.evidence) && test.evidence.length > 0) {
      return `**Evidence**: ${test.evidence.join(', ')}`;
    }

    return '**Evidence**: N/A';
  }

  formatErrors(errors) {
    return errors.map(error => `- ${error}`).join('\n');
  }

  formatWarnings(warnings) {
    return warnings.map(warning => `- ${warning}`).join('\n');
  }
}
