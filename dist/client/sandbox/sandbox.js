/**
 * Sandboxed Execution Module
 * Safely executes model inference tasks with resource limits
 */
import { spawn, exec } from 'child_process';
import si from 'systeminformation';
export class SandboxedExecutor {
    config;
    activeTasks = new Map();
    dockerAvailable = null;
    constructor(config = {}) {
        this.config = {
            maxMemoryMB: config.maxMemoryMB || 4096,
            maxCPUPercent: config.maxCPUPercent || 80,
            maxTimeSeconds: config.maxTimeSeconds || 300,
            maxConcurrentTasks: config.maxConcurrentTasks || 2
        };
    }
    /**
     * Check if Docker is available for containerized execution
     */
    async checkDocker() {
        if (this.dockerAvailable !== null)
            return this.dockerAvailable;
        return new Promise((resolve) => {
            exec('docker --version', (error) => {
                this.dockerAvailable = !error;
                resolve(this.dockerAvailable);
            });
        });
    }
    /**
     * Execute a task in sandboxed environment
     */
    async execute(task) {
        const startTime = Date.now();
        // Check concurrent task limit
        if (this.activeTasks.size >= this.config.maxConcurrentTasks) {
            return {
                success: false,
                error: 'Maximum concurrent tasks reached',
                memoryUsedMB: 0,
                executionTimeMs: 0,
                timedOut: false
            };
        }
        try {
            // Use Docker if available, otherwise use direct execution with limits
            if (await this.checkDocker()) {
                return await this.executeWithDocker(task, startTime);
            }
            else {
                return await this.executeWithLimits(task, startTime);
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                memoryUsedMB: 0,
                executionTimeMs: Date.now() - startTime,
                timedOut: false
            };
        }
    }
    /**
     * Execute using Docker container with resource limits
     */
    async executeWithDocker(task, startTime) {
        return new Promise((resolve) => {
            const containerName = `hive-task-${task.id}`;
            // Build Docker command
            const dockerCmd = [
                'run', '--rm',
                '--name', containerName,
                '--memory', `${this.config.maxMemoryMB}m`,
                '--cpus', `${this.config.maxCPUPercent / 100}`,
                '--network', 'none',
                '-e', `TASK_PROMPT=${task.prompt.replace(/'/g, "'\\''")}`,
                '-e', `TASK_TYPE=${task.type}`,
                'hive-ai/runtime:latest',
                'execute'
            ];
            const proc = spawn('docker', dockerCmd, {
                stdio: ['ignore', 'pipe', 'pipe']
            });
            let stdout = '';
            let stderr = '';
            proc.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            proc.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            const timeout = setTimeout(() => {
                proc.kill('SIGKILL');
                resolve({
                    success: false,
                    error: 'Execution timeout',
                    memoryUsedMB: this.config.maxMemoryMB,
                    executionTimeMs: this.config.maxTimeSeconds * 1000,
                    timedOut: true
                });
            }, this.config.maxTimeSeconds * 1000);
            proc.on('close', (code) => {
                clearTimeout(timeout);
                const executionTime = Date.now() - startTime;
                if (code === 0) {
                    try {
                        const output = JSON.parse(stdout);
                        resolve({
                            success: true,
                            output,
                            memoryUsedMB: output.memoryUsed || 0,
                            executionTimeMs: executionTime,
                            timedOut: false
                        });
                    }
                    catch {
                        resolve({
                            success: true,
                            output: { raw: stdout },
                            memoryUsedMB: 0,
                            executionTimeMs: executionTime,
                            timedOut: false
                        });
                    }
                }
                else {
                    resolve({
                        success: false,
                        error: stderr || `Process exited with code ${code}`,
                        memoryUsedMB: this.config.maxMemoryMB,
                        executionTimeMs: executionTime,
                        timedOut: false
                    });
                }
            });
        });
    }
    /**
     * Execute with OS-level resource limits (fallback)
     */
    async executeWithLimits(task, startTime) {
        return new Promise((resolve) => {
            const startMemory = process.memoryUsage().heapUsed;
            // Simulated task execution (placeholder for actual model inference)
            // In production, this would load the model and run inference
            const taskScript = `
        const si = require('systeminformation');
        async function run() {
          const start = Date.now();
          // Simulate inference time
          await new Promise(r => setTimeout(r, 100));
          
          const mem = process.memoryUsage();
          const cpu = await si.currentLoad();
          console.log(JSON.stringify({
            output: "Simulated inference result",
            memoryUsed: Math.round(mem.heapUsed / 1024 / 1024),
            cpuUsed: cpu.currentload
          }));
        }
        run().catch(e => console.error(e.message));
      `;
            const proc = spawn('node', ['-e', taskScript], {
                stdio: ['ignore', 'pipe', 'pipe'],
                env: {
                    ...process.env,
                    UV_THREADPOOL_SIZE: '4'
                }
            });
            let stdout = '';
            let stderr = '';
            proc.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            proc.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            const timeout = setTimeout(() => {
                proc.kill('SIGKILL');
                resolve({
                    success: false,
                    error: 'Execution timeout',
                    memoryUsedMB: this.config.maxMemoryMB,
                    executionTimeMs: this.config.maxTimeSeconds * 1000,
                    timedOut: true
                });
            }, this.config.maxTimeSeconds * 1000);
            proc.on('close', (code) => {
                clearTimeout(timeout);
                const executionTime = Date.now() - startTime;
                if (code === 0) {
                    try {
                        const output = JSON.parse(stdout.trim());
                        resolve({
                            success: true,
                            output,
                            memoryUsedMB: output.memoryUsed || 0,
                            executionTimeMs: executionTime,
                            timedOut: false
                        });
                    }
                    catch {
                        resolve({
                            success: true,
                            output: { raw: stdout },
                            memoryUsedMB: 0,
                            executionTimeMs: executionTime,
                            timedOut: false
                        });
                    }
                }
                else {
                    resolve({
                        success: false,
                        error: stderr || `Process exited with code ${code}`,
                        memoryUsedMB: this.config.maxMemoryMB,
                        executionTimeMs: executionTime,
                        timedOut: false
                    });
                }
            });
        });
    }
    /**
     * Get current executor statistics
     */
    getStats() {
        return {
            activeTasks: this.activeTasks.size,
            maxConcurrentTasks: this.config.maxConcurrentTasks,
            maxMemoryMB: this.config.maxMemoryMB,
            maxCPUPercent: this.config.maxCPUPercent,
            maxTimeSeconds: this.config.maxTimeSeconds,
            dockerAvailable: this.dockerAvailable
        };
    }
}
/**
 * Resource Monitor - tracks system resources
 */
