const { describe, it } = require('node:test');
const assert = require('node:assert');
const crypto = require('crypto');
const { verifyGitHubWebhookSignature } = require('../src/middleware/webhookVerify');

describe('Webhook Ingestion & HMAC Verification', () => {
  it('allows simulation requests through with simulation flag', () => {
    const req = {
      headers: {
        'x-codesentinel-simulation': 'true'
      }
    };
    let nextCalled = false;
    const res = {};
    const next = () => { nextCalled = true; };

    verifyGitHubWebhookSignature(req, res, next);
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.isSimulation, true);
  });

  it('rejects requests with missing signature headers', () => {
    const req = {
      headers: {}
    };
    let statusCode = 0;
    let jsonBody = null;
    const res = {
      status(code) {
        statusCode = code;
        return {
          json(data) {
            jsonBody = data;
          }
        };
      }
    };
    const next = () => {};

    verifyGitHubWebhookSignature(req, res, next);
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(jsonBody.error, 'UNAUTHORIZED_WEBHOOK');
  });

  it('validates authentic HMAC SHA-256 signatures with constant-time equality', () => {
    const secret = 'Ayusman@2384';
    process.env.GITHUB_WEBHOOK_SECRET = secret;
    const payload = JSON.stringify({ action: 'opened', pull_request: { number: 42 } });
    const hmac = crypto.createHmac('sha256', secret);
    const signature = 'sha256=' + hmac.update(payload).digest('hex');

    const req = {
      headers: {
        'x-hub-signature-256': signature,
        'x-github-event': 'pull_request',
        'x-github-delivery': 'del_12345'
      },
      rawBody: payload
    };
    let nextCalled = false;
    const res = {};
    const next = () => { nextCalled = true; };

    verifyGitHubWebhookSignature(req, res, next);
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.gitHubEvent, 'pull_request');
  });
});
