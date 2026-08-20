const express = require('express');
const router = express.Router();
const { verifyGitHubWebhookSignature } = require('../middleware/webhookVerify');
const { handleGitHubWebhook } = require('../controllers/webhookController');

/**
 * POST /api/webhooks/github
 * Sub-Second Ingestion & HMAC Verification
 */
router.post('/github', verifyGitHubWebhookSignature, handleGitHubWebhook);

module.exports = router;
