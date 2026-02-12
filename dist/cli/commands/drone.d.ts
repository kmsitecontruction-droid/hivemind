/**
 * 🐝 HIVEMIND Drone Controller
 *
 * Manages the worker client that contributes compute to the network.
 */
export interface DroneConfig {
    serverUrl: string;
    maxMemoryMB: number;
    maxCPUPercent: number;
    maxConcurrentTasks: number;
    shareGPU: boolean;
}
export interface DroneStats {
    workerId: string | null;
    status: 'disconnected' | 'connecting' | 'connected' | 'running';
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
    totalEarnings: number;
    currentCPU: number;
    currentMemory: number;
    gpuUsed: boolean;
    reputation: number;
}
export interface TaskResult {
    taskId: string;
    success: boolean;
    output?: any;
    error?: string;
    executionTimeMs: number;
    memoryUsedMB: number;
}
export declare class HiveDrone {
    private config;
    private ws;
    private stats;
    private reconnectTimeout;
    private heartbeatInterval;
    private running;
    private workerId;
    constructor(config?: Partial<DroneConfig>);
    start(): Promise<void>;
    stop(): Promise<void>;
    getStats(): DroneStats;
    private loadConfig;
    private connect;
    private registerWorker;
    private startHeartbeat;
    private scheduleReconnect;
    private handleMessage;
    private executeTask;
    private startMonitoring;
    private send;
}
//# sourceMappingURL=drone.d.ts.map