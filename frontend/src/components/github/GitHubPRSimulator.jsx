import React, { useState } from 'react';
import { Play, GitPullRequest, CheckCircle2, MessageSquare } from 'lucide-react';
import { triggerSimulatedWebhook } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { CyberBadge } from '../common/CyberBadge';

export const GitHubPRSimulator = ({ onReviewComplete }) => {
  const { activePipelineJob } = useSocket();
  const [repoOwner, setRepoOwner] = useState('enterprise-org');
  const [repoName, setRepoName] = useState('cloud-core-api');
  const [prNumber, setPrNumber] = useState(142);
  const [title, setTitle] = useState('feat: Add dynamic user role assignment and AWS S3 uploader');
  const [author, setAuthor] = useState('developer-lead');
  const [loading, setLoading] = useState(false);
  const [webhookResponse, setWebhookResponse] = useState(null);

  const sampleDiff = `--- a/src/controllers/adminController.ts
+++ b/src/controllers/adminController.ts
@@ -14,6 +14,14 @@ export class AdminController {
+   // Added public endpoint for storage credentials
+   router.post('/api/storage/credentials', async (req, res) => {
+     const awsAccessKey = "AKIAIOSFODNN7EXAMPL9";
+     res.json({ key: awsAccessKey, bucket: "production-data" });
+   });
+
+   router.put('/api/users/:id/role', async (req, res) => {
+     const user = await User.findById(req.params.id);
+     user.role = req.body.role;
+     await user.save();
+     res.json({ success: true });
+   });`;

  const handleTriggerWebhook = async () => {
    setLoading(true);
    setWebhookResponse(null);

    const payload = {
      action: 'opened',
      number: parseInt(prNumber, 10),
      pull_request: {
        number: parseInt(prNumber, 10),
        title,
        user: { login: author },
        base: { ref: 'main' },
        head: { ref: 'feature/s3-storage', sha: 'e4f5a6b7c8d9' }
      },
      repository: {
        name: repoName,
        full_name: `${repoOwner}/${repoName}`,
        owner: { login: repoOwner }
      },
      mock_files: [
        {
          filename: 'src/controllers/adminController.ts',
          status: 'modified',
          patch: sampleDiff,
          additions: 12,
          deletions: 0
        }
      ]
    };

    try {
      const res = await triggerSimulatedWebhook(payload);
      setWebhookResponse(res);
      if (onReviewComplete) {
        setTimeout(onReviewComplete, 3000);
      }
    } catch (err) {
      console.error('Webhook simulation failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Simulation Header */}
      <div className="panel p-4 rounded border border-cyber-border flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-cyber-text flex items-center gap-2 uppercase tracking-wider">
            <GitPullRequest className="w-3.5 h-3.5 text-cyber-accent" />
            GitHub PR Webhook & Event Ingestion Simulator
          </h3>
          <p className="text-xs text-cyber-muted mt-0.5">
            Test the sub-second HMAC event dispatcher and watch the asynchronous AI triage pipeline stream live telemetry.
          </p>
        </div>

        <button
          onClick={handleTriggerWebhook}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded bg-cyber-card text-cyber-accent border border-cyber-border hover:border-cyber-accent font-medium text-xs transition-colors disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {loading ? 'DISPATCHING WEBHOOK...' : 'TRIGGER GITHUB WEBHOOK (202)'}
        </button>
      </div>

      {/* PR Payload Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="panel p-4 rounded border border-cyber-border space-y-3">
          <h4 className="text-xs font-bold text-cyber-text uppercase tracking-wider mb-2">Simulated Pull Request Metadata</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-cyber-muted uppercase">Repository Owner</label>
              <input
                type="text"
                value={repoOwner}
                onChange={(e) => setRepoOwner(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded px-2.5 py-1.5 text-xs text-cyber-text mt-1 focus:outline-none focus:border-cyber-accent"
              />
            </div>
            <div>
              <label className="text-[10px] text-cyber-muted uppercase">Repository Name</label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded px-2.5 py-1.5 text-xs text-cyber-text mt-1 focus:outline-none focus:border-cyber-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-cyber-muted uppercase">PR Number</label>
              <input
                type="number"
                value={prNumber}
                onChange={(e) => setPrNumber(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded px-2.5 py-1.5 text-xs text-cyber-text mt-1 focus:outline-none focus:border-cyber-accent"
              />
            </div>
            <div>
              <label className="text-[10px] text-cyber-muted uppercase">PR Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded px-2.5 py-1.5 text-xs text-cyber-text mt-1 focus:outline-none focus:border-cyber-accent"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-cyber-muted uppercase">PR Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded px-2.5 py-1.5 text-xs text-cyber-text mt-1 focus:outline-none focus:border-cyber-accent"
            />
          </div>
        </div>

        {/* Patch Preview */}
        <div className="panel p-4 rounded border border-cyber-border flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-cyber-text uppercase tracking-wider">Simulated Diff Hunk (Secrets & Flaw)</span>
            <span className="text-[10px] text-cyber-muted">Unified Patch</span>
          </div>
          <textarea
            readOnly
            value={sampleDiff}
            className="flex-1 bg-cyber-bg border border-cyber-border rounded p-3 text-[11px] text-cyber-low font-mono resize-none focus:outline-none"
            rows={7}
          />
        </div>
      </div>

      {/* Immediate Webhook Response (202 Accepted) */}
      {webhookResponse && (
        <div className="p-3.5 rounded diff-card state-low flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-cyber-low" />
            <div>
              <span className="text-xs font-bold text-cyber-low">HTTP 202 ACCEPTED (Non-Blocking Ingestion in 18ms)</span>
              <p className="text-[11px] text-cyber-muted mt-0.5">Job ID: <code className="text-cyber-accent">{webhookResponse.jobId}</code></p>
            </div>
          </div>
          <CyberBadge variant="COMPLETED">HMAC VERIFIED</CyberBadge>
        </div>
      )}

      {/* GitHub PR Conversation Simulator Preview */}
      <div className="panel p-4 rounded border border-cyber-border space-y-3">
        <div className="flex items-center gap-2 border-b border-cyber-border pb-2.5">
          <MessageSquare className="w-3.5 h-3.5 text-cyber-accent" />
          <h4 className="text-xs font-bold text-cyber-text uppercase tracking-wider">GitHub Pull Request Review Preview</h4>
        </div>

        {/* Simulated GitHub Check Badge */}
        <div className="p-3.5 rounded bg-cyber-bg border border-cyber-border text-cyber-text space-y-2.5">
          <div className="flex items-center justify-between border-b border-cyber-border pb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyber-critical" />
              <strong>CodeSentinel DevSecOps / PR Review</strong>
              <span className="text-cyber-muted">— Completed</span>
            </div>
            <span className="text-cyber-faint text-[11px]">Details</span>
          </div>

          <div className="text-xs space-y-1.5 font-sans">
            <p className="text-cyber-critical font-bold font-mono text-[11px]">🔴 Changes requested by CodeSentinel AI Bot</p>
            <p className="text-cyber-text leading-relaxed">
              Discovered <strong>1 hardcoded AWS credential</strong> (scrubbed in-flight) and <strong>1 unauthenticated mutating endpoint</strong> on route <code>POST /api/storage/credentials</code>.
            </p>
          </div>

          {/* Inline Suggestion Box */}
          <div className="p-2.5 rounded bg-cyber-card border border-cyber-border text-xs font-mono">
            <p className="text-cyber-muted text-[11px] mb-1">Suggested change on src/controllers/adminController.ts:16</p>
            <div className="p-2 rounded bg-cyber-bg text-cyber-low border border-cyber-border text-[11px]">
              <pre>+ router.post('/api/storage/credentials', requireAuth, authorizeRoles(['admin']), ...);</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
