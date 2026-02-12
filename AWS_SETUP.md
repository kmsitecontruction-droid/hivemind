# AWS Free Tier Setup for HIVEMIND

Deploy your HIVEMIND worker on AWS free tier (2GB RAM, 1 vCPU) or larger instances.

---

## Option 1: AWS EC2 Free Tier (2GB RAM)

### Step 1: Launch Instance

1. Go to [AWS EC2 Console](https://console.aws.amazon.com/ec2/)
2. Click **Launch Instance**
3. Choose: **Amazon Linux 2** (free tier eligible)
4. Instance type: **t2.micro** or **t3.micro** (1 vCPU, 1GB RAM)
   - Note: Free tier gives 750 hours/month free
5. Key pair: Create new or use existing
6. Security Group: Allow ports 22 (SSH), 3000-3003 (HIVEMIND)

### Step 2: Connect to Instance

```bash
# From your local terminal
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@YOUR-EC2-IP
```

### Step 3: Install HIVEMIND Worker

```bash
# Install Node.js (required)
sudo yum update -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20

# Download HIVEMIND
cd /home/ec2-user
wget https://github.com/YOUR-USERNAME/HIVEMIND/archive/main.zip
unzip main.zip
cd HIVEMIND-main/dist/client

# Install dependencies
npm install --production

# Configure connection
cd ../../..
cp HIVEMIND-main/.env.example HIVEMIND-main/.env
nano HIVEMIND-main/.env
```

### Step 4: Configure .env

```bash
# Edit .env file
SERVER_URL=ws://YOUR-HOME-IP:3001
# Or use ngrok URL:
# SERVER_URL=ws://shaunte-limy-robena.ngrok-free.dev
WORKER_RAM_GB=1.5
WORKER_CORES=0.8
```

### Step 5: Start Worker

```bash
cd HIVEMIND-main/dist/client
node index.js drone --ram=1.5 --cores=0.8
```

---

## Option 2: AWS Larger Instances

For better performance, use larger instances:

| Instance | RAM | Cores | Use Case |
|----------|-----|-------|----------|
| t3.medium | 4GB | 2 | Standard worker |
| t3.xlarge | 16GB | 4 | Mid-range worker |
| t3.2xlarge | 32GB | 8 | High-performance |

### Install on Larger Instance

```bash
# Same steps as above, but configure more resources:
node index.js drone --ram=4 --cores=2
```

---

## Resource Configuration

### Available Options

| Resource | Range | Example |
|----------|-------|---------|
| RAM | 0.5GB - 16GB | `--ram=1.5` for 1.5GB |
| CPU Cores | 0.5 - max | `--cores=0.8` for 80% of core |
| GPU | 0 - 16GB | `--gpu=0.5` for 0.5GB VRAM |

### Credit Earnings (Based on Resources)

```
┌─────────────────────────────────────────────────────────┐
│  Credits = Base × RAM_Factor × Core_Factor × Reputation │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  0.5GB RAM + 0.5 cores = 0.25× base credits             │
│  1GB RAM + 1 core = 1× base credits                     │
│  2GB RAM + 1 core = 2× base credits                     │
│  4GB RAM + 2 cores = 8× base credits                    │
│  8GB RAM + 4 cores = 32× base credits                   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Auto-Throttling

If your instance lags:

```
Configured: 2GB RAM
            ↓ Detected lag
            ↓ Auto-reduces to 1.8GB
            ↓ Still slow?
            ↓ Reduces to 1.5GB
            ↓ Stable!
```

---

## Health Monitoring

### Check Worker Status

```bash
# On EC2 instance
ps aux | grep node

# View logs
tail -f /home/ec2-user/hive-worker.log
```

### View Dashboard

```
http://YOUR-EC2-PUBLIC-IP:3000
```

---

## Troubleshooting

### Connection Issues

```bash
# Check if ports are open (on your home server)
# Allow EC2 IP in your firewall

# Test connection
curl -v ws://YOUR-HOME-IP:3001
```

### Memory Issues

```bash
# Check available memory
free -h

# Reduce worker resources
node index.js drone --ram=1.0 --cores=0.5
```

### Credits Not Earning

1. Check reputation score: `hive status`
2. Ensure tasks are completing
3. Check network connection

---

## Cost Estimate

| Setup | Monthly Cost (if beyond free tier) |
|-------|-----------------------------------|
| t2.micro (1GB) | ~$9/month |
| t3.medium (4GB) | ~$20/month |
| t3.xlarge (16GB) | ~$60/month |

*First 12 months: t2.micro is free tier eligible*

---

## Security Best Practices

1. **Use IAM roles** instead of access keys
2. **Limit security group** to your IP
3. **Enable termination protection**
4. **Use VPC** instead of default
5. **Regular backups** of configuration

---

## Quick Start Summary

```bash
# 1. Launch EC2 instance (Amazon Linux 2, t2.micro)
# 2. SSH into instance
# 3. Install Node.js 20+
# 4. Download HIVEMIND
# 5. Configure .env with your server URL
# 6. Start worker:
cd HIVEMIND/dist/client
node index.js drone --ram=1.5 --cores=0.8
```

---

**Questions?** Check the main README.md or open an issue on GitHub.
