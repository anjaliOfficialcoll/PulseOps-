package com.pulseops.controller;

import com.pulseops.dto.DTOs.*;
import com.pulseops.entity.Enums;
import com.pulseops.security.SecurityComponents.UserPrincipal;
import com.pulseops.service.Services.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

public class Controllers {

    // --- AUTH CONTROLLER ---
    @RestController
    @RequestMapping("/auth")
    @RequiredArgsConstructor
    @Tag(name = "Authentication", description = "User registration, JWT issuance, and session verification")
    public static class AuthController {
        private final AuthService authService;

        @PostMapping("/register")
        @Operation(summary = "Register user & create organization")
        public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest req) {
            return ResponseEntity.ok(authService.register(req));
        }

        @PostMapping("/login")
        @Operation(summary = "Authenticate user & return JWT token")
        public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
            return ResponseEntity.ok(authService.login(req));
        }

        @GetMapping("/me")
        @Operation(summary = "Get currently authenticated user & organizations")
        public ResponseEntity<AuthResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
            return ResponseEntity.ok(authService.getCurrentUser(principal.getId()));
        }

        @PostMapping("/forgot-password")
        @Operation(summary = "Request password reset link")
        public ResponseEntity<Map<String, String>> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
            return ResponseEntity.ok(authService.forgotPassword(req));
        }
    }

    // --- DASHBOARD CONTROLLER ---
    @RestController
    @RequestMapping("/dashboard")
    @RequiredArgsConstructor
    @Tag(name = "Dashboard", description = "Aggregated observability metrics and fleet summaries")
    public static class DashboardController {
        private final AnalyticsService analyticsService;

        @GetMapping("/metrics")
        @Operation(summary = "Get live dashboard metrics (8 widgets, charts, and slowest APIs)")
        public ResponseEntity<DashboardMetricsResponse> getMetrics(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId
        ) {
            return ResponseEntity.ok(analyticsService.getDashboardMetrics(orgId));
        }
    }

    // --- MONITOR CONTROLLER ---
    @RestController
    @RequestMapping("/monitors")
    @RequiredArgsConstructor
    @Tag(name = "Monitors", description = "Monitor management, health check execution, and result history")
    public static class MonitorController {
        private final MonitorService monitorService;

        @GetMapping
        @Operation(summary = "List monitors for organization")
        public ResponseEntity<List<MonitorResponse>> getMonitors(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId,
                @RequestParam(required = false) String projectId
        ) {
            return ResponseEntity.ok(monitorService.getMonitors(orgId, projectId));
        }

        @GetMapping("/{id}")
        @Operation(summary = "Get monitor by ID")
        public ResponseEntity<MonitorResponse> getById(@PathVariable String id) {
            return ResponseEntity.ok(monitorService.getMonitorById(id));
        }

        @PostMapping
        @Operation(summary = "Register new API endpoint for monitoring")
        public ResponseEntity<MonitorResponse> create(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId,
                @Valid @RequestBody CreateMonitorRequest req
        ) {
            return ResponseEntity.ok(monitorService.createMonitor(orgId, req));
        }

        @PutMapping("/{id}")
        @Operation(summary = "Update monitor details")
        public ResponseEntity<MonitorResponse> update(
                @PathVariable String id,
                @Valid @RequestBody UpdateMonitorRequest req
        ) {
            return ResponseEntity.ok(monitorService.updateMonitor(id, req));
        }

        @DeleteMapping("/{id}")
        @Operation(summary = "Delete monitor")
        public ResponseEntity<Void> delete(@PathVariable String id) {
            monitorService.deleteMonitor(id);
            return ResponseEntity.noContent().build();
        }

        @PostMapping("/{id}/toggle-pause")
        @Operation(summary = "Toggle monitor active/paused state")
        public ResponseEntity<MonitorResponse> togglePause(@PathVariable String id) {
            return ResponseEntity.ok(monitorService.togglePause(id));
        }

        @PostMapping("/{id}/check-now")
        @Operation(summary = "Trigger immediate manual health check probe")
        public ResponseEntity<MonitoringResultDTO> checkNow(@PathVariable String id) {
            return ResponseEntity.ok(monitorService.triggerManualCheck(id));
        }

        @GetMapping("/{id}/results")
        @Operation(summary = "Get recent probe check history")
        public ResponseEntity<List<MonitoringResultDTO>> getResults(
                @PathVariable String id,
                @RequestParam(defaultValue = "50") int limit
        ) {
            return ResponseEntity.ok(monitorService.getResults(id, limit));
        }
    }

    // --- INCIDENT CONTROLLER ---
    @RestController
    @RequestMapping("/incidents")
    @RequiredArgsConstructor
    @Tag(name = "Incidents", description = "Incident lifecycle triage, root cause tracking, and discussion")
    public static class IncidentController {
        private final IncidentService incidentService;

        @GetMapping
        @Operation(summary = "List incidents")
        public ResponseEntity<List<IncidentResponse>> getIncidents(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId,
                @RequestParam(required = false) Enums.IncidentStatus status
        ) {
            return ResponseEntity.ok(incidentService.getIncidents(orgId, status));
        }

        @GetMapping("/{id}")
        @Operation(summary = "Get incident by ID")
        public ResponseEntity<IncidentResponse> getById(@PathVariable String id) {
            return ResponseEntity.ok(incidentService.getIncidentById(id));
        }

        @PostMapping
        @Operation(summary = "Declare manual incident")
        public ResponseEntity<IncidentResponse> create(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId,
                @Valid @RequestBody CreateIncidentRequest req
        ) {
            return ResponseEntity.ok(incidentService.createIncident(orgId, req));
        }

        @PatchMapping("/{id}/status")
        @Operation(summary = "Update incident status")
        public ResponseEntity<IncidentResponse> updateStatus(
                @PathVariable String id,
                @Valid @RequestBody UpdateIncidentStatusRequest req
        ) {
            return ResponseEntity.ok(incidentService.updateStatus(id, req.getStatus()));
        }

        @PatchMapping("/{id}/severity")
        @Operation(summary = "Update incident severity")
        public ResponseEntity<IncidentResponse> updateSeverity(
                @PathVariable String id,
                @Valid @RequestBody UpdateIncidentSeverityRequest req
        ) {
            return ResponseEntity.ok(incidentService.updateSeverity(id, req.getSeverity()));
        }

        @PatchMapping("/{id}/assign")
        @Operation(summary = "Assign incident to engineer")
        public ResponseEntity<IncidentResponse> assign(
                @PathVariable String id,
                @Valid @RequestBody AssignIncidentRequest req
        ) {
            return ResponseEntity.ok(incidentService.assignUser(id, req.getUserId()));
        }

        @PostMapping("/{id}/comments")
        @Operation(summary = "Add comment to incident war room")
        public ResponseEntity<IncidentCommentDTO> addComment(
                @PathVariable String id,
                @AuthenticationPrincipal UserPrincipal principal,
                @Valid @RequestBody AddCommentRequest req
        ) {
            return ResponseEntity.ok(incidentService.addComment(id, principal.getId(), req));
        }

        @GetMapping("/{id}/events")
        @Operation(summary = "Get incident timeline audit events")
        public ResponseEntity<List<IncidentEventDTO>> getEvents(@PathVariable String id) {
            return ResponseEntity.ok(incidentService.getEvents(id));
        }

        @GetMapping("/{id}/comments")
        @Operation(summary = "Get incident comments")
        public ResponseEntity<List<IncidentCommentDTO>> getComments(@PathVariable String id) {
            return ResponseEntity.ok(incidentService.getComments(id));
        }
    }

    // --- ANALYTICS CONTROLLER ---
    @RestController
    @RequestMapping("/analytics")
    @RequiredArgsConstructor
    @Tag(name = "Analytics", description = "SLA compliance, latency percentiles, and CSV reports")
    public static class AnalyticsController {
        private final AnalyticsService analyticsService;

        @GetMapping
        @Operation(summary = "Get SLA & latency percentiles (P50/P95/P99)")
        public ResponseEntity<AnalyticsResponse> getAnalytics(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId,
                @RequestParam(defaultValue = "7d") String period
        ) {
            return ResponseEntity.ok(analyticsService.getAnalytics(orgId, period));
        }

        @GetMapping(value = "/export/csv", produces = "text/csv")
        @Operation(summary = "Export SLA compliance audit report in CSV format")
        public ResponseEntity<String> exportCsv(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId,
                @RequestParam(defaultValue = "7d") String period
        ) {
            return ResponseEntity.ok(analyticsService.exportCsv(orgId, period));
        }
    }

    // --- LOG CONTROLLER ---
    @RestController
    @RequestMapping("/logs")
    @RequiredArgsConstructor
    @Tag(name = "Logs", description = "Searchable sanitized health probe execution records")
    public static class LogController {
        private final LogService logService;

        @GetMapping
        @Operation(summary = "Search and filter probe audit logs")
        public ResponseEntity<Page<MonitoringResultDTO>> getLogs(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId,
                @RequestParam(required = false) String monitorId,
                @RequestParam(required = false) Boolean isSuccess,
                @RequestParam(defaultValue = "0") int page,
                @RequestParam(defaultValue = "15") int size
        ) {
            return ResponseEntity.ok(logService.getLogs(orgId, monitorId, isSuccess, page, size));
        }
    }

    // --- ALERT CONTROLLER ---
    @RestController
    @RequestMapping("/alerts")
    @RequiredArgsConstructor
    @Tag(name = "Alerts", description = "Alert rules and notification delivery logs")
    public static class AlertController {
        private final AlertService alertService;

        @GetMapping("/rules")
        @Operation(summary = "List alert rules")
        public ResponseEntity<List<AlertRuleResponse>> getRules(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId
        ) {
            return ResponseEntity.ok(alertService.getRules(orgId));
        }

        @PostMapping("/rules")
        @Operation(summary = "Create alert rule")
        public ResponseEntity<AlertRuleResponse> createRule(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId,
                @Valid @RequestBody CreateAlertRuleRequest req
        ) {
            return ResponseEntity.ok(alertService.createRule(orgId, req));
        }

        @DeleteMapping("/rules/{id}")
        @Operation(summary = "Delete alert rule")
        public ResponseEntity<Void> deleteRule(@PathVariable String id) {
            alertService.deleteRule(id);
            return ResponseEntity.noContent().build();
        }

        @GetMapping("/history")
        @Operation(summary = "Get confirmed notification delivery logs")
        public ResponseEntity<List<NotificationResponse>> getHistory(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId
        ) {
            return ResponseEntity.ok(alertService.getHistory(orgId));
        }

        @PostMapping("/test")
        @Operation(summary = "Test alert dispatch with provider acknowledgement")
        public ResponseEntity<Map<String, Object>> testAlert(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId,
                @Valid @RequestBody TestAlertRequest req
        ) {
            return ResponseEntity.ok(alertService.testAlert(orgId, req));
        }
    }

    // --- PROJECT & TEAM CONTROLLER ---
    @RestController
    @RequiredArgsConstructor
    @Tag(name = "Team & Projects", description = "Team workspace collaboration and projects")
    public static class TeamController {
        private final TeamService teamService;

        @GetMapping("/projects")
        @Operation(summary = "List projects in workspace")
        public ResponseEntity<List<ProjectResponse>> getProjects(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId
        ) {
            return ResponseEntity.ok(teamService.getProjects(orgId));
        }

        @PostMapping("/projects")
        @Operation(summary = "Create new project")
        public ResponseEntity<ProjectResponse> createProject(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId,
                @Valid @RequestBody CreateProjectRequest req
        ) {
            return ResponseEntity.ok(teamService.createProject(orgId, req));
        }

        @GetMapping("/team/members")
        @Operation(summary = "List team members and RBAC roles")
        public ResponseEntity<List<TeamMemberResponse>> getMembers(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId
        ) {
            return ResponseEntity.ok(teamService.getMembers(orgId));
        }

        @PostMapping("/team/invite")
        @Operation(summary = "Invite member to organization")
        public ResponseEntity<TeamMemberResponse> invite(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId,
                @Valid @RequestBody InviteMemberRequest req
        ) {
            return ResponseEntity.ok(teamService.inviteMember(orgId, req));
        }

        @PatchMapping("/team/members/{id}/role")
        @Operation(summary = "Update member role")
        public ResponseEntity<Void> updateRole(@PathVariable String id, @RequestParam Enums.UserRole role) {
            teamService.updateRole(id, role);
            return ResponseEntity.ok().build();
        }

        @DeleteMapping("/team/members/{id}")
        @Operation(summary = "Remove member")
        public ResponseEntity<Void> removeMember(@PathVariable String id) {
            teamService.removeMember(id);
            return ResponseEntity.noContent().build();
        }
    }

    // --- SETTING CONTROLLER ---
    @RestController
    @RequestMapping("/settings")
    @RequiredArgsConstructor
    @Tag(name = "Settings", description = "API keys, workspace configuration, and audit logs")
    public static class SettingController {
        private final SettingService settingService;

        @GetMapping("/api-keys")
        @Operation(summary = "List API keys")
        public ResponseEntity<List<ApiKeyResponse>> getApiKeys(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId
        ) {
            return ResponseEntity.ok(settingService.getApiKeys(orgId));
        }

        @PostMapping("/api-keys")
        @Operation(summary = "Generate new API key (secret displayed once)")
        public ResponseEntity<ApiKeyResponse> createApiKey(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId,
                @Valid @RequestBody CreateApiKeyRequest req
        ) {
            return ResponseEntity.ok(settingService.createApiKey(orgId, req));
        }

        @DeleteMapping("/api-keys/{id}")
        @Operation(summary = "Revoke API key")
        public ResponseEntity<Void> deleteApiKey(@PathVariable String id) {
            settingService.deleteApiKey(id);
            return ResponseEntity.noContent().build();
        }

        @PutMapping("/profile")
        @Operation(summary = "Update profile")
        public ResponseEntity<UserDTO> updateProfile(
                @AuthenticationPrincipal UserPrincipal principal,
                @Valid @RequestBody UpdateProfileRequest req
        ) {
            return ResponseEntity.ok(settingService.updateProfile(principal.getId(), req));
        }

        @PutMapping("/workspace")
        @Operation(summary = "Update workspace")
        public ResponseEntity<OrganizationDTO> updateWorkspace(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId,
                @Valid @RequestBody UpdateWorkspaceRequest req
        ) {
            return ResponseEntity.ok(settingService.updateWorkspace(orgId, req));
        }

        @GetMapping("/audit-logs")
        @Operation(summary = "Get audit trail")
        public ResponseEntity<List<AuditLogResponse>> getAuditLogs(
                @RequestHeader(value = "X-Organization-Id", defaultValue = "org-demo") String orgId
        ) {
            return ResponseEntity.ok(settingService.getAuditLogs(orgId));
        }
    }
}

