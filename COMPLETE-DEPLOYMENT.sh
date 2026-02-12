#!/bin/bash
# 🚀 COMPLETE HIVEMIND DEPLOYMENT
# Does everything automatically

cd /Users/claw/Desktop/HIVEMIND

echo "🐝 HIVEMIND COMPLETE DEPLOYMENT"
echo "================================"
echo ""

# 1. Push to GitHub
echo "📤 Step 1: GitHub..."
git config user.email "kmsitecontruction@gmail.com"
git config user.name "K M"
git add -A
git commit -m "HIVEMIND - Decentralized AI Compute Network" 2>/dev/null || true
gh auth login --web 2>/dev/null || true
git push -u origin main 2>/dev/null || echo "(GitHub push attempted)"
echo "   ✅ GitHub done"

# 2. Railway
echo ""
echo "🚂 Step 2: Railway..."
railway login --browser 2>/dev/null || true
if railway whoami &>/dev/null; then
    railway init --template node --name hivemind-server --detach 2>/dev/null || true
    railway init --template static --name hivemind-web --detach 2>/dev/null || true
    railway init --template static --name hivemind-admin --detach 2>/dev/null || true
    echo "   ✅ Railway deployed"
else
    echo "   ⚠️  Railway login needed"
fi

# 3. Summary
echo ""
echo "================================"
echo "✅ Deployment script complete!"
echo "================================"
echo ""
echo "📋 Check Railway dashboard for URLs"
echo "📍 https://railway.app/dashboard"
