/**
 * Backend Validation - FAIL Scenario
 * 
 * This test data represents a backend task with various issues
 * that should cause validation to fail when using:
 * --project Templum --category backend --scope backend
 */

export const backendFailScenario = {
  // Test metadata
  name: 'Backend Task - With Issues',
  taskId: 'TASK-BACKEND-FAIL-001',
  
  // Command that should be tested
  command: {
    project: 'Templum',
    category: 'backend',
    scope: 'backend', 
    expectedResult: 'VALIDATION_FAILED'
  },
  
  // Files that should be created for this test
  projectFiles: {
    'package.json': JSON.stringify({
      name: 'templum-backend-test-fail',
      scripts: {
        build: 'tsc',
        lint: 'eslint src/**/*.ts',
        test: 'jest'
      },
      dependencies: {
        typescript: '^4.9.0'
      }
    }, null, 2),
    
    'tsconfig.json': JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        module: 'ESNext',
        outDir: './dist',
        strict: true,
        esModuleInterop: true
      },
      include: ['src/**/*']
    }, null, 2),
    
    // Backend service with TypeScript errors
    'src/backend/service-router.ts': `
export class ServiceRouter {
  private routes: Map<string, Function> = new Map();
  
  public registerRoute(path: string, handler: Function): void {
    this.routes.set(path, handler);
  }
  
  // TypeScript error: missing return type and async/await mismatch
  public handleRequest(path: string, data: any) {
    const handler = this.routes.get(path);
    if (!handler) {
      throw new Error(\`Route not found: \${path}\`);
    }
    // Error: trying to return async result without await
    return handler(data);
  }
  
  // Error: undefined variable
  public getRoutes(): string[] {
    return Array.from(undefinedVariable.keys());  // ReferenceError
  }
}`,

    // Backend session manager with multiple issues
    'src/backend/session-manager.ts': `
// Missing import that would cause compilation error
import { NonExistentModule } from './non-existent-module';

export interface SessionData {
  id: string;
  userId: string;
  createdAt: Date;
  lastAccessed: Date;
}

export class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  
  // TypeScript error: incompatible return type
  public createSession(userId: string): number {
    const sessionId = \`session_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
    
    this.sessions.set(sessionId, {
      id: sessionId,
      userId,
      createdAt: new Date(),
      lastAccessed: new Date()
    });
    
    // Error: returning string when number expected
    return sessionId;
  }
  
  // Lint error: prefer const assertion, unused parameter
  public getSession(sessionId: string, unusedParam: any): SessionData | null {
    let session = this.sessions.get(sessionId);  // Should be const
    if (session) {
      session.lastAccessed = new Date();
      return session;
    }
    return null;
  }
  
  // Error: missing implementation
  public destroySession(sessionId: string): boolean {
    // Missing implementation - should cause logic error
  }
}`,

    // Transfer handler with syntax and logic errors
    'src/backend/transfer-handler.ts': `
export interface TransferRequest {
  from: string;
  to: string;
  data: any;
  timestamp: Date;
}

export class TransferHandler {
  // Syntax error: malformed function
  public async processTransfer(request: TransferRequest): Promise<boolean> {
    // Missing validation
    
    // Logic error: trying to access undefined property
    console.log(\`Processing transfer from \${request.sender} to \${request.receiver}\`);
    
    // Async error: not awaiting promise
    this.validateTransferData(request.data);
    
    return true;
  }
  
  // Error: inconsistent return type
  public validateTransferData(data: any): boolean | string {
    if (data === null || data === undefined) {
      return "Invalid data";  // Should return boolean
    }
    return true;
  }
  
  // Unreachable code
  public deadCode(): void {
    return;
    console.log("This will never execute");  // ESLint error
  }
}

// Syntax error: unterminated comment
/* This comment is never closed`,

    // Files in other scopes - these should NOT cause validation failure
    'src/ui/clean-interface.ts': `
export class CleanInterface {
  public render(): void {
    console.log('Rendering clean interface');
  }
}`,

    'src/core/clean-core.ts': `
export class CleanCore {
  public process(data: string): string {
    return data.toUpperCase();
  }
}`
  },
  
  // Expected validation results
  expectedResults: {
    build: {
      status: 'FAIL',
      message: 'TypeScript compilation failed',
      errors: [
        'Cannot find module ./non-existent-module',
        'Type string is not assignable to type number',
        'Not all code paths return a value',
        'Unterminated comment'
      ]
    },
    typecheck: {
      status: 'FAIL',
      message: 'Type errors in backend scope',
      errors: [
        'Missing return type annotation',
        'Type mismatch in createSession',
        'Unreachable code detected'
      ]
    },
    lint: {
      status: 'FAIL', 
      message: 'Lint errors in backend scope',
      errors: [
        'Prefer const assertion',
        'Unused parameter unusedParam',
        'Unreachable code after return'
      ]
    },
    scope: {
      filesChecked: 3,
      scopeMatched: 'backend',
      excludedFiles: ['src/ui/clean-interface.ts', 'src/core/clean-core.ts'],
      errorFiles: [
        'src/backend/service-router.ts',
        'src/backend/session-manager.ts', 
        'src/backend/transfer-handler.ts'
      ]
    }
  },
  
  // Expected failure modes
  expectedFailures: [
    'Compilation errors in backend scope',
    'TypeScript type checking failures',
    'ESLint rule violations',
    'Syntax errors in transfer-handler.ts'
  ]
};

export default backendFailScenario;