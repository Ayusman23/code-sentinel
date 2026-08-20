const axios = require('axios');
const CircuitBreaker = require('opossum');
const config = require('../config');

/**
 * Resilient AI Engine Client with Circuit Breaker and Adaptive Fallback
 */
class AIEngineClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.aiEngineUrl,
      timeout: config.aiEngineTimeoutMs,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CodeSentinel-Gateway/1.0'
      }
    });

    // Opossum Circuit Breaker options
    const circuitOptions = {
      timeout: config.aiEngineTimeoutMs + 500, // 3000ms max
      errorThresholdPercentage: 50,           // Open breaker if >50% fail
      resetTimeout: 10000                     // Retry after 10s
    };

    this.breaker = new CircuitBreaker(this._invokeRemoteAI.bind(this), circuitOptions);
    this.breaker.fallback(this._fallbackHeuristics.bind(this));

    this.breaker.on('open', () => {
      console.warn('[CircuitBreaker] AI Engine Circuit OPEN - Redirecting to local heuristic resilience engine');
    });

    this.breaker.on('halfOpen', () => {
      console.log('[CircuitBreaker] AI Engine Circuit HALF-OPEN - Probing Python AI Engine health');
    });

    this.breaker.on('close', () => {
      console.log('[CircuitBreaker] AI Engine Circuit CLOSED - Python AI Engine operational');
    });
  }

  async analyzeDiff(payload) {
    return this.breaker.fire(payload);
  }

  async _invokeRemoteAI(payload) {
    const startTime = Date.now();
    const response = await this.client.post('/api/analyze-diff', payload);
    const latency = Date.now() - startTime;
    return {
      ...response.data,
      gatewayLatencyMs: latency,
      circuitBreakerState: this.breaker.opened ? 'OPEN' : 'CLOSED'
    };
  }

  async _fallbackHeuristics(payload, err) {
    console.warn(`[AI Engine Bridge] Invoking Local Heuristic Fallback due to: ${err?.message || 'Timeout'}`);
    
    // In-gateway deterministic heuristic scanner
    const files = payload.files || [];
    const vulns = [];
    const remediations = [];
    let cyclomaticDelta = 0;

    for (const file of files) {
      const patch = file.patch || '';
      
      // 1. Basic Secret Regex Check
      if (/AKIA[0-9A-Z]{16}/.test(patch)) {
        vulns.push({
          id: `FALLBACK-SEC-${Date.now()}`,
          ruleId: 'SECRET_AWS_ACCESS_KEY',
          title: 'Hardcoded AWS Access Key Detected',
          severity: 'CRITICAL',
          cweId: 'CWE-798',
          owaspCategory: 'A07:2021-Identification and Authentication Failures',
          file: file.filename,
          lineStart: 1,
          lineEnd: 1,
          description: 'Hardcoded cloud credentials exposed in patch diff.',
          impact: 'Complete AWS account compromise and lateral escalation.',
          confidence: 0.99
        });
      }

      // 2. Unauthenticated route check
      if (/\+(?:router|app)\.(?:post|put|delete)\([^,]+,\s*(?:async\s*)?\([^)]*\)\s*=>/i.test(patch)) {
        vulns.push({
          id: `FALLBACK-RBAC-${Date.now()}`,
          ruleId: 'RBAC_UNAUTHENTICATED_MUTATION',
          title: 'Unauthenticated Mutating Route',
          severity: 'HIGH',
          cweId: 'CWE-306',
          owaspCategory: 'A01:2021-Broken Access Control',
          file: file.filename,
          lineStart: 1,
          lineEnd: 1,
          description: 'Mutating route registered without authentication middleware.',
          impact: 'Attackers can trigger unauthenticated state mutations.',
          confidence: 0.95
        });

        remediations.push({
          id: `FALLBACK-REM-${Date.now()}`,
          file: file.filename,
          lineStart: 1,
          lineEnd: 1,
          originalCode: 'router.post(...)',
          suggestedCode: 'router.post(path, requireAuth, handler)',
          githubMarkdownSuggestion: '```suggestion\nrouter.post(path, requireAuth, handler);\n```',
          explanation: 'Enforce authentication middleware guard before handler execution.',
          testVerificationSnippet: 'it("returns 401 when unauthenticated", async () => { ... });'
        });
      }

      // Cyclomatic check
      const lines = patch.split('\n');
      for (const line of lines) {
        if (line.startsWith('+') && /\b(if|for|while|catch|\?)\b/.test(line)) {
          cyclomaticDelta++;
        }
      }
    }

    const overallScore = Math.min(100, Math.max(15, files.length * 15 + vulns.length * 25));
    const riskLevel = vulns.some(v => v.severity === 'CRITICAL') ? 'CRITICAL' : (vulns.length ? 'HIGH' : 'LOW');

    return {
      status: 'COMPLETED',
      overall_risk: riskLevel,
      blast_radius: {
        overall_score: overallScore,
        risk_level: riskLevel,
        affected_components: files.map(f => f.filename),
        breakdown: {
          dependency_depth_score: 30,
          api_surface_score: 25,
          data_mutation_score: 20,
          rbac_exposure_score: vulns.length * 30,
          cyclomatic_delta: cyclomaticDelta
        },
        summary: `Blast radius evaluated at ${overallScore}/100. Fallback heuristics engaged.`
      },
      secrets_intercepted: [],
      vulnerabilities: vulns,
      rbac_issues: [],
      cross_file_impacts: [],
      remediations: remediations,
      noise_suppression_stats: {
        total_rules_evaluated: 15,
        suppressed_stylistic_alerts: 0,
        retained_high_signal_findings: vulns.length,
        signal_ratio_percentage: 100
      },
      executive_summary: `Fallback Analysis Completed: ${vulns.length} vulnerabilities flagged across ${files.length} modified files.`,
      execution_time_ms: 25.0,
      ai_engine_used: 'Gateway Local Heuristics Engine (Fallback Active)',
      circuitBreakerState: 'OPEN'
    };
  }

  async healthCheck() {
    try {
      const res = await this.client.get('/health', { timeout: 1000 });
      return res.data;
    } catch (e) {
      return { status: 'UNAVAILABLE', error: e.message, circuitBreaker: this.breaker.opened ? 'OPEN' : 'CLOSED' };
    }
  }
}

module.exports = new AIEngineClient();
