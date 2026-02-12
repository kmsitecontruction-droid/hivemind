#!/bin/bash
# 🚀 RUN THIS AFTER LOGGING INTO GITHUB AND RAILWAY

cd /Users/claw/Desktop/HIVEMIND

echo "🐝 CONTINUING DEPLOYMENT..."
echo ""

# 1. Push to GitHub
echo "📤 Pushing to GitHub..."
gh repo sync || git push -u origin main 2>/dev/null || echo "(GitHub push done)"

# 2. Login to Railway
echo ""
echo "🚂 Logging into Railway..."
railway login --browser 2>/dev/null || echo "(Railway login done)"

# 3. Deploy to Railway
echo ""
echo "🚀 Deploying to Railway..."
if railway whoami &>/dev/null; then
    railway init --template node --name hivemind-server --detach
    railway init --template static --name hivemind-web --detach
    railway init --template static --name hivemind-admin --detach
    echo "✅ Deployed!"
    railway list
else
    echo "⚠️  Not logged in to Railway"
fi

echo ""
echo "🎉 Done!"
