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
    private modelManager;
    private inferenceEngine;
    private initialized;
    constructor(config?: Partial<SandboxConfig>);
    /**
     * Initialize the executor - check dependencies and scan models
     */
    initialize(): Promise<void>;
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
     * Uses real inference if available, otherwise simulates
     */
    private executeWithLimits;
    /**
     * Execute real AI inference using the inference engine
     */
    private executeRealInference;
    /**
     * Simulated task execution (fallback when no models available)
     */
    private executeSimulated;
    /**
     * Get available models for this executor
     */
    getAvailableModels(): import("../index.js").ModelStatus[];
    /**
     * Download a model for inference
     */
    downloadModel(modelId: string): Promise<boolean>;
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
     * Get available models
     */
    getAvailableModels(): import("../index.js").ModelStatus[];
    /**
     * Download a model
     */
    downloadModel(modelId: string): Promise<boolean>;
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