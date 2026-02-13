/**
 * Task Queue Module
 * Manages task distribution, scheduling, and status tracking
 */
import { Database } from 'sql.js';
export interface Task {
    id: string;
    userId: string;
    type: 'inference' | 'training' | 'fine-tuning';
    status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'verified';
    priority: number;
    inputData: object;
    resultData?: object;
    expectedOutputHash?: string;
    actualOutputHash?: string;
    creditsEstimate: number;
    creditsPaid: number;
    assignedWorkerId?: string;
    startedAt?: Date;
    completedAt?: Date;
    createdAt: Date;
}
export interface TaskInput {
    type: 'inference' | 'training' | 'fine-tuning';
    inputData: object;
    priority?: number;
    creditsEstimate: number;
}
export declare class TaskQueue {
    private db;
    private dbPath;
    constructor(db: Database, dbPath: string);
    private save;
    private mapRowToTask;
    /**
     * Create a new task
     */
    create(userId: string, input: TaskInput): Task;
    /**
     * Get task by ID
     */
    getById(taskId: string): Task | null;
    /**
     * Get pending tasks ordered by priority
     */
    getPendingTasks(limit?: number): Task[];
    /**
     * Get all tasks (admin only)
     */
    getAll(): Task[];
    /**
     * Assign task to a worker
     */
    assignToWorker(taskId: string, workerId: string): Task | null;
    /**
     * Complete task with result
     */
    complete(taskId: string, resultData: object): Task | null;
    /**
     * Mark task as failed
     */
    fail(taskId: string, reason: string): Task | null;
    /**
     * Verify task result
     */
    verify(taskId: string, outputHash: string, isCorrect: boolean): Task | null;
    /**
     * Get tasks for a user
     */
    getByUser(userId: string, limit?: number): Task[];
    /**
     * Get queue statistics
     */
    getStats(): {
        total: number;
        pending: number;
        running: number;
        completed: number;
        failed: number;
        totalEstimatedCredits: number;
    };
}
//# sourceMappingURL=taskQueue.d.ts.map