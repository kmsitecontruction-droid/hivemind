/**
 * HIVEMIND Database Schema
 * Using sql.js (pure JS SQLite implementation)
 */
import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
const SCHEMA = `
-- Users table: accounts with credit balances
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  credits REAL DEFAULT 0.0,
  reputation REAL DEFAULT 1.0,
  total_earned REAL DEFAULT 0.0,
  total_spent REAL DEFAULT 0.0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table: AI tasks to be distributed
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  input_data TEXT NOT NULL,
  result_data TEXT,
  expected_output_hash TEXT,
  actual_output_hash TEXT,
  credits_estimate REAL NOT NULL,
  credits_paid REAL DEFAULT 0,
  assigned_worker_id TEXT,
  started_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Workers table: Client nodes providing compute
CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  hostname TEXT NOT NULL,
  cpu_cores INTEGER,
  gpu_info TEXT,
  memory_bytes INTEGER,
  storage_bytes INTEGER,
  status TEXT DEFAULT 'offline',
  reputation REAL DEFAULT 1.0,
  total_tasks_completed INTEGER DEFAULT 0,
  total_tasks_failed INTEGER DEFAULT 0,
  total_earnings REAL DEFAULT 0,
  last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Task results for verification
CREATE TABLE IF NOT EXISTS task_results (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  result_data TEXT NOT NULL,
  output_hash TEXT NOT NULL,
  computation_time_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Credit transactions ledger
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount REAL NOT NULL,
  balance_after REAL NOT NULL,
  task_id TEXT,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Sessions for authentication
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_workers_status ON workers(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
`;
let sqlJsInstance = null;
async function getSqlJs() {
    if (!sqlJsInstance) {
        sqlJsInstance = await initSqlJs();
    }
    return sqlJsInstance;
}
export async function getDatabasePath(baseDir) {
    return path.join(baseDir, 'data', 'hive.db');
}
export async function initializeDatabase(dbPath) {
    const SQL = await getSqlJs();
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    let db;
    // Load existing database or create new one
    if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
    }
    else {
        db = new SQL.Database();
    }
    // Run migrations
    db.run(SCHEMA);
    // Save initial state
    saveDatabase(db, dbPath);
    console.log(`📦 Database initialized at: ${dbPath}`);
    return db;
}
export function saveDatabase(db, dbPath) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
}
export function runMigrations(db) {
    // Future migration scripts go here
    console.log('✅ Database migrations complete');
}
//# sourceMappingURL=schema.js.map