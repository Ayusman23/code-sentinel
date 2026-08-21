const PRReview = require('../models/PRReview');
const AuditLog = require('../models/AuditLog');
const Repository = require('../models/Repository');
const { inMemoryStore } = require('./database');

const SEED_REVIEWS = [
  {
    prId: 'enterprise-org/cloud-core-api#142',
    repoOwner: 'enterprise-org',
    repoName: 'cloud-core-api',
    prNumber: 142,
    title: 'feat: Add dynamic user role assignment and AWS S3 uploader',
    author: 'developer-lead',
    baseBranch: 'main',
    headBranch: 'feature/s3-storage',
    headSha: 'e4f5a6b7c8d9',
    status: 'COMPLETED',
    overallRisk: 'CRITICAL',
    blastRadius: {
      overallScore: 84,
      riskLevel: 'CRITICAL',
      affectedComponents: ['AdminController', 'StorageService', 'UserRoleService', 'DatabaseSession'],
      breakdown: {
        dependencyDepthScore: 78,
        apiSurfaceScore: 92,
        dataMutationScore: 85,
        rbacExposureScore: 95,
        cyclomaticDelta: 14
      },
      summary: 'High exposure to unauthenticated credential extraction and administrative role escalation.'
    },
    filesAnalyzedCount: 3,
    filteredOutFilesCount: 1,
    secretsIntercepted: [
      {
        ruleId: 'AWS_ACCESS_KEY',
        secretType: 'AWS Access Key ID',
        file: 'src/controllers/adminController.ts',
        line: 16,
        rawMatchedHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        entropyScore: 4.82,
        isLiveRisk: true,
        redactedPreview: 'AKIAIOSFODNN7*******'
      }
    ],
    vulnerabilities: [
      {
        id: 'VULN-AUTH-001',
        ruleId: 'UNAUTHENTICATED_MUTATION',
        title: 'Unauthenticated Public Administrative Endpoint',
        severity: 'CRITICAL',
        cweId: 'CWE-306',
        owaspCategory: 'A01:2021-Broken Access Control',
        file: 'src/controllers/adminController.ts',
        lineStart: 14,
        lineEnd: 24,
        description: 'Endpoint exposes production AWS S3 storage credentials without prior authentication or RBAC middleware validation.',
        impact: 'Anonymous external attackers can extract cloud storage credentials and exfiltrate production database backups.',
        confidence: 0.98
      },
      {
        id: 'VULN-RBAC-002',
        ruleId: 'UNPROTECTED_ROLE_ESCALATION',
        title: 'Privilege Escalation via Unchecked User Role Mutation',
        severity: 'CRITICAL',
        cweId: 'CWE-269',
        owaspCategory: 'A01:2021-Broken Access Control',
        file: 'src/controllers/adminController.ts',
        lineStart: 26,
        lineEnd: 31,
        description: 'PUT /api/users/:id/role allows arbitrary callers to assign administrative superuser roles without verification.',
        impact: 'Standard tenant accounts can elevate themselves to global platform administrator.',
        confidence: 0.96
      }
    ],
    rbacIssues: [
      {
        route: 'POST /api/storage/credentials',
        method: 'POST',
        file: 'src/controllers/adminController.ts',
        line: 14,
        issueType: 'MISSING_AUTHENTICATION_GATE',
        description: 'Endpoint exposed without requireAuth or Bearer verification.',
        severity: 'CRITICAL',
        remediationAdvice: 'Attach requireAuth and authorizeRoles(["admin"]) guards.'
      }
    ],
    crossFileImpacts: [
      {
        sourceFile: 'src/controllers/adminController.ts',
        targetFile: 'src/services/StorageService.ts',
        impactType: 'CREDENTIAL_FLOW_EXPOSURE',
        symbol: 'getStorageCredentials',
        description: 'Bypasses internal Key Management Service proxy.',
        severity: 'HIGH'
      }
    ],
    remediations: [
      {
        id: 'REM-101',
        vulnerabilityId: 'VULN-AUTH-001',
        file: 'src/controllers/adminController.ts',
        lineStart: 14,
        lineEnd: 24,
        originalCode: 'router.post("/api/storage/credentials", async (req, res) => {',
        suggestedCode: 'router.post("/api/storage/credentials", requireAuth, authorizeRoles(["admin"]), async (req, res) => {',
        githubMarkdownSuggestion: '```suggestion\nrouter.post("/api/storage/credentials", requireAuth, authorizeRoles(["admin"]), async (req, res) => {\n```',
        explanation: 'Enforce strict RBAC and cryptographic session validation before resolving credentials.',
        testVerificationSnippet: 'describe("POST /api/storage/credentials", () => {\n  it("rejects unauthenticated requests with 401", async () => {\n    const res = await request(app).post("/api/storage/credentials");\n    expect(res.status).toBe(401);\n  });\n});'
      }
    ],
    noiseSuppressionStats: {
      totalRulesEvaluated: 148,
      suppressedStylisticAlerts: 142,
      retainedHighSignalFindings: 2,
      signalRatioPercentage: 98.6
    },
    executiveSummary: 'CRITICAL security risk detected. PR contains 1 live hardcoded AWS access key and 2 unauthenticated administrative mutating routes.',
    executionTimeMs: 382,
    aiEngineUsed: 'CodeSentinel Zero-Trust Hybrid Engine',
    commentsPostedCount: 2
  },
  {
    prId: 'acme-corp/fintech-payment-engine#89',
    repoOwner: 'acme-corp',
    repoName: 'fintech-payment-engine',
    prNumber: 89,
    title: 'refactor(billing): Update Stripe webhook signature verification and plan downgrade flow',
    author: 'alex-secops',
    baseBranch: 'main',
    headBranch: 'fix/stripe-webhook-hmac',
    headSha: 'f1c2d3e4b5a6',
    status: 'COMPLETED',
    overallRisk: 'HIGH',
    blastRadius: {
      overallScore: 56,
      riskLevel: 'HIGH',
      affectedComponents: ['StripeWebhookHandler', 'SubscriptionManager', 'InvoiceModel'],
      breakdown: {
        dependencyDepthScore: 62,
        apiSurfaceScore: 48,
        dataMutationScore: 74,
        rbacExposureScore: 50,
        cyclomaticDelta: 6
      },
      summary: 'Modifies mission-critical payment settlement and subscription downgrade webhook flow.'
    },
    filesAnalyzedCount: 2,
    filteredOutFilesCount: 0,
    secretsIntercepted: [],
    vulnerabilities: [
      {
        id: 'VULN-CRYPTO-003',
        ruleId: 'TIMING_ATTACK_VULNERABILITY',
        title: 'Non-Constant-Time HMAC Signature Comparison',
        severity: 'HIGH',
        cweId: 'CWE-208',
        owaspCategory: 'A02:2021-Cryptographic Failures',
        file: 'src/webhooks/stripeHandler.js',
        lineStart: 45,
        lineEnd: 52,
        description: 'Signature comparison uses standard string equality (===), exposing the endpoint to side-channel timing attacks.',
        impact: 'Adversaries can forge Stripe webhook events and activate unpaid subscriptions.',
        confidence: 0.94
      }
    ],
    rbacIssues: [],
    crossFileImpacts: [],
    remediations: [
      {
        id: 'REM-102',
        vulnerabilityId: 'VULN-CRYPTO-003',
        file: 'src/webhooks/stripeHandler.js',
        lineStart: 48,
        lineEnd: 50,
        originalCode: 'if (computedSignature !== receivedSignature) {',
        suggestedCode: 'if (!crypto.timingSafeEqual(Buffer.from(computedSignature), Buffer.from(receivedSignature))) {',
        githubMarkdownSuggestion: '```suggestion\nif (!crypto.timingSafeEqual(Buffer.from(computedSignature, "hex"), Buffer.from(receivedSignature, "hex"))) {\n```',
        explanation: 'Use Node.js crypto.timingSafeEqual to prevent side-channel timing analysis on HMAC hashes.',
        testVerificationSnippet: 'it("uses constant-time comparison for HMAC signatures", () => {\n  expect(crypto.timingSafeEqual).toHaveBeenCalled();\n});'
      }
    ],
    noiseSuppressionStats: {
      totalRulesEvaluated: 120,
      suppressedStylisticAlerts: 116,
      retainedHighSignalFindings: 1,
      signalRatioPercentage: 96.7
    },
    executiveSummary: 'HIGH risk detected: Timing-attack vulnerable string comparison in webhook signature verifier.',
    executionTimeMs: 294,
    aiEngineUsed: 'CodeSentinel Zero-Trust Hybrid Engine',
    commentsPostedCount: 1
  },
  {
    prId: 'acme-corp/identity-auth-service#108',
    repoOwner: 'acme-corp',
    repoName: 'identity-auth-service',
    prNumber: 108,
    title: 'fix(session): Refresh token rotation and JWT expiration validation',
    author: 'sarah-eng',
    baseBranch: 'main',
    headBranch: 'fix/token-rotation',
    headSha: 'a9b8c7d6e5f4',
    status: 'COMPLETED',
    overallRisk: 'MEDIUM',
    blastRadius: {
      overallScore: 32,
      riskLevel: 'MEDIUM',
      affectedComponents: ['TokenRotator', 'SessionStore'],
      breakdown: {
        dependencyDepthScore: 30,
        apiSurfaceScore: 25,
        dataMutationScore: 40,
        rbacExposureScore: 35,
        cyclomaticDelta: 3
      },
      summary: 'Scoped token rotation update with minimal architectural blast radius.'
    },
    filesAnalyzedCount: 2,
    filteredOutFilesCount: 0,
    secretsIntercepted: [],
    vulnerabilities: [
      {
        id: 'VULN-AUTH-004',
        ruleId: 'WEAK_JWT_ALGORITHM_ACCEPTED',
        title: 'Permissive JWT Algorithm Acceptance Header',
        severity: 'MEDIUM',
        cweId: 'CWE-327',
        owaspCategory: 'A02:2021-Cryptographic Failures',
        file: 'src/services/jwtService.js',
        lineStart: 18,
        lineEnd: 24,
        description: 'JWT verification does not enforce explicit algorithm whitelist, risking "none" algorithm header bypasses.',
        impact: 'Potential token forgery on unpinned algorithm decoders.',
        confidence: 0.91
      }
    ],
    rbacIssues: [],
    crossFileImpacts: [],
    remediations: [
      {
        id: 'REM-103',
        vulnerabilityId: 'VULN-AUTH-004',
        file: 'src/services/jwtService.js',
        lineStart: 20,
        lineEnd: 22,
        originalCode: 'jwt.verify(token, secret);',
        suggestedCode: 'jwt.verify(token, secret, { algorithms: ["RS256", "HS256"] });',
        githubMarkdownSuggestion: '```suggestion\njwt.verify(token, secret, { algorithms: ["RS256", "HS256"] });\n```',
        explanation: 'Enforce explicit cryptographic algorithm whitelisting in jwt.verify.',
        testVerificationSnippet: 'it("rejects none algorithm in JWT header", () => {\n  expect(() => verifyUnsafeToken()).toThrow();\n});'
      }
    ],
    noiseSuppressionStats: {
      totalRulesEvaluated: 95,
      suppressedStylisticAlerts: 93,
      retainedHighSignalFindings: 1,
      signalRatioPercentage: 97.9
    },
    executiveSummary: 'MEDIUM risk detected: Add explicit algorithm whitelist to JWT verification logic.',
    executionTimeMs: 245,
    aiEngineUsed: 'CodeSentinel Zero-Trust Hybrid Engine',
    commentsPostedCount: 1
  },
  {
    prId: 'enterprise-org/k8s-mesh-infra#215',
    repoOwner: 'enterprise-org',
    repoName: 'k8s-mesh-infra',
    prNumber: 215,
    title: 'chore(gateway): Add OpenTelemetry tracing middleware and distributed span propagation',
    author: 'devops-architect',
    baseBranch: 'main',
    headBranch: 'chore/otel-tracing',
    headSha: 'c3d4e5f6a7b8',
    status: 'COMPLETED',
    overallRisk: 'LOW',
    blastRadius: {
      overallScore: 14,
      riskLevel: 'LOW',
      affectedComponents: ['TelemetryMiddleware', 'TracingExporter'],
      breakdown: {
        dependencyDepthScore: 12,
        apiSurfaceScore: 15,
        dataMutationScore: 10,
        rbacExposureScore: 10,
        cyclomaticDelta: 1
      },
      summary: 'Low-impact observability addition with verified zero security regressions.'
    },
    filesAnalyzedCount: 4,
    filteredOutFilesCount: 2,
    secretsIntercepted: [],
    vulnerabilities: [],
    rbacIssues: [],
    crossFileImpacts: [],
    remediations: [],
    noiseSuppressionStats: {
      totalRulesEvaluated: 110,
      suppressedStylisticAlerts: 110,
      retainedHighSignalFindings: 0,
      signalRatioPercentage: 100
    },
    executiveSummary: 'CLEAN PR: Zero security vulnerabilities, zero hardcoded credentials, intact RBAC gates.',
    executionTimeMs: 210,
    aiEngineUsed: 'CodeSentinel Zero-Trust Hybrid Engine',
    commentsPostedCount: 0
  }
];

const seedInitialData = async () => {
  try {
    // 1. Populate in-memory fallback stores immediately
    for (const rev of SEED_REVIEWS) {
      inMemoryStore.reviews.set(rev.prId, { ...rev, _id: `rev_${rev.prNumber}_seed` });
    }

    // 2. Populate MongoDB Atlas if connected and empty
    const count = await PRReview.countDocuments().catch(() => 1);
    if (count === 0) {
      console.log('[Seed] Seeding database with realistic enterprise PR triage data...');
      await PRReview.insertMany(SEED_REVIEWS);
      
      await Repository.create({
        fullName: 'enterprise-org/cloud-core-api',
        owner: 'enterprise-org',
        name: 'cloud-core-api',
        healthScore: 84,
        totalReviewsCount: 8,
        criticalIssuesBlockedCount: 3,
        secretsNeutralizedCount: 5,
        averageBlastRadius: 28,
        averageLatencyMs: 310
      });

      console.log(`[Seed] Successfully seeded ${SEED_REVIEWS.length} enterprise PR reviews.`);
    }
  } catch (err) {
    console.warn(`[Seed] Seed initialization note: ${err.message}`);
  }
};

module.exports = { seedInitialData, SEED_REVIEWS };
