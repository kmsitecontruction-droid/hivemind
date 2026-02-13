/**
 * Authentication Module
 * User registration, login, and session management
 */
import { Database } from 'sql.js';
export interface User {
    id: string;
    username: string;
    email: string;
    credits: number;
    reputation: number;
    totalEarned: number;
    totalSpent: number;
    createdAt: Date;
    lastActiveAt: Date;
}
export interface Session {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
}
export declare class AuthSystem {
    private db;
    private dbPath;
    private SALT_ROUNDS;
    private TOKEN_EXPIRY_DAYS;
    constructor(db: Database, dbPath: string);
    private save;
    /**
     * Register a new user
     */
    register(username: string, email: string, password: string): {
        user: User;
        token: string;
    };
    /**
     * Login with username/email and password
     */
    login(usernameOrEmail: string, password: string): {
        user: User;
        token: string;
    };
    /**
     * Create a new session token
     */
    createSession(userId: string): string;
    /**
     * Verify session token
     */
    verifyToken(token: string): Session | null;
    /**
     * Get user by ID
     */
    getUserById(userId: string): User | null;
    /**
     * Get all users (admin only)
     */
    getAllUsers(): User[];
    /**
     * Logout (invalidate token)
     */
    logout(token: string): void;
    /**
     * Update user reputation
     */
    updateReputation(userId: string, delta: number): void;
}
//# sourceMappingURL=auth.d.ts.map