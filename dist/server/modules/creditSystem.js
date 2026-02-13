/**
 * Credit System Module
 * Manages user credits, earnings, and spending ledger
 */
import { v4 as uuidv4 } from 'uuid';
import { saveDatabase } from '../db/schema.js';
export class CreditSystem {
    db;
    dbPath;
    constructor(db, dbPath) {
        this.db = db;
        this.dbPath = dbPath;
    }
    save() {
        saveDatabase(this.db, this.dbPath);
    }
    /**
     * Get user's current credit balance
     */
    getBalance(userId) {
        const stmt = this.db.prepare('SELECT credits FROM users WHERE id = ?');
        stmt.bind([userId]);
        if (stmt.step()) {
            const row = stmt.getAsObject();
            stmt.free();
            return row.credits || 0;
        }
        stmt.free();
        return 0;
    }
    /**
     * Add credits to user account (deposit or task reward)
     */
    deposit(userId, amount, description = 'Deposit') {
        const result = this.db.exec(`SELECT credits FROM users WHERE id = '${userId}'`);
        if (result.length === 0 || result[0].values.length === 0) {
            throw new Error(`User ${userId} not found`);
        }
        const currentCredits = result[0].values[0][0];
        const newBalance = currentCredits + amount;
        const txnId = uuidv4();
        this.db.run(`INSERT INTO transactions (id, user_id, type, amount, balance_after, description) VALUES (?, ?, 'deposit', ?, ?, ?)`, [txnId, userId, amount, newBalance, description]);
        this.db.run(`UPDATE users SET credits = ?, total_earned = total_earned + ? WHERE id = ?`, [newBalance, amount, userId]);
        this.save();
        return {
            id: txnId,
            userId,
            type: 'deposit',
            amount,
            balanceAfter: newBalance,
            description,
            createdAt: new Date()
        };
    }
    /**
     * Deduct credits from user account (task submission)
     */
    spend(userId, amount, taskId, description = 'Task payment') {
        const result = this.db.exec(`SELECT credits FROM users WHERE id = '${userId}'`);
        if (result.length === 0)
            throw new Error(`User ${userId} not found`);
        const currentCredits = result[0].values[0][0];
        if (currentCredits < amount)
            throw new Error(`Insufficient credits: ${currentCredits} < ${amount}`);
        const newBalance = currentCredits - amount;
        const txnId = uuidv4();
        this.db.run(`INSERT INTO transactions (id, user_id, type, amount, balance_after, task_id, description) VALUES (?, ?, 'spend', ?, ?, ?, ?)`, [txnId, userId, amount, newBalance, taskId, description]);
        this.db.run(`UPDATE users SET credits = ?, total_spent = total_spent + ? WHERE id = ?`, [newBalance, amount, userId]);
        this.save();
        return {
            id: txnId,
            userId,
            type: 'spend',
            amount,
            balanceAfter: newBalance,
            taskId,
            description,
            createdAt: new Date()
        };
    }
    /**
     * Calculate credits earned based on resources provided
     * Formula: baseCredits × (ram_gb / 1) × (cores / 1) × (gpu_gb / 1) × reputation
     */
    calculateCreditsEarned(baseCredits, ramGB, cores, gpuGB = 0, reputation = 1.0) {
        const ramMultiplier = Math.max(0.1, ramGB); // Min 0.1 for fractional
        const coreMultiplier = Math.max(0.1, cores);
        const gpuMultiplier = gpuGB > 0 ? (1 + gpuGB) : 1; // Bonus for GPU
        const repMultiplier = Math.max(0.1, Math.min(3.0, reputation)); // Cap at 3.0
        return Number((baseCredits * ramMultiplier * coreMultiplier * gpuMultiplier * repMultiplier).toFixed(2));
    }
    /**
     * Award credits to worker for completed task
     */
    awardEarnings(workerId, amount, taskId) {
        this.db.run(`UPDATE workers SET total_earnings = total_earnings + ? WHERE id = ?`, [amount, workerId]);
        const result = this.db.exec(`SELECT user_id FROM workers WHERE id = '${workerId}'`);
        if (result.length > 0 && result[0].values.length > 0) {
            const userId = result[0].values[0][0];
            if (userId) {
                this.deposit(userId, amount, 'Task earnings');
            }
        }
        this.save();
    }
    /**
     * Get transaction history for a user
     */
    getTransactionHistory(userId, limit = 50) {
        const result = this.db.exec(`SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ${limit}`, [userId]);
        if (result.length === 0)
            return [];
        return result[0].values.map((row) => ({
            id: row[0],
            userId: row[1],
            type: row[2],
            amount: row[3],
            balanceAfter: row[4],
            taskId: row[5],
            description: row[6],
            createdAt: new Date(row[7])
        }));
    }
    /**
     * Get user's lifetime stats
     */
    getUserStats(userId) {
        const result = this.db.exec(`SELECT credits, reputation, total_earned, total_spent, created_at, last_active_at FROM users WHERE id = ?`, [userId]);
        if (result.length === 0)
            return null;
        const row = result[0].values[0];
        return {
            balance: row[0],
            reputation: row[1],
            totalEarned: row[2],
            totalSpent: row[3],
            joinedAt: new Date(row[4]),
            lastActive: new Date(row[5])
        };
    }
}
//# sourceMappingURL=creditSystem.js.map