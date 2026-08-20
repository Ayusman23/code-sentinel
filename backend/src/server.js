const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const { connectDB, inMemoryStore } = require('./config/database');
const { initSocket } = require('./services/socketService');
const { errorHandler } = require('./middleware/errorHandler');

// Route imports
const webhookRoutes = require('./routes/webhookRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const auditRoutes = require('./routes/auditRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO configuration with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
initSocket(io);

// Security & Middlewares
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*' }));
app.use(morgan('dev'));

// Rate limiter for API protection
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'TOO_MANY_REQUESTS', message: 'Rate limit exceeded. Please retry shortly.' }
});
app.use('/api/', limiter);

// Express Raw Body capture for cryptographic HMAC SHA-256 verification
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

// Root & Health Check Endpoints (for Render uptime & health probes)
app.get('/', (req, res) => {
  res.json({
    status: 'OPERATIONAL',
    service: 'CodeSentinel Control Plane Ingestion Gateway',
    version: '1.0.0 Enterprise',
    environment: config.nodeEnv,
    aiEngineUrl: config.aiEngineUrl,
    health: '/health',
    api: '/api/metrics'
  });
});

app.head('/', (req, res) => {
  res.status(200).end();
});

app.get('/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'CodeSentinel Ingestion Gateway (Control Plane)',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// API Routes
app.use('/api/webhooks', webhookRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/audit', auditRoutes);

// Seed initial sample reviews for instant live demo experience
const seedInitialData = () => {
  const sampleReview1 = {
    prId: 'octocat/fintech-core#42',
    repoOwner: 'octocat',
    repoName: 'fintech-core',
    prNumber: 42,
    title: 'feat: Add instant withdrawal endpoint and payment gateway bridge',
    author: 'alex-dev',
    baseBranch: 'main',
    headBranch: 'feature/instant-payout',
    headSha: 'a1b2c3d4e5f6',
    status: 'COMPLETED',
    overallRisk: 'CRITICAL',
    blastRadius: {
      overallScore: 84,
      riskLevel: 'CRITICAL',
      affectedComponents: ['Core Module: Payment', 'Core Module: Auth', 'Module: Controllers', 'Persistence Layer (Data Models)'],
      breakdown: {
        dependencyDepthScore: 85,
        apiSurfaceScore: 80,
        dataMutationScore: 70,
        rbacExposureScore: 90,
        cyclomaticDelta: 14
      },
      summary: 'Blast Radius evaluated at 84/100 (CRITICAL). 4 files modified introducing unauthenticated financial mutation and hardcoded API token.'
    },
    filesAnalyzedCount: 4,
    secretsIntercepted: [
      {
        ruleId: 'STRIPE_API_KEY',
        secretType: 'Stripe Secret Key',
        file: 'src/services/stripeBridge.ts',
        line: 8,
        rawMatchedHash: 'sha256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
        entropyScore: 4.82,
        isLiveRisk: true,
        redactedPreview: '[REDACTED_SECRET_STRIPE_KEY_7f83b1657ff1] (sk_...99a)'
      }
    ],
    vulnerabilities: [
      {
        id: 'VULN-001',
        ruleId: 'RBAC_MISSING_AUTH_MIDDLEWARE',
        title: 'Unauthenticated Mutating Route: POST /api/payments/withdraw',
        severity: 'CRITICAL',
        cweId: 'CWE-306',
        owaspCategory: 'A01:2021-Broken Access Control',
        file: 'src/routes/paymentRoutes.ts',
        lineStart: 18,
        lineEnd: 24,
        description: 'Financial withdrawal endpoint registered without requireAuth or role checks.',
        impact: 'Attackers can trigger instant automated fund transfers without authentication.',
        confidence: 0.99
      },
      {
        id: 'VULN-002',
        ruleId: 'RBAC_PRIVILEGE_ESCALATION',
        title: 'Mass Assignment Privilege Escalation in User Payload',
        severity: 'CRITICAL',
        cweId: 'CWE-915',
        owaspCategory: 'A01:2021-Broken Access Control',
        file: 'src/controllers/userController.ts',
        lineStart: 45,
        lineEnd: 48,
        description: 'Direct binding of req.body.role allows caller to elevate account privileges to ADMIN.',
        impact: 'Unauthorized privilege escalation leading to complete organizational account takeover.',
        confidence: 0.96
      }
    ],
    rbacIssues: [
      {
        route: '/api/payments/withdraw',
        method: 'POST',
        file: 'src/routes/paymentRoutes.ts',
        line: 18,
        issueType: 'MISSING_AUTH_MIDDLEWARE',
        description: 'Mutating route POST /api/payments/withdraw lacks authentication middleware.',
        severity: 'CRITICAL',
        remediationAdvice: 'Wrap endpoint with requireAuth and requireMfa middleware.'
      }
    ],
    crossFileImpacts: [
      {
        sourceFile: 'src/models/PaymentTransaction.ts',
        targetFile: 'src/controllers/paymentController.ts',
        impactType: 'SCHEMA_BREAK',
        symbol: 'idempotencyKey',
        description: 'PaymentTransaction model added required field idempotencyKey, but controller fails to supply it on insert.',
        severity: 'HIGH'
      }
    ],
    remediations: [
      {
        id: 'REM-001',
        vulnerabilityId: 'VULN-001',
        file: 'src/routes/paymentRoutes.ts',
        lineStart: 18,
        lineEnd: 24,
        originalCode: 'router.post("/withdraw", paymentController.withdraw);',
        suggestedCode: 'router.post("/withdraw", requireAuth, verifyMfaToken, paymentController.withdraw);',
        githubMarkdownSuggestion: '```suggestion\nrouter.post("/withdraw", requireAuth, verifyMfaToken, paymentController.withdraw);\n```',
        explanation: 'Inject requireAuth and multi-factor authorization guards prior to execution.',
        testVerificationSnippet: "describe('POST /api/payments/withdraw RBAC', () => {\n  it('should reject unauthenticated request with 401', async () => {\n    const res = await request(app).post('/api/payments/withdraw');\n    expect(res.status).toBe(401);\n  });\n});"
      }
    ],
    noiseSuppressionStats: {
      totalRulesEvaluated: 48,
      suppressedStylisticAlerts: 14,
      retainedHighSignalFindings: 3,
      signalRatioPercentage: 94.2
    },
    executiveSummary: 'CodeSentinel blocked high-risk PR #42. Discovered 1 hardcoded Stripe secret, 2 critical RBAC violations (unauthenticated payout), and 1 cross-file schema contract desync.',
    executionTimeMs: 412,
    aiEngineUsed: 'CodeSentinel Hybrid Engine (Gemini 1.5 Pro + AST Traversal)',
    commentsPostedCount: 3,
    createdAt: new Date(Date.now() - 1000 * 60 * 45),
    updatedAt: new Date(Date.now() - 1000 * 60 * 45)
  };

  const sampleReview2 = {
    prId: 'acme-corp/cloud-orchestrator#108',
    repoOwner: 'acme-corp',
    repoName: 'cloud-orchestrator',
    prNumber: 108,
    title: 'refactor: Upgrade auth token validator and add tenant scoping',
    author: 'sarah-sec',
    baseBranch: 'main',
    headBranch: 'refactor/tenant-isolation',
    headSha: 'd9e8f7a6b5c4',
    status: 'COMPLETED',
    overallRisk: 'LOW',
    blastRadius: {
      overallScore: 22,
      riskLevel: 'LOW',
      affectedComponents: ['Module: Auth', 'Module: Middleware'],
      breakdown: {
        dependencyDepthScore: 25,
        apiSurfaceScore: 10,
        dataMutationScore: 15,
        rbacExposureScore: 0,
        cyclomaticDelta: 3
      },
      summary: 'Blast Radius evaluated at 22/100 (LOW). Clean security enhancement with proper tenant boundary encapsulation.'
    },
    filesAnalyzedCount: 3,
    secretsIntercepted: [],
    vulnerabilities: [],
    rbacIssues: [],
    crossFileImpacts: [],
    remediations: [],
    noiseSuppressionStats: {
      totalRulesEvaluated: 32,
      suppressedStylisticAlerts: 8,
      retainedHighSignalFindings: 0,
      signalRatioPercentage: 100
    },
    executiveSummary: 'Clean PR #108. All authorization policies verified. Zero secrets detected. Zero breaking AST changes.',
    executionTimeMs: 285,
    aiEngineUsed: 'CodeSentinel Core AST Engine',
    commentsPostedCount: 0,
    createdAt: new Date(Date.now() - 1000 * 60 * 120),
    updatedAt: new Date(Date.now() - 1000 * 60 * 120)
  };

  inMemoryStore.reviews.set(sampleReview1.prId, sampleReview1);
  inMemoryStore.reviews.set(sampleReview2.prId, sampleReview2);
};

seedInitialData();

// Centralized error handler
app.use(errorHandler);

// Connect DB and start HTTP server
const PORT = config.port;
server.listen(PORT, async () => {
  await connectDB();
  console.log(`=======================================================`);
  console.log(`🛡️  CodeSentinel Control Plane Ingestion Gateway Ready!`);
  console.log(`🚀 Gateway Server running on: http://localhost:${PORT}`);
  console.log(`📡 WebSocket Telemetry Gateway: Active`);
  console.log(`🤖 AI Engine Worker URL: ${config.aiEngineUrl}`);
  console.log(`=======================================================`);
});
