#!/usr/bin/env node
/**
 * Phoenix Code Lite - Unified Architecture Entry Point
 * Created: 2025-01-06-175700
 *
 * New main entry point that integrates the CLI Interaction Decoupling Architecture
 * with the existing foundation infrastructure.
 */
import { setupCLI } from './cli/args';
import { CoreFoundation } from './core/foundation';
import { ConfigManager } from './core/config-manager';
import { ErrorHandler } from './core/error-handler';
import { initializeUnifiedPhoenixCLI } from './unified-cli';
export { setupCLI, CoreFoundation, ConfigManager, ErrorHandler, initializeUnifiedPhoenixCLI };
//# sourceMappingURL=index-unified.d.ts.map