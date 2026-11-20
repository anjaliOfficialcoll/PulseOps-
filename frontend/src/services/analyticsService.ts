import apiClient from './api';

export interface LatencyTrendPoint {
  timestamp: string;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
}

export interface UptimeTrendPoint {
  date: string;
  uptimePercent: number;
  incidentCount: number;
  totalChecks: number;
}

export interface AnalyticsSummary {
  uptimePercentage: number;
  avgResponseTimeMs: number;
  p95ResponseTimeMs: number;
  p99ResponseTimeMs: number;
  totalChecks: number;
  failureRatePercent: number;
  incidentCount: number;
  latencyTrends: LatencyTrendPoint[];
  uptimeTrends: UptimeTrendPoint[];
}

export const analyticsService = {
  async getAnalytics(period: '24h' | '7d' | '30d' | 'custom' = '7d', isDemo = false): Promise<AnalyticsSummary> {
    if (isDemo) {
      const days = period === '24h' ? 1 : period === '7d' ? 7 : 30;
      const uptimeTrends: UptimeTrendPoint[] = [];
      const latencyTrends: LatencyTrendPoint[] = [];
      const now = Date.now();

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now - i * 86400000);
        const dateStr = d.toISOString().split('T')[0];
        uptimeTrends.push({
          date: dateStr,
          uptimePercent: Number((99.7 + Math.random() * 0.28).toFixed(2)),
          incidentCount: i === 1 ? 1 : (i === 4 ? 2 : 0),
          totalChecks: 14400,
        });
      }

      for (let i = 24; i >= 0; i--) {
        const t = new Date(now - i * 3600000);
        const timeStr = `${t.getHours().toString().padStart(2, '0')}:00`;
        const base = 45 + Math.floor(Math.random() * 25);
        latencyTrends.push({
          timestamp: timeStr,
          avgLatency: base,
          p95Latency: Math.round(base * 1.8),
          p99Latency: Math.round(base * 2.5),
        });
      }

      return {
        uptimePercentage: 99.94,
        avgResponseTimeMs: 64,
        p95ResponseTimeMs: 125,
        p99ResponseTimeMs: 185,
        totalChecks: 100800,
        failureRatePercent: 0.06,
        incidentCount: 3,
        latencyTrends,
        uptimeTrends,
      };
    }
    const res = await apiClient.get<AnalyticsSummary>('/analytics', { params: { period } });
    return res.data;
  },

  async exportReportCsv(period: string = '7d'): Promise<string> {
    const res = await apiClient.get<string>('/analytics/export/csv', {
      params: { period },
      responseType: 'text',
    });
    return res.data;
  }
};

