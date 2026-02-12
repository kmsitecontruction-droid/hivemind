/**
 * 🐝 HIVEMIND Drone Controller
 *
 * Manages the worker client that contributes compute to the network.
 */
import WebSocket from 'ws';
import si from 'systeminformation';
import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export class HiveDrone {
    config;
    ws = null;
    stats;
    reconnectTimeout = null;
    heartbeatInterval = null;
    running = false;
    workerId = null;
    constructor(config) {
        this.config = {
            serverUrl: config?.serverUrl || 'ws://localhost:3001',
            maxMemoryMB: config?.maxMemoryMB || 4096,
            maxCPUPercent: config?.maxCPUPercent || 70,
            maxConcurrentTasks: config?.maxConcurrentTasks || 2,
            shareGPU: config?.shareGPU || false
        };
        this.stats = {
            workerId: null,
            status: 'disconnected',
            activeTasks: 0,
            completedTasks: 0,
            failedTasks: 0,
            totalEarnings: 0,
            currentCPU: 0,
            currentMemory: 0,
            gpuUsed: false,
            reputation: 1.0
        };
    }
    async start() {
        this.running = true;
        console.log(chalk.yellow('🚀 Starting HIVEMIND Drone...'));
        // Load configuration from file if exists
        await this.loadConfig();
        // Connect to network
        await this.connect();
        // Start monitoring
        await this.startMonitoring();
    }
    async stop() {
        this.running = false;
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.stats.status = 'disconnected';
        console.log(chalk.dim('🛑 Drone stopped'));
    }
    getStats() {
        return { ...this.stats };
    }
    async loadConfig() {
        const configPath = path.join(os.homedir(), '.hivemind', 'config.json');
        if (fs.existsSync(configPath)) {
            try {
                const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                this.config = { ...this.config, ...savedConfig };
                console.log(chalk.dim('✓ Loaded configuration from ~/.hivemind'));
            }
            catch (error) {
                console.log(chalk.dim('⚠ Using default configuration'));
            }
        }
    }
    async connect() {
        return new Promise((resolve, reject) => {
            console.log(chalk.dim(`Connecting to ${this.config.serverUrl}...`));
            this.stats.status = 'connecting';
            this.ws = new WebSocket(this.config.serverUrl);
            const cleanup = () => {
                this.ws?.removeListener('open', onOpen);
                this.ws?.removeListener('error', onError);
            };
            const onOpen = async () => {
                cleanup();
                this.stats.status = 'connected';
                console.log(chalk.green('✓ Connected to HIVEMIND network'));
                // Register this worker
                await this.registerWorker();
                // Start heartbeat
                this.startHeartbeat();
                resolve();
            };
            const onError = (error) => {
                cleanup();
                this.stats.status = 'disconnected';
                reject(error);
            };
            this.ws.on('open', onOpen);
            this.ws.on('error', onError);
            this.ws.on('close', () => {
                if (this.running) {
                    this.stats.status = 'disconnected';
                    console.log(chalk.yellow('⚠ Disconnected from network'));
                    this.scheduleReconnect();
                }
            });
            this.ws.on('message', async (data) => {
                await this.handleMessage(JSON.parse(data.toString()));
            });
        });
    }
    async registerWorker() {
        const [cpu, mem, graphics] = await Promise.all([
            si.cpu(),
            si.mem(),
            si.graphics()
        ]);
        const gpuInfo = graphics.controllers?.map(g => ({
            name: g.model || 'Unknown GPU',
            vramMB: (g.vram || 0) * 1024
        })) || [];
        this.send({
            type: 'worker:register',
            payload: {
                hostname: os.hostname(),
                cpuCores: cpu.cores || 4,
                gpuInfo: this.config.shareGPU ? gpuInfo : [],
                memoryBytes: mem.total,
                storageBytes: 0
            }
        });
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.stats.status === 'connected') {
                this.send({ type: 'worker:heartbeat' });
                this.stats.status = 'running';
            }
        }, 30000); // Every 30 seconds
    }
    scheduleReconnect() {
        if (!this.running)
            return;
        this.reconnectTimeout = setTimeout(async () => {
            console.log(chalk.dim('Attempting to reconnect...'));
            try {
                await this.connect();
            }
            catch (error) {
                this.scheduleReconnect();
            }
        }, 5000); // Retry every 5 seconds
    }
    async handleMessage(message) {
        const { type, payload } = message;
        switch (type) {
            case 'worker:registered':
                this.workerId = payload.workerId;
                this.stats.workerId = payload.workerId;
                console.log(chalk.green(`✓ Registered as worker: ${this.workerId}`));
                break;
            case 'task:assigned':
                await this.executeTask(payload);
                break;
            case 'error':
                console.error(chalk.red(`Server error: ${payload.message}`));
                break;
        }
    }
    async executeTask(task) {
        this.stats.activeTasks++;
        const startTime = Date.now();
        console.log(chalk.yellow(`⚡ Executing task: ${task.id}`));
        try {
            // In production, this would:
            // 1. Pull Docker image
            // 2. Allocate resources
            // 3. Run task in sandbox
            // 4. Capture output
            // Simulate task execution
            await new Promise(resolve => setTimeout(resolve, 2000));
            const result = {
                taskId: task.id,
                success: true,
                output: { result: 'Task completed' },
                executionTimeMs: 2000
            };
            // Report completion
            this.send({
                type: 'worker:task-complete',
                payload: {
                    taskId: task.id,
                    result: result.output,
                    executionTimeMs: result.executionTimeMs
                }
            });
            this.stats.completedTasks++;
            this.stats.totalEarnings += task.creditsEstimate || 1;
            console.log(chalk.green(`✓ Task ${task.id} completed`));
        }
        catch (error) {
            this.stats.failedTasks++;
            this.send({
                type: 'worker:task-failed',
                payload: {
                    taskId: task.id,
                    reason: error instanceof Error ? error.message : 'Unknown error'
                }
            });
            console.error(chalk.red(`✗ Task ${task.id} failed`));
        }
        finally {
            this.stats.activeTasks--;
            // Request next task
            if (this.stats.activeTasks < this.config.maxConcurrentTasks) {
                this.send({ type: 'worker:request-task' });
            }
        }
    }
    async startMonitoring() {
        const interval = setInterval(async () => {
            if (!this.running) {
                clearInterval(interval);
                return;
            }
            try {
                const [cpu, mem] = await Promise.all([
                    si.currentLoad(),
                    si.mem()
                ]);
                this.stats.currentCPU = cpu.currentLoad;
                this.stats.currentMemory = (mem.used / mem.total) * 100;
            }
            catch (error) {
                // Ignore monitoring errors
            }
        }, 1000);
    }
    send(message) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
    }
}
// Import chalk for use in the class
import chalk from 'chalk';
//# sourceMappingURL=drone.js.map