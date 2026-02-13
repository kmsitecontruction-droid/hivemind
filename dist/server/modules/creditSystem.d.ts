/**
 * Credit System Module
 * Manages user credits, earnings, and spending ledger
 */
import { Database } from 'sql.js';
export interface CreditTransaction {
    id: string;
    userId: string;
    type: 'earn' | 'spend' | 'deposit' | 'withdraw';
    amount: number;
    balanceAfter: number;
    taskId?: string;
    description?: string;
    createdAt: Date;
}
export declare class CreditSystem {
    private db;
    private dbPath;
    constructor(db: Database, dbPath: string);
    private save;
    /**
     * Get user's current credit balance
     */
    getBalance(userId: string): number;
    /**
     * Add credits to user account (deposit or task reward)
     */
    deposit(userId: string, amount: number, description?: string): CreditTransaction;
    /**
     * Deduct credits from user account (task submission)
     */
    spend(userId: string, amount: number, taskId: string, description?: string): CreditTransaction;
    /**
     * Calculate credits earned based on resources provided
     * Formula: baseCredits × (ram_gb / 1) × (cores / 1) × (gpu_gb / 1) × reputation
     */
    calculateCreditsEarned(baseCredits: number, ramGB: number, cores: number, gpuGB?: number, reputation?: number): number;
    /**
     * Award credits to worker for completed task
     */
    awardEarnings(workerId: string, amount: number, taskId: string): void;
    /**
     * Get transaction history for a user
     */
    getTransactionHistory(userId: string, limit?: number): CreditTransaction[];
    /**
     * Get user's lifetime stats
     */
    getUserStats(userId: string): {
        balance: number;
        reputation: number;
        totalEarned: number;
        totalSpent: number;
        joinedAt: Date;
        lastActive: Date;
    } | null;
}
//# sourceMappingURL=creditSystem.d.ts.map