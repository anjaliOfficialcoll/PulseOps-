import apiClient from './api';
import { Incident, IncidentEvent, IncidentComment, IncidentStatus, IncidentSeverity } from '../types';
import { DEMO_INCIDENTS } from './demoData';

let localDemoIncidents = [...DEMO_INCIDENTS];

let localDemoEvents: Record<string, IncidentEvent[]> = {
  'inc-9001': [
    { id: 'ev-1', incidentId: 'inc-9001', eventType: 'CREATED', description: 'Incident auto-created after 4 consecutive failed health checks (HTTP 504 Gateway Timeout).', createdAt: new Date(Date.now() - 37 * 60 * 1000).toISOString(), createdByUserName: 'PulseOps System' },
    { id: 'ev-2', incidentId: 'inc-9001', eventType: 'NOTIFIED', description: 'Alert dispatched to oncall-sre@pulseops.io via Email.', createdAt: new Date(Date.now() - 36 * 60 * 1000).toISOString(), createdByUserName: 'PulseOps System' },
    { id: 'ev-3', incidentId: 'inc-9001', eventType: 'ASSIGNED', description: 'Incident assigned to Alex Chen.', createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), createdByUserName: 'Alex Chen' },
    { id: 'ev-4', incidentId: 'inc-9001', eventType: 'STATUS_CHANGED', description: 'Status updated from OPEN to INVESTIGATING.', createdAt: new Date(Date.now() - 28 * 60 * 1000).toISOString(), createdByUserName: 'Alex Chen' },
  ],
  'inc-9002': [
    { id: 'ev-5', incidentId: 'inc-9002', eventType: 'CREATED', description: 'Incident auto-created: latency threshold 1500ms breached (measured 2450ms).', createdAt: new Date(Date.now() - 105 * 60 * 1000).toISOString(), createdByUserName: 'PulseOps System' },
    { id: 'ev-6', incidentId: 'inc-9002', eventType: 'STATUS_CHANGED', description: 'Status updated to IDENTIFIED.', createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(), createdByUserName: 'Sarah Jenkins' },
  ],
  'inc-8998': [
    { id: 'ev-7', incidentId: 'inc-8998', eventType: 'CREATED', description: 'Transient 502 Bad Gateway detected during Blue/Green deployment.', createdAt: new Date(Date.now() - 25.9 * 3600 * 1000).toISOString(), createdByUserName: 'PulseOps System' },
    { id: 'ev-8', incidentId: 'inc-8998', eventType: 'RESOLVED', description: 'Incident resolved automatically after 10 consecutive successful health checks.', createdAt: new Date(Date.now() - 25.5 * 3600 * 1000).toISOString(), createdByUserName: 'PulseOps System' },
  ]
};

let localDemoComments: Record<string, IncidentComment[]> = {
  'inc-9001': [
    { id: 'com-1', incidentId: 'inc-9001', userId: 'usr-demo-001', userName: 'Alex Chen', commentText: 'Checking the connection pool on RDS read replicas. Worker processes are stuck in waiting queue.', createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString() },
    { id: 'com-2', incidentId: 'inc-9001', userId: 'usr-demo-002', userName: 'Sarah Jenkins', commentText: 'Scaling up replica instances now to drain queue buildup.', createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() },
  ],
  'inc-9002': [
    { id: 'com-3', incidentId: 'inc-9002', userId: 'usr-demo-002', userName: 'Sarah Jenkins', commentText: 'Shard rebalancing estimated to finish in 12 minutes. Cluster write limits have been bumped temporarily.', createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString() },
  ]
};

