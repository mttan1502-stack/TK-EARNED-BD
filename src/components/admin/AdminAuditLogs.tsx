import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { AuditLog } from '../../types/index.js';
import { ShieldCheck, History, Sparkles, Filter, Search } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch('/api/admin/audit-logs', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs || []);
        }
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLogs();
  }, [token]);

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    return (
      log.actor.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      (log.targetId && log.targetId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            System Security & Financial Audit Logs
            <Sparkles className="w-5 h-5 text-amber-400" />
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Immutable log trail of all financial balance adjustments, withdrawal approvals/refunds, user status updates, and admin actions.
          </p>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search action, actor, or details..."
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading audit trail...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No logs found matching query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target ID</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-sans font-semibold text-white">{log.actor}</span>
                      <span className="ml-1.5 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {log.actorRole}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-purple-300 font-bold">{log.action}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {log.targetId ? `#${log.targetId.slice(-6)}` : '—'}
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-300 max-w-md">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
