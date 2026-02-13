/**
 * Database Migration Runner
 * Applies schema changes and migrations
 */
import { initializeDatabase, runMigrations, getDatabasePath } from './schema.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
async function main() {
    console.log('🚀 Running database migrations...');
    const dbPath = await getDatabasePath(path.join(__dirname, '..', '..', '..', 'data'));
    const db = await initializeDatabase(dbPath);
    try {
        runMigrations(db);
        console.log('✅ All migrations completed successfully!');
    }
    catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=migrate.js.map