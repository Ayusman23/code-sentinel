import React from 'react';
import { Shield, Radio, Cpu, GitPullRequest, Code2, Play, FileText } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

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
    <header className="sticky top-0 z-50 bg-cyber-card border-b border-cyber-border px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Telemetry Pill */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('command-center')}>
            <div className="flex items-center justify-center w-9 h-9 rounded bg-cyber-bg border border-cyber-border">
              <Shield className="w-4 h-4 text-cyber-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-cyber-text font-mono">CodeSentinel</span>
                <span className="px-1.5 py-0.2 text-[10px] font-mono text-cyber-muted bg-cyber-bg rounded border border-cyber-border">v1.0 ENTERPRISE</span>
              </div>
              <p className="text-[10px] text-cyber-muted tracking-wider uppercase font-mono">AI DevSecOps Agent</p>
            </div>
          </div>

          <div className="h-5 w-px bg-cyber-border mx-1" />

          {/* Live WS Status */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-cyber-bg border border-cyber-border text-xs font-mono">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyber-low animate-pulse-slow' : 'bg-cyber-critical'}`} />
            <span className={isConnected ? 'text-cyber-muted' : 'text-cyber-critical'}>
              {isConnected ? 'LIVE TELEMETRY' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-cyber-bg p-1 rounded border border-cyber-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono transition-colors duration-150 ${
                  isActive
                    ? 'bg-cyber-card text-cyber-accent border border-cyber-border font-medium'
                    : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-cardHover'
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
              className="bg-cyber-bg border border-cyber-border rounded px-2.5 py-1 text-xs font-mono text-cyber-text focus:border-cyber-accent focus:outline-none cursor-pointer"
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

export default Header;
