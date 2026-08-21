import React from 'react';

export const CyberCard = ({ children, className = '', title, subtitle, action }) => {
  return (
    <div className={`panel panel-hover rounded p-5 transition-colors duration-150 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between border-b border-cyber-border pb-3 mb-4">
          <div>
            {title && <h3 className="text-sm font-semibold text-cyber-text font-mono tracking-wide flex items-center gap-2">{title}</h3>}
            {subtitle && <p className="text-xs text-cyber-muted mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      {children}
    </div>
  );
};
