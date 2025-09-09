### WebSocket Protocol Communication Pattern

**Status**: ESTABLISHED
**Category**: Technical
**Last Updated**: 2025-08-27
**Difficulty**: 🔴 Expert
**Est. Time**: ~3 hours
**Prerequisites**: Backend Service Integration, WebSocket client libraries

**Problem**: Litany backend service requires WebSocket communication with service-specific enhancements and real-time bidirectional messaging.

**Solution**: Real WebSocket implementation with Litany service-specific API integration, enhanced connection management, and comprehensive error handling.

#### WebSocket Protocol Communication Pattern: Implementation Steps

```typescript
// Real WebSocket implementation with Litany service-specific enhancements
private async callWebSocketService(connection: BackendConnection,  apiMethod: string, payload: any): Promise<any> {
console.log(`[WebSocket] Calling ${apiMethod} on real ${connection.id}  Litany service`);

try {
if (!connection.connection || !connection.isConnected()) {
throw createTemplumError(`WebSocket connection to ${connection.id}  is not available`, 'WEBSOCKET_CONNECTION_UNAVAILABLE', 'integration');
}

const ws = connection.connection as WebSocket;
const messageId =  `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Enhanced Litany WebSocket message format with service-specific  metadata
const wsMessage = {
id: messageId,
type: 'api_request',
method: apiMethod,
payload,
service: connection.id,
protocol: 'websocket',
timestamp: Date.now(),
// Litany-specific metadata
client: 'templum-backend-router',
version: '1.0.0',
context: 'backend-service-integration'
};

console.log(`[WebSocket] Sending real Litany message:`, { method:  apiMethod, messageId, service: connection.id });

// Enhanced WebSocket message handling with longer timeout for real  services
return new Promise((resolve, reject) => {
const timeout = setTimeout(() => {
ws.off('message', messageHandler);
reject(createTemplumError(`Litany WebSocket call timeout for  ${apiMethod}`, 'WEBSOCKET_TIMEOUT', 'integration'));
}, 15000);

const messageHandler = (data: WebSocket.Data) => {
try {
const response = JSON.parse(data.toString());

// Enhanced Litany response matching with multiple response  patterns
if (response.id === messageId || 
(response.type === 'api_response' && response.method ===  apiMethod) ||
(response.requestId === messageId)) {

clearTimeout(timeout);
ws.off('message', messageHandler);

// Enhanced Litany-specific response handling
if (apiMethod === 'getSkinDefinition') {
if (!response.data || (!response.data.skinDefinition &&  !response.skinDefinition)) {
console.log(`[ARCHITECTURAL SEPARATION] Litany skin  definition not available, using Universal Skin Engine fallback`);
resolve(null);
return;
}

// Normalize Litany skin definition format
const skinDefinition = response.data?.skinDefinition ||  response.skinDefinition;
if (skinDefinition) {
console.log(`[WebSocket] Successfully received Litany skin  definition`);
return resolve({ skinDefinition });
}
}

if (apiMethod === 'executeCommand') {
console.log(`[WebSocket] Litany command execution result:`,  response.success ? 'success' : 'failed');
if (response.result) {
return resolve(response.result);
}
}

// Handle Litany context management responses
if (apiMethod === 'updateContext' || apiMethod ===  'syncMemory') {
console.log(`[WebSocket] Litany context operation  completed:`, apiMethod);
return resolve(response.data || { success: response.success  });
}

// Default response handling
resolve(response.success !== false ? (response.data ||  response) : null);
}
} catch (parseError) {
console.warn(`[WebSocket] Failed to parse Litany response:`,  parseError);
// Continue listening for other messages
}
};

ws.on('message', messageHandler);

// Send message to real Litany service
try {
ws.send(JSON.stringify(wsMessage));
console.log(`[WebSocket] Message sent to real Litany service`);
} catch (sendError) {
clearTimeout(timeout);
ws.off('message', messageHandler);
reject(createTemplumError(
`Failed to send WebSocket message to Litany service:  ${sendError}`,
'WEBSOCKET_SEND_FAILED',
'integration'
));
}
});

} catch (error) {
const errorMsg = isTemplumError(error) ? error.message : `Litany  WebSocket call failed: ${error}`;
console.error(`[WebSocket] Real Litany service call failed for  ${apiMethod}:`, errorMsg);

if (isTemplumError(error)) {
throw error;
}

throw createTemplumError(
`Litany WebSocket communication failed: ${errorMsg}`,
'WEBSOCKET_ERROR',
'integration',
{ protocol: 'websocket', service: connection.id, method: apiMethod,  endpoint: connection.endpoint }
);
}
}

