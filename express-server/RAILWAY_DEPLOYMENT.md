# Railway Deployment Guide for Express Server (Monorepo)

This guide will help you deploy your Express server to Railway.app from your monorepo.

## Prerequisites

1. A Railway account (sign up at https://railway.app)
2. Git installed on your machine
3. Your code already pushed to GitHub: https://github.com/emondarock/chime-video-calling.git

## Monorepo Structure

Your repository contains:
- `express-server/` - Backend Express server (to be deployed)
- `real-time-calling/` - Frontend React application (not deployed in this guide)

## Step-by-Step Deployment Instructions

### 1. Prepare Your Code

✅ The following files are already configured:
- `railway.toml` at root for monorepo configuration
- `express-server/package.json` with start script
- `express-server/.gitignore` to exclude sensitive files
- `express-server/railway.json` for service-specific configuration

### 2. Commit and Push Changes (if not already done)

```bash
### 3. Deploy to Railway

#### Option A: Deploy via GitHub (Recommended for Monorepos)

**This is the easiest method for monorepos!**
5. Open your project:
   ```bash
   railway open
   ```

#### Option B: Deploy via GitHub (Alternative)

1. Push your code to a GitHub repository:
   ```bash
   git remote add origin <your-github-repo-url>
   git branch -M main
   git push -u origin main
   ```

2. Go to https://railway.app/new
3. Click "Deploy from GitHub repo"
4. Select your repository
5. Railway will automatically detect your Express app

#### Option C: Deploy via Railway Dashboard

1. Go to https://railway.app/new
2. Click "Deploy from local repo" or "Empty Project"
3. Link your GitHub repository or upload your code
4. Railway will automatically detect and deploy

### 4. Configure Environment Variables

After deployment, you need to set your environment variables in Railway:

1. Go to your Railway project dashboard
2. Click on your service
1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Authorize Railway to access your GitHub account
4. Select the repository: `emondarock/chime-video-calling`
5. **Important**: Configure the root directory:
   - Click on "Configure" or "Settings"
   - Set **Root Directory** to `express-server`
   - Or Railway will detect the `railway.toml` at root which handles this automatically
6. Click "Deploy Now"
7. Railway will automatically build and deploy your Express server

#### Option B: Deploy via Railway CLI (Alternative)

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Login to Railway:
   ```bash
   railway login
   ```

3. From the **root** of your monorepo, initialize Railway:
   ```bash
   # Make sure you're in D:\ChimeSDKCalling (root directory)
   railway init
   ```

4. Deploy:
   ```bash
   railway up
   ```
   
   The `railway.toml` file will ensure it deploys the express-server correctly.

5. Open your project:
   ```bash
   railway open
   ```
- `REGION`: AWS region (e.g., us-east-1)
- `MONGODB_URI`: Your MongoDB connection string (use MongoDB Atlas for cloud hosting)
- `JWT_SECRET`: Secret key for JWT authentication

### 5. Set Up MongoDB

If you're using a local MongoDB, you'll need to migrate to a cloud solution:

**Option 1: MongoDB Atlas (Recommended)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Add it as `MONGODB_URI` in Railway environment variables

**Option 2: Add MongoDB to Railway**
1. In your Railway project, click "New Service"
2. Select "Database" → "MongoDB"
3. Railway will create a MongoDB instance
4. Use the provided connection string in your variables

### 6. Verify Deployment

1. Once deployed, Railway will provide you with a URL (e.g., `https://your-app.up.railway.app`)
2. Test your API endpoints:
   ```bash
   curl https://your-app.up.railway.app/health
   ```

### 7. Monitor Your Application

- View logs: Click on your service → "Deployments" → Select a deployment → "View Logs"
- Check metrics: Click on "Metrics" tab to see CPU, memory, and network usage
- Set up alerts: Configure notifications for deployment failures

## Common Issues and Solutions

### Issue 1: Port Binding Error
**Solution**: Railway automatically sets the `PORT` environment variable. Make sure your `server.js` uses `process.env.PORT`:
```javascript
const PORT = process.env.PORT || 3000;
```

### Issue 2: MongoDB Connection Failed
**Solution**: 
- Ensure your MongoDB URI is correct
- If using MongoDB Atlas, whitelist Railway's IP (or allow access from anywhere: 0.0.0.0/0)
- Check your MongoDB connection string format

### Issue 3: AWS Credentials Not Working
**Solution**:
- Verify your AWS credentials are correctly set in Railway variables
- Ensure your AWS IAM user has the necessary permissions (Chime SDK, SES, SQS)
- Check the AWS region is correct

### Issue 4: Build Failed
**Solution**:
- Check the build logs in Railway dashboard
- Ensure all dependencies are in `package.json`
- Make sure `"type": "module"` is set if using ES modules

## Updating Your Deployment

### Via Railway CLI:
```bash
railway up
```

### Via GitHub:
```bash
git add .
git commit -m "Update message"
git push
```
Railway will automatically redeploy when you push to your main branch.

## Custom Domain (Optional)

1. Go to your Railway project
2. Click on your service
3. Go to "Settings" → "Domains"
4. Click "Generate Domain" or add your custom domain
5. Follow the instructions to configure DNS

## Rollback to Previous Version

1. Go to Railway dashboard
2. Click on your service
3. Go to "Deployments"
4. Select a previous successful deployment
5. Click "Redeploy"

## Cost Considerations

- Railway offers $5 of free credit per month
- After free credits, you pay for what you use
- Monitor your usage in the Railway dashboard
- Consider setting up spending limits

## Support

- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Create an issue in your repository

## Next Steps

After successful deployment:
1. Update your frontend API endpoints to point to the Railway URL
2. Set up monitoring and logging
3. Configure auto-scaling if needed
4. Set up CI/CD for automated deployments
5. Consider adding health check endpoints
