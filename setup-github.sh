#!/bin/bash

# GitHub Setup & Deployment Helper
# Run this to prepare HIVEMIND for cloud deployment

set -e

echo "🐝 HIVEMIND GitHub Setup"
echo "========================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git not installed. Install git first."
    exit 1
fi

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI not installed. Installing..."
    brew install gh
fi

# Check authentication
echo "🔐 Checking GitHub authentication..."
if ! gh auth status &> /dev/null; then
    echo "Please login to GitHub:"
    gh auth login
fi

# Get username
GITHUB_USERNAME=$(gh api user | grep -o '"login": "[^"]*"' | cut -d'"' -f4)
echo "   Logged in as: @$GITHUB_USERNAME"

# Repository name
REPO_NAME="${1:-hivemind}"
echo ""
echo "📁 Repository name: $REPO_NAME"

# Create repository
echo ""
echo "🔧 Creating GitHub repository..."
gh repo create "$REPO_NAME" --public --description "Decentralized AI Compute Network" --source=. --push 2>/dev/null || {
    echo "📦 Repository exists, adding remote..."
    git remote add origin "https://github.com/$GITHUB_USERNAME/$REPO_NAME.git" 2>/dev/null || true
    git branch -M main
    git push -u origin main 2>/dev/null || echo "   (Already up to date or needs manual push)"
}

echo ""
echo "✅ Repository created/updated!"
echo "   https://github.com/$GITHUB_USERNAME/$REPO_NAME"
echo ""

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
*.log
.env
.DS_Store
dist/node_modules/
data/
*.db
*.sqlite
EOF

echo "📝 Created .gitignore"

# Commit changes
echo ""
echo "💾 Committing changes..."
git add -A 2>/dev/null || echo "   (No changes to commit)"
git commit -m "Add HIVEMIND for cloud deployment" 2>/dev/null || echo "   (Already committed)"

# Push
echo ""
echo "🚀 Pushing to GitHub..."
git push origin main 2>/dev/null || echo "   (Push complete or nothing to push)"

echo ""
echo "========================"
echo "✅ GitHub Setup Complete!"
echo "========================"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Deploy to Railway (Easiest):"
echo "   - Go to: https://railway.app"
echo "   - Sign up with GitHub"
echo "   - Click 'Deploy from GitHub'"
echo "   - Select: $REPO_NAME"
echo "   - Root Directory: dist/server"
echo ""
echo "2. Deploy to Render:"
echo "   - Go to: https://render.com"
echo "   - Sign up with GitHub"
echo "   - Create Web Service for dist/web"
echo "   - Create Web Service for dist/admin"
echo "   - Create Background Service for dist/server"
echo ""
echo "3. Or deploy to your own server:"
echo "   - Run: ./deploy.sh"
echo ""
echo "🎉 You're ready to deploy!"
