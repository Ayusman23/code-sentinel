import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Shield, RefreshCw, Trash2 } from 'lucide-react';
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
    <div className="cyber-glass rounded-xl p-5 border border-cyber-border/40 font-mono">
      <div className="flex items-center justify-between border-b border-cyber-border/40 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyber-accent" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-white">Live Telemetry & Audit Stream</h3>
          <span className="w-2 h-2 rounded-full bg-cyber-accent animate-ping" />
        </div>
        <button
          onClick={() => setLogs([])}
          className="text-[11px] text-cyber-muted hover:text-white flex items-center gap-1 hover:bg-cyber-dark px-2 py-1 rounded transition"
        >
          <Trash2 className="w-3 h-3" /> Clear
        </button>
      </div>

      <div
        ref={logContainerRef}
        className="h-64 overflow-y-auto space-y-2 pr-1 text-[11px] select-text"
      >
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-cyber-muted opacity-50">
            <Terminal className="w-6 h-6 mb-2" />
            <p>Listening for real-time audit telemetry events...</p>
          </div>
        ) : (
          logs.map((log, idx) => {
            const isSuccess = log.status === 'SUCCESS';
            const isWarn = log.status === 'WARNING';
            const isFail = log.status === 'FAILURE';

            const statusColor = isFail
              ? 'text-red-400 bg-red-500/10 border-red-500/30'
              : isWarn
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
              : 'text-cyber-accent bg-cyber-accent/10 border-cyber-accent/30';

            const timeStr = log.timestamp
              ? new Date(log.timestamp).toLocaleTimeString()
              : new Date().toLocaleTimeString();

            return (
              <div
                key={idx}
                className="p-2 rounded bg-cyber-dark/70 border border-cyber-border/20 flex items-start gap-2.5 hover:border-cyber-border/50 transition-colors"
              >
                <span className="text-cyber-muted shrink-0">[{timeStr}]</span>
                <span className={`px-1.5 py-0.2 rounded text-[9px] border font-bold uppercase shrink-0 ${statusColor}`}>
                  {log.eventType}
                </span>
                <div className="flex-1 truncate">
                  <span className="text-slate-300 mr-2">{log.repository || 'system'}</span>
                  <span className="text-cyber-muted">{JSON.stringify(log.details || {})}</span>
                </div>
                {log.latencyMs > 0 && (
                  <span className="text-[10px] text-cyber-muted shrink-0">+{log.latencyMs}ms</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
