/**
 * Sandboxed Execution Module
 * Safely executes model inference tasks with resource limits
 */
export interface SandboxConfig {
    maxMemoryMB: number;
    maxCPUPercent: number;
    maxTimeSeconds: number;
    maxConcurrentTasks: number;
}
export interface ExecutionResult {
    success: boolean;
    output?: any;
    error?: string;
    memoryUsedMB: number;
    executionTimeMs: number;
    timedOut: boolean;
}
export interface TaskConfig {
    id: string;
    type: 'inference' | 'embedding' | 'tokenization';
    modelPath?: string;
    prompt: string;
    maxTokens?: number;
    temperature?: number;
}
export declare class SandboxedExecutor {
    private config;
    private activeTasks;
    private dockerAvailable;
    constructor(config?: Partial<SandboxConfig>);
    /**
     * Check if Docker is available for containerized execution
     */
    checkDocker(): Promise<boolean>;
    /**
     * Execute a task in sandboxed environment
     */
    execute(task: TaskConfig): Promise<ExecutionResult>;
    /**
     * Execute using Docker container with resource limits
     */
    private executeWithDocker;
    /**
     * Execute with OS-level resource limits (fallback)
     */
    private executeWithLimits;
    /**
     * Get current executor statistics
     */
    getStats(): {
        activeTasks: number;
        maxConcurrentTasks: number;
        maxMemoryMB: number;
        maxCPUPercent: number;
        maxTimeSeconds: number;
        dockerAvailable: boolean | null;
    };
}
/**
 * Resource Monitor - tracks system resources
 */
export declare class ResourceMonitor {
    private interval;
    private samples;
    private maxSamples;
    start(intervalMs?: number): void;
    stop(): void;
    getCurrentUsage(): {
        cpu: number;
        memory: number;
    };
    getAverageUsage(windowSeconds?: number): {
        cpu: number;
        memory: number;
    };
    getHistory(): {
        cpu: number;
        memory: number;
        timestamp: number;
    }[];
}
/**
 * Resource Manager - orchestrates sandbox and monitor
 */
export declare class ResourceManager {
    private executor;
    private monitor;
    private availableMemoryMB;
    private availableCPU;
    private gpuInfo;
    constructor();
    initialize(): Promise<void>;
    /**
     * Calculate how many shards this device can handle
     */
    calculateShardCapacity(modelRequirements: {
        memoryPerShardMB: number;
        cpuPerShardPercent: number;
        gpuRequired: boolean;
    }): {
        shards: number;
        memoryNeeded: number;
        cpuNeeded: number;
    };
    /**
     * Execute a task with resource tracking
     */
    runTask(task: TaskConfig): Promise<ExecutionResult>;
    getStatus(): {
        availableMemoryMB: number;
        availableCPU: number;
        gpuInfo: any[];
        currentUsage: {
            cpu: number;
            memory: number;
        };
        averageUsage: {
            cpu: number;
            memory: number;
        };
        executor: {
            activeTasks: number;
            maxConcurrentTasks: number;
            maxMemoryMB: number;
            maxCPUPercent: number;
            maxTimeSeconds: number;
            dockerAvailable: boolean | null;
        };
    };
}
//# sourceMappingURL=sandbox.d.ts.map