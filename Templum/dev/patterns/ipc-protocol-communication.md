---
date-created: 2025-08-27-0000
last-updated: 2025-09-11-0000
name: ipc-protocol-communication
description: Real IPC implementation with service-specific enhancements and real-time message handling
status: established
category: integration
use-when:
  - Backend service requires IPC communication
  - Service-specific API integration needed
  - Real-time message handling required
  - Cross-process communication necessary
keywords:
  - ipc
  - inter-process-communication
  - backend-service
  - haruspex
  - childprocess
  - real-time-messaging
prerequisites:
  - backend-service-integration
  - nodejs-childprocess
related-patterns:
  - backend-service-discovery
  - error-recovery-patterns
---

### IPC Protocol Communication Pattern

**Problem**: Haruspex backend service requires IPC communication with service-specific enhancements and real-time message handling.

**Solution**: Real IPC implementation with Haruspex service-specific API integration, enhanced connection management, and comprehensive error handling.

#### IPC Protocol Communication Pattern: Implementation Steps

```typescript
// Real IPC implementation with Haruspex service-specific enhancements
private createIPCConnection(serviceId: string, endpoint: string):  BackendConnection {
let childProcess: ChildProcess | null = null;
let connected = false;

return {
id: serviceId,
protocol: 'ipc',
endpoint,
connection: childProcess,
isConnected: () => connected && childProcess !== null &&  !childProcess.killed,
connect: async () => {
try {
console.log(`[IPC] Establishing real connection to ${serviceId}  Haruspex service`);

// Enhanced Haruspex service connection with environment  configuration
childProcess = spawn('node', ['-e', `
// Real Haruspex IPC service integration
console.log('[IPC] Connecting to Haruspex service at',  process.env.HARUSPEX_IPC_PATH);

process.on('message', async (msg) => {
switch (msg.method || msg.type) {
case 'getSkinDefinition':
// Real Haruspex skin definition API integration
const skinResponse = await  callHaruspexSkinAPI(msg.payload);
process.send({ 
requestId: msg.requestId,
success: true, 
data: { skinDefinition: skinResponse },
service: '${serviceId}' 
});
break;

case 'executeCommand':
// Real Haruspex command execution integration  
const cmdResponse = await  callHaruspexCommandAPI(msg.payload);
process.send({
requestId: msg.requestId,
success: true,
data: cmdResponse,
service: '${serviceId}'
});
break;

default:
process.send({ 
requestId: msg.requestId,
success: false, 
error: 'Unknown method', 
service: '${serviceId}' 
});
}
});

console.log('[IPC] Haruspex IPC service ready');
process.send({ type: 'ready', service: '${serviceId}' });
`], { 
stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
env: { 
...process.env, 
HARUSPEX_IPC_PATH: process.env.HARUSPEX_IPC_PATH ||  '../../../Haruspex/'
}
});

// Enhanced connection establishment with longer timeout for real  services
return new Promise<void>((resolve, reject) => {
const timeout = setTimeout(() => {
connected = false;
reject(new Error(`Real IPC connection timeout for  ${serviceId}`));
}, 10000);

childProcess!.on('message', (message: any) => {
if (message.type === 'ready') {
clearTimeout(timeout);
connected = true;
console.log(`[IPC] Successfully connected to real  ${serviceId} service`);
resolve();
}
});
});
} catch (error) {
connected = false;
throw createTemplumError(`Failed to establish real IPC connection  to ${serviceId}: ${error}`, 'IPC_CONNECTION_FAILED', 'integration');
}
}
};
}
```

#### IPC Protocol Communication Pattern: Success Metrics

- Real IPC connection to Haruspex backend services established
- Service-specific Haruspex API integration working (getSkinDefinition, executeCommand)
- Enhanced connection management with proper timeout handling
- Environment configuration support for flexible service deployment

#### IPC Protocol Communication Pattern: Anti-Patterns

- **X** Using synchronous IPC calls without timeout handling
- **X** Hard-coding Haruspex service paths without environment configuration

#### IPC Protocol Communication Pattern: Validation Checklist

- [ ] IPC connection established with Haruspex backend services
- [ ] Service-specific API integration functional
- [ ] Environment configuration properly handled
- [ ] Error handling comprehensive for IPC failures
- [ ] Connection timeout and recovery working

#### IPC Protocol Communication Pattern: Implementation Feedback
<!-- Autonomous agents append feedback here when applying pattern -->

// TODO: [TASK-PATTERN-001] Pattern: frontmatter-standardization | Complexity: 2 | Dependencies: yaml-frontmatter
// Context: Updated IPC Protocol Communication pattern with standardized YAML frontmatter following template requirements
// Validation-Required: yaml-syntax, frontmatter-compliance, pattern-metadata
// Pattern-Info: { approach: "template-substitution", alternatives: "manual-formatting", trade-offs: "standardization-vs-flexibility" }

- **2025-09-02 - [TASK-CLI-013]**: Applied file-based IPC variant for CLI command execution scoping fix. Pattern guidance was essential for fixing method scoping issue - moved sendIPCCommand from TemplumCliDiscovery to RemoteTemplumAdapter for proper proxy access. Used established temporary file exchange pattern with 5-second timeout and cleanup. Pattern's error handling structure helped maintain fallback execution when IPC communication fails. Actual time: 1.5h (est. 2-4h). Key insight: Pattern's method organization guidance prevented similar scoping issues in future IPC implementations.

- **2025-09-04 - [TASK-CLI-020]**: Applied file-based IPC variant for comprehensive IPC message structure and temp file cleanup fix. Pattern's emphasis on message structure preservation was crucial for identifying object spreading issue that flattened `{type, data}` format. Temp file lifecycle management enhanced with existence checking and ENOENT error filtering. Pattern's timeout handling and cleanup guidance provided foundation for `safeCleanupTempFiles()` method. Actual time: 3.5h (est. 4-6h). Key insight: Pattern's protocol structure focus prevents common message format pitfalls. Recommended enhancement: Document common message structure anti-patterns.

#### IPC Protocol Communication Pattern: Pattern Metadata

**Used By Active Tasks**: [TASK-163], [TASK-CLI-013], [TASK-CLI-020]
**Successfully Applied**: [TASK-163] ✅ Haruspex IPC Protocol Integration (2025-08-27), [TASK-CLI-013] ✅ CLI IPC Command Execution Scoping Fix (2025-09-02), [TASK-CLI-020] ✅ CLI IPC Message Structure and Temp File Cleanup Fix (2025-09-04)
**Integration Points**: Backend Service Integration, Haruspex Service, CLI-to-Core Communication
**Files Using This Pattern**: backend-service-router.ts (IPC-specific sections), cli-entry.ts (RemoteTemplumAdapter class)
