import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/common/Header';
import { TriagePipeline } from '../components/dashboard/TriagePipeline';
import { MetricsGrid } from '../components/dashboard/MetricsGrid';
import { LiveLogFeed } from '../components/dashboard/LiveLogFeed';
import { PRReviewList } from '../components/reviews/PRReviewList';
import { ManualDiffPlayground } from '../components/sandbox/ManualDiffPlayground';
import { GitHubPRSimulator } from '../components/github/GitHubPRSimulator';
import { AuditMatrix } from '../components/audit/AuditMatrix';
import { AboutBuildModal } from '../components/dashboard/AboutBuildModal';
import { GuidedTourOverlay } from '../components/dashboard/GuidedTourOverlay';
import { getMetrics, getReviews } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, AlertTriangle, Sparkles } from 'lucide-react';

const SEED_FALLBACK_REVIEWS = [
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
      affectedComponents: ['AdminController', 'StorageService', 'UserRoleService'],
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
        rawMatchedHash: 'sha256:e3b0c44298fc...',
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
      affectedComponents: ['StripeWebhookHandler', 'SubscriptionManager'],
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
  }
];

export const DashboardPage = () => {
  const { tab } = useParams();
  const navigate = useNavigate();
  const activeTab = tab || 'command-center';

  const [metrics, setMetrics] = useState(null);
  const [reviews, setReviews] = useState(SEED_FALLBACK_REVIEWS);
  const [loading, setLoading] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showTourOverlay, setShowTourOverlay] = useState(() => {
    return localStorage.getItem('codesentinel_tour_seen') !== 'true';
  });

  const { isConnected } = useSocket();
  const { currentRoleConfig, isTabAllowed } = useAuth();

  const handleSelectTab = (tabId) => {
    navigate(`/app/${tabId}`);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsData, reviewsData] = await Promise.allSettled([
        getMetrics(),
        getReviews()
      ]);

      if (metricsData.status === 'fulfilled' && metricsData.value) {
        setMetrics(metricsData.value);
      }

      if (reviewsData.status === 'fulfilled' && reviewsData.value?.data?.length > 0) {
        setReviews(reviewsData.value.data);
      }
    } catch (err) {
      console.warn('Backend offline, using high-fidelity in-memory seed records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Check tab permission
  const isAllowed = isTabAllowed(activeTab);

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text flex flex-col selection:bg-cyber-accent selection:text-cyber-dark">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleSelectTab}
        onOpenAbout={() => setShowAboutModal(true)}
        onOpenTour={() => setShowTourOverlay(true)}
      />

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Role Clearance Strip */}
        <div className="flex items-center justify-between p-3 rounded panel border border-cyber-border text-xs font-mono">
          <div className="flex items-center gap-2 text-cyber-muted">
            <ShieldCheck className="w-4 h-4 text-cyber-low shrink-0" />
            <span className="text-cyber-text font-bold">{currentRoleConfig.name}</span>
            <span className="hidden sm:inline text-cyber-faint">— {currentRoleConfig.description}</span>
          </div>

          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${currentRoleConfig.badgeClass}`}>
            {currentRoleConfig.shortName} Clearance
          </span>
        </div>

        {/* Real-Time Triage HUD (Visible on Command Center and PR views) */}
        {(activeTab === 'command-center' || activeTab === 'pr-reviews') && (
          <TriagePipeline />
        )}

        {/* Tab 1: Command Center Overview */}
        {activeTab === 'command-center' && isAllowed && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <MetricsGrid metrics={metrics} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-cyber-muted">
                    Recent PR Triage Stream ({reviews.length})
                  </h3>
                  <button
                    onClick={() => handleSelectTab('pr-reviews')}
                    className="text-xs font-mono text-cyber-accent hover:underline"
                  >
                    View All Reviews →
                  </button>
                </div>
                <PRReviewList reviews={reviews.slice(0, 5)} loading={loading} onRefresh={loadData} />
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-cyber-muted">
                  Audit Telemetry
                </h3>
                <LiveLogFeed />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: PR Reviews Triage Matrix */}
        {activeTab === 'pr-reviews' && isAllowed && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <PRReviewList reviews={reviews} loading={loading} onRefresh={loadData} />
          </div>
        )}

        {/* Tab 3: Manual Diff Sandbox (Admin / Security Engineer) */}
        {activeTab === 'diff-sandbox' && isAllowed && (
          <div className="animate-in fade-in duration-200">
            <ManualDiffPlayground />
          </div>
        )}

        {/* Tab 4: GitHub PR Webhook Simulator (Admin only) */}
        {activeTab === 'github-simulator' && isAllowed && (
          <div className="animate-in fade-in duration-200">
            <GitHubPRSimulator onReviewComplete={loadData} />
          </div>
        )}

        {/* Tab 5: Compliance Audit Logs (Admin / Security Engineer) */}
        {activeTab === 'audit-logs' && isAllowed && (
          <div className="animate-in fade-in duration-200">
            <AuditMatrix />
          </div>
        )}

        {/* Access Denied View when direct URL to unauthorized tab is visited */}
        {!isAllowed && (
          <div className="min-h-[50vh] flex items-center justify-center p-6">
            <div className="max-w-md w-full panel border border-cyber-critical/40 p-8 rounded-xl text-center space-y-4 shadow-xl">
              <Lock className="w-12 h-12 text-cyber-critical mx-auto" />
              <h2 className="text-lg font-bold font-mono text-cyber-text">SECURITY CLEARANCE RESTRICTED</h2>
              <p className="text-xs text-cyber-muted font-sans leading-relaxed">
                Your active role <strong className="text-cyber-critical font-mono">({currentRoleConfig.name})</strong> is not authorized to access <strong className="text-cyber-accent font-mono">/{activeTab}</strong>.
              </p>
              <button
                onClick={() => handleSelectTab('command-center')}
                className="px-4 py-2 rounded bg-cyber-card hover:bg-cyber-cardHover border border-cyber-border text-xs font-mono text-cyber-text transition-colors"
              >
                Return to Command Center
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Engineering Retrospective Modal */}
      <AboutBuildModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />

      {/* Guided Tour Walkthrough */}
      <GuidedTourOverlay
        isOpen={showTourOverlay}
        onClose={() => setShowTourOverlay(false)}
      />

      {/* Engineering Footer */}
      <footer className="border-t border-cyber-border py-4 px-6 text-center text-xs font-mono text-cyber-muted">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>CodeSentinel Enterprise Zero-Trust AI DevSecOps Agent</span>
          <span>Dual Runtime: Node.js Control Plane + Python FastAPI Worker Plane + Gemini API</span>
        </div>
      </footer>
    </div>
  );
};