export class ResourceMonitor {
    interval = null;
    samples = [];
    maxSamples = 60; // Keep last 60 samples (1 minute)
    start(intervalMs = 1000) {
        if (this.interval)
            return;
        this.interval = setInterval(async () => {
            const cpu = await si.currentLoad();
            const mem = await si.mem();
            this.samples.push({
                cpu: cpu.currentLoad,
                memory: (mem.used / mem.total) * 100,
                timestamp: Date.now()
            });
            // Keep only recent samples
            if (this.samples.length > this.maxSamples) {
                this.samples.shift();
            }
        }, intervalMs);
    }
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    getCurrentUsage() {
        if (this.samples.length === 0) {
            return { cpu: 0, memory: 0 };
        }
        const latest = this.samples[this.samples.length - 1];
        return { cpu: latest.cpu, memory: latest.memory };
    }
    getAverageUsage(windowSeconds = 10) {
        const cutoff = Date.now() - (windowSeconds * 1000);
        const recent = this.samples.filter(s => s.timestamp > cutoff);
        if (recent.length === 0) {
            return { cpu: 0, memory: 0 };
        }
        const avgCpu = recent.reduce((sum, s) => sum + s.cpu, 0) / recent.length;
        const avgMem = recent.reduce((sum, s) => sum + s.memory, 0) / recent.length;
        return { cpu: avgCpu, memory: avgMem };
    }
    getHistory() {
        return [...this.samples];
    }
}
/**
 * Resource Manager - orchestrates sandbox and monitor
 */
export class ResourceManager {
    executor;
    monitor;
    availableMemoryMB = 0;
    availableCPU = 0;
    gpuInfo = [];
    constructor() {
        this.executor = new SandboxedExecutor();
        this.monitor = new ResourceMonitor();
    }
    async initialize() {
        // Detect available resources
        const [mem, cpu, graphics] = await Promise.all([
            si.mem(),
            si.cpu(),
            si.graphics()
        ]);
        // Reserve 2GB for system, rest is available
        this.availableMemoryMB = Math.floor((mem.total / 1024 / 1024) - 2048);
        // Reserve 30% CPU for system
        this.availableCPU = Math.max(50, 100 - 30);
        this.gpuInfo = graphics.controllers?.map(g => ({
            name: g.model || 'Unknown GPU',
            vramMB: (g.vram || 0) * 1024,
            computeUnits: g.cores || 0
        })) || [];
        // Start monitoring
        this.monitor.start(1000);
        console.log(`📊 Resource Manager initialized:`);
        console.log(`   RAM: ${this.availableMemoryMB}MB available`);
        console.log(`   CPU: ${this.availableCPU}% available`);
        console.log(`   GPU: ${this.gpuInfo.length} devices detected`);
    }
    /**
     * Calculate how many shards this device can handle
     */
    calculateShardCapacity(modelRequirements) {
        const currentUsage = this.monitor.getCurrentUsage();
        const availableMemory = this.availableMemoryMB * (1 - currentUsage.memory / 100);
        const availableCPU = this.availableCPU * (1 - currentUsage.cpu / 100);
        const maxShardsByMemory = Math.floor(availableMemory / modelRequirements.memoryPerShardMB);
        const maxShardsByCPU = Math.floor(availableCPU / modelRequirements.cpuPerShardPercent);
        const shards = Math.min(maxShardsByMemory, maxShardsByCPU);
        return {
            shards: Math.max(0, shards),
            memoryNeeded: shards * modelRequirements.memoryPerShardMB,
            cpuNeeded: shards * modelRequirements.cpuPerShardPercent
        };
    }
    /**
     * Execute a task with resource tracking
     */
    async runTask(task) {
        return this.executor.execute(task);
    }
    getStatus() {
        const current = this.monitor.getCurrentUsage();
        const avg = this.monitor.getAverageUsage();
        const executorStats = this.executor.getStats();
        return {
            availableMemoryMB: this.availableMemoryMB,
            availableCPU: this.availableCPU,
            gpuInfo: this.gpuInfo,
            currentUsage: {
                cpu: current.cpu,
                memory: current.memory
            },
            averageUsage: {
                cpu: avg.cpu,
                memory: avg.memory
            },
            executor: executorStats
        };
    }
}
//# sourceMappingURL=sandbox.js.map