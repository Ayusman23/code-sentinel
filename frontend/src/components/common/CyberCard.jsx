import React from 'react';

export const CyberCard = ({ children, className = '', glow = false, title, subtitle, action, scanline = false }) => {
  return (
    <div className={`cyber-glass rounded-xl p-5 relative overflow-hidden transition-all duration-300 ${glow ? 'border-cyber-accent/40 shadow-cyber-glow' : 'hover:border-cyber-borderHover'} ${className}`}>
      {scanline && (
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-cyber-accent/5 to-transparent h-12 animate-scanline opacity-30" />
      )}
      
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-cyber-border/40 pb-3 mb-4">
          <div>
            {title && <h3 className="text-base font-semibold text-white tracking-wide flex items-center gap-2">{title}</h3>}
            {subtitle && <p className="text-xs text-cyber-muted mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      {children}
    </div>
  );
};
