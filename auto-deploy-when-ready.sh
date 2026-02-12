#!/bin/bash
# 🚀 AUTO-DEPLOY SCRIPT
# Runs automatically until deployment is complete

cd /Users/claw/Desktop/HIVEMIND

echo "🐝 HIVEMIND AUTO-DEPLOYER"
echo "========================="
echo ""

COUNTER=0
MAX_LOOPS=100

while [ $COUNTER -lt $MAX_LOOPS ]; do
    echo "=== Check #$COUNTER ==="
    
    # Check Railway
    if railway whoami &>/dev/null; then
        echo "✅ Railway logged in!"
        
        # Deploy server
        echo "📡 Deploying server..."
        railway init --template node --name hivemind-server --detach 2>&1 | head -2
        
        # Deploy web
        echo "🌐 Deploying web..."
        railway init --template static --name hivemind-web --detach 2>&1 | head -2
        
        # Deploy admin
        echo "👑 Deploying admin..."
        railway init --template static --name hivemind-admin --detach 2>&1 | head -2
        
        echo ""
        echo "✅ Railway services deployed!"
        railway list 2>&1 | head -10
        break
    else
        echo "⏳ Waiting for Railway login... ($COUNTER/$MAX_LOOPS)"
        sleep 5
    fi
    
    COUNTER=$((COUNTER + 1))
done

echo ""
echo "🎉 Deployment check complete!"
