const { Octokit } = require('@octokit/rest');
const config = require('../config');

/**
 * Enterprise GitHub Octokit Integration Service
 * Manages Check Runs, Inline Review Comments, and Executive Badging.
 */
class GitHubService {
  constructor() {
    this.octokit = new Octokit({
      auth: config.githubToken || undefined,
      userAgent: 'CodeSentinel-DevSecOps/1.0'
    });
  }

  /**
   * Fetches changed files and patch diffs for a pull request
   */
  async fetchPRFiles(owner, repo, pull_number) {
    if (!config.githubToken) {
      // Mock files for simulator / offline testing
      return [
        {
          filename: 'src/controllers/paymentController.js',
          status: 'modified',
          patch: '@@ -12,4 +12,6 @@\n+ router.post("/charge", async (req, res) => {\n+   const key = "AKIAIOSFODNN7EXAMPL9";\n+   res.send({ status: "paid" });\n+ });',
          additions: 4,
          deletions: 0
        }
      ];
    }

    try {
      const response = await this.octokit.pulls.listFiles({
        owner,
        repo,
        pull_number,
        per_page: 100
      });

      return response.data.map(f => ({
        filename: f.filename,
        old_path: f.previous_filename,
        status: f.status,
        patch: f.patch || '',
        additions: f.additions,
        deletions: f.deletions
      }));
    } catch (err) {
      console.warn(`[GitHubService] Failed to fetch PR files: ${err.message}. Using provided payload.`);
      return [];
    }
  }

  /**
   * Posts inline code review comments with committable suggestions
   */
  async postInlineReview(owner, repo, pull_number, commit_id, reviewResult) {
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

    if (!config.githubToken) {
      console.log(`[GitHubService (Mock Mode)] Would post review to ${owner}/${repo}#${pull_number}: ${reviewEvent} with ${comments.length} inline comments.`);
      return {
        id: `mock-review-${Date.now()}`,
        html_url: `https://github.com/${owner}/${repo}/pull/${pull_number}#pullrequestreview-mock`,
        commentsCount: comments.length,
        executiveMarkdown
      };
    }

    try {
      const response = await this.octokit.pulls.createReview({
        owner,
        repo,
        pull_number,
        commit_id,
        event: reviewEvent,
        body: `${summaryBadge}\n\n${executiveMarkdown}`,
        comments: comments.slice(0, 20) // Limit to top 20 comments to avoid GitHub API limits
      });

      return {
        id: response.data.id,
        html_url: response.data.html_url,
        commentsCount: comments.length,
        executiveMarkdown
      };
    } catch (err) {
      console.error(`[GitHubService] Error posting PR review: ${err.message}`);
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
*Generated by CodeSentinel AI DevSecOps Platform in ${reviewResult.execution_time_ms || 0}ms.*
`;
  }
}

module.exports = new GitHubService();
