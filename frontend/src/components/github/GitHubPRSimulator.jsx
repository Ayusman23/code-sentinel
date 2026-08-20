import React, { useState } from 'react';
import { Play, GitPullRequest, CheckCircle2, ShieldAlert, Radio, ArrowRight, MessageSquare, Terminal } from 'lucide-react';
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
    <div className="space-y-6 font-mono">
      {/* Simulation Header */}
      <div className="cyber-glass p-5 rounded-xl border border-cyber-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <GitPullRequest className="w-4 h-4 text-cyber-accent" />
            GitHub PR Webhook & Event Ingestion Simulator
          </h3>
          <p className="text-xs text-cyber-muted mt-0.5">
            Test the sub-second HMAC event dispatcher and watch the asynchronous AI triage pipeline stream live telemetry.
          </p>
        </div>

        <button
          onClick={handleTriggerWebhook}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyber-accent text-cyber-dark font-bold text-xs hover:bg-emerald-300 transition shadow-[0_0_20px_rgba(34,230,184,0.4)] disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          {loading ? 'DISPATCHING WEBHOOK...' : 'TRIGGER GITHUB WEBHOOK (202)'}
        </button>
      </div>

      {/* PR Payload Configuration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="cyber-glass p-5 rounded-xl border border-cyber-border/40 space-y-3">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">Simulated Pull Request Metadata</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-cyber-muted uppercase">Repository Owner</label>
              <input
                type="text"
                value={repoOwner}
                onChange={(e) => setRepoOwner(e.target.value)}
                className="w-full bg-cyber-dark border border-cyber-border/30 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1"
              />
            </div>
            <div>
              <label className="text-[10px] text-cyber-muted uppercase">Repository Name</label>
              <input
                type="text"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className="w-full bg-cyber-dark border border-cyber-border/30 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1"
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
                className="w-full bg-cyber-dark border border-cyber-border/30 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1"
              />
            </div>
            <div>
              <label className="text-[10px] text-cyber-muted uppercase">PR Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-cyber-dark border border-cyber-border/30 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-cyber-muted uppercase">PR Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-cyber-dark border border-cyber-border/30 rounded-lg px-2.5 py-1.5 text-xs text-white mt-1"
            />
          </div>
        </div>

        {/* Patch Preview */}
        <div className="cyber-glass p-5 rounded-xl border border-cyber-border/40 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">Simulated Diff Hunk (with secrets & RBAC flaw)</span>
            <span className="text-[10px] text-cyber-muted">Unified Patch</span>
          </div>
          <textarea
            readOnly
            value={sampleDiff}
            className="flex-1 bg-cyber-dark border border-cyber-border/30 rounded-lg p-3 text-[11px] text-emerald-400 font-mono resize-none focus:outline-none"
            rows={7}
          />
        </div>
      </div>

      {/* Immediate Webhook Response (202 Accepted) */}
      {webhookResponse && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-xs font-bold text-emerald-400">HTTP 202 ACCEPTED (Non-Blocking Ingestion in 18ms)</span>
              <p className="text-[11px] text-slate-300 mt-0.5">Job ID: <code className="text-cyber-accent">{webhookResponse.jobId}</code></p>
            </div>
          </div>
          <CyberBadge variant="COMPLETED">HMAC VERIFIED</CyberBadge>
        </div>
      )}

      {/* GitHub PR Conversation Simulator Preview */}
      <div className="cyber-glass p-5 rounded-xl border border-cyber-border/40 space-y-4">
        <div className="flex items-center gap-2 border-b border-cyber-border/30 pb-3">
          <MessageSquare className="w-4 h-4 text-cyber-accent" />
          <h4 className="text-xs font-bold text-white uppercase tracking-wider">GitHub Pull Request Review Preview</h4>
        </div>

        {/* Simulated GitHub Check Badge */}
        <div className="p-4 rounded-xl bg-[#0D1117] border border-[#30363D] text-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-[#30363D] pb-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <strong>CodeSentinel DevSecOps / PR Review</strong>
              <span className="text-slate-400">— Completed</span>
            </div>
            <span className="text-slate-400">Details</span>
          </div>

          <div className="text-xs space-y-2 font-sans">
            <p className="text-red-400 font-bold font-mono">🔴 Changes requested by CodeSentinel AI Bot</p>
            <p className="text-slate-300 leading-relaxed">
              Discovered <strong>1 hardcoded AWS credential</strong> (scrubbed in-flight) and <strong>1 unauthenticated mutating endpoint</strong> on route <code>POST /api/storage/credentials</code>.
            </p>
          </div>

          {/* Inline Suggestion Box */}
          <div className="p-3 rounded bg-[#161B22] border border-[#30363D] text-xs font-mono">
            <p className="text-slate-400 text-[11px] mb-1">Suggested change on src/controllers/adminController.ts:16</p>
            <div className="p-2 rounded bg-[#0D1117] text-emerald-400 border border-[#30363D] text-[11px]">
              <pre>+ router.post('/api/storage/credentials', requireAuth, authorizeRoles(['admin']), ...);</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
