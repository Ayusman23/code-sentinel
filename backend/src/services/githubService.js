const { Octokit } = require('@octokit/rest');
const { createAppAuth } = require('@octokit/auth-app');
const config = require('../config');
const DiffParser = require('../utils/diffParser');

/**
 * Enterprise GitHub Service with Zero-Trust GitHub App Authentication
 * Supports Dynamic Installation Token generation, Diff Token Budgeting, and Inline Reviews.
 */
class GitHubService {
  constructor() {
    this.appId = config.githubAppId;
    this.privateKey = this._formatPrivateKey(config.githubPrivateKey);
    this.staticToken = config.githubToken;
    this.installationClients = new Map();
  }

  /**
   * Helper to format private key from env (handles raw PEM or escaped newlines)
   */
  _formatPrivateKey(key) {
    if (!key) return null;
    let formatted = key.trim();
    if (formatted.includes('\\n')) {
      formatted = formatted.replace(/\\n/g, '\n');
    }
    return formatted;
  }

  /**
   * Returns an authenticated Octokit client for a specific repository installation
   * Falls back gracefully to static token or mock mode if App credentials are not present.
   * @param {number|string} [installationId] GitHub App Installation ID
   */
  getOctokit(installationId) {
    const instId = installationId || config.githubInstallationId;

    // 1. Zero-Trust GitHub App Authentication with Installation Token
    if (this.appId && this.privateKey && instId) {
      const cacheKey = `inst_${instId}`;
      if (this.installationClients.has(cacheKey)) {
        return this.installationClients.get(cacheKey);
      }

      const client = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId: this.appId,
          privateKey: this.privateKey,
          installationId: parseInt(instId, 10)
        },
        userAgent: 'CodeSentinel-DevSecOps/2.0 (GitHub-App-ZeroTrust)'
      });

      this.installationClients.set(cacheKey, client);
      return client;
    }

    // 2. Static GitHub PAT Authentication Fallback
    if (this.staticToken) {
      return new Octokit({
        auth: this.staticToken,
        userAgent: 'CodeSentinel-DevSecOps/2.0 (PAT-Fallback)'
      });
    }

    // 3. Unauthenticated / Mock Client for Local Testing
    return new Octokit({
      userAgent: 'CodeSentinel-DevSecOps/2.0 (Mock-Testing)'
    });
  }

  /**
   * Fetches changed files, strips lockfiles/binaries, and chunks massive patches
   * @param {string} owner
   * @param {string} repo
   * @param {number} pull_number
   * @param {number} [installationId]
   * @returns {Promise<{ actionableFiles: Array, ignoredFiles: Array }>}
   */
  async fetchPRFiles(owner, repo, pull_number, installationId = null) {
    const octokit = this.getOctokit(installationId);

    if (!this.staticToken && !this.privateKey) {
      // Mock files for simulator & test mode
      const mockRawFiles = [
        {
          filename: 'src/controllers/paymentController.js',
          status: 'modified',
          patch: '@@ -12,4 +12,6 @@\n+ router.post("/charge", async (req, res) => {\n+   const key = "AKIAIOSFODNN7EXAMPL9";\n+   res.send({ status: "paid" });\n+ });',
          additions: 4,
          deletions: 0
        },
        {
          filename: 'package-lock.json',
          status: 'modified',
          patch: '@@ -1,5 +1,5 @@\n-  "version": "1.0.0"\n+  "version": "1.0.1"',
          additions: 1,
          deletions: 1
        }
      ];

      return DiffParser.filterAndChunkDiffs(mockRawFiles);
    }

    try {
      const response = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number,
        per_page: 100
      });

      const rawFiles = response.data.map(f => ({
        filename: f.filename,
        old_path: f.previous_filename || null,
        status: f.status,
        patch: f.patch || '',
        additions: f.additions || 0,
        deletions: f.deletions || 0
      }));

      return DiffParser.filterAndChunkDiffs(rawFiles);

    } catch (err) {
      console.warn(`[GitHubService] listFiles failed for ${owner}/${repo}#${pull_number}: ${err.message}. Using empty diff list.`);
      return { actionableFiles: [], ignoredFiles: [], totalAdditions: 0, totalDeletions: 0 };
    }
  }

  /**
   * Posts inline code review comments with committable suggestions
   * @param {string} owner
   * @param {string} repo
   * @param {number} pull_number
   * @param {string} commit_id
   * @param {Object} reviewResult
   * @param {number} [installationId]
   */
  async postInlineReview(owner, repo, pull_number, commit_id, reviewResult, installationId = null) {
    const octokit = this.getOctokit(installationId);
    const comments = [];

    // 1. Build inline comments from remediations
    for (const rem of (reviewResult.remediations || [])) {
      if (rem.file && rem.githubMarkdownSuggestion) {
        const bodyText = `### 🛡️ CodeSentinel DevSecOps Remediation\n\n**${rem.explanation}**\n\n${rem.githubMarkdownSuggestion}\n\n${rem.testVerificationSnippet ? `#### 🧪 Test Compliance Verification\n\`\`\`typescript\n${rem.testVerificationSnippet}\n\`\`\`` : ''}`;
        
        comments.push({
          path: rem.file,
          line: rem.lineEnd || rem.lineStart || 1,
          side: 'RIGHT',
          body: bodyText
        });
      }
    }

    const summaryBadge = reviewResult.overall_risk === 'CRITICAL' || reviewResult.overall_risk === 'HIGH'
      ? '🔴 **REQUEST_CHANGES** - Critical Security/RBAC Violations Detected'
      : (reviewResult.overall_risk === 'MEDIUM' ? '🟡 **COMMENT** - Medium Risk Surface' : '🟢 **APPROVE** - Clean PR Verified');

    const reviewEvent = reviewResult.overall_risk === 'CRITICAL' ? 'REQUEST_CHANGES' : 'COMMENT';
    const executiveMarkdown = this.buildExecutiveSummaryMarkdown(reviewResult);

    if (!this.staticToken && !this.privateKey) {
      console.log(`[GitHubService (Simulation Mode)] Review prepared for ${owner}/${repo}#${pull_number}: ${reviewEvent} with ${comments.length} inline comments.`);
      return {
        id: `mock-review-${Date.now()}`,
        html_url: `https://github.com/${owner}/${repo}/pull/${pull_number}#pullrequestreview-mock`,
        commentsCount: comments.length,
        executiveMarkdown
      };
    }

    try {
      const response = await octokit.pulls.createReview({
        owner,
        repo,
        pull_number,
        commit_id: commit_id || undefined,
        event: reviewEvent,
        body: `${summaryBadge}\n\n${executiveMarkdown}`,
        comments: comments.slice(0, 15) // Limit comments to top 15 to stay within GitHub rate limits
      });

      return {
        id: response.data.id,
        html_url: response.data.html_url,
        commentsCount: comments.length,
        executiveMarkdown
      };
    } catch (err) {
      console.error(`[GitHubService] Error posting PR review for ${owner}/${repo}#${pull_number}: ${err.message}`);
      return { error: err.message, commentsCount: comments.length, executiveMarkdown };
    }
  }

  /**
   * Formats enterprise Markdown report table
   */
  buildExecutiveSummaryMarkdown(reviewResult) {
    const risk = reviewResult.overall_risk || 'LOW';
    const blast = reviewResult.blast_radius || { overall_score: 0, risk_level: 'LOW', summary: '' };
    const vulns = reviewResult.vulnerabilities || [];
    const secrets = reviewResult.secrets_intercepted || [];
    const rbac = reviewResult.rbac_issues || [];
    const cross = reviewResult.cross_file_impacts || [];

    return `
## 🛡️ CodeSentinel DevSecOps PR Security Report

| Metric | Assessment | Score / Count |
| :--- | :--- | :--- |
| **Overall Risk** | **\`${risk}\`** | Blast Radius: **${blast.overall_score}/100** |
| **Secrets Intercepted** | ${secrets.length > 0 ? '🚨 In-Flight Scrubbed' : '✅ None'} | **${secrets.length}** |
| **Vulnerabilities** | ${vulns.length > 0 ? '⚠️ High-Signal Findings' : '✅ None'} | **${vulns.length}** |
| **RBAC / Auth Bypasses** | ${rbac.length > 0 ? '🚨 Control Flow Violation' : '✅ Verified'} | **${rbac.length}** |
| **Cross-File AST Breaks**| ${cross.length > 0 ? '⚠️ Schema Desync' : '✅ Intact'} | **${cross.length}** |

---

### 💥 Architectural Blast Radius Breakdown
> ${blast.summary || 'Calculated failure surface across dependency depth, endpoints, and cyclomatic complexity.'}

* **Dependency Depth Risk:** \`${blast.breakdown?.dependency_depth_score || 0}%\`
* **API Surface Exposure:** \`${blast.breakdown?.api_surface_score || 0}%\`
* **Data Model Mutations:** \`${blast.breakdown?.data_mutation_score || 0}%\`
* **RBAC Sensitivity Factor:** \`${blast.breakdown?.rbac_exposure_score || 0}%\`
* **Cyclomatic Complexity Delta:** \`+${blast.breakdown?.cyclomatic_delta || 0}\`

---
*Generated by CodeSentinel Zero-Trust AI DevSecOps Agent in ${reviewResult.execution_time_ms || 0}ms.*
`;
  }
}

module.exports = new GitHubService();
