import React from 'react';
import { Bomb, Layers, Globe, Database, ShieldAlert, Cpu, AlertTriangle } from 'lucide-react';
import { CyberBadge } from '../common/CyberBadge';

export const BlastRadiusVisualizer = ({ blastRadius }) => {
  if (!blastRadius) return null;

  const score = blastRadius.overallScore || blastRadius.overall_score || 0;
  const riskLevel = blastRadius.riskLevel || blastRadius.risk_level || 'LOW';
  const breakdown = blastRadius.breakdown || {};
  const affected = blastRadius.affectedComponents || blastRadius.affected_components || [];
  const summary = blastRadius.summary || '';

  const subMetrics = [
    {
      name: 'Dependency Depth Risk',
      value: breakdown.dependencyDepthScore ?? breakdown.dependency_depth_score ?? 0,
      icon: Layers,
      desc: 'Core architecture vs leaf component weighting',
      color: 'bg-cyan-400'
    },
    {
      name: 'API Surface Exposure',
      value: breakdown.apiSurfaceScore ?? breakdown.api_surface_score ?? 0,
      icon: Globe,
      desc: 'Public mutating endpoints exposed',
      color: 'bg-blue-400'
    },
    {
      name: 'Data Mutation & Schema Impact',
      value: breakdown.dataMutationScore ?? breakdown.data_mutation_score ?? 0,
      icon: Database,
      desc: 'Persistence models & schemas altered',
      color: 'bg-purple-400'
    },
    {
      name: 'RBAC Sensitivity Factor',
      value: breakdown.rbacExposureScore ?? breakdown.rbac_exposure_score ?? 0,
      icon: ShieldAlert,
      desc: 'Security boundary and auth layers affected',
      color: 'bg-red-400'
    }
  ];

  const cyclomatic = breakdown.cyclomaticDelta ?? breakdown.cyclomatic_delta ?? 0;

  return (
    <div className="space-y-6">
      {/* Top Composite Gauge Banner */}
      <div className="p-5 rounded-xl bg-cyber-dark/80 border border-cyber-border/40 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-cyber-border/40 bg-cyber-card shadow-inner">
            <span className={`text-3xl font-extrabold font-mono ${score > 70 ? 'text-red-400' : score > 40 ? 'text-amber-400' : 'text-cyber-accent'}`}>
              {score}
            </span>
            <span className="absolute bottom-2 text-[10px] font-mono text-cyber-muted uppercase">/100</span>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-base font-bold text-white font-mono">Architectural Blast-Radius Index</h3>
              <CyberBadge variant={riskLevel}>{riskLevel}</CyberBadge>
            </div>
            <p className="text-xs text-cyber-muted mt-1 max-w-xl">{summary}</p>
          </div>
        </div>

        {/* Cyclomatic Delta Badge */}
        <div className="flex items-center gap-3 bg-cyber-card px-4 py-3 rounded-lg border border-cyber-border/30 font-mono text-xs">
          <Cpu className="w-4 h-4 text-cyber-accent" />
          <div>
            <p className="text-cyber-muted text-[10px] uppercase">Cyclomatic Complexity Delta</p>
            <p className="text-white font-bold text-sm">+{cyclomatic} branch points</p>
          </div>
        </div>
      </div>

      {/* 4 Dimension Bar Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subMetrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="p-4 rounded-lg bg-cyber-card border border-cyber-border/30">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-cyber-accent" />
                  <span className="text-xs font-semibold font-mono text-white">{m.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-cyber-accent">{m.value}%</span>
              </div>
              
              <div className="w-full bg-cyber-dark h-2 rounded-full overflow-hidden mb-2">
                <div className={`h-full rounded-full ${m.color}`} style={{ width: `${Math.min(100, m.value)}%` }} />
              </div>
              <p className="text-[11px] text-cyber-muted font-mono">{m.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Affected Subsystems Ripple Chips */}
      {affected.length > 0 && (
        <div>
          <h4 className="text-xs font-mono font-bold uppercase text-cyber-muted mb-2.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            Impacted Functional Subsystems & Failure Boundaries ({affected.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {affected.map((comp, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-md bg-cyber-dark text-xs font-mono text-slate-300 border border-cyber-border/40 flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyber-accent" />
                {comp}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
