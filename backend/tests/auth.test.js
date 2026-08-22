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

  it('registers a new user with a proper email address and password', async () => {
    const uniqueEmail = `test.developer.${Date.now()}@enterprise.com`;
    const req = {
      body: {
        email: uniqueEmail,
        password: 'securePassword123!',
        name: 'Sarah Connor',
        role: 'SECURITY_ENGINEER',
        department: 'Threat Defense Group'
      }
    };
    let statusCode = 200;
    let jsonResult = null;
    const res = {
      status(code) {
        statusCode = code;
        return {
          json(data) {
            jsonResult = data;
          }
        };
      },
      json(data) {
        jsonResult = data;
      }
    };

    await authController.register(req, res, () => {});
    assert.strictEqual(statusCode, 201);
    assert.strictEqual(jsonResult.status, 'REGISTERED');
    assert.strictEqual(jsonResult.user.email, uniqueEmail);
    assert.strictEqual(jsonResult.user.name, 'Sarah Connor');
    assert.strictEqual(jsonResult.user.role, 'SECURITY_ENGINEER');
    assert.ok(jsonResult.token);

    // Verify newly registered user can now login
    const loginReq = {
      body: {
        email: uniqueEmail,
        password: 'securePassword123!'
      }
    };
    let loginResult = null;
    const loginRes = {
      json(data) {
        loginResult = data;
      }
    };
    await authController.login(loginReq, loginRes, () => {});
    assert.strictEqual(loginResult.status, 'AUTHENTICATED');
    assert.strictEqual(loginResult.user.email, uniqueEmail);
  });

  it('rejects registration with improper or malformed email address', async () => {
    const req = {
      body: {
        email: 'invalid-email-without-domain',
        password: 'password123',
        name: 'Bad Email User'
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

    await authController.register(req, res, () => {});
    assert.strictEqual(statusCode, 400);
    assert.strictEqual(jsonResult.error, 'INVALID_EMAIL');
  });

  it('rejects registration with weak password (< 6 characters)', async () => {
    const req = {
      body: {
        email: 'valid.user@test.io',
        password: '123',
        name: 'Weak Pass User'
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

    await authController.register(req, res, () => {});
    assert.strictEqual(statusCode, 400);
    assert.strictEqual(jsonResult.error, 'WEAK_PASSWORD');
  });

  it('authenticates and provisions user via Google social sign-in/sign-up', async () => {
    const googleEmail = `google.engineer.${Date.now()}@gmail.com`;
    const req = {
      body: {
        email: googleEmail,
        name: 'Google Engineer',
        googleId: 'g_1029384756',
        avatar: 'https://lh3.googleusercontent.com/a/default-user',
        role: 'SECURITY_ENGINEER'
      }
    };
    let jsonResult = null;
    const res = {
      json(data) {
        jsonResult = data;
      }
    };

    await authController.googleAuth(req, res, () => {});
    assert.strictEqual(jsonResult.status, 'AUTHENTICATED');
    assert.strictEqual(jsonResult.user.email, googleEmail);
    assert.strictEqual(jsonResult.user.authProvider, 'google');
    assert.strictEqual(jsonResult.user.role, 'SECURITY_ENGINEER');
    assert.ok(jsonResult.token);

    // Verify token payload
    const decoded = jwt.verify(jsonResult.token, config.jwtSecret);
    assert.strictEqual(decoded.email, googleEmail);
  });

  it('rejects forged or invalid Google ID Token with HTTP 401', async () => {
    const req = {
      body: {
        idToken: 'invalid.forged.google.jwt.token'
      }
    };
    let statusCode = 200;
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

    await authController.googleAuth(req, res, () => {});
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(jsonResult.error, 'INVALID_GOOGLE_TOKEN');
  });

  it('rejects empty Google auth payload with HTTP 400', async () => {
    const req = {
      body: {}
    };
    let statusCode = 200;
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

    await authController.googleAuth(req, res, () => {});
    assert.strictEqual(statusCode, 400);
    assert.strictEqual(jsonResult.error, 'BAD_REQUEST');
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
