# 🐝 HIVEMIND

**Decentralized AI Compute Network**

---

## 📚 Documentation

- [Quick Start](#quick-start) - Get running in 5 minutes
- [Dynamic Resources](#-dynamic-resources-new) - Configure precise resource allocation
- [AWS Setup Guide](./AWS_SETUP.md) - Deploy on AWS Free Tier
- [Architecture](./ARCHITECTURE.md) - System design

---

## What is HIVEMIND?

HIVEMIND is a network where people worldwide share their unused computer resources (CPU, GPU, RAM) to run AI models together. In exchange, you earn credits to use the network.

---

## Quick Start

```bash
# Install CLI
cd hivemind/dist/cli
npm install --production

# Run setup wizard
npm start
```

The wizard will guide you through:
1. Setting your resource limits
2. Connecting to a HIVEMIND server
3. Start contributing

---

## Components

### CLI (Terminal Interface)
```bash
cd hivemind/dist/cli
npm start
```

**Features:**
- Interactive setup wizard
- Real-time monitoring
- Security warnings
- Resource configuration

### Web Dashboard
```bash
cd hivemind/dist/web
npm install --production
npm run preview
```
Open: http://localhost:3000

### Worker (Background Process)
```bash
cd hivemind/dist/client
npm install --production
npm start
```

---

## Configuration

Copy `.env.example` to `.env` and configure:

```bash
SERVER_URL=ws://YOUR_SERVER_IP:3001
DASHBOARD_URL=http://YOUR_SERVER_IP:3000
```

Get the server URL from the network operator.

---

## Requirements

- **OS**: macOS, Linux, or Windows with WSL
- **RAM**: 4GB minimum
- **CPU**: Any modern processor
- **Storage**: 500MB free
- **Internet**: Stable connection

---

## Security

Your privacy is protected:

- ✅ Tasks run in isolated containers
- ✅ No filesystem access
- ✅ No network access from tasks
- ✅ You control resource limits
- ✅ Must approve before running tasks

---

## Credits

| Action | Credits |
|--------|---------|
| Complete task (1GB, 1 core) | +1 credit |
| GPU contribution | 2x credits |
| Run query | -1 credit/1000 tokens |

---

## 🎚️ Dynamic Resources (NEW!)

You can now configure **precise amounts** of resources to share - not just all or nothing!

### Configure Your Resources

```bash
# Share exactly 1.5GB RAM and 0.8 CPU cores
npm start -- drone --ram=1.5 --cores=0.8

# Share 4GB RAM and 2 cores
npm start -- drone --ram=4 --cores=2

# Share 8GB RAM, 4 cores, 2GB GPU
npm start -- drone --ram=8 --cores=4 --gpu=2
```

### Resource Slider (Interactive Mode)

When running `npm start`, the wizard asks:

```
How much RAM do you want to share? [1.5GB] ▸
  Use arrow keys or enter exact value (0.5 - 16GB)

How many CPU cores? [1.0] ▸
  Use arrow keys or enter exact value (0.5 - max cores)

Want to share GPU memory? [0GB] ▸
  Enter 0.5, 1, 2, 4, 8 GB
```

### Available Range

| Resource | Min | Max | Increment |
|----------|-----|-----|-----------|
| RAM | 0.5 GB | 512 GB | 0.1 GB |
| CPU Cores | 0.5 | 128 | 0.1 |
| GPU VRAM | 0 GB | 64 GB | 0.5 GB |
| Storage | 10 GB | 4 TB | 1 GB |

### Credit Multiplier Formula

```
Credits = Base × (RAM_GB / 1) × (Cores / 1) × (GPU_GB / 1) × Reputation
```

**Examples:**

| Config | Calculation | Credits/Task |
|--------|-------------|--------------|
| 0.5GB RAM, 0.5 cores | 1 × 0.5 × 0.5 | 0.25 |
| 1GB RAM, 1 core | 1 × 1 × 1 | 1.0 |
| 2GB RAM, 1 core | 1 × 2 × 1 | 2.0 |
| 4GB RAM, 2 cores | 1 × 4 × 2 | 8.0 |
| 8GB RAM, 4 cores, 2GB GPU | 1 × 8 × 4 × 2 | 64.0 |

### 🔄 Auto-Throttling

If your system lags while running tasks, HIVEMIND automatically reduces resources:

```
Starting with: 4GB RAM, 2 cores
                    ↓
          Lag detected (>500ms response)
                    ↓
        Auto-reduce to: 3.5GB RAM
                    ↓
          Still slow?
                    ↓
        Auto-reduce to: 3GB RAM
                    ↓
          Stable! ✓
```

The system finds the **sweet spot** automatically.

### AWS Free Tier Example

AWS t2.micro has 1GB RAM. Configure for optimal performance:

```bash
npm start -- drone --ram=0.8 --cores=0.5 --max-tasks=2
```

This leaves headroom for system processes and prevents OOM kills.

---

## 📊 Network Capacity

With 10,000 contributors:

| Config | Total RAM | Total Cores |
|--------|-----------|-------------|
| 4GB each | 40 TB | 40,000 |
| 8GB each | 80 TB | 80,000 |
| 16GB each | 160 TB | 160,000 |

---

## Commands

| Command | Description |
|---------|-------------|
| `npm start` | Launch CLI |
| `status` | View status |
| `pause` | Stop temporarily |
| `resume` | Resume |
| `stop` | Exit |

---

## Support

See the docs/ folder or contact your network operator.

---

**Version**: 1.0.0
