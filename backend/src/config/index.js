const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/codesentinel',
  aiEngineUrl: process.env.AI_ENGINE_URL || 'http://localhost:8000',
  aiEngineTimeoutMs: parseInt(process.env.AI_ENGINE_TIMEOUT_MS || '4000', 10),
  
  // GitHub Integration & Zero-Trust App Identity
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET || 'codesentinel_webhook_secret_2026',
  githubToken: process.env.GITHUB_TOKEN || '',
  githubAppId: process.env.GITHUB_APP_ID || '',
  githubPrivateKey: process.env.GITHUB_PRIVATE_KEY || '',
  githubInstallationId: process.env.GITHUB_INSTALLATION_ID || '',

  jwtSecret: process.env.JWT_SECRET || 'codesentinel_jwt_enterprise_secret_key_default_32',
  apiKey: process.env.API_KEY || 'cs_live_devsecops_key_enterprise_2026',
  
  // Google OAuth 2.0 Configuration
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',

  // Gmail / SMTP Security Alert Notifications
  emailUser: process.env.EMAIL_USER || process.env.GMAIL_USER || process.env.BREVO_SENDER_EMAIL || '',
  emailPass: process.env.EMAIL_APP_PASSWORD || process.env.GMAIL_APP_PASSWORD || '',
  alertRecipient: process.env.ALERT_RECIPIENT_EMAIL || process.env.GMAIL_USER || 'adixx2384@gmail.com',

  rateLimitWindowMs: 15 * 60 * 1000,
  rateLimitMax: 500
};

module.exports = config;
