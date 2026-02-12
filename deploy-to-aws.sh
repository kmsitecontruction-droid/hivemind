#!/bin/bash
# 🚀 Deploy HIVEMIND to AWS EC2

set -e

echo "🐝 AWS EC2 DEPLOYMENT"
echo "======================"
echo ""

# Configuration
EC2_IP="${1:-}"
KEY_PATH="${2:-~/.ssh/hivemind-key.pem}"
REGION="${3:-us-east-1}"

if [ -z "$EC2_IP" ]; then
    echo "📋 DEPLOYMENT STEPS:"
    echo ""
    echo "1. Go to EC2 Console:"
    echo "   https://console.aws.amazon.com/ec2"
    echo ""
    echo "2. Launch Instance:"
    echo "   - Click 'Launch Instances'"
    echo "   - Name: hivemind-server"
    echo "   - AMI: Amazon Linux 2"
    echo "   - Instance Type: t2.micro (FREE TIER)"
    echo "   - Key Pair: Create new key pair"
    echo "   - Download: hivemind-key.pem"
    echo ""
    echo "3. Configure Security Group:"
    echo "   - Add inbound rules:"
    echo "     * SSH (22): My IP"
    echo "     * HTTP (80): Anywhere"
    echo "     * HTTPS (443): Anywhere"
    echo "     * Custom TCP (3000): Anywhere"
    echo "     * Custom TCP (3001): Anywhere"
    echo "     * Custom TCP (3003): Anywhere"
    echo ""
    echo "4. Click 'Launch'"
    echo ""
    echo "5. Wait for instance to initialize (~2 minutes)"
    echo ""
    echo "6. Copy the Public IPv4 address"
    echo ""
    echo "7. Run this script with your IP:"
    echo "   ./deploy-to-aws.sh YOUR_EC2_IP"
    echo ""
    echo "📍 Example:"
    echo "   ./deploy-to-aws.sh 3.91.123.456"
    echo ""
    exit 0
fi

echo "🚀 Deploying to EC2: $EC2_IP"
echo ""

# Download key if not exists
if [ ! -f "$KEY_PATH" ]; then
    echo "📥 Downloading key..."
    # User needs to provide key
    echo "⚠️  Please ensure your key is at: $KEY_PATH"
    echo "   Or specify: ./deploy-to-aws.sh $EC2_PATH ~/.ssh/your-key.pem"
fi

# Connect and deploy
echo "🔐 Connecting to EC2..."
echo ""

echo "📦 Copying HIVEMIND to EC2..."
scp -r -o StrictHostKeyChecking=no -i "$KEY_PATH" . ec2-user@$EC2_IP:/home/ec2-user/hivemind 2>/dev/null || {
    echo "⚠️  Manual copy needed. Run this on your Mac:"
    echo "   scp -i ~/.ssh/hivemind-key.pem -r /Users/claw/Desktop/HIVEMIND ec2-user@$EC2_IP:/home/ec2-user/"
}

echo ""
echo "🔧 Installing on EC2..."
ssh -o StrictHostKeyChecking=no -i "$KEY_PATH" ec2-user@$EC2_IP << 'REMOTE'
cd /home/ec2-user/hivemind

# Install Node.js
if ! command -v node &> /dev/null; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    source ~/.bashrc
    nvm install 20
fi

# Deploy
chmod +x deploy.sh
./deploy.sh
REMOTE

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "📍 Your URLs:"
echo "   Web:     http://$EC2_IP:3000"
echo "   Admin:   http://$EC2_IP:3003"
echo "   Server:  http://$EC2_IP:3001"
echo ""
echo "🔐 SSH Access:"
echo "   ssh -i ~/.ssh/hivemind-key.pem ec2-user@$EC2_IP"
