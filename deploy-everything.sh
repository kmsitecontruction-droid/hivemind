#!/bin/bash
# 🚀 COMPLETE HIVEMIND DEPLOYMENT

set -e

cd /Users/claw/Desktop/HIVEMIND

echo "🐝 HIVEMIND COMPLETE DEPLOYMENT"
echo "=============================="
echo ""

# 1. GitHub
echo "📦 GitHub..."
if git push --dry-run -u origin main 2>/dev/null; then
    echo "✅ GitHub authenticated - pushing..."
    git push -u origin main
    echo "✅ GitHub push complete!"
else
    echo "❌ GitHub not authenticated"
    echo "Enter code 01F3-12FD at https://github.com/login/device"
    exit 1
fi

echo ""

# 2. Railway
echo "🚂 Railway..."
if command -v railway &>/dev/null; then
    if railway whoami &>/dev/null; then
        echo "✅ Railway logged in - deploying..."
        
        # Deploy server
        echo "   Deploying server..."
        railway up --service hivemind-server --detach 2>/dev/null || {
            railway init --project hivemind-server --template node
            railway link --project hivemind-server
        }
        
        # Deploy web
        echo "   Deploying web..."
        railway up --service hivemind-web --detach 2>/dev/null || {
            railway init --project hivemind-web --template static
            railway link --project hivemind-web
        }
        
        echo "✅ Railway deployment initiated!"
    else
        echo "❌ Railway not logged in - opening login"
        open -a "Google Chrome" "https://railway.app/login"
        echo "Login to Railway, then run this script again"
        exit 1
    fi
else
    echo "❌ Installing Railway CLI..."
    npm install -g @railway/cli
    echo "Run this script again after installation"
    exit 1
fi

echo ""

# 3. AWS
echo "☁️  AWS..."
if command -v aws &>/dev/null; then
    if aws sts get-caller-identity &>/dev/null; then
        echo "✅ AWS authenticated"
        echo "To deploy to EC2:"
        echo "  1. Create t2.micro instance"
        echo "  2. Run: ./deploy-to-aws.sh YOUR_IP"
    else
        echo "❌ AWS not authenticated - opening console"
        open -a "Google Chrome" "https://console.aws.amazon.com/"
        echo "Setup AWS account, then run this script again"
    fi
else
    echo "❌ Installing AWS CLI..."
    brew install awscli
    echo "Run this script again after installation"
fi

echo ""
echo "🎉 DEPLOYMENT COMPLETE!"
echo ""
echo "📊 Your URLs will be available in Railway dashboard:"
echo "   https://railway.app/dashboard"
echo ""
echo "📱 Test from your iPhone using Railway URLs!"
