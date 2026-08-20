import React, { useState } from 'react';
import { Check, Copy, Zap, TestTube2, FileCode } from 'lucide-react';

export const RemediationViewer = ({ remediations = [] }) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!remediations || remediations.length === 0) {
    return (
      <div className="p-6 rounded-xl bg-cyber-card text-center border border-cyber-border/30 font-mono text-xs text-cyber-muted">
        No automated code remediations required for this review.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-cyber-muted">
          All remediations are generated in standard GitHub Markdown suggestion format for 1-click commit inline on pull requests.
        </p>
      </div>

      <div className="space-y-4">
        {remediations.map((rem, idx) => {
          const remId = rem.id || `rem-${idx}`;
          const isCopied = copiedId === remId;
          const patchContent = rem.githubMarkdownSuggestion || rem.github_markdown_suggestion || `\`\`\`suggestion\n${rem.suggestedCode || rem.suggested_code}\n\`\`\``;
          const testSnippet = rem.testVerificationSnippet || rem.test_verification_snippet;

          return (
            <div key={remId} className="p-5 rounded-xl bg-cyber-card border border-cyber-border/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyber-border/30 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30">
                    <Zap className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">{rem.file}</h4>
                    <p className="text-[11px] text-cyber-muted font-mono">Lines {rem.lineStart || rem.line_start} - {rem.lineEnd || rem.line_end}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(remId, patchContent)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-dark text-xs font-mono text-cyber-accent border border-cyber-border/40 hover:border-cyber-accent transition"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? 'COPIED SUGGESTION' : 'COPY GITHUB PATCH'}
                </button>
              </div>

              {/* Rationale & Explanation */}
              <div className="text-xs text-slate-300 font-sans leading-relaxed">
                <strong className="text-cyber-accent font-mono">Architectural Rationale: </strong>
                {rem.explanation}
              </div>

              {/* Committable GitHub Suggestion Block */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-cyber-muted mb-1 px-1">
                  <span>Committable GitHub Markdown Patch</span>
                  <span className="text-cyber-accent">Unified Diff Suggestion</span>
                </div>
                <div className="p-3.5 rounded-lg bg-cyber-dark border border-cyber-border/30 text-xs font-mono overflow-x-auto text-emerald-400 leading-relaxed select-text">
                  <pre>{patchContent}</pre>
                </div>
              </div>

              {/* Test Compliance Verification Snippet */}
              {testSnippet && (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyber-muted mb-1 px-1">
                    <TestTube2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Automated Test-Compliant Verification Snippet</span>
                  </div>
                  <div className="p-3.5 rounded-lg bg-cyber-dark/80 border border-purple-500/20 text-xs font-mono overflow-x-auto text-purple-300 select-text">
                    <pre>{testSnippet}</pre>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
