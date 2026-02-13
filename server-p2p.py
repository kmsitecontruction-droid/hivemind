#!/usr/bin/env python3
"""
HIVEMIND Server - P2P Coordination for Distributed Inference
Manages worker peers, shard distribution, and task coordination
"""

import asyncio
import json
import time
import hashlib
import uuid
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set
from datetime import datetime
import websockets
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hivemind-server")

# Configuration
HOST = "0.0.0.0"
PORT = 3001
HEARTBEAT_TIMEOUT = 60  # seconds

# Model configurations
MODELS = {
    "tinyllama-1.1b": {"layers": 22, "size_gb": 1.2},
    "qwen-2.5-1.5b": {"layers": 28, "size_gb": 3.0},
    "llama-3.2-1b": {"layers": 16, "size_gb": 2.0},
    "llama-3.2-3b": {"layers": 28, "size_gb": 4.5},
}

@dataclass
class Peer:
    id: str
    websocket: object
    address: str
    capabilities: Dict = field(default_factory=dict)
    shards: List[int] = field(default_factory=list)
    status: str = "connecting"  # connecting, online, busy, offline
    reputation: float = 1.0
    last_heartbeat: float = field(default_factory=time.time)
    total_tasks: int = 0
    successful_tasks: int = 0

@dataclass
class Task:
    id: str
    model_id: str
    prompt: str
    user_id: str
    status: str = "pending"  # pending, assigned, running, completed, failed
    assigned_peer: Optional[str] = None
    result: Optional[dict] = None
    created_at: float = field(default_factory=time.time)
    completed_at: Optional[float] = None

