/**
 * 🐝 HIVEMIND Security Manager
 *
 * Handles all security-related operations:
 * - Validation of tasks and inputs
 * - Resource limit enforcement
 * - Sandboxed execution
 * - Security audits and logging
 */
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
/**
 * Security Audit Logger
 */
export class SecurityAuditor {
    logs = [];
    logPath;
    constructor() {
        const logDir = path.join(os.homedir(), '.hivemind', 'logs');
        fs.mkdirSync(logDir, { recursive: true });
        this.logPath = path.join(logDir, 'security-audit.log');
    }
    log(event, severity, details) {
        const audit = {
            timestamp: new Date(),
            event,
            severity,
            details: this.sanitizeDetails(details),
            hash: this.generateHash(event + JSON.stringify(details))
        };
        this.logs.push(audit);
        // Write to file
        fs.appendFileSync(this.logPath, JSON.stringify(audit) + '\n');
        // Console output for critical events
        if (severity === 'critical') {
            console.error(`[SECURITY] [CRITICAL] ${event}`);
        }
    }
    sanitizeDetails(details) {
        // Remove sensitive information from logs
        const sanitized = { ...details };
        const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential'];
        for (const key of Object.keys(sanitized)) {
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
                sanitized[key] = '[REDACTED]';
            }
        }
        return sanitized;
    }
    generateHash(data) {
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
    }
    getRecentLogs(count = 100) {
        return this.logs.slice(-count);
    }
    getLogsBySeverity(severity) {
        return this.logs.filter(log => log.severity === severity);
    }
    exportLogs(startDate, endDate) {
        return this.logs.filter(log => log.timestamp >= startDate && log.timestamp <= endDate);
    }
}
/**
 * Task Validator
 */
