import React from 'react';
import { X, BookOpen, ShieldCheck, Zap, Lock, Cpu, GitPullRequest, ExternalLink } from 'lucide-react';

export const AboutBuildModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const retrospectives = [
    {
      id: 1,
      title: 'GitHub 10s Webhook Timeout vs. Deep Multistage Analysis',
      icon: Zap,
      color: 'text-cyber-medium',
      summary: 'Deep AST parsing & LLM reasoning takes 15–25s, exceeding GitHub’s 10s timeout limit.',
      solution: 'Re-architected the gateway into an asynchronous processing model: returns HTTP 202 Accepted in <15ms after HMAC validation, offloading analysis to a detached worker queue with real-time Socket.IO telemetry.'
    },
    {
      id: 2,
      title: 'In-Flight Shannon Entropy Secret Interception ($H \\ge 3.2$)',
      icon: Lock,
      color: 'text-cyber-critical',
      summary: 'Sending raw code diffs with secrets to external LLMs leaks credentials to external logs.',
      solution: 'Engineered sub-millisecond regex & Shannon entropy calculation (H(X) = -sum P(x)log2 P(x)). Genuine high-entropy secrets are masked with deterministic hashes in-flight before database write or LLM context construction.'
    },
    {
      id: 3,
      title: 'Lightweight Cross-File AST Traversal Without Full Clones',
      icon: GitPullRequest,
      color: 'text-cyber-accent',
      summary: 'Cloning whole repos and compiling TypeScript takes 45–90s per pull request.',
      solution: 'Engineered a lightweight AST context engine that parses multi-file patch diffs simultaneously, constructing an in-memory symbol graph to detect breaking parameter mutations and Schema-Controller desync in <15ms.'
    },
    {
      id: 4,
      title: 'Deterministic RBAC Control-Flow Verification',
      icon: ShieldCheck,
      color: 'text-cyber-low',
      summary: 'Linters ignore semantic auth bypasses, while pure LLMs hallucinate false positives.',
      solution: 'Deterministic route parser traces Express & FastAPI middleware chains to enforce mandatory authentication on all mutating HTTP verbs (POST, PUT, DELETE) and flags mass assignment (user.role = req.body.role).'
    },
    {
      id: 5,
      title: 'Opossum Circuit Breaker & Multi-API Key Pooling',
      icon: Cpu,
      color: 'text-cyber-accentStrong',
      summary: 'Ephemeral microservice cold-starts and Gemini 429 quota limits caused pipeline failures.',
      solution: 'Integrated an Opossum Circuit Breaker with local deterministic heuristics fallback within 4000ms, paired with round-robin key pool rotation on 429 quota exceptions.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cyber-dark/80 backdrop-blur-sm">
      <div className="panel border border-cyber-border rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 border-b border-cyber-border flex items-center justify-between bg-cyber-card">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-cyber-accent/15 text-cyber-accent flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold font-mono text-cyber-text">
                About This Build — Engineering Retrospective
              </h2>
              <p className="text-xs text-cyber-muted">
                Key architectural challenges and production solutions implemented in CodeSentinel V2.0.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-cyber-cardHover text-cyber-muted hover:text-cyber-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 font-sans text-xs">
          <div className="p-3 bg-cyber-dark rounded border border-cyber-border/70 font-mono text-[11px] text-cyber-muted flex items-center justify-between">
            <span>Engineering Retrospective Document:</span>
            <span className="text-cyber-accent font-bold">PROBLEMS_FACED.md</span>
          </div>

          <div className="space-y-3">
            {retrospectives.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.id} className="p-4 rounded-lg bg-cyber-card border border-cyber-border space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${item.color}`} />
                    <h3 className="font-mono font-bold text-cyber-text text-xs">
                      {item.id}. {item.title}
                    </h3>
                  </div>

                  <div className="pl-6 space-y-1.5">
                    <p className="text-cyber-muted leading-relaxed">
                      <strong className="text-cyber-critical font-mono">The Problem:</strong> {item.summary}
                    </p>
                    <p className="text-cyber-text leading-relaxed">
                      <strong className="text-cyber-low font-mono">The Solution:</strong> {item.solution}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cyber-border bg-cyber-card flex items-center justify-between text-xs font-mono">
          <span className="text-cyber-muted">
            Authored by <strong className="text-cyber-accent">Ayusman Samantaray</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-cyber-accent hover:bg-cyber-accentStrong text-cyber-dark font-bold transition-colors"
          >
            Close Retrospective
          </button>
        </div>

      </div>
    </div>
  );
};
