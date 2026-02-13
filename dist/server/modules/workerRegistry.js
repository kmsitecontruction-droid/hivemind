/**
 * Worker Registry Module
 * Tracks worker nodes, their resources, and heartbeats
 */
import { v4 as uuidv4 } from 'uuid';
import { saveDatabase } from '../db/schema.js';
export class WorkerRegistry {
    db;
    dbPath;
    constructor(db, dbPath) {
        this.db = db;
        this.dbPath = dbPath;
    }
    save() {
        saveDatabase(this.db, this.dbPath);
    }
    mapRowToWorker(row) {
        return {
            id: row[0],
            userId: row[1],
            hostname: row[2],
            cpuCores: row[3],
            gpuInfo: JSON.parse(row[4] || '[]'),
            memoryBytes: row[5],
            storageBytes: row[6],
            status: row[7],
            reputation: row[8],
            totalTasksCompleted: row[9],
            totalTasksFailed: row[10],
            totalEarnings: row[11],
            lastHeartbeat: new Date(row[12]),
            createdAt: new Date(row[13])
        };
    }
    /**
     * Register a new worker
     */
    register(info) {
        const id = uuidv4();
        this.db.run(`INSERT INTO workers (id, user_id, hostname, cpu_cores, gpu_info, memory_bytes, storage_bytes, status, last_heartbeat, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'online', datetime('now'), datetime('now'))`, [id, info.userId ?? null, info.hostname, info.cpuCores, JSON.stringify(info.gpuInfo ?? []), info.memoryBytes, info.storageBytes]);
        this.save();
        return this.getById(id);
    }
    /**
     * Update worker heartbeat
     */
    heartbeat(workerId) {
        this.db.run(`UPDATE workers SET last_heartbeat = datetime('now') WHERE id = ?`, [workerId]);
        this.save();
    }
    /**
     * Update worker status
     */
    setStatus(workerId, status) {
        this.db.run(`UPDATE workers SET status = ? WHERE id = ?`, [status, workerId]);
        this.save();
    }
    /**
     * Get all online workers
     */
    getOnlineWorkers() {
        const result = this.db.exec(`
      SELECT * FROM workers 
      WHERE last_heartbeat > datetime('now', '-1 minute') AND status != 'disabled'
      ORDER BY reputation DESC
    `);
        if (result.length === 0)
            return [];
        return result[0].values.map(row => this.mapRowToWorker(row));
    }
    /**
     * Get available workers (online and not busy)
     */
    getAvailableWorkers() {
        const result = this.db.exec(`
      SELECT * FROM workers 
      WHERE last_heartbeat > datetime('now', '-1 minute') 
        AND status IN ('online', 'busy')
        AND reputation >= 0.5
      ORDER BY reputation DESC, last_heartbeat ASC
    `);
        if (result.length === 0)
            return [];
        return result[0].values.map(row => this.mapRowToWorker(row));
    }
    /**
     * Get worker by ID
     */
    getById(workerId) {
        const result = this.db.exec(`SELECT * FROM workers WHERE id = ?`, [workerId]);
        if (result.length === 0 || result[0].values.length === 0)
            return null;
        return this.mapRowToWorker(result[0].values[0]);
    }
    /**
     * Record task completion
     */
    recordTaskCompletion(workerId, earnings) {
        this.db.run(`
      UPDATE workers 
      SET status = 'online',
          total_tasks_completed = total_tasks_completed + 1,
          total_earnings = total_earnings + ?,
          reputation = MIN(2.0, reputation + 0.01)
      WHERE id = ?
    `, [earnings, workerId]);
        this.save();
    }
    /**
     * Record task failure
     */
    recordTaskFailure(workerId) {
        this.db.run(`
      UPDATE workers 
      SET status = 'online',
          total_tasks_failed = total_tasks_failed + 1,
          reputation = MAX(0.1, reputation - 0.05)
      WHERE id = ?
    `, [workerId]);
        this.save();
    }
    /**
     * Get all workers (admin only)
     */
    getAllWorkers() {
        try {
            const result = this.db.exec(`SELECT * FROM workers ORDER BY last_heartbeat DESC`);
            if (result.length === 0 || result[0].values.length === 0)
                return [];
            return result[0].values.map(row => this.mapRowToWorker(row));
        }
        catch {
            return [];
        }
    }
    /**
     * Get worker stats
     */
    getStats() {
        const result = this.db.exec(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN last_heartbeat > datetime('now', '-1 minute') THEN 1 ELSE 0 END) as online,
        SUM(total_tasks_completed) as tasks_completed,
        SUM(total_tasks_failed) as tasks_failed,
        SUM(total_earnings) as total_earnings,
        AVG(reputation) as avg_reputation
      FROM workers
    `);
        if (result.length === 0) {
            return { total: 0, online: 0, offline: 0, tasksCompleted: 0, tasksFailed: 0, totalEarnings: 0, avgReputation: 1.0 };
        }
        const row = result[0].values[0];
        return {
            total: row[0],
            online: row[1],
            offline: row[0] - row[1],
            tasksCompleted: row[2] || 0,
            tasksFailed: row[3] || 0,
            totalEarnings: row[4] || 0,
            avgReputation: row[5] || 1.0
        };
    }
    /**
     * Update worker resource allocation (for dynamic throttling)
     */
    updateResources(workerId, ramGB, cores, gpuGB = 0) {
        const memoryBytes = Math.floor(ramGB * 1024 * 1024 * 1024);
        this.db.run(`UPDATE workers SET memory_bytes = ?, cpu_cores = ? WHERE id = ?`, [memoryBytes, cores, workerId]);
        this.save();
    }
    /**
     * Get worker's resource allocation in GB
     */
    getWorkerResources(workerId) {
        const worker = this.getById(workerId);
        if (!worker)
            return null;
        return {
            ramGB: worker.memoryBytes / (1024 * 1024 * 1024),
            cores: worker.cpuCores,
            gpuGB: worker.gpuInfo.reduce((sum, gpu) => sum + (gpu.memory || 0), 0) / (1024 * 1024 * 1024)
        };
    }
    /**
     * Get total network capacity in GB
     */
    getNetworkCapacity() {
        const workers = this.getAvailableWorkers();
        return {
            totalRAMGB: workers.reduce((sum, w) => sum + (w.memoryBytes / (1024 * 1024 * 1024)), 0),
            totalCores: workers.reduce((sum, w) => sum + w.cpuCores, 0),
            totalGPUGB: workers.reduce((sum, w) => sum + w.gpuInfo.reduce((s, g) => s + (g.memory || 0), 0), 0) / (1024 * 1024 * 1024),
            workerCount: workers.length
        };
    }
}
//# sourceMappingURL=workerRegistry.js.map