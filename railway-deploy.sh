#!/bin/bash
# Deploy HIVEMIND to Railway

cd dist/server

echo "Deploying to Railway..."

# Set environment variables
railway variables set SERVER_PORT=3001
railway variables set NODE_ENV=production

# Deploy
railway up

# Get URL
railway domain

echo ""
echo "✅ Deployed!"
echo "Your server URL will be shown above"