export class TaskValidator {
    MAX_INPUT_SIZE = 1024 * 1024; // 1MB
    SUSPICIOUS_PATTERNS = [
        /\beval\s*\(/i,
        /\bexec\s*\(/i,
        /\bsystem\s*\(/i,
        /\bpopen\s*\(/i,
        /\bshell_exec/i,
        /\bpassthru/i,
        /\$\(/, // Command injection
        /`[^`]+`/, // Backtick command execution
        /<\?php/i, // PHP code
        /<script[^>]*>/i, // Script tags
        /javascript:/i, // JavaScript protocol
        /on\w+\s*=/i, // Event handlers
    ];
    validateInput(input) {
        const errors = [];
        const warnings = [];
        // Check for suspicious patterns in string inputs
        if (typeof input === 'string') {
            for (const pattern of this.SUSPICIOUS_PATTERNS) {
                if (pattern.test(input)) {
                    errors.push(`Suspicious pattern detected: ${pattern.source}`);
                }
            }
        }
        // Check input size
        const inputSize = Buffer.byteLength(JSON.stringify(input));
        if (inputSize > this.MAX_INPUT_SIZE) {
            errors.push(`Input too large: ${inputSize} bytes (max: ${this.MAX_INPUT_SIZE})`);
        }
        // Validate task structure
        if (input && typeof input === 'object') {
            const typedInput = input;
            if (!typedInput.type) {
                errors.push('Task type is required');
            }
            if (typedInput.type && !['inference', 'embedding', 'tokenization'].includes(typedInput.type)) {
                errors.push(`Invalid task type: ${typedInput.type}`);
            }
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings,
            auditHash: crypto.createHash('sha256')
                .update(JSON.stringify(input))
                .digest('hex')
                .substring(0, 16)
        };
    }
    /**
     * Verify task signature (if required)
     */
    verifySignature(data, signature, publicKey) {
        // In production, implement proper signature verification
        // This is a placeholder
        try {
            const verifier = crypto.createVerify('RSA-SHA256');
            verifier.update(JSON.stringify(data));
            return verifier.verify(publicKey, Buffer.from(signature, 'hex'));
        }
        catch {
            return false;
        }
    }
}
/**
 * Resource Enforcer
 */
export class ResourceEnforcer {
    policy;
    currentUsage;
    constructor(policy = {}) {
        this.policy = {
            maxMemoryMB: policy.maxMemoryMB || 4096,
            maxCPUPercent: policy.maxCPUPercent || 70,
            maxTaskDurationMs: policy.maxTaskDurationMs || 300000, // 5 minutes
            maxConcurrentTasks: policy.maxConcurrentTasks || 2,
            allowNetworkAccess: policy.allowNetworkAccess ?? false,
            allowFileSystemAccess: policy.allowFileSystemAccess ?? false,
            allowGPUAccess: policy.allowGPUAccess ?? false,
            requireSignatureVerification: policy.requireSignatureVerification ?? false
        };
        this.currentUsage = {
            memoryMB: 0,
            cpuPercent: 0,
            activeTasks: 0
        };
    }
    canExecuteTask(taskMemoryMB, taskDurationMs) {
        // Check memory
        if (this.currentUsage.memoryMB + taskMemoryMB > this.policy.maxMemoryMB) {
            return { allowed: false, reason: 'Memory limit would be exceeded' };
        }
        // Check concurrent tasks
        if (this.currentUsage.activeTasks >= this.policy.maxConcurrentTasks) {
            return { allowed: false, reason: 'Maximum concurrent tasks reached' };
        }
        // Check duration
        if (taskDurationMs > this.policy.maxTaskDurationMs) {
            return { allowed: false, reason: 'Task duration exceeds limit' };
        }
        return { allowed: true };
    }
    allocateResources(memoryMB) {
        this.currentUsage.memoryMB += memoryMB;
        this.currentUsage.activeTasks++;
    }
    releaseResources(memoryMB) {
        this.currentUsage.memoryMB = Math.max(0, this.currentUsage.memoryMB - memoryMB);
        this.currentUsage.activeTasks = Math.max(0, this.currentUsage.activeTasks - 1);
    }
    getPolicy() {
        return { ...this.policy };
    }
    getCurrentUsage() {
        return { ...this.currentUsage };
    }
}
/**
 * Main Security Manager
 */
export class SecurityManager {
    auditor;
    validator;
    enforcer;
    policy;
    constructor(policy) {
        this.auditor = new SecurityAuditor();
        this.validator = new TaskValidator();
        this.enforcer = new ResourceEnforcer(policy);
        this.policy = this.enforcer.getPolicy();
        this.auditor.log('SecurityManager initialized', 'info', {
            policy: this.policy
        });
    }
    /**
     * Validate and prepare a task for execution
     */
    prepareTask(input, estimatedMemoryMB, estimatedDurationMs) {
        // Validate input
        const validation = this.validator.validateInput(input);
        if (!validation.valid) {
            this.auditor.log('Task validation failed', 'warning', {
                errors: validation.errors,
                inputHash: validation.auditHash
            });
            return {
                canExecute: false,
                reason: validation.errors.join('; '),
                auditHash: validation.auditHash
            };
        }
        // Check resources
        const resourceCheck = this.enforcer.canExecuteTask(estimatedMemoryMB, estimatedDurationMs);
        if (!resourceCheck.allowed) {
            this.auditor.log('Resource check failed', 'warning', {
                reason: resourceCheck.reason,
                currentUsage: this.enforcer.getCurrentUsage()
            });
            return {
                canExecute: false,
                reason: resourceCheck.reason,
                auditHash: validation.auditHash
            };
        }
        // All checks passed
        this.auditor.log('Task approved for execution', 'info', {
            inputHash: validation.auditHash,
            estimatedMemoryMB,
            estimatedDurationMs
        });
        return {
            canExecute: true,
            auditHash: validation.auditHash
        };
    }
    /**
     * Start executing a task
     */
    startTask(auditHash, memoryMB) {
        this.enforcer.allocateResources(memoryMB);
        this.auditor.log('Task execution started', 'info', {
            auditHash,
            memoryAllocatedMB: memoryMB
        });
    }
    /**
     * Complete a task
     */
    completeTask(auditHash, memoryMB, success) {
        this.enforcer.releaseResources(memoryMB);
        this.auditor.log(success ? 'Task completed successfully' : 'Task failed', success ? 'info' : 'warning', {
            auditHash,
            memoryReleasedMB: memoryMB
        });
    }
    /**
     * Get security status
     */
    getStatus() {
        return {
            policy: this.policy,
            usage: this.enforcer.getCurrentUsage(),
            recentLogs: this.auditor.getRecentLogs(10)
        };
    }
    /**
     * Export security report
     */
    exportReport(startDate, endDate) {
        return {
            period: { start: startDate, end: endDate },
            policy: this.policy,
            logs: this.auditor.exportLogs(startDate, endDate)
        };
    }
}
//# sourceMappingURL=manager.js.map