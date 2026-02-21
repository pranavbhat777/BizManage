# BizManage Deployment Guide

This guide will help you deploy your BizManage full-stack application to production using Render (backend) and Vercel (frontend).

## 🏗️ Architecture Overview

- **Backend**: Node.js + Express + SQLite deployed on Render
- **Frontend**: React (Create React App) deployed on Vercel
- **Database**: SQLite (file-based) hosted on Render

## 📋 Prerequisites

1. GitHub repository with your code (already done: https://github.com/pranavbhat777/BizManage)
2. Render account (free tier available)
3. Vercel account (free tier available)
4. Git installed locally

---

## 🚀 Step 1: Deploy Backend to Render

### 1.1 Create Render Account
1. Go to [https://render.com](https://render.com)
2. Sign up with your GitHub account
3. Verify your email if required

### 1.2 Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. **Connect Repository**: Select your `BizManage` repository
3. **Configure Service**:
   - **Name**: `bizmanage-api`
   - **Environment**: `Node`
   - **Region**: Choose nearest region
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 1.3 Configure Environment Variables
Add these environment variables in Render dashboard:

```bash
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-vercel-app.vercel.app
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
DATABASE_PATH=./database.sqlite
BUSINESS_NAME=BizManage
BUSINESS_EMAIL=admin@bizmanage.com
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
```

### 1.4 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment to complete (2-3 minutes)
3. Note your backend URL: `https://bizmanage-api.onrender.com`

---

## 🌐 Step 2: Deploy Frontend to Vercel

### 2.1 Create Vercel Account
1. Go to [https://vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Verify your email if required

### 2.2 Import Project
1. Click **"Add New..."** → **"Project"**
2. **Import Git Repository**: Select your `BizManage` repository
3. **Configure Project**:
   - **Framework Preset**: `Create React App`
   - **Root Directory**: `./` (root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

### 2.3 Configure Environment Variables
Add this environment variable in Vercel dashboard:

```bash
REACT_APP_API_URL=https://bizmanage-api.onrender.com
```

### 2.4 Update CORS in Backend
Go back to your Render service and update the `FRONTEND_URL` environment variable:
```bash
FRONTEND_URL=https://your-vercel-app-url.vercel.app
```

### 2.5 Deploy
1. Click **"Deploy"**
2. Wait for deployment to complete (1-2 minutes)
3. Note your frontend URL: `https://your-vercel-app.vercel.app`

---

## 🔧 Step 3: Final Configuration

### 3.1 Update Backend CORS
1. Go to your Render dashboard
2. Select your `bizmanage-api` service
3. Go to **"Environment"** tab
4. Update `FRONTEND_URL` with your actual Vercel URL
5. Click **"Save Changes"**
6. Wait for automatic redeployment

### 3.2 Update Frontend Environment
1. Go to your Vercel dashboard
2. Select your project
3. Go to **"Settings"** → **"Environment Variables"**
4. Update `REACT_APP_API_URL` with your actual Render URL
5. Click **"Save"**
6. Trigger a new deployment from Vercel dashboard

---

## ✅ Step 4: Test Your Application

### 4.1 Backend Health Check
Visit: `https://bizmanage-api.onrender.com/api/health`

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

### 4.2 Frontend Access
Visit your Vercel URL and test:
- Login/Registration
- Dashboard loading
- All modules (Employees, Payroll, Products, etc.)

---

## 🔄 Step 5: Database Migration

Your SQLite database will be created automatically on first deployment. To ensure proper setup:

1. **First Visit**: Access your application and register a new business
2. **Data Persistence**: All data will be stored in the SQLite file on Render's persistent storage
3. **Backups**: Render automatically creates backups of your database

---

## 🛠️ Troubleshooting

### Common Issues:

#### 1. CORS Errors
**Problem**: Frontend can't connect to backend
**Solution**: 
- Check `FRONTEND_URL` environment variable in Render
- Ensure it matches your Vercel URL exactly
- Redeploy backend after changes

#### 2. API Connection Issues
**Problem**: Frontend shows network errors
**Solution**:
- Check `REACT_APP_API_URL` in Vercel environment variables
- Ensure it matches your Render URL exactly
- Redeploy frontend after changes

#### 3. Build Failures
**Problem**: Deployment fails during build
**Solution**:
- Check build logs in Render/Vercel dashboards
- Ensure all dependencies are in package.json
- Check for any syntax errors

#### 4. Database Issues
**Problem**: Data not persisting
**Solution**:
- Ensure `DATABASE_PATH` is set correctly in Render
- Check if Render's persistent storage is properly configured

---

## 📊 Monitoring

### Render Dashboard
- Monitor backend performance
- View logs and metrics
- Check auto-deploys

### Vercel Dashboard
- Monitor frontend performance
- View build logs
- Analytics and usage

---

## 🔄 Continuous Deployment

Both platforms are set up for automatic deployments:

- **Render**: Auto-deploys on push to `main` branch
- **Vercel**: Auto-deploys on push to `main` branch

To deploy updates:
1. Commit changes to your local repository
2. Push to GitHub: `git push origin main`
3. Both platforms will automatically deploy

---

## 💡 Tips

1. **Always test locally** before pushing to production
2. **Use environment variables** for all configuration
3. **Monitor logs** regularly for any issues
4. **Keep dependencies updated** for security
5. **Set up alerts** for downtime if needed

---

## 🆘 Support

If you encounter issues:

1. **Render Documentation**: https://render.com/docs
2. **Vercel Documentation**: https://vercel.com/docs
3. **GitHub Issues**: Check your repository's Issues tab
4. **Community Forums**: Both platforms have active communities

---

## 🎉 You're Live!

Your BizManage application is now running in production! Users can access it via your Vercel URL, and all data is securely stored in your Render-hosted database.

**Next Steps**:
- Set up custom domains
- Configure SSL certificates
- Set up monitoring and alerts
- Plan for scaling as your user base grows
