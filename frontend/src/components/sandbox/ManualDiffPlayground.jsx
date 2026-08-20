import React, { useState } from 'react';
import { Play, Code, ShieldAlert, Sparkles, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { analyzeManualDiff } from '../../services/api';
import { CyberBadge } from '../common/CyberBadge';
import { BlastRadiusVisualizer } from '../reviews/BlastRadiusVisualizer';
import { VulnerabilityMatrix } from '../reviews/VulnerabilityMatrix';
import { RemediationViewer } from '../reviews/RemediationViewer';

const PRESETS = [
  {
    id: 'auth_and_secrets',
    name: '🚨 Auth Bypass & Secret Leak',
    filename: 'src/routes/paymentRoutes.ts',
    diff: `+ router.post('/api/payments/charge', async (req, res) => {
+   const apiKey = "sk_test_mock_sandbox_token_demo_99a88b77c";
+   const amount = req.body.amount;
+   await paymentBridge.charge(amount, apiKey);
+   res.send({ status: "success" });
+ });`
  },
  {
    id: 'privilege_escalation',
    name: '⚠️ Privilege Escalation in Body',
    filename: 'src/controllers/userController.ts',
    diff: `+ export async function updateProfile(req, res) {
+   const user = await User.findById(req.user.id);
+   user.role = req.body.role;
+   user.isAdmin = req.body.isAdmin;
+   await user.save();
+   res.json({ success: true, user });
+ }`
  },
  {
    id: 'cross_file_desync',
    name: '💥 Cross-File Signature Desync',
    filename: 'src/services/authService.ts',
    diff: `- export function generateSession(userId) {
+ export function generateSession(userId, tenantId, ipAddress, mfaVerified) {
+   // Added mandatory multi-tenant & MFA arguments
+ }`
  },
  {
    id: 'clean_feature',
    name: '🟢 Secure & Compliant Feature',
    filename: 'src/services/analytics.ts',
    diff: `+ export function trackEvent(name: string, payload: Record<string, any>) {
+   const sanitized = sanitizeTelemetry(payload);
+   telemetryEmitter.emit(name, sanitized);
+ }`
  }
];

export const ManualDiffPlayground = () => {
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [filename, setFilename] = useState(PRESETS[0].filename);
  const [diffText, setDiffText] = useState(PRESETS[0].diff);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset);
    setFilename(preset.filename);
    setDiffText(preset.diff);
    setScanResult(null);
  };

  const handleRunScan = async () => {
    setLoading(true);
    try {
      const payload = {
        title: `Manual Diff Audit: ${filename}`,
        author: 'secops-lead',
        files: [
          {
            filename,
            status: 'modified',
            patch: diffText,
            additions: diffText.split('\n').filter(l => l.startsWith('+')).length,
            deletions: diffText.split('\n').filter(l => l.startsWith('-')).length
          }
        ],
        context: {
          repo_name: 'enterprise/sandbox',
          branch: 'main',
          frameworks: ['Express', 'Node.js'],
          test_framework: 'jest'
        }
      };

      const result = await analyzeManualDiff(payload);
      setScanResult(result);
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Preset Selector Banner */}
      <div className="cyber-glass p-4 rounded-xl border border-cyber-border/40 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyber-accent" />
            AI DevSecOps Manual Diff Playground
          </h3>
          <p className="text-xs text-cyber-muted font-mono mt-0.5">
            Test arbitrary code diffs against the 7 core architectural engines with instant feedback.
          </p>
        </div>

        {/* Preset Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelectPreset(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition border ${
                selectedPreset.id === p.id
                  ? 'bg-cyber-accent/20 border-cyber-accent text-cyber-accent font-bold'
                  : 'bg-cyber-dark text-cyber-muted hover:text-white border-cyber-border/30'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Editor & Scan Trigger */}
      <div className="cyber-glass rounded-xl p-5 border border-cyber-border/40 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-cyber-muted uppercase">Target File Path:</span>
          <input
            type="text"
            value={filename}
            onChange={(e) => setFilename(e.target.value)}
            className="flex-1 bg-cyber-dark border border-cyber-border/30 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyber-accent"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-xs font-mono text-cyber-muted mb-1.5">
            <span>Git Unified Patch Diff:</span>
            <span>Lines: {diffText.split('\n').length}</span>
          </div>
          <textarea
            value={diffText}
            onChange={(e) => setDiffText(e.target.value)}
            rows={8}
            className="w-full bg-cyber-dark border border-cyber-border/40 rounded-xl p-4 text-xs font-mono text-emerald-400 focus:outline-none focus:border-cyber-accent leading-relaxed resize-y selection:bg-cyber-accent selection:text-cyber-bg"
            placeholder="Paste your Git unified diff patch here (+ added lines, - removed lines)..."
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-[11px] font-mono text-cyber-muted">
            Engine Pipeline: In-Flight Secret Scrubber ➔ AST Engine ➔ Deterministic RBAC ➔ Blast Radius ➔ Gemini LLM
          </span>

          <button
            onClick={handleRunScan}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-cyber-accent text-cyber-dark font-mono font-bold text-xs hover:bg-emerald-300 transition shadow-[0_0_20px_rgba(34,230,184,0.4)] disabled:opacity-50"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            {loading ? 'ANALYZING DIFF...' : 'EXECUTE DEVSECOPS SCAN'}
          </button>
        </div>
      </div>

      {/* Results View */}
      {scanResult && (
        <div className="cyber-glass rounded-xl p-6 border border-cyber-border/40 space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-cyber-border/40 pb-4">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-base font-bold text-white font-mono">Scan Results for {filename}</h3>
                <CyberBadge variant={scanResult.overall_risk || 'LOW'}>{scanResult.overall_risk || 'LOW'}</CyberBadge>
              </div>
              <p className="text-xs text-cyber-muted font-mono mt-1">{scanResult.executive_summary}</p>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-cyber-accent">Engine: {scanResult.ai_engine_used}</span>
              <span className="text-cyber-muted">Latency: {scanResult.execution_time_ms || scanResult.gatewayElapsedMs}ms</span>
            </div>
          </div>

          {/* Blast Radius Visualizer */}
          {scanResult.blast_radius && (
            <BlastRadiusVisualizer blastRadius={scanResult.blast_radius} />
          )}

          {/* Vulnerabilities & Secrets */}
          <div className="border-t border-cyber-border/30 pt-6">
            <h4 className="text-xs font-mono font-bold uppercase text-white mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyber-accent" />
              Identified Security Defects & Secrets ({scanResult.vulnerabilities?.length || 0})
            </h4>
            <VulnerabilityMatrix
              vulnerabilities={scanResult.vulnerabilities || []}
              secretsIntercepted={scanResult.secrets_intercepted || []}
            />
          </div>

          {/* Automated Remediations */}
          {scanResult.remediations?.length > 0 && (
            <div className="border-t border-cyber-border/30 pt-6">
              <h4 className="text-xs font-mono font-bold uppercase text-white mb-3">
                Generated Committable GitHub Suggestions ({scanResult.remediations.length})
              </h4>
              <RemediationViewer remediations={scanResult.remediations} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
