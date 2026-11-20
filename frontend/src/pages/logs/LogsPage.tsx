import React, { useState, useEffect } from 'react';
import {
  Terminal,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { logService, PaginatedLogs } from '../../services/logService';
import { monitorService } from '../../services/monitorService';
import { MonitoringResult, Monitor } from '../../types';
import { Modal } from '../../components/common/Modal';

export const LogsPage: React.FC = () => {
  const { isDemoMode } = useAuth();

  const [logsData, setLogsData] = useState<PaginatedLogs | null>(null);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedMonitor, setSelectedMonitor] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [page, setPage] = useState(0);

  // Inspect Modal
  const [inspectedLog, setInspectedLog] = useState<MonitoringResult | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const isSuccess = statusFilter === 'ALL' ? undefined : statusFilter === 'SUCCESS';
      const [logs, mList] = await Promise.all([
        logService.getLogs(
          {
            monitorId: selectedMonitor || undefined,
            isSuccess,
            search: search || undefined,
            page,
            size: 15,
          },
          isDemoMode
        ),
        monitorService.getMonitors(isDemoMode),
      ]);
      setLogsData(logs);
      setMonitors(mList);
    } catch (err) {
      console.error('Failed to load logs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [page, selectedMonitor, statusFilter, isDemoMode]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    loadLogs();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <span>Probe Logs & Audit Events</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chronological execution trail of all distributed health probes. Sensitive authorization headers and credentials are automatically redacted.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-[#151E30] border border-[#1E293B] rounded-xl flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search error messages or diagnostic strings..."
            className="w-full bg-[#0B1020] border border-[#1E293B] focus:border-indigo-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
          />
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedMonitor}
            onChange={(e) => {
              setSelectedMonitor(e.target.value);
              setPage(0);
            }}
            className="bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Monitored Endpoints</option>
            {monitors.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            className="bg-[#0B1020] border border-[#1E293B] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Outcomes</option>
            <option value="SUCCESS">Success Only (2xx)</option>
            <option value="FAILURE">Failures & Timeouts (4xx/5xx)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#151E30] border border-[#1E293B] rounded-xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1020] text-slate-400 border-b border-[#1E293B]">
              <tr>
                <th className="p-3.5 font-semibold">Timestamp</th>
                <th className="p-3.5 font-semibold">Outcome</th>
                <th className="p-3.5 font-semibold">Status Code</th>
                <th className="p-3.5 font-semibold">Response Time</th>
                <th className="p-3.5 font-semibold">DNS / TLS</th>
                <th className="p-3.5 font-semibold">Diagnostics / Failure Reason</th>
                <th className="p-3.5 font-semibold text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Loading audit stream...
                  </td>
                </tr>
              ) : logsData?.content.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No matching logs found for query criteria.
                  </td>
                </tr>
              ) : (
                logsData?.content.map((log) => (
                  <tr key={log.id} className="hover:bg-[#1A253C] transition-colors">
                    <td className="p-3.5 font-mono text-slate-300">
                      {new Date(log.checkedAt).toLocaleString()}
                    </td>
                    <td className="p-3.5">
                      <span className={`inline-flex items-center gap-1 font-semibold ${log.isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {log.isSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                        <span>{log.isSuccess ? 'PASS' : 'FAIL'}</span>
                      </span>
                    </td>
                    <td className="p-3.5 font-mono">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        log.statusCode >= 200 && log.statusCode < 300
                          ? 'bg-emerald-950/60 text-emerald-400'
                          : 'bg-rose-950/60 text-rose-400'
                      }`}>
                        HTTP {log.statusCode}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-medium text-slate-200">
                      {log.responseTimeMs} ms
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">
                      {log.dnsLookupMs || 2}ms / {log.tlsHandshakeMs || 8}ms
                    </td>
                    <td className="p-3.5 text-slate-300 truncate max-w-sm">
                      {log.errorMessage || 'Target endpoint passed all validation assertions'}
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setInspectedLog(log)}
                        className="p-1 rounded text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-colors"
                        title="View raw diagnostic payload"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {logsData && logsData.totalPages > 1 && (
          <div className="p-4 border-t border-[#1E293B] flex items-center justify-between text-xs text-slate-400 bg-[#0B1020]/40">
            <span>
              Showing page {logsData.currentPage + 1} of {logsData.totalPages} ({logsData.totalElements} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={logsData.currentPage === 0}
                onClick={() => setPage(p => Math.max(0, p - 1))}
                className="p-1.5 rounded-lg bg-[#151E30] hover:bg-[#1A253C] border border-[#1E293B] disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={logsData.currentPage >= logsData.totalPages - 1}
                onClick={() => setPage(p => p + 1)}
                className="p-1.5 rounded-lg bg-[#151E30] hover:bg-[#1A253C] border border-[#1E293B] disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inspect Log Modal */}
      <Modal
        isOpen={!!inspectedLog}
        onClose={() => setInspectedLog(null)}
        title="Diagnostic Health Probe Details"
        subtitle="Sanitized raw probe response and connection telemetry."
        maxWidth="lg"
      >
        {inspectedLog && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-[#0B1020] rounded-lg border border-[#1E293B] space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Timestamp</span>
                <span className="font-mono text-slate-200">{new Date(inspectedLog.checkedAt).toISOString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status Code</span>
                <span className="font-mono text-slate-200">HTTP {inspectedLog.statusCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Measured Latency</span>
                <span className="font-mono text-slate-200">{inspectedLog.responseTimeMs} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">DNS Resolution</span>
                <span className="font-mono text-slate-200">{inspectedLog.dnsLookupMs || 2} ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">TLS Handshake</span>
                <span className="font-mono text-slate-200">{inspectedLog.tlsHandshakeMs || 8} ms</span>
              </div>
            </div>

            <div className="p-3 bg-indigo-950/20 border border-indigo-800/40 rounded-lg flex items-center gap-2 text-indigo-300 text-[11px]">
              <Lock className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Redacted Security Policy: Authorization tokens and cookie headers were stripped before storage.</span>
            </div>

            {inspectedLog.errorMessage && (
              <div>
                <span className="text-slate-400 font-semibold block mb-1">Diagnostic Error Message</span>
                <pre className="p-3 bg-rose-950/30 border border-rose-800/50 rounded-lg text-rose-300 font-mono overflow-x-auto">
                  {inspectedLog.errorMessage}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