class HIVEMINDServer:
    def __init__(self):
        self.peers: Dict[str, Peer] = {}
        self.tasks: Dict[str, Task] = {}
        self.active_model: str = "tinyllama-1.1b"
        
    async def handle_connection(self, websocket, path):
        """Handle new WebSocket connection"""
        peer_id = self._generate_peer_id()
        peer = Peer(
            id=peer_id,
            websocket=websocket,
            address=websocket.remote_address[0] if websocket.remote_address else "unknown",
        )
        self.peers[peer_id] = peer
        
        logger.info(f"New peer connected: {peer_id}")
        
        try:
            async for message in websocket:
                await self.handle_message(peer, json.loads(message))
        except websockets.exceptions.ConnectionClosed:
            pass
        finally:
            if peer_id in self.peers:
                del self.peers[peer_id]
            logger.info(f"Peer disconnected: {peer_id}")
    
    async def handle_message(self, peer: Peer, message: dict):
        """Handle message from peer"""
        msg_type = message.get("type")
        payload = message.get("payload", {})
        
        if msg_type == "peer:register":
            await self.handle_register(peer, payload)
        elif msg_type == "peer:heartbeat":
            await self.handle_heartbeat(peer)
        elif msg_type == "peer:shards":
            await self.handle_shards(peer, payload)
        elif msg_type == "task:request":
            await self.handle_task_request(peer)
        elif msg_type == "task:complete":
            await self.handle_task_complete(peer, payload)
        elif msg_type == "task:failed":
            await self.handle_task_failed(peer, payload)
        elif msg_type == "model:select":
            await self.handle_model_select(peer, payload)
    
    async def handle_register(self, peer: Peer, payload: dict):
        """Handle peer registration"""
        peer.capabilities = payload.get("capabilities", {})
        peer.status = "online"
        
        # Assign shards based on peer count
        await self.assign_shards(peer)
        
        # Send registration confirmation
        await self.send(peer, {
            "type": "peer:registered",
            "payload": {
                "peer_id": peer.id,
                "shards": peer.shards,
                "model": self.active_model,
                "total_peers": len(self.peers)
            }
        })
        
        logger.info(f"Peer {peer.id} registered with {len(peer.shards)} shards")
    
    async def handle_heartbeat(self, peer: Peer):
        """Handle peer heartbeat"""
        peer.last_heartbeat = time.time()
        peer.status = "online"
    
    async def handle_shards(self, peer: Peer, payload: dict):
        """Handle shard availability update"""
        peer.shards = payload.get("shards", [])
        logger.info(f"Peer {peer.id} updated shards: {peer.shards}")
    
    async def handle_task_request(self, peer: Peer):
        """Handle peer requesting a task"""
        if peer.status == "busy":
            return
        
        # Find pending task
        task = None
        for t in self.tasks.values():
            if t.status == "pending":
                task = t
                break
        
        if not task:
            await self.send(peer, {"type": "task:none"})
            return
        
        # Assign task to peer
        task.status = "assigned"
        task.assigned_peer = peer.id
        peer.status = "busy"
        
        await self.send(peer, {
            "type": "task:assigned",
            "payload": {
                "task_id": task.id,
                "model_id": task.model_id,
                "prompt": task.prompt,
                "shards_needed": list(range(len(peer.shards)))
            }
        })
        
        logger.info(f"Task {task.id} assigned to peer {peer.id}")
    
    async def handle_task_complete(self, peer: Peer, payload: dict):
        """Handle task completion"""
        task_id = payload.get("task_id")
        result = payload.get("result", {})
        
        if task_id in self.tasks:
            task = self.tasks[task_id]
            task.status = "completed"
            task.result = result
            task.completed_at = time.time()
            
            peer.status = "online"
            peer.total_tasks += 1
            peer.successful_tasks += 1
            
            # Update reputation
            peer.reputation = min(2.0, peer.reputation + 0.01)
            
            await self.send(peer, {"type": "task:accepted"})
            logger.info(f"Task {task_id} completed by {peer.id}")
    
    async def handle_task_failed(self, peer: Peer, payload: dict):
        """Handle task failure"""
        task_id = payload.get("task_id")
        
        if task_id in self.tasks:
            task = self.tasks[task_id]
            task.status = "failed"
            
            peer.status = "online"
            peer.total_tasks += 1
            peer.reputation = max(0.1, peer.reputation - 0.05)
            
            logger.warning(f"Task {task_id} failed on {peer.id}")
    
    async def handle_model_select(self, peer: Peer, payload: dict):
        """Handle model selection"""
        model_id = payload.get("model_id")
        if model_id in MODELS:
            self.active_model = model_id
            await self.assign_shards(peer)
            await self.send(peer, {
                "type": "model:selected",
                "payload": {"model": model_id}
            })
    
    async def assign_shards(self, peer: Peer):
        """Assign shards to peer based on current peers"""
        if self.active_model not in MODELS:
            return
            
        model = MODELS[self.active_model]
        layers = model["layers"]
        peer_count = len([p for p in self.peers.values() if p.status != "offline"])
        
        if peer_count == 0:
            peer_count = 1
        
        # Calculate which layers this peer owns
        layers_per_peer = layers // peer_count
        peer_index = list(self.peers.keys()).index(peer.id)
        
        start_layer = peer_index * layers_per_peer
        end_layer = min(start_layer + layers_per_peer, layers)
        
        peer.shards = list(range(start_layer, end_layer))
    
    async def send(self, peer: Peer, message: dict):
        """Send message to peer"""
        try:
            await peer.websocket.send(json.dumps(message))
        except:
            pass
    
    def create_task(self, user_id: str, prompt: str, model_id: str = None) -> Task:
        """Create a new inference task"""
        if model_id is None:
            model_id = self.active_model
            
        task = Task(
            id=str(uuid.uuid4())[:8],
            model_id=model_id,
            prompt=prompt,
            user_id=user_id
        )
        self.tasks[task.id] = task
        
        # Notify available peers
        self.broadcast({"type": "task:available", "payload": {"model": model_id}})
        
        return task
    
    def broadcast(self, message: dict):
        """Broadcast to all peers"""
        for peer in self.peers.values():
            asyncio.create_task(self.send(peer, message))
    
    def get_stats(self) -> dict:
        """Get server statistics"""
        online_peers = [p for p in self.peers.values() if p.status != "offline"]
        
        return {
            "model": self.active_model,
            "total_peers": len(self.peers),
            "online_peers": len(online_peers),
            "total_tasks": len(self.tasks),
            "pending_tasks": len([t for t in self.tasks.values() if t.status == "pending"]),
            "completed_tasks": len([t for t in self.tasks.values() if t.status == "completed"]),
            "layers": MODELS.get(self.active_model, {}).get("layers", 0),
            "shards_per_peer": len(online_peers[0].shards) if online_peers else 0
        }
    
    def _generate_peer_id(self) -> str:
        return hashlib.md5(f"{time.time()}-{uuid.uuid4()}".encode()).hexdigest()[:12]

async def main():
    server = HIVEMINDServer()
    
    logger.info(f"Starting HIVEMIND Server on ws://{HOST}:{PORT}")
    logger.info(f"Available models: {list(MODELS.keys())}")
    
    # Start WebSocket server
    async with websockets.serve(server.handle_connection, HOST, PORT):
        # Create some test tasks
        test_prompts = [
            "What is quantum computing?",
            "Explain machine learning in simple terms",
            "Write a haiku about computers"
        ]
        
        for i, prompt in enumerate(test_prompts):
            server.create_task(f"user_{i}", prompt)
        
        logger.info(f"Created {len(test_prompts)} test tasks")
        
        # Keep running
        await asyncio.Future()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Server stopped")
