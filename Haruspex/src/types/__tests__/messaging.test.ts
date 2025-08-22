/**
 * @fileoverview Messaging Utilities Tests - Phase 5 Implementation
 * @author Claude Code Implementation  
 * @created 2025-08-14
 * 
 * Tests for WebView messaging throttling and safety utilities
 */

import { safePostMessage, attachHandler, WebviewMessage } from '../messaging';

describe('messaging throttling with Phase 4 performance patterns', () => {
  beforeEach(() => {
    // Reset the internal throttle state before each test
    jest.clearAllMocks();
  });

  it('throttles frequent postMessage calls to prevent UI thrash', () => {
    const calls: unknown[] = [];
    const webview = { 
      postMessage: jest.fn().mockImplementation(async (m: unknown) => { 
        calls.push(m); 
        return true; 
      }) 
    };
    
    // Rapid-fire messages should be throttled
    safePostMessage(webview, { type: 'update' });
    safePostMessage(webview, { type: 'update' });
    safePostMessage(webview, { type: 'update' });
    
    expect(calls.length).toBe(1); // Only first message sent
    expect(webview.postMessage).toHaveBeenCalledTimes(1);
  });

  it('allows messages after throttle interval', (done) => {
    const calls: unknown[] = [];
    const webview = { 
      postMessage: jest.fn().mockImplementation(async (m: unknown) => { 
        calls.push(m); 
        return true; 
      }) 
    };
    
    safePostMessage(webview, { type: 'update' });
    expect(calls.length).toBe(1); // First message sent
    
    // Wait for throttle interval to pass
    setTimeout(() => {
      safePostMessage(webview, { type: 'update' });
      expect(calls.length).toBe(2); // Both messages sent
      expect(webview.postMessage).toHaveBeenCalledTimes(2);
      done();
    }, 150);
  });

  it('handles different message types correctly', () => {
    const webview = { 
      postMessage: jest.fn().mockResolvedValue(true)
    };
    
    safePostMessage(webview, { type: 'refresh', payload: { data: 'test' } });
    
    expect(webview.postMessage).toHaveBeenCalledWith({
      type: 'refresh',
      payload: { data: 'test' }
    });
  });
});

describe('message handler attachment with safety patterns', () => {
  it('attaches message handler safely', () => {
    const mockHandler = jest.fn();
    const webview = {
      onDidReceiveMessage: jest.fn()
    };

    attachHandler(webview, mockHandler);

    expect(webview.onDidReceiveMessage).toHaveBeenCalledWith(expect.any(Function));
  });

  it('guards against handler errors', () => {
    const errorHandler = jest.fn().mockImplementation(() => {
      throw new Error('Handler error');
    });
    
    const webview = {
      onDidReceiveMessage: jest.fn()
    };

    attachHandler(webview, errorHandler);

    // Get the wrapped handler function
    const wrappedHandler = webview.onDidReceiveMessage.mock.calls[0][0];
    
    // Should not throw when handler throws
    expect(() => {
      wrappedHandler({ type: 'test' });
    }).not.toThrow();
    
    expect(errorHandler).toHaveBeenCalled();
  });

  it('passes messages correctly to handler', () => {
    const mockHandler = jest.fn();
    const webview = {
      onDidReceiveMessage: jest.fn()
    };

    attachHandler(webview, mockHandler);

    // Get the wrapped handler function
    const wrappedHandler = webview.onDidReceiveMessage.mock.calls[0][0];
    const testMessage: WebviewMessage = { type: 'test', payload: { data: 'test' } };
    
    wrappedHandler(testMessage);
    
    expect(mockHandler).toHaveBeenCalledWith(testMessage);
  });
});