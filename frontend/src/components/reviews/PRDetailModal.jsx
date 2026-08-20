import React, { useState } from 'react';
import { X, ShieldAlert, GitPullRequest, Bomb, Lock, Network, Zap, Code, FileText, CheckCircle2 } from 'lucide-react';
import { CyberBadge } from '../common/CyberBadge';
import { BlastRadiusVisualizer } from './BlastRadiusVisualizer';
import { VulnerabilityMatrix } from './VulnerabilityMatrix';
import { RemediationViewer } from './RemediationViewer';

export const PRDetailModal = ({ review, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!review) return null;

  const blastRadius = review.blastRadius || review.blast_radius;
  const vulns = review.vulnerabilities || [];
  const secrets = review.secretsIntercepted || review.secrets_intercepted || [];
  const rbac = review.rbacIssues || review.rbac_issues || [];
  const crossFile = review.crossFileImpacts || review.cross_file_impacts || [];
  const remediations = review.remediations || [];
  const noiseStats = review.noiseSuppressionStats || review.noise_suppression_stats || {};

  const tabs = [
    { id: 'overview', label: 'Blast Radius & Metrics', icon: Bomb, count: blastRadius?.overallScore },
    { id: 'vulns', label: 'Vulnerabilities & Secrets', icon: ShieldAlert, count: vulns.length + secrets.length },
    { id: 'rbac', label: 'RBAC & Auth Logic', icon: Lock, count: rbac.length },
    { id: 'ast', label: 'Cross-File AST Desync', icon: Network, count: crossFile.length },
    { id: 'remediations', label: 'Test-Compliant Patches', icon: Zap, count: remediations.length },
    { id: 'raw', label: 'Raw Telemetry', icon: Code }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="cyber-glass rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-cyber-border shadow-2xl relative overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 border-b border-cyber-border/40 flex items-start justify-between gap-4 bg-cyber-dark/80">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30 font-bold">
                {review.prId || `${review.repoOwner}/${review.repoName}#${review.prNumber}`}
              </span>
              <CyberBadge variant={review.overallRisk || 'LOW'}>{review.overallRisk || 'LOW'}</CyberBadge>
              <span className="text-xs font-mono text-cyber-muted">by @{review.author || 'dev'}</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-wide">{review.title}</h2>
            <p className="text-xs text-cyber-muted font-mono">
              Branch: <code className="text-slate-300">{review.baseBranch || 'main'}</code> ← <code className="text-slate-300">{review.headBranch || 'feature'}</code> | Execution: {review.executionTimeMs || 0}ms
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-cyber-card text-cyber-muted hover:text-white hover:bg-cyber-dark border border-cyber-border/30 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-cyber-border/40 px-6 bg-cyber-card/60 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3.5 px-4 text-xs font-mono font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-cyber-accent text-cyber-accent bg-cyber-accent/5'
                    : 'border-transparent text-cyber-muted hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-cyber-dark text-slate-300 border border-cyber-border/40">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body Viewport */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <BlastRadiusVisualizer blastRadius={blastRadius} />

              {/* Noise Suppression Metrics */}
              {noiseStats.totalRulesEvaluated > 0 && (
                <div className="p-4 rounded-xl bg-cyber-dark border border-purple-500/30 flex items-center justify-between font-mono text-xs">
                  <div>
                    <h4 className="font-bold text-purple-300">High-Signal Noise Suppression Engine</h4>
                    <p className="text-cyber-muted text-[11px] mt-0.5">
                      Evaluated {noiseStats.totalRulesEvaluated} total AST rules. Filtered {noiseStats.suppressedStylisticAlerts || 0} stylistic false positives.
                    </p>
                  </div>
                  <span className="text-lg font-extrabold text-purple-400">
                    {noiseStats.signalRatioPercentage || 94}% Signal
                  </span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vulns' && (
            <VulnerabilityMatrix
              vulnerabilities={vulns}
              secretsIntercepted={secrets}
            />
          )}

          {activeTab === 'rbac' && (
            <div className="space-y-4 font-mono">
              {rbac.length === 0 ? (
                <div className="p-8 rounded-xl bg-cyber-card text-center border border-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-white">All Route Authorization & RBAC Checks Passed</h4>
                  <p className="text-xs text-cyber-muted mt-1">Zero unauthenticated mutation endpoints or role escalation risks found.</p>
                </div>
              ) : (
                rbac.map((r, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-cyber-card border border-red-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CyberBadge variant={r.severity || 'CRITICAL'}>{r.issueType || r.issue_type}</CyberBadge>
                        <span className="text-white font-bold text-xs">{r.method} {r.route}</span>
                      </div>
                      <span className="text-cyber-muted text-xs">{r.file}:{r.line}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans">{r.description}</p>
                    <div className="p-2 rounded bg-cyber-dark text-[11px] text-emerald-400 border border-cyber-border/30">
                      <strong>Remediation Advice: </strong>{r.remediationAdvice || r.remediation_advice}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'ast' && (
            <div className="space-y-4 font-mono">
              {crossFile.length === 0 ? (
                <div className="p-8 rounded-xl bg-cyber-card text-center border border-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-white">Cross-File AST Contracts In Sync</h4>
                  <p className="text-xs text-cyber-muted mt-1">All modified function signatures, exported types, and models match downstream callers.</p>
                </div>
              ) : (
                crossFile.map((cf, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-cyber-card border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CyberBadge variant="HIGH">{cf.impactType || cf.impact_type}</CyberBadge>
                        <span className="text-white font-bold text-xs">Symbol: {cf.symbol}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 font-sans">{cf.description}</p>
                    <div className="p-2 rounded bg-cyber-dark text-[11px] text-cyan-300 border border-cyber-border/30 flex items-center justify-between">
                      <span>Source: <strong>{cf.sourceFile || cf.source_file}</strong></span>
                      <span>Target Caller: <strong>{cf.targetFile || cf.target_file}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'remediations' && (
            <RemediationViewer remediations={remediations} />
          )}

          {activeTab === 'raw' && (
            <div className="p-4 rounded-xl bg-cyber-dark border border-cyber-border/40 text-xs font-mono text-cyan-300 overflow-x-auto">
              <pre>{JSON.stringify(review, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-cyber-border/40 bg-cyber-dark/80 flex items-center justify-between text-xs font-mono text-cyber-muted">
          <span>AI Engine: {review.aiEngineUsed || 'CodeSentinel Engine'}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyber-card text-white hover:bg-cyber-cardHover border border-cyber-border/40 transition"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
};
