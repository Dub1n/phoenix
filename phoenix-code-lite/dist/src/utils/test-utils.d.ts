/**---
 * title: [Test Utilities - Safe Exit and Helpers]
 * tags: [Utility, Testing]
 * provides: [safeExit, timers, helpers]
 * requires: []
 * description: [Testing-safe process helpers including safe exit for CI and controlled timing utilities.]
 * ---*/
/**
 * Test Environment Utilities
 *
 * Helper functions for detecting test environments and handling process exits safely.
 * These utilities ensure that process.exit calls don't crash Jest workers during testing.
 *
 * @example
 * ```typescript
 * import { safeExit, isTestEnvironment } from '../utils/test-utils';
 *
 * // Safe process exit that won't crash tests
 * if (error) {
 *   safeExit(1);
 * }
 *
 * // Check if running in test environment
 * if (isTestEnvironment()) {
 *   console.log('Running in test mode');
 * }
 * ```
 */
/**
 * Check if the current environment is a test environment.
 *
 * Detects various test environment indicators including:
 * - NODE_ENV=test
 * - Jest worker processes
 * - Vitest worker processes
 * - Command line arguments containing 'jest' or 'test'
 *
 * @returns True if running in a test environment, false otherwise
 *
 * @example
 * ```typescript
 * if (isTestEnvironment()) {
 *   // Use test-specific configuration
 *   console.log('Test mode detected');
 * }
 * ```
 */
export declare function isTestEnvironment(): boolean;
/**
 * Check if the current process is a child process spawned by logue for CLI testing.
 *
 * Logue spawns child processes to test CLI applications. These processes need to
 * exit normally to signal completion to logue, even in test environments.
 *
 * @returns True if running as a logue child process, false otherwise
 */
export declare function isLogueChildProcess(): boolean;
/**
 * Safely exit the process, with targeted protection for Jest workers.
 *
 * This function prevents Jest worker crashes by avoiding process.exit
 * calls specifically in Jest worker processes, while allowing other
 * processes (including child processes spawned by testing libraries
 * like logue) to exit normally.
 *
 * @param code - Exit code (0 for success, 1 for error)
 *
 * @example
 * ```typescript
 * // Safe exit that won't crash Jest workers but allows child processes to exit
 * if (criticalError) {
 *   safeExit(1);
 * }
 * ```
 */
export declare function safeExit(code?: number): void;
/**
 * Wrapper for process.exit that respects test environments.
 *
 * This is an alias for safeExit() to provide a more explicit
 * interface for replacing direct process.exit calls.
 *
 * @param code - Exit code (0 for success, 1 for error)
 *
 * @example
 * ```typescript
 * // Replace process.exit(1) with:
 * processExit(1);
 * ```
 */
export declare function processExit(code?: number): void;
/**
 * Check if the current process is running in a Jest worker.
 *
 * @returns True if running in a Jest worker process, false otherwise
 *
 * @example
 * ```typescript
 * if (isJestWorker()) {
 *   // Jest-specific behavior
 *   console.log('Running in Jest worker');
 * }
 * ```
 */
export declare function isJestWorker(): boolean;
/**
 * Check if the current process is running in a test environment with timeouts.
 *
 * This function identifies test environments that support timeout
 * functionality, which is useful for configuring test-specific
 * behavior that depends on timeout capabilities.
 *
 * @returns True if running in a test environment with timeout support, false otherwise
 *
 * @example
 * ```typescript
 * if (isTestWithTimeouts()) {
 *   // Configure timeout-dependent behavior
 *   jest.setTimeout(30000);
 * }
 * ```
 */
export declare function isTestWithTimeouts(): boolean;
/**
 * Wait for CLI process to complete shutdown gracefully in test environments.
 * This ensures that all async operations complete before the test continues.
 *
 * @param child - The child process spawned by the CLI
 * @param timeoutMs - Maximum time to wait for shutdown (default: 5000ms)
 * @returns Promise that resolves when shutdown is complete
 *
 * @example
 * ```typescript
 * const child = spawn('node', ['dist/src/index.js', 'config', '--show']);
 * await waitForCLIShutdown(child, 3000);
 * ```
 */
export declare function waitForCLIShutdown(child: any, timeoutMs?: number): Promise<void>;
//# sourceMappingURL=test-utils.d.ts.map