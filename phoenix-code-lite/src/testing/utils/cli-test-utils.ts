/**---
 * title: [CLI Test Utilities - Integration Helpers]
 * tags: [Testing, Utils]
 * provides: [CLI test helpers]
 * requires: []
 * description: [Helper functions for running and validating CLI integration tests.]
 * ---*/

import { MockConfigManager } from '../mocks/mock-config-manager';
import { MockAuditLogger } from '../mocks/mock-audit-logger';
import { MockClaudeClient } from '../mocks/mock-claude-client';
import { MockFileSystem } from '../mocks/mock-file-system';
import { CommandFactory } from '../../cli/factories/command-factory';

export class CLITestUtils {
  static createMockDependencies() {
    return {
      configManager: new MockConfigManager(),
      auditLogger: new MockAuditLogger(),
      claudeClient: new MockClaudeClient(),
      fileSystem: new MockFileSystem()
    };
  }

  static createCommandFactory(mocks = this.createMockDependencies()) {
    return new CommandFactory(
      mocks.configManager,
      mocks.auditLogger,
      mocks.claudeClient,
      mocks.fileSystem
    );
  }

  // Note: InteractiveSession will be implemented later
  // static createInteractiveSession(mocks = this.createMockDependencies()) {
  //   const commandFactory = this.createCommandFactory(mocks);
  //   return new InteractiveSession(
  //     commandFactory,
  //     mocks.auditLogger,
  //     mocks.configManager
  //   );
  // }

  static async captureConsoleOutput(fn: () => Promise<void>): Promise<string> {
    const originalLog = console.log;
    let output = '';
    
    console.log = (...args: any[]) => {
      output += args.join(' ') + '\n';
    };

    try {
      await fn();
    } finally {
      console.log = originalLog;
    }

    return output;
  }

  static async captureConsoleError(fn: () => Promise<void>): Promise<string> {
    const originalWrite = process.stderr.write;
    let output = '';
    
    process.stderr.write = (chunk: string) => {
      output += chunk;
      return true;
    };

    try {
      await fn();
    } finally {
      process.stderr.write = originalWrite;
    }

    return output;
  }

  static mockProcessExit(fn: () => Promise<void>): { exitCode: number | null; exitCalled: boolean } {
    const originalExit = process.exit;
    let exitCode: number | null = null;
    let exitCalled = false;
    
    process.exit = ((code: number) => {
      exitCode = code;
      exitCalled = true;
    }) as any;

    try {
      fn();
    } finally {
      process.exit = originalExit;
    }

    return { exitCode, exitCalled };
  }

  static createTestOptions(overrides: any = {}) {
    return {
      task: 'test task',
      projectPath: '/test/project',
      language: 'typescript',
      framework: 'node',
      verbose: false,
      maxAttempts: 3,
      ...overrides
    };
  }
} 
