import apiClient from './api';
import { Monitor, MonitoringResult, DashboardMetrics } from '../types';
import { DEMO_MONITORS, DEMO_INCIDENTS, DEMO_NOTIFICATIONS, generateHistoricalResults } from './demoData';

let localDemoMonitors = [...DEMO_MONITORS];

export const monitorService = {
  async getMonitors(isDemo = false, projectId?: string): Promise<Monitor[]> {
    if (isDemo) {
      return projectId ? localDemoMonitors.filter(m => m.projectId === projectId) : [...localDemoMonitors];
    }
    const params = projectId ? { projectId } : {};
    const res = await apiClient.get<Monitor[]>('/monitors', { params });
    return res.data;
  },

  async getMonitorById(id: string, isDemo = false): Promise<Monitor> {
    if (isDemo) {
      const found = localDemoMonitors.find(m => m.id === id);
      if (!found) throw new Error('Monitor not found');
      return { ...found };
    }
    const res = await apiClient.get<Monitor>(`/monitors/${id}`);
    return res.data;
  },

  async createMonitor(data: Partial<Monitor>, isDemo = false): Promise<Monitor> {
    if (isDemo) {
      const newMon: Monitor = {
        id: `mon-${Date.now()}`,
        organizationId: 'org-demo',
        projectId: data.projectId || 'proj-1',
        projectName: data.projectId === 'proj-2' ? 'Payments & Billing' : 'Core Infrastructure',
        name: data.name || 'New API Monitor',
        url: data.url || 'https://api.example.com/health',
        method: data.method || 'GET',
        expectedStatusCode: data.expectedStatusCode || 200,
        intervalSeconds: data.intervalSeconds || 60,
        timeoutSeconds: data.timeoutSeconds || 5,
        headersJson: data.headersJson,
        body: data.body,
        environment: data.environment || 'PRODUCTION',
        isActive: true,
        status: 'OPERATIONAL',
        lastCheckedAt: new Date().toISOString(),
        consecutiveFailures: 0,
        uptime24h: 100.0,
        uptime7d: 100.0,
        uptime30d: 100.0,
        avgResponseTimeMs: 65,
        minResponseTimeMs: 40,
        maxResponseTimeMs: 120,
        p95ResponseTimeMs: 90,
        p99ResponseTimeMs: 110,
        totalChecks: 1,
        successfulChecks: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localDemoMonitors = [newMon, ...localDemoMonitors];
      return newMon;
    }
    const res = await apiClient.post<Monitor>('/monitors', data);
    return res.data;
  },

  async updateMonitor(id: string, data: Partial<Monitor>, isDemo = false): Promise<Monitor> {
    if (isDemo) {
      localDemoMonitors = localDemoMonitors.map(m => m.id === id ? { ...m, ...data, updatedAt: new Date().toISOString() } : m);
      return localDemoMonitors.find(m => m.id === id)!;
    }
    const res = await apiClient.put<Monitor>(`/monitors/${id}`, data);
    return res.data;
  },

  async deleteMonitor(id: string, isDemo = false): Promise<void> {
    if (isDemo) {
      localDemoMonitors = localDemoMonitors.filter(m => m.id !== id);
      return;
    }
    await apiClient.delete(`/monitors/${id}`);
  },

  async togglePause(id: string, isDemo = false): Promise<Monitor> {
    if (isDemo) {
      const mon = localDemoMonitors.find(m => m.id === id);
      if (!mon) throw new Error('Monitor not found');
      const updated: Monitor = {
        ...mon,
        isActive: !mon.isActive,
        status: !mon.isActive ? 'OPERATIONAL' : 'PAUSED',
        updatedAt: new Date().toISOString(),
      };
      localDemoMonitors = localDemoMonitors.map(m => m.id === id ? updated : m);
      return updated;
    }
    const res = await apiClient.post<Monitor>(`/monitors/${id}/toggle-pause`);
    return res.data;
  },

  async triggerCheck(id: string, isDemo = false): Promise<MonitoringResult> {
    if (isDemo) {
      const mon = localDemoMonitors.find(m => m.id === id);
      const isSuccess = mon?.status !== 'DOWN';
      const statusCode = isSuccess ? 200 : 504;
      const responseTime = isSuccess ? Math.floor(35 + Math.random() * 40) : 10000;
      const result: MonitoringResult = {
        id: `res-manual-${Date.now()}`,
        monitorId: id,
        monitorName: mon?.name,
        statusCode,
        responseTimeMs: responseTime,
        isSuccess,
        errorMessage: isSuccess ? undefined : 'Connection timed out',
        checkedAt: new Date().toISOString(),
        dnsLookupMs: 4,
        tlsHandshakeMs: 12,
      };
      return result;
    }
    const res = await apiClient.post<MonitoringResult>(`/monitors/${id}/check-now`);
    return res.data;
  },

  async getMonitorResults(id: string, isDemo = false, limit = 50): Promise<MonitoringResult[]> {
    if (isDemo) {
      return generateHistoricalResults(id, limit);
    }
    const res = await apiClient.get<MonitoringResult[]>(`/monitors/${id}/results`, { params: { limit } });
    return res.data;
  },

  async getDashboardMetrics(isDemo = false): Promise<DashboardMetrics> {
    if (isDemo) {
      const monitors = localDemoMonitors;
      const opCount = monitors.filter(m => m.status === 'OPERATIONAL').length;
      const degCount = monitors.filter(m => m.status === 'DEGRADED').length;
      const downCount = monitors.filter(m => m.status === 'DOWN').length;

      const totalUptime = monitors.reduce((acc, m) => acc + (m.uptime24h || 100), 0);
      const avgUptime = monitors.length > 0 ? Number((totalUptime / monitors.length).toFixed(2)) : 100;

      const totalLatency = monitors.reduce((acc, m) => acc + (m.avgResponseTimeMs || 0), 0);
      const avgLatency = monitors.length > 0 ? Math.round(totalLatency / monitors.length) : 0;

      const slowest = [...monitors].sort((a, b) => (b.avgResponseTimeMs || 0) - (a.avgResponseTimeMs || 0)).slice(0, 5);
      const recentResults = generateHistoricalResults('mon-101', 10);

      return {
        totalMonitors: monitors.length,
        operationalCount: opCount,
        degradedCount: degCount,
        downCount: degCount,
        overallUptimePercent: avgUptime,
        avgResponseTimeMs: avgLatency,
        totalIncidents: DEMO_INCIDENTS.length,
        activeIncidents: DEMO_INCIDENTS.filter(i => i.status !== 'RESOLVED').length,
        slowestMonitors: slowest,
        recentIncidents: DEMO_INCIDENTS,
        recentResults,
        recentAlerts: DEMO_NOTIFICATIONS,
      };
    }
    const res = await apiClient.get<DashboardMetrics>('/dashboard/metrics');
    return res.data;
  },
};

