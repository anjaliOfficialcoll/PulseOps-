import apiClient from './api';
import { ApiKey, AuditLog, User, Organization } from '../types';

let localDemoApiKeys: ApiKey[] = [
  { id: 'key-1', organizationId: 'org-demo', name: 'GitHub CI Pipeline Ingest', keyPrefix: 'pop_live_8f3a', lastUsedAt: new Date(Date.now() - 3600000).toISOString(), createdAt: '2026-01-20T10:00:00Z' },
  { id: 'key-2', organizationId: 'org-demo', name: 'Grafana Webhook Agent', keyPrefix: 'pop_live_e92b', lastUsedAt: new Date(Date.now() - 86400000).toISOString(), createdAt: '2026-02-01T15:30:00Z' },
];

let localDemoAuditLogs: AuditLog[] = [
  { id: 'aud-1', organizationId: 'org-demo', userId: 'usr-demo-001', userName: 'Alex Chen', action: 'MONITOR_PAUSED', resourceType: 'MONITOR', resourceId: 'mon-106', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'aud-2', organizationId: 'org-demo', userId: 'usr-demo-001', userName: 'Alex Chen', action: 'API_KEY_CREATED', resourceType: 'API_KEY', resourceId: 'key-2', createdAt: '2026-02-01T15:30:00Z' },
  { id: 'aud-3', organizationId: 'org-demo', userId: 'usr-demo-002', userName: 'Sarah Jenkins', action: 'INCIDENT_SEVERITY_UPDATED', resourceType: 'INCIDENT', resourceId: 'inc-9002', createdAt: new Date(Date.now() - 7200000).toISOString() },
];

export const settingService = {
  async getApiKeys(isDemo = false): Promise<ApiKey[]> {
    if (isDemo) return [...localDemoApiKeys];
    const res = await apiClient.get<ApiKey[]>('/settings/api-keys');
    return res.data;
  },

  async createApiKey(name: string, isDemo = false): Promise<ApiKey> {
    if (isDemo) {
      const rawHex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
      const rawKey = `pop_live_${rawHex}`;
      const newKey: ApiKey = {
        id: `key-${Date.now()}`,
        organizationId: 'org-demo',
        name,
        keyPrefix: rawKey.substring(0, 12),
        rawKey,
        createdAt: new Date().toISOString(),
      };
      localDemoApiKeys = [newKey, ...localDemoApiKeys];
      return newKey;
    }
    const res = await apiClient.post<ApiKey>('/settings/api-keys', { name });
    return res.data;
  },

  async deleteApiKey(id: string, isDemo = false): Promise<void> {
    if (isDemo) {
      localDemoApiKeys = localDemoApiKeys.filter(k => k.id !== id);
      return;
    }
    await apiClient.delete(`/settings/api-keys/${id}`);
  },

  async updateProfile(fullName: string, isDemo = false): Promise<User> {
    if (isDemo) {
      return { id: 'usr-demo-001', email: 'alex.chen@pulseops.io', fullName, role: 'OWNER' };
    }
    const res = await apiClient.put<User>('/settings/profile', { fullName });
    return res.data;
  },

  async updateWorkspace(name: string, isDemo = false): Promise<Organization> {
    if (isDemo) {
      return { id: 'org-demo', name, slug: name.toLowerCase().replace(/\s+/g, '-') };
    }
    const res = await apiClient.put<Organization>('/settings/workspace', { name });
    return res.data;
  },

  async getAuditLogs(isDemo = false): Promise<AuditLog[]> {
    if (isDemo) return [...localDemoAuditLogs];
    const res = await apiClient.get<AuditLog[]>('/settings/audit-logs');
    return res.data;
  }
};

