# Deployment Guide for Auramesh

This guide will help you deploy the Auramesh project with Netlify (frontend) + Railway (backend).

## Prerequisites
- GitHub account
- Netlify account (free at netlify.com)
- Railway account (free at railway.app)
- Git installed locally

## Step 1: Push Project to GitHub

```bash
git init
git add .
git commit -m "Initial commit - auramesh project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/finance-ai-project.git
git push -u origin main
```

## Step 2: Deploy Backend to Railway

1. Go to [railway.app](https://railway.app)
2. Click "Start a New Project" → "Deploy from GitHub"
3. Select your repository
4. Railway will auto-detect it's a Node.js project
5. In the Railway dashboard:
   - Add environment variables:
     - `PORT` = 5000
     - `NODE_ENV` = production
6. Add a start script to `server/package.json`:

```json
"scripts": {
  "start": "node index.js",
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

7. Go to "Settings" → "Generate Domain" to get your backend URL
8. Copy this URL (e.g., `https://xxx-production.up.railway.app`)

## Step 3: Update Frontend Environment Variables

1. Create `.env.production` in the `client` folder:

```
REACT_APP_API_URL=https://YOUR_RAILWAY_URL
```

Replace `YOUR_RAILWAY_URL` with the URL from Step 2.

## Step 4: Deploy Frontend to Netlify

1. Go to [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub account
4. Select your repository
5. Build settings:
   - **Base directory**: `client`
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
6. Deploy!

## Step 5: Update CORS in Backend

In `server/index.js`, update CORS to allow your Netlify URL:

```javascript
app.use(cors({
  origin: 'https://YOUR_NETLIFY_URL'
}));
```

## SQLite Deployment

Your backend uses SQLite for the database. Here's what to know:

- SQLite data is stored in `expenses.db` in your server directory
- Data will persist as long as Railway doesn't restart your deployment
- For local backups, you can download the database file periodically

---

**Your Deployment URLs will be:**
- Frontend: `https://your-site.netlify.app` (provided by Netlify)
- Backend: `https://xxx-production.up.railway.app` (provided by Railway)
