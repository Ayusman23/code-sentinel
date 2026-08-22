const { describe, it } = require('node:test');
const assert = require('node:assert');
const jwt = require('jsonwebtoken');
const config = require('../src/config');
const { verifyJWT, requireRole, requirePermission } = require('../src/middleware/authMiddleware');
const authController = require('../src/controllers/authController');
const { getPublicStats } = require('../src/controllers/metricsController');
const { inMemoryStore } = require('../src/config/database');
const { seedInitialData } = require('../src/config/seedData');

describe('Enterprise Authentication & RBAC Suite', async () => {
  // Ensure inMemoryStore is primed with demo users
  await seedInitialData();

  it('authenticates Admin demo account with valid credentials', async () => {
    const req = {
      body: {
        email: 'demo-admin@codesentinel.dev',
        password: 'demo1234'
      }
    };
    let jsonResult = null;
    const res = {
      json(data) {
        jsonResult = data;
      }
    };

    await authController.login(req, res, () => {});
    assert.strictEqual(jsonResult.status, 'AUTHENTICATED');
    assert.strictEqual(jsonResult.user.role, 'ADMIN');
    assert.ok(jsonResult.token);

    // Verify JWT payload
    const decoded = jwt.verify(jsonResult.token, config.jwtSecret);
    assert.strictEqual(decoded.email, 'demo-admin@codesentinel.dev');
    assert.strictEqual(decoded.role, 'ADMIN');
  });

  it('authenticates Security Engineer demo account', async () => {
    const req = {
      body: {
        email: 'demo-secops@codesentinel.dev',
        password: 'demo1234'
      }
    };
    let jsonResult = null;
    const res = {
      json(data) {
        jsonResult = data;
      }
    };

    await authController.login(req, res, () => {});
    assert.strictEqual(jsonResult.status, 'AUTHENTICATED');
    assert.strictEqual(jsonResult.user.role, 'SECURITY_ENGINEER');
    assert.ok(jsonResult.user.permissions.includes('EXECUTE_SANDBOX'));
    assert.ok(!jsonResult.user.permissions.includes('TRIGGER_WEBHOOK'));
  });

  it('authenticates Developer demo account with read-only scoped permissions', async () => {
    const req = {
      body: {
        email: 'demo-dev@codesentinel.dev',
        password: 'demo1234'
      }
    };
    let jsonResult = null;
    const res = {
      json(data) {
        jsonResult = data;
      }
    };

    await authController.login(req, res, () => {});
    assert.strictEqual(jsonResult.status, 'AUTHENTICATED');
    assert.strictEqual(jsonResult.user.role, 'DEVELOPER');
    assert.ok(jsonResult.user.permissions.includes('COPY_PATCHES'));
    assert.ok(!jsonResult.user.permissions.includes('EXPORT_AUDIT'));
  });

  it('rejects login with invalid password', async () => {
    const req = {
      body: {
        email: 'demo-admin@codesentinel.dev',
        password: 'wrong_password_999'
      }
    };
    let statusCode = 0;
    let jsonResult = null;
    const res = {
      status(code) {
        statusCode = code;
        return {
          json(data) {
            jsonResult = data;
          }
        };
      }
    };

    await authController.login(req, res, () => {});
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(jsonResult.error, 'INVALID_CREDENTIALS');
  });

  it('provisions token via 1-click demoLogin endpoint', async () => {
    const req = {
      body: {
        role: 'SECURITY_ENGINEER'
      }
    };
    let jsonResult = null;
    const res = {
      json(data) {
        jsonResult = data;
      }
    };

    await authController.demoLogin(req, res, () => {});
    assert.strictEqual(jsonResult.status, 'AUTHENTICATED');
    assert.strictEqual(jsonResult.user.role, 'SECURITY_ENGINEER');
    assert.ok(jsonResult.token);
  });

  it('verifyJWT middleware passes valid token and attaches user context', async () => {
    const token = jwt.sign(
      { userId: 'u_123', email: 'demo-admin@codesentinel.dev', name: 'Alex', role: 'ADMIN' },
      config.jwtSecret
    );
    const req = {
      headers: {
        authorization: `Bearer ${token}`
      }
    };
    let nextCalled = false;
    const res = {};
    const next = () => { nextCalled = true; };

    await verifyJWT(req, res, next);
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user.role, 'ADMIN');
  });

  it('verifyJWT middleware rejects missing or malformed token', async () => {
    const req = { headers: {} };
    let statusCode = 0;
    let jsonResult = null;
    const res = {
      status(code) {
        statusCode = code;
        return {
          json(data) {
            jsonResult = data;
          }
        };
      }
    };

    await verifyJWT(req, res, () => {});
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(jsonResult.error, 'UNAUTHORIZED');
  });

  it('requireRole middleware blocks Developer from accessing Admin/SecOps routes (403)', () => {
    const req = {
      user: {
        userId: 'dev_1',
        role: 'DEVELOPER'
      }
    };
    let statusCode = 0;
    let jsonResult = null;
    const res = {
      status(code) {
        statusCode = code;
        return {
          json(data) {
            jsonResult = data;
          }
        };
      }
    };

    const guard = requireRole(['ADMIN', 'SECURITY_ENGINEER']);
    guard(req, res, () => {});
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(jsonResult.error, 'FORBIDDEN');
  });

  it('getPublicStats returns honest aggregate metrics without requiring authentication', async () => {
    const req = {};
    let jsonResult = null;
    const res = {
      json(data) {
        jsonResult = data;
      }
    };

    await getPublicStats(req, res, () => {});
    assert.strictEqual(jsonResult.success, true);
    assert.ok(typeof jsonResult.data.totalPRsScanned === 'number');
    assert.ok(typeof jsonResult.data.secretsIntercepted === 'number');
    assert.ok(typeof jsonResult.data.avgBlastRadius === 'number');
    assert.strictEqual(jsonResult.data.gatewayStatus, 'OPERATIONAL');
  });
});
