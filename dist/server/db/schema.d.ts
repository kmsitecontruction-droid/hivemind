/**
 * HIVEMIND Database Schema
 * Using sql.js (pure JS SQLite implementation)
 */
import { Database } from 'sql.js';
export interface DBPaths {
    database: string;
}
export declare function getDatabasePath(baseDir: string): Promise<string>;
export declare function initializeDatabase(dbPath: string): Promise<Database>;
export declare function saveDatabase(db: Database, dbPath: string): void;
export declare function runMigrations(db: Database): void;
//# sourceMappingURL=schema.d.ts.map