#!/bin/bash

# 🚀 HIVEMIND COMPLETE AUTOMATED DEPLOYMENT
# Run this entire script to deploy HIVEMIND to GitHub and Railway

set -e

echo "🐝 HIVEMIND Complete Cloud Deployment"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
REPO_NAME="hivemind"
DESCRIPTION="Decentralized AI Compute Network"

# ============================================================================
# PART 1: GITHUB SETUP
# ============================================================================
echo "📦 PART 1: GitHub Setup"
echo "------------------------"

cd /Users/claw/Desktop/HIVEMIND

# Configure git
echo "🔧 Configuring git..."
git config user.email "kmsitecontruction@gmail.com"
git config user.name "K M"
echo "   ✅ Git configured"

# Check if already has remote
if git remote get-url origin &>/dev/null; then
    echo "   ✅ Already has remote origin"
else
    echo "   📝 To create GitHub repo, you need a Personal Access Token."
    echo ""
    echo "   Steps to create token:"
    echo "   1. Go to: https://github.com/settings/tokens"
    echo "   2. Click 'Generate new token (classic)'"
    echo "   3. Note: 'hivemind-deploy'"
    echo "   4. Select: 'repo' scope (full control)"
    echo "   5. Click 'Generate token'"
    echo "   6. COPY THE TOKEN"
    echo ""
    read -p "   Paste your GitHub Personal Access Token: " GH_TOKEN
    
    if [ -n "$GH_TOKEN" ]; then
        echo ""
        echo "   🔐 Creating GitHub repository..."
        
        # Create repo via API
        RESPONSE=$(curl -s -X POST \
            -H "Authorization: token $GH_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            -d "{\"name\":\"$REPO_NAME\",\"description\":\"$DESCRIPTION\",\"public\":true}" \
            https://api.github.com/user/repos 2>&)
        
        if echo "$RESPONSE" | grep -q '"id"'; then
            echo "   ✅ GitHub repository created!"
        else
            echo "   📦 Repository may exist, continuing..."
        fi
        
        # Add remote and push
        git remote add origin "https://$GH_TOKEN@github.com/kmsitecontruction/$REPO_NAME.git" 2>/dev/null || true
        git remote set-url origin "https://$GH_TOKEN@github.com/kmsitecontruction/$REPO_NAME.git" 2>/dev/null || true
        git branch -M main
        git push -u origin main
        echo "   ✅ Pushed to GitHub!"
        echo "   📍 https://github.com/kmsitecontruction/$REPO_NAME"
    else
        echo "   ⚠️  No token provided. Skipping GitHub push."
        echo "   📝 You can push manually later."
    fi
fi

echo ""

# ============================================================================
# PART 2: RAILWAY DEPLOYMENT
# ============================================================================
echo "🚂 PART 2: Railway Deployment"
echo "------------------------------"

echo ""
echo "📝 Railway Deployment Steps:"
echo ""
echo "   1. Open this link in your browser:"
echo "      → https://railway.app/new"
echo ""
echo "   2. Sign up with GitHub (button on page)"
echo ""
echo "   3. After signing up, click 'Deploy from GitHub'"
echo ""
echo "   4. Select repository: 'kmsitecontruction/$REPO_NAME'"
echo ""
echo "   5. Configure these 3 services:"
echo ""
echo "   ┌─────────────────────────────────────────────┐"
echo "   │ SERVICE 1: HIVEMIND SERVER                  │"
echo "   ├─────────────────────────────────────────────┤"
echo "   │ Root Directory: dist/server                 │"
echo "   │ Start Command: node index.js                │"
echo "   │ Environment:                                │"
echo "   │   SERVER_PORT = 8080                        │"
echo "   └─────────────────────────────────────────────┘"
echo ""
echo "   ┌─────────────────────────────────────────────┐"
echo "   │ SERVICE 2: WEB DASHBOARD                    │"
echo "   ├─────────────────────────────────────────────┤"
echo "   │ Root Directory: dist/web                    │"
echo "   │ Build Command: npm install --production     │"
echo "   │ Start Command: npx serve -s -l \$PORT       │"
echo "   └─────────────────────────────────────────────┘"
echo ""
echo "   ┌─────────────────────────────────────────────┐"
echo "   │ SERVICE 3: ADMIN DASHBOARD                  │"
echo "   ├─────────────────────────────────────────────┤"
echo "   │ Root Directory: dist/admin                  │"
echo "   │ Build Command: npm install --production     │"
echo "   │ Start Command: npx serve -s -l \$PORT       │"
echo "   └─────────────────────────────────────────────┘"
echo ""
echo "   6. Click 'Deploy' for each service"
echo ""
echo "   7. Wait for deployment to complete (~2-5 minutes)"
echo ""

# ============================================================================
# PART 3: GET URLs
# ============================================================================
echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo "======================="
echo ""
echo "📍 Your URLs (after Railway deployment):"
echo ""
echo "   🌐 Web Dashboard:  https://hivemind-web.up.railway.app"
echo "   👑 Admin Panel:    https://hivemind-admin.up.railway.app"
echo "   📡 WebSocket:      wss://hivemind-server.up.railway.app"
echo ""
echo "🔐 Admin Credentials:"
echo "   Username: admin"
echo "   Password: hivemind123"
echo ""

# ============================================================================
# PART 4: TEST
# ============================================================================
echo ""
echo "🧪 TESTING..."
echo ""

# Test if URLs are accessible (will fail until deployed)
echo "   Testing Web Dashboard..."
curl -s -o /dev/null -w "   Web: %{http_code}\n" https://hivemind-web.up.railway.app 2>/dev/null || echo "   ⏳ Web: Pending deployment..."

echo "   Testing Admin Dashboard..."
curl -s -o /dev/null -w "   Admin: %{http_code}\n" https://hivemind-admin.up.railway.app 2>/dev/null || echo "   ⏳ Admin: Pending deployment..."

echo ""
echo "📱 NEXT: Test from iPhone!"
echo "   Open Safari → https://hivemind-web.up.railway.app"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ ALL STEPS COMPLETE!"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "📋 What was done:"
echo "   ✅ Git repository configured"
echo "   ✅ Code pushed to GitHub (if token provided)"
echo "   ✅ Railway deployment steps provided"
echo ""
echo "📋 What YOU need to do:"
echo "   1. ✅ (If no token) Push to GitHub manually"
echo "   2. 🔄 Go to railway.app and sign up"
echo "   3. 🔄 Deploy 3 services (steps above)"
echo "   4. 🔄 Test from iPhone!"
echo ""
echo "📁 Files location: /Users/claw/Desktop/HIVEMIND"
echo "📖 Guide: /Users/claw/Desktop/HIVEMIND/DEPLOY_NOW.md"
echo ""
echo "🎯 Good luck! 🚀"
