#!/bin/bash

# 🚀 HIVEMIND One-Click Cloud Deployment
# Run this script to deploy to Railway.app

set -e

echo "🐝 HIVEMIND One-Click Deployment"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Git
if ! command -v git &> /dev/null; then
    echo "❌ Git not installed. Install git first."
    exit 1
fi
echo "   ✅ Git installed"

# Check GitHub CLI
if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI not found. Installing..."
    brew install gh
fi
echo "   ✅ GitHub CLI installed"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found. Installing..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "   ✅ Node.js $(node --version) installed"

# Step 1: Ensure HIVEMIND is in a git repo
echo ""
echo "📦 Step 1: Setting up Git repository..."
cd /Users/claw/Desktop/HIVEMIND

# Initialize git if needed
if [ ! -d ".git" ]; then
    git init
    echo "   ✅ Git initialized"
fi

# Configure git
git config user.email "kmsitecontruction@gmail.com"
git config user.name "K M"

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
*.log
.env
.DS_Store
data/
*.db
*.sqlite
dist/node_modules/
EOF

# Add all files
git add -A
git commit -m "HIVEMIND - Decentralized AI Compute Network" 2>/dev/null || echo "   (Nothing new to commit)"

echo "   ✅ Repository ready"

# Step 2: GitHub Setup
echo ""
echo "🔐 Step 2: GitHub Authentication..."

# Check if logged in
if ! gh auth status &> /dev/null; then
    echo "   Please login to GitHub:"
    gh auth login
fi

GITHUB_USERNAME=$(gh api user 2>/dev/null | grep -o '"login": "[^"]*"' | cut -d'"' -f4)
[ -z "$GITHUB_USERNAME" ] && GITHUB_USERNAME="kmsitecontruction"

echo "   ✅ Logged in as: @$GITHUB_USERNAME"

# Create repository
REPO_NAME="hivemind"
echo ""
echo "📁 Step 3: Creating GitHub repository..."
gh repo create "$REPO_NAME" --public --description "Decentralized AI Compute Network" --source=. --push 2>/dev/null || {
    echo "   Repository may exist, pushing updates..."
    git remote get-url origin &>/dev/null || gh repo create "$REPO_NAME" --public --description "Decentralized AI Compute Network"
    git branch -M main
    git push -u origin main 2>/dev/null || echo "   (Already up to date)"
}

echo "   ✅ Repository: https://github.com/$GITHUB_USERNAME/$REPO_NAME"

# Step 4: Deploy to Railway
echo ""
echo "🚂 Step 4: Deploying to Railway.app..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "   Installing Railway CLI..."
    npm i -g @railway/cli
fi

# Check login status
echo "   Checking Railway login..."
if ! railway login --browserless 2>/dev/null; then
    echo ""
    echo "   ⚠️  Please login to Railway manually:"
    echo "   1. Go to: https://railway.app/login"
    echo "   2. Sign up with GitHub"
    echo "   3. Run this command again"
    echo ""
    echo "   Or continue manually:"
    echo "   railway login"
    echo "   railway init"
    echo ""
    read -p "   Press Enter after logging into Railway..."
fi

echo "   ✅ Railway ready"

# Deploy server
echo ""
echo "🚀 Deploying services..."

# Deploy server
echo "   📡 Deploying server..."
railway init --template node --name hivemind-server --variable SERVER_PORT=8080 2>/dev/null || {
    echo "   Manual steps for Railway:"
    echo "   1. Go to: https://railway.app/dashboard"
    echo "   2. Click 'New Project'"
    echo "   3. Select: Deploy from GitHub"
    echo "   4. Select repo: $GITHUB_USERNAME/$REPO_NAME"
    echo "   5. Root Directory: dist/server"
    echo "   6. Click 'Deploy'"
}

# Deploy web
echo "   🌐 Deploying web dashboard..."
railway init --template static --name hivemind-web 2>/dev/null || echo "   (Manual: deploy dist/web as static site)"

# Deploy admin
echo "   👑 Deploying admin dashboard..."
railway init --template static --name hivemind-admin 2>/dev/null || echo "   (Manual: deploy dist/admin as static site)"

echo ""
echo "================================"
echo "✅ Deployment Initiated!"
echo "================================"
echo ""
echo "📋 Manual Steps (if needed):"
echo ""
echo "1. Go to Railway Dashboard:"
echo "   https://railway.app/dashboard"
echo ""
echo "2. Configure Services:"
echo ""
echo "   Service 1: hivemind-server"
echo "   - Source: GitHub repo: $GITHUB_USERNAME/$REPO_NAME"
echo "   - Root: dist/server"
echo "   - Start: node index.js"
echo ""
echo "   Service 2: hivemind-web"
echo "   - Source: GitHub repo: $GITHUB_USERNAME/$REPO_NAME"
echo "   - Root: dist/web"
echo "   - Build: npm install --production"
echo "   - Start: npx serve -s -l \$PORT"
echo ""
echo "   Service 3: hivemind-admin"
echo "   - Source: GitHub repo: $GITHUB_USERNAME/$REPO_NAME"
echo "   - Root: dist/admin"
echo "   - Build: npm install --production"
echo "   - Start: npx serve -s -l \$PORT"
echo ""
echo "3. Get your URLs after deployment:"
echo "   Server: wss://hivemind-server.railway.app"
echo "   Web: https://hivemind-web.up.railway.app"
echo "   Admin: https://hivemind-admin.up.railway.app"
echo ""
echo "4. Update client to connect to cloud:"
echo "   npm start -- --server=wss://hivemind-server.railway.app"
echo ""
echo "🎉 Good luck!"
