import React from 'react';

export const CyberBadge = ({ variant = 'default', children, size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm font-semibold'
  }[size] || 'px-2.5 py-1 text-xs';

  const variantClasses = {
    CRITICAL: 'bg-red-500/15 text-red-400 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.25)]',
    HIGH: 'bg-orange-500/15 text-orange-400 border border-orange-500/40 shadow-[0_0_10px_rgba(249,115,22,0.2)]',
    MEDIUM: 'bg-amber-500/15 text-amber-300 border border-amber-500/40',
    LOW: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40',
    CLEAN: 'bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/40 shadow-[0_0_10px_rgba(34,230,184,0.2)]',
    QUEUED: 'bg-blue-500/15 text-blue-400 border border-blue-500/40',
    ANALYZING: 'bg-purple-500/15 text-purple-400 border border-purple-500/40 animate-pulse',
    COMPLETED: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40',
    FAILED: 'bg-red-500/15 text-red-400 border border-red-500/40',
    default: 'bg-slate-800 text-slate-300 border border-slate-700'
  }[variant.toUpperCase()] || variantClasses.default;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-mono uppercase tracking-wide ${sizeClasses} ${variantClasses} ${className}`}>
      {children || variant}
    </span>
  );
};
