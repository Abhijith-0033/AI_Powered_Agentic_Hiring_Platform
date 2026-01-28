# 🚀 Deployment Guide: AI Powered Agentic Hiring Platform

This guide will help you host your project for free using **Render** (for the Backend) and **Vercel** (for the Frontend).

> [!NOTE]
> I have already updated your code to be "Deployment Ready" by replacing hardcoded `localhost` URLs with environment variables.

## Prerequisites
- A **GitHub** account.
- A **Render** account (https://render.com).
- A **Vercel** account (https://vercel.com).
- Your **Neon DB** connection string (Postgres URL).

---

## Step 1: Push Code to GitHub

Since you want automatic updates when you commit, you must host your code on GitHub.

1. Open your terminal in VS Code.
2. Run the following commands to commit my changes and push to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for deployment: Update API URLs and CORS"
   # If you haven't linked a remote repo yet:
   # git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

---

## Step 2: Deploy Backend (Render)

1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Select "Build and deploy from a Git repository" and connect your GitHub account.
4. Select your repository `AI_Powered_Agentic_Hiring_Platform`.
5. Configure the service:
   - **Name**: `ai-hiring-backend` (or similar)
   - **Region**: Closest to you (e.g., Singapore, Frankfurt, Oregon)
   - **Branch**: `main`
   - **Root Directory**: `backend` (Important!)
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

6. **Environment Variables** (Scroll down to "Advanced" or "Environment"):
   Add the following keys:
   - `DATABASE_URL`: `postgres://...` (Your Neon DB connection string)
   - `JWT_SECRET`: `your_secure_random_string` (Any long random string)
   - `FRONTEND_URL`: `https://your-vercel-frontend-url.vercel.app` (You will get this in Step 3, come back and update it later!)
   - `NODE_ENV`: `production`

7. Click **Create Web Service**.
   - Render will start building. Once finished, it will give you a URL like `https://ai-hiring-backend.onrender.com`.
   - **Copy this URL**.

---

## Step 3: Deploy Frontend (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. Configure the project:
   - **Framework Preset**: Vite (should be auto-detected).
   - **Root Directory**: Click "Edit" and select `frontend`.
5. **Environment Variables**:
   - Key: `VITE_API_URL`
   - Value: `https://ai-hiring-backend.onrender.com/api` (The Render URL from Step 2 **plus** `/api` at the end).
   
   > [!IMPORTANT]
   > Make sure to add the `/api` suffix if your backend expects it (based on my code changes, I pointed the variable to the base API path).

6. Click **Deploy**.
   - Vercel will build and deploy your site.
   - You will get a domain like `https://ai-hiring-platform.vercel.app`.

---

## Step 4: Final Connection

1. Go back to your **Render Dashboard** -> Your Backend Service -> **Environment**.
2. Update (or Add) the `FRONTEND_URL` variable.
   - Value: `https://ai-hiring-platform.vercel.app` (Your actual Vercel URL, **without** a trailing slash).
3. **Save Changes**. Render will automatically restart the server.

---

## 🔄 Automatic Updates

Now you have a Continuous Deployment (CD) pipeline!

- **Backend Changes**: Whenever you modify files in the `backend/` folder and push to GitHub, Render will automatically rebuild and redeploy.
- **Frontend Changes**: Whenever you modify files in the `frontend/` folder and push to GitHub, Vercel will automatically rebuild and redeploy.

### Troubleshooting
- **CORS Errors**: If you see "CORS error" in the browser console, check that `FRONTEND_URL` in Render matches your Vercel URL exactly.
- **Database Errors**: Ensure your `DATABASE_URL` in Render is correct and your Neon DB allows connections from anywhere (0.0.0.0/0).
