/**
 * HIVEMIND Drone Client
 * Complete worker implementation with sandbox, network, and resource management
 */
import { HiveNetwork } from './network/network.js';
import { ResourceManager } from './sandbox/sandbox.js';
import { SUPPORTED_MODELS } from './models/manager.js';
export { SUPPORTED_MODELS };
export class HiveDrone {
    network;
    resources;
    config;
    running = false;
    taskLoopInterval = null;
    stats = {
        completed: 0,
        failed: 0,
        active: 0
    };
    constructor(config = {}) {
        this.config = {
            serverUrl: config.serverUrl || 'ws://localhost:3001',
            maxMemoryMB: config.maxMemoryMB || 4096,
            maxCPUPercent: config.maxCPUPercent || 80,
            maxConcurrentTasks: config.maxConcurrentTasks || 2,
            autoReconnect: config.autoReconnect !== false
        };
        this.network = new HiveNetwork({
            serverUrl: this.config.serverUrl,
            autoReconnect: this.config.autoReconnect
        });
        this.resources = new ResourceManager();
    }
    /**
     * Initialize and start the drone
     */
    async start() {
        console.log('🚀 Starting HIVEMIND Drone...');
        // Initialize resource detection (includes model manager)
        await this.resources.initialize();
        // Show model status
        await this.showModelStatus();
        // Set up network event handlers
        this.setupNetworkHandlers();
        // Connect to network
        await this.network.connect();
        this.running = true;
        // Start task polling loop
        this.startTaskLoop();
        console.log('✅ Drone is running!');
        console.log('📊 Status: Type /status to see stats');
    }
    /**
     * Show current model cache status
     */
    async showModelStatus() {
        const models = this.resources.getAvailableModels();
        const downloaded = models.filter(m => m.downloaded);
        console.log('\n🧠 Model Cache:');
        if (downloaded.length === 0) {
            console.log('   No models downloaded yet.');
            console.log('   Run with --download-model <id> to download');
            console.log('   Available: tinyllama-1.1b, llama-3.2-1b, qwen-2.5-1.5b');
        }
        else {
            console.log(`   ${downloaded.length} model(s) ready:`);
            for (const m of downloaded) {
                console.log(`   • ${m.config.name} (${m.cacheSizeMB}MB)`);
            }
        }
        console.log('');
    }
    /**
     * Download a model
     */
    async downloadModel(modelId) {
        console.log(`⬇️  Downloading model: ${modelId}`);
        return await this.resources.downloadModel(modelId);
    }
    /**
     * Set up network event handlers
     */
    setupNetworkHandlers() {
        this.network.on('connected', () => {
            console.log('🔗 Connected to HIVEMIND network');
        });
        this.network.on('disconnected', () => {
            console.log('🔌 Disconnected from network');
        });
        this.network.on('task:assigned', async (task) => {
            await this.executeTask(task);
        });
        this.network.on('error', (error) => {
            console.error('Network error:', error.message);
        });
    }
    /**
     * Start periodic task polling
     */
    startTaskLoop() {
        this.taskLoopInterval = setInterval(async () => {
            if (!this.running)
                return;
            const status = this.getStatus();
            if (!status.network.connected)
                return;
            // Check if we can handle more tasks
            if (status.resources.executor.activeTasks < this.config.maxConcurrentTasks) {
                await this.requestTask();
            }
        }, 5000);
    }
    /**
     * Request a task from the server
     */
    async requestTask() {
        try {
            const task = await this.network.requestTask();
            if (task) {
                await this.executeTask(task);
            }
        }
        catch (error) {
            // Silently ignore - no tasks available
        }
    }
    /**
     * Execute a task in the sandbox
     */
    async executeTask(task) {
        this.stats.active++;
        const taskConfig = {
            id: task.id,
            type: task.type || 'inference',
            prompt: task.inputData?.prompt || JSON.stringify(task.inputData),
            modelPath: task.inputData?.model,
            maxTokens: task.inputData?.maxTokens,
            temperature: task.inputData?.temperature
        };
        console.log(`⚡ Executing task ${task.id}...`);
        try {
            const result = await this.resources.runTask(taskConfig);
            if (result.success) {
                await this.network.reportTaskComplete(task.id, result.output);
                this.stats.completed++;
                console.log(`✅ Task ${task.id} completed in ${result.executionTimeMs}ms`);
            }
            else {
                await this.network.reportTaskFailed(task.id, result.error || 'Unknown error');
                this.stats.failed++;
                console.error(`❌ Task ${task.id} failed: ${result.error}`);
            }
        }
        catch (error) {
            await this.network.reportTaskFailed(task.id, error instanceof Error ? error.message : 'Execution error');
            this.stats.failed++;
            console.error(`❌ Task ${task.id} error:`, error);
        }
        finally {
            this.stats.active--;
        }
    }
    /**
     * Get current drone status
     */
    getStatus() {
        return {
            network: this.network.getStatus(),
            resources: this.resources.getStatus(),
            tasks: { ...this.stats, active: this.stats.active },
            config: {
                requestedRAMGB: this.config.requestedRAMGB || 1,
                requestedCores: this.config.requestedCores || 1,
                requestedGPUGB: this.config.requestedGPUGB || 0
            }
        };
    }
    /**
     * Calculate how many model shards this drone can handle
     */
    getShardCapacity() {
        return this.resources.calculateShardCapacity({
            memoryPerShardMB: 2048, // 2GB per shard (LLaMA 7B)
            cpuPerShardPercent: 30,
            gpuRequired: false
        });
    }
    /**
     * Stop the drone
     */
    async stop() {
        console.log('🛑 Stopping drone...');
        this.running = false;
        if (this.taskLoopInterval) {
            clearInterval(this.taskLoopInterval);
            this.taskLoopInterval = null;
        }
        this.network.disconnect();
        console.log('✅ Drone stopped');
    }
}
// ============================================================================
// CLI Entry Point
// ============================================================================
import dotenv from 'dotenv';
dotenv.config();
// Parse command line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    let serverUrl = process.env.SERVER_URL || 'ws://localhost:3001';
    let maxMemoryMB = parseInt(process.env.MAX_MEMORY || '4096', 10);
    let maxCPUPercent = parseInt(process.env.MAX_CPU || '80', 10);
    let maxConcurrentTasks = parseInt(process.env.MAX_TASKS || '2', 10);
    let ramGB = parseFloat(process.env.RAM_GB || '1');
    let cores = parseFloat(process.env.CORES || '1');
    let gpuGB = parseFloat(process.env.GPU_GB || '0');
    let enableAutoThrottle = process.env.AUTO_THROTTLE !== 'false';
    // Parse CLI args
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === '--server' || arg === '-s') {
            serverUrl = args[++i] || serverUrl;
        }
        else if (arg === '--ram' || arg === '-r') {
            ramGB = parseFloat(args[++i]) || ramGB;
        }
        else if (arg === '--cores' || arg === '-c') {
            cores = parseFloat(args[++i]) || cores;
        }
        else if (arg === '--gpu' || arg === '-g') {
            gpuGB = parseFloat(args[++i]) || gpuGB;
        }
        else if (arg === '--max-tasks') {
            maxConcurrentTasks = parseInt(args[++i], 10) || maxConcurrentTasks;
        }
        else if (arg === '--no-throttle') {
            enableAutoThrottle = false;
        }
        else if (arg === '--help' || arg === '-h') {
            console.log(`
🐝 HIVEMIND Drone Client

Usage: npm start -- [options]

Options:
  --server, -s <url>    Server WebSocket URL
  --ram, -r <GB>        RAM to allocate (0.5 - 512 GB)
  --cores, -c <num>     CPU cores to use (0.5 - 128)
  --gpu, -g <GB>        GPU VRAM to allocate (0 - 64 GB)
  --max-tasks <num>     Max concurrent tasks (default: 2)
  --no-throttle         Disable auto-throttling
  --help, -h            Show this help

Examples:
  npm start -- --ram=1.5 --cores=0.8
  npm start -- --ram=4 --cores=2 --max-tasks=4
  npm start -- --ram=8 --cores=4 --gpu=2

Environment Variables:
  SERVER_URL        Server WebSocket URL
  RAM_GB            RAM allocation in GB
  CORES             CPU cores to use
  GPU_GB            GPU VRAM in GB
  MAX_TASKS         Max concurrent tasks
  AUTO_THROTTLE     Enable auto-throttling (true/false)
`);
            process.exit(0);
        }
    }
    return {
        serverUrl,
        maxMemoryMB: Math.floor(ramGB * 1024), // Convert GB to MB
        maxCPUPercent,
        maxConcurrentTasks,
        ramGB,
        cores,
        gpuGB,
        enableAutoThrottle
    };
}
async function main() {
    const config = parseArgs();
    console.log('🐝 HIVEMIND Drone Starting...');
    console.log(`   RAM: ${config.ramGB}GB | Cores: ${config.cores} | GPU: ${config.gpuGB}GB`);
    console.log(`   Server: ${config.serverUrl}`);
    console.log('');
    const drone = new HiveDrone({
        serverUrl: config.serverUrl,
        maxMemoryMB: config.maxMemoryMB,
        maxCPUPercent: config.maxCPUPercent,
        maxConcurrentTasks: config.maxConcurrentTasks,
        requestedRAMGB: config.ramGB,
        requestedCores: config.cores,
        requestedGPUGB: config.gpuGB,
        enableAutoThrottle: config.enableAutoThrottle
    });
    // Handle shutdown
    process.on('SIGINT', async () => {
        console.log('\n👋 Received shutdown signal');
        await drone.stop();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        console.log('\n👋 Received termination signal');
        await drone.stop();
        process.exit(0);
    });
    try {
        await drone.start();
        // Print status
        const status = drone.getStatus();
        console.log('\n📊 Drone Status:');
        console.log(`   Worker ID: ${status.network.workerId || 'Not registered'}`);
        console.log(`   Connected: ${status.network.connected}`);
        console.log(`   RAM Allocated: ${config.ramGB}GB`);
        console.log(`   Cores Allocated: ${config.cores}`);
        console.log(`   GPU Allocated: ${config.gpuGB}GB`);
        // Keep process alive
        await new Promise(() => { });
    }
    catch (error) {
        console.error('Failed to start drone:', error);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=index.js.map