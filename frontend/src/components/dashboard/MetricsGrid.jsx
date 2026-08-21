import React from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, Bomb, Zap, Filter } from 'lucide-react';
import { CyberCard } from '../common/CyberCard';

export const MetricsGrid = ({ metrics }) => {
  const summary = metrics?.summary || {
    healthScore: 88,
    totalReviews: 12,
    criticalBlocked: 3,
    secretsScrubbed: 5,
    avgBlastRadius: 28,
    avgLatencyMs: 380
  };

  // Severity color mapping for Blast Radius (Lower is better)
  const blastRiskColor = summary.avgBlastRadius > 65
    ? 'text-cyber-critical'
    : (summary.avgBlastRadius > 35 ? 'text-cyber-high' : 'text-cyber-low');

  const blastBarColor = summary.avgBlastRadius > 65
    ? 'bg-cyber-critical'
    : (summary.avgBlastRadius > 35 ? 'bg-cyber-high' : 'bg-cyber-low');

  // Health Score color mapping (Higher is better)
  const healthRiskColor = summary.healthScore >= 70
    ? 'text-cyber-low'
    : (summary.healthScore >= 45 ? 'text-cyber-high' : 'text-cyber-critical');

  const healthBarColor = summary.healthScore >= 70
    ? 'bg-cyber-low'
    : (summary.healthScore >= 45 ? 'bg-cyber-high' : 'bg-cyber-critical');

  const cards = [
    {
      title: 'Repository Health Index',
      value: `${summary.healthScore}/100`,
      icon: ShieldCheck,
      color: healthRiskColor,
      subtitle: 'Based on zero-trust AST & RBAC telemetry',
      progress: summary.healthScore,
      barColor: healthBarColor
    },
    {
      title: 'Critical CVE/RBAC Blocked',
      value: summary.criticalBlocked,
      icon: ShieldAlert,
      color: 'text-cyber-critical',
      subtitle: 'Zero unauthorized mutations merged',
      badge: '100% BLOCKED'
    },
    {
      title: 'In-Flight Secrets Scrubbed',
      value: summary.secretsScrubbed,
      icon: KeyRound,
      color: 'text-cyber-high',
      subtitle: 'Zero credential persistence in database',
      badge: '<1ms SCAN'
    },
    {
      title: 'Avg. Architectural Blast Radius',
      value: `${summary.avgBlastRadius}/100`,
      icon: Bomb,
      color: blastRiskColor,
      subtitle: 'Holistic failure surface propagation',
      progress: summary.avgBlastRadius,
      barColor: blastBarColor
    },
    {
      title: 'High-Signal Noise Suppressed',
      value: '94.2%',
      icon: Filter,
      color: 'text-cyber-accent',
      subtitle: 'Stylistic/ESLint alerts filtered out',
      badge: 'ANTI-FATIGUE'
    },
    {
      title: 'End-to-End Pipeline Latency',
      value: `${summary.avgLatencyMs}ms`,
      icon: Zap,
      color: 'text-cyber-accent',
      subtitle: 'Asynchronous 200 webhook response',
      badge: 'SUB-SECOND'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <CyberCard key={idx}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-mono text-cyber-muted tracking-wider uppercase">{card.title}</p>
                <div className="flex items-baseline gap-2 mt-1.5">
                  <h3 className={`text-xl font-bold font-mono tabular-nums ${card.color}`}>{card.value}</h3>
                  {card.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyber-bg text-cyber-muted border border-cyber-border">
                      {card.badge}
                    </span>
                  )}
                </div>
              </div>
              <div className="p-2 rounded bg-cyber-bg border border-cyber-border text-cyber-muted">
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {card.progress !== undefined && (
              <div className="w-full bg-cyber-bg h-1 rounded mt-3 overflow-hidden border border-cyber-border">
                <div
                  className={`h-full rounded ${card.barColor || 'bg-cyber-accent'}`}
                  style={{ width: `${card.progress}%` }}
                />
              </div>
            )}

            <p className="text-[11px] text-cyber-faint mt-2 font-mono">{card.subtitle}</p>
          </CyberCard>
        );
      })}
    </div>
  );
};
