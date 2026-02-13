/**
 * HIVEMIND Core Server
 * Main entry point - coordinates users, workers, and tasks
 * WebSocket-based real-time communication
 */
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { initializeDatabase, getDatabasePath } from './db/schema.js';
import { AuthSystem } from './modules/auth.js';
import { CreditSystem } from './modules/creditSystem.js';
import { TaskQueue } from './modules/taskQueue.js';
import { WorkerRegistry } from './modules/workerRegistry.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
const PORT = parseInt(process.env.PORT || '3002', 10);
class HiveServer {
    db;
    dbPath;
    auth;
    credits;
    tasks;
    workers;
    wss;
    connections;
    constructor() {
        this.connections = new Map();
    }
    async start() {
        this.dbPath = await getDatabasePath(path.join(__dirname, '..', 'data'));
        this.db = await initializeDatabase(this.dbPath);
        this.auth = new AuthSystem(this.db, this.dbPath);
        this.credits = new CreditSystem(this.db, this.dbPath);
        this.tasks = new TaskQueue(this.db, this.dbPath);
        this.workers = new WorkerRegistry(this.db, this.dbPath);
        // Create HTTP server (for static files if needed)
        const server = createServer();
        // Create WebSocket server
        this.wss = new WebSocketServer({ server });
        this.wss.on('connection', this.handleConnection.bind(this));
        server.listen(PORT, () => {
            console.log(`🚀 HIVEMIND Server running on port ${PORT}`);
            console.log(`📦 Database: ${this.dbPath}`);
            console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
        });
    }
    handleConnection(ws) {
        const connId = uuidv4();
        console.log(`🔌 New connection: ${connId}`);
        this.connections.set(connId, { ws, type: 'client' });
        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                await this.handleMessage(connId, message);
            }
            catch (error) {
                this.sendError(ws, error instanceof Error ? error.message : 'Invalid message');
            }
        });
        ws.on('close', () => {
            console.log(`🔌 Connection closed: ${connId}`);
            this.connections.delete(connId);
        });
        ws.on('error', (error) => {
            console.error(`WebSocket error for ${connId}:`, error);
        });
    }
    async handleMessage(connId, message) {
        const conn = this.connections.get(connId);
        const { type, payload } = message;
        switch (type) {
            // ============ AUTH ============
            case 'auth:register':
                const { username, email, password } = payload;
                const { user, token } = this.auth.register(username, email, password);
                this.send(conn.ws, { type: 'auth:success', payload: { user: this.sanitizeUser(user), token } });
                break;
            case 'auth:login':
                const { username: loginUser, password: loginPass } = payload;
                const loginResult = this.auth.login(loginUser, loginPass);
                this.send(conn.ws, { type: 'auth:success', payload: { user: this.sanitizeUser(loginResult.user), token: loginResult.token } });
                break;
            case 'auth:verify':
                const session = this.auth.verifyToken(payload.token);
                if (session) {
                    const user = this.auth.getUserById(session.userId);
                    if (user) {
                        this.send(conn.ws, { type: 'auth:valid', payload: { user: this.sanitizeUser(user) } });
                    }
                    else {
                        this.send(conn.ws, { type: 'auth:invalid' });
                    }
                }
                else {
                    this.send(conn.ws, { type: 'auth:invalid' });
                }
                break;
            // ============ ADMIN ============
            case 'admin:connect':
                conn.type = 'admin';
                this.sendAdminDashboard(conn.ws);
                break;
            case 'admin:refresh':
                this.sendAdminDashboard(conn.ws);
                break;
            // ============ TASKS ============
            case 'task:create':
                if (!payload.userId)
                    throw new Error('Authentication required');
                const task = this.tasks.create(payload.userId, {
                    type: payload.taskType,
                    inputData: payload.inputData,
                    creditsEstimate: payload.credits,
                    priority: payload.priority
                });
                this.broadcastTaskAvailable();
                this.send(conn.ws, { type: 'task:created', payload: task });
                break;
            case 'task:get':
                const taskData = this.tasks.getById(payload.taskId);
                this.send(conn.ws, { type: 'task:data', payload: taskData });
                break;
            case 'task:list':
                const tasks = this.tasks.getByUser(payload.userId);
                this.send(conn.ws, { type: 'task:list', payload: tasks });
                break;
            case 'task:stats':
                const stats = this.tasks.getStats();
                this.send(conn.ws, { type: 'task:stats', payload: stats });
                break;
            // ============ WORKERS ============
            case 'worker:register':
                const worker = this.workers.register({
                    hostname: payload.hostname,
                    cpuCores: payload.cpuCores,
                    gpuInfo: payload.gpuInfo,
                    memoryBytes: payload.memoryBytes,
                    storageBytes: payload.storageBytes,
                    userId: payload.userId
                });
                conn.type = 'worker';
                conn.workerId = worker.id;
                this.send(conn.ws, { type: 'worker:registered', payload: { workerId: worker.id } });
                break;
            case 'worker:heartbeat':
                if (conn.workerId) {
                    this.workers.heartbeat(conn.workerId);
                }
                break;
            case 'worker:status':
                if (conn.workerId) {
                    this.workers.setStatus(conn.workerId, payload.status);
                }
                break;
            case 'worker:list':
                const availableWorkers = this.workers.getAvailableWorkers();
                this.send(conn.ws, { type: 'worker:list', payload: availableWorkers });
                break;
            case 'worker:stats':
                const workerStats = this.workers.getStats();
                this.send(conn.ws, { type: 'worker:stats', payload: workerStats });
                break;
            // ============ TASK DISPATCH ============
            case 'worker:request-task':
                const availableTask = this.dispatchTaskToWorker(conn.workerId);
                if (availableTask) {
                    this.send(conn.ws, { type: 'task:assigned', payload: availableTask });
                }
                break;
            case 'worker:task-complete':
                this.handleTaskComplete(conn.workerId, payload);
                break;
            case 'worker:task-failed':
                this.handleTaskFailed(conn.workerId, payload);
                break;
            // ============ CREDITS ============
            case 'credits:balance':
                const balance = this.credits.getBalance(payload.userId);
                this.send(conn.ws, { type: 'credits:balance', payload: { balance } });
                break;
            case 'credits:history':
                const history = this.credits.getTransactionHistory(payload.userId);
                this.send(conn.ws, { type: 'credits:history', payload: history });
                break;
            default:
                this.sendError(conn.ws, `Unknown message type: ${type}`);
        }
    }
    sendAdminDashboard(ws) {
        const workers = this.workers.getAllWorkers();
        const tasks = this.tasks.getAll();
        const users = this.auth.getAllUsers();
        const workerStats = this.workers.getStats();
        const taskStats = this.tasks.getStats();
        const totalCredits = users.reduce((sum, u) => sum + (u.credits || 0), 0);
        this.send(ws, {
            type: 'admin:data',
            payload: {
                workers,
                tasks,
                users: users.map((u) => this.sanitizeUser(u)),
                stats: {
                    totalUsers: users.length,
                    onlineWorkers: workerStats.online,
                    totalWorkers: workerStats.total,
                    pendingTasks: taskStats.pending,
                    runningTasks: taskStats.running,
                    completedTasks: taskStats.completed,
                    totalEarnings: workers.reduce((sum, w) => sum + (w.totalEarnings || 0), 0),
                    totalCredits
                }
            }
        });
    }
    dispatchTaskToWorker(workerId) {
        const pendingTasks = this.tasks.getPendingTasks(1);
        if (pendingTasks.length === 0)
            return null;
        const task = pendingTasks[0];
        this.tasks.assignToWorker(task.id, workerId);
        this.workers.setStatus(workerId, 'busy');
        return task;
    }
    handleTaskComplete(workerId, payload) {
        const task = this.tasks.complete(payload.taskId, payload.result);
        if (task) {
            this.credits.awardEarnings(workerId, task.creditsEstimate, task.id);
            this.workers.recordTaskCompletion(workerId, task.creditsEstimate);
        }
    }
    handleTaskFailed(workerId, payload) {
        const task = this.tasks.fail(payload.taskId, payload.reason);
        if (task) {
            this.workers.recordTaskFailure(workerId);
        }
    }
    broadcastTaskAvailable() {
        for (const [connId, conn] of this.connections) {
            if (conn.type === 'worker' && conn.ws.readyState === WebSocket.OPEN) {
                this.send(conn.ws, { type: 'worker:task-available' });
            }
        }
    }
    send(ws, data) {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(data));
        }
    }
    sendError(ws, message) {
        this.send(ws, { type: 'error', payload: { message } });
    }
    sanitizeUser(user) {
        if (!user)
            return null;
        const { password_hash, ...safeUser } = user;
        return safeUser;
    }
}
// ============================================================================
// Start Server
// ============================================================================
new HiveServer().start().catch(console.error);
//# sourceMappingURL=index.js.map