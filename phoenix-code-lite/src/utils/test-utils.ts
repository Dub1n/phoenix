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
export function isTestEnvironment(): boolean {
  return process.env.NODE_ENV === 'test' || 
         !!process.env.JEST_WORKER_ID || 
         !!process.env.VITEST_WORKER_ID ||
         process.argv.some(arg => arg.includes('jest') || arg.includes('test'));
}

/**
 * Check if the current process is a child process spawned by logue for CLI testing.
 * 
 * Logue spawns child processes to test CLI applications. These processes need to
 * exit normally to signal completion to logue, even in test environments.
 * 
 * @returns True if running as a logue child process, false otherwise
 */
export function isLogueChildProcess(): boolean {
  // Since logue doesn't set NODE_ENV=test automatically, we need a different approach
  // Logue child processes have these characteristics:
  // 1. No JEST_WORKER_ID (not in Jest worker)
  // 2. No VITEST_WORKER_ID (not in Vitest worker)  
  // 3. Process spawned as child process (has a parent)
  // 4. Running in a testing context but not in Jest worker
  
  // For now, assume any process without Jest/Vitest worker IDs 
  // and not explicitly in production should be allowed to exit
  return !process.env.JEST_WORKER_ID && !process.env.VITEST_WORKER_ID;
}

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
export function safeExit(code: number = 0): void {
  // Only prevent exit if we're specifically in a Jest worker
  // This protects Jest workers from crashes while allowing
  // child processes (like logue) to exit normally
  if (process.env.JEST_WORKER_ID) {
    return; // Don't exit in Jest workers
  }
  
  // Exit in all other cases:
  // - Production environments
  // - Child processes spawned by testing libraries
  // - Direct CLI execution with NODE_ENV=test
  process.exit(code);
}

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
export function processExit(code: number = 0): void {
  safeExit(code);
}

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
export function isJestWorker(): boolean {
  return !!process.env.JEST_WORKER_ID;
}

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
export function isTestWithTimeouts(): boolean {
  return isTestEnvironment() && !!(process.env.JEST_WORKER_ID || process.env.VITEST_WORKER_ID);
} 

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
export async function waitForCLIShutdown(child: any, timeoutMs: number = 5000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('CLI shutdown timeout'));
    }, timeoutMs);

    child.on('close', (code: number) => {
      clearTimeout(timeoutId);
      resolve();
    });

    child.on('error', (error: Error) => {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
} 