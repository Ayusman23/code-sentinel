import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Trash2 } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { getAuditLogs } from '../../services/api';

export const LiveLogFeed = () => {
  const { latestAuditLogs } = useSocket();
  const [logs, setLogs] = useState([]);
  const logContainerRef = useRef(null);

  useEffect(() => {
    // Initial fetch of logs
    getAuditLogs({ limit: 30 })
      .then((data) => {
        if (data && data.length) setLogs(data);
      })
      .catch((e) => console.log('Audit log fetch offline:', e));
  }, []);

  // Prepend live socket logs
  useEffect(() => {
    if (latestAuditLogs.length > 0) {
      setLogs((prev) => {
        const newLogs = [...latestAuditLogs, ...prev];
        const unique = Array.from(new Map(newLogs.map(l => [l.timestamp + l.eventType, l])).values());
        return unique.slice(0, 50);
      });
    }
  }, [latestAuditLogs]);

  return (
    <div className="panel rounded p-4 font-mono">
      <div className="flex items-center justify-between border-b border-cyber-border pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyber-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyber-text">Live Telemetry & Audit Stream</h3>
          <span className="w-1.5 h-1.5 rounded-full bg-cyber-low animate-pulse-slow" />
        </div>
        <button
          onClick={() => setLogs([])}
          className="text-[11px] text-cyber-muted hover:text-cyber-text flex items-center gap-1 hover:bg-cyber-bg px-2 py-0.5 rounded border border-transparent hover:border-cyber-border transition-colors"
        >
          <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>

      <div
        ref={logContainerRef}
        className="h-64 overflow-y-auto space-y-2 pr-1 text-[11px] select-text"
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-cyber-faint">
            <Terminal className="w-5 h-5 mb-2 opacity-50" />
            <p>Listening for real-time audit telemetry events...</p>
          </div>
        ) : (
          logs.map((log, idx) => {
            const isSuccess = log.status === 'SUCCESS';
            const isWarn = log.status === 'WARNING';
            const isFail = log.status === 'FAILURE';

            const stateClass = isFail
              ? 'state-critical'
              : isWarn
              ? 'state-high'
              : 'state-low';

            const badgeColor = isFail
              ? 'text-cyber-critical bg-cyber-critical/10 border-cyber-critical/30'
              : isWarn
              ? 'text-cyber-high bg-cyber-high/10 border-cyber-high/30'
              : 'text-cyber-low bg-cyber-low/10 border-cyber-low/30';

            const timeStr = log.timestamp
              ? new Date(log.timestamp).toLocaleTimeString()
              : new Date().toLocaleTimeString();

            return (
              <div
                key={idx}
                className={`diff-card ${stateClass} p-2 rounded flex items-start gap-2`}
              >
                <span className="text-cyber-faint shrink-0 tabular-nums">[{timeStr}]</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] border font-bold uppercase shrink-0 ${badgeColor}`}>
                  {log.eventType}
                </span>
                <div className="flex-1 truncate">
                  <span className="text-cyber-text mr-2 font-medium">{log.repository || 'system'}</span>
                  <span className="text-cyber-muted font-mono text-[10px]">{JSON.stringify(log.details || {})}</span>
                </div>
                {log.latencyMs > 0 && (
                  <span className="text-[10px] text-cyber-faint shrink-0 tabular-nums">+{log.latencyMs}ms</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
