import apiClient from './api';
import { MonitoringResult } from '../types';
import { generateHistoricalResults } from './demoData';

export interface LogFilterParams {
  monitorId?: string;
  statusCode?: number;
  isSuccess?: boolean;
  search?: string;
  page?: number;
  size?: number;
}

export interface PaginatedLogs {
  content: MonitoringResult[];
  totalPages: number;
  totalElements: number;
  currentPage: number;
}

export const logService = {
  async getLogs(params: LogFilterParams, isDemo = false): Promise<PaginatedLogs> {
    if (isDemo) {
      let results: MonitoringResult[] = [
        ...generateHistoricalResults('mon-101', 20),
        ...generateHistoricalResults('mon-102', 20),
        ...generateHistoricalResults('mon-103', 20),
        ...generateHistoricalResults('mon-104', 20),
      ];

      // Sort by latest first
      results.sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());

      if (params.monitorId) {
        results = results.filter(r => r.monitorId === params.monitorId);
      }
      if (params.isSuccess !== undefined) {
        results = results.filter(r => r.isSuccess === params.isSuccess);
      }
      if (params.statusCode) {
        results = results.filter(r => r.statusCode === params.statusCode);
      }
      if (params.search) {
        const query = params.search.toLowerCase();
        results = results.filter(r => (r.errorMessage?.toLowerCase().includes(query) || r.monitorId.includes(query)));
      }

      const page = params.page || 0;
      const size = params.size || 15;
      const start = page * size;
      const paginated = results.slice(start, start + size);

      return {
        content: paginated,
        totalPages: Math.ceil(results.length / size),
        totalElements: results.length,
        currentPage: page,
      };
    }

    const res = await apiClient.get<PaginatedLogs>('/logs', { params });
    return res.data;
  }
};

