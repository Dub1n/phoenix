/**
 * File-Based Handoff Communication Types
 *
 * Core TypeScript interfaces for subagent workflow handoff communication.
 * Implements TASK-SUBAGENT-001 foundational infrastructure.
 *
 * @created 2025-09-05-1824
 * @source dev/auto/subagent-workflow-integration-design.md lines 236-281
 */
/**
 * Error types for handoff system
 */
export var HandoffErrorType;
(function (HandoffErrorType) {
    HandoffErrorType["FILE_ACCESS_ERROR"] = "file_access_error";
    HandoffErrorType["VALIDATION_ERROR"] = "validation_error";
    HandoffErrorType["TIMEOUT_ERROR"] = "timeout_error";
    HandoffErrorType["AGENT_UNAVAILABLE"] = "agent_unavailable";
    HandoffErrorType["CLEANUP_ERROR"] = "cleanup_error";
    HandoffErrorType["SCHEMA_VALIDATION_ERROR"] = "schema_validation_error";
})(HandoffErrorType || (HandoffErrorType = {}));
