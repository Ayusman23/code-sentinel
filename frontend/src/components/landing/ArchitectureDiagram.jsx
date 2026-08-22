import React, { useState } from 'react';
import { Shield, Cpu, ArrowRight, Zap, CheckCircle2, Lock, GitPullRequest, Database } from 'lucide-react';

export const ArchitectureDiagram = () => {
  const [activeStep, setActiveStep] = useState(null);

  const steps = [
    {
      id: 'webhook',
      title: '1. GitHub Webhook POST',
      subtitle: 'HMAC SHA-256 Signed',
      desc: 'Webhook received and cryptographically verified in constant time with crypto.timingSafeEqual before JSON parsing.',
      icon: GitPullRequest,
      color: 'text-cyber-accent',
      bg: 'bg-cyber-accent/10 border-cyber-accent/30'
    },
    {
      id: 'gateway',
      title: '2. Node.js Ingestion Gateway',
      subtitle: 'HTTP 202 in <15ms',
      desc: 'Immediate acknowledgment prevents GitHub 10s timeouts. Lockfiles & binaries are stripped, and diffs are scheduled into detached async queues.',
      icon: Zap,
      color: 'text-cyber-medium',
      bg: 'bg-cyber-medium/10 border-cyber-medium/30'
    },
    {
      id: 'worker',
      title: '3. Python FastAPI AI Plane',
      subtitle: 'AST + Shannon Entropy',
      desc: 'Sub-millisecond secret scrubbing (H >= 3.2), multi-file AST contract traversal, deterministic RBAC checking, and 5-axis blast radius scoring.',
      icon: Cpu,
      color: 'text-cyber-accentStrong',
      bg: 'bg-cyber-accentStrong/10 border-cyber-accentStrong/30'
    },
    {
      id: 'governance',
      title: '4. Output & Governance',
      subtitle: 'Inline Reviews & Sockets',
      desc: 'Dispatches committable GitHub Markdown suggestions with unit test snippets, streams live WebSocket telemetry, and logs to MongoDB Atlas.',
      icon: Shield,
      color: 'text-cyber-low',
      bg: 'bg-cyber-low/10 border-cyber-low/30'
    }
  ];

  return (
    <div className="space-y-6">
      {/* SVG Pipeline Canvas */}
      <div className="panel border border-cyber-border rounded-xl p-6 lg:p-8 bg-cyber-card/80 backdrop-blur relative overflow-hidden">
        
        {/* Header Label */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-cyber-border/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-accent animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-cyber-text uppercase tracking-wider">
              Zero-Trust Dual-Runtime Pipeline Architecture
            </span>
          </div>
          <span className="text-[11px] font-mono text-cyber-muted hidden sm:inline">
            Interactive System Flow
          </span>
        </div>

        {/* Diagram Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === step.id;

            return (
              <div
                key={step.id}
                onMouseEnter={() => setActiveStep(step.id)}
                onMouseLeave={() => setActiveStep(null)}
                onClick={() => setActiveStep(isSelected ? null : step.id)}
                className={`p-4 rounded-lg border transition-all cursor-pointer relative group ${
                  isSelected
                    ? `${step.bg} ring-2 ring-cyber-accent/40 scale-[1.02]`
                    : 'bg-cyber-dark/60 border-cyber-border hover:border-cyber-borderHover'
                }`}
              >
                {/* Node Step Counter */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-8 h-8 rounded flex items-center justify-center ${step.bg} ${step.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-cyber-muted px-1.5 py-0.5 rounded bg-cyber-dark border border-cyber-border">
                    STEP 0{idx + 1}
                  </span>
                </div>

                {/* Node Title & Subtitle */}
                <h4 className="text-xs font-mono font-bold text-cyber-text mb-1">
                  {step.title}
                </h4>
                <div className="text-[11px] font-mono text-cyber-accent font-semibold mb-2">
                  {step.subtitle}
                </div>
                <p className="text-[11px] text-cyber-muted leading-relaxed">
                  {step.desc}
                </p>

                {/* Arrow Connector for Desktop */}
                {idx < 3 && (
                  <div className="hidden md:flex absolute -right-3.5 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-cyber-card border border-cyber-border items-center justify-center text-cyber-muted group-hover:text-cyber-accent transition-colors">
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Dynamic Architectural Deep Dive Drawer */}
        <div className="mt-6 p-4 rounded-lg bg-cyber-dark/90 border border-cyber-border font-mono text-xs space-y-2">
          <div className="flex items-center justify-between text-cyber-muted">
            <span className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-cyber-accent" />
              <span>Core Architectural Guarantee:</span>
            </span>
            <span className="text-[10px] text-cyber-accent uppercase">
              Sub-Millisecond Pre-Scrubbing + 100% Deterministic RBAC Gate
            </span>
          </div>
          <p className="text-[11px] text-cyber-text leading-relaxed font-sans">
            Unlike standard AI PR bots that send raw code diffs containing plain API keys to external LLMs, CodeSentinel enforces in-flight Shannon entropy secret interception ($H \ge 3.2$) in sub-millisecond latency. Raw credentials never touch external APIs or databases.
          </p>
        </div>

      </div>
    </div>
  );
};
