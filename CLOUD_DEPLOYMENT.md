# 🐝 HIVEMIND Cloud Deployment Guide

Deploy HIVEMIND to the cloud for testing or production.

---

## 🚀 Quick Deploy Options

### Option 1: Railway (Easiest - Free Tier Available)

1. **Create account**
   - Go to [Railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy server**
   ```
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Select your HIVEMIND repository
   - Railway will auto-detect Node.js
   ```

3. **Configure**
   - Build Command: `cd dist/server && npm install --production`
   - Start Command: `node index.js`
   - Environment Variables:
     ```
     SERVER_PORT=8080
     NODE_ENV=production
     ```

4. **Deploy web/admin dashboards**
   - Create separate Railway services for:
     - `dist/web` → serves web dashboard
     - `dist/admin` → serves admin panel

5. **Access**
   ```
   Server: wss://your-app.railway.app
   Web: https://your-web-app.railway.app
   Admin: https://your-admin-app.railway.app
   ```

---

### Option 2: Render (Free Tier Available)

1. **Create account**
   - Go to [Render.com](https://render.com)
   - Sign up with GitHub

2. **Deploy Web Service**
   ```
   - New → Web Service
   - Connect GitHub repo
   - Root Directory: dist/web
   - Build Command: npm install --production
   - Start Command: npx serve -s -l $PORT
   ```

3. **Deploy Server**
   ```
   - New → Background Service
   - Connect GitHub repo
   - Root Directory: dist/server
   - Build Command: cd dist/server && npm install --production
   - Start Command: node index.js
   - Environment: PORT=10000
   ```

4. **Access**
   ```
   Server: wss://your-service.onrender.com
   Web: https://your-web.onrender.com
   ```

---

### Option 3: Fly.io (Good for WebSocket)

1. **Install flyctl**
   ```bash
   brew install flyctl
   flyctl auth login
   ```

2. **Create app**
   ```bash
   fly launch --name hivemind-server
   ```

3. **Deploy**
   ```bash
   fly deploy
   ```

4. **Configure fly.toml for WebSocket**
   ```toml
   [services]
     [services.concurrency]
       type = "connections"
       hard_limit = 100
       soft_limit = 100

   [[services.ports]]
     handlers = ["http"]
     port = 80

   [[services.ports]]
     handlers = ["tls", "http"]
     port = 443
   ```

---

### Option 4: DigitalOcean Droplet (Full Control)

1. **Create Droplet**
   - Size: $4/mo (1GB RAM) or $6/mo (2GB RAM)
   - Image: Ubuntu 22.04 LTS
   - Location: Choose closest to users

2. **SSH into server**
   ```bash
   ssh root@YOUR_DROPLET_IP
   ```

3. **Run deployment script**
   ```bash
   curl -O https://raw.githubusercontent.com/YOUR-USERNAME/HIVEMIND/main/deploy.sh
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Access**
   ```
   Server: http://YOUR_IP:3001
   Web: http://YOUR_IP:3000
   Admin: http://YOUR_IP:3003
   ```

---

### Option 5: AWS EC2 (What You Asked For)

1. **Launch Instance**
   ```
   - Go to EC2 Console
   - Launch Instance
   - AMI: Amazon Linux 2
   - Type: t2.micro (free tier) or t3.small
   - Key pair: Create or select existing
   - Security Group: Allow ports 3000, 3001, 3003
   ```

2. **Connect**
   ```bash
   ssh -i your-key.pem ec2-user@YOUR_EC2_IP
   ```

3. **Install and Deploy**
   ```bash
   # Install Node.js
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 20

   # Download HIVEMIND
   cd /home/ec2-user
   wget https://github.com/YOUR-USERNAME/HIVEMIND/archive/main.zip
   unzip main.zip
   cd HIVEMIND-main

   # Deploy
   chmod +x deploy.sh
   ./deploy.sh
   ```

4. **Update Security Group (Important!)**
   ```
   EC2 → Security Groups → Your Group
   Add inbound rules:
   - Type: Custom TCP | Port: 3000 | Source: 0.0.0.0/0
   - Type: Custom TCP | Port: 3001 | Source: 0.0.0.0/0
   - Type: Custom TCP | Port: 3003 | Source: 0.0.0.0/0
   ```

5. **Access**
   ```
   Web: http://YOUR_EC2_IP:3000
   Admin: http://YOUR_EC2_IP:3003
   WebSocket: ws://YOUR_EC2_IP:3001
   ```

---

## 🔧 Configuration

### Environment Variables

Create `.env` file in HIVEMIND root:

```bash
# Server Configuration
SERVER_PORT=3001
WEB_PORT=3000
ADMIN_PORT=3003

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=hivemind123

# Network
PUBLIC_IP=YOUR_SERVER_IP
DOMAIN=your-domain.com (optional)

# Production
NODE_ENV=production
```

### Updating After Changes

```bash
# Pull latest changes
git pull

# Rebuild
cd apps/server && pnpm build
cp dist/index.js ../HIVEMIND/dist/server/

# Restart services
pkill -f "node.*index.js"
cd HIVEMIND/dist/server && node index.js &
```

---

## 📊 Resource Requirements

| Deployment Type | RAM | CPU | Cost |
|-----------------|-----|-----|------|
| Development | 512 MB | 0.5 vCPU | Free tier |
| Testing | 1 GB | 1 vCPU | ~$5-10/mo |
| Production | 2 GB | 1 vCPU | ~$15-20/mo |

---

## 🔐 Security Considerations

1. **Use HTTPS in production**
   - Get free SSL from Let's Encrypt
   - Or use Cloudflare for free SSL

2. **Restrict admin access**
   ```bash
   # Only allow your IP to admin panel
   iptables -A INPUT -p tcp --dport 3003 -s YOUR_IP -j ACCEPT
   iptables -A INPUT -p tcp --dport 3003 -j DROP
   ```

3. **Use environment variables for secrets**
   - Never commit .env to git
   - Use Railway/Render env vars

---

## 🐛 Troubleshooting

### WebSocket Connection Issues

```bash
# Check if server is running
ps aux | grep node

# Check firewall
sudo ufw status

# Check port listening
netstat -tulpn | grep :3001
```

### High Memory Usage

```bash
# Check memory
free -h

# Reduce worker resources
# Edit deploy.sh and reduce NODE_OPTIONS
```

### Cannot Access from Outside

1. Check cloud firewall (AWS Security Group, GCP Firewall)
2. Check local firewall: `sudo ufw status`
3. Verify server is bound to 0.0.0.0 (not 127.0.0.1)

---

## 📈 Scaling Up

### For More Users

| Increase | Action |
|----------|--------|
| RAM | Upgrade to t3.medium (4GB) or larger |
| CPU | Upgrade to t3.xlarge (16GB) |
| Throughput | Add more instances behind load balancer |

### Load Balancer Setup (AWS)

```
EC2 → Load Balancers → Create Application Load Balancer
- Scheme: Internet-facing
- Listeners: HTTP (80), HTTPS (443), WS (3001)
- Target Group: Your EC2 instances
- Enable sticky sessions for WebSocket
```

---

## 💰 Cost Estimates (AWS)

| Instance | RAM | vCPU | $/month |
|----------|-----|------|---------|
| t3.nano | 0.5 GB | 2 | ~$5 |
| t3.micro | 1 GB | 2 | ~$9 |
| t3.small | 2 GB | 2 | ~$18 |
| t3.medium | 4 GB | 2 | ~$36 |
| t3.large | 8 GB | 2 | ~$72 |

*First 12 months: t2.micro is free tier eligible*

---

**Questions?** Check the main README.md or open an issue.
