#!/bin/bash
# 🚀 AUTO-PUSH AFTER GITHUB AUTH

cd /Users/claw/Desktop/HIVEMIND

echo "🐝 CHECKING GITHUB AUTH..."

# Try to push
if git push -u origin main 2>&1; then
    echo "✅ PUSHED TO GITHUB!"
    echo ""
    echo "📍 https://github.com/kmsitecontruction-droid/hivemind"
else
    echo "❌ Push failed"
    echo "📝 Try:"
    echo "   gh auth login --web"
    echo "   git push -u origin main"
fi
