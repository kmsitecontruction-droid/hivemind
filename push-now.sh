#!/bin/bash
cd /Users/claw/Desktop/HIVEMIND
echo "🔐 Opening GitHub auth..."
gh auth login --web
echo "📤 Pushing..."
git push -u origin main
echo "✅ Done!"
