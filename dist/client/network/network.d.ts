/**
 * Network Module for HIVEMIND Client
 * Handles WebSocket communication and peer discovery
 */
import { EventEmitter } from 'events';
export interface NetworkConfig {
    serverUrl: string;
    autoReconnect: boolean;
    reconnectDelayMs: number;
    heartbeatIntervalMs: number;
}
export interface PeerInfo {
    id: string;
    hostname: string;
    status: 'online' | 'offline' | 'busy';
    shards: number;
    reputation: number;
}
export interface PeerMessage {
    type: string;
    from: string;
    to?: string;
    payload: any;
    timestamp: number;
}
export declare class HiveNetwork extends EventEmitter {
    private ws;
    private config;
    private workerId;
    private reconnectTimeout;
    private heartbeatInterval;
    private connected;
    private messageQueue;
    private pendingMessages;
    constructor(config?: Partial<NetworkConfig>);
    /**
     * Connect to the HIVEMIND server
     */
    connect(): Promise<void>;
    /**
     * Register this worker with system information
     */
    private registerWorker;
    /**
     * Start heartbeat to keep connection alive
     */
    private startHeartbeat;
    /**
     * Stop heartbeat
     */
    private stopHeartbeat;
    /**
     * Schedule reconnection attempt
     */
    private scheduleReconnect;
    /**
     * Send message to server
     */
    private send;
    /**
     * Handle incoming messages
     */
    private handleMessage;
    /**
     * Request a task from the server
     */
    requestTask(): Promise<any>;
    /**
     * Report task completion
     */
    reportTaskComplete(taskId: string, result: any): Promise<void>;
    /**
     * Report task failure
     */
    reportTaskFailed(taskId: string, reason: string): Promise<void>;
    /**
     * Send message with expected response
     */
    private sendWithResponse;
    /**
     * Flush queued messages after reconnection
     */
    private flushMessageQueue;
    /**
     * Get list of connected peers (from server)
     */
    getPeers(): Promise<PeerInfo[]>;
    /**
     * Broadcast message to all peers
     */
    broadcastToPeers(message: any): void;
    /**
     * Send message to specific peer
     */
    sendToPeer(peerId: string, message: any): void;
    /**
     * Disconnect from network
     */
    disconnect(): void;
    /**
     * Get connection status
     */
    getStatus(): {
        connected: boolean;
        workerId: string | null;
    };
}
//# sourceMappingURL=network.d.ts.map