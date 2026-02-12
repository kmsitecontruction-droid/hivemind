# 🚀 HIVEMIND Cloud Deployment - Quick Start

## Step 1: Push to GitHub (Done! ✅)

Your HIVEMIND repo is ready. Now create the GitHub repo:

```bash
cd /Users/claw/Desktop/HIVEMIND
chmod +x create-github-repo.sh
./create-github-repo.sh
```

Or manually:
1. Go to: https://github.com/new
2. Repository name: `hivemind`
3. Public: ✓
4. Don't initialize with README
5. Click "Create repository"
6. Run:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/hivemind.git
   git push -u origin main
   ```

---

## Step 2: Deploy to Railway (Easiest)

### A. Create Account
1. Go to: **https://railway.app**
2. Click: **"Start a New Project"**
3. Sign up with: **GitHub**

### B. Deploy Server
1. Click: **"Deploy from GitHub"**
2. Select: **hivemind** repository
3. Root Directory: **`dist/server`**
4. Build Command: *(leave empty - Node.js auto-detected)*
5. Start Command: **`node index.js`**
6. Click: **"Deploy"**

### C. Deploy Web Dashboard
1. Click: **"New Project"** again
2. Select: **hivemind** repo
3. Root Directory: **`dist/web`**
4. Build Command: **`npm install --production`**
5. Start Command: **`npx serve -s -l $PORT`**
6. Click: **"Deploy"**

### D. Deploy Admin Dashboard
1. Same as web, but Root Directory: **`dist/admin`**

---

## Step 3: Get Your URLs

After deployment, Railway gives you URLs:

```
Server:     wss://hivemind-server.railway.app
Web:        https://hivemind-web.railway.app  
Admin:      https://hivemind-admin.railway.app
```

---

## Step 4: Test from iPhone

Open on your phone:
- **Web:** https://hivemind-web.railway.app
- **Admin:** https://hivemind-admin.railway.app (admin/hivemind123)

---

## Step 5: Connect Worker to Cloud

Instead of `ws://localhost:3001`, use:

```bash
npm start -- --server=wss://hivemind-server.railway.app
```

---

## 📋 Files Ready

```
HIVEMIND/
├── create-github-repo.sh     ← Run this first!
├── deploy-oneclick.sh        ← Automated deployment
├── deploy.sh                ← Linux server deployment
├── dist/
│   ├── server/              ← Deploy this first!
│   ├── web/                 ← Deploy second
│   └── admin/               ← Deploy third
└── railway.json             ← Railway config
```

---

## 🎯 Quick Command Summary

```bash
cd /Users/claw/Desktop/HIVEMIND

# 1. Create GitHub repo
./create-github-repo.sh

# 2. Go to railway.app and deploy:
#    - dist/server (server)
#    - dist/web (web dashboard)
#    - dist/admin (admin dashboard)

# 3. Update clients to use cloud URL
npm start -- --server=wss://your-server.railway.app
```

---

## ✅ What's Deployed

| Component | Local | Cloud (Replace with Railway URL) |
|-----------|-------|----------------------------------|
| Server | ws://localhost:3001 | wss://hivemind-server.railway.app |
| Web | http://localhost:3000 | https://hivemind-web.railway.app |
| Admin | http://localhost:3003 | https://hivemind-admin.railway.app |

**Go deploy it!** 🚀
