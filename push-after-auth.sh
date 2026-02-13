#!/bin/bash
cd /Users/claw/Desktop/HIVEMIND
echo "🔐 Checking GitHub auth..."
gh auth status 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Logged in! Pushing..."
    git push -u origin main
else
    echo "❌ Not logged in. Opening login..."
    gh auth login --web
fi