export const incidentService = {
  async getIncidents(isDemo = false, status?: IncidentStatus, severity?: IncidentSeverity): Promise<Incident[]> {
    if (isDemo) {
      let filtered = [...localDemoIncidents];
      if (status) filtered = filtered.filter(i => i.status === status);
      if (severity) filtered = filtered.filter(i => i.severity === severity);
      return filtered;
    }
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (severity) params.severity = severity;
    const res = await apiClient.get<Incident[]>('/incidents', { params });
    return res.data;
  },

  async getIncidentById(id: string, isDemo = false): Promise<Incident> {
    if (isDemo) {
      const inc = localDemoIncidents.find(i => i.id === id);
      if (!inc) throw new Error('Incident not found');
      return { ...inc };
    }
    const res = await apiClient.get<Incident>(`/incidents/${id}`);
    return res.data;
  },

  async createIncident(data: Partial<Incident>, isDemo = false): Promise<Incident> {
    if (isDemo) {
      const newInc: Incident = {
        id: `inc-${Date.now()}`,
        organizationId: 'org-demo',
        monitorId: data.monitorId || 'mon-101',
        monitorName: data.monitorName || 'Identity & Auth Gateway',
        title: data.title || 'Manual Outage Investigation',
        severity: data.severity || 'HIGH',
        status: 'OPEN',
        startedAt: new Date().toISOString(),
        detectedAt: new Date().toISOString(),
        rootCause: data.rootCause,
        eventsCount: 1,
        commentsCount: 0,
      };
      localDemoIncidents = [newInc, ...localDemoIncidents];
      localDemoEvents[newInc.id] = [
        {
          id: `ev-${Date.now()}`,
          incidentId: newInc.id,
          eventType: 'CREATED',
          description: `Incident manually triggered by operator: ${newInc.title}`,
          createdAt: new Date().toISOString(),
          createdByUserName: 'Operator',
        }
      ];
      return newInc;
    }
    const res = await apiClient.post<Incident>('/incidents', data);
    return res.data;
  },

  async updateStatus(id: string, status: IncidentStatus, isDemo = false): Promise<Incident> {
    if (isDemo) {
      const inc = localDemoIncidents.find(i => i.id === id);
      if (!inc) throw new Error('Incident not found');
      const updated: Incident = {
        ...inc,
        status,
        resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : inc.resolvedAt,
      };
      localDemoIncidents = localDemoIncidents.map(i => i.id === id ? updated : i);

      const event: IncidentEvent = {
        id: `ev-${Date.now()}`,
        incidentId: id,
        eventType: 'STATUS_CHANGED',
        description: `Status changed to ${status}`,
        createdAt: new Date().toISOString(),
        createdByUserName: 'Alex Chen',
      };
      localDemoEvents[id] = [...(localDemoEvents[id] || []), event];

      return updated;
    }
    const res = await apiClient.patch<Incident>(`/incidents/${id}/status`, { status });
    return res.data;
  },

  async updateSeverity(id: string, severity: IncidentSeverity, isDemo = false): Promise<Incident> {
    if (isDemo) {
      const inc = localDemoIncidents.find(i => i.id === id);
      if (!inc) throw new Error('Incident not found');
      const updated: Incident = { ...inc, severity };
      localDemoIncidents = localDemoIncidents.map(i => i.id === id ? updated : i);
      return updated;
    }
    const res = await apiClient.patch<Incident>(`/incidents/${id}/severity`, { severity });
    return res.data;
  },

  async assignUser(id: string, userId: string, userName: string, isDemo = false): Promise<Incident> {
    if (isDemo) {
      const inc = localDemoIncidents.find(i => i.id === id);
      if (!inc) throw new Error('Incident not found');
      const updated: Incident = { ...inc, assignedUserId: userId, assignedUserName: userName };
      localDemoIncidents = localDemoIncidents.map(i => i.id === id ? updated : i);
      return updated;
    }
    const res = await apiClient.patch<Incident>(`/incidents/${id}/assign`, { userId });
    return res.data;
  },

  async addComment(id: string, commentText: string, isDemo = false): Promise<IncidentComment> {
    if (isDemo) {
      const newComment: IncidentComment = {
        id: `com-${Date.now()}`,
        incidentId: id,
        userId: 'usr-demo-001',
        userName: 'Alex Chen',
        commentText,
        createdAt: new Date().toISOString(),
      };
      localDemoComments[id] = [...(localDemoComments[id] || []), newComment];
      localDemoIncidents = localDemoIncidents.map(i => i.id === id ? { ...i, commentsCount: (i.commentsCount || 0) + 1 } : i);
      return newComment;
    }
    const res = await apiClient.post<IncidentComment>(`/incidents/${id}/comments`, { commentText });
    return res.data;
  },

  async getEvents(id: string, isDemo = false): Promise<IncidentEvent[]> {
    if (isDemo) {
      return localDemoEvents[id] || [];
    }
    const res = await apiClient.get<IncidentEvent[]>(`/incidents/${id}/events`);
    return res.data;
  },

  async getComments(id: string, isDemo = false): Promise<IncidentComment[]> {
    if (isDemo) {
      return localDemoComments[id] || [];
    }
    const res = await apiClient.get<IncidentComment[]>(`/incidents/${id}/comments`);
    return res.data;
  },
};

