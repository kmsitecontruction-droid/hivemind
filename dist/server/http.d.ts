/**
 * HIVEMIND HTTP Server
 * REST API for web and mobile clients
 */
import { Database } from 'sql.js';
import { AuthSystem } from './modules/auth.js';
import { CreditSystem } from './modules/creditSystem.js';
import { TaskQueue } from './modules/taskQueue.js';
import { WorkerRegistry } from './modules/workerRegistry.js';
export interface HttpServerOptions {
    db: Database;
    auth: AuthSystem;
    credits: CreditSystem;
    tasks: TaskQueue;
    workers: WorkerRegistry;
}
export declare function createHttpServer(options: HttpServerOptions): any;
//# sourceMappingURL=http.d.ts.map