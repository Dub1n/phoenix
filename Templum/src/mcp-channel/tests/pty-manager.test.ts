/**
 * @fileoverview PTY Manager Tests
 * 
 * Unit tests for PTY process management functionality.
 * Tests session creation, cleanup, and error handling.
 * 
 * @author VDL Vault
 * @since 2025-09-04
 */

import { PTYManager } from '../src/pty-manager';
import { MCPChannelError, MCPChannelErrorType } from '../src/types';

// Mock our node-pty-types module
jest.mock('../src/node-pty-types', () => ({
  spawn: jest.fn(() => ({
    write: jest.fn(),
    kill: jest.fn(),
    onData: jest.fn(),
    onExit: jest.fn(),
    onError: jest.fn(),
    killed: false
  }))
}));

describe('PTYManager', () => {
  let ptyManager: PTYManager;
  
  beforeEach(() => {
    ptyManager = new PTYManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
    ptyManager.cleanup();
  });

  describe('createSession', () => {
    test('should create new session successfully', () => {
      const sessionId = 'test-session-1';
      const command = 'bash';

      const sessionInfo = ptyManager.createSession(sessionId, command);

      expect(sessionInfo).toEqual({
        sessionId,
        command,
        started: expect.any(Date),
        status: 'active'
      });

      expect(ptyManager.getActiveSessions()).toContain(sessionId);
    });

    test('should create session with default shell when no command provided', () => {
      const sessionId = 'test-session-2';

      const sessionInfo = ptyManager.createSession(sessionId);

      expect(sessionInfo.sessionId).toBe(sessionId);
      expect(sessionInfo.command).toBeDefined();
      expect(sessionInfo.status).toBe('active');
    });

    test('should throw error when session already exists', () => {
      const sessionId = 'duplicate-session';
      
      ptyManager.createSession(sessionId);

      expect(() => {
        ptyManager.createSession(sessionId);
      }).toThrow(MCPChannelError);
    });

    test('should handle PTY spawn failure', () => {
      const mockPtySpawn = require('../src/node-pty-types').spawn;
      mockPtySpawn.mockImplementationOnce(() => {
        throw new Error('PTY spawn failed');
      });

      expect(() => {
        ptyManager.createSession('failing-session');
      }).toThrow(MCPChannelError);
    });
  });

  describe('getSession', () => {
    test('should return session when it exists', () => {
      const sessionId = 'existing-session';
      ptyManager.createSession(sessionId);

      const session = ptyManager.getSession(sessionId);

      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
    });

    test('should return undefined when session does not exist', () => {
      const session = ptyManager.getSession('non-existent-session');

      expect(session).toBeUndefined();
    });
  });

  describe('destroySession', () => {
    test('should destroy existing session successfully', () => {
      const sessionId = 'session-to-destroy';
      ptyManager.createSession(sessionId);

      const result = ptyManager.destroySession(sessionId);

      expect(result).toBe(true);
      expect(ptyManager.getSession(sessionId)).toBeUndefined();
      expect(ptyManager.getActiveSessions()).not.toContain(sessionId);
    });

    test('should return false when session does not exist', () => {
      const result = ptyManager.destroySession('non-existent-session');

      expect(result).toBe(false);
    });

    test('should handle process kill error gracefully', () => {
      const sessionId = 'error-session';
      ptyManager.createSession(sessionId);
      
      const session = ptyManager.getSession(sessionId);
      const mockKill = session?.processHandle.kill as jest.Mock;
      mockKill.mockImplementationOnce(() => {
        throw new Error('Kill failed');
      });

      const result = ptyManager.destroySession(sessionId);

      expect(result).toBe(true);
      expect(ptyManager.getSession(sessionId)).toBeUndefined();
    });
  });

  describe('sendText', () => {
    test('should send text to existing session', () => {
      const sessionId = 'text-session';
      ptyManager.createSession(sessionId);
      
      const session = ptyManager.getSession(sessionId);
      const mockWrite = session?.processHandle.write as jest.Mock;

      ptyManager.sendText(sessionId, 'hello world');

      expect(mockWrite).toHaveBeenCalledWith('hello world');
    });

    test('should throw error when session not found', () => {
      expect(() => {
        ptyManager.sendText('non-existent-session', 'text');
      }).toThrow(MCPChannelError);
    });

    test('should handle write error', () => {
      const sessionId = 'write-error-session';
      ptyManager.createSession(sessionId);
      
      const session = ptyManager.getSession(sessionId);
      const mockWrite = session?.processHandle.write as jest.Mock;
      mockWrite.mockImplementationOnce(() => {
        throw new Error('Write failed');
      });

      expect(() => {
        ptyManager.sendText(sessionId, 'text');
      }).toThrow(MCPChannelError);
    });
  });

  describe('sendKeystroke', () => {
    test('should send keystroke to existing session', () => {
      const sessionId = 'keystroke-session';
      ptyManager.createSession(sessionId);
      
      const session = ptyManager.getSession(sessionId);
      const mockWrite = session?.processHandle.write as jest.Mock;

      ptyManager.sendKeystroke(sessionId, '\r');

      expect(mockWrite).toHaveBeenCalledWith('\r');
    });

    test('should throw error when session not found', () => {
      expect(() => {
        ptyManager.sendKeystroke('non-existent-session', '\r');
      }).toThrow(MCPChannelError);
    });
  });

  describe('getActiveSessions', () => {
    test('should return empty array when no sessions exist', () => {
      const sessions = ptyManager.getActiveSessions();

      expect(sessions).toEqual([]);
    });

    test('should return all active session IDs', () => {
      const session1 = 'session-1';
      const session2 = 'session-2';
      
      ptyManager.createSession(session1);
      ptyManager.createSession(session2);

      const sessions = ptyManager.getActiveSessions();

      expect(sessions).toHaveLength(2);
      expect(sessions).toContain(session1);
      expect(sessions).toContain(session2);
    });
  });

  describe('cleanup', () => {
    test('should cleanup all sessions', () => {
      ptyManager.createSession('session-1');
      ptyManager.createSession('session-2');
      
      expect(ptyManager.getActiveSessions()).toHaveLength(2);

      ptyManager.cleanup();

      expect(ptyManager.getActiveSessions()).toHaveLength(0);
    });
  });
});