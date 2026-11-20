export type UserRole = 'OWNER' | 'ADMIN' | 'DEVELOPER' | 'VIEWER';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role?: UserRole;
  createdAt?: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  memberCount?: number;
  monitorCount?: number;
}

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  color?: string;
  monitorCount?: number;
  createdAt: string;
}

export type MonitorStatus = 'OPERATIONAL' | 'DEGRADED' | 'DOWN' | 'PAUSED';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
export type Environment = 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT';

export interface Monitor {
  id: string;
  organizationId: string;
  projectId?: string;
  projectName?: string;
  name: string;
  url: string;
  method: HttpMethod;
  expectedStatusCode: number;
  intervalSeconds: number; // 30, 60, 300, 600
  timeoutSeconds: number;
  headersJson?: string;
  body?: string;
  environment: Environment;
  isActive: boolean;
  status: MonitorStatus;
  lastCheckedAt?: string;
  consecutiveFailures: number;
  uptime24h?: number;
  uptime7d?: number;
  uptime30d?: number;
  avgResponseTimeMs?: number;
  minResponseTimeMs?: number;
  maxResponseTimeMs?: number;
  p95ResponseTimeMs?: number;
  p99ResponseTimeMs?: number;
  totalChecks?: number;
  successfulChecks?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MonitoringResult {
  id: string;
  monitorId: string;
  monitorName?: string;
  statusCode: number;
  responseTimeMs: number;
  isSuccess: boolean;
  errorMessage?: string;
  checkedAt: string;
  dnsLookupMs?: number;
  tlsHandshakeMs?: number;
}

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'IDENTIFIED' | 'MONITORING' | 'RESOLVED';

export interface Incident {
  id: string;
  organizationId: string;
  monitorId: string;
  monitorName?: string;
  title: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignedUserId?: string;
  assignedUserName?: string;
  startedAt: string;
  detectedAt: string;
  resolvedAt?: string;
  rootCause?: string;
  eventsCount?: number;
  commentsCount?: number;
}

export interface IncidentEvent {
  id: string;
  incidentId: string;
  eventType: string;
  description: string;
  createdAt: string;
  createdByUserName?: string;
}

export interface IncidentComment {
  id: string;
  incidentId: string;
  userId: string;
  userName: string;
  commentText: string;
  createdAt: string;
}

export type AlertChannel = 'EMAIL' | 'IN_APP' | 'WEBHOOK';
export type AlertTriggerCondition = 'ON_DOWN' | 'ON_RECOVERY' | 'ON_LATENCY_THRESHOLD' | 'ON_INCIDENT_CREATED' | 'ON_INCIDENT_RESOLVED';

export interface AlertRule {
  id: string;
  organizationId: string;
  monitorId?: string; // null means all monitors
  monitorName?: string;
  channel: AlertChannel;
  triggerCondition: AlertTriggerCondition;
  thresholdMs?: number;
  recipient: string;
  isActive: boolean;
  createdAt: string;
}

export type NotificationStatus = 'PENDING' | 'DELIVERED' | 'FAILED';

export interface NotificationLog {
  id: string;
  organizationId: string;
  alertRuleId?: string;
  incidentId?: string;
  channel: AlertChannel;
  recipient: string;
  subject: string;
  message: string;
  status: NotificationStatus;
  deliveredAt?: string;
  retryCount: number;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  organizationId: string;
  name: string;
  keyPrefix: string;
  rawKey?: string; // Only returned once on creation
  lastUsedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadataJson?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalMonitors: number;
  operationalCount: number;
  degradedCount: number;
  downCount: number;
  overallUptimePercent: number;
  avgResponseTimeMs: number;
  totalIncidents: number;
  activeIncidents: number;
  slowestMonitors: Monitor[];
  recentIncidents: Incident[];
  recentResults: MonitoringResult[];
  recentAlerts: NotificationLog[];
}

