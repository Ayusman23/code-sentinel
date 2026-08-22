import React, { useState } from 'react';
import { Search, Filter, GitPullRequest, Bomb, ShieldAlert, ArrowUpRight, RefreshCw, KeyRound, ChevronDown, ChevronUp, CheckCircle, Lock } from 'lucide-react';
import { CyberBadge } from '../common/CyberBadge';
import { PRDetailModal } from './PRDetailModal';

export const PRReviewList = ({ reviews = [], loading = false, onRefresh }) => {
  const [selectedReview, setSelectedReview] = useState(null);
  const [expandedPrIds, setExpandedPrIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const toggleInlineExpand = (prId, e) => {
    e.stopPropagation();
    setExpandedPrIds(prev => {
      const next = new Set(prev);
      if (next.has(prId)) {
        next.delete(prId);
      } else {
        next.add(prId);
      }
      return next;
    });
  };

  const filteredReviews = reviews.filter((r) => {
    const matchesSearch =
      r.title?.toLowerCase().includes(search.toLowerCase()) ||
      r.repoName?.toLowerCase().includes(search.toLowerCase()) ||
      r.author?.toLowerCase().includes(search.toLowerCase()) ||
      r.prId?.toLowerCase().includes(search.toLowerCase());

    const matchesRisk = riskFilter === 'ALL' || r.overallRisk === riskFilter;

    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 panel p-3 rounded border border-cyber-border">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-cyber-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pull requests, repositories, authors, or rules..."
            className="w-full bg-cyber-bg border border-cyber-border rounded pl-9 pr-4 py-1.5 text-xs font-mono text-cyber-text placeholder-cyber-muted focus:outline-none focus:border-cyber-accent"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-cyber-bg p-1 rounded border border-cyber-border text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-cyber-muted ml-1.5" />
            {['ALL', 'CRITICAL', 'HIGH', 'LOW'].map((rf) => (
              <button
                key={rf}
                onClick={() => setRiskFilter(rf)}
                className={`px-2.5 py-0.5 rounded text-xs font-mono transition-colors ${
                  riskFilter === rf
                    ? 'bg-cyber-card text-cyber-accent border border-cyber-border font-medium'
                    : 'text-cyber-muted hover:text-cyber-text'
                }`}
              >
                {rf}
              </button>
            ))}
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              aria-label="Refresh reviews"
              className="p-1.5 rounded bg-cyber-bg border border-cyber-border text-cyber-muted hover:text-cyber-text hover:border-cyber-borderHover transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Reviews Table / Cards with Progressive Disclosure */}
      <div className="space-y-2.5">
        {filteredReviews.length === 0 ? (
          <div className="p-12 rounded panel text-center border border-cyber-border font-mono text-cyber-muted">
            <GitPullRequest className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No pull request reviews found matching current filter.</p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const prKey = review._id || review.prId;
            const isExpanded = expandedPrIds.has(prKey);
            const risk = review.overallRisk || 'LOW';
            const blast = review.blastRadius?.overallScore || 0;
            const secrets = (review.secretsIntercepted || []).length;
            const vulns = (review.vulnerabilities || []).length;
            const stateClass = `state-${risk.toLowerCase()}`;

            return (
              <div
                key={prKey}
                className={`diff-card ${stateClass} p-4 rounded transition-all duration-150 flex flex-col gap-3`}
              >
                {/* Main Summary Header Row */}
                <div
                  onClick={() => setSelectedReview(review)}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-medium px-2 py-0.2 rounded bg-cyber-bg text-cyber-accent border border-cyber-border">
                        {review.prId || `${review.repoOwner}/${review.repoName}#${review.prNumber}`}
                      </span>
                      <CyberBadge variant={risk}>{risk}</CyberBadge>
                      <span className="text-xs font-mono text-cyber-muted">@{review.author || 'dev'}</span>
                    </div>

                    <h3 className="text-sm font-semibold text-cyber-text group-hover:text-cyber-accent transition-colors font-sans">
                      {review.title}
                    </h3>

                    <p className="text-xs text-cyber-muted line-clamp-1 font-sans">
                      {review.executiveSummary || 'Automated DevSecOps PR review executed.'}
                    </p>
                  </div>

                  {/* Metrics Pill Group & Action Buttons */}
                  <div className="flex items-center gap-2 text-xs font-mono shrink-0">
                    
                    {/* Blast Radius Pill */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyber-bg border border-cyber-border">
                      <Bomb className={`w-3.5 h-3.5 ${blast > 50 ? 'text-cyber-critical' : 'text-cyber-accent'}`} />
                      <span className="text-cyber-muted">Blast:</span>
                      <span className={`font-bold tabular-nums ${blast > 50 ? 'text-cyber-critical' : 'text-cyber-text'}`}>{blast}/100</span>
                    </div>

                    {/* Secrets Count */}
                    {secrets > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded bg-cyber-critical/10 border border-cyber-critical/30 text-cyber-critical">
                        <KeyRound className="w-3.5 h-3.5" />
                        <span className="tabular-nums font-bold">{secrets}</span>
                      </div>
                    )}

                    {/* Vulnerabilities Count */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyber-bg border border-cyber-border text-cyber-muted">
                      <ShieldAlert className="w-3.5 h-3.5 text-cyber-accent" />
                      <span className="tabular-nums">{vulns} findings</span>
                    </div>

                    {/* Quick Inline Expander Toggle */}
                    <button
                      onClick={(e) => toggleInlineExpand(prKey, e)}
                      title={isExpanded ? 'Collapse preview' : 'Expand quick summary'}
                      className="p-1.5 rounded bg-cyber-bg border border-cyber-border hover:border-cyber-borderHover text-cyber-muted hover:text-cyber-text transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {/* Open Full Inspection Modal */}
                    <div
                      title="Open full inspection report"
                      className="p-1.5 rounded bg-cyber-bg border border-cyber-border text-cyber-muted group-hover:text-cyber-accent group-hover:border-cyber-accent transition-colors"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Progressive Disclosure Inline Drawer */}
                {isExpanded && (
                  <div className="pt-3 mt-1 border-t border-cyber-border/60 space-y-3 font-mono text-xs animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2.5 rounded bg-cyber-bg border border-cyber-border">
                        <span className="text-cyber-muted block mb-1">Dependency Depth:</span>
                        <span className="font-bold text-cyber-text">{review.blastRadius?.breakdown?.dependencyDepthScore || 0}%</span>
                      </div>
                      <div className="p-2.5 rounded bg-cyber-bg border border-cyber-border">
                        <span className="text-cyber-muted block mb-1">API Surface Risk:</span>
                        <span className="font-bold text-cyber-text">{review.blastRadius?.breakdown?.apiSurfaceScore || 0}%</span>
                      </div>
                      <div className="p-2.5 rounded bg-cyber-bg border border-cyber-border">
                        <span className="text-cyber-muted block mb-1">RBAC Exposure:</span>
                        <span className="font-bold text-cyber-text">{review.blastRadius?.breakdown?.rbacExposureScore || 0}%</span>
                      </div>
                    </div>

                    {/* Findings Preview List */}
                    {review.vulnerabilities && review.vulnerabilities.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[10px] text-cyber-muted uppercase tracking-wider">Detected Findings:</span>
                        <div className="space-y-1">
                          {review.vulnerabilities.slice(0, 2).map((v, i) => (
                            <div key={i} className="p-2 rounded bg-cyber-bg border border-cyber-border flex items-center justify-between">
                              <span className="text-cyber-text text-[11px] truncate mr-2">{v.title}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyber-critical/10 text-cyber-critical border border-cyber-critical/20 font-bold shrink-0">
                                {v.cweId || 'CWE-306'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => setSelectedReview(review)}
                        className="text-[11px] text-cyber-accent hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>View Full 5-Axis AST / RBAC Failure Report</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Detailed PR Inspection Modal */}
      {selectedReview && (
        <PRDetailModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
        />
      )}
    </div>
  );
};
