/**
 * Backend Validation - PASS Scenario
 * 
 * This test data represents a correctly implemented backend task
 * that should pass all validation checks when using:
 * --project Templum --category backend --scope backend
 */

export const backendPassScenario = {
  // Test metadata
  name: 'Backend Task - Clean Implementation',
  taskId: 'TASK-BACKEND-PASS-001',
  
  // Command that should be tested
  command: {
    project: 'Templum',
    category: 'backend', 
    scope: 'backend',
    expectedResult: 'VALIDATION_PASSED'
  },
  
  // Files that should be created for this test
  projectFiles: {
    'package.json': JSON.stringify({
      name: 'templum-backend-test',
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
    
    // Clean backend service implementation
    'src/backend/service-router.ts': `
export class ServiceRouter {
  private routes: Map<string, Function> = new Map();
  
  public registerRoute(path: string, handler: Function): void {
    this.routes.set(path, handler);
  }
  
  public async handleRequest(path: string, data: any): Promise<any> {
    const handler = this.routes.get(path);
    if (!handler) {
      throw new Error(\`Route not found: \${path}\`);
    }
    return await handler(data);
  }
}`,

    'src/backend/session-manager.ts': `
export interface SessionData {
  id: string;
  userId: string;
  createdAt: Date;
  lastAccessed: Date;
}

export class SessionManager {
  private sessions: Map<string, SessionData> = new Map();
  
  public createSession(userId: string): string {
    const sessionId = \`session_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
    
    this.sessions.set(sessionId, {
      id: sessionId,
      userId,
      createdAt: new Date(),
      lastAccessed: new Date()
    });
    
    return sessionId;
  }
  
  public getSession(sessionId: string): SessionData | null {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastAccessed = new Date();
      return session;
    }
    return null;
  }
  
  public destroySession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }
}`,

    'src/backend/transfer-handler.ts': `
export interface TransferRequest {
  from: string;
  to: string;
  data: any;
  timestamp: Date;
}

export class TransferHandler {
  public async processTransfer(request: TransferRequest): Promise<boolean> {
    // Validate request
    if (!request.from || !request.to) {
      throw new Error('Transfer request missing required fields');
    }
    
    // Process transfer logic
    console.log(\`Processing transfer from \${request.from} to \${request.to}\`);
    
    // Simulate successful transfer
    return true;
  }
  
  public validateTransferData(data: any): boolean {
    return data !== null && data !== undefined;
  }
}`,

    // Files in other scopes that should not affect backend validation
    'src/ui/interface.ts': `
// This file has intentional issues but should not affect backend validation
export class Interface {
  render() {
    console.log("rendering interface")  // Missing semicolon (lint error)
  }
}`,

    'src/core/core-system.ts': `
// This file also has issues but should not affect backend validation
export class CoreSystem {
  private data: any;  // Should be more specific type
  
  process(input: any) {  // Missing return type
    this.data = input;
  }
}`
  },
  
  // Expected validation results
  expectedResults: {
    build: {
      status: 'PASS',
      message: 'TypeScript compilation successful'
    },
    typecheck: {
      status: 'PASS', 
      message: 'No type errors in backend scope'
    },
    lint: {
      status: 'PASS',
      message: 'No lint errors in backend scope'
    },
    scope: {
      filesChecked: 3, // service-router.ts, session-manager.ts, transfer-handler.ts
      scopeMatched: 'backend',
      excludedFiles: ['src/ui/interface.ts', 'src/core/core-system.ts']
    }
  },
  
  // Performance expectations
  performance: {
    maxDuration: 45000, // 45 seconds max
    expectedFileCount: 3
  }
};

export default backendPassScenario;