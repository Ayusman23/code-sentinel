import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

export const ProtectedRoute = ({ children, requiredTab, requiredRole, requiredPermission }) => {
  const { isAuthenticated, user, role, currentRoleConfig, isTabAllowed, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check tab allowance
  if (requiredTab && !isTabAllowed(requiredTab)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full panel border border-cyber-critical/40 p-8 rounded-xl text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-cyber-critical/10 border border-cyber-critical/30 flex items-center justify-center mx-auto text-cyber-critical">
            <Lock className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold font-mono text-cyber-text">
              ACCESS DENIED
            </h2>
            <p className="text-xs text-cyber-muted font-mono uppercase tracking-wider">
              INSUFFICIENT SECURITY CLEARANCE
            </p>
          </div>

          <div className="p-3 bg-cyber-card border border-cyber-border rounded text-xs font-mono text-left space-y-1">
            <div className="flex justify-between">
              <span className="text-cyber-muted">Authenticated User:</span>
              <span className="text-cyber-text font-bold">{user?.name || 'Developer'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyber-muted">Active Role:</span>
              <span className="text-cyber-critical font-bold">{currentRoleConfig.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyber-muted">Requested Route:</span>
              <span className="text-cyber-accent font-bold">/{requiredTab}</span>
            </div>
          </div>

          <p className="text-xs text-cyber-muted leading-relaxed">
            Developer accounts are granted read-only triage clearance. Administrative tools (Audit Matrix, Diff Sandbox, Webhook Simulator) require elevated SecOps or Admin credentials.
          </p>

          <div className="pt-2">
            <a
              href="/app"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyber-card hover:bg-cyber-cardHover border border-cyber-border rounded text-xs font-mono text-cyber-text transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-cyber-accent" />
              Return to Command Center
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Check explicit permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full panel border border-cyber-critical/40 p-8 rounded-xl text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-cyber-critical mx-auto" />
          <h2 className="text-lg font-bold font-mono text-cyber-text">PERMISSION RESTRICTED</h2>
          <p className="text-xs text-cyber-muted font-mono">
            Missing required permission: <span className="text-cyber-critical font-bold">{requiredPermission}</span>
          </p>
        </div>
      </div>
    );
  }

  return children;
};
