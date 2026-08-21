import React from 'react';
import { GitPullRequest, Key, Network, Lock, Zap, CheckCircle, Activity } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { CyberBadge } from '../common/CyberBadge';

export const TriagePipeline = () => {
  const { activePipelineJob } = useSocket();

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
    <div className="panel rounded p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className={`w-4 h-4 ${isIdle ? 'text-cyber-muted' : 'text-cyber-accent animate-pulse'}`} />
          <h2 className="text-xs font-mono font-bold tracking-wider text-cyber-text uppercase">Real-Time PR Triage Pipeline</h2>
        </div>
        <div className="flex items-center gap-2">
          {!isIdle ? (
            <CyberBadge variant={activePipelineJob.stage === 'COMPLETED' ? 'COMPLETED' : 'ANALYZING'}>
              {activePipelineJob.repoOwner}/{activePipelineJob.repoName}#{activePipelineJob.prNumber}
            </CyberBadge>
          ) : (
            <span className="text-xs font-mono text-cyber-muted flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-low animate-pulse-slow" />
              PIPELINE IDLE (LISTENING FOR WEBHOOKS)
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar (0% at idle, fills only during active job execution) */}
      <div className="w-full bg-cyber-bg h-1.5 rounded overflow-hidden mb-5 border border-cyber-border">
        <div
          className={`h-full transition-all duration-300 rounded ${isIdle ? 'w-0 bg-transparent' : 'bg-cyber-accent'}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* 6 Core Architectural Stage Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
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
              <p className={`text-xs font-semibold font-mono ${isCurrent ? 'text-cyber-text' : isDone ? 'text-cyber-low' : 'text-cyber-muted'}`}>{st.label}</p>
              <p className="text-[10px] font-mono text-cyber-faint mt-0.5 truncate">{st.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Dynamic Status Log Line during active jobs */}
      {activePipelineJob?.message && (
        <div className="mt-4 p-2.5 rounded bg-cyber-bg border border-cyber-border flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-cyber-accent">
            <span>⟳</span>
            <span>{activePipelineJob.message}</span>
          </div>
          <span className="text-cyber-muted tabular-nums">{activePipelineJob.percent}%</span>
        </div>
      )}
    </div>
  );
};
