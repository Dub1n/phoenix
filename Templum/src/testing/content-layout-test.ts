/**
---
date: 2025-09-12T174643Z
name: content-layout-test
TASK-ID:
  - TASK-MCP-006
category: testing
status:
  - "[T]"
patterns:
  - testing-framework
  - terminal-compatibility
components:
  - ContentLayoutTestSuite
dependencies:
  - content-layout-system
  - terminal-ui-components
tags:
  - testing
  - content-layout
  - terminal-compatibility
---
 * 
 * Content Layout System Test Suite
 * 
 * Comprehensive testing for the content rendering and layout management system.
 * Tests terminal compatibility, adaptive formatting, and visual consistency.
 */

import { ContentLayoutSystem, WindowContent, TerminalCapabilities } from '../rendering/content-layout-system';

export interface TestResult {
  testName: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: any;
}

export interface TestSuiteResult {
  suiteName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestResult[];
  duration: number;
}

/**
 * Content Layout Test Suite
 */
export class ContentLayoutTestSuite {
  private contentLayoutSystem: ContentLayoutSystem;

  constructor() {
    this.contentLayoutSystem = new ContentLayoutSystem();
  }

  /**
   * Run all content layout tests
   */
  async runAllTests(): Promise<TestSuiteResult> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    // Test terminal capability detection
    results.push(await this.testTerminalCapabilityDetection());
    
    // Test emoji removal
    results.push(await this.testEmojiRemoval());
    
    // Test content width calculation
    results.push(await this.testContentWidthCalculation());
    
    // Test border rendering
    results.push(await this.testBorderRendering());
    
    // Test adaptive layout
    results.push(await this.testAdaptiveLayout());
    
    // Test terminal compatibility fallbacks
    results.push(await this.testTerminalCompatibilityFallbacks());
    
    // Test visual consistency
    results.push(await this.testVisualConsistency());

    const endTime = Date.now();
    const passedTests = results.filter(r => r.passed).length;
    const failedTests = results.filter(r => !r.passed).length;

