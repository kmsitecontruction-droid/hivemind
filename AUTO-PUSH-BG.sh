#!/bin/bash
cd /Users/claw/Desktop/HIVEMIND

echo "⏳ Waiting for GitHub auth..."
COUNTER=0
while [ $COUNTER -lt 60 ]; do
    if git push -u origin main 2>/dev/null; then
        echo "✅ PUSHED TO GITHUB!"
        echo "📍 https://github.com/kmsitecontruction-droid/hivemind"
        break
    fi
    sleep 2
    COUNTER=$((COUNTER + 1))
    echo "⏳ Waiting... ($COUNTER/60)"
done

if [ $COUNTER -ge 60 ]; then
    echo "❌ Timeout. Please authenticate and run: ./PUSH-NOW.sh"
fi
