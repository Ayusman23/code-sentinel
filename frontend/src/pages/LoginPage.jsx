import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, UserCheck, KeyRound, AlertCircle, ArrowLeft, User, Building, CheckCircle2 } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, googleAuth, demoLogin, loading } = useAuth();
  
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'signup'
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [department, setDepartment] = useState('Platform Engineering');
  const [role, setRole] = useState('SECURITY_ENGINEER');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [googlePromptOpen, setGooglePromptOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    const trimmedEmail = email.trim();

    if (!EMAIL_REGEX.test(trimmedEmail)) {
      setError('Please enter a valid email address (e.g. name@company.com).');
      return;
    }

    if (authMode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters in length.');
        return;
      }

      try {
        const res = await register({
          email: trimmedEmail,
          password,
          name: name.trim(),
          department: department.trim(),
          role
        });
        if (res.success) {
          navigate('/app');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Registration failed.');
      }
    } else {
      try {
        const res = await login(trimmedEmail, password);
        if (res.success) {
          navigate('/app');
        }
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Authentication failed. Please check your credentials.');
      }
    }
  };

  const handleGoogleSocialAuth = async (e) => {
    if (e) e.preventDefault();
    setError('');

    // If email is already typed in form, use it, otherwise open prompt
    const targetEmail = googleEmailInput.trim() || email.trim() || 'developer.engineer@gmail.com';
    const targetName = googleNameInput.trim() || name.trim() || 'Google Enterprise User';

    if (!EMAIL_REGEX.test(targetEmail)) {
      setError('Please enter a valid Google email address.');
      return;
    }

    try {
      const res = await googleAuth({
        email: targetEmail,
        name: targetName,
        googleId: `google_oauth_${Date.now()}`,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${targetEmail}`,
        role: 'SECURITY_ENGINEER',
        department: 'DevSecOps & Cloud Security'
      });
      if (res.success) {
        navigate('/app');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Google sign-in failed.');
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

      {/* Main Login / Signup Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="max-w-md w-full space-y-5">
          
          {/* Card Wrapper */}
          <div className="panel border border-cyber-border rounded-xl p-6 sm:p-8 shadow-2xl space-y-5">
            
            {/* Mode Switcher Tabs */}
            <div className="flex rounded-lg bg-cyber-dark p-1 border border-cyber-border font-mono text-xs">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setError('');
                }}
                className={`flex-1 py-1.5 rounded-md font-bold transition-all ${
                  authMode === 'login'
                    ? 'bg-cyber-card text-cyber-accent border border-cyber-border shadow-sm'
                    : 'text-cyber-muted hover:text-cyber-text'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setError('');
                }}
                className={`flex-1 py-1.5 rounded-md font-bold transition-all ${
                  authMode === 'signup'
                    ? 'bg-cyber-card text-cyber-accent border border-cyber-border shadow-sm'
                    : 'text-cyber-muted hover:text-cyber-text'
                }`}
              >
                Create Account
              </button>
            </div>

            <div className="space-y-1 text-center">
              <h1 className="text-xl font-bold font-mono text-cyber-text tracking-tight">
                {authMode === 'login' ? 'Sign In to CodeSentinel' : 'Create Enterprise Account'}
              </h1>
              <p className="text-xs text-cyber-muted">
                {authMode === 'login'
                  ? 'Access your zero-trust PR security command center.'
                  : 'Register your email for continuous pull request governance.'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-cyber-critical/10 border border-cyber-critical/30 rounded flex items-center gap-2 text-xs font-mono text-cyber-critical">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Google Social Single Sign-On Button */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setGooglePromptOpen(true)}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-cyber-dark hover:bg-cyber-card border border-cyber-border hover:border-cyber-borderHover rounded text-xs font-mono font-bold text-cyber-text flex items-center justify-center gap-2.5 transition-all group"
              >
                {/* Official Google 'G' Logo SVG */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{authMode === 'login' ? 'Sign In with Google' : 'Sign Up with Google'}</span>
              </button>

              {/* Expandable Google Email Quick Prompt if clicked */}
              {googlePromptOpen && (
                <div className="p-3.5 rounded bg-cyber-card border border-cyber-accent/30 space-y-3 font-mono text-xs animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-cyber-accent">
                    <span className="font-bold flex items-center gap-1.5">
                      <span>Google Account Email</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setGooglePromptOpen(false)}
                      className="text-[10px] text-cyber-muted hover:text-cyber-text"
                    >
                      Cancel
                    </button>
                  </div>
                  <input
                    type="email"
                    value={googleEmailInput}
                    onChange={(e) => setGoogleEmailInput(e.target.value)}
                    placeholder="you@gmail.com"
                    className="w-full bg-cyber-bg border border-cyber-border rounded px-3 py-1.5 text-cyber-text focus:outline-none focus:border-cyber-accent text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleGoogleSocialAuth}
                    disabled={loading}
                    className="w-full py-1.5 bg-cyber-accent hover:bg-cyber-accentStrong text-cyber-dark font-bold rounded text-xs transition-colors"
                  >
                    {loading ? 'Authenticating with Google...' : 'Continue via Google OAuth'}
                  </button>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-cyber-border w-full"></div>
              <span className="bg-cyber-card px-3 text-[10px] font-mono text-cyber-faint uppercase tracking-wider relative">
                Or with Email Credentials
              </span>
            </div>

            {/* Main Form (Sign In or Sign Up) */}
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-mono">
              
              {/* Full Name field for Signup */}
              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-cyber-muted flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyber-accent" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Vance"
                    required
                    className="w-full bg-cyber-dark/80 border border-cyber-border rounded px-3 py-2 text-cyber-text placeholder:text-cyber-faint focus:outline-none focus:border-cyber-accent"
                  />
                </div>
              )}

              {/* Email field */}
              <div className="space-y-1">
                <label className="text-cyber-muted flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyber-accent" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.vance@company.com"
                  required
                  className="w-full bg-cyber-dark/80 border border-cyber-border rounded px-3 py-2 text-cyber-text placeholder:text-cyber-faint focus:outline-none focus:border-cyber-accent"
                />
              </div>

              {/* Password field */}
              <div className="space-y-1">
                <label className="text-cyber-muted flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyber-accent" />
                  Password {authMode === 'signup' && <span className="text-[10px] text-cyber-faint">(min. 6 chars)</span>}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-cyber-dark/80 border border-cyber-border rounded px-3 py-2 text-cyber-text placeholder:text-cyber-faint focus:outline-none focus:border-cyber-accent"
                />
              </div>

              {/* Extra Department & Role Clearance fields for Signup */}
              {authMode === 'signup' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <label className="text-cyber-muted flex items-center gap-1 text-[11px]">
                      <Building className="w-3 h-3 text-cyber-accent" />
                      Department
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="AppSec / Platform"
                      className="w-full bg-cyber-dark/80 border border-cyber-border rounded px-2.5 py-1.5 text-cyber-text text-xs focus:outline-none focus:border-cyber-accent"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-cyber-muted flex items-center gap-1 text-[11px]">
                      <Shield className="w-3 h-3 text-cyber-accent" />
                      Clearance Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-cyber-dark/80 border border-cyber-border rounded px-2 py-1.5 text-cyber-text text-xs focus:outline-none focus:border-cyber-accent cursor-pointer"
                    >
                      <option value="SECURITY_ENGINEER">Security Engineer</option>
                      <option value="DEVELOPER">Developer</option>
                      <option value="ADMIN">SecOps Lead (Admin)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-cyber-accent hover:bg-cyber-accentStrong text-cyber-dark font-bold rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-cyber-accent/15"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>{authMode === 'login' ? 'Verify Identity & Enter' : 'Create Account & Launch'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center pt-2">
              <div className="border-t border-cyber-border w-full"></div>
              <span className="bg-cyber-card px-3 text-[10px] font-mono text-cyber-faint uppercase tracking-wider relative">
                Self-Service Demo Accounts
              </span>
            </div>

            {/* Quick 1-Click Demo Buttons for Recruiters */}
            <div className="space-y-2">
              <p className="text-[11px] text-cyber-muted font-mono text-center">
                Click any role below for instant evaluated access:
              </p>

              <div className="space-y-1.5">
                {/* Demo Admin */}
                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect('ADMIN', 'demo-admin@codesentinel.dev', 'demo1234')}
                  disabled={loading}
                  className="w-full p-2 rounded bg-cyber-card hover:bg-cyber-cardHover border border-cyber-critical/30 hover:border-cyber-critical text-left flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">👑</span>
                    <div>
                      <div className="text-xs font-bold text-cyber-text group-hover:text-cyber-critical transition-colors">
                        SecOps Lead (Admin)
                      </div>
                      <div className="text-[10px] text-cyber-muted font-mono">
                        demo-admin@codesentinel.dev
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
                  className="w-full p-2 rounded bg-cyber-card hover:bg-cyber-cardHover border border-cyber-accent/30 hover:border-cyber-accent text-left flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🛡️</span>
                    <div>
                      <div className="text-xs font-bold text-cyber-text group-hover:text-cyber-accent transition-colors">
                        Security Engineer
                      </div>
                      <div className="text-[10px] text-cyber-muted font-mono">
                        demo-secops@codesentinel.dev
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
                  className="w-full p-2 rounded bg-cyber-card hover:bg-cyber-cardHover border border-cyber-low/30 hover:border-cyber-low text-left flex items-center justify-between transition-all group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">💻</span>
                    <div>
                      <div className="text-xs font-bold text-cyber-text group-hover:text-cyber-low transition-colors">
                        Developer (Read-Only)
                      </div>
                      <div className="text-[10px] text-cyber-muted font-mono">
                        demo-dev@codesentinel.dev
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
