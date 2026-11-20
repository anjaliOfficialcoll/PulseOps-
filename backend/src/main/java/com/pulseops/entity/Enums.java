package com.pulseops.entity;

public class Enums {
    public enum UserRole {
        OWNER, ADMIN, DEVELOPER, VIEWER
    }

    public enum MonitorStatus {
        OPERATIONAL, DEGRADED, DOWN, PAUSED
    }

    public enum HttpMethod {
        GET, POST, PUT, PATCH, DELETE, HEAD
    }

    public enum Environment {
        PRODUCTION, STAGING, DEVELOPMENT
    }

    public enum IncidentStatus {
        OPEN, INVESTIGATING, IDENTIFIED, MONITORING, RESOLVED
    }

    public enum IncidentSeverity {
        CRITICAL, HIGH, MEDIUM, LOW
    }

    public enum AlertChannel {
        EMAIL, IN_APP, WEBHOOK
    }

    public enum AlertTriggerCondition {
        ON_DOWN, ON_RECOVERY, ON_LATENCY_THRESHOLD, ON_INCIDENT_CREATED, ON_INCIDENT_RESOLVED
    }

    public enum NotificationStatus {
        PENDING, DELIVERED, FAILED
    }
}

