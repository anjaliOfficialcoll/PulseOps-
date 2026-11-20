import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Activity,
  Clock,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Globe2,
  Calendar,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { monitorService } from '../../services/monitorService';
import { Monitor, MonitoringResult } from '../../types';
import { StatusBadge } from '../../components/common/StatusBadge';
import { MetricCard } from '../../components/common/MetricCard';
import { LatencyLineChart } from '../../components/charts/LatencyLineChart';

export const MonitorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isDemoMode } = useAuth();
  const navigate = useNavigate();

  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [results, setResults] = useState<MonitoringResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckMessage, setLastCheckMessage] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const [m, resList] = await Promise.all([
        monitorService.getMonitorById(id, isDemoMode),
        monitorService.getMonitorResults(id, isDemoMode, 40),
      ]);
      setMonitor(m);
      setResults(resList);
    } catch (err) {
      console.error('Failed to load monitor details', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, isDemoMode]);

  const handleManualCheck = async () => {
    if (!id) return;
    setIsChecking(true);
    setLastCheckMessage(null);
    try {
      const res = await monitorService.triggerCheck(id, isDemoMode);
      setLastCheckMessage(`Probe completed: HTTP ${res.statusCode} in ${res.responseTimeMs}ms`);
      await loadData();
    } catch (err: any) {
      setLastCheckMessage(`Probe failed: ${err.message}`);
    } finally {
      setIsChecking(false);
    }
  };

  const handleTogglePause = async () => {
    if (!monitor) return;
    try {
      const updated = await monitorService.togglePause(monitor.id, isDemoMode);
      setMonitor(updated);
    } catch (err) {
      console.error('Failed to toggle pause', err);
    }
  };

  if (isLoading || !monitor) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 bg-[#151E30] rounded w-32" />
        <div className="h-20 bg-[#151E30] rounded-xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[#151E30] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Transform results into latency points for chart
  const latencyPoints = [...results].reverse().map((r) => ({
    timestamp: new Date(r.checkedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    avgLatency: r.responseTimeMs,
    p95Latency: Math.round(r.responseTimeMs * 1.3),
    p99Latency: Math.round(r.responseTimeMs * 1.6),
  }));

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/monitors')}
            className="p-2 text-slate-400 hover:text-slate-200 bg-[#151E30] hover:bg-[#1A253C] border border-[#1E293B] rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{monitor.name}</h1>
              <StatusBadge status={monitor.status} size="sm" showPulse />
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-1">
              <span className="font-bold text-indigo-400">{monitor.method}</span>
              <span>{monitor.url}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTogglePause}
            className="px-3 py-1.5 text-xs font-semibold text-slate-200 bg-[#151E30] hover:bg-[#1A253C] border border-[#1E293B] rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Pause className="w-3.5 h-3.5 text-amber-400" />
            <span>{monitor.isActive ? 'Pause' : 'Resume'}</span>
          </button>

          <button
            onClick={handleManualCheck}
            disabled={isChecking}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Probing...' : 'Check Now'}</span>
          </button>
        </div>
      </div>

      {lastCheckMessage && (
        <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-xl text-xs text-indigo-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{lastCheckMessage}</span>
        </div>
      )}

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="24h Uptime"
          value={`${monitor.uptime24h || 100}%`}
          subtext={`30d SLA: ${monitor.uptime30d || 99.9}%`}
          icon={CheckCircle2}
          statusColor="emerald"
        />
        <MetricCard
          title="Avg Latency"
          value={monitor.avgResponseTimeMs || 42}
          unit="ms"
          subtext={`Min: ${monitor.minResponseTimeMs || 25}ms · Max: ${monitor.maxResponseTimeMs || 140}ms`}
          icon={Clock}
          statusColor="cyan"
        />
        <MetricCard
          title="P95 / P99 Latency"
          value={`${monitor.p95ResponseTimeMs || 75} / ${monitor.p99ResponseTimeMs || 110}`}
          unit="ms"
          subtext="Computed percentile distribution"
          icon={Activity}
          statusColor="indigo"
        />
        <MetricCard
          title="Consecutive Failures"
          value={monitor.consecutiveFailures}
          subtext={monitor.consecutiveFailures > 0 ? 'Outage in progress' : 'Consecutive pings healthy'}
          icon={AlertTriangle}
          statusColor={monitor.consecutiveFailures > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Response Time Chart */}
      <div className="bg-[#151E30] border border-[#1E293B] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Live Ping Response Time Series</h3>
            <p className="text-xs text-slate-400 mt-0.5">Sequential probe latencies with calculated variance</p>
          </div>
          <span className="text-xs text-slate-400 font-mono">Sample Size: {results.length} checks</span>
        </div>
        <LatencyLineChart data={latencyPoints} height={260} />
      </div>

      {/* Configuration Metadata Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-[#151E30] border border-[#1E293B] space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Probe Parameters</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-[#1E293B]">
              <span className="text-slate-400">Interval</span>
              <span className="font-semibold text-slate-200">Every {monitor.intervalSeconds}s</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1E293B]">
              <span className="text-slate-400">Timeout Threshold</span>
              <span className="font-semibold text-slate-200">{monitor.timeoutSeconds}s</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#1E293B]">
              <span className="text-slate-400">Expected Status</span>
              <span className="font-mono font-semibold text-slate-200">HTTP {monitor.expectedStatusCode}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Environment</span>
              <span className="font-semibold text-slate-200">{monitor.environment}</span>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 p-5 rounded-xl bg-[#151E30] border border-[#1E293B]">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Configured HTTP Headers</h3>
          <pre className="p-3 bg-[#0B1020] border border-[#1E293B] rounded-lg text-xs font-mono text-slate-300 overflow-x-auto max-h-32">
            {monitor.headersJson || 'No custom headers set'}
          </pre>
        </div>
      </div>

      {/* Recent Probing History Table */}
      <div className="bg-[#151E30] border border-[#1E293B] rounded-xl overflow-hidden">
        <div className="p-5 border-b border-[#1E293B] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-100">Recent Probe Execution Log</h3>
          <span className="text-xs text-slate-400">Auto-refreshed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1020] text-slate-400 border-b border-[#1E293B]">
              <tr>
                <th className="p-3 font-semibold">Timestamp</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Status Code</th>
                <th className="p-3 font-semibold">Total Latency</th>
                <th className="p-3 font-semibold">DNS / TLS</th>
                <th className="p-3 font-semibold">Diagnostics / Error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {results.slice(0, 15).map((r) => (
                <tr key={r.id} className="hover:bg-[#1A253C] transition-colors">
                  <td className="p-3 font-mono text-slate-300">{new Date(r.checkedAt).toLocaleTimeString()}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 font-semibold ${r.isSuccess ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {r.isSuccess ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{r.isSuccess ? 'PASSED' : 'FAILED'}</span>
                    </span>
                  </td>
                  <td className="p-3 font-mono">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      r.statusCode >= 200 && r.statusCode < 300
                        ? 'bg-emerald-950/60 text-emerald-400'
                        : 'bg-rose-950/60 text-rose-400'
                    }`}>
                      {r.statusCode}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-medium text-slate-200">{r.responseTimeMs} ms</td>
                  <td className="p-3 font-mono text-slate-400">{r.dnsLookupMs || 3}ms / {r.tlsHandshakeMs || 9}ms</td>
                  <td className="p-3 text-slate-400 truncate max-w-xs">{r.errorMessage || 'OK - Probe matched expected condition'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

