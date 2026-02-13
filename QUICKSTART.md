# 🐝 HIVEMIND - Decentralized AI Network

## ⚡ Quick Start (5 minutes)

```bash
# 1. Install dependencies
pip install torch transformers accelerate websockets

# 2. Run inference locally
python hivemind-cli.py infer "Hello AI!"

# 3. Start a server (optional - for network mode)
python hivemind-cli.py server

# 4. Connect workers (in another terminal)
python hivemind-cli.py worker
```

---

## 📦 What's Included

| File | Purpose |
|------|---------|
| `hivemind-cli.py` | Main CLI - models, inference, everything |
| `server-p2p.py` | P2P server - coordinates workers |
| `worker-p2p.py` | P2P worker - runs tasks |
| `requirements.txt` | Python dependencies |

---

## 🚀 Network Modes

### Mode 1: Standalone (your machine only)
```bash
python hivemind-cli.py infer "Your prompt"
python hivemind-cli.py download qwen-2.5-1.5b
```

### Mode 2: Run Your Own Network
```bash
# Terminal 1: Start server
python hivemind-cli.py server

# Terminal 2: Start workers
python hivemind-cli.py worker ws://localhost:3001
python hivemind-cli.py worker ws://localhost:3001  # Add more!
```

### Mode 3: Join Existing Network
```bash
python hivemind-cli.py worker ws://hivemind.example.com:3001
```

---

## 💾 Storage (Model Sharding)

With **1000 peers** sharing the network:

| Model | Without Sharding | With Sharding |
|-------|-----------------|--------------|
| Qwen 2.5 1.5B | 3GB per PC | **3MB per PC** |
| Llama 3.2 3B | 4.5GB per PC | **4.5MB per PC** |

Each peer only stores their assigned layers!

---

## 📖 Commands

```bash
# Models
python hivemind-cli.py list                    # List models
python hivemind-cli.py download tinyllama-1.1b # Download
python hivemind-cli.py storage qwen-2.5-1.5b   # Storage info

# Inference
python hivemind-cli.py infer "Hello!"         # Run locally
python hivemind-cli.py test                     # Test prompts

# Network
python hivemind-cli.py server                  # Start server
python hivemind-cli.py worker                  # Start worker

# Info
python hivemind-cli.py status                  # View status
python hivemind-cli.py help                    # Help
```

---

## 🌐 Deploy to Cloud

```bash
# Railway (free tier)
./deploy-railway.sh

# AWS
./deploy-aws.sh

# Any VPS
./deploy.sh
```

---

## 🔧 Requirements

- Python 3.8+
- 4GB RAM minimum
- Internet connection

---

## 📄 License

MIT

---

**Version:** 1.0.0
**Website:** https://hivemind.ai
