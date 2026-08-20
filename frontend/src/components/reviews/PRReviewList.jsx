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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 cyber-glass p-3.5 rounded-xl border border-cyber-border/40">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-cyber-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pull requests, repositories, authors, or rules..."
            className="w-full bg-cyber-dark border border-cyber-border/30 rounded-lg pl-10 pr-4 py-2 text-xs font-mono text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-accent"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-1 bg-cyber-dark p-1 rounded-lg border border-cyber-border/30 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-cyber-muted ml-2" />
            {['ALL', 'CRITICAL', 'HIGH', 'LOW'].map((rf) => (
              <button
                key={rf}
                onClick={() => setRiskFilter(rf)}
                className={`px-2.5 py-1 rounded text-xs transition ${
                  riskFilter === rf
                    ? 'bg-cyber-accent text-cyber-dark font-bold'
                    : 'text-cyber-muted hover:text-white'
                }`}
              >
                {rf}
              </button>
            ))}
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg bg-cyber-dark border border-cyber-border/30 text-cyber-muted hover:text-white hover:border-cyber-accent transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Reviews Table / Cards */}
      <div className="space-y-3">
        {filteredReviews.length === 0 ? (
          <div className="p-12 rounded-xl bg-cyber-card text-center border border-cyber-border/30 font-mono text-cyber-muted">
            <GitPullRequest className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No pull request reviews found matching current filter.</p>
          </div>
        ) : (
          filteredReviews.map((review) => {
            const risk = review.overallRisk || 'LOW';
            const blast = review.blastRadius?.overallScore || 0;
            const secrets = (review.secretsIntercepted || []).length;
            const vulns = (review.vulnerabilities || []).length;

            return (
              <div
                key={review._id || review.prId}
                onClick={() => setSelectedReview(review)}
                className="p-4 rounded-xl cyber-glass border border-cyber-border/30 hover:border-cyber-accent/50 cursor-pointer transition-all duration-200 group flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyber-dark text-cyan-400 border border-cyan-500/30">
                      {review.prId || `${review.repoOwner}/${review.repoName}#${review.prNumber}`}
                    </span>
                    <CyberBadge variant={risk}>{risk}</CyberBadge>
                    <span className="text-xs font-mono text-cyber-muted">@{review.author || 'dev'}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-cyber-accent transition-colors">
                    {review.title}
                  </h3>

                  <p className="text-xs text-cyber-muted line-clamp-1 font-sans">
                    {review.executiveSummary || 'Automated DevSecOps PR review executed.'}
                  </p>
                </div>

                {/* Metrics Pill Group */}
                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                  {/* Blast Radius Pill */}
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-dark border border-cyber-border/30">
                    <Bomb className={`w-3.5 h-3.5 ${blast > 50 ? 'text-red-400' : 'text-cyber-accent'}`} />
                    <span className="text-cyber-muted">Blast:</span>
                    <span className={`font-bold ${blast > 50 ? 'text-red-400' : 'text-white'}`}>{blast}/100</span>
                  </div>

                  {/* Secrets Count */}
                  {secrets > 0 && (
                    <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{secrets}</span>
                    </div>
                  )}

                  {/* Vulnerabilities Count */}
                  <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyber-dark border border-cyber-border/30 text-slate-300">
                    <ShieldAlert className="w-3.5 h-3.5 text-cyber-accent" />
                    <span>{vulns} findings</span>
                  </div>

                  <div className="p-2 rounded-lg bg-cyber-accent/10 text-cyber-accent group-hover:bg-cyber-accent group-hover:text-cyber-dark transition-colors">
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
