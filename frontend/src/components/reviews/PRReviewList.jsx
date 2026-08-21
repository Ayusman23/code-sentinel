import React, { useState } from 'react';
import { Search, Filter, GitPullRequest, Bomb, ShieldAlert, ArrowUpRight, RefreshCw, KeyRound } from 'lucide-react';
import { CyberBadge } from '../common/CyberBadge';
import { PRDetailModal } from './PRDetailModal';

export const PRReviewList = ({ reviews = [], loading = false, onRefresh }) => {
  const [selectedReview, setSelectedReview] = useState(null);
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');

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

      {/* Reviews Table / Cards */}
      <div className="space-y-2.5">
        {filteredReviews.length === 0 ? (
          <div className="p-12 rounded panel text-center border border-cyber-border font-mono text-cyber-muted">
            <GitPullRequest className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-xs">No pull request reviews found matching current filter.</p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const risk = review.overallRisk || 'LOW';
            const blast = review.blastRadius?.overallScore || 0;
            const secrets = (review.secretsIntercepted || []).length;
            const vulns = (review.vulnerabilities || []).length;

            const stateClass = `state-${risk.toLowerCase()}`;

            return (
              <div
                key={review._id || review.prId}
                onClick={() => setSelectedReview(review)}
                className={`diff-card ${stateClass} p-4 rounded cursor-pointer transition-colors duration-150 group flex flex-col md:flex-row md:items-center justify-between gap-4`}
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

                {/* Metrics Pill Group */}
                <div className="flex items-center gap-3 text-xs font-mono shrink-0">
                  {/* Blast Radius Pill */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyber-bg border border-cyber-border">
                    <Bomb className={`w-3.5 h-3.5 ${blast > 50 ? 'text-cyber-critical' : 'text-cyber-accent'}`} />
                    <span className="text-cyber-muted">Blast:</span>
                    <span className={`font-bold tabular-nums ${blast > 50 ? 'text-cyber-critical' : 'text-cyber-text'}`}>{blast}/100</span>
                  </div>

                  {/* Secrets Count */}
                  {secrets > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded bg-cyber-high/10 border border-cyber-high/30 text-cyber-high">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span className="tabular-nums">{secrets}</span>
                    </div>
                  )}

                  {/* Vulnerabilities Count */}
                  <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyber-bg border border-cyber-border text-cyber-muted">
                    <ShieldAlert className="w-3.5 h-3.5 text-cyber-accent" />
                    <span className="tabular-nums">{vulns} findings</span>
                  </div>

                  <div className="p-1.5 rounded bg-cyber-bg border border-cyber-border text-cyber-muted group-hover:text-cyber-accent group-hover:border-cyber-accent transition-colors">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
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
