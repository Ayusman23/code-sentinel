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

  const currentStage = activePipelineJob?.stage || 'IDLE';
  const percent = activePipelineJob?.percent || 0;

  return (
    <div className="panel rounded p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyber-accent" />
          <h2 className="text-xs font-mono font-bold tracking-wider text-cyber-text uppercase">Real-Time PR Triage Pipeline</h2>
        </div>
        <div className="flex items-center gap-2">
          {activePipelineJob ? (
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

      {/* Progress Bar */}
      <div className="w-full bg-cyber-bg h-1.5 rounded overflow-hidden mb-5 border border-cyber-border">
        <div
          className="h-full bg-cyber-accent transition-all duration-300 rounded"
          style={{ width: `${activePipelineJob ? percent : 100}%` }}
        />
      </div>

      {/* 6 Core Architectural Stage Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {stages.map((st, idx) => {
          const Icon = st.icon;
          const isCurrent = currentStage === st.id;
          const isDone = activePipelineJob && percent >= (idx + 1) * 16;

          return (
            <div
              key={st.id}
              className={`p-3 rounded border transition-colors duration-150 relative ${
                isCurrent
                  ? 'bg-cyber-card border-cyber-accent text-cyber-accent'
                  : isDone
                  ? 'bg-cyber-card border-cyber-low/40 text-cyber-low'
                  : 'bg-cyber-bg border-cyber-border text-cyber-muted'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-cyber-accent' : isDone ? 'text-cyber-low' : 'text-cyber-muted'}`} />
                <span className="text-[10px] font-mono opacity-60">0{idx + 1}</span>
              </div>
              <p className={`text-xs font-semibold font-mono ${isCurrent ? 'text-cyber-text' : isDone ? 'text-cyber-low' : 'text-cyber-muted'}`}>{st.label}</p>
              <p className="text-[10px] font-mono text-cyber-muted mt-0.5 truncate">{st.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Dynamic Status Log Line */}
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
