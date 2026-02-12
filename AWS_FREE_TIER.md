# 🚀 AWS Free Tier Deployment Guide

## Quick Summary

| Step | Action | URL |
|------|--------|-----|
| 1 | Create AWS Account | https://aws.amazon.com/free |
| 2 | Launch EC2 | https://console.aws.amazon.com/ec2 |
| 3 | Deploy HIVEMIND | Run: `./deploy-to-aws.sh IP ~/.ssh/key.pem` |

---

## Step 1: Create AWS Account

1. Go to: https://aws.amazon.com/free
2. Click "Sign Up" or "Create an AWS Account"
3. Fill in:
   - Email address
   - Password
   - AWS account name: `kmsitecontruction`
4. Select "Personal" account type
5. Enter your details (name, phone, country)
6. **Payment**: Enter credit/debit card (verification only - won't be charged)
7. **Identity Verification**: Enter code sent to phone
8. **Support Plan**: Select "Basic Support (Free)"
9. ✅ Complete signup!

---

## Step 2: Launch EC2 Instance

1. Go to: https://console.aws.amazon.com/ec2
2. Click "Launch Instances"
3. Configure:
   | Field | Value |
   |-------|-------|
   | Name | `hivemind-server` |
   | AMI | Amazon Linux 2 (default) |
   | Instance Type | `t2.micro` ✅ FREE |
   | Key Pair | Create new → `hivemind-key` |
   | Download | Save `.pem` file! |

4. **Network Settings** (Edit):
   - Security Group: Create new
   - Add inbound rules:
     | Type | Port | Source |
     |------|------|--------|
     | SSH | 22 | My IP |
     | HTTP | 80 | Anywhere |
     | Custom TCP | 3000 | Anywhere |
     | Custom TCP | 3001 | Anywhere |
     | Custom TCP | 3003 | Anywhere |

5. Click "Launch Instance"
6. Wait 2-3 minutes for initialization

7. **Copy your EC2 IP**:
   - Go to EC2 Dashboard → Instances
   - Copy "Public IPv4 address"
   - Example: `3.91.123.456`

---

## Step 3: Deploy HIVEMIND

### Save your key
```bash
# Move key to ~/.ssh/
mv ~/Downloads/hivemind-key.pem ~/.ssh/
chmod 400 ~/.ssh/hivemind-key.pem
```

### Deploy
```bash
cd /Users/claw/Desktop/HIVEMIND
./deploy-to-aws.sh 3.91.123.456 ~/.ssh/hivemind-key.pem
```

This will:
- Copy HIVEMIND to your EC2
- Install Node.js 20
- Start all services

---

## Step 4: Access HIVEMIND

| Service | URL |
|---------|-----|
| Web Dashboard | http://YOUR_EC2_IP:3000 |
| Admin Panel | http://YOUR_EC2_IP:3003 |
| Server | ws://YOUR_EC2_IP:3001 |

**Admin Login:**
- Username: `admin`
- Password: `hivemind123`

---

## SSH Access (Optional)

```bash
ssh -i ~/.ssh/hivemind-key.pem ec2-user@YOUR_EC2_IP
```

---

## Cost (Free Tier)

| Resource | Free Limit | Cost After |
|----------|------------|------------|
| t2.micro EC2 | 750 hrs/month | ~$9/month |
| 30GB EBS | 30GB | ~$2/month |
| Transfer | 15GB out | ~$1/month |

**Total on free tier: $0/month for 12 months!**

---

## Troubleshooting

### Can't connect?
- Check Security Group inbound rules
- Ensure EC2 is "Running" state
- Wait 2-3 minutes after launch

### Need to restart server?
```bash
ssh -i ~/.ssh/hivemind-key.pem ec2-user@YOUR_EC2_IP
cd hivemind
pkill -f node
nohup node dist/server/index.js > server.log 2>&1 &
```

### View logs?
```bash
ssh -i ~/.ssh/hivemind-key.pem ec2-user@YOUR_EC2_IP
tail -f /tmp/hive-*.log
```

---

## ✅ Done!

Once deployed, test from your iPhone:
```
http://YOUR_EC2_IP:3000
```

**Congratulations!** You now have a production HIVEMIND server! 🎉
