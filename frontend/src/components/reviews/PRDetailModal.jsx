import React, { useState } from 'react';
import { X, ShieldAlert, Bomb, Lock, Network, Zap, Code, CheckCircle2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 overflow-y-auto">
      <div className="panel rounded w-full max-w-5xl max-h-[90vh] flex flex-col border border-cyber-border relative overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-cyber-border flex items-start justify-between gap-4 bg-cyber-bg">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyber-card text-cyber-accent border border-cyber-border font-medium">
                {review.prId || `${review.repoOwner}/${review.repoName}#${review.prNumber}`}
              </span>
              <CyberBadge variant={review.overallRisk || 'LOW'}>{review.overallRisk || 'LOW'}</CyberBadge>
              <span className="text-xs font-mono text-cyber-muted">by @{review.author || 'dev'}</span>
            </div>
            <h2 className="text-base font-bold text-cyber-text tracking-wide font-sans">{review.title}</h2>
            <p className="text-xs text-cyber-muted font-mono">
              Branch: <code className="text-cyber-accent">{review.baseBranch || 'main'}</code> ← <code className="text-cyber-accent">{review.headBranch || 'feature'}</code> | Execution: <span className="tabular-nums">{review.executionTimeMs || 0}ms</span>
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded bg-cyber-card text-cyber-muted hover:text-cyber-text hover:bg-cyber-cardHover border border-cyber-border transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-cyber-border px-6 bg-cyber-card overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-mono font-medium border-b-2 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'border-cyber-accent text-cyber-accent bg-cyber-accent/5'
                    : 'border-transparent text-cyber-muted hover:text-cyber-text'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyber-bg text-cyber-muted border border-cyber-border tabular-nums">
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
                <div className="p-4 rounded panel border border-cyber-border flex items-center justify-between font-mono text-xs">
                  <div>
                    <h4 className="font-bold text-cyber-text">High-Signal Noise Suppression Engine</h4>
                    <p className="text-cyber-muted text-[11px] mt-0.5">
                      Evaluated {noiseStats.totalRulesEvaluated} total AST rules. Filtered {noiseStats.suppressedStylisticAlerts || 0} stylistic false positives.
                    </p>
                  </div>
                  <span className="text-base font-bold text-cyber-accent tabular-nums">
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
            <div className="space-y-3 font-mono">
              {rbac.length === 0 ? (
                <div className="p-8 rounded panel text-center border border-cyber-border">
                  <CheckCircle2 className="w-8 h-8 text-cyber-low mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-cyber-text">All Route Authorization & RBAC Checks Passed</h4>
                  <p className="text-xs text-cyber-muted mt-1">Zero unauthenticated mutation endpoints or role escalation risks found.</p>
                </div>
              ) : (
                rbac.map((r, idx) => (
                  <div key={idx} className="diff-card state-critical p-4 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CyberBadge variant={r.severity || 'CRITICAL'}>{r.issueType || r.issue_type}</CyberBadge>
                        <span className="text-cyber-text font-bold text-xs">{r.method} {r.route}</span>
                      </div>
                      <span className="text-cyber-muted text-xs">{r.file}:{r.line}</span>
                    </div>
                    <p className="text-xs text-cyber-text font-sans">{r.description}</p>
                    <div className="p-2 rounded bg-cyber-bg text-[11px] text-cyber-low border border-cyber-border">
                      <strong>Remediation Advice: </strong>{r.remediationAdvice || r.remediation_advice}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'ast' && (
            <div className="space-y-3 font-mono">
              {crossFile.length === 0 ? (
                <div className="p-8 rounded panel text-center border border-cyber-border">
                  <CheckCircle2 className="w-8 h-8 text-cyber-low mx-auto mb-2" />
                  <h4 className="text-sm font-bold text-cyber-text">Cross-File AST Contracts In Sync</h4>
                  <p className="text-xs text-cyber-muted mt-1">All modified function signatures, exported types, and models match downstream callers.</p>
                </div>
              ) : (
                crossFile.map((cf, idx) => (
                  <div key={idx} className="diff-card state-high p-4 rounded space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CyberBadge variant="HIGH">{cf.impactType || cf.impact_type}</CyberBadge>
                        <span className="text-cyber-text font-bold text-xs">Symbol: {cf.symbol}</span>
                      </div>
                    </div>
                    <p className="text-xs text-cyber-text font-sans">{cf.description}</p>
                    <div className="p-2 rounded bg-cyber-bg text-[11px] text-cyber-accent border border-cyber-border flex items-center justify-between">
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
            <div className="p-4 rounded bg-cyber-bg border border-cyber-border text-xs font-mono text-cyber-accent overflow-x-auto">
              <pre>{JSON.stringify(review, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-cyber-border bg-cyber-bg flex items-center justify-between text-xs font-mono text-cyber-muted">
          <span>AI Engine: {review.aiEngineUsed || 'CodeSentinel Engine'}</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded bg-cyber-card text-cyber-text hover:bg-cyber-cardHover border border-cyber-border transition-colors"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
};
