import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: { name: 'Admin / SecOps Lead', badge: 'bg-red-500/20 text-red-400 border-red-500/30' },
  SECURITY_ENGINEER: { name: 'Staff Security Engineer', badge: 'bg-cyber-accent/20 text-cyber-accent border-cyber-accent/30' },
  DEVELOPER: { name: 'Core Developer', badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
};

export const AuthProvider = ({ children }) => {
  const [role, setRole] = useState(() => {
    return localStorage.getItem('codesentinel_role') || 'ADMIN';
  });

  useEffect(() => {
    localStorage.setItem('codesentinel_role', role);
  }, [role]);

  return (
    <AuthContext.Provider value={{ role, setRole, ROLES }}>
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
