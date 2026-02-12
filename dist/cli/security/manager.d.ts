/**
 * 🐝 HIVEMIND Security Manager
 *
 * Handles all security-related operations:
 * - Validation of tasks and inputs
 * - Resource limit enforcement
 * - Sandboxed execution
 * - Security audits and logging
 */
export interface SecurityPolicy {
    maxMemoryMB: number;
    maxCPUPercent: number;
    maxTaskDurationMs: number;
    maxConcurrentTasks: number;
    allowNetworkAccess: boolean;
    allowFileSystemAccess: boolean;
    allowGPUAccess: boolean;
    requireSignatureVerification: boolean;
}
export interface SecurityAudit {
    timestamp: Date;
    event: string;
    severity: 'info' | 'warning' | 'critical';
    details: any;
    hash?: string;
}
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    auditHash: string;
}
/**
 * Security Audit Logger
 */
export declare class SecurityAuditor {
    private logs;
    private logPath;
    constructor();
    log(event: string, severity: SecurityAudit['severity'], details: any): void;
    private sanitizeDetails;
    private generateHash;
    getRecentLogs(count?: number): SecurityAudit[];
    getLogsBySeverity(severity: SecurityAudit['severity']): SecurityAudit[];
    exportLogs(startDate: Date, endDate: Date): SecurityAudit[];
}
/**
 * Task Validator
 */
export declare class TaskValidator {
    private readonly MAX_INPUT_SIZE;
    private readonly SUSPICIOUS_PATTERNS;
    validateInput(input: any): ValidationResult;
    /**
     * Verify task signature (if required)
     */
    verifySignature(data: any, signature: string, publicKey: string): boolean;
}
/**
 * Resource Enforcer
 */
export declare class ResourceEnforcer {
    private policy;
    private currentUsage;
    constructor(policy?: Partial<SecurityPolicy>);
    canExecuteTask(taskMemoryMB: number, taskDurationMs: number): {
        allowed: boolean;
        reason?: string;
    };
    allocateResources(memoryMB: number): void;
    releaseResources(memoryMB: number): void;
    getPolicy(): SecurityPolicy;
    getCurrentUsage(): {
        memoryMB: number;
        cpuPercent: number;
        activeTasks: number;
    };
}
/**
 * Main Security Manager
 */
export declare class SecurityManager {
    private auditor;
    private validator;
    private enforcer;
    private policy;
    constructor(policy?: Partial<SecurityPolicy>);
    /**
     * Validate and prepare a task for execution
     */
    prepareTask(input: any, estimatedMemoryMB: number, estimatedDurationMs: number): {
        canExecute: boolean;
        reason?: string;
        auditHash: string;
    };
    /**
     * Start executing a task
     */
    startTask(auditHash: string, memoryMB: number): void;
    /**
     * Complete a task
     */
    completeTask(auditHash: string, memoryMB: number, success: boolean): void;
    /**
     * Get security status
     */
    getStatus(): {
        policy: SecurityPolicy;
        usage: any;
        recentLogs: SecurityAudit[];
    };
    /**
     * Export security report
     */
    exportReport(startDate: Date, endDate: Date): any;
}
//# sourceMappingURL=manager.d.ts.map