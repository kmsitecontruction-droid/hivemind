/**
 * HIVEMIND Drone Client
 * Complete worker implementation with sandbox, network, and resource management
 */
import { ResourceManager } from './sandbox/sandbox.js';
import { SUPPORTED_MODELS, ModelStatus } from './models/manager.js';
export { SUPPORTED_MODELS };
export type { ModelStatus };
export interface ClientConfig {
    serverUrl: string;
    maxMemoryMB?: number;
    maxCPUPercent?: number;
    maxConcurrentTasks?: number;
    autoReconnect?: boolean;
    requestedRAMGB?: number;
    requestedCores?: number;
    requestedGPUGB?: number;
    enableAutoThrottle?: boolean;
}
export interface ClientStats {
    network: {
        connected: boolean;
        workerId: string | null;
    };
    resources: ReturnType<ResourceManager['getStatus']>;
    tasks: {
        completed: number;
        failed: number;
        active: number;
    };
    config: {
        requestedRAMGB: number;
        requestedCores: number;
        requestedGPUGB: number;
    };
}
export interface ClientStats {
    network: {
        connected: boolean;
        workerId: string | null;
    };
    resources: ReturnType<ResourceManager['getStatus']>;
    tasks: {
        completed: number;
        failed: number;
        active: number;
    };
}
export declare class HiveDrone {
    private network;
    private resources;
    private config;
    private running;
    private taskLoopInterval;
    private stats;
    constructor(config?: Partial<ClientConfig>);
    /**
     * Initialize and start the drone
     */
    start(): Promise<void>;
    /**
     * Show current model cache status
     */
    private showModelStatus;
    /**
     * Download a model
     */
    downloadModel(modelId: string): Promise<boolean>;
    /**
     * Set up network event handlers
     */
    private setupNetworkHandlers;
    /**
     * Start periodic task polling
     */
    private startTaskLoop;
    /**
     * Request a task from the server
     */
    private requestTask;
    /**
     * Execute a task in the sandbox
     */
    private executeTask;
    /**
     * Get current drone status
     */
    getStatus(): ClientStats;
    /**
     * Calculate how many model shards this drone can handle
     */
    getShardCapacity(): {
        shards: number;
        memoryNeeded: number;
        cpuNeeded: number;
    };
    /**
     * Stop the drone
     */
    stop(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map