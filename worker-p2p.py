#!/usr/bin/env python3
"""
HIVEMIND Worker - P2P Client for Distributed Inference
Connects to server, receives shards, runs inference tasks
"""

import asyncio
import json
import time
import hashlib
import os
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, List
import websockets
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hivemind-worker")

# Configuration
DEFAULT_SERVER = "ws://localhost:3001"
HIVEMIND_HOME = os.path.expanduser("~/.hivemind")

@dataclass
class WorkerConfig:
    server_url: str
    peer_id: Optional[str] = None
    model_id: str = "tinyllama-1.1b"
    max_memory_mb: int = 2048
    shard_count: int = 1
    shards: List[int] = None
    
    def __post_init__(self):
        if self.shards is None:
            self.shards = []

class HIVEMINDWorker:
    def __init__(self, config: WorkerConfig):
        self.config = config
        self.websocket = None
        self.running = False
        self.current_task = None
        
        # Find models
        self.models_dir = Path(HIVEMIND_HOME) / "models"
        
    async def connect(self):
        """Connect to HIVEMIND server"""
        logger.info(f"Connecting to {self.config.server_url}...")
        
        try:
            self.websocket = await websockets.connect(self.config.server_url)
            logger.info("Connected!")
            self.running = True
            
            # Register with server (use worker:register for Node.js server)
            await self.send({
                "type": "worker:register",
                "payload": {
                    "hostname": "worker-" + str(os.getpid())[-4:],
                    "cpuCores": os.cpu_count() or 4,
                    "gpuInfo": [],
                    "memoryBytes": self.config.max_memory_mb * 1024 * 1024,
                    "storageBytes": 1024 * 1024 * 100,
                    "userId": None
                }
            })
            
            # Start heartbeat
            asyncio.create_task(self.heartbeat_loop())
            
            # Start message handler
            await self.message_loop()
            
        except Exception as e:
            logger.error(f"Connection failed: {e}")
            raise
    
    async def disconnect(self):
        """Disconnect from server"""
        self.running = False
        if self.websocket:
            await self.websocket.close()
    
    async def send(self, message: dict):
        """Send message to server"""
        if self.websocket:
            await self.websocket.send(json.dumps(message))
    
    async def message_loop(self):
        """Handle incoming messages"""
        async for message in self.websocket:
            data = json.loads(message)
            await self.handle_message(data)
    
    async def handle_message(self, data: dict):
        """Handle message from server"""
        msg_type = data.get("type")
        payload = data.get("payload", {})
        
        # Handle Node.js server responses
        if msg_type == "worker:registered":
            await self.handle_registered(payload)
        elif msg_type == "task:assigned":
            await self.handle_task_assigned(payload)
        elif msg_type == "task:none" or msg_type == "worker:no-task":
            logger.info("No tasks available, waiting...")
        elif msg_type == "model:selected":
            logger.info(f"Model changed to: {payload.get('model')}")
        elif msg_type == "error":
            logger.warning(f"Server error: {payload.get('message', 'unknown')}")
        elif msg_type == "worker:status":
            logger.info(f"Worker status: {payload}")
        else:
            logger.warning(f"Unknown message: {msg_type}")
    
    async def handle_registered(self, payload: dict):
        """Handle registration confirmation"""
        # Handle Node.js server response format
        self.config.peer_id = payload.get("workerId") or payload.get("peer_id")
        self.config.shards = payload.get("shards", [])
        
        logger.info(f"Registered as {self.config.peer_id}")
        logger.info(f"Assigned shards: {self.config.shards}")
        logger.info(f"Total peers: {payload.get('total_peers', 'N/A')}")
        
        # Start requesting tasks
        asyncio.create_task(self.task_request_loop())
    
    async def handle_task_assigned(self, payload: dict):
        """Handle assigned task"""
        task_id = payload.get("task_id")
        model_id = payload.get("model_id")
        prompt = payload.get("prompt")
        
        logger.info(f"Received task: {task_id}")
        logger.info(f"Running inference: {prompt[:50]}...")
        
        self.current_task = task_id
        
        # Run inference
        result = await self.run_inference(prompt, model_id)
        
        # Report completion (Node.js server format)
        await self.send({
            "type": "worker:task-complete",
            "payload": {
                "taskId": task_id,
                "result": result
            }
        })
        
        logger.info(f"Task {task_id} completed!")
        self.current_task = None
    
    async def run_inference(self, prompt: str, model_id: str) -> dict:
        """Run AI inference"""
        import subprocess
        
        # Find model
        model_path = self.find_model(model_id)
        
        if not model_path:
            return {"error": f"Model {model_id} not found"}
        
        script = f"""
import os
os.environ['TRANSFORMERS_OFFLINE'] = '1'

from transformers import AutoModelForCausalLM, AutoTokenizer
import json
import time

try:
    model_path = '{model_path}'
    
    tokenizer = AutoTokenizer.from_pretrained(model_path, local_files_only=True)
    model = AutoModelForCausalLM.from_pretrained(model_path, local_files_only=True, device_map='cpu')
    
    start = time.time()
    inputs = tokenizer('{prompt.replace("'", "\\'")}', return_tensors="pt", truncation=True, max_length=2048)
    outputs = model.generate(**inputs, max_new_tokens=100, temperature=0.7, do_sample=True)
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    elapsed = time.time() - start
    tokens = len(outputs[0]) - len(inputs['input_ids'][0])
    
    print(json.dumps({{
        "success": True,
        "output": response,
        "tokens": tokens,
        "time": round(elapsed, 2)
    }}))
    
except Exception as e:
    print(json.dumps({{"success": False, "error": str(e)}}))
"""
        
        try:
            result = subprocess.run(
                [sys.executable, "-c", script],
                capture_output=True,
                text=True,
                timeout=120,
                cwd=str(model_path.parent)
            )
            
            # Parse output
            for line in result.stdout.strip().split('\n'):
                if line.startswith('{') and line.endswith('}'):
                    return json.loads(line)
            
            return {"success": False, "error": result.stderr or "No output"}
            
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Timeout"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def find_model(self, model_id: str) -> Optional[str]:
        """Find downloaded model path"""
        # Check direct
        direct = self.models_dir / model_id
        if direct.exists():
            return str(direct)
        
        # Check HuggingFace cache
        repos = {
            "tinyllama-1.1b": "TinyLlama--TinyLlama-1.1B-Chat-v1.0",
            "qwen-2.5-1.5b": "Qwen--Qwen2.5-1.5B-Instruct",
            "llama-3.2-1b": "unsloth--Llama-3.2-1B-Instruct",
        }
        
        hf_name = repos.get(model_id)
        if hf_name:
            hf_path = self.models_dir / f"models--{hf_name}"
            if hf_path.exists():
                snapshots = hf_path / "snapshots"
                if snapshots.exists():
                    for snap in snapshots.iterdir():
                        if snap.is_dir():
                            return str(snap)
        
        return None
    
    async def task_request_loop(self):
        """Periodically request tasks"""
        while self.running:
            await asyncio.sleep(2)  # Check every 2 seconds
            
            if self.current_task is None:
                await self.send({"type": "worker:request-task"})
    
    async def heartbeat_loop(self):
        """Send periodic heartbeats"""
        while self.running:
            await asyncio.sleep(30)
            try:
                await self.send({"type": "peer:heartbeat"})
            except:
                break
    
    async def select_model(self, model_id: str):
        """Request model change"""
        await self.send({
            "type": "model:select",
            "payload": {"model_id": model_id}
        })

async def main():
    import argparse
    
    parser = argparse.ArgumentParser(description="HIVEMIND Worker")
    parser.add_argument("--server", "-s", default=DEFAULT_SERVER, help="Server URL")
    parser.add_argument("--model", "-m", default="tinyllama-1.1b", help="Model to use")
    parser.add_argument("--memory", type=int, default=2048, help="Max memory in MB")
    
    args = parser.parse_args()
    
    config = WorkerConfig(
        server_url=args.server,
        model_id=args.model,
        max_memory_mb=args.memory
    )
    
    worker = HIVEMINDWorker(config)
    
    print(f"""
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🐝 HIVEMIND Worker                                        ║
║                                                                ║
║   Connecting to: {args.server:<40}   ║
║   Model: {args.model:<48}   ║
║   Max Memory: {args.memory}MB{'':<43}   ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
""")
    
    try:
        await worker.connect()
    except KeyboardInterrupt:
        await worker.disconnect()
        print("\n👋 Worker stopped")

if __name__ == "__main__":
    asyncio.run(main())
