"use strict";
/**---
 * title: [Enhanced Logue Wrapper - Utility Functions Module]
 * tags: [Utility, Logging, Process-Management, Testing]
 * provides: [EnhancedLogue Class, enhancedLogue Function, Process Cleanup Hooks]
 * requires: [logue Library, Node.js Child Process Streams]
 * description: [Wraps logue to add robust process and stream cleanup to prevent hanging tests and ensure safe CLI automation]
 * ---*/
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedLogue = void 0;
exports.enhancedLogue = enhancedLogue;
const logue_1 = __importDefault(require("logue"));
class EnhancedLogue {
    constructor(command, args = []) {
        this.cleanupHandlers = [];
        this.logueInstance = (0, logue_1.default)(command, args);
        // Access internal child process for cleanup management
        this.childProcess = this.logueInstance.proc;
        // Setup cleanup handlers
        this.setupCleanupHandlers();
    }
    setupCleanupHandlers() {
        // Store original event listeners for cleanup
        const exitHandler = () => {
            this.performCleanup();
        };
        this.childProcess.on('exit', exitHandler);
        this.cleanupHandlers.push(() => {
            this.childProcess.removeListener('exit', exitHandler);
        });
    }
    performCleanup() {
        try {
            // Clean up stdio streams
            if (this.childProcess.stdout && !this.childProcess.stdout.destroyed) {
                this.childProcess.stdout.destroy();
            }
            if (this.childProcess.stderr && !this.childProcess.stderr.destroyed) {
                this.childProcess.stderr.destroy();
            }
            if (this.childProcess.stdin && !this.childProcess.stdin.destroyed) {
                this.childProcess.stdin.destroy();
            }
            // Remove all event listeners
            this.childProcess.removeAllListeners();
            // Force disconnect if connected
            if (this.childProcess.connected) {
                this.childProcess.disconnect();
            }
            // Execute cleanup handlers
            this.cleanupHandlers.forEach(handler => {
                try {
                    handler();
                }
                catch (error) {
                    console.warn('Cleanup handler error:', error);
                }
            });
            this.cleanupHandlers = [];
        }
        catch (error) {
            console.warn('Process cleanup error:', error);
        }
    }
    async waitFor(matcher) {
        await this.logueInstance.waitFor(matcher);
        return this;
    }
    input(text) {
        this.logueInstance.input(text);
        return this;
    }
    get stdout() {
        return this.logueInstance.stdout;
    }
    async end() {
        try {
            // Use timeout approach but also force cleanup
            const result = await Promise.race([
                this.logueInstance.end(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Enhanced logue timeout')), 5000))
            ]);
            // Successful completion - still perform cleanup
            this.performCleanup();
            return result;
        }
        catch (error) {
            // Timeout occurred - force cleanup and return collected output
            this.performCleanup();
            return {
                status: 'timeout',
                stdout: this.logueInstance.stdout,
                line: this.logueInstance.line
            };
        }
    }
}
exports.EnhancedLogue = EnhancedLogue;
/**
 * Enhanced logue function with proper cleanup
 */
function enhancedLogue(command, args = []) {
    return new EnhancedLogue(command, args);
}
//# sourceMappingURL=logue-wrapper.js.map