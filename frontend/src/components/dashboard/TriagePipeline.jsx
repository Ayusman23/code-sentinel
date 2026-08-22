import React, { useState } from 'react';
import { GitPullRequest, Key, Network, Lock, Zap, CheckCircle, Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { CyberBadge } from '../common/CyberBadge';

export const TriagePipeline = () => {
  const { activePipelineJob } = useSocket();
  const [isExpanded, setIsExpanded] = useState(false);

  const stages = [
    { id: 'QUEUED', label: '1. Ingestion', icon: GitPullRequest, desc: 'HMAC SHA-256 Verified' },
    { id: 'INGESTING_DIFFS', label: '2. Diff Fetch', icon: Network, desc: 'Unified AST Parsing' },
    { id: 'SECRET_INTERCEPTION', label: '3. Secret Scrub', icon: Key, desc: '<1ms Shannon Filter' },
    { id: 'AST_AND_RBAC_REASONING', label: '4. AST & RBAC', icon: Lock, desc: 'Control Flow Graph' },
    { id: 'POSTING_GITHUB_REVIEW', label: '5. Remediation', icon: Zap, desc: 'Test-Compliant Patch' },
    { id: 'COMPLETED', label: '6. Published', icon: CheckCircle, desc: 'GitHub Check Passed' }
  ];

  const isIdle = !activePipelineJob || activePipelineJob.stage === 'IDLE';
  const currentStage = activePipelineJob?.stage || 'IDLE';
  const percent = isIdle ? 0 : (activePipelineJob?.percent || 0);

  return (
    <div className="panel rounded p-4 sm:p-5 transition-all">
      
      {/* Header with Compact Summary & Expand Toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${isIdle ? 'text-cyber-muted' : 'text-cyber-accent animate-pulse'}`} />
          <h2 className="text-xs font-mono font-bold tracking-wider text-cyber-text uppercase">
            Real-Time PR Triage Pipeline
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {!isIdle ? (
            <CyberBadge variant={activePipelineJob.stage === 'COMPLETED' ? 'COMPLETED' : 'ANALYZING'}>
              {activePipelineJob.repoOwner}/{activePipelineJob.repoName}#{activePipelineJob.prNumber}
            </CyberBadge>
          ) : (
            <span className="text-[11px] font-mono text-cyber-muted hidden sm:flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-low animate-pulse-slow" />
              PIPELINE IDLE
            </span>
          )}

          {/* Toggle Expand / Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2 py-1 rounded bg-cyber-bg hover:bg-cyber-cardHover border border-cyber-border text-[11px] font-mono text-cyber-muted hover:text-cyber-text transition-colors"
          >
            <span>{isExpanded ? 'Collapse' : 'Expand 6 Stages'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Single Compact Progress Strip */}
      <div className="w-full bg-cyber-bg h-1.5 rounded overflow-hidden mt-3 border border-cyber-border">
        <div
          className={`h-full transition-all duration-300 rounded ${isIdle ? 'w-0 bg-transparent' : 'bg-cyber-accent'}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Dynamic Status Message Strip when running or collapsed */}
      {activePipelineJob?.message && (
        <div className="mt-2.5 p-2 rounded bg-cyber-bg border border-cyber-border flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-cyber-accent truncate mr-2">
            <span className="animate-spin">⟳</span>
            <span className="truncate">{activePipelineJob.message}</span>
          </div>
          <span className="text-cyber-muted tabular-nums font-bold">{activePipelineJob.percent}%</span>
        </div>
      )}

      {/* Expandable 6 Core Architectural Stage Cards */}
      {isExpanded && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 pt-4 border-t border-cyber-border/60 animate-in fade-in duration-200">
          {stages.map((st, idx) => {
            const Icon = st.icon;
            const isCurrent = !isIdle && currentStage === st.id;
            const isDone = !isIdle && percent >= (idx + 1) * 16;

            return (
              <div
                key={st.id}
                className={`p-3 rounded border transition-colors duration-150 relative ${
                  isCurrent
                    ? 'bg-cyber-card border-cyber-accent text-cyber-accent shadow-[0_0_10px_rgba(91,141,239,0.15)]'
                    : isDone
                    ? 'bg-cyber-card border-cyber-low/40 text-cyber-low'
                    : 'bg-cyber-bg border-cyber-border text-cyber-muted opacity-85'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-cyber-accent' : isDone ? 'text-cyber-low' : 'text-cyber-faint'}`} />
                  <span className="text-[10px] font-mono opacity-50">0{idx + 1}</span>
                </div>
                <p className={`text-xs font-semibold font-mono ${isCurrent ? 'text-cyber-text' : isDone ? 'text-cyber-low' : 'text-cyber-muted'}`}>
                  {st.label}
                </p>
                <p className="text-[10px] font-mono text-cyber-faint mt-0.5 truncate">
                  {st.desc}
                </p>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
