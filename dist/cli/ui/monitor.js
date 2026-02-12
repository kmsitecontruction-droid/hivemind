/**
 * 🐝 HIVEMIND Real-Time Monitor
 *
 * Shows live statistics of your contribution:
 * - Active tasks
 * - Resources used
 * - Credits earned
 * - Network status
 */
import chalk from 'chalk';
import si from 'systeminformation';
export class Monitor {
    running = false;
    stats;
    tasks;
    constructor() {
        this.stats = {
            activeTasks: 0,
            completedTasks: 0,
            totalEarnings: 0,
            currentRAM: 0,
            currentCPU: 0,
            gpuUsed: 0,
            networkStatus: 'connected',
            reputation: 1.0
        };
        this.tasks = [];
    }
    async run() {
        this.running = true;
        console.clear();
        this.printHeader();
        // Start monitoring
        await this.monitorLoop();
    }
    async monitorLoop() {
        const pollInterval = 2000; // 2 seconds
        while (this.running) {
            // Get fresh stats
            await this.refreshStats();
            // Print current state
            this.printState();
            // Check for user input
            await this.checkInput();
            // Wait for next poll
            await new Promise(resolve => setTimeout(resolve, pollInterval));
        }
    }
    async refreshStats() {
        try {
            const [cpu, mem, network] = await Promise.all([
                si.currentLoad(),
                si.mem(),
                si.networkStats()
            ]);
            // Simulate HIVEMIND stats (in production, these come from the network)
            this.stats = {
                ...this.stats,
                currentCPU: cpu.currentLoad,
                currentRAM: (mem.used / mem.total) * 100,
                // GPU would come from nvidia-smi or similar
                gpuUsed: 0,
                networkStatus: Math.random() > 0.95 ? 'connecting' : 'connected'
            };
        }
        catch (error) {
            // Ignore errors, keep showing last known stats
        }
    }
    printHeader() {
        console.log(chalk.yellow(`
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║   ${chalk.bold('🐝 HIVEMIND REAL-TIME MONITOR')}                                   ║
║                                                                        ║
║   ${chalk.dim('Press q to quit, s to show settings')}                           ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝
    `));
    }
    printState() {
        const ramBar = this.createProgressBar(this.stats.currentRAM, 100, 'blue');
        const cpuBar = this.createProgressBar(this.stats.currentCPU, 100, 'green');
        // Network status indicator
        const networkIcon = {
            'connected': chalk.green('●'),
            'connecting': chalk.yellow('●'),
            'disconnected': chalk.red('●')
        }[this.stats.networkStatus];
        console.log(chalk.white(`
┌────────────────────────────────────────────────────────────────────────┐
│${chalk.bold(' NETWORK STATUS ')}                                                         │
├────────────────────────────────────────────────────────────────────────┤
│ ${networkIcon} ${this.stats.networkStatus.toUpperCase()}                                              │
│ Reputation: ${this.getReputationStars()} ${chalk.dim(`(${this.stats.reputation.toFixed(2)})`)}                          │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│${chalk.bold(' RESOURCES ')}                                                              │
├────────────────────────────────────────────────────────────────────────┤
│ RAM Usage:  ${ramBar} ${this.stats.currentRAM.toFixed(1)}%                           │
│ CPU Usage:  ${cpuBar} ${this.stats.currentCPU.toFixed(1)}%                           │
│ GPU Usage:  ${this.stats.gpuUsed}%                                                     │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│${chalk.bold(' TASKS ')}                                                                 │
├────────────────────────────────────────────────────────────────────────┤
│ Active:    ${chalk.yellow(this.stats.activeTasks.toString())}                                                    │
│ Completed: ${chalk.green(this.stats.completedTasks.toString())}                                                   │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│${chalk.bold(' EARNINGS ')}                                                              │
├────────────────────────────────────────────────────────────────────────┤
│ Total:     ${chalk.green('⦿ ' + this.stats.totalEarnings.toFixed(2) + ' credits')}                                    │
│ Rate:      ~${(this.stats.completedTasks / 60).toFixed(1)} credits/minute                              │
└────────────────────────────────────────────────────────────────────────┘
    `));
        if (this.tasks.length > 0) {
            console.log(chalk.yellow('\n┌────────────────────────────────────────────────────────────────────────┐'));
            console.log(chalk.yellow('│') + chalk.bold(' ACTIVE TASKS ') + chalk.yellow(' '.repeat(63) + '│'));
            console.log(chalk.yellow('├────────────────────────────────────────────────────────────────────────┤'));
            for (const task of this.tasks.slice(0, 5)) {
                const statusIcon = {
                    'pending': chalk.dim('○'),
                    'running': chalk.green('●'),
                    'completed': chalk.blue('✓'),
                    'failed': chalk.red('✗')
                }[task.status] || '?';
                console.log(chalk.yellow('│') + ` ${statusIcon} ${task.id.substring(0, 8)}... ${task.type.padEnd(15)} ${task.status.padEnd(10)} ${chalk.dim(`${task.runtime}s`)}` + ' '.repeat(27) + chalk.yellow('│'));
            }
            console.log(chalk.yellow('└────────────────────────────────────────────────────────────────────────┘\n'));
        }
    }
    createProgressBar(value, max, color) {
        const width = 20;
        const filled = Math.round((value / max) * width);
        const empty = width - filled;
        const colors = {
            green: chalk.green,
            blue: chalk.blue,
            yellow: chalk.yellow,
            red: chalk.red
        };
        const colorFn = colors[color] || chalk.white;
        return '[' + colorFn('█'.repeat(filled)) + chalk.dim('░'.repeat(empty)) + ']';
    }
    getReputationStars() {
        const stars = Math.round(this.stats.reputation);
        const fullStars = '★'.repeat(Math.min(5, stars));
        const emptyStars = '☆'.repeat(5 - Math.min(5, stars));
        return chalk.yellow(fullStars + emptyStars);
    }
    async checkInput() {
        // Check if there's input available without blocking
        return new Promise((resolve) => {
            const checkInput = () => {
                if (process.stdin.destroyed) {
                    this.running = false;
                    resolve();
                    return;
                }
                // Try to read one character
                process.stdin.once('readable', () => {
                    const chunk = process.stdin.read();
                    if (chunk) {
                        const char = chunk.toString().charAt(0).toLowerCase();
                        if (char === 'q' || char === 'Q') {
                            this.running = false;
                            console.log(chalk.dim('\n👋 Stopping monitor...\n'));
                        }
                        else if (char === 's' || char === 'S') {
                            this.showSettings();
                        }
                    }
                    resolve();
                });
                // Timeout after 100ms
                setTimeout(() => {
                    resolve();
                }, 100);
            };
            checkInput();
        });
    }
    showSettings() {
        console.clear();
        console.log(chalk.yellow(`
╔════════════════════════════════════════════════════════════════════════╗
║                                                                        ║
║   ${chalk.bold('⚙️  CURRENT CONFIGURATION')}                                         ║
║                                                                        ║
╚════════════════════════════════════════════════════════════════════════╝

  Memory:    ${this.stats.currentRAM.toFixed(1)}% used
  CPU:       ${this.stats.currentCPU.toFixed(1)}% used
  GPU:       ${this.stats.gpuUsed}% used
  Tasks:     ${this.stats.activeTasks} active
  Network:   ${this.stats.networkStatus}
  Reputation: ${this.stats.reputation.toFixed(2)}

${chalk.dim('Press any key to return to monitor...')}
    `));
        // Wait for any key press
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once('data', () => {
            process.stdin.setRawMode(false);
            process.stdin.resume();
            console.clear();
            this.printHeader();
        });
    }
    stop() {
        this.running = false;
    }
}
//# sourceMappingURL=monitor.js.map