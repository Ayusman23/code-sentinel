import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, UserCheck, KeyRound, AlertCircle, ArrowLeft } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, demoLogin, loading } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      const res = await login(email, password);
      if (res.success) {
        navigate('/app');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleQuickDemoSelect = async (roleKey, demoEmail, demoPass) => {
    setError('');
    setEmail(demoEmail);
    setPassword(demoPass);
    try {
      const res = await demoLogin(roleKey);
      if (res.success) {
        navigate('/app');
      }
    } catch (err) {
      setError(err.message || 'Demo authentication failed.');
    }
  };

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text flex flex-col justify-between selection:bg-cyber-accent selection:text-cyber-dark">
      {/* Top Header */}
      <header className="border-b border-cyber-border bg-cyber-card/60 backdrop-blur px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded bg-cyber-accent/15 border border-cyber-accent/30 flex items-center justify-center text-cyber-accent group-hover:scale-105 transition-transform">
            <Shield className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-base font-bold tracking-tight text-cyber-text">CodeSentinel</span>
            <span className="text-[10px] text-cyber-muted font-mono tracking-wider uppercase">Zero-Trust DevSecOps</span>
          </div>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-cyber-muted hover:text-cyber-accent transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Overview
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-6 my-8">
        <div className="max-w-md w-full space-y-6">
          
          {/* Card Wrapper */}
          <div className="panel border border-cyber-border rounded-xl p-8 shadow-2xl space-y-6">
            
            <div className="space-y-1.5 text-center">
              <h1 className="text-xl font-bold font-mono text-cyber-text tracking-tight">
                Enterprise Sign In
              </h1>
              <p className="text-xs text-cyber-muted">
                Authenticate with your zero-trust corporate identity or select a demo role below.
              </p>
            </div>

            {error && (
              <div className="p-3 bg-cyber-critical/10 border border-cyber-critical/30 rounded flex items-center gap-2 text-xs font-mono text-cyber-critical">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Standard Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
              <div className="space-y-1.5">
                <label className="text-cyber-muted flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyber-accent" />
                  Corporate Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@enterprise.dev"
                  className="w-full bg-cyber-dark/80 border border-cyber-border rounded px-3 py-2 text-cyber-text placeholder:text-cyber-faint focus:outline-none focus:border-cyber-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-cyber-muted flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyber-accent" />
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-cyber-dark/80 border border-cyber-border rounded px-3 py-2 text-cyber-text placeholder:text-cyber-faint focus:outline-none focus:border-cyber-accent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-cyber-accent hover:bg-cyber-accentStrong text-cyber-dark font-bold rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <span>Verify Identity & Enter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-cyber-border w-full"></div>
              <span className="bg-cyber-card px-3 text-[10px] font-mono text-cyber-faint uppercase tracking-wider relative">
                Self-Service Demo Accounts
              </span>
            </div>

            {/* Quick 1-Click Demo Buttons for Recruiters */}
            <div className="space-y-2.5">
              <p className="text-[11px] text-cyber-muted font-mono text-center">
                Click any role below for instant authenticated access:
              </p>

              <div className="space-y-2">
                {/* Demo Admin */}
                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect('ADMIN', 'demo-admin@codesentinel.dev', 'demo1234')}
                  disabled={loading}
                  className="w-full p-2.5 rounded bg-cyber-card hover:bg-cyber-cardHover border border-cyber-critical/30 hover:border-cyber-critical text-left flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-cyber-critical/15 text-cyber-critical flex items-center justify-center text-[11px] font-bold">
                      👑
                    </div>
                    <div>
                      <div className="text-xs font-bold text-cyber-text group-hover:text-cyber-critical transition-colors">
                        SecOps Lead (Admin)
                      </div>
                      <div className="text-[10px] text-cyber-muted font-mono">
                        demo-admin@codesentinel.dev / demo1234
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-cyber-critical/10 text-cyber-critical px-1.5 py-0.5 rounded border border-cyber-critical/20">
                    Full Access
                  </span>
                </button>

                {/* Demo SecOps */}
                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect('SECURITY_ENGINEER', 'demo-secops@codesentinel.dev', 'demo1234')}
                  disabled={loading}
                  className="w-full p-2.5 rounded bg-cyber-card hover:bg-cyber-cardHover border border-cyber-accent/30 hover:border-cyber-accent text-left flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-cyber-accent/15 text-cyber-accent flex items-center justify-center text-[11px] font-bold">
                      🛡️
                    </div>
                    <div>
                      <div className="text-xs font-bold text-cyber-text group-hover:text-cyber-accent transition-colors">
                        Security Engineer
                      </div>
                      <div className="text-[10px] text-cyber-muted font-mono">
                        demo-secops@codesentinel.dev / demo1234
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-cyber-accent/10 text-cyber-accent px-1.5 py-0.5 rounded border border-cyber-accent/20">
                    AST & Sandbox
                  </span>
                </button>

                {/* Demo Developer */}
                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect('DEVELOPER', 'demo-dev@codesentinel.dev', 'demo1234')}
                  disabled={loading}
                  className="w-full p-2.5 rounded bg-cyber-card hover:bg-cyber-cardHover border border-cyber-low/30 hover:border-cyber-low text-left flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded bg-cyber-low/15 text-cyber-low flex items-center justify-center text-[11px] font-bold">
                      💻
                    </div>
                    <div>
                      <div className="text-xs font-bold text-cyber-text group-hover:text-cyber-low transition-colors">
                        Developer (Read-Only)
                      </div>
                      <div className="text-[10px] text-cyber-muted font-mono">
                        demo-dev@codesentinel.dev / demo1234
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase bg-cyber-low/10 text-cyber-low px-1.5 py-0.5 rounded border border-cyber-low/20">
                    PR Triage Only
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-cyber-border py-4 px-6 text-center text-xs font-mono text-cyber-muted">
        CodeSentinel Enterprise Zero-Trust &copy; 2026 Ayusman Samantaray. All rights reserved.
      </footer>
    </div>
  );
};
