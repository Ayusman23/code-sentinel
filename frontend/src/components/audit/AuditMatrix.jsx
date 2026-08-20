import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, ShieldCheck, Download, RefreshCw } from 'lucide-react';
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
    <div className="space-y-6 font-mono">
      {/* Top Banner */}
      <div className="cyber-glass p-5 rounded-xl border border-cyber-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyber-accent" />
            Enterprise Compliance & Audit Telemetry Matrix
          </h3>
          <p className="text-xs text-cyber-muted mt-0.5">
            Immutable, zero-trust audit trail tracking webhook cryptographic verifications, AST runs, and secret neutralization.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportAuditJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-dark text-xs text-cyber-accent border border-cyber-border/30 hover:border-cyber-accent transition"
          >
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
          <button
            onClick={fetchLogs}
            className="p-2 rounded-lg bg-cyber-dark text-cyber-muted hover:text-white border border-cyber-border/30 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
        {eventTypes.map((et) => (
          <button
            key={et}
            onClick={() => setFilterType(et)}
            className={`px-3 py-1 rounded-lg text-xs transition whitespace-nowrap border ${
              filterType === et
                ? 'bg-cyber-accent text-cyber-dark font-bold border-cyber-accent'
                : 'bg-cyber-card text-cyber-muted hover:text-white border-cyber-border/30'
            }`}
          >
            {et}
          </button>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="cyber-glass rounded-xl border border-cyber-border/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cyber-dark/90 border-b border-cyber-border/40 text-cyber-muted uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Event Type</th>
                <th className="p-3.5">Target Repository</th>
                <th className="p-3.5">Actor / Pipeline</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Latency</th>
                <th className="p-3.5">Audit Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/20 text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-cyber-muted">
                    No compliance audit logs matching current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-cyber-cardHover/50 transition-colors">
                    <td className="p-3.5 text-cyber-muted whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Just now'}
                    </td>
                    <td className="p-3.5 font-bold text-cyber-accent whitespace-nowrap">
                      {log.eventType}
                    </td>
                    <td className="p-3.5 text-white whitespace-nowrap">
                      {log.repository || 'system'}
                      {log.prNumber ? ` #${log.prNumber}` : ''}
                    </td>
                    <td className="p-3.5 text-slate-400 whitespace-nowrap">
                      {log.actor || 'CodeSentinel System'}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <CyberBadge variant={log.status === 'SUCCESS' ? 'COMPLETED' : 'CRITICAL'} size="xs">
                        {log.status || 'SUCCESS'}
                      </CyberBadge>
                    </td>
                    <td className="p-3.5 text-cyber-muted whitespace-nowrap">
                      {log.latencyMs ? `+${log.latencyMs}ms` : '0ms'}
                    </td>
                    <td className="p-3.5 text-slate-400 max-w-xs truncate">
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
