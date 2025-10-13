/**
 * @fileoverview Node-PTY Type Definitions (Mock)
 * 
 * Mock type definitions for node-pty when the actual library is not available.
 * Used during development when C++ build tools are not available.
 * 
 * @author VDL Vault
 * @since 2025-09-04
 */

// TODO: [TASK-MCP-001] Replace with real node-pty when C++ build tools are available

type AsyncUtilsModule = typeof import('../../utils/async-utils');

let asyncUtilsModule: AsyncUtilsModule | undefined;

function getAsyncUtils(): AsyncUtilsModule['AsyncUtils'] {
  if (!asyncUtilsModule) {
    asyncUtilsModule = require('../../utils/async-utils') as AsyncUtilsModule;
  }
  return asyncUtilsModule.AsyncUtils;
}

export interface IPty {
  write(data: string): void;
  onData(callback: (data: string) => void): void;
  onExit(callback: (exitCode: number, signal: number) => void): void;
  onError(callback: (error: Error) => void): void;
  kill(signal?: string): void;
  killed: boolean;
}

export interface SpawnOptions {
  name?: string;
  cols?: number;
  rows?: number;
  cwd?: string;
  env?: NodeJS.ProcessEnv;
}

export function spawn(file: string, args: string[], options: SpawnOptions): IPty {
  // TODO: [TASK-MCP-001] Replace mock implementation with real node-pty when C++ build tools available
  // Mock implementation for development
  const mockPty: IPty = {
    write: (data: string) => {
      console.log(`[MOCK PTY] Writing: ${data}`);
    },
    onData: (callback: (data: string) => void) => {
      console.log('[MOCK PTY] Setting up data handler');
      // Mock some initial output
      getAsyncUtils().createTimeout(() => callback('Mock PTY output\n$ '), 100, { unref: true });
    },
    onExit: (callback: (exitCode: number, signal: number) => void) => {
      console.log('[MOCK PTY] Setting up exit handler');
    },
    onError: (callback: (error: Error) => void) => {
      console.log('[MOCK PTY] Setting up error handler');
    },
    kill: (signal?: string) => {
      console.log(`[MOCK PTY] Killing process with signal: ${signal || 'SIGTERM'}`);
      mockPty.killed = true;
    },
    killed: false
  };

  return mockPty;
}
