import React from 'react';

export const CyberBadge = ({ variant = 'default', children, size = 'sm', className = '' }) => {
  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-semibold'
  }[size] || 'px-2 py-0.5 text-xs';

  const v = variant ? variant.toUpperCase() : 'DEFAULT';

  const variantClasses = {
    CRITICAL: 'bg-cyber-critical/10 text-cyber-critical border border-cyber-critical/30',
    HIGH: 'bg-cyber-high/10 text-cyber-high border border-cyber-high/30',
    MEDIUM: 'bg-cyber-medium/10 text-cyber-medium border border-cyber-medium/30',
    LOW: 'bg-cyber-low/10 text-cyber-low border border-cyber-low/30',
    CLEAN: 'bg-cyber-low/10 text-cyber-low border border-cyber-low/30',
    QUEUED: 'bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30',
    ANALYZING: 'bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30',
    COMPLETED: 'bg-cyber-low/10 text-cyber-low border border-cyber-low/30',
    FAILED: 'bg-cyber-critical/10 text-cyber-critical border border-cyber-critical/30',
    DEFAULT: 'bg-cyber-bg text-cyber-muted border border-cyber-border'
  }[v] || 'bg-cyber-bg text-cyber-muted border border-cyber-border';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded font-mono uppercase tracking-wider ${sizeClasses} ${variantClasses} ${className}`}>
      {children || variant}
    </span>
  );
};
