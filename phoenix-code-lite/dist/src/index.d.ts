#!/usr/bin/env node
/**---
 * title: [Phoenix Code Lite - Phase 1 Core Infrastructure]
 * tags: [Assistant, Behavior, Riley, Personality, Guidelines]
 * provides: [Riley Personality Definition, DSS Behaviors, Response Style Standards, Frontmatter Management,   Decision Making Framework]
 * requires: [DSS Core Structure and Concepts]
 * description: [This is the main entry point that initializes the core foundation including session management, dual mode architecture, configuration management, and comprehensive error handling]
 * ---*/
import { setupCLI } from './cli/args';
import { CoreFoundation } from './core/foundation';
import { ConfigManager } from './core/config-manager';
import { ErrorHandler } from './core/error-handler';
export { setupCLI, CoreFoundation, ConfigManager, ErrorHandler };
//# sourceMappingURL=index.d.ts.map