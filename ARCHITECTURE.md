# 🐝 HIVEMIND Architecture

## Overview

HIVEMIND is a decentralized AI compute network. Users contribute computing power and earn credits.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           HIVEMIND NETWORK                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐     ┌─────────────────┐     ┌─────────────┐                │
│  │  User A     │     │   MAIN HIVE    │     │  User B     │                │
│  │  (Client)   │◄────►│   (Server)     │◄────►│  (Client)   │                │
│  └─────────────┘     └─────────────────┘     └─────────────┘                │
│         │                    │                    │                         │
│         ▼                    ▼                    ▼                         │
│  ┌─────────────┐     ┌─────────────────┐     ┌─────────────┐                │
│  │ Dashboard   │     │  Admin Panel    │     │ Dashboard   │                │
│  │ (Web/CLI)   │     │  (Private)      │     │ (Web/CLI)   │                │
│  └─────────────┘     └─────────────────┘     └─────────────┘                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## User Package Structure

```
HIVEMIND/
├── README.md              ← User docs
├── .env.example          ← Config template
│
├── dist/
│   ├── client/           ← Worker binary
│   ├── web/             ← Dashboard build
│   └── cli/             ← CLI binary
│
└── docker/
    └── runtime/         ← Task containers
        ├── Dockerfile
        └── task-runner.js
```

---

## Components

### CLI (dist/cli/)
- Interactive setup wizard
- Resource configuration
- Real-time monitoring

### Web Dashboard (dist/web/)
- Account management
- Task submission
- Credit balance

### Worker (dist/client/)
- Task execution
- Resource monitoring
- Sandboxed running

### Docker (docker/runtime/)
- Isolated task execution
- Resource limits
- No filesystem access

---

## Configuration

Users configure connection in `.env`:

```
SERVER_URL=ws://SERVER_IP:3001
DASHBOARD_URL=http://SERVER_IP:3000
```

Get server URL from the network operator.

---

## Security

- Tasks run in Docker containers
- No filesystem access
- User-controlled resource limits
- Mandatory approval before running

---

## Credits

- Earn credits by completing tasks
- Spend credits on AI queries
- GPU contributions earn 2x credits

---

## Requirements

- Node.js 18+
- 4GB RAM minimum
- Docker (optional)

---

Version: 1.0.0
