# 🚀 CodeSentinel Production Deployment & Google OAuth Guide

This guide details the complete, IT-industry standard deployment of **CodeSentinel** across **Render** (Backend Gateway + AI Engine) and **Vercel** (React Cyber Dashboard), along with Google Cloud OAuth 2.0 and Gmail configuration.

---

## 🗺️ Production Architecture Blueprint

```
+-----------------------------------------------------------------------------------------------+
|                                    PRODUCTION CLOUD TOPOLOGY                                  |
+-----------------------------------------------------------------------------------------------+
|  FRONTEND (Vercel)          | https://codesentinel.vercel.app                                 |
|  BACKEND GATEWAY (Render)   | https://codesentinel-backend.onrender.com                       |
|  AI WORKER PLANE (Render)   | https://codesentinel-ai-engine.onrender.com                      |
|  DATABASE (MongoDB Atlas)   | mongodb+srv://<cluster>.mongodb.net/codesentinel                |
+-----------------------------------------------------------------------------------------------+
```

---

## 1. Deploying the AI Worker Engine on Render

1. Go to [Render Dashboard](https://dashboard.render.com/) -> **New** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the AI Engine service:
   - **Name**: `codesentinel-ai-engine`
   - **Root Directory**: `ai-engine`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Set Environment Variables in Render:
   | Key | Value | Note |
   | :--- | :--- | :--- |
   | `PORT` | `8000` | Render dynamically binds `$PORT` |
   | `GEMINI_API_KEY` | `your_gemini_api_key` | From Google AI Studio |
   | `GEMINI_MODEL` | `gemini-1.5-pro` | Or `gemini-2.0-flash` |
   | `SECRET_ENTROPY_THRESHOLD` | `3.8` | Threshold for secret interception |
   | `ENABLE_FALLBACK_HEURISTICS` | `true` | Offline resilience engine |
5. Click **Deploy Web Service** and copy your URL (e.g. `https://codesentinel-ai-engine.onrender.com`).

---

## 2. Deploying the Ingestion Gateway on Render

1. In Render Dashboard -> **New** -> **Web Service**.
2. Connect your repository.
3. Configure the Backend Gateway service:
   - **Name**: `codesentinel-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
4. Set Environment Variables in Render:
   | Key | Value | Description |
   | :--- | :--- | :--- |
   | `NODE_ENV` | `production` | Production environment mode |
   | `PORT` | `5000` | Dynamically assigned |
   | `CLIENT_URL` | `https://your-app.vercel.app` | Your Vercel frontend URL |
   | `MONGODB_URI` | `mongodb+srv://admin:pass@cluster.mongodb.net/codesentinel` | MongoDB Atlas URI |
   | `AI_ENGINE_URL` | `https://codesentinel-ai-engine.onrender.com` | Deployed AI Engine URL |
   | `AI_ENGINE_TIMEOUT_MS` | `4000` | Timeout before circuit breaker fallback |
   | `GITHUB_WEBHOOK_SECRET` | `your_webhook_secret` | Webhook verification secret |
   | `GITHUB_TOKEN` | `ghp_your_github_token` | GitHub Personal Access Token |
   | `JWT_SECRET` | `your_32_char_secure_random_jwt_key` | Session JWT Secret |
   | `API_KEY` | `cs_live_devsecops_key_enterprise_2026` | Enterprise Service Key |
5. Click **Deploy Web Service** and copy your URL (e.g. `https://codesentinel-backend.onrender.com`).

---

## 3. Deploying the Cyber Dashboard on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/) -> **Add New** -> **Project**.
2. Import your GitHub repository.
3. In Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend` (or leave root if using `vercel.json`).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. In **Environment Variables**, add:
   | Key | Value |
   | :--- | :--- |
   | `VITE_BACKEND_URL` | `https://codesentinel-backend.onrender.com` |
5. Click **Deploy**. Vercel will build and publish your site at `https://<your-project>.vercel.app`.

---

## 4. Google OAuth 2.0 & Gmail Alert Setup (Step-by-Step)

If you wish to configure Google Sign-In (SSO) or automated Gmail alerts for critical security incidents:

### A. Create Google OAuth Credentials
1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project (or create a new project called `CodeSentinel`).
3. Navigate to **APIs & Services** -> **Credentials**.
4. Click **Create Credentials** -> **OAuth Client ID**.
5. Select Application Type: **Web application**.
6. **Authorized JavaScript Origins** (Add both development & production):
   - `http://localhost:5173`
   - `https://your-app.vercel.app` (Your Vercel URL)
7. **Authorized Redirect URIs**:
   - `http://localhost:5000/api/auth/google/callback`
   - `https://codesentinel-backend.onrender.com/api/auth/google/callback` (Your Render Backend URL)
8. Click **Create** and copy your:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### B. Gmail App Password for Critical Security Alerts (Optional)
To send email alerts when a PR has hardcoded secrets or critical RBAC bypasses:
1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Enable **2-Step Verification** (if not already enabled).
3. Search for **App Passwords** (or visit [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)).
4. Create an App Password named `CodeSentinel`.
5. Copy the generated 16-character password (e.g. `abcd efgh ijkl mnop`).
6. Set in Render backend environment variables:
   - `EMAIL_USER=your_email@gmail.com`
   - `EMAIL_APP_PASSWORD=abcdefghijklmnop`
   - `ALERT_RECIPIENT_EMAIL=security-lead@yourdomain.com`

---

## 5. GitHub Webhook Configuration on Your Repository

1. In your GitHub repository -> **Settings** -> **Webhooks** -> **Add webhook**.
2. **Payload URL**: `https://codesentinel-backend.onrender.com/api/webhooks/github`
3. **Content type**: `application/json`
4. **Secret**: The secret matching `GITHUB_WEBHOOK_SECRET` (e.g. `your_webhook_secret`).
5. **Which events would you like to trigger this webhook?**:
   - Select **Let me select individual events**.
   - Check **Pull requests**.
6. Click **Add webhook**.
7. CodeSentinel will now automatically analyze every opened and synchronized pull request!
