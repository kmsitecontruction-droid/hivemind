#!/bin/bash
# Push HIVEMIND to GitHub

cd /Users/claw/Desktop/HIVEMIND

echo "🚀 Pushing to GitHub..."

# Configure git
git config user.email "kmsitecontruction@gmail.com"
git config user.name "K M"

# Add all files
git add -A
git commit -m "HIVEMIND - Decentralized AI Compute Network"

# Push
echo "🔐 Authenticating with GitHub..."
# This will open a browser for authentication
gh auth login --web

# Push
echo "📤 Pushing to GitHub..."
git push -u origin main

echo "✅ Pushed to https://github.com/kmsitecontruction-droid/hivemind"
