/**
 * Network Module for HIVEMIND Client
 * Handles WebSocket communication and peer discovery
 */
import WebSocket from 'ws';
import si from 'systeminformation';
import { EventEmitter } from 'events';
import os from 'os';
export class HiveNetwork extends EventEmitter {
    ws = null;
    config;
    workerId = null;
    reconnectTimeout = null;
    heartbeatInterval = null;
    connected = false;
    messageQueue = [];
    pendingMessages = new Map();
    constructor(config = {}) {
        super();
        this.config = {
            serverUrl: config.serverUrl || 'ws://localhost:3001',
            autoReconnect: config.autoReconnect !== false,
            reconnectDelayMs: config.reconnectDelayMs || 5000,
            heartbeatIntervalMs: config.heartbeatIntervalMs || 30000
        };
    }
    /**
     * Connect to the HIVEMIND server
     */
    async connect() {
        return new Promise((resolve, reject) => {
            console.log(`🌐 Connecting to ${this.config.serverUrl}...`);
            this.ws = new WebSocket(this.config.serverUrl);
            let handshakeComplete = false;
            const cleanup = () => {
                this.ws?.removeListener('open', onOpen);
                this.ws?.removeListener('error', onError);
            };
            const onOpen = async () => {
                handshakeComplete = true;
                cleanup();
                this.connected = true;
                console.log('✅ Connected to HIVEMIND network');
                // Register this worker
                await this.registerWorker();
                // Start heartbeat
                this.startHeartbeat();
                // Process queued messages
                await this.flushMessageQueue();
                this.emit('connected');
                resolve();
            };
            const onError = (error) => {
                cleanup();
                if (!handshakeComplete) {
                    reject(error);
                }
            };
            this.ws.on('open', onOpen);
            this.ws.on('error', onError);
            this.ws.on('message', async (data) => {
                await this.handleMessage(JSON.parse(data.toString()));
            });
            this.ws.on('close', () => {
                this.connected = false;
                this.stopHeartbeat();
                this.emit('disconnected');
                if (this.config.autoReconnect) {
                    this.scheduleReconnect();
                }
            });
            this.ws.on('error', (error) => {
                console.error('WebSocket error:', error);
            });
        });
    }
    /**
     * Register this worker with system information
     */
    async registerWorker() {
        const [cpu, mem, disk, graphics] = await Promise.all([
            si.cpu(),
            si.mem(),
            si.diskLayout(),
            si.graphics()
        ]);
        const gpuInfo = graphics.controllers?.map(g => ({
            name: g.model || 'Unknown GPU',
            vramMB: (g.vram || 0) * 1024,
            computeUnits: g.cores || 0
        })) || [];
        this.send({
            type: 'worker:register',
            payload: {
                hostname: os.hostname(),
                cpuCores: cpu.cores || 4,
                gpuInfo,
                memoryBytes: mem.total,
                storageBytes: disk.reduce((total, d) => total + (d.size || 0), 0)
            }
        });
    }
    /**
     * Start heartbeat to keep connection alive
     */
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            if (this.connected) {
                this.send({ type: 'worker:heartbeat' });
            }
        }, this.config.heartbeatIntervalMs);
    }
    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectTimeout)
            return;
        console.log(`🔄 Reconnecting in ${this.config.reconnectDelayMs}ms...`);
        this.reconnectTimeout = setTimeout(async () => {
            this.reconnectTimeout = null;
            try {
                await this.connect();
            }
            catch (error) {
                console.error('Reconnection failed:', error);
                this.scheduleReconnect();
            }
        }, this.config.reconnectDelayMs);
    }
    /**
     * Send message to server
     */
    send(message) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        }
        else if (!this.connected) {
            this.messageQueue.push({
                type: message.type,
                from: this.workerId || 'unknown',
                payload: message,
                timestamp: Date.now()
            });
        }
    }
    /**
     * Handle incoming messages
     */
    async handleMessage(message) {
        const { type, payload } = message;
        switch (type) {
            case 'worker:registered':
                this.workerId = payload.workerId;
                console.log(`🆔 Registered as worker: ${this.workerId}`);
                this.emit('registered', { workerId: this.workerId });
                break;
            case 'task:assigned':
                console.log(`📋 Received task: ${payload.id}`);
                this.emit('task:assigned', payload);
                break;
            case 'worker:status':
                this.emit('worker:status', payload);
                break;
            case 'task:complete':
                // Task completion is handled by the drone
                this.emit('task:complete', payload);
                break;
            case 'error':
                console.error(`Server error: ${payload.message}`);
                this.emit('error', new Error(payload.message));
                break;
            default:
                // Check for pending request-response pairs
                if (this.pendingMessages.has(type)) {
                    const pending = this.pendingMessages.get(type);
                    clearTimeout(pending.timeout);
                    pending.resolve(payload);
                    this.pendingMessages.delete(type);
                }
                this.emit('message', message);
        }
    }
    /**
     * Request a task from the server
     */
    async requestTask() {
        return this.sendWithResponse('worker:request-task', {}, 10000);
    }
    /**
     * Report task completion
     */
    async reportTaskComplete(taskId, result) {
        this.send({
            type: 'worker:task-complete',
            payload: { taskId, result }
        });
    }
    /**
     * Report task failure
     */
    async reportTaskFailed(taskId, reason) {
        this.send({
            type: 'worker:task-failed',
            payload: { taskId, reason }
        });
    }
    /**
     * Send message with expected response
     */
    sendWithResponse(type, payload, timeoutMs) {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                reject(new Error('Not connected'));
                return;
            }
            const messageId = `${type}-${Date.now()}`;
            const timeout = setTimeout(() => {
                this.pendingMessages.delete(messageId);
                reject(new Error(`Request timeout: ${type}`));
            }, timeoutMs);
            this.pendingMessages.set(messageId, { resolve, reject, timeout });
            this.ws.send(JSON.stringify({ type, payload, messageId }));
        });
    }
    /**
     * Flush queued messages after reconnection
     */
    async flushMessageQueue() {
        while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            if (msg) {
                this.send(msg);
            }
        }
    }
    /**
     * Get list of connected peers (from server)
     */
    async getPeers() {
        return this.sendWithResponse('network:get-peers', {}, 5000);
    }
    /**
     * Broadcast message to all peers
     */
    broadcastToPeers(message) {
        this.send({
            type: 'network:broadcast',
            payload: message
        });
    }
    /**
     * Send message to specific peer
     */
    sendToPeer(peerId, message) {
        this.send({
            type: 'network:unicast',
            to: peerId,
            payload: message
        });
    }
    /**
     * Disconnect from network
     */
    disconnect() {
        this.stopHeartbeat();
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
        console.log('🔌 Disconnected from HIVEMIND network');
    }
    /**
     * Get connection status
     */
    getStatus() {
        return {
            connected: this.connected,
            workerId: this.workerId
        };
    }
}
//# sourceMappingURL=network.js.map