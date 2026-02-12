/**
 * 🐝 HIVEMIND Real-Time Monitor
 *
 * Shows live statistics of your contribution:
 * - Active tasks
 * - Resources used
 * - Credits earned
 * - Network status
 */
export declare class Monitor {
    private running;
    private stats;
    private tasks;
    constructor();
    run(): Promise<void>;
    private monitorLoop;
    private refreshStats;
    private printHeader;
    private printState;
    private createProgressBar;
    private getReputationStars;
    private checkInput;
    private showSettings;
    stop(): void;
}
//# sourceMappingURL=monitor.d.ts.map