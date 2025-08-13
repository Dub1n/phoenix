"use strict";
/**---
 * title: [Core Infrastructure Exports - Index]
 * tags: [Core, Infrastructure, Exports, Validation]
 * provides: [Centralized Core Exports, CoreInfrastructure Utils, Types]
 * requires: [Core Modules: foundation, session-manager, mode-manager, config-manager, error-handler]
 * description: [Aggregates and re-exports Phase 1 core infrastructure modules and provides environment validation and system info utilities]
 * ---*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreInfrastructure = exports.ErrorCategory = exports.ErrorSeverity = exports.ErrorHandler = exports.ConfigTemplates = exports.ConfigManager = exports.ModeManager = exports.SessionManager = exports.CoreFoundation = void 0;
var foundation_1 = require("./foundation");
Object.defineProperty(exports, "CoreFoundation", { enumerable: true, get: function () { return foundation_1.CoreFoundation; } });
var session_manager_1 = require("./session-manager");
Object.defineProperty(exports, "SessionManager", { enumerable: true, get: function () { return session_manager_1.SessionManager; } });
var mode_manager_1 = require("./mode-manager");
Object.defineProperty(exports, "ModeManager", { enumerable: true, get: function () { return mode_manager_1.ModeManager; } });
var config_manager_1 = require("./config-manager");
Object.defineProperty(exports, "ConfigManager", { enumerable: true, get: function () { return config_manager_1.ConfigManager; } });
Object.defineProperty(exports, "ConfigTemplates", { enumerable: true, get: function () { return config_manager_1.ConfigTemplates; } });
var error_handler_1 = require("./error-handler");
Object.defineProperty(exports, "ErrorHandler", { enumerable: true, get: function () { return error_handler_1.ErrorHandler; } });
Object.defineProperty(exports, "ErrorSeverity", { enumerable: true, get: function () { return error_handler_1.ErrorSeverity; } });
Object.defineProperty(exports, "ErrorCategory", { enumerable: true, get: function () { return error_handler_1.ErrorCategory; } });
/**
 * Core infrastructure validation and health checks
 */
class CoreInfrastructure {
    static async validateEnvironment() {
        const issues = [];
        const recommendations = [];
        // Check Node.js version
        const nodeVersion = process.version;
        const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
        if (majorVersion < 18) {
            issues.push(`Node.js version ${nodeVersion} is below minimum required version 18`);
            recommendations.push('Upgrade to Node.js 18 or higher');
        }
        // Check memory availability
        const memoryUsage = process.memoryUsage();
        const availableMemory = memoryUsage.heapTotal;
        if (availableMemory < 100 * 1024 * 1024) { // Less than 100MB
            issues.push('Low memory availability detected');
            recommendations.push('Ensure at least 200MB of available memory');
        }
        // Check file system permissions
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            await fs.access('./', fs.constants.R_OK | fs.constants.W_OK);
        }
        catch (error) {
            issues.push('File system access permissions insufficient');
            recommendations.push('Ensure read/write permissions for current directory');
        }
        // Check for required dependencies
        try {
            await Promise.resolve().then(() => __importStar(require('zod')));
            await Promise.resolve().then(() => __importStar(require('chalk')));
            await Promise.resolve().then(() => __importStar(require('uuid')));
        }
        catch (error) {
            issues.push('Required dependencies missing');
            recommendations.push('Run npm install to install missing dependencies');
        }
        return {
            valid: issues.length === 0,
            issues,
            recommendations
        };
    }
    static getSystemInfo() {
        return {
            nodeVersion: process.version,
            platform: process.platform,
            architecture: process.arch,
            memoryUsage: process.memoryUsage(),
            uptime: process.uptime(),
            versions: process.versions
        };
    }
}
exports.CoreInfrastructure = CoreInfrastructure;
//# sourceMappingURL=index.js.map