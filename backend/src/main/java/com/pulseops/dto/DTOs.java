package com.pulseops.dto;

import com.pulseops.entity.Enums;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.Instant;
import java.util.List;

public class DTOs {

    // --- AUTH DTOs ---
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LoginRequest {
        @NotBlank @Email
        private String email;
        @NotBlank
        private String password;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class RegisterRequest {
        @NotBlank
        private String fullName;
        @NotBlank @Email
        private String email;
        @NotBlank
        private String password;
        @NotBlank
        private String organizationName;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ForgotPasswordRequest {
        @NotBlank @Email
        private String email;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ResetPasswordRequest {
        @NotBlank
        private String token;
        @NotBlank
        private String newPassword;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AuthResponse {
        private String token;
        private String refreshToken;
        private UserDTO user;
        private List<OrganizationDTO> organizations;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UserDTO {
        private String id;
        private String email;
        private String fullName;
        private String avatarUrl;
        private Enums.UserRole role;
        private Instant createdAt;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class OrganizationDTO {
        private String id;
        private String name;
        private String slug;
    }

    // --- MONITOR DTOs ---
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateMonitorRequest {
        @NotBlank
        private String name;
        @NotBlank
        private String url;
        private Enums.HttpMethod method;
        private Integer expectedStatusCode;
        private Integer intervalSeconds;
        private Integer timeoutSeconds;
        private String headersJson;
        private String body;
        private Enums.Environment environment;
        private String projectId;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateMonitorRequest {
        private String name;
        private String url;
        private Enums.HttpMethod method;
        private Integer expectedStatusCode;
        private Integer intervalSeconds;
        private Integer timeoutSeconds;
        private String headersJson;
        private String body;
        private Enums.Environment environment;
        private String projectId;
        private Boolean isActive;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MonitorResponse {
        private String id;
        private String organizationId;
        private String projectId;
        private String projectName;
        private String name;
        private String url;
        private Enums.HttpMethod method;
        private Integer expectedStatusCode;
        private Integer intervalSeconds;
        private Integer timeoutSeconds;
        private String headersJson;
        private String body;
        private Enums.Environment environment;
        private Boolean isActive;
        private Enums.MonitorStatus status;
        private Instant lastCheckedAt;
        private Integer consecutiveFailures;
        private Double uptime24h;
        private Double uptime7d;
        private Double uptime30d;
        private Long avgResponseTimeMs;
        private Long minResponseTimeMs;
        private Long maxResponseTimeMs;
        private Long p95ResponseTimeMs;
        private Long p99ResponseTimeMs;
        private Long totalChecks;
        private Long successfulChecks;
        private Instant createdAt;
        private Instant updatedAt;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MonitoringResultDTO {
        private String id;
        private String monitorId;
        private String monitorName;
        private Integer statusCode;
        private Long responseTimeMs;
        private Boolean isSuccess;
        private String errorMessage;
        private Instant checkedAt;
        private Integer dnsLookupMs;
        private Integer tlsHandshakeMs;
    }

    // --- INCIDENT DTOs ---
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateIncidentRequest {
        @NotBlank
        private String monitorId;
        private String monitorName;
        @NotBlank
        private String title;
        private Enums.IncidentSeverity severity;
        private String rootCause;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateIncidentStatusRequest {
        @NotNull
        private Enums.IncidentStatus status;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateIncidentSeverityRequest {
        @NotNull
        private Enums.IncidentSeverity severity;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AssignIncidentRequest {
        @NotBlank
        private String userId;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AddCommentRequest {
        @NotBlank
        private String commentText;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class IncidentResponse {
        private String id;
        private String organizationId;
        private String monitorId;
        private String monitorName;
        private String title;
        private Enums.IncidentSeverity severity;
        private Enums.IncidentStatus status;
        private String assignedUserId;
        private String assignedUserName;
        private Instant startedAt;
        private Instant detectedAt;
        private Instant resolvedAt;
        private String rootCause;
        private Integer eventsCount;
        private Integer commentsCount;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class IncidentEventDTO {
        private String id;
        private String incidentId;
        private String eventType;
        private String description;
        private String createdByUserName;
        private Instant createdAt;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class IncidentCommentDTO {
        private String id;
        private String incidentId;
        private String userId;
        private String userName;
        private String commentText;
        private Instant createdAt;
    }

    // --- ALERT DTOs ---
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateAlertRuleRequest {
        private String monitorId;
        private String monitorName;
        @NotNull
        private Enums.AlertChannel channel;
        @NotNull
        private Enums.AlertTriggerCondition triggerCondition;
        private Integer thresholdMs;
        @NotBlank
        private String recipient;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AlertRuleResponse {
        private String id;
        private String organizationId;
        private String monitorId;
        private String monitorName;
        private Enums.AlertChannel channel;
        private Enums.AlertTriggerCondition triggerCondition;
        private Integer thresholdMs;
        private String recipient;
        private Boolean isActive;
        private Instant createdAt;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class NotificationResponse {
        private String id;
        private String organizationId;
        private String alertRuleId;
        private String incidentId;
        private Enums.AlertChannel channel;
        private String recipient;
        private String subject;
        private String message;
        private Enums.NotificationStatus status;
        private Instant deliveredAt;
        private Integer retryCount;
        private Instant createdAt;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TestAlertRequest {
        @NotBlank
        private String channel;
        @NotBlank
        private String recipient;
    }

    // --- DASHBOARD DTOs ---
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class DashboardMetricsResponse {
        private Long totalMonitors;
        private Long operationalCount;
        private Long degradedCount;
        private Long downCount;
        private Double overallUptimePercent;
        private Long avgResponseTimeMs;
        private Long totalIncidents;
        private Long activeIncidents;
        private List<MonitorResponse> slowestMonitors;
        private List<IncidentResponse> recentIncidents;
        private List<MonitoringResultDTO> recentResults;
        private List<NotificationResponse> recentAlerts;
    }

    // --- ANALYTICS DTOs ---
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class LatencyTrendPoint {
        private String timestamp;
        private Long avgLatency;
        private Long p95Latency;
        private Long p99Latency;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UptimeTrendPoint {
        private String date;
        private Double uptimePercent;
        private Long incidentCount;
        private Long totalChecks;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AnalyticsResponse {
        private Double uptimePercentage;
        private Long avgResponseTimeMs;
        private Long p95ResponseTimeMs;
        private Long p99ResponseTimeMs;
        private Long totalChecks;
        private Double failureRatePercent;
        private Long incidentCount;
        private List<LatencyTrendPoint> latencyTrends;
        private List<UptimeTrendPoint> uptimeTrends;
    }

    // --- PROJECT & TEAM DTOs ---
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateProjectRequest {
        @NotBlank
        private String name;
        private String description;
        private String color;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ProjectResponse {
        private String id;
        private String organizationId;
        private String name;
        private String description;
        private String color;
        private Long monitorCount;
        private Instant createdAt;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class InviteMemberRequest {
        @NotBlank @Email
        private String email;
        @NotNull
        private Enums.UserRole role;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class TeamMemberResponse {
        private String id;
        private String userId;
        private String fullName;
        private String email;
        private String avatarUrl;
        private Enums.UserRole role;
        private Instant joinedAt;
    }

    // --- SETTINGS DTOs ---
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateApiKeyRequest {
        @NotBlank
        private String name;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ApiKeyResponse {
        private String id;
        private String organizationId;
        private String name;
        private String keyPrefix;
        private String rawKey;
        private Instant lastUsedAt;
        private Instant createdAt;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateProfileRequest {
        @NotBlank
        private String fullName;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class UpdateWorkspaceRequest {
        @NotBlank
        private String name;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AuditLogResponse {
        private String id;
        private String organizationId;
        private String userId;
        private String userName;
        private String action;
        private String resourceType;
        private String resourceId;
        private String metadataJson;
        private Instant createdAt;
    }
}

