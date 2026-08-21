import React from 'react';
import { Layers, Globe, Database, ShieldAlert, Cpu, AlertTriangle } from 'lucide-react';
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
      barColor: 'bg-cyber-accent'
    },
    {
      name: 'API Surface Exposure',
      value: breakdown.apiSurfaceScore ?? breakdown.api_surface_score ?? 0,
      icon: Globe,
      desc: 'Public mutating endpoints exposed',
      barColor: 'bg-cyber-accentStrong'
    },
    {
      name: 'Data Mutation & Schema Impact',
      value: breakdown.dataMutationScore ?? breakdown.data_mutation_score ?? 0,
      icon: Database,
      desc: 'Persistence models & schemas altered',
      barColor: 'bg-cyber-high'
    },
    {
      name: 'RBAC Sensitivity Factor',
      value: breakdown.rbacExposureScore ?? breakdown.rbac_exposure_score ?? 0,
      icon: ShieldAlert,
      desc: 'Security boundary and auth layers affected',
      barColor: 'bg-cyber-critical'
    }
  ];

  const cyclomatic = breakdown.cyclomaticDelta ?? breakdown.cyclomatic_delta ?? 0;

  return (
    <div className="space-y-5">
      {/* Top Composite Gauge Banner */}
      <div className="p-5 rounded panel flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center w-20 h-20 rounded border border-cyber-border bg-cyber-bg">
            <span className={`text-2xl font-bold font-mono tabular-nums ${score > 70 ? 'text-cyber-critical' : score > 40 ? 'text-cyber-high' : 'text-cyber-low'}`}>
              {score}
            </span>
            <span className="absolute bottom-1.5 text-[9px] font-mono text-cyber-faint uppercase">/100</span>
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm font-bold text-cyber-text font-mono">Architectural Blast-Radius Index</h3>
              <CyberBadge variant={riskLevel}>{riskLevel}</CyberBadge>
            </div>
            <p className="text-xs text-cyber-muted mt-1 max-w-xl font-sans">{summary}</p>
          </div>
        </div>

        {/* Cyclomatic Delta Badge */}
        <div className="flex items-center gap-3 bg-cyber-bg px-3.5 py-2.5 rounded border border-cyber-border font-mono text-xs">
          <Cpu className="w-4 h-4 text-cyber-accent" />
          <div>
            <p className="text-cyber-muted text-[10px] uppercase">Cyclomatic Complexity Delta</p>
            <p className="text-cyber-text font-bold text-sm tabular-nums">+{cyclomatic} branch points</p>
          </div>
        </div>
      </div>

      {/* 4 Dimension Bar Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {subMetrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="p-3.5 rounded panel border border-cyber-border">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-cyber-muted" />
                  <span className="text-xs font-semibold font-mono text-cyber-text">{m.name}</span>
                </div>
                <span className="text-xs font-mono font-bold text-cyber-accent tabular-nums">{m.value}%</span>
              </div>
              
              <div className="w-full bg-cyber-bg h-1.5 rounded overflow-hidden mb-1.5 border border-cyber-border">
                <div className={`h-full rounded ${m.barColor}`} style={{ width: `${Math.min(100, m.value)}%` }} />
              </div>
              <p className="text-[10px] text-cyber-muted font-mono">{m.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Affected Subsystems Ripple Chips */}
      {affected.length > 0 && (
        <div>
          <h4 className="text-xs font-mono font-bold uppercase text-cyber-muted mb-2 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-cyber-high" />
            Impacted Functional Subsystems & Failure Boundaries ({affected.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {affected.map((comp, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded bg-cyber-bg text-xs font-mono text-cyber-text border border-cyber-border flex items-center gap-1.5"
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
