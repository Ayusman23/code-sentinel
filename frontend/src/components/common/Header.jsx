import React from 'react';
import { Shield, Radio, Terminal, Cpu, GitPullRequest, Code2, Play, FileText, CheckCircle2 } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth, ROLES } from '../../context/AuthContext';

export const Header = ({ activeTab, setActiveTab }) => {
  const { isConnected } = useSocket();
  const { role, setRole } = useAuth();

  const tabs = [
    { id: 'command-center', label: 'Command Center', icon: Cpu },
    { id: 'pr-reviews', label: 'PR Triage Matrix', icon: GitPullRequest },
    { id: 'diff-sandbox', label: 'Diff Sandbox', icon: Code2 },
    { id: 'github-simulator', label: 'PR Simulator', icon: Play },
    { id: 'audit-logs', label: 'Audit Telemetry', icon: FileText }
  ];

  return (
    <header className="sticky top-0 z-50 cyber-glass border-b border-cyber-border/40 px-6 py-3.5 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Telemetry Pill */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('command-center')}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-cyber-accent/10 border border-cyber-accent/30 shadow-[0_0_15px_rgba(34,230,184,0.3)]">
              <Shield className="w-5 h-5 text-cyber-accent" />
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-cyber-accent animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white cyber-glow-text font-mono">CodeSentinel</span>
                <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-cyber-accent/15 text-cyber-accent rounded border border-cyber-accent/30">v1.0 ENTERPRISE</span>
              </div>
              <p className="text-[11px] text-cyber-muted tracking-wider uppercase font-mono">Automated AI DevSecOps Agent</p>
            </div>
          </div>

          <div className="h-6 w-px bg-cyber-border/40 mx-1" />

          {/* Live WS Status */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-cyber-card border border-cyber-border/30 text-xs font-mono">
            <Radio className={`w-3.5 h-3.5 ${isConnected ? 'text-cyber-accent animate-pulse' : 'text-red-400'}`} />
            <span className={isConnected ? 'text-cyber-accent' : 'text-red-400'}>
              {isConnected ? 'LIVE TELEMETRY' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 bg-cyber-card/80 p-1 rounded-xl border border-cyber-border/30">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium font-mono transition-all duration-200 ${
                  isActive
                    ? 'bg-cyber-accent text-cyber-dark font-bold shadow-[0_0_15px_rgba(34,230,184,0.35)]'
                    : 'text-cyber-muted hover:text-white hover:bg-cyber-cardHover'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Role Scoped Governance Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-cyber-muted font-mono uppercase">Role:</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              aria-label="Role"
              className="bg-cyber-card border border-cyber-border/40 rounded-lg px-2.5 py-1 text-xs font-mono text-white focus:outline-none focus:border-cyber-accent cursor-pointer"
            >
              <option value="ADMIN">SecOps Lead (Admin)</option>
              <option value="SECURITY_ENGINEER">Security Engineer</option>
              <option value="DEVELOPER">Developer (Read-Only)</option>
            </select>
          </div>
        </div>

      </div>
    </header>
  );
};
