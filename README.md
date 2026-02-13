# 🐝 HIVEMIND

**Decentralized AI Compute Network**

---

## ⚡ Quick Start

```bash
# Clone or download this package
cd HIVEMIND

# Run with one command
./hivemind.sh infer "Hello AI!"

# Or use Python directly
pip install -r requirements.txt
python hivemind-cli.py infer "Your prompt here"
```

---

## 🎯 What is HIVEMIND?

HIVEMIND is a **decentralized AI supercomputer** that lets people worldwide share their unused computer resources to run AI models together.

### How It Works

1. **Download a model** (just 5-30MB with sharding!)
2. **Join the network** as a worker
3. **Earn credits** by contributing compute
4. **Spend credits** to run AI queries

### Storage Magic

With **model sharding**, the model is split across thousands of PCs:

| Peers | Storage/PC | Model |
|-------|------------|-------|
| 10 | 300MB | 3GB |
| 100 | 30MB | 3GB |
| 1000 | 3MB | 3GB |

---

## 📦 What's Included

| File | Purpose |
|------|---------|
| `hivemind.sh` | One-script startup (recommended) |
| `hivemind-cli.py` | Main CLI with all features |
| `server-p2p.py` | P2P server for network mode |
| `worker-p2p.py` | Worker client |
| `requirements.txt` | Python dependencies |

---

## 🚀 Commands

### Local Inference (no network needed)

```bash
# Run inference
./hivemind.sh infer "Explain quantum computing"
./hivemind.sh infer "Write a poem about AI"

# Download models
./hivemind.sh download tinyllama-1.1b
./hivemind.sh download qwen-2.5-1.5b

# List models
python hivemind-cli.py list

# Test
python hivemind-cli.py test
```

### Network Mode (run your own network)

```bash
# Terminal 1: Start server
./hivemind.sh server

# Terminal 2+: Add workers
./hivemind.sh worker ws://localhost:3001
./hivemind.sh worker ws://localhost:3001
```

### Python Direct

```bash
python hivemind-cli.py infer "Hello!"
python hivemind-cli.py download tinyllama-1.1b
python hivemind-cli.py status
python hivemind-cli.py storage qwen-2.5-1.5b
```

---

## 🧠 Available Models

| Model | Size | Best For |
|-------|------|----------|
| **tinyllama-1.1b** | 1.2GB | Fast, low RAM |
| **qwen-2.5-1.5b** | 3GB | Long context (32K) |
| **llama-3.2-1b** | 2GB | Meta quality |
| **llama-3.2-3b** | 4.5GB | Best quality |
| **phi-3-mini** | 3.5GB | Microsoft |
| **gemma-2b** | 4GB | Google |

---

## ☁️ Deploy to Cloud

### Railway (Recommended - Free Tier)

```bash
# Deploy server
./deploy-railway.sh

# Or manually:
# 1. Push to GitHub
# 2. Connect to Railway.app
# 3. Set PORT=3001
# 4. Deploy!
```

### AWS EC2

```bash
./deploy-aws.sh
```

### Any VPS

```bash
./deploy.sh
```

---

## 🔧 Requirements

- Python 3.8+
- 4GB RAM (for local inference)
- Internet connection

---

## 📡 Architecture

```
                    ┌─────────────┐
                    │   Server    │
                    │  (You!)    │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
    ┌─────────┐      ┌─────────┐       ┌─────────┐
    │ Worker  │      │ Worker  │       │ Worker  │
    │   #1   │      │   #2    │       │   #3    │
    │ Shard 1│      │ Shard 2 │       │ Shard 3 │
    └─────────┘      └─────────┘       └─────────┘
    
    Each worker runs 1 layer of the model!
```

---

## 🔐 Security

- ✅ Tasks run in isolated containers
- ✅ No filesystem access from tasks  
- ✅ No network access (except server)
- ✅ Your data stays local

---

## 📄 License

MIT License

---

**Version:** 1.0.0  
**Website:** https://hivemind.ai
