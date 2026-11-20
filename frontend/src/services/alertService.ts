import apiClient from './api';
import { AlertRule, NotificationLog } from '../types';
import { DEMO_NOTIFICATIONS } from './demoData';

let localDemoAlertRules: AlertRule[] = [
  {
    id: 'rule-1',
    organizationId: 'org-demo',
    channel: 'EMAIL',
    triggerCondition: 'ON_DOWN',
    recipient: 'oncall-sre@pulseops.io',
    isActive: true,
    createdAt: '2026-01-15T10:00:00Z',
  },
  {
    id: 'rule-2',
    organizationId: 'org-demo',
    monitorId: 'mon-103',
    monitorName: 'ElasticSearch Cluster Ingest',
    channel: 'IN_APP',
    triggerCondition: 'ON_LATENCY_THRESHOLD',
    thresholdMs: 1500,
    recipient: 'alex.chen@pulseops.io',
    isActive: true,
    createdAt: '2026-01-20T12:00:00Z',
  },
  {
    id: 'rule-3',
    organizationId: 'org-demo',
    channel: 'EMAIL',
    triggerCondition: 'ON_RECOVERY',
    recipient: 'security-alerts@pulseops.io',
    isActive: true,
    createdAt: '2026-02-01T08:00:00Z',
  }
];

let localDemoNotifications = [...DEMO_NOTIFICATIONS];

export const alertService = {
  async getRules(isDemo = false): Promise<AlertRule[]> {
    if (isDemo) return [...localDemoAlertRules];
    const res = await apiClient.get<AlertRule[]>('/alerts/rules');
    return res.data;
  },

  async createRule(data: Partial<AlertRule>, isDemo = false): Promise<AlertRule> {
    if (isDemo) {
      const newRule: AlertRule = {
        id: `rule-${Date.now()}`,
        organizationId: 'org-demo',
        monitorId: data.monitorId,
        monitorName: data.monitorName,
        channel: data.channel || 'EMAIL',
        triggerCondition: data.triggerCondition || 'ON_DOWN',
        thresholdMs: data.thresholdMs,
        recipient: data.recipient || 'alerts@pulseops.io',
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      localDemoAlertRules = [newRule, ...localDemoAlertRules];
      return newRule;
    }
    const res = await apiClient.post<AlertRule>('/alerts/rules', data);
    return res.data;
  },

  async toggleRule(id: string, isDemo = false): Promise<AlertRule> {
    if (isDemo) {
      const rule = localDemoAlertRules.find(r => r.id === id);
      if (!rule) throw new Error('Rule not found');
      const updated = { ...rule, isActive: !rule.isActive };
      localDemoAlertRules = localDemoAlertRules.map(r => r.id === id ? updated : r);
      return updated;
    }
    const res = await apiClient.patch<AlertRule>(`/alerts/rules/${id}/toggle`);
    return res.data;
  },

  async deleteRule(id: string, isDemo = false): Promise<void> {
    if (isDemo) {
      localDemoAlertRules = localDemoAlertRules.filter(r => r.id !== id);
      return;
    }
    await apiClient.delete(`/alerts/rules/${id}`);
  },

  async getDeliveryHistory(isDemo = false): Promise<NotificationLog[]> {
    if (isDemo) return [...localDemoNotifications];
    const res = await apiClient.get<NotificationLog[]>('/alerts/history');
    return res.data;
  },

  async testAlert(channel: string, recipient: string, isDemo = false): Promise<{ success: boolean; message: string }> {
    if (isDemo) {
      const log: NotificationLog = {
        id: `notif-${Date.now()}`,
        organizationId: 'org-demo',
        channel: channel as any,
        recipient,
        subject: '[TEST ALERT] PulseOps probe simulation',
        message: 'This is a test notification dispatched to verify alert delivery pipeline.',
        status: 'DELIVERED',
        deliveredAt: new Date().toISOString(),
        retryCount: 0,
        createdAt: new Date().toISOString(),
      };
      localDemoNotifications = [log, ...localDemoNotifications];
      return { success: true, message: `Test alert successfully delivered to ${recipient} via ${channel}` };
    }
    const res = await apiClient.post<{ success: boolean; message: string }>('/alerts/test', { channel, recipient });
    return res.data;
  }
};

