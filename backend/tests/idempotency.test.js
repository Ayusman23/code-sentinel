const { describe, it } = require('node:test');
const assert = require('node:assert');
const { handleGitHubWebhook, processedDeliveries } = require('../src/controllers/webhookController');

describe('Webhook Idempotency & Delivery Deduplication', () => {
  it('acknowledges first delivery and drops subsequent duplicate delivery within SLA', async () => {
    const testDeliveryId = `del_test_idempotency_${Date.now()}`;
    
    // First request
    let statusCode1 = null;
    let responseBody1 = null;
    const req1 = {
      headers: { 'x-github-event': 'pull_request', 'x-github-delivery': testDeliveryId },
      body: {
        action: 'opened',
        pull_request: { number: 77, title: 'Test PR', user: { login: 'dev' } },
        repository: { name: 'test-repo', full_name: 'org/test-repo', owner: { login: 'org' } }
      }
    };
    const res1 = {
      status: (code) => { statusCode1 = code; return res1; },
      json: (data) => { responseBody1 = data; return res1; }
    };

    await handleGitHubWebhook(req1, res1);
    assert.strictEqual(statusCode1, 200);
    assert.strictEqual(responseBody1.status, 'ACCEPTED');

    // Second request (Duplicate Delivery ID)
    let statusCode2 = null;
    let responseBody2 = null;
    const res2 = {
      status: (code) => { statusCode2 = code; return res2; },
      json: (data) => { responseBody2 = data; return res2; }
    };

    await handleGitHubWebhook(req1, res2);
    assert.strictEqual(statusCode2, 200);
    assert.strictEqual(responseBody2.status, 'IDEMPOTENT_DUPLICATE_ACKNOWLEDGED');
  });
});
