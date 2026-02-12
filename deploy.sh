#!/bin/bash

# HIVEMIND Cloud Deployment Script
# Deploy to any Linux server (AWS, DigitalOcean, Hetzner, etc.)

set -e

echo "🐝 HIVEMIND Cloud Deployment"
echo "============================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_PORT="${SERVER_PORT:-3001}"
WEB_PORT="${WEB_PORT:-3000}"
ADMIN_PORT="${ADMIN_PORT:-3003}"
DOMAIN="${DOMAIN:-localhost}"

# Get external IP
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")

echo ""
echo "📋 Configuration:"
echo "   Server Port: $SERVER_PORT"
echo "   Web Port: $WEB_PORT"
echo "   Admin Port: $ADMIN_PORT"
echo "   Public IP: $PUBLIC_IP"
echo ""

# Check for Docker
if command -v docker &> /dev/null; then
    echo "🐳 Docker detected - using containerized deployment"
    DEPLOY_METHOD="docker"
else
    echo "📦 No Docker - using direct Node.js deployment"
    DEPLOY_METHOD="node"
fi

# Step 1: Install Node.js if needed
if [ "$DEPLOY_METHOD" = "node" ]; then
    echo ""
    echo "📦 Installing Node.js 20..."
    if command -v node &> /dev/null; then
        echo "   Node.js already installed: $(node --version)"
    else
        # Install Node.js
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
fi

# Step 2: Download HIVEMIND
echo ""
echo "📥 Downloading HIVEMIND..."
if [ -d "HIVEMIND" ]; then
    echo "   HIVEMIND folder already exists, updating..."
    cd HIVEMIND
    git pull 2>/dev/null || echo "   (No git repo, using existing files)"
else
    # Download or clone
    if command -v git &> /dev/null; then
        git clone https://github.com/YOUR-USERNAME/HIVEMIND.git
        cd HIVEMIND
    else
        echo "   ⚠️  No git installed. Please download HIVEMIND manually."
        echo "   1. Download from: https://github.com/YOUR-USERNAME/HIVEMIND"
        echo "   2. Extract to: $(pwd)/HIVEMIND"
        echo "   3. Run this script again"
        exit 1
    fi
fi

# Step 3: Install dependencies
echo ""
echo "📦 Installing dependencies..."

# Install server dependencies
cd dist/server
npm install --production 2>/dev/null || echo "   (No server deps)"

# Install web dependencies
cd ../web
npm install --production 2>/dev/null || echo "   (No web deps)"

# Install admin dependencies
cd ../admin
npm install --production 2>/dev/null || echo "   (No admin deps)"

cd ../..

# Step 4: Configure environment
echo ""
echo "⚙️  Configuring environment..."
cat > HIVEMIND/.env << EOF
# HIVEMIND Configuration
SERVER_PORT=$SERVER_PORT
WEB_PORT=$WEB_PORT
ADMIN_PORT=$ADMIN_PORT
DOMAIN=$DOMAIN
PUBLIC_IP=$PUBLIC_IP
ADMIN_USERNAME=admin
ADMIN_PASSWORD=hivemind123
EOF

echo "   Environment configured in HIVEMIND/.env"

# Step 5: Start services
echo ""
echo "🚀 Starting HIVEMIND services..."

# Function to check if port is in use
check_port() {
    if lsof -i:$1 &> /dev/null; then
        echo "   ⚠️  Port $1 already in use"
        return 1
    fi
    return 0
}

# Start server
if check_port $SERVER_PORT; then
    cd dist/server
    nohup node index.js > /tmp/hive-server.log 2>&1 &
    echo "   ✅ Server started on port $SERVER_PORT"
    cd ../..
fi

# Start web dashboard
if check_port $WEB_PORT; then
    cd dist/web
    nohup npx serve -s -l $WEB_PORT > /tmp/hive-web.log 2>&1 &
    echo "   ✅ Web dashboard started on port $WEB_PORT"
    cd ../..
fi

# Start admin dashboard
if check_port $ADMIN_PORT; then
    cd dist/admin
    nohup npx serve -s -l $ADMIN_PORT > /tmp/hive-admin.log 2>&1 &
    echo "   ✅ Admin dashboard started on port $ADMIN_PORT"
    cd ../..
fi

# Step 6: Final status
echo ""
echo "============================"
echo "✅ HIVEMIND Deployed Successfully!"
echo "============================"
echo ""
echo "📊 Access Points:"
echo "   Web Dashboard: http://$PUBLIC_IP:$WEB_PORT"
echo "   Admin Panel:   http://$PUBLIC_IP:$ADMIN_PORT"
echo "   WebSocket:     ws://$PUBLIC_IP:$SERVER_PORT"
echo ""
echo "🔐 Admin Credentials:"
echo "   Username: admin"
echo "   Password: hivemind123"
echo ""
echo "📁 Files Location: $(pwd)/HIVEMIND"
echo "📋 Logs:"
echo "   Server: /tmp/hive-server.log"
echo "   Web: /tmp/hive-web.log"
echo "   Admin: /tmp/hive-admin.log"
echo ""

# Wait a moment then show logs
sleep 2
echo "📜 Recent Server Logs:"
tail -10 /tmp/hive-server.log 2>/dev/null || echo "   (No logs yet)"
