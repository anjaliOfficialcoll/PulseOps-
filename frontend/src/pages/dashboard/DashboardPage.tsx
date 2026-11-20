import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
  AlertOctagon,
  Flame,
  ArrowUpRight,
  TrendingUp,
  RefreshCw,
  Plus,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Play
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { monitorService } from '../../services/monitorService';
import { analyticsService, AnalyticsSummary } from '../../services/analyticsService';
import { DashboardMetrics, Monitor, Incident } from '../../types';
import { MetricCard } from '../../components/common/MetricCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { LatencyLineChart } from '../../components/charts/LatencyLineChart';
import { UptimeBarChart } from '../../components/charts/UptimeBarChart';
import { StatusPieChart } from '../../components/charts/StatusPieChart';

export const DashboardPage: React.FC = () => {
  const { isDemoMode } = useAuth();
  const navigate = useNavigate();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [checkingMonitorId, setCheckingMonitorId] = useState<string | null>(null);

  const loadData = async (refreshOnly = false) => {
    if (refreshOnly) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [metricsData, analyticsData, monitorsList] = await Promise.all([
        monitorService.getDashboardMetrics(isDemoMode),
        analyticsService.getAnalytics('7d', isDemoMode),
        monitorService.getMonitors(isDemoMode),
      ]);
      setMetrics(metricsData);
      setAnalytics(analyticsData);
      setMonitors(monitorsList);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isDemoMode]);

  const handleManualCheck = async (e: React.MouseEvent, monitorId: string) => {
    e.stopPropagation();
    setCheckingMonitorId(monitorId);
    try {
      await monitorService.triggerCheck(monitorId, isDemoMode);
      await loadData(true);
    } catch (err) {
      console.error('Manual check failed', err);
    } finally {
      setCheckingMonitorId(null);
    }
  };

  if (isLoading || !metrics) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-[#151E30] rounded-lg w-48" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 bg-[#151E30] rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-[#151E30] rounded-xl" />
          <div className="h-64 bg-[#151E30] rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Observability Overview</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium">
              Live Fleet
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time API health status, outage response metrics, and fleet latency telemetry.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => loadData(true)}
            disabled={isRefreshing}
            className="p-2 text-slate-300 bg-[#151E30] hover:bg-[#1A253C] border border-[#1E293B] rounded-lg transition-colors"
            title="Refresh dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <Link
            to="/monitors"
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Monitor</span>
          </Link>
        </div>
      </div>

      {/* 8 Primary Dashboard Widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Monitors"
          value={metrics.totalMonitors}
          subtext="Active endpoints registered"
          icon={Activity}
          statusColor="indigo"
        />
        <MetricCard
          title="Operational APIs"
          value={metrics.operationalCount}
          subtext="Passing all probes"
          icon={CheckCircle2}
          statusColor="emerald"
        />
        <MetricCard
          title="Degraded APIs"
          value={metrics.degradedCount}
          subtext="High latency / transient issues"
          icon={AlertTriangle}
          statusColor="amber"
        />
        <MetricCard
          title="Down APIs"
          value={metrics.downCount}
          subtext="Service unreachable"
          icon={XCircle}
          statusColor="rose"
        />
        <MetricCard
          title="Overall Uptime (24h)"
          value={`${metrics.overallUptimePercent}%`}
          change="+0.04% SLA"
          isPositive={metrics.overallUptimePercent >= 99.9}
          icon={TrendingUp}
          statusColor="emerald"
        />
        <MetricCard
          title="Avg Response Time"
          value={metrics.avgResponseTimeMs}
          unit="ms"
          subtext="Fleet-wide median latency"
          icon={Clock}
          statusColor="cyan"
        />
        <MetricCard
          title="Total Incidents"
          value={metrics.totalIncidents}
          subtext="Logged in history"
          icon={AlertOctagon}
          statusColor="indigo"
        />
        <MetricCard
          title="Active Incidents"
          value={metrics.activeIncidents}
          subtext={metrics.activeIncidents > 0 ? 'Requires attention' : 'All systems normal'}
          icon={Flame}
          statusColor={metrics.activeIncidents > 0 ? 'rose' : 'emerald'}
        />
      </div>

      {/* Telemetry Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latency Trends (2 Columns) */}
        <div className="lg:col-span-2 bg-[#151E30] border border-[#1E293B] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">API Response Time Telemetry (24h)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Fleet average, P95 and P99 percentiles across probe pings</p>
            </div>
            <Link to="/analytics" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium">
              <span>Detailed view</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {analytics?.latencyTrends && (
            <LatencyLineChart data={analytics.latencyTrends} height={260} />
          )}
        </div>

        {/* Fleet Status Breakdown (1 Column) */}
        <div className="bg-[#151E30] border border-[#1E293B] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Fleet Status Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Real-time breakdown of API health states</p>
          </div>
          <div className="my-auto py-2">
            <StatusPieChart
              operational={metrics.operationalCount}
              degraded={metrics.degradedCount}
              down={metrics.downCount}
              height={180}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 pt-4 border-t border-[#1E293B] text-center text-xs">
            <div>
              <div className="text-emerald-400 font-bold">{metrics.operationalCount}</div>
              <div className="text-[10px] text-slate-400">Healthy</div>
            </div>
            <div>
              <div className="text-amber-400 font-bold">{metrics.degradedCount}</div>
              <div className="text-[10px] text-slate-400">Degraded</div>
            </div>
            <div>
              <div className="text-rose-400 font-bold">{metrics.downCount}</div>
              <div className="text-[10px] text-slate-400">Down</div>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Uptime Trend */}
      <div className="bg-[#151E30] border border-[#1E293B] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Daily Fleet Uptime Percentage</h3>
            <p className="text-xs text-slate-400 mt-0.5">7-day rolling availability percentage calculated from raw checks</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> &gt;=99.9%
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> 99.0 - 99.8%
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> &lt;99.0%
            </span>
          </div>
        </div>
        {analytics?.uptimeTrends && <UptimeBarChart data={analytics.uptimeTrends} height={200} />}
      </div>

      {/* Current API Status Table & Recent Incidents Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monitors Status Table (2 Columns) */}
        <div className="lg:col-span-2 bg-[#151E30] border border-[#1E293B] rounded-xl overflow-hidden flex flex-col">
          <div className="p-5 border-b border-[#1E293B] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Current API Fleet Status</h3>
              <p className="text-xs text-slate-400 mt-0.5">Live probe metrics with instant manual ping trigger</p>
            </div>
            <Link to="/monitors" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1">
              <span>View all ({monitors.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#1E293B] overflow-x-auto">
            {monitors.slice(0, 5).map((m) => (
              <div
                key={m.id}
                onClick={() => navigate(`/monitors/${m.id}`)}
                className="p-4 hover:bg-[#1A253C] transition-colors cursor-pointer flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-[200px]">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                    {m.method}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-slate-200 hover:text-indigo-400 transition-colors truncate max-w-[220px]">
                      {m.name}
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono truncate max-w-[240px]">
                      {m.url}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-5">
                  <div className="text-right hidden sm:block">
                    <div className="text-[11px] text-slate-400">Response</div>
                    <div className="text-xs font-mono font-semibold text-slate-200">
                      {m.status === 'DOWN' ? 'Timeout' : `${m.avgResponseTimeMs || 45}ms`}
                    </div>
                  </div>

                  <div className="text-right hidden sm:block">
                    <div className="text-[11px] text-slate-400">Uptime (24h)</div>
                    <div className="text-xs font-semibold text-slate-200">{m.uptime24h || 100}%</div>
                  </div>

                  <StatusBadge status={m.status} size="sm" showPulse />

                  {/* Manual Health Probe Button */}
                  <button
                    onClick={(e) => handleManualCheck(e, m.id)}
                    disabled={checkingMonitorId === m.id}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 border border-transparent hover:border-indigo-500/30 transition-all"
                    title="Execute instant health check"
                  >
                    <Play className={`w-3.5 h-3.5 ${checkingMonitorId === m.id ? 'animate-spin text-indigo-400' : ''}`} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Incidents & Slowest Endpoints (1 Column) */}
        <div className="space-y-6">
          {/* Recent Outages / Incidents */}
          <div className="bg-[#151E30] border border-[#1E293B] rounded-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E293B] mb-3">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span>Recent Incidents</span>
              </h3>
              <Link to="/incidents" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                View all
              </Link>
            </div>

            <div className="space-y-3">
              {metrics.recentIncidents.slice(0, 3).map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => navigate(`/incidents/${inc.id}`)}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-200 truncate">{inc.title}</span>
                    <StatusBadge status={inc.status} size="sm" />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>Severity: <strong className="text-amber-400">{inc.severity}</strong></span>
                    <span>{new Date(inc.startedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Slowest Monitored APIs */}
          <div className="bg-[#151E30] border border-[#1E293B] rounded-xl p-5">
            <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Highest Latency Endpoints</span>
            </h3>

            <div className="space-y-2.5">
              {metrics.slowestMonitors.slice(0, 3).map((slow) => (
                <div key={slow.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/40 border border-slate-800">
                  <span className="text-slate-300 truncate max-w-[170px]">{slow.name}</span>
                  <span className="font-mono font-semibold text-amber-400">
                    {slow.avgResponseTimeMs ? `${slow.avgResponseTimeMs}ms` : 'Timeout'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

