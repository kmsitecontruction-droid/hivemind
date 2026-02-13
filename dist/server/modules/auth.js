/**
 * Authentication Module
 * User registration, login, and session management
 */
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { saveDatabase } from '../db/schema.js';
export class AuthSystem {
    db;
    dbPath;
    SALT_ROUNDS = 10;
    TOKEN_EXPIRY_DAYS = 30;
    constructor(db, dbPath) {
        this.db = db;
        this.dbPath = dbPath;
    }
    save() {
        saveDatabase(this.db, this.dbPath);
    }
    /**
     * Register a new user
     */
    register(username, email, password) {
        const existing = this.db.exec(`SELECT id FROM users WHERE username = ? OR email = ?`, [username, email]);
        if (existing.length > 0 && existing[0].values.length > 0) {
            throw new Error('Username or email already exists');
        }
        const passwordHash = bcrypt.hashSync(password, this.SALT_ROUNDS);
        const userId = uuidv4();
        this.db.run(`INSERT INTO users (id, username, email, password_hash, credits, reputation, created_at, last_active_at) VALUES (?, ?, ?, ?, 0, 1.0, datetime('now'), datetime('now'))`, [userId, username, email, passwordHash]);
        const token = this.createSession(userId);
        const user = this.getUserById(userId);
        this.save();
        return { user, token };
    }
    /**
     * Login with username/email and password
     */
    login(usernameOrEmail, password) {
        const result = this.db.exec(`SELECT * FROM users WHERE username = ? OR email = ?`, [usernameOrEmail, usernameOrEmail]);
        if (result.length === 0 || result[0].values.length === 0) {
            throw new Error('Invalid credentials');
        }
        const row = result[0].values[0];
        const passwordHash = row[3];
        if (!bcrypt.compareSync(password, passwordHash)) {
            throw new Error('Invalid credentials');
        }
        // Update last active
        const userId = row[0];
        this.db.run(`UPDATE users SET last_active_at = datetime('now') WHERE id = ?`, [userId]);
        const token = this.createSession(userId);
        const user = this.getUserById(userId);
        this.save();
        return { user, token };
    }
    /**
     * Create a new session token
     */
    createSession(userId) {
        // Clean up old sessions
        this.db.run(`DELETE FROM sessions WHERE expires_at < datetime('now')`);
        const token = uuidv4();
        const sessionId = uuidv4();
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + this.TOKEN_EXPIRY_DAYS);
        this.db.run(`INSERT INTO sessions (id, user_id, token, expires_at, created_at) VALUES (?, ?, ?, ?, datetime('now'))`, [sessionId, userId, token, expiresAt.toISOString()]);
        this.save();
        return token;
    }
    /**
     * Verify session token
     */
    verifyToken(token) {
        const result = this.db.exec(`SELECT * FROM sessions WHERE token = ? AND expires_at > datetime('now')`, [token]);
        if (result.length === 0 || result[0].values.length === 0)
            return null;
        const row = result[0].values[0];
        return {
            id: row[0],
            userId: row[1],
            token: row[2],
            expiresAt: new Date(row[3]),
            createdAt: new Date(row[4])
        };
    }
    /**
     * Get user by ID
     */
    getUserById(userId) {
        const result = this.db.exec(`SELECT * FROM users WHERE id = ?`, [userId]);
        if (result.length === 0 || result[0].values.length === 0)
            return null;
        const row = result[0].values[0];
        return {
            id: row[0],
            username: row[1],
            email: row[2],
            credits: row[4],
            reputation: row[5],
            totalEarned: row[6],
            totalSpent: row[7],
            createdAt: new Date(row[8]),
            lastActiveAt: new Date(row[9])
        };
    }
    /**
     * Get all users (admin only)
     */
    getAllUsers() {
        try {
            const result = this.db.exec(`SELECT * FROM users ORDER BY created_at DESC`);
            if (result.length === 0 || result[0].values.length === 0)
                return [];
            return result[0].values.map((row) => ({
                id: row[0],
                username: row[1],
                email: row[2],
                credits: row[4],
                reputation: row[5],
                totalEarned: row[6],
                totalSpent: row[7],
                createdAt: new Date(row[8]),
                lastActiveAt: new Date(row[9])
            }));
        }
        catch {
            return [];
        }
    }
    /**
     * Logout (invalidate token)
     */
    logout(token) {
        this.db.run(`DELETE FROM sessions WHERE token = ?`, [token]);
        this.save();
    }
    /**
     * Update user reputation
     */
    updateReputation(userId, delta) {
        this.db.run(`UPDATE users SET reputation = MAX(0.1, MIN(2.0, reputation + ?)) WHERE id = ?`, [delta, userId]);
        this.save();
    }
}
//# sourceMappingURL=auth.js.map