import React from 'react';
import { ShieldAlert, GitPullRequest, Key, Network, Lock, Zap, CheckCircle, Activity, ArrowRight } from 'lucide-react';
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
    <div className="cyber-glass rounded-xl p-5 border border-cyber-border/40 relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-cyber-accent animate-pulse" />
          <h2 className="text-sm font-bold font-mono tracking-wider text-white uppercase">Real-Time PR Triage Pipeline</h2>
        </div>
        <div className="flex items-center gap-2">
          {activePipelineJob ? (
            <CyberBadge variant={activePipelineJob.stage === 'COMPLETED' ? 'COMPLETED' : 'ANALYZING'}>
              {activePipelineJob.repoOwner}/{activePipelineJob.repoName}#{activePipelineJob.prNumber}
            </CyberBadge>
          ) : (
            <span className="text-xs font-mono text-cyber-muted flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              PIPELINE IDLE (LISTENING FOR WEBHOOKS)
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-cyber-dark h-2 rounded-full overflow-hidden mb-6 border border-cyber-border/20">
        <div
          className="h-full bg-gradient-to-r from-cyber-accent via-emerald-400 to-cyan-400 transition-all duration-500 rounded-full shadow-[0_0_12px_rgba(34,230,184,0.6)]"
          style={{ width: `${activePipelineJob ? percent : 100}%` }}
        />
      </div>

      {/* 6 Core Architectural Stage Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stages.map((st, idx) => {
          const Icon = st.icon;
          const isCurrent = currentStage === st.id;
          const isDone = activePipelineJob && percent >= (idx + 1) * 16;

          return (
            <div
              key={st.id}
              className={`p-3 rounded-lg border transition-all duration-300 relative ${
                isCurrent
                  ? 'bg-cyber-accent/15 border-cyber-accent shadow-[0_0_15px_rgba(34,230,184,0.3)] scale-[1.02]'
                  : isDone
                  ? 'bg-cyber-card/90 border-emerald-500/30 text-emerald-400'
                  : 'bg-cyber-card/40 border-cyber-border/20 text-cyber-muted'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`w-4 h-4 ${isCurrent ? 'text-cyber-accent animate-bounce' : isDone ? 'text-emerald-400' : 'text-cyber-muted'}`} />
                <span className="text-[10px] font-mono font-bold opacity-60">0{idx + 1}</span>
              </div>
              <p className={`text-xs font-semibold font-mono ${isCurrent ? 'text-white' : 'text-slate-300'}`}>{st.label}</p>
              <p className="text-[10px] text-cyber-muted mt-0.5 truncate">{st.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Dynamic Status Log Line */}
      {activePipelineJob?.message && (
        <div className="mt-4 p-2.5 rounded-lg bg-cyber-dark/80 border border-cyber-border/30 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-cyber-accent">
            <span className="animate-spin text-sm">⟳</span>
            <span>{activePipelineJob.message}</span>
          </div>
          <span className="text-cyber-muted">{activePipelineJob.percent}%</span>
        </div>
      )}
    </div>
  );
};
