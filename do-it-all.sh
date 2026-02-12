#!/bin/bash
# 🚀 COMPLETE DEPLOYMENT SCRIPT
# Does everything: GitHub + Railway

echo "🐝 HIVEMIND Complete Deployment"
echo "================================"
echo ""

cd /Users/claw/Desktop/HIVEMIND

# Check git status
if git remote get-url origin &>/dev/null; then
    echo "✅ Already connected to GitHub"
else
    echo "📝 Opening GitHub to create repo..."
    open -a "Google Chrome" "https://github.com/new"
    echo "Create repo named 'hivemind' then run:"
    echo "  git remote add origin <YOUR_REPO_URL>"
    echo "  git push -u origin main"
fi

echo ""
echo "🌐 Opening Railway for deployment..."
open -a "Google Chrome" "https://railway.app/new"
echo ""
echo "✅ Browser opened! Follow the steps in DEPLOY_NOW.md"