    return {
      suiteName: 'Content Layout System',
      totalTests: results.length,
      passedTests,
      failedTests,
      results,
      duration: endTime - startTime
    };
  }

  /**
   * Test terminal capability detection
   */
  private async testTerminalCapabilityDetection(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const compatibility = this.contentLayoutSystem.testTerminalCompatibility();
      
      // Verify required properties exist
      const hasCapabilities = compatibility.capabilities && 
                            typeof compatibility.capabilities.supportsUnicode === 'boolean' &&
                            typeof compatibility.capabilities.supportsBoxDrawing === 'boolean' &&
                            typeof compatibility.capabilities.supportsColor === 'boolean';

      const hasCompatibilityLevel = ['full', 'partial', 'basic'].includes(compatibility.compatibilityLevel);
      const hasRecommendations = Array.isArray(compatibility.recommendations);

      const passed = hasCapabilities && hasCompatibilityLevel && hasRecommendations;

      return {
        testName: 'Terminal Capability Detection',
        passed,
        message: passed ? 'Terminal capabilities detected successfully' : 'Failed to detect terminal capabilities',
        duration: Date.now() - startTime,
        details: compatibility
      };

    } catch (error) {
      return {
        testName: 'Terminal Capability Detection',
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test emoji removal functionality
   */
  private async testEmojiRemoval(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testCases = [
        { input: 'Hello 👋 World 🌍', expected: 'Hello World' },
        { input: 'Status: ✅ Connected', expected: 'Status: [OK] Connected' },
        { input: '🔧 Settings ⚙️ Config', expected: 'Tools Settings Config' },
        { input: 'Search 🔍 results', expected: 'Search Search results' },
        { input: 'No emojis here', expected: 'No emojis here' }
      ];

      let allPassed = true;
      const details: any[] = [];

      for (const testCase of testCases) {
        const result = this.contentLayoutSystem.cleanTextOfEmojis(testCase.input);
        const passed = result.trim() === testCase.expected.trim();
        
        if (!passed) {
          allPassed = false;
        }

        details.push({
          input: testCase.input,
          expected: testCase.expected,
          actual: result,
          passed
        });
      }

      return {
        testName: 'Emoji Removal',
        passed: allPassed,
        message: allPassed ? 'All emoji removal tests passed' : 'Some emoji removal tests failed',
        duration: Date.now() - startTime,
        details
      };

    } catch (error) {
      return {
        testName: 'Emoji Removal',
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test content width calculation
   */
  private async testContentWidthCalculation(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testContent: WindowContent = {
        title: 'Test Menu',
        subtitle: 'This is a subtitle',
        sections: [{
          id: 'main',
          items: [
            { id: '1', label: 'Short item', description: 'Brief description' },
            { id: '2', label: 'Much longer menu item with extended text', description: 'This is a much longer description that should affect width calculation' },
            { id: '3', label: 'Medium item', description: 'Medium length description' }
          ]
        }],
        footer: 'Footer text with some hints'
      };

      const result = this.contentLayoutSystem.renderContent(testContent);
      
      // Verify that the layout calculation succeeded
      const hasOutput = typeof result.output === 'string' && result.output.length > 0;
      const hasLayout = result.layout && typeof result.layout.totalWidth === 'number';
      const hasCapabilities = result.capabilities && typeof result.capabilities.width === 'number';
      
      // Check that width is within reasonable bounds
      const reasonableWidth = result.layout.totalWidth >= 40 && result.layout.totalWidth <= 120;
      
      const passed = hasOutput && hasLayout && hasCapabilities && reasonableWidth;

      return {
        testName: 'Content Width Calculation',
        passed,
        message: passed ? 'Content width calculated successfully' : 'Content width calculation failed',
        duration: Date.now() - startTime,
        details: {
          outputLength: result.output.length,
          totalWidth: result.layout.totalWidth,
          contentWidth: result.layout.contentWidth,
          terminalWidth: result.capabilities.width
        }
      };

    } catch (error) {
      return {
        testName: 'Content Width Calculation',
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test border rendering
   */
  private async testBorderRendering(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testContent: WindowContent = {
        title: 'Border Test',
        sections: [{
          id: 'test',
          items: [
            { id: '1', label: 'Test item' }
          ]
        }]
      };

      // Test Unicode border rendering
      this.contentLayoutSystem.forceTerminalCapabilities({
        supportsUnicode: true,
        supportsBoxDrawing: true,
        supportsColor: true,
        width: 80,
        height: 24
      });

      const unicodeResult = this.contentLayoutSystem.renderContent(testContent, {
        borderStyle: 'unicode'
      });

      // Test ASCII border rendering
      this.contentLayoutSystem.forceTerminalCapabilities({
        supportsUnicode: false,
        supportsBoxDrawing: false,
        supportsColor: false,
        width: 80,
        height: 24
      });

      const asciiResult = this.contentLayoutSystem.renderContent(testContent, {
        borderStyle: 'ascii'
      });

      // Verify both renderings work
      const unicodeHasBorders = unicodeResult.output.includes('┌') && unicodeResult.output.includes('└');
      const asciiHasBorders = asciiResult.output.includes('+') && asciiResult.output.includes('|');
      
      const passed = unicodeHasBorders && asciiHasBorders;

      return {
        testName: 'Border Rendering',
        passed,
        message: passed ? 'Both Unicode and ASCII borders rendered successfully' : 'Border rendering failed',
        duration: Date.now() - startTime,
        details: {
          unicodeHasBorders,
          asciiHasBorders,
          unicodeLength: unicodeResult.output.length,
          asciiLength: asciiResult.output.length
        }
      };

    } catch (error) {
      return {
        testName: 'Border Rendering',
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test adaptive layout functionality
   */
  private async testAdaptiveLayout(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testContent: WindowContent = {
        title: 'Adaptive Layout Test',
        sections: [{
          id: 'adaptive',
          items: [
            { id: '1', label: 'Item 1', description: 'Description 1' },
            { id: '2', label: 'Item 2', description: 'Description 2' }
          ]
        }]
      };

      // Test narrow terminal
      this.contentLayoutSystem.forceTerminalCapabilities({
        supportsUnicode: true,
        supportsBoxDrawing: true,
        supportsColor: true,
        width: 50,
        height: 24
      });

      const narrowResult = this.contentLayoutSystem.renderContent(testContent, {
        maxWidth: 45
      });

      // Test wide terminal
      this.contentLayoutSystem.forceTerminalCapabilities({
        supportsUnicode: true,
        supportsBoxDrawing: true,
        supportsColor: true,
        width: 120,
        height: 24
      });

      const wideResult = this.contentLayoutSystem.renderContent(testContent, {
        maxWidth: 100
      });

      // Verify adaptive behavior
      const narrowIsSmaller = narrowResult.layout.totalWidth < wideResult.layout.totalWidth;
      const bothHaveContent = narrowResult.output.length > 0 && wideResult.output.length > 0;
      
      const passed = narrowIsSmaller && bothHaveContent;

      return {
        testName: 'Adaptive Layout',
        passed,
        message: passed ? 'Layout adapts correctly to different terminal sizes' : 'Adaptive layout failed',
        duration: Date.now() - startTime,
        details: {
          narrowWidth: narrowResult.layout.totalWidth,
          wideWidth: wideResult.layout.totalWidth,
          widthDifference: wideResult.layout.totalWidth - narrowResult.layout.totalWidth
        }
      };

    } catch (error) {
      return {
        testName: 'Adaptive Layout',
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test terminal compatibility fallbacks
   */
  private async testTerminalCompatibilityFallbacks(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testContent: WindowContent = {
        title: 'Fallback Test',
        sections: [{
          id: 'fallback',
          items: [{ id: '1', label: 'Test item' }]
        }]
      };

      // Test with minimal capabilities
      this.contentLayoutSystem.forceTerminalCapabilities({
        supportsUnicode: false,
        supportsBoxDrawing: false,
        supportsColor: false,
        width: 40,
        height: 10
      });

      const fallbackResult = this.contentLayoutSystem.renderContent(testContent);
      
      // Should still render something usable
      const hasOutput = fallbackResult.output.length > 0;
      const compatibility = this.contentLayoutSystem.testTerminalCompatibility();
      const hasRecommendations = compatibility.recommendations.length > 0;
      
      const passed = hasOutput && hasRecommendations;

      return {
        testName: 'Terminal Compatibility Fallbacks',
        passed,
        message: passed ? 'Fallbacks work correctly for limited terminals' : 'Fallback handling failed',
        duration: Date.now() - startTime,
        details: {
          compatibilityLevel: compatibility.compatibilityLevel,
          recommendations: compatibility.recommendations,
          outputLength: fallbackResult.output.length
        }
      };

    } catch (error) {
      return {
        testName: 'Terminal Compatibility Fallbacks',
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Test visual consistency
   */
  private async testVisualConsistency(): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const testContent: WindowContent = {
        title: 'Consistency Test',
        subtitle: 'Testing visual consistency',
        sections: [{
          id: 'consistency',
          items: [
            { id: '1', label: 'Item 1', description: 'Short' },
            { id: '2', label: 'Item 2', description: 'Much longer description text' }
          ]
        }],
        footer: 'Test footer'
      };

      const result = this.contentLayoutSystem.renderContent(testContent);
      const lines = result.output.split('\n');
      
      // Check that all lines respect padding (3 characters as specified)
      const borderLines = lines.filter(line => 
        line.includes('┌') || line.includes('└') || line.includes('├') || line.includes('│')
      );
      
      // Check that content lines have consistent padding
      const contentLines = lines.filter(line => 
        line.includes('│') && !line.includes('─') && line.trim().length > 2
      );
      
      let consistentPadding = true;
      for (const line of contentLines) {
        // Extract content between borders
        const match = line.match(/│(.*)│/);
        if (match) {
          const content = match[1];
          // Should start with 3 spaces (padding) unless it's separator
          if (content.length > 6 && !content.startsWith('   ') && !content.startsWith('─')) {
            consistentPadding = false;
            break;
          }
        }
      }
      
      const passed = borderLines.length > 0 && consistentPadding;

      return {
        testName: 'Visual Consistency',
        passed,
        message: passed ? 'Visual consistency maintained' : 'Visual inconsistencies detected',
        duration: Date.now() - startTime,
        details: {
          totalLines: lines.length,
          borderLines: borderLines.length,
          contentLines: contentLines.length,
          consistentPadding
        }
      };

    } catch (error) {
      return {
        testName: 'Visual Consistency',
        passed: false,
        message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Generate test report
   */
  generateTestReport(suiteResult: TestSuiteResult): string {
    const lines: string[] = [];
    
    lines.push('='.repeat(60));
    lines.push(`Content Layout System Test Report`);
    lines.push('='.repeat(60));
    lines.push('');
    lines.push(`Suite: ${suiteResult.suiteName}`);
    lines.push(`Total Tests: ${suiteResult.totalTests}`);
    lines.push(`Passed: ${suiteResult.passedTests}`);
    lines.push(`Failed: ${suiteResult.failedTests}`);
    lines.push(`Duration: ${suiteResult.duration}ms`);
    lines.push(`Success Rate: ${Math.round((suiteResult.passedTests / suiteResult.totalTests) * 100)}%`);
    lines.push('');
    
    lines.push('Test Results:');
    lines.push('-'.repeat(40));
    
    for (const result of suiteResult.results) {
      const status = result.passed ? '[PASS]' : '[FAIL]';
      lines.push(`${status} ${result.testName} (${result.duration}ms)`);
      lines.push(`       ${result.message}`);
      
      if (!result.passed && result.details) {
        lines.push(`       Details: ${JSON.stringify(result.details, null, 2)}`);
      }
      lines.push('');
    }
    
    return lines.join('\n');
  }
}

// Export test runner function
export async function runContentLayoutTests(): Promise<void> {
  const testSuite = new ContentLayoutTestSuite();
  console.log('Running Content Layout System tests...\n');
  
  const results = await testSuite.runAllTests();
  const report = testSuite.generateTestReport(results);
  
  console.log(report);
  
  if (results.failedTests > 0) {
    console.error(`\nTest suite failed with ${results.failedTests} failures.`);
    process.exit(1);
  } else {
    console.log('\nAll tests passed successfully!');
  }
}

// Export for use in other test suites
// ContentLayoutTestSuite is already exported above
