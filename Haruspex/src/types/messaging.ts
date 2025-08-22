/**
 * @fileoverview WebView Messaging Types and Utilities - Phase 5 Implementation
 * @author Claude Code Implementation
 * @created 2025-08-14
 * 
 * Message contracts and throttling utilities for WebView communication
 */

export interface WebviewMessage<T = unknown> {
  readonly type: string;
  readonly payload?: T;
}

export interface UpdatePayload {
  readonly timestamp: number;
}

/**
 * Throttled message posting to prevent UI thrash
 * 
 * @param webview - WebView instance with postMessage capability
 * @param message - Message to send
 */
let lastPost = 0;
const MIN_INTERVAL_MS = 100;

export function safePostMessage(
  webview: { postMessage: (m: WebviewMessage) => Thenable<boolean> }, 
  message: WebviewMessage
): void {
  const now = Date.now();
  if (now - lastPost < MIN_INTERVAL_MS) {
    return; // throttle
  }
  lastPost = now;
  void webview.postMessage(message);
}

/**
 * Safe message handler wrapper with error isolation
 * 
 * @param webview - WebView instance
 * @param handler - Message handler function
 */
export function attachHandler(
  webview: { onDidReceiveMessage: (cb: (m: WebviewMessage) => void) => void }, 
  handler: (m: WebviewMessage) => void
): void {
  webview.onDidReceiveMessage((m) => {
    try { 
      handler(m); 
    } catch {
      // guard against handler errors
    }
  });
}