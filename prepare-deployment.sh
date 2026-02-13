#!/bin/bash
# Prepare everything for deployment after GitHub auth

cd /Users/claw/Desktop/HIVEMIND

echo "🔍 Verifying GitHub auth..."
if git push --dry-run -u origin main 2>/dev/null; then
    echo "✅ Authenticated! Pushing..."
    git push -u origin main
    echo "✅ GitHub push complete!"
else
    echo "❌ Still need GitHub auth"
    echo "Please enter code 01F3-12FD at https://github.com/login/device"
    exit 1
fi

echo ""
echo "🚀 Preparing Railway deployment..."

# Check if Railway CLI is available
if command -v railway &>/dev/null; then
    if railway whoami &>/dev/null; then
        echo "✅ Railway already logged in"
    else
        echo "❌ Railway not logged in - opening login"
        open -a "Google Chrome" "https://railway.app/login"
    fi
else
    echo "❌ Railway CLI not installed - installing..."
    npm install -g @railway/cli
fi

echo ""
echo "☁️  Preparing AWS deployment..."

# Check AWS
if command -v aws &>/dev/null; then
    echo "✅ AWS CLI installed"
else
    echo "❌ AWS CLI not installed - installing..."
    brew install awscli
fi

echo ""
echo "🎉 All prepared for deployment!"
echo "Run ./deploy-everything.sh after Railway login"