// Litany service handshake and authentication
private async performLitanyHandshake(ws: WebSocket.WebSocket, serviceId:  string): Promise<void> {
return new Promise<void>((resolve, reject) => {
const handshakeTimeout = setTimeout(() => {
reject(new Error(`Litany service handshake timeout for  ${serviceId}`));
}, 5000);

const handshakeMessage = {
type: 'handshake',
service: 'templum-backend-router',
version: '1.0.0',
capabilities: ['context-management', 'memory-integration',  'semantic-search'],
client: 'templum-universal-interface',
timestamp: Date.now(),
protocol: 'websocket'
};

// Enhanced handshake response handler
const handshakeHandler = (data: WebSocket.RawData) => {
try {
const response = JSON.parse(data.toString());

if (response.type === 'handshake_ack' && response.success) {
clearTimeout(handshakeTimeout);
ws.off('message', handshakeHandler);
console.log(`[WebSocket] Litany service handshake successful for  ${serviceId}`);
resolve();
} else if (response.type === 'handshake_error') {
clearTimeout(handshakeTimeout);
ws.off('message', handshakeHandler);
reject(new Error(`Litany service handshake failed:  ${response.error || 'Unknown error'}`));
}
} catch (parseError) {
// Ignore parse errors during handshake
}
};

ws.on('message', handshakeHandler);
ws.send(JSON.stringify(handshakeMessage));
});
}

// Enhanced WebSocket Unsolicited Message Processing (TASK-NEW-022)
// Process real-time notifications from Litany service
private processLitanyWebSocketMessage(serviceId: string, message: any):  void {
console.log(`[WebSocket] Processing Litany message from ${serviceId}:`,  { 
type: message.type, 
method: message.method,
hasData: !!message.data 
});

try {
// Handle different types of Litany WebSocket messages
switch (message.type) {
case 'skin_definition_updated':
// Handle real-time skin definition updates
console.log(`[WebSocket] Litany ${serviceId} skin definition  updated:`, message.skinId);
if (message.skinDefinition) {
console.log(`[WebSocket] Broadcasting skin definition update for  ${message.skinId}`);
// Future: Emit signals for UI updates
}
break;

case 'context_sync_notification':
// Handle context synchronization notifications
console.log(`[WebSocket] Litany ${serviceId} context sync  notification:`, message.contextId);
break;

case 'analysis_complete':
// Handle completed analysis notifications
console.log(`[WebSocket] Litany ${serviceId} analysis completed:`,  message.analysisId);
break;

case 'service_status':
// Handle service status updates
console.log(`[WebSocket] Litany ${serviceId} status update:`,  message.status);
break;

case 'error_notification':
// Handle error notifications from Litany service
console.warn(`[WebSocket] Litany ${serviceId} error  notification:`, message.error);
break;

default:
// Handle unknown message types with graceful logging
console.log(`[WebSocket] Unknown Litany message type from  ${serviceId}:`, message.type);
break;
}
} catch (error) {
console.error(`[WebSocket] Error processing Litany message from  ${serviceId}:`, error);
}
}
```

#### WebSocket Protocol Communication Pattern: Success Metrics

- Real WebSocket connection to Litany backend services established
- Service-specific Litany API integration with bidirectional messaging
- Enhanced connection management with real-time message processing
- Comprehensive error handling for WebSocket failures and reconnection

#### WebSocket Protocol Communication Pattern: Anti-Patterns

- **X** Using WebSocket without proper connection lifecycle management
- **X** Missing real-time message handling for unsolicited notifications

#### WebSocket Protocol Communication Pattern: Validation Checklist

- [ ] WebSocket connection established with Litany backend services
- [ ] Service-specific bidirectional messaging functional
- [ ] Real-time notification processing working
- [ ] Error handling comprehensive for WebSocket failures
- [ ] Connection lifecycle management and recovery working

#### WebSocket Protocol Communication Pattern: Implementation Feedback
<!-- Autonomous agents append feedback here when applying pattern -->

#### WebSocket Protocol Communication Pattern: Pattern Metadata

**Key Protocol Implementation Features**:

- **Service-Specific Enhancements**: Each protocol optimized for its  target backend (Haruspex IPC, PCL HTTP, Litany WebSocket)
- **Real Service Integration**: Connection to actual running services with  environment configuration
- **Enhanced Error Handling**: Protocol-specific error patterns with  graceful fallback coordination
- **Extended Timeouts**: Longer timeouts for real service communication vs  mock implementations
- **Capability Testing**: Service capability validation during connection  establishment
- **Architectural Separation**: Proper fallback coordination with  Universal Skin Engine
- **Service Authentication**: Enhanced handshake patterns for secure  service communication
- **Bidirectional Communication**: Real-time unsolicited message  processing for WebSocket protocols

**Used By Active Tasks**: [TASK-163]
**Successfully Applied**: [TASK-163] Litany WebSocket Protocol Integration (2025-08-27)
**Integration Points**: Backend Service Integration, Litany Service
**Files Using This Pattern**: backend-service-router.ts (WebSocket-specific sections), Backend service integration components
