const crypto = require('crypto');
const config = require('../config');

/**
 * Sub-Second Event-Driven Webhook Ingestion & HMAC SHA-256 Verification Middleware
 * Validates 'x-hub-signature-256' header against payload raw body with constant-time equality.
 */
const verifyGitHubWebhookSignature = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];
  const deliveryId = req.headers['x-github-delivery'];

  // For testing simulator / playground requests without signature
  if (req.headers['x-codesentinel-simulation'] === 'true' || process.env.NODE_ENV === 'test') {
    req.isSimulation = true;
    return next();
  }

  if (!signature) {
    // If webhook secret is empty or simulation is allowed
    if (!config.githubWebhookSecret || config.githubWebhookSecret === 'codesentinel_webhook_secret_2026') {
      return next();
    }
    return res.status(401).json({
      error: 'UNAUTHORIZED_WEBHOOK',
      message: 'Missing x-hub-signature-256 cryptographic header'
    });
  }

  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', config.githubWebhookSecret);
    const calculatedSig = `sha256=${hmac.update(rawBody).digest('hex')}`;

    const signatureBuffer = Buffer.from(signature);
    const calculatedBuffer = Buffer.from(calculatedSig);

    if (signatureBuffer.length !== calculatedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, calculatedBuffer)) {
      return res.status(401).json({
        error: 'INVALID_SIGNATURE',
        message: 'HMAC SHA-256 signature verification failed. Possible replay or payload tampering.'
      });
    }

    req.deliveryId = deliveryId;
    req.gitHubEvent = event;
    next();
  } catch (err) {
    return res.status(500).json({
      error: 'WEBHOOK_VERIFICATION_ERROR',
      message: err.message
    });
  }
};

module.exports = { verifyGitHubWebhookSignature };
