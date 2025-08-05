import { MockConfigManager } from '../mocks/mock-config-manager';
import { MockAuditLogger } from '../mocks/mock-audit-logger';
import { MockClaudeClient } from '../mocks/mock-claude-client';
import { MockFileSystem } from '../mocks/mock-file-system';
import { CommandFactory } from '../../cli/factories/command-factory';
export declare class CLITestUtils {
    static createMockDependencies(): {
        configManager: MockConfigManager;
        auditLogger: MockAuditLogger;
        claudeClient: MockClaudeClient;
        fileSystem: MockFileSystem;
    };
    static createCommandFactory(mocks?: {
        configManager: MockConfigManager;
        auditLogger: MockAuditLogger;
        claudeClient: MockClaudeClient;
        fileSystem: MockFileSystem;
    }): CommandFactory;
    static captureConsoleOutput(fn: () => Promise<void>): Promise<string>;
    static captureConsoleError(fn: () => Promise<void>): Promise<string>;
    static mockProcessExit(fn: () => Promise<void>): {
        exitCode: number | null;
        exitCalled: boolean;
    };
    static createTestOptions(overrides?: any): any;
}
//# sourceMappingURL=cli-test-utils.d.ts.map