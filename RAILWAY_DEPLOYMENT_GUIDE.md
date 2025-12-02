# Deploy Express Server to Railway (Monorepo Setup)

## Quick Start

### Method 1: GitHub Deployment (Easiest) ⭐

1. **Push your code** (if not already done):
   ```bash
   git add .
   git commit -m "Add Railway configuration"
   git push origin master
   ```

2. **Deploy via Railway Dashboard**:
   - Go to https://railway.app/new
   - Click "Deploy from GitHub repo"
   - Select: `emondarock/chime-video-calling`
   - Railway will use `railway.toml` to deploy the express-server folder
   - Click "Deploy"

3. **Set Environment Variables** in Railway dashboard:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `REGION`
   - `MONGODB_URI`
   - `NODE_ENV=production`
   - `JWT_SECRET`

### Method 2: Railway CLI

```bash
# From root directory (D:\ChimeSDKCalling)
npm install -g @railway/cli
railway login
railway init
railway up
```

## Files Created

- ✅ `railway.toml` - Root level Railway configuration for monorepo
- ✅ `express-server/railway.json` - Service-specific configuration
- ✅ `express-server/Procfile` - Process configuration
- ✅ `express-server/RAILWAY_DEPLOYMENT.md` - Full deployment guide

## Repository Structure

```
chime-video-calling/
├── railway.toml              (← Tells Railway to deploy express-server)
├── express-server/           (← Backend - will be deployed)
│   ├── server.js
│   ├── package.json
│   ├── railway.json
│   └── ...
└── real-time-calling/        (Frontend - not deployed here)
    └── ...
```

## Important Notes

- The `railway.toml` file configures Railway to build and run from the `express-server` directory
- Your GitHub repo is already set up: https://github.com/emondarock/chime-video-calling.git
- Don't forget to migrate MongoDB to Atlas or add MongoDB service in Railway
- After deployment, update your frontend API URLs to point to the Railway domain

## Full Documentation

See `express-server/RAILWAY_DEPLOYMENT.md` for detailed instructions and troubleshooting.
