#!/usr/bin/env node
/**---
 * title: [Phoenix Code Lite - Dependency Injection Entry Point]
 * tags: [Core, Infrastructure, Entry-Point, Dependency-Injection]
 * provides: [DI Bootstrap, Dependency Wiring, Interactive Session Startup, Command Dispatch]
 * requires: [CoreFoundation, ConfigManager, ErrorHandler, CommandFactory, InteractiveSession, ClaudeCodeClient, AuditLogger, FileSystem]
 * description: [Main entry point that boots the system using dependency injection patterns to wire core services and CLI components; supports interactive and command modes]
 * ---*/
import { setupCLI } from './cli/args';
import { CoreFoundation } from './core/foundation';
import { ConfigManager } from './core/config-manager';
import { ErrorHandler } from './core/error-handler';
export { setupCLI, CoreFoundation, ConfigManager, ErrorHandler };
//# sourceMappingURL=index-di.d.ts.map