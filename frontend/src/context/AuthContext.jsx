import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: {
    id: 'ADMIN',
    name: 'SecOps Lead (Admin)',
    shortName: 'Admin',
    description: 'Full platform governance, live webhook simulations, and audit exports.',
    badgeClass: 'bg-cyber-critical/10 text-cyber-critical border-cyber-critical/30',
    allowedTabs: ['command-center', 'pr-reviews', 'diff-sandbox', 'github-simulator', 'audit-logs'],
    permissions: ['TRIGGER_WEBHOOK', 'EXECUTE_SANDBOX', 'EXPORT_AUDIT', 'VIEW_ALL_REVIEWS', 'MANAGE_POLICIES']
  },
  SECURITY_ENGINEER: {
    id: 'SECURITY_ENGINEER',
    name: 'Security Engineer',
    shortName: 'SecOps',
    description: 'Deep AST analysis, threat modeling, diff sandbox, and compliance telemetry.',
    badgeClass: 'bg-cyber-accent/10 text-cyber-accent border-cyber-accent/30',
    allowedTabs: ['command-center', 'pr-reviews', 'diff-sandbox', 'audit-logs'],
    permissions: ['EXECUTE_SANDBOX', 'EXPORT_AUDIT', 'VIEW_ALL_REVIEWS', 'THREAT_MODEL']
  },
  DEVELOPER: {
    id: 'DEVELOPER',
    name: 'Developer (Read-Only)',
    shortName: 'Developer',
    description: 'Focused PR triage, line-by-line code suggestions, and unit test verification snippets.',
    badgeClass: 'bg-cyber-low/10 text-cyber-low border-cyber-low/30',
    allowedTabs: ['command-center', 'pr-reviews'],
    permissions: ['VIEW_ALL_REVIEWS', 'VIEW_REMEDIATIONS', 'COPY_PATCHES']
  }
};

export const AuthProvider = ({ children }) => {
  const [role, setRoleState] = useState(() => {
    return localStorage.getItem('codesentinel_role') || 'ADMIN';
  });

  const setRole = (newRole) => {
    setRoleState(newRole);
    localStorage.setItem('codesentinel_role', newRole);
  };

  const currentRoleConfig = ROLES[role] || ROLES.ADMIN;

  const hasPermission = (permission) => {
    if (role === 'ADMIN') return true;
    return currentRoleConfig.permissions.includes(permission);
  };

  const isTabAllowed = (tabId) => {
    return currentRoleConfig.allowedTabs.includes(tabId);
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        setRole,
        currentRoleConfig,
        ROLES,
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
