# 🚀 HIVEMIND Cloud Deployment Guide

## Option 1: Railway (Easiest - Recommended)

### Step 1: Login to Railway
```bash
railway login
```
- Choose "Login with GitHub"

### Step 2: Create Project
```bash
railway init
```
- Project name: `hivemind`
- Select "Empty Project"

### Step 3: Deploy Server
```bash
cd dist/server
railway deploy
```

### Step 4: Get URLs
```bash
railway domain
```
- Will give you a URL like: `https://hivemind.up.railway.app`

---

## Option 2: Render (Free)

### Step 1: Go to https://render.com
- Sign up with GitHub

### Step 2: Create Web Service
- New → Web Service
- Connect GitHub repo: `kmsitecontruction-droid/hivemind`
- Root Directory: `dist/server`
- Build Command: `npm install --production`
- Start Command: `node index.js`

---

## Option 3: AWS EC2 (More Work)

### Step 1: Create AWS Account
- Go to: https://portal.aws.amazon.com/billing/signup
- Choose Free Tier (t2.micro is free for 12 months)

### Step 2: Launch EC2
1. Go to EC2 Console
2. Launch Instance:
   - Name: `hivemind`
   - AMI: Amazon Linux 2
   - Type: `t2.micro` (FREE)
   - Key Pair: Create new (download .pem file)

### Step 3: Security Group
Add inbound rules:
- SSH (port 22): Your IP
- HTTP (port 80): Anywhere
- Custom TCP (port 3000): Anywhere  
- Custom TCP (port 3001): Anywhere

### Step 4: Deploy
```bash
# After EC2 is running, copy files:
scp -i your-key.pem -r /Users/claw/Desktop/HIVEMIND ec2-user@YOUR_IP:/home/ec2-user/

# SSH and deploy:
ssh -i your-key.pem ec2-user@YOUR_IP
cd hivemind
./deploy.sh
```

---

## Test Your Deployment

After deployment, test:

```bash
# Check if server is running
curl http://YOUR_URL:3001

# Or use the worker:
python hivemind-cli.py worker ws://YOUR_SERVER:3001
```

---

## Current Status

✅ GitHub: https://github.com/kmsitecontruction-droid/hivemind
⏳ Deploy to cloud: Choose Option 1 (Railway) or 2 (Render)
