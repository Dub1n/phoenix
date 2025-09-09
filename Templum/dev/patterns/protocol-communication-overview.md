### Protocol Communication Overview Pattern

**Status**: ESTABLISHED
**Category**: Technical
**Last Updated**: 2025-08-27
**Difficulty**: 🔴 Expert
**Est. Time**: ~9 hours (3 hours per protocol)
**Prerequisites**: Backend Service Integration, Generic Connection Factory

**Problem**: Mock protocol implementations preventing real backend service integration and communication.

**Solution**: Complete real protocol communication implemented through three specialized patterns for different backend services.

#### Protocol Communication Overview Pattern: Implementation Approach

This pattern has been split into three specialized protocol patterns:

1. **[IPC Protocol Communication Pattern](@ipc-protocol-communication-pattern)** - Haruspex integration via IPC
2. **[HTTP Protocol Communication Pattern](@http-protocol-communication-pattern)** - PCL integration via HTTP
3. **[WebSocket Protocol Communication Pattern](@websocket-protocol-communication-pattern)** - Litany integration via WebSocket

Each pattern provides service-specific enhancements, error handling, and integration details tailored to the specific backend and communication requirements.

#### Protocol Communication Overview Pattern: Success Metrics

- Real IPC, HTTP, WebSocket implementation with service-specific patterns achieved
- Mock protocol implementations replaced with real backend service integration  
- Service-specific enhancements implemented for each protocol
- Graceful fallback coordination and comprehensive error handling working

#### Protocol Communication Overview Pattern: Anti-Patterns

- **X** Using generic protocol implementations without service-specific optimizations
- **X** Mixing protocol-specific code in shared components

#### Protocol Communication Overview Pattern: Validation Checklist

- [ ] All three protocol patterns implemented and validated
- [ ] Service-specific enhancements working for each protocol
- [ ] Cross-protocol fallback mechanisms functional

#### Protocol Communication Overview Pattern: Implementation Feedback
<!-- Autonomous agents append feedback here when applying pattern -->

- **2025-09-02 - [TASK-CLI-010]**: Applied file-based IPC variant for CLI-to-Core communication successfully. Used temporary file exchange pattern with 5-second timeout and cleanup. Required extending pattern for process-independent IPC (CLI/Core run separately vs parent-child). Pattern worked well - actual time: 3h (est. 4-6h). File-based approach more reliable than Node.js child_process IPC for independent processes.

#### Protocol Communication Overview Pattern: Pattern Metadata

**Used By Active Tasks**: [TASK-163], [TASK-CLI-010]
**Successfully Applied**: [TASK-163] ✅ Backend Service Protocol Communication (2025-08-27), [TASK-CLI-010] ✅ CLI-to-Core IPC Communication (2025-09-02)
**Integration Points**: Backend Service Integration, Universal Interface Orchestration, Unified Type System
**Files Using This Pattern**: backend-service-router.ts, cli-entry.ts, templum-core.ts
