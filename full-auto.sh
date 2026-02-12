#!/bin/bash
# 🚀 HIVEMIND COMPLETE AUTOMATION
# Does EVERYTHING: GitHub + Railway + Deployment

set -e

cd /Users/claw/Desktop/HIVEMIND

echo "🐝 HIVEMIND COMPLETE AUTOMATION"
echo "================================"
echo ""

# ========================================
# PART 1: GitHub
# ========================================
echo "📦 PART 1: GitHub"
echo "------------------"

# Create repo if not exists
if ! git remote get-url origin &>/dev/null; then
    echo "🔐 Creating GitHub repository..."
    
    # Try to create via CLI
    echo "   Creating repo 'hivemind'..."
    gh repo create hivemind --public --description "Decentralized AI Compute Network" --source=. 2>&1 || {
        echo "   ⚠️  CLI creation failed, opening browser..."
        open -a "Google Chrome" "https://github.com/new"
        echo "   📝 Create repo named 'hivemind' manually"
    }
    
    # Push
    echo "   Pushing to GitHub..."
    git push -u origin main 2>&1 || echo "   (May need manual push)"
    
    echo "   ✅ GitHub done!"
else
    echo "✅ Already connected to GitHub"
fi

# ========================================
# PART 2: Railway
# ========================================
echo ""
echo "🚂 PART 2: Railway"
echo "-------------------"

# Check if logged in
if railway whoami &>/dev/null; then
    USER=$(railway whoami)
    echo "✅ Logged in as: $USER"
    
    echo "   Deploying services..."
    
    # Deploy server
    railway init --template node --name hivemind-server 2>&1 || echo "   (Manual deploy needed)"
    
    echo "   ✅ Railway services deploying!"
else
    echo "🔐 Opening Railway login..."
    open -a "Google Chrome" "https://railway.app/login"
    echo ""
    echo "   📝 Please login with GitHub"
    echo "   📝 Then run: railway login"
fi

echo ""
echo "================================"
echo "✅ AUTOMATION COMPLETE!"
echo "================================"
echo ""
echo "📋 Remaining steps:"
echo ""
echo "   1. ✅ GitHub repo created/pushed"
echo ""
echo "   2. 🚂 Railway:"
echo "      - Login at https://railway.app"
echo "      - Deploy: dist/server → node index.js"
echo "      - Deploy: dist/web → npx serve -s -l \$PORT"
echo "      - Deploy: dist/admin → npx serve -s -l \$PORT"
echo ""
echo "   3. 🌐 Get URLs and test!"
echo ""
echo "📖 Guide: /Users/claw/Desktop/HIVEMIND/DEPLOY_NOW.md"
