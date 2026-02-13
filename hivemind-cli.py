#!/usr/bin/env python3
"""
HIVEMIND Production Inference System
Real distributed AI inference with model sharding
"""

import os
import sys
import json
import time
import asyncio
import hashlib
import threading
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Dict, Optional, Callable
from datetime import datetime
import subprocess

# Configuration
HIVEMIND_HOME = os.path.expanduser("~/.hivemind")
MODELS_DIR = os.path.join(HIVEMIND_HOME, "models")
SHARDS_DIR = os.path.join(MODELS_DIR, "shards")
PEER_DB = os.path.join(HIVEMIND_HOME, "peer_db.json")

# Ensure directories exist
os.makedirs(SHARDS_DIR, exist_ok=True)

# Model configurations (size in GB, layers, suggested shards)
MODELS = {
    "tinyllama-1.1b": {"size_gb": 1.2, "layers": 22, "params": "1.1B"},
    "llama-3.2-1b": {"size_gb": 2.0, "layers": 16, "params": "1B"},
    "llama-3.2-3b": {"size_gb": 4.5, "layers": 28, "params": "3B"},
    "qwen-2.5-1.5b": {"size_gb": 3.0, "layers": 28, "params": "1.5B", "context": 32768},
    "phi-3-mini": {"size_gb": 3.5, "layers": 32, "params": "3.8B"},
    "gemma-2b": {"size_gb": 4.0, "layers": 18, "params": "2B"},
}

@dataclass
class Peer:
    id: str
    shards: List[int] = field(default_factory=list)
    last_seen: float = field(default_factory=time.time)
    address: str = ""
    online: bool = True

@dataclass
class Shard:
    id: str
    model_id: str
    layer_start: int
    layer_end: int
    size_mb: float
    file_path: str
    peer_id: str = ""
    downloaded: bool = False

class ModelDownloader:
    """Downloads models from HuggingFace"""
    
    def __init__(self, cache_dir: str = MODELS_DIR):
        self.cache_dir = cache_dir
        self.python = self._find_python()
        
    def _find_python(self) -> str:
        """Find Python with transformers installed"""
        # Check venv first
        venv_python = "/tmp/hivemind-env/bin/python3"
        if os.path.exists(venv_python):
            return venv_python
        
        # Check system
        try:
            result = subprocess.run(
                ["python3", "-c", "import transformers; print('ok')"],
                capture_output=True, timeout=5
            )
            if result.returncode == 0:
                return "python3"
        except:
            pass
        
        return "python3"
    
    def download(self, model_id: str, repo: str, 
                 progress_callback: Optional[Callable] = None) -> bool:
        """Download model from HuggingFace"""
        print(f"⬇️  Downloading {model_id} from {repo}...")
        
        script = f"""
import os
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'
os.environ['TRANSFORMERS_OFFLINE'] = '0'

from transformers import AutoModelForCausalLM, AutoTokenizer
import torch
import sys

try:
    print("Downloading tokenizer...", flush=True)
    tokenizer = AutoTokenizer.from_pretrained('{repo}', cache_dir='{self.cache_dir}')
    print("TOKENIZER_DONE", flush=True)
    
    print("Downloading model...", flush=True)
    model = AutoModelForCausalLM.from_pretrained(
        '{repo}',
        cache_dir='{self.cache_dir}',
        device_map='cpu'
    )
    print("MODEL_DONE", flush=True)
    print("DOWNLOAD_COMPLETE", flush=True)
    
except Exception as e:
    print(f"ERROR: {{e}}", file=sys.stderr, flush=True)
    sys.exit(1)
"""
        try:
            result = subprocess.run(
                [self.python, "-c", script],
                capture_output=True,
                text=True,
                timeout=3600,  # 1 hour timeout
                cwd=self.cache_dir
            )
            
            if "DOWNLOAD_COMPLETE" in result.stdout:
                print(f"✅ {model_id} downloaded successfully!")
                return True
            else:
                print(f"❌ Download failed: {result.stderr}")
                return False
                
        except subprocess.TimeoutExpired:
            print(f"❌ Download timed out")
            return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    def is_downloaded(self, model_id: str) -> bool:
        """Check if model is already downloaded"""
        # Check direct path
        model_path = Path(self.cache_dir) / model_id
        if model_path.exists():
            files = list(model_path.glob("*.bin")) + list(model_path.glob("*.safetensors"))
            if len(files) > 0:
                return True
        
        # Check HuggingFace cache format
        repos = {
            "tinyllama-1.1b": "TinyLlama--TinyLlama-1.1B-Chat-v1.0",
            "llama-3.2-1b": "unsloth--Llama-3.2-1B-Instruct",
            "llama-3.2-3b": "unsloth--Llama-3.2-3B-Instruct",
            "qwen-2.5-1.5b": "Qwen--Qwen2.5-1.5B-Instruct",
            "phi-3-mini": "microsoft--Phi-3-mini-4k-instruct",
            "gemma-2b": "google--gemma-2-2b-it",
        }
        
        hf_name = repos.get(model_id)
        if hf_name:
            hf_path = Path(self.cache_dir) / f"models--{hf_name}"
            if hf_path.exists():
                # Find the actual model files
                snapshots = hf_path / "snapshots"
                if snapshots.exists():
                    for snap in snapshots.iterdir():
                        if snap.is_dir():
                            files = list(snap.glob("*.bin")) + list(snap.glob("*.safetensors")) + list(snap.glob("*.pt"))
                            if len(files) > 0:
                                return True
        
        return False
    
    def get_model_path(self, model_id: str) -> str:
        """Get the actual model path"""
        # Check direct path first
        model_path = Path(self.cache_dir) / model_id
        if model_path.exists():
            return str(model_path)
        
        # Check HuggingFace cache
        repos = {
            "tinyllama-1.1b": "TinyLlama--TinyLlama-1.1B-Chat-v1.0",
            "llama-3.2-1b": "unsloth--Llama-3.2-1B-Instruct",
            "llama-3.2-3b": "unsloth--Llama-3.2-3B-Instruct",
            "qwen-2.5-1.5b": "Qwen--Qwen2.5-1.5B-Instruct",
            "phi-3-mini": "microsoft--Phi-3-mini-4k-instruct",
            "gemma-2b": "google--gemma-2-2b-it",
        }
        
        hf_name = repos.get(model_id)
        if hf_name:
            hf_path = Path(self.cache_dir) / f"models--{hf_name}"
            if hf_path.exists():
                snapshots = hf_path / "snapshots"
                if snapshots.exists():
                    for snap in snapshots.iterdir():
                        if snap.is_dir():
                            return str(snap)
        
        return ""

