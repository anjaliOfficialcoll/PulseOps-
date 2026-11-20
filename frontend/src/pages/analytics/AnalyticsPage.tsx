import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { analyticsService, AnalyticsSummary } from '../../services/analyticsService';
import { monitorService } from '../../services/monitorService';
import { Monitor } from '../../types';
import { MetricCard } from '../../components/common/MetricCard';
import { LatencyLineChart } from '../../components/charts/LatencyLineChart';
import { UptimeBarChart } from '../../components/charts/UptimeBarChart';

export const AnalyticsPage: React.FC = () => {
  const { isDemoMode } = useAuth();
  const [period, setPeriod] = useState<'24h' | '7d' | '30d'>('7d');
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [aData, mList] = await Promise.all([
          analyticsService.getAnalytics(period, isDemoMode),
          monitorService.getMonitors(isDemoMode),
        ]);
        setAnalytics(aData);
        setMonitors(mList);
      } catch (err) {
        console.error('Failed to load analytics', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [period, isDemoMode]);

  const handleExportCsv = async () => {
    setIsExporting(true);
    try {
      if (isDemoMode) {
        // Generate client-side CSV download
        const headers = 'Timestamp,Endpoint,StatusCode,LatencyMs,Status\n';
        const rows = monitors.map(m => `${new Date().toISOString()},"${m.name}",${m.status === 'DOWN' ? 504 : 200},${m.avgResponseTimeMs || 42},${m.status}`).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pulseops-sla-report-${period}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const csv = await analyticsService.exportReportCsv(period);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pulseops-sla-report-${period}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading || !analytics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-[#151E30] rounded w-48" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-[#151E30] rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-[#151E30] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Fleet Analytics & SLA Compliance</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Aggregated uptime calculations, latency percentiles (P50, P95, P99), and exportable SLA audit reports.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Period selector */}
          <div className="flex items-center p-1 bg-[#151E30] border border-[#1E293B] rounded-lg">
            {(['24h', '7d', '30d'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                  period === p ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-200 bg-[#151E30] hover:bg-[#1A253C] border border-[#1E293B] rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* SLA Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="SLA Availability"
          value={`${analytics.uptimePercentage}%`}
          change="+0.02% vs SLA"
          isPositive={analytics.uptimePercentage >= 99.9}
          icon={TrendingUp}
          statusColor="emerald"
        />
        <MetricCard
          title="Fleet Avg Latency"
          value={analytics.avgResponseTimeMs}
          unit="ms"
          subtext="Computed across all probes"
          icon={Clock}
          statusColor="cyan"
        />
        <MetricCard
          title="P95 / P99 Latency"
          value={`${analytics.p95ResponseTimeMs} / ${analytics.p99ResponseTimeMs}`}
          unit="ms"
          subtext="Tail-latency distribution"
          icon={Activity}
          statusColor="indigo"
        />
        <MetricCard
          title="Failure Rate"
          value={`${analytics.failureRatePercent}%`}
          subtext={`From ${analytics.totalChecks.toLocaleString()} total probes`}
          icon={AlertTriangle}
          statusColor={analytics.failureRatePercent > 1.0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Latency Percentiles Chart */}
      <div className="p-6 rounded-xl bg-[#151E30] border border-[#1E293B]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Response Time Telemetry (Avg vs P95 vs P99)</h3>
            <p className="text-xs text-slate-400 mt-0.5">High-percentile tail latency detection across fleet probes</p>
          </div>
        </div>
        <LatencyLineChart data={analytics.latencyTrends} height={280} showPercentiles={true} />
      </div>

      {/* Historical Uptime Bar Chart */}
      <div className="p-6 rounded-xl bg-[#151E30] border border-[#1E293B]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Daily Fleet Availability Trend</h3>
            <p className="text-xs text-slate-400 mt-0.5">Rolling daily availability percentage</p>
          </div>
        </div>
        <UptimeBarChart data={analytics.uptimeTrends} height={220} />
      </div>

      {/* Endpoint Comparison Breakdown Table */}
      <div className="p-6 rounded-xl bg-[#151E30] border border-[#1E293B]">
        <h3 className="text-sm font-semibold text-slate-100 mb-4">Endpoint Performance Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0B1020] text-slate-400 border-b border-[#1E293B]">
              <tr>
                <th className="p-3 font-semibold">Monitor</th>
                <th className="p-3 font-semibold">Environment</th>
                <th className="p-3 font-semibold">24h Uptime</th>
                <th className="p-3 font-semibold">7d Uptime</th>
                <th className="p-3 font-semibold">Avg Latency</th>
                <th className="p-3 font-semibold">P95 Latency</th>
                <th className="p-3 font-semibold">P99 Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E293B]">
              {monitors.map((m) => (
                <tr key={m.id} className="hover:bg-[#1A253C] transition-colors">
                  <td className="p-3 font-semibold text-slate-200">{m.name}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                      {m.environment}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-emerald-400">{m.uptime24h || 100}%</td>
                  <td className="p-3 text-slate-300">{m.uptime7d || 99.9}%</td>
                  <td className="p-3 font-mono text-slate-200">{m.avgResponseTimeMs || 42} ms</td>
                  <td className="p-3 font-mono text-cyan-400">{m.p95ResponseTimeMs || 78} ms</td>
                  <td className="p-3 font-mono text-amber-400">{m.p99ResponseTimeMs || 115} ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

