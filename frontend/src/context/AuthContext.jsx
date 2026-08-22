import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi, demoLoginApi, getMeApi } from '../services/api';

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: {
    id: 'ADMIN',
    name: 'SecOps Lead (Admin)',
    shortName: 'Admin',
    description: 'Full platform governance, live webhook simulations, and audit exports.',
    badgeClass: 'bg-cyber-critical/10 text-cyber-critical border-cyber-critical/30',
    allowedTabs: ['command-center', 'pr-reviews', 'diff-sandbox', 'github-simulator', 'audit-logs', 'about'],
    permissions: ['TRIGGER_WEBHOOK', 'EXECUTE_SANDBOX', 'EXPORT_AUDIT', 'VIEW_ALL_REVIEWS', 'MANAGE_POLICIES', 'THREAT_MODEL']
  },
  SECURITY_ENGINEER: {
    id: 'SECURITY_ENGINEER',
    name: 'Security Engineer',
    shortName: 'SecOps',
    description: 'Deep AST analysis, threat modeling, diff sandbox, and compliance telemetry.',
    badgeClass: 'bg-cyber-accent/10 text-cyber-accent border-cyber-accent/30',
    allowedTabs: ['command-center', 'pr-reviews', 'diff-sandbox', 'audit-logs', 'about'],
    permissions: ['EXECUTE_SANDBOX', 'EXPORT_AUDIT', 'VIEW_ALL_REVIEWS', 'THREAT_MODEL']
  },
  DEVELOPER: {
    id: 'DEVELOPER',
    name: 'Developer (Read-Only)',
    shortName: 'Developer',
    description: 'Focused PR triage, line-by-line code suggestions, and unit test verification snippets.',
    badgeClass: 'bg-cyber-low/10 text-cyber-low border-cyber-low/30',
    allowedTabs: ['command-center', 'pr-reviews', 'about'],
    permissions: ['VIEW_ALL_REVIEWS', 'VIEW_REMEDIATIONS', 'COPY_PATCHES']
  }
};

const DEFAULT_DEMO_USERS = {
  ADMIN: {
    id: 'user_admin_demo',
    email: 'demo-admin@codesentinel.dev',
    name: 'Alex Vance (SecOps Lead)',
    role: 'ADMIN',
    department: 'DevSecOps Governance',
    isDemo: true
  },
  SECURITY_ENGINEER: {
    id: 'user_secops_demo',
    email: 'demo-secops@codesentinel.dev',
    name: 'Elena Rostova (Security Engineer)',
    role: 'SECURITY_ENGINEER',
    department: 'AppSec & Threat Modeling',
    isDemo: true
  },
  DEVELOPER: {
    id: 'user_dev_demo',
    email: 'demo-dev@codesentinel.dev',
    name: 'Marcus Chen (Software Engineer)',
    role: 'DEVELOPER',
    department: 'Platform Core Engineering',
    isDemo: true
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('codesentinel_jwt') || null);
  const [user, setUser] = useState(() => {
    const cachedUser = localStorage.getItem('codesentinel_user');
    if (cachedUser) {
      try {
        return JSON.parse(cachedUser);
      } catch (e) {
        return null;
      }
    }
    // If a role was previously selected in localStorage, default to that demo user
    const legacyRole = localStorage.getItem('codesentinel_role') || 'ADMIN';
    return DEFAULT_DEMO_USERS[legacyRole] || DEFAULT_DEMO_USERS.ADMIN;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      getMeApi()
        .then(res => {
          if (res?.user) {
            setUser(res.user);
            localStorage.setItem('codesentinel_user', JSON.stringify(res.user));
            localStorage.setItem('codesentinel_role', res.user.role);
          }
        })
        .catch(() => {
          // Token expired or invalid
        });
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await loginApi(email, password);
      if (res.token && res.user) {
        setToken(res.token);
        setUser(res.user);
        localStorage.setItem('codesentinel_jwt', res.token);
        localStorage.setItem('codesentinel_user', JSON.stringify(res.user));
        localStorage.setItem('codesentinel_role', res.user.role);
        return { success: true, user: res.user };
      }
      throw new Error(res.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (roleKey) => {
    setLoading(true);
    try {
      const targetRole = (roleKey || 'ADMIN').toUpperCase();
      try {
        const res = await demoLoginApi(targetRole);
        if (res.token && res.user) {
          setToken(res.token);
          setUser(res.user);
          localStorage.setItem('codesentinel_jwt', res.token);
          localStorage.setItem('codesentinel_user', JSON.stringify(res.user));
          localStorage.setItem('codesentinel_role', res.user.role);
          return { success: true, user: res.user };
        }
      } catch (err) {
        // Local fallback if API is not reached
        const fallbackUser = DEFAULT_DEMO_USERS[targetRole] || DEFAULT_DEMO_USERS.ADMIN;
        setUser(fallbackUser);
        localStorage.setItem('codesentinel_role', targetRole);
        localStorage.setItem('codesentinel_user', JSON.stringify(fallbackUser));
        return { success: true, user: fallbackUser };
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('codesentinel_jwt');
    localStorage.removeItem('codesentinel_user');
  };

  const activeRole = user?.role || 'DEVELOPER';
  const currentRoleConfig = ROLES[activeRole] || ROLES.DEVELOPER;

  const hasPermission = (permission) => {
    if (activeRole === 'ADMIN') return true;
    const permissions = user?.permissions || currentRoleConfig.permissions || [];
    return permissions.includes(permission);
  };

  const isTabAllowed = (tabId) => {
    return currentRoleConfig.allowedTabs.includes(tabId);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role: activeRole,
        isAuthenticated: Boolean(user),
        currentRoleConfig,
        ROLES,
        loading,
        login,
        demoLogin,
        logout,
        hasPermission,
        isTabAllowed
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
