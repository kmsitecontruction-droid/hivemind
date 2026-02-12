#!/bin/bash

# 🚀 ONE-CLICK: GitHub + Railway Deployment
# Run this script - it handles everything!

echo "🐝 HIVEMIND ONE-CLICK DEPLOYMENT"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'

cd /Users/claw/Desktop/HIVEMIND

# ========================================
# STEP 1: GitHub (Needs 1-time token)
# ========================================
echo "📦 STEP 1: GitHub"
echo "------------------"

# Check if already pushed
if git remote get-url origin &>/dev/null; then
    echo "✅ Already connected to GitHub"
    git fetch origin 2>/dev/null
else
    echo ""
    echo "🔐 To create GitHub repo, paste your Personal Access Token below."
    echo "   (Get one at: https://github.com/settings/tokens)"
    echo "   → Select 'repo' scope"
    echo ""
    read -p "Token: " TOKEN
    
    if [ -n "$TOKEN" ]; then
        echo "   Creating repository..."
        
        # Create repo via API
        curl -s -X POST \
            -H "Authorization: token $TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            -d '{"name":"hivemind","description":"Decentralized AI Compute Network","public":true}' \
            https://api.github.com/user/repos > /dev/null
        
        # Push to GitHub
        git remote add origin "https://$TOKEN@github.com/kmsitecontruction/hivemind.git" 2>/dev/null || true
        git remote set-url origin "https://$TOKEN@github.com/kmsitecontruction/hivemind.git"
        git branch -M main
        git push -u origin main --force 2>/dev/null
        
        echo "   ✅ Pushed to GitHub!"
        echo "   📍 https://github.com/kmsitecontruction/hivemind"
    else
        echo ""
        echo "   ⚠️  Skipping GitHub (no token)"
        echo "   📝 Manual: https://github.com/new → Create repo → Run: git push"
    fi
fi

echo ""
echo "✅ GitHub setup complete!"
echo ""

# ========================================
# STEP 2: Deployment Guide
# ========================================
echo "🚂 STEP 2: Deploy to Railway"
echo "-----------------------------"
echo ""
echo "   1. OPEN THIS LINK:"
echo "      → https://railway.app/new"
echo ""
echo "   2. SIGN UP with GitHub"
echo ""
echo "   3. Click 'Deploy from GitHub'"
echo ""
echo "   4. Deploy these 3 services:"
echo ""
echo "   ┌─────────────────────────────────────────────┐"
echo "   │ SERVICE 1: hivemind-SERVER                  │"
echo "   ├─────────────────────────────────────────────┤"
echo "   │ GitHub Repo: kmsitecontruction/hivemind     │"
echo "   │ Root Directory: dist/server                 │"
echo "   │ Start Command: node index.js                │"
echo "   │ Variables: SERVER_PORT=8080                │"
echo "   └─────────────────────────────────────────────┘"
echo ""
echo "   ┌─────────────────────────────────────────────┐"
echo "   │ SERVICE 2: hivemind-WEB                    │"
echo "   ├─────────────────────────────────────────────┤"
echo "   │ Root Directory: dist/web                    │"
echo "   │ Build: npm install --production             │"
echo "   │ Start: npx serve -s -l \$PORT               │"
echo "   └─────────────────────────────────────────────┘"
echo ""
echo "   ┌─────────────────────────────────────────────┐"
echo "   │ SERVICE 3: hivemind-ADMIN                  │"
echo "   ├─────────────────────────────────────────────┤"
echo "   │ Root Directory: dist/admin                  │"
echo "   │ Build: npm install --production             │"
echo "   │ Start: npx serve -s -l \$PORT               │"
echo "   └─────────────────────────────────────────────┘"
echo ""
echo "   5. Wait ~3 minutes for deployment"
echo ""

# ========================================
# STEP 3: Summary
# ========================================
echo ""
echo "══════════════════════════════════════════════════════════"
echo "✅ READY FOR CLOUD!"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "📋 What you need to do:"
echo ""
echo "   ☐ If no GitHub repo created above:"
echo "     1. Go to https://github.com/new"
echo "     2. Name: hivemind"
echo "     3. Create repo"
echo "     4. Run: git remote add origin <YOUR_REPO_URL>"
echo "     5. Run: git push -u origin main"
echo ""
echo "   ☐ Go to: https://railway.app"
echo "   ☐ Sign up with GitHub"
echo "   ☐ Deploy 3 services (steps above)"
echo "   ☐ Get your URLs"
echo "   ☐ Test from iPhone!"
echo ""
echo "📁 Files: /Users/claw/Desktop/HIVEMIND"
echo "📖 Guide: /Users/claw/Desktop/HIVEMIND/DEPLOY_NOW.md"
echo ""
echo "🎉 You got this! 🚀"