class ShardManager:
    """Manages model sharding across peers"""
    
    def __init__(self):
        self.my_peer_id = self._generate_peer_id()
        self.my_shards: Dict[str, List[Shard]] = {}  # model_id -> shards
        self.peers: Dict[str, Peer] = {}
        self.load_peer_db()
        
    def _generate_peer_id(self) -> str:
        """Generate unique peer ID"""
        import secrets
        return hashlib.md5(
            f"{os.getpid()}-{time.time()}-{secrets.token_hex(4)}".encode()
        ).hexdigest()[:12]
    
    def _calculate_shards(self, model_id: str, total_peers: int) -> List[Shard]:
        """Calculate shard distribution for a model"""
        if model_id not in MODELS:
            raise ValueError(f"Unknown model: {model_id}")
        
        model = MODELS[model_id]
        layers = model["layers"]
        
        # Each peer gets at least 1 layer
        shards_per_peer = max(1, layers // total_peers)
        
        shards = []
        for peer_idx in range(total_peers):
            layer_start = (peer_idx * layers) // total_peers
            layer_end = ((peer_idx + 1) * layers) // total_peers
            
            if layer_start >= layers:
                break
                
            size_mb = (model["size_gb"] * 1024) / total_peers
            
            shard = Shard(
                id=f"{model_id}-shard-{peer_idx}",
                model_id=model_id,
                layer_start=layer_start,
                layer_end=layer_end,
                size_mb=size_mb,
                file_path=""
            )
            shards.append(shard)
        
        return shards
    
    def calculate_storage(self, model_id: str, peer_count: int) -> dict:
        """Calculate storage requirements"""
        if model_id not in MODELS:
            return {"error": "Unknown model"}
        
        model = MODELS[model_id]
        total_gb = model["size_gb"]
        
        # With sharding
        shards_per_peer = max(1, model["layers"] // peer_count)
        per_peer_mb = (model["size_gb"] * 1024) / peer_count
        
        return {
            "model": model_id,
            "total_size_gb": total_gb,
            "layers": model["layers"],
            "peer_count": peer_count,
            "without_sharding_mb": total_gb * 1024,
            "with_sharding_mb": per_peer_mb,
            "savings_percent": round((1 - (per_peer_mb / (total_gb * 1024))) * 100)
        }
    
    def load_peer_db(self):
        """Load peer database"""
        if os.path.exists(PEER_DB):
            try:
                with open(PEER_DB, 'r') as f:
                    data = json.load(f)
                    for peer_id, info in data.get("peers", {}).items():
                        self.peers[peer_id] = Peer(
                            id=peer_id,
                            shards=info.get("shards", []),
                            last_seen=info.get("last_seen", time.time()),
                            address=info.get("address", "")
                        )
            except:
                pass
    
    def save_peer_db(self):
        """Save peer database"""
        data = {
            "peers": {
                peer_id: {
                    "shards": peer.shards,
                    "last_seen": peer.last_seen,
                    "address": peer.address
                }
                for peer_id, peer in self.peers.items()
            }
        }
        with open(PEER_DB, 'w') as f:
            json.dump(data, f, indent=2)

class InferenceEngine:
    """Runs actual AI inference"""
    
    def __init__(self):
        self.python = self._find_python()
        self.loaded_models: Dict[str, any] = {}
        self.downloader = ModelDownloader()
        
    def _find_python(self) -> str:
        venv_python = "/tmp/hivemind-env/bin/python3"
        if os.path.exists(venv_python):
            return venv_python
        return "python3"
    
    def run_inference(self, prompt: str, model_id: str = "tinyllama-1.1b",
                     max_tokens: int = 256, temperature: float = 0.7) -> dict:
        """Run inference on a model"""
        
        # Find the model
        model_path = self.downloader.get_model_path(model_id)
        if not model_path:
            return {"success": False, "error": f"Model {model_id} not found. Download first."}
        
        script = f"""
import os
import sys
import json
import time

os.environ['TRANSFORMERS_OFFLINE'] = '1'

try:
    from transformers import AutoModelForCausalLM, AutoTokenizer
    import torch
    
    print("Loading tokenizer...", flush=True)
    tokenizer = AutoTokenizer.from_pretrained('{model_path}', local_files_only=True)
    
    print("Loading model...", flush=True)
    model = AutoModelForCausalLM.from_pretrained(
        '{model_path}',
        local_files_only=True,
        device_map='cpu'
    )
    
    print("Running inference...", flush=True)
    start = time.time()
    
    inputs = tokenizer('{prompt.replace("'", "\\'")}', return_tensors="pt", truncation=True, max_length=2048)
    
    outputs = model.generate(
        **inputs,
        max_new_tokens={max_tokens},
        temperature={temperature},
        do_sample=True,
        pad_token_id=tokenizer.eos_token_id
    )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    elapsed = time.time() - start
    tokens = len(outputs[0]) - len(inputs['input_ids'][0])
    
    print(json.dumps({{
        "success": True,
        "output": response,
        "tokens_generated": tokens,
        "time_seconds": round(elapsed, 2),
        "tokens_per_second": round(tokens / elapsed, 1) if elapsed > 0 else 0
    }}), flush=True)
    
except Exception as e:
    import traceback
    print(json.dumps({{
        "success": False,
        "error": str(e),
        "traceback": traceback.format_exc()
    }}), flush=True)
    sys.exit(1)
"""
        
        try:
            result = subprocess.run(
                [self.python, "-c", script],
                capture_output=True,
                text=True,
                timeout=300,
                cwd=str(model_path)
            )
            
            # Parse JSON output
            for line in result.stdout.strip().split('\n'):
                if line.startswith('{') and line.endswith('}'):
                    return json.loads(line)
            
            return {"success": False, "error": result.stderr or "No output"}
            
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Inference timeout (5 min)"}
        except Exception as e:
            return {"success": False, "error": str(e)}

class HIVEMINDCLI:
    """Main CLI for HIVEMIND"""
    
    def __init__(self):
        self.downloader = ModelDownloader()
        self.shard_manager = ShardManager()
        self.inference = InferenceEngine()
    
    def print_banner(self):
        print("""
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🐝  H I V E M I N D                                        ║
║                                                                ║
║   Decentralized AI Compute Network                            ║
║                                                                ║
║   Models • Sharding • Inference                              ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
""")
    
    def cmd_list_models(self):
        """List available models"""
        print("\n🧠 Available Models\n")
        print(f"{'Model':<20} {'Size':<10} {'Params':<10} {'Layers':<10} {'Status'}")
        print("-" * 65)
        
        for model_id, info in MODELS.items():
            downloaded = self.downloader.is_downloaded(model_id)
            status = "✅ downloaded" if downloaded else "⬇️  available"
            
            print(f"{model_id:<20} {info['size_gb']}GB{'':<5} {info['params']:<10} {info['layers']:<10} {status}")
        
        print()
    
    def cmd_download(self, model_id: str):
        """Download a model"""
        if model_id not in MODELS:
            print(f"❌ Unknown model: {model_id}")
            print(f"Available: {', '.join(MODELS.keys())}")
            return
        
        # Get repo
        repos = {
            "tinyllama-1.1b": "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
            "llama-3.2-1b": "unsloth/Llama-3.2-1B-Instruct",
            "llama-3.2-3b": "unsloth/Llama-3.2-3B-Instruct",
            "qwen-2.5-1.5b": "Qwen/Qwen2.5-1.5B-Instruct",
            "phi-3-mini": "microsoft/Phi-3-mini-4k-instruct",
            "gemma-2b": "google/gemma-2-2b-it",
        }
        
        repo = repos.get(model_id, model_id)
        success = self.downloader.download(model_id, repo)
        
        if success:
            print(f"\n✅ {model_id} ready for inference!")
            print(f"   Run: hivemind infer --model {model_id}")
        else:
            print(f"\n❌ Download failed")
    
    def cmd_infer(self, prompt: str, model_id: str = "tinyllama-1.1b", 
                  max_tokens: int = 256):
        """Run inference"""
        print(f"\n🧠 Running inference...")
        print(f"   Model: {model_id}")
        print(f"   Prompt: {prompt[:50]}...")
        print()
        
        result = self.inference.run_inference(prompt, model_id, max_tokens)
        
        if result.get("success"):
            print("✅ Response:\n")
            print("─" * 50)
            print(result.get("output", ""))
            print("─" * 50)
            print(f"\n📊 Stats:")
            print(f"   Tokens: {result.get('tokens_generated', 0)}")
            print(f"   Time: {result.get('time_seconds', 0)}s")
            print(f"   Speed: {result.get('tokens_per_second', 0)} tok/s")
        else:
            print(f"❌ Error: {result.get('error', 'Unknown')}")
    
    def cmd_storage(self, model_id: str = "qwen-2.5-1.5b"):
        """Show storage requirements"""
        print(f"\n💾 Storage Analysis for {model_id}\n")
        print(f"{'Peers':<10} {'Per PC':<15} {'Total':<15} {'Savings'}")
        print("-" * 55)
        
        for peers in [10, 50, 100, 500, 1000, 5000]:
            calc = self.shard_manager.calculate_storage(model_id, peers)
            if "error" in calc:
                continue
                
            print(f"{peers:<10} {calc['with_sharding_mb']:.0f}MB{'':<8} {calc['total_size_gb']}GB{'':<8} {calc['savings_percent']}%")
    
    def cmd_status(self):
        """Show HIVEMIND status"""
        print("\n📊 HIVEMIND Status\n")
        
        # Count downloaded models
        downloaded = [m for m in MODELS.keys() if self.downloader.is_downloaded(m)]
        
        print(f"   Models downloaded: {len(downloaded)}/{len(MODELS)}")
        for m in downloaded:
            print(f"      • {m}")
        
        print(f"\n   Peer ID: {self.shard_manager.my_peer_id}")
        print(f"   Known peers: {len(self.shard_manager.peers)}")
        
        print(f"\n   Storage: {MODELS_DIR}")
    
    def cmd_test(self):
        """Test inference with sample prompts"""
        prompts = [
            "Write a haiku about computers:",
            "What is 2 + 2? Answer in one word:",
            "The capital of France is:",
        ]
        
        for prompt in prompts:
            print(f"\n🧪 Test: {prompt}")
            result = self.inference.run_inference(prompt, "tinyllama-1.1b", 50)
            
            if result.get("success"):
                print(f"   ✅ {result.get('output', '')[:100]}...")
            else:
                print(f"   ❌ {result.get('error', 'Failed')[:50]}")
    
    def cmd_server(self):
        """Start HIVEMIND server"""
        import subprocess
        import sys
        
        server_script = os.path.join(os.path.dirname(__file__), "server-p2p.py")
        
        if not os.path.exists(server_script):
            print("❌ Server script not found")
            return
        
        print("""
🌐 Starting HIVEMIND Server
   Press Ctrl+C to stop
""")
        
        try:
            subprocess.run([sys.executable, server_script])
        except KeyboardInterrupt:
            print("\n👋 Server stopped")
    
    def cmd_worker(self, server_url: str = "ws://localhost:3001"):
        """Start HIVEMIND worker"""
        import subprocess
        import sys
        
        worker_script = os.path.join(os.path.dirname(__file__), "worker-p2p.py")
        
        if not os.path.exists(worker_script):
            print("❌ Worker script not found")
            return
        
        print(f"""
🐝 Starting HIVEMIND Worker
   Server: {server_url}
   Press Ctrl+C to stop
""")
        
        try:
            subprocess.run([sys.executable, worker_script, "--server", server_url])
        except KeyboardInterrupt:
            print("\n👋 Worker stopped")

def main():
    cli = HIVEMINDCLI()
    cli.print_banner()
    
    args = sys.argv[1:]
    
    if not args or args[0] == "help":
        print("""
Usage: hivemind <command> [options]

Commands:
  list                  List available models
  download <model>     Download a model (tinyllama-1.1b, qwen-2.5-1.5b, etc.)
  infer "<prompt>"     Run inference
  infer --model <name> "<prompt>"  Run with specific model
  storage [model]      Show storage requirements
  status               Show HIVEMIND status
  test                 Test inference with sample prompts
  server               Start HIVEMIND server (for network operators)
  worker [url]         Start worker and connect to server

Examples:
  hivemind list
  hivemind download tinyllama-1.1b
  hivemind infer "Hello world"
  hivemind infer --model qwen-2.5-1.5b "Explain quantum computing"
  hivemind storage qwen-2.5-1.5b
  hivemind test
  hivemind server              # Start your own server
  hivemind worker ws://localhost:3001  # Join a network

Models:
  tinyllama-1.1b    1.2GB  - Fast, lowest RAM
  llama-3.2-1b      2.0GB  - Good quality
  llama-3.2-3b      4.5GB  - Best quality  
  qwen-2.5-1.5b    3.0GB  - Long context (32K)
  phi-3-mini        3.5GB  - Microsoft optimized
  gemma-2b          4.0GB  - Google quality

Network Mode:
  1. Start server: hivemind server
  2. Workers join: hivemind worker ws://your-server:3001
  3. Workers get shard assignments automatically!
""")
        return
    
    cmd = args[0]
    
    if cmd == "list":
        cli.cmd_list_models()
        
    elif cmd == "download":
        model = args[1] if len(args) > 1 else "tinyllama-1.1b"
        cli.cmd_download(model)
        
    elif cmd == "infer":
        # Parse args
        model = "tinyllama-1.1b"
        prompt = ""
        
        i = 1
        while i < len(args):
            if args[i] == "--model" and i + 1 < len(args):
                model = args[i + 1]
                i += 2
            else:
                prompt += args[i] + " "
                i += 1
        
        if not prompt:
            print("❌ Please provide a prompt")
            return
            
        cli.cmd_infer(prompt.strip(), model)
        
    elif cmd == "storage":
        model = args[1] if len(args) > 1 else "qwen-2.5-1.5b"
        cli.cmd_storage(model)
        
    elif cmd == "status":
        cli.cmd_status()
        
    elif cmd == "test":
        cli.cmd_test()
        
    elif cmd == "server":
        cli.cmd_server()
        
    elif cmd == "worker":
        server = args[1] if len(args) > 1 else "ws://localhost:3001"
        cli.cmd_worker(server)
        
    else:
        print(f"❌ Unknown command: {cmd}")
        print("Run: hivemind help")

if __name__ == "__main__":
    main()
