import React, { useState } from 'react';
import { Check, Copy, Zap, TestTube2 } from 'lucide-react';

export const RemediationViewer = ({ remediations = [] }) => {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!remediations || remediations.length === 0) {
    return (
      <div className="p-6 rounded panel text-center border border-cyber-border font-mono text-xs text-cyber-muted">
        No automated code remediations required for this review.
      </div>
    );
  }

  return (
    <div className="space-y-5">
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
            <div key={remId} className="diff-card state-low p-4 rounded space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-cyber-border pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30">
                    <Zap className="w-3.5 h-3.5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-cyber-text font-mono">{rem.file}</h4>
                    <p className="text-[11px] text-cyber-muted font-mono">Lines {rem.lineStart || rem.line_start} - {rem.lineEnd || rem.line_end}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(remId, patchContent)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyber-bg text-xs font-mono text-cyber-accent border border-cyber-border hover:border-cyber-accent transition-colors"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-cyber-low" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? 'COPIED SUGGESTION' : 'COPY GITHUB PATCH'}
                </button>
              </div>

              {/* Rationale & Explanation */}
              <div className="text-xs text-cyber-text font-sans leading-relaxed">
                <strong className="text-cyber-accent font-mono text-[11px]">Architectural Rationale: </strong>
                {rem.explanation}
              </div>

              {/* Committable GitHub Suggestion Block */}
              <div>
                <div className="flex items-center justify-between text-[11px] font-mono text-cyber-muted mb-1 px-1">
                  <span>Committable GitHub Markdown Patch</span>
                  <span className="text-cyber-accent">Unified Diff Suggestion</span>
                </div>
                <div className="p-3 rounded bg-cyber-bg border border-cyber-border text-xs font-mono overflow-x-auto text-cyber-low leading-relaxed select-text">
                  <pre>{patchContent}</pre>
                </div>
              </div>

              {/* Test Compliance Verification Snippet */}
              {testSnippet && (
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyber-muted mb-1 px-1">
                    <TestTube2 className="w-3.5 h-3.5 text-cyber-accent" />
                    <span>Automated Test-Compliant Verification Snippet</span>
                  </div>
                  <div className="p-3 rounded bg-cyber-bg border border-cyber-border text-xs font-mono overflow-x-auto text-cyber-text select-text">
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
