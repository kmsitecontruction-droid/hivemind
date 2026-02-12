#!/bin/bash

# GitHub Repository Creator
# Creates a GitHub repo and pushes HIVEMIND

set -e

echo "🐝 GitHub Repository Setup"
echo "=========================="
echo ""

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

# Get email
read -p "Enter your email (for git config): " USER_EMAIL

# Configure git
git config user.email "$USER_EMAIL"
git config user.name "$GITHUB_USERNAME"

# Create repository using GitHub API
echo ""
echo "📁 Creating GitHub repository..."

# Create repo via API (requires token)
echo ""
echo "To create the repository automatically, you need a GitHub Personal Access Token."
echo ""
echo "Steps to create token:"
echo "1. Go to: https://github.com/settings/tokens"
echo "2. Click 'Generate new token (classic)'"
echo "3. Note: 'hivemind-deploy'"
echo "4. Select: repo scope"
echo "5. Copy the token"
echo ""
read -p "Paste your GitHub Personal Access Token: " TOKEN

# Create repo
RESPONSE=$(curl -s -X POST -H "Authorization: token $TOKEN" \
    -d '{"name":"hivemind","description":"Decentralized AI Compute Network","public":true}' \
    https://api.github.com/user/repos 2>&1)

if echo "$RESPONSE" | grep -q '"id"'; then
    echo "✅ Repository created!"
else
    echo "📦 Repository may already exist, trying to push..."
fi

# Add remote and push
git remote add origin "https://$TOKEN@github.com/$GITHUB_USERNAME/hivemind.git" 2>/dev/null || {
    git remote set-url origin "https://$TOKEN@github.com/$GITHUB_USERNAME/hivemind.git"
}

git branch -M main
git push -u origin main

echo ""
echo "✅ Pushed to GitHub!"
echo "   https://github.com/$GITHUB_USERNAME/hivemind"
echo ""
echo "🚀 Next: Deploy to Railway!"
echo "   1. Go to: https://railway.app"
echo "   2. Sign up with GitHub"
echo "   3. Click 'Deploy from GitHub'"
echo "   4. Select: hivemind repo"
echo "   5. Root Directory: dist/server"
echo "   6. Click Deploy!"
