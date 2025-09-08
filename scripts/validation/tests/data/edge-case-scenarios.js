/**
 * Edge Case Validation Scenarios
 * 
 * Test cases for hard-to-locate files and complex project structures
 * that validate the robustness of the new validation routing system
 */

export const edgeCaseScenarios = {
  
  /**
   * Scenario 1: Deeply Nested File Structure
   * Tests file discovery in complex nested directories
   */
  deeplyNestedFiles: {
    name: 'Deeply Nested Backend Files',
    taskId: 'TASK-EDGE-NESTED-001',
    
    command: {
      project: 'Templum',
      category: 'backend',
      scope: 'backend',
      expectedResult: 'VALIDATION_PASSED'
    },
    
    projectFiles: {
      'package.json': JSON.stringify({
        name: 'templum-nested-test',
        scripts: { build: 'tsc', lint: 'eslint .' }
      }),
      
      'tsconfig.json': JSON.stringify({
        compilerOptions: { outDir: 'dist', strict: true }
      }),
      
      // Files deeply nested in backend structure
      'src/backend/services/core/routing/advanced/service-router.ts': `
export class AdvancedServiceRouter {
  public route(path: string): string {
    return \`Advanced routing for: \${path}\`;
  }
}`,

      'src/backend/data/persistence/session/managers/session-manager.ts': `
export class DeepSessionManager {
  private sessions = new Map<string, any>();
  
  public manage(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }
}`,

      'src/backend/transfer/protocols/http/handlers/transfer-handler.ts': `
export class HTTPTransferHandler {
  public async handle(request: any): Promise<void> {
    console.log('Handling HTTP transfer:', request);
  }
}`,

      // Mixed extension files that should still be found
      'src/backend/utils/helpers.js': `
// JavaScript file in TypeScript project
exports.helper = function(data) {
  return data ? 'valid' : 'invalid';
};`,

      // Files that should be excluded from backend scope
      'src/ui/deeply/nested/component.ts': `
export class DeeplyNestedUIComponent {
  render() { return 'UI Component'; }
}`,
      
      'src/core/system/deep/core.ts': `
export class DeepCore {
  process() { return 'core processing'; }
}`
    },
    
    expectedResults: {
      build: { status: 'PASS' },
      scope: {
        filesFound: 4, // Should find all backend files including .js
        deepestNesting: 6, // service-router.ts is 6 levels deep
        excludedFiles: 2 // UI and core files should be excluded
      }
    }
  },

  /**
   * Scenario 2: Symlinked Directories
   * Tests handling of symbolic links in project structure
   */
  symlinkFiles: {
    name: 'Symlinked File Discovery',
    taskId: 'TASK-EDGE-SYMLINK-001',
    
    command: {
      project: 'Templum',
      category: 'backend',
      scope: 'backend',
      expectedResult: 'VALIDATION_PASSED'
    },
    
    projectFiles: {
      'package.json': JSON.stringify({ name: 'symlink-test' }),
      'tsconfig.json': JSON.stringify({ compilerOptions: {} }),
      
      // Original files
      'src/backend/original/service.ts': `
export class OriginalService {
  public serve(): string {
    return 'original service';
  }
}`,
      
      // Files that will be symlinked (testing will need to create actual symlinks)
      'shared/backend/shared-service.ts': `
export class SharedService {
  public share(): string {
    return 'shared service';
  }
}`
    },
    
    symlinkSetup: [
      {
        target: 'shared/backend',
        linkPath: 'src/backend/shared'
      }
    ],
    
    expectedResults: {
      build: { status: 'PASS' },
      scope: {
        filesFound: 2, // original + symlinked
        symlinksResolved: 1,
        symlinkFilesIncluded: true
      }
    }
  },

  /**
   * Scenario 3: Mixed Project Types in Single Validation
   * Tests validation across different project structures
   */
  mixedProjectTypes: {
    name: 'Mixed Project Structure Validation',
    taskId: 'TASK-EDGE-MIXED-001',
    
    command: {
      project: '.claude/mcp-integration',
      category: 'mcp',
      scope: 'mcp',
      expectedResult: 'VALIDATION_PASSED'
    },
    
    projectFiles: {
      'package.json': JSON.stringify({
        name: 'mcp-integration-mixed',
        scripts: { build: 'tsc' },
        type: 'module'
      }),
      
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          module: 'ESNext',
          target: 'ES2022'
        }
      }),
      
      // MCP-specific files with complex structure
      'src/mcp-channel/protocols/v1/channel.ts': `
export class MCPChannelV1 {
  public connect(): Promise<void> {
    return Promise.resolve();
  }
}`,

      'src/mcp-channel/protocols/v2/channel.ts': `
export class MCPChannelV2 {
  public async connect(): Promise<void> {
    await this.initializeV2Protocol();
  }
  
  private async initializeV2Protocol(): Promise<void> {
    // V2 initialization logic
  }
}`,

      'src/backend/service-discovery.ts': `
// This should be included in MCP scope since it's MCP-related
export class MCPServiceDiscovery {
  public discover(): string[] {
    return ['mcp-service-1', 'mcp-service-2'];
  }
}`,

      // Files outside MCP scope
      'src/unrelated/other-service.ts': `
export class OtherService {
  public process(): void {
    console.log('unrelated service');
  }
}`
    },
    
    expectedResults: {
      build: { status: 'PASS' },
      scope: {
        filesFound: 3, // 2 channel files + service-discovery
        scopeMatched: 'mcp',
        excludedFiles: ['src/unrelated/other-service.ts'],
        projectType: 'repo-agnostic'
      }
    }
  },

  /**
   * Scenario 4: File Pattern Edge Cases
   * Tests complex file patterns and extensions
   */
  complexFilePatterns: {
    name: 'Complex File Pattern Discovery',
    taskId: 'TASK-EDGE-PATTERNS-001',
    
    command: {
      project: 'Templum',
      category: 'backend',
      scope: 'backend',
      expectedResult: 'VALIDATION_PASSED'
    },
    
    projectFiles: {
      'package.json': JSON.stringify({ name: 'pattern-test' }),
      'tsconfig.json': JSON.stringify({ compilerOptions: {} }),
      
      // Various file extensions that should be included
      'src/backend/service.ts': `export class Service {}`,
      'src/backend/legacy.js': `exports.Legacy = class Legacy {}`,
      'src/backend/config.json': `{ "backend": { "port": 3000 } }`,
      'src/backend/types.d.ts': `declare module 'backend-types';`,
      
      // Files with special characters in names
      'src/backend/service-router@v2.ts': `
export class ServiceRouterV2 {
  public route(): void {}
}`,
      
      'src/backend/session_manager.ts': `
export class SessionManager {
  public manage(): void {}
}`,
      
      'src/backend/transfer.handler.ts': `
export class TransferHandler {
  public handle(): void {}
}`,
      
      // Files that should be excluded despite being in backend directory
      'src/backend/README.md': `# Backend Documentation`,
      'src/backend/.env': `NODE_ENV=development`,
      'src/backend/package-lock.json': `{}`,
      
      // Hidden files
      'src/backend/.hidden-service.ts': `
export class HiddenService {
  public serve(): void {}
}`
    },
    
    expectedResults: {
      build: { status: 'PASS' },
      scope: {
        filesFound: 7, // All .ts, .js files including hidden ones
        excludedFiles: 3, // .md, .env, .json config files
        specialCharacterFiles: 3, // Files with @, _, . in names
        hiddenFilesIncluded: true
      }
    }
  },

  /**
   * Scenario 5: Performance Stress Test
   * Tests performance with large number of files
   */
  performanceStressTest: {
    name: 'Large Project Performance Test',
    taskId: 'TASK-EDGE-PERF-001',
    
    command: {
      project: 'Templum',
      category: 'backend',
      scope: 'backend',
      expectedResult: 'VALIDATION_PASSED',
      maxDuration: 60000 // Should complete within 60 seconds
    },
    
    // This would programmatically generate many files
    fileGenerator: {
      pattern: 'src/backend/module-{i}/service-{j}.ts',
      moduleCount: 50, // 50 modules
      filesPerModule: 10, // 10 files each = 500 files total
      template: (moduleIndex, fileIndex) => `
export class Service${moduleIndex}_${fileIndex} {
  private data: string = 'module-${moduleIndex}-file-${fileIndex}';
  
  public process(): string {
    return this.data.toUpperCase();
  }
  
  public validate(): boolean {
    return this.data.length > 0;
  }
}`
    },
    
    expectedResults: {
      build: { status: 'PASS' },
      scope: {
        filesFound: 500,
        performanceTargetMet: true,
        maxDuration: 60000
      }
    }
  }
};

export default edgeCaseScenarios;