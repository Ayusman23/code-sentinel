import React, { useState, useEffect } from 'react';
import { ShieldCheck, Download, RefreshCw } from 'lucide-react';
import { getAuditLogs } from '../../services/api';
import { CyberBadge } from '../common/CyberBadge';

export const AuditMatrix = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('ALL');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs({ limit: 100 });
      setLogs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const eventTypes = ['ALL', 'WEBHOOK_INGESTED', 'SECRET_INTERCEPTED', 'AST_TRAVERSAL_COMPLETED', 'RBAC_VERIFIED', 'BLAST_RADIUS_COMPUTED', 'GITHUB_CHECK_POSTED'];

  const filteredLogs = logs.filter((l) => {
    return filterType === 'ALL' || l.eventType === filterType;
  });

  const exportAuditJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `codesentinel-audit-trail-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Top Banner */}
      <div className="panel p-4 rounded border border-cyber-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-bold text-cyber-text flex items-center gap-2 uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-cyber-accent" />
            Enterprise Compliance & Audit Telemetry Matrix
          </h3>
          <p className="text-xs text-cyber-muted mt-0.5">
            Immutable, zero-trust audit trail tracking webhook cryptographic verifications, AST runs, and secret neutralization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportAuditJSON}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyber-bg text-xs text-cyber-accent border border-cyber-border hover:border-cyber-accent transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
          <button
            onClick={fetchLogs}
            aria-label="Refresh audit logs"
            className="p-1.5 rounded bg-cyber-bg text-cyber-muted hover:text-cyber-text border border-cyber-border transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {eventTypes.map((et) => (
          <button
            key={et}
            onClick={() => setFilterType(et)}
            className={`px-2.5 py-1 rounded text-xs transition-colors whitespace-nowrap border ${
              filterType === et
                ? 'bg-cyber-card text-cyber-accent font-medium border-cyber-accent'
                : 'bg-cyber-bg text-cyber-muted hover:text-cyber-text border-cyber-border'
            }`}
          >
            {et}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="panel rounded border border-cyber-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cyber-bg border-b border-cyber-border text-cyber-muted uppercase text-[10px]">
              <tr>
                <th className="p-3 font-semibold">Timestamp</th>
                <th className="p-3 font-semibold">Event Type</th>
                <th className="p-3 font-semibold">Target Repository</th>
                <th className="p-3 font-semibold">Actor / Pipeline</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Latency</th>
                <th className="p-3 font-semibold">Audit Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border text-cyber-text">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-cyber-muted">
                    No compliance audit logs matching current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-cyber-cardHover/50 transition-colors">
                    <td className="p-3 text-cyber-faint whitespace-nowrap tabular-nums">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                    </td>
                    <td className="p-3 font-medium text-cyber-accent whitespace-nowrap">
                      {log.eventType}
                    </td>
                    <td className="p-3 text-cyber-text whitespace-nowrap">
                      {log.repository || 'system'}
                      {log.prNumber ? ` #${log.prNumber}` : ''}
                    </td>
                    <td className="p-3 text-cyber-muted whitespace-nowrap">
                      {log.actor || 'CodeSentinel System'}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <CyberBadge variant={log.status === 'SUCCESS' ? 'COMPLETED' : 'CRITICAL'} size="xs">
                        {log.status || 'SUCCESS'}
                      </CyberBadge>
                    </td>
                    <td className="p-3 text-cyber-faint whitespace-nowrap tabular-nums">
                      {log.latencyMs ? `+${log.latencyMs}ms` : '0ms'}
                    </td>
                    <td className="p-3 text-cyber-muted max-w-xs truncate text-[11px]">
                      <code>{JSON.stringify(log.details || {})}</code>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
