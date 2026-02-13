/**
 * Worker Registry Module
 * Tracks worker nodes, their resources, and heartbeats
 */
import { Database } from 'sql.js';
export interface WorkerInfo {
    id: string;
    userId?: string;
    hostname: string;
    cpuCores: number;
    gpuInfo: any[];
    memoryBytes: number;
    storageBytes: number;
    status: 'online' | 'offline' | 'busy' | 'disabled';
    reputation: number;
    totalTasksCompleted: number;
    totalTasksFailed: number;
    totalEarnings: number;
    lastHeartbeat: Date;
    createdAt: Date;
}
export declare class WorkerRegistry {
    private db;
    private dbPath;
    constructor(db: Database, dbPath: string);
    private save;
    private mapRowToWorker;
    /**
     * Register a new worker
     */
    register(info: {
        hostname: string;
        cpuCores: number;
        gpuInfo?: any[];
        memoryBytes: number;
        storageBytes: number;
        userId?: string;
    }): WorkerInfo;
    /**
     * Update worker heartbeat
     */
    heartbeat(workerId: string): void;
    /**
     * Update worker status
     */
    setStatus(workerId: string, status: WorkerInfo['status']): void;
    /**
     * Get all online workers
     */
    getOnlineWorkers(): WorkerInfo[];
    /**
     * Get available workers (online and not busy)
     */
    getAvailableWorkers(): WorkerInfo[];
    /**
     * Get worker by ID
     */
    getById(workerId: string): WorkerInfo | null;
    /**
     * Record task completion
     */
    recordTaskCompletion(workerId: string, earnings: number): void;
    /**
     * Record task failure
     */
    recordTaskFailure(workerId: string): void;
    /**
     * Get all workers (admin only)
     */
    getAllWorkers(): WorkerInfo[];
    /**
     * Get worker stats
     */
    getStats(): {
        total: number;
        online: number;
        offline: number;
        tasksCompleted: number;
        tasksFailed: number;
        totalEarnings: number;
        avgReputation: number;
    };
    /**
     * Update worker resource allocation (for dynamic throttling)
     */
    updateResources(workerId: string, ramGB: number, cores: number, gpuGB?: number): void;
    /**
     * Get worker's resource allocation in GB
     */
    getWorkerResources(workerId: string): {
        ramGB: number;
        cores: number;
        gpuGB: number;
    } | null;
    /**
     * Get total network capacity in GB
     */
    getNetworkCapacity(): {
        totalRAMGB: number;
        totalCores: number;
        totalGPUGB: number;
        workerCount: number;
    };
}
//# sourceMappingURL=workerRegistry.d.ts.map