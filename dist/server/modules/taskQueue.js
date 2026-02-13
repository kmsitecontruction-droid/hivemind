/**
 * Task Queue Module
 * Manages task distribution, scheduling, and status tracking
 */
import { v4 as uuidv4 } from 'uuid';
import { saveDatabase } from '../db/schema.js';
export class TaskQueue {
    db;
    dbPath;
    constructor(db, dbPath) {
        this.db = db;
        this.dbPath = dbPath;
    }
    save() {
        saveDatabase(this.db, this.dbPath);
    }
    mapRowToTask(row) {
        return {
            id: row[0],
            userId: row[1],
            type: row[2],
            status: row[3],
            priority: row[4],
            inputData: JSON.parse(row[5]),
            resultData: row[6] ? JSON.parse(row[6]) : undefined,
            expectedOutputHash: row[7],
            actualOutputHash: row[8],
            creditsEstimate: row[9],
            creditsPaid: row[10],
            assignedWorkerId: row[11],
            startedAt: row[12] ? new Date(row[12]) : undefined,
            completedAt: row[13] ? new Date(row[13]) : undefined,
            createdAt: new Date(row[14])
        };
    }
    /**
     * Create a new task
     */
    create(userId, input) {
        const id = uuidv4();
        this.db.run(`INSERT INTO tasks (id, user_id, type, status, priority, input_data, credits_estimate, created_at) VALUES (?, ?, ?, 'pending', ?, ?, ?, datetime('now'))`, [id, userId, input.type, input.priority ?? 0, JSON.stringify(input.inputData), input.creditsEstimate]);
        this.save();
        return this.getById(id);
    }
    /**
     * Get task by ID
     */
    getById(taskId) {
        const result = this.db.exec(`SELECT * FROM tasks WHERE id = ?`, [taskId]);
        if (result.length === 0 || result[0].values.length === 0)
            return null;
        return this.mapRowToTask(result[0].values[0]);
    }
    /**
     * Get pending tasks ordered by priority
     */
    getPendingTasks(limit = 100) {
        const result = this.db.exec(`SELECT * FROM tasks WHERE status = 'pending' ORDER BY priority DESC, created_at ASC LIMIT ${limit}`);
        if (result.length === 0)
            return [];
        return result[0].values.map(row => this.mapRowToTask(row));
    }
    /**
     * Get all tasks (admin only)
     */
    getAll() {
        try {
            const result = this.db.exec(`SELECT * FROM tasks ORDER BY created_at DESC LIMIT 500`);
            if (result.length === 0 || result[0].values.length === 0)
                return [];
            return result[0].values.map(row => this.mapRowToTask(row));
        }
        catch {
            return [];
        }
    }
    /**
     * Assign task to a worker
     */
    assignToWorker(taskId, workerId) {
        this.db.run(`UPDATE tasks SET status = 'assigned', assigned_worker_id = ?, started_at = datetime('now') WHERE id = ? AND status = 'pending'`, [workerId, taskId]);
        this.save();
        return this.getById(taskId);
    }
    /**
     * Complete task with result
     */
    complete(taskId, resultData) {
        this.db.run(`UPDATE tasks SET status = 'completed', result_data = ?, completed_at = datetime('now') WHERE id = ?`, [JSON.stringify(resultData), taskId]);
        this.save();
        return this.getById(taskId);
    }
    /**
     * Mark task as failed
     */
    fail(taskId, reason) {
        this.db.run(`UPDATE tasks SET status = 'failed', result_data = ? WHERE id = ?`, [JSON.stringify({ error: reason }), taskId]);
        this.save();
        return this.getById(taskId);
    }
    /**
     * Verify task result
     */
    verify(taskId, outputHash, isCorrect) {
        const status = isCorrect ? 'verified' : 'failed';
        this.db.run(`UPDATE tasks SET status = ?, actual_output_hash = ? WHERE id = ?`, [status, outputHash, taskId]);
        this.save();
        return this.getById(taskId);
    }
    /**
     * Get tasks for a user
     */
    getByUser(userId, limit = 50) {
        const result = this.db.exec(`SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC LIMIT ${limit}`, [userId]);
        if (result.length === 0)
            return [];
        return result[0].values.map(row => this.mapRowToTask(row));
    }
    /**
     * Get queue statistics
     */
    getStats() {
        const result = this.db.exec(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'running' THEN 1 ELSE 0 END) as running,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(credits_estimate) as total_estimated_credits
      FROM tasks
    `);
        if (result.length === 0) {
            return { total: 0, pending: 0, running: 0, completed: 0, failed: 0, totalEstimatedCredits: 0 };
        }
        const row = result[0].values[0];
        return {
            total: row[0],
            pending: row[1],
            running: row[2],
            completed: row[3],
            failed: row[4],
            totalEstimatedCredits: row[5] || 0
        };
    }
}
//# sourceMappingURL=taskQueue.js.map