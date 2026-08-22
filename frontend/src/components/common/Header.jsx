import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Cpu, GitPullRequest, Code2, Play, FileText, Sun, Moon, LogOut, HelpCircle, BookOpen, User } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Header = ({ activeTab, setActiveTab, onOpenAbout, onOpenTour }) => {
  const navigate = useNavigate();
  const { isConnected } = useSocket();
  const { user, role, logout, currentRoleConfig, isTabAllowed } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const allTabs = [
    { id: 'command-center', label: 'Command Center', icon: Cpu },
    { id: 'pr-reviews', label: 'PR Triage Matrix', icon: GitPullRequest },
    { id: 'diff-sandbox', label: 'Diff Sandbox', icon: Code2 },
    { id: 'github-simulator', label: 'PR Simulator', icon: Play },
    { id: 'audit-logs', label: 'Audit Telemetry', icon: FileText }
  ];

  // Filter tabs dynamically based on active authenticated role permissions
  const visibleTabs = allTabs.filter(tab => isTabAllowed(tab.id));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 bg-cyber-card border-b border-cyber-border px-6 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-wrap">
        
        {/* Brand Logo & Telemetry Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('command-center')}>
            <div className="flex items-center justify-center w-8 h-8 rounded bg-cyber-bg border border-cyber-border text-cyber-accent">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-cyber-text font-mono">CodeSentinel</span>
                <span className="px-1.5 py-0.2 text-[9px] font-mono text-cyber-muted bg-cyber-bg rounded border border-cyber-border">V2.0</span>
              </div>
              <p className="text-[9px] text-cyber-muted tracking-wider uppercase font-mono hidden sm:block">Zero-Trust DevSecOps</p>
            </div>
          </div>

          <div className="h-4 w-px bg-cyber-border mx-1 hidden sm:block" />

          {/* Live WS Status */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyber-bg border border-cyber-border text-[11px] font-mono">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-cyber-low animate-pulse-slow' : 'bg-cyber-critical'}`} />
            <span className={isConnected ? 'text-cyber-muted' : 'text-cyber-critical'}>
              {isConnected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Strictly Filtered by Role) */}
        <nav className="flex items-center gap-1 bg-cyber-bg p-1 rounded border border-cyber-border overflow-x-auto">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-cyber-card text-cyber-accent border border-cyber-border font-bold'
                    : 'text-cyber-muted hover:text-cyber-text hover:bg-cyber-cardHover'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Session Controls & Utilities */}
        <div className="flex items-center gap-2">
          
          {/* Quick Guided Tour Button */}
          {onOpenTour && (
            <button
              onClick={onOpenTour}
              title="Start Guided Tour"
              className="p-1.5 rounded bg-cyber-bg border border-cyber-border hover:border-cyber-borderHover text-cyber-muted hover:text-cyber-text transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

          {/* About Build Retrospective */}
          {onOpenAbout && (
            <button
              onClick={onOpenAbout}
              title="About This Build (Engineering Retrospective)"
              className="p-1.5 rounded bg-cyber-bg border border-cyber-border hover:border-cyber-borderHover text-cyber-muted hover:text-cyber-text transition-colors"
            >
              <BookOpen className="w-4 h-4" />
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Cyber Theme'}
            className="p-1.5 rounded bg-cyber-bg border border-cyber-border hover:border-cyber-borderHover text-cyber-muted hover:text-cyber-accent transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Persistent Authenticated Session Badge */}
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-cyber-bg border border-cyber-border text-xs font-mono">
            <User className="w-3.5 h-3.5 text-cyber-muted" />
            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-cyber-text truncate max-w-[120px]">
                {user?.name?.split(' ')[0] || 'Authenticated'}
              </span>
            </div>
            <span className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold border ${currentRoleConfig.badgeClass}`}>
              {currentRoleConfig.shortName}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title="Sign Out"
            className="p-1.5 rounded bg-cyber-bg hover:bg-cyber-critical/10 border border-cyber-border hover:border-cyber-critical/30 text-cyber-muted hover:text-cyber-critical transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>

        </div>

      </div>
    </header>
  );
};

export default Header;
