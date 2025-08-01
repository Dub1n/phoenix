"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureClaudeCodeClient = exports.SecurityGuardrailsManager = void 0;
class SecurityGuardrailsManager {
    constructor(customPolicy) {
        this.defaultPolicy = {
            allowedPaths: [
                './src/**',
                './tests/**',
                './docs/**',
                './scripts/**',
                './*.json',
                './*.md',
                './*.yml',
                './*.yaml'
            ],
            blockedPaths: [
                '/etc/**',
                '/usr/**',
                '/bin/**',
                '~/.ssh/**',
                '~/.aws/**',
                '**/node_modules/**',
                '**/.git/**',
                '**/.env*',
                '**/secrets/**',
                '**/private/**'
            ],
            allowedCommands: [
                'npm',
                'yarn',
                'node',
                'tsc',
                'jest',
                'eslint',
                'prettier',
                'git',
                'ls',
                'cat',
                'echo',
                'pwd',
                'which',
                'grep',
                'find'
            ],
            blockedCommands: [
                'rm',
                'rmdir',
                'del',
                'sudo',
                'su',
                'chmod',
                'chown',
                'curl',
                'wget',
                'ssh',
                'scp',
                'rsync',
                'dd',
                'format',
                'fdisk',
                'mount',
                'umount'
            ],
            maxFileSize: 10 * 1024 * 1024, // 10MB
            maxExecutionTime: 30 * 1000, // 30 seconds
            requireApproval: false,
            auditAll: true
        };
        this.auditLog = [];
        this.sessionId = `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (customPolicy) {
            this.defaultPolicy = { ...this.defaultPolicy, ...customPolicy };
        }
    }
    async validateFileAccess(filePath, action, context) {
        const violations = [];
        // Normalize path for consistent checking
        const normalizedPath = this.normalizePath(filePath);
        // Check against blocked paths
        const isBlocked = this.defaultPolicy.blockedPaths.some(blocked => this.matchPath(normalizedPath, blocked));
        if (isBlocked) {
            violations.push({
                type: 'path_violation',
                severity: 'high',
                description: `Access to blocked path: ${filePath}`,
                requestedAction: `file_${action}`,
                policy: 'blocked_paths',
                timestamp: new Date()
            });
        }
        // Check against allowed paths (if not blocked)
        if (!isBlocked) {
            const isAllowed = this.defaultPolicy.allowedPaths.some(allowed => this.matchPath(normalizedPath, allowed));
            if (!isAllowed) {
                violations.push({
                    type: 'path_violation',
                    severity: 'medium',
                    description: `Access to non-whitelisted path: ${filePath}`,
                    requestedAction: `file_${action}`,
                    policy: 'allowed_paths',
                    timestamp: new Date()
                });
            }
        }
        // Log the access attempt
        await this.logSecurityEvent({
            sessionId: this.sessionId,
            timestamp: new Date(),
            action: `file_${action}`,
            target: filePath,
            approved: violations.length === 0,
            violations,
            metadata: { context: context?.taskDescription }
        });
        return {
            allowed: violations.length === 0,
            violations
        };
    }
    async validateCommandExecution(command, context) {
        const violations = [];
        // Extract base command (first word)
        const baseCommand = command.trim().split(/\s+/)[0];
        // Check against blocked commands
        const isBlocked = this.defaultPolicy.blockedCommands.includes(baseCommand);
        if (isBlocked) {
            violations.push({
                type: 'command_violation',
                severity: 'critical',
                description: `Attempt to execute blocked command: ${baseCommand}`,
                requestedAction: 'command_exec',
                policy: 'blocked_commands',
                timestamp: new Date()
            });
        }
        // Check against allowed commands (if not blocked)
        if (!isBlocked) {
            const isAllowed = this.defaultPolicy.allowedCommands.includes(baseCommand);
            if (!isAllowed) {
                violations.push({
                    type: 'command_violation',
                    severity: 'high',
                    description: `Attempt to execute non-whitelisted command: ${baseCommand}`,
                    requestedAction: 'command_exec',
                    policy: 'allowed_commands',
                    timestamp: new Date()
                });
            }
        }
        // Check for dangerous patterns
        const dangerousPatterns = [
            /rm\s+-rf/, // Force delete
            /chmod\s+777/, // Dangerous permissions
            />\s*\/dev/, // Device access
            /curl.*\|\s*sh/, // Pipe to shell
            /wget.*\|\s*sh/, // Pipe to shell
            /sudo\s+/, // Privilege escalation
        ];
        if (dangerousPatterns.some(pattern => pattern.test(command))) {
            violations.push({
                type: 'command_violation',
                severity: 'critical',
                description: `Command contains dangerous patterns: ${command}`,
                requestedAction: 'command_exec',
                policy: 'dangerous_patterns',
                timestamp: new Date()
            });
        }
        // Log the command attempt
        await this.logSecurityEvent({
            sessionId: this.sessionId,
            timestamp: new Date(),
            action: 'command_exec',
            target: command,
            approved: violations.length === 0,
            violations,
            metadata: { context: context?.taskDescription }
        });
        return {
            allowed: violations.length === 0,
            violations
        };
    }
    async validateFileSize(filePath, size) {
        const violations = [];
        if (size > this.defaultPolicy.maxFileSize) {
            violations.push({
                type: 'size_violation',
                severity: 'medium',
                description: `File size ${size} bytes exceeds limit of ${this.defaultPolicy.maxFileSize} bytes`,
                requestedAction: 'file_write',
                policy: 'max_file_size',
                timestamp: new Date()
            });
        }
        return {
            allowed: violations.length === 0,
            violations
        };
    }
    async requireApproval(action, target) {
        if (!this.defaultPolicy.requireApproval) {
            return true;
        }
        console.log('\n🔒 SECURITY APPROVAL REQUIRED:');
        console.log('═══════════════════════════════════');
        console.log(`Action: ${action}`);
        console.log(`Target: ${target}`);
        console.log('Session:', this.sessionId);
        console.log('═══════════════════════════════════');
        console.log('⚠️ Manual approval required for security compliance');
        console.log('In production, this would pause for user confirmation.');
        console.log('═══════════════════════════════════\n');
        // In production, this would implement interactive approval
        return true; // Auto-approve for development
    }
    getSecurityReport() {
        const allViolations = this.auditLog.flatMap(log => log.violations);
        const criticalCount = allViolations.filter(v => v.severity === 'critical').length;
        const highCount = allViolations.filter(v => v.severity === 'high').length;
        const mediumCount = allViolations.filter(v => v.severity === 'medium').length;
        const lowCount = allViolations.filter(v => v.severity === 'low').length;
        const summary = `Security Report: ${allViolations.length} violations (${criticalCount} critical, ${highCount} high, ${mediumCount} medium, ${lowCount} low)`;
        return {
            violations: allViolations,
            auditCount: this.auditLog.length,
            sessionId: this.sessionId,
            summary
        };
    }
    async logSecurityEvent(event) {
        this.auditLog.push(event);
        // In production, this would write to secure audit log
        if (this.defaultPolicy.auditAll) {
            console.log(`🔒 Security Audit: ${event.action} on ${event.target} - ${event.approved ? 'APPROVED' : 'DENIED'}`);
            if (event.violations.length > 0) {
                console.log(`   Violations: ${event.violations.map(v => `${v.severity}: ${v.description}`).join(', ')}`);
            }
        }
    }
    normalizePath(path) {
        // Convert to forward slashes and resolve relative paths
        return path.replace(/\\/g, '/').replace(/\/+/g, '/');
    }
    matchPath(path, pattern) {
        // Convert glob pattern to regex
        const regexPattern = pattern
            .replace(/\*\*/g, '__DOUBLE_STAR__')
            .replace(/\*/g, '[^/]*')
            .replace(/__DOUBLE_STAR__/g, '.*')
            .replace(/\./g, '\\.');
        const regex = new RegExp(`^${regexPattern}$`);
        return regex.test(path);
    }
}
exports.SecurityGuardrailsManager = SecurityGuardrailsManager;
// Security-enhanced Claude Code Client
class SecureClaudeCodeClient {
    constructor(securityPolicy) {
        this.securityManager = new SecurityGuardrailsManager(securityPolicy);
    }
    async secureFileRead(filePath, context) {
        const validation = await this.securityManager.validateFileAccess(filePath, 'read', context);
        if (!validation.allowed) {
            const violations = validation.violations.map(v => v.description).join(', ');
            throw new Error(`Security violation - file read blocked: ${violations}`);
        }
        // Require approval for sensitive operations
        const approved = await this.securityManager.requireApproval('file_read', filePath);
        if (!approved) {
            throw new Error('File read operation not approved');
        }
        // Proceed with actual file read (would integrate with Claude Code SDK)
        throw new Error('Secure file read implementation pending - Phase 2 implementation in progress');
    }
    async secureFileWrite(filePath, content, context) {
        const accessValidation = await this.securityManager.validateFileAccess(filePath, 'write', context);
        const sizeValidation = await this.securityManager.validateFileSize(filePath, content.length);
        const allViolations = [...accessValidation.violations, ...sizeValidation.violations];
        if (allViolations.length > 0) {
            const violations = allViolations.map(v => v.description).join(', ');
            throw new Error(`Security violation - file write blocked: ${violations}`);
        }
        // Require approval for write operations
        const approved = await this.securityManager.requireApproval('file_write', filePath);
        if (!approved) {
            throw new Error('File write operation not approved');
        }
        // Proceed with actual file write (would integrate with Claude Code SDK)
        throw new Error('Secure file write implementation pending - Phase 2 implementation in progress');
    }
    async secureCommandExecution(command, context) {
        const validation = await this.securityManager.validateCommandExecution(command, context);
        if (!validation.allowed) {
            const violations = validation.violations.map(v => v.description).join(', ');
            throw new Error(`Security violation - command execution blocked: ${violations}`);
        }
        // Require approval for command execution
        const approved = await this.securityManager.requireApproval('command_exec', command);
        if (!approved) {
            throw new Error('Command execution not approved');
        }
        // Proceed with actual command execution (would integrate with Claude Code SDK)
        throw new Error('Secure command execution implementation pending - Phase 2 implementation in progress');
    }
    getSecurityReport() {
        return this.securityManager.getSecurityReport();
    }
}
exports.SecureClaudeCodeClient = SecureClaudeCodeClient;
//# sourceMappingURL=guardrails.js.map