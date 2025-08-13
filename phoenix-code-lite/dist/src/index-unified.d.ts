#!/usr/bin/env node
/**---
 * title: [Phoenix Code Lite - Unified Architecture Entry Point]
 * tags: [Core, Infrastructure, Entry-Point, Unified-Architecture]
 * provides: [Unified CLI Bootstrap, Legacy Mode Bridge, Core Initialization, Unified CLI Launcher]
 * requires: [CoreFoundation, ConfigManager, ErrorHandler, unified-cli, CLI Args]
 * description: [Entry point for running Phoenix Code Lite with the unified architecture, including fallback to legacy initialization; coordinates core setup and unified CLI execution.]
 * ---*/
import { setupCLI } from './cli/args';
import { CoreFoundation } from './core/foundation';
import { ConfigManager } from './core/config-manager';
import { ErrorHandler } from './core/error-handler';
import { initializeUnifiedPhoenixCLI } from './unified-cli';
export { setupCLI, CoreFoundation, ConfigManager, ErrorHandler, initializeUnifiedPhoenixCLI };
//# sourceMappingURL=index-unified.d.ts.map