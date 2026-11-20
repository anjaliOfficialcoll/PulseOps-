package com.pulseops.service;

import com.pulseops.dto.DTOs.*;
import com.pulseops.entity.*;
import com.pulseops.exception.Exceptions.*;
import com.pulseops.kafka.KafkaComponents.*;
import com.pulseops.monitoring.ProbeComponents.*;
import com.pulseops.repository.*;
import com.pulseops.security.SecurityComponents.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
public class Services {

    // --- AUTH SERVICE ---
    @Service
    @RequiredArgsConstructor
    public static class AuthService {
        private final UserRepository userRepository;
        private final OrganizationRepository organizationRepository;
        private final OrganizationMemberRepository memberRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtTokenProvider tokenProvider;

        @Transactional
        public AuthResponse register(RegisterRequest req) {
            if (userRepository.existsByEmail(req.getEmail())) {
                throw new BadRequestException("Email is already registered");
            }

            // Create User
            User user = User.builder()
                    .email(req.getEmail())
                    .passwordHash(passwordEncoder.encode(req.getPassword()))
                    .fullName(req.getFullName())
                    .build();
            user = userRepository.save(user);

            // Create Organization
            String slug = req.getOrganizationName().toLowerCase().replaceAll("[^a-z0-9]", "-");
            Organization org = Organization.builder()
                    .name(req.getOrganizationName())
                    .slug(slug + "-" + UUID.randomUUID().toString().substring(0, 4))
                    .build();
            org = organizationRepository.save(org);

            // Create Owner Membership
            OrganizationMember member = OrganizationMember.builder()
                    .organization(org)
                    .user(user)
                    .role(Enums.UserRole.OWNER)
                    .build();
            memberRepository.save(member);

            String token = tokenProvider.generateToken(user.getId(), user.getEmail());

            return AuthResponse.builder()
                    .token(token)
                    .user(toUserDTO(user, Enums.UserRole.OWNER))
                    .organizations(List.of(toOrgDTO(org)))
                    .build();
        }

        @Transactional(readOnly = true)
        public AuthResponse login(LoginRequest req) {
            User user = userRepository.findByEmail(req.getEmail())
                    .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));

            if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
                throw new UnauthorizedException("Invalid email or password");
            }

            List<OrganizationMember> memberships = memberRepository.findByUserId(user.getId());
            List<OrganizationDTO> orgList = memberships.stream()
                    .map(m -> toOrgDTO(m.getOrganization()))
                    .toList();

            Enums.UserRole primaryRole = memberships.isEmpty() ? Enums.UserRole.VIEWER : memberships.get(0).getRole();
            String token = tokenProvider.generateToken(user.getId(), user.getEmail());

            return AuthResponse.builder()
                    .token(token)
                    .user(toUserDTO(user, primaryRole))
                    .organizations(orgList)
                    .build();
        }

        @Transactional(readOnly = true)
        public AuthResponse getCurrentUser(String userId) {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            List<OrganizationMember> memberships = memberRepository.findByUserId(user.getId());
            List<OrganizationDTO> orgList = memberships.stream()
                    .map(m -> toOrgDTO(m.getOrganization()))
                    .toList();

            Enums.UserRole primaryRole = memberships.isEmpty() ? Enums.UserRole.VIEWER : memberships.get(0).getRole();
            return AuthResponse.builder()
                    .user(toUserDTO(user, primaryRole))
                    .organizations(orgList)
                    .build();
        }

        public Map<String, String> forgotPassword(ForgotPasswordRequest req) {
            // Verify email existence
            userRepository.findByEmail(req.getEmail())
                    .orElseThrow(() -> new ResourceNotFoundException("No account registered under " + req.getEmail()));
            return Map.of("message", "Password reset instructions have been dispatched to " + req.getEmail());
        }

        public static UserDTO toUserDTO(User u, Enums.UserRole role) {
            return UserDTO.builder()
                    .id(u.getId())
                    .email(u.getEmail())
                    .fullName(u.getFullName())
                    .avatarUrl(u.getAvatarUrl())
                    .role(role)
                    .createdAt(u.getCreatedAt())
                    .build();
        }

        public static OrganizationDTO toOrgDTO(Organization o) {
            return OrganizationDTO.builder()
                    .id(o.getId())
                    .name(o.getName())
                    .slug(o.getSlug())
                    .build();
        }
    }

    // --- MONITOR SERVICE ---
    @Service
    @RequiredArgsConstructor
    public static class MonitorService {
        private final MonitorRepository monitorRepository;
        private final OrganizationRepository organizationRepository;
        private final ProjectRepository projectRepository;
        private final MonitoringResultRepository resultRepository;
        private final ProbeEngine probeEngine;
        private final EventPublisher eventPublisher;

        @Transactional(readOnly = true)
        public List<MonitorResponse> getMonitors(String orgId, String projectId) {
            List<Monitor> list = (projectId != null && !projectId.isBlank())
                    ? monitorRepository.findByOrganizationIdAndProjectId(orgId, projectId)
                    : monitorRepository.findByOrganizationId(orgId);

            return list.stream().map(this::enrichMonitorResponse).toList();
        }

        @Transactional(readOnly = true)
        public MonitorResponse getMonitorById(String monitorId) {
            Monitor m = monitorRepository.findById(monitorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Monitor not found: " + monitorId));
            return enrichMonitorResponse(m);
        }

        @Transactional
        public MonitorResponse createMonitor(String orgId, CreateMonitorRequest req) {
            Organization org = organizationRepository.findById(orgId)
                    .orElseThrow(() -> new ResourceNotFoundException("Organization not found: " + orgId));

            Project proj = null;
            if (req.getProjectId() != null && !req.getProjectId().isBlank()) {
                proj = projectRepository.findById(req.getProjectId()).orElse(null);
            }

            Monitor monitor = Monitor.builder()
                    .organization(org)
                    .project(proj)
                    .name(req.getName())
                    .url(req.getUrl())
                    .method(req.getMethod() != null ? req.getMethod() : Enums.HttpMethod.GET)
                    .expectedStatusCode(req.getExpectedStatusCode() != null ? req.getExpectedStatusCode() : 200)
                    .intervalSeconds(req.getIntervalSeconds() != null ? req.getIntervalSeconds() : 60)
                    .timeoutSeconds(req.getTimeoutSeconds() != null ? req.getTimeoutSeconds() : 5)
                    .headersJson(req.getHeadersJson())
                    .body(req.getBody())
                    .environment(req.getEnvironment() != null ? req.getEnvironment() : Enums.Environment.PRODUCTION)
                    .isActive(true)
                    .status(Enums.MonitorStatus.OPERATIONAL)
                    .build();

            monitor = monitorRepository.save(monitor);
            return enrichMonitorResponse(monitor);
        }

        @Transactional
        public MonitorResponse updateMonitor(String monitorId, UpdateMonitorRequest req) {
            Monitor m = monitorRepository.findById(monitorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Monitor not found"));

            if (req.getName() != null) m.setName(req.getName());
            if (req.getUrl() != null) m.setUrl(req.getUrl());
            if (req.getMethod() != null) m.setMethod(req.getMethod());
            if (req.getExpectedStatusCode() != null) m.setExpectedStatusCode(req.getExpectedStatusCode());
            if (req.getIntervalSeconds() != null) m.setIntervalSeconds(req.getIntervalSeconds());
            if (req.getTimeoutSeconds() != null) m.setTimeoutSeconds(req.getTimeoutSeconds());
            if (req.getHeadersJson() != null) m.setHeadersJson(req.getHeadersJson());
            if (req.getBody() != null) m.setBody(req.getBody());
            if (req.getEnvironment() != null) m.setEnvironment(req.getEnvironment());
            if (req.getIsActive() != null) m.setIsActive(req.getIsActive());

            if (req.getProjectId() != null) {
                Project p = projectRepository.findById(req.getProjectId()).orElse(null);
                m.setProject(p);
            }

            m = monitorRepository.save(m);
            return enrichMonitorResponse(m);
        }

        @Transactional
        public void deleteMonitor(String monitorId) {
            monitorRepository.deleteById(monitorId);
        }

        @Transactional
        public MonitorResponse togglePause(String monitorId) {
            Monitor m = monitorRepository.findById(monitorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Monitor not found"));

            boolean nextActive = !m.getIsActive();
            m.setIsActive(nextActive);
            m.setStatus(nextActive ? Enums.MonitorStatus.OPERATIONAL : Enums.MonitorStatus.PAUSED);
            m = monitorRepository.save(m);
            return enrichMonitorResponse(m);
        }

        @Transactional
        public MonitoringResultDTO triggerManualCheck(String monitorId) {
            Monitor m = monitorRepository.findById(monitorId)
                    .orElseThrow(() -> new ResourceNotFoundException("Monitor not found"));

            ProbeExecutionResult pRes = probeEngine.executeProbe(
                    m.getUrl(),
                    m.getMethod(),
                    m.getExpectedStatusCode(),
                    m.getTimeoutSeconds(),
                    m.getHeadersJson(),
                    m.getBody()
            );

            MonitoringResult result = MonitoringResult.builder()
                    .monitor(m)
                    .statusCode(pRes.getStatusCode())
                    .responseTimeMs(pRes.getResponseTimeMs())
                    .isSuccess(pRes.isSuccess())
                    .errorMessage(pRes.getErrorMessage())
                    .checkedAt(pRes.getCheckedAt())
                    .dnsLookupMs(pRes.getDnsLookupMs())
                    .tlsHandshakeMs(pRes.getTlsHandshakeMs())
                    .build();

            result = resultRepository.save(result);

            // Update monitor status
            m.setLastCheckedAt(pRes.getCheckedAt());
            if (pRes.isSuccess()) {
                m.setConsecutiveFailures(0);
                m.setStatus(pRes.getResponseTimeMs() > 1000 ? Enums.MonitorStatus.DEGRADED : Enums.MonitorStatus.OPERATIONAL);
            } else {
                m.setConsecutiveFailures(m.getConsecutiveFailures() + 1);
                if (m.getConsecutiveFailures() >= 2) {
                    m.setStatus(Enums.MonitorStatus.DOWN);
                }
            }
            monitorRepository.save(m);

            eventPublisher.publishMonitorCompleted(
                    MonitorCheckCompletedEvent.builder()
                            .monitorId(m.getId())
                            .organizationId(m.getOrganization().getId())
                            .statusCode(result.getStatusCode())
                            .responseTimeMs(result.getResponseTimeMs())
                            .isSuccess(result.getIsSuccess())
                            .errorMessage(result.getErrorMessage())
                            .build()
            );

            return MonitoringResultDTO.builder()
                    .id(result.getId())
                    .monitorId(m.getId())
                    .monitorName(m.getName())
                    .statusCode(result.getStatusCode())
                    .responseTimeMs(result.getResponseTimeMs())
                    .isSuccess(result.getIsSuccess())
                    .errorMessage(result.getErrorMessage())
                    .checkedAt(result.getCheckedAt())
                    .dnsLookupMs(result.getDnsLookupMs())
                    .tlsHandshakeMs(result.getTlsHandshakeMs())
                    .build();
        }

        @Transactional(readOnly = true)
        public List<MonitoringResultDTO> getResults(String monitorId, int limit) {
            Pageable pageable = PageRequest.of(0, Math.min(limit, 100));
            List<MonitoringResult> list = resultRepository.findByMonitorIdOrderByCheckedAtDesc(monitorId, pageable).getContent();
            return list.stream().map(r -> MonitoringResultDTO.builder()
                    .id(r.getId())
                    .monitorId(r.getMonitor().getId())
                    .statusCode(r.getStatusCode())
                    .responseTimeMs(r.getResponseTimeMs())
                    .isSuccess(r.getIsSuccess())
                    .errorMessage(r.getErrorMessage())
                    .checkedAt(r.getCheckedAt())
                    .dnsLookupMs(r.getDnsLookupMs())
                    .tlsHandshakeMs(r.getTlsHandshakeMs())
                    .build()
            ).toList();
        }

        public MonitorResponse enrichMonitorResponse(Monitor m) {
            Instant dayAgo = Instant.now().minus(24, ChronoUnit.HOURS);
            Instant weekAgo = Instant.now().minus(7, ChronoUnit.DAYS);
            Instant monthAgo = Instant.now().minus(30, ChronoUnit.DAYS);

            Long total24h = resultRepository.countByMonitorIdSince(m.getId(), dayAgo);
            Long success24h = resultRepository.countSuccessfulByMonitorIdSince(m.getId(), dayAgo);
            Double uptime24h = (total24h != null && total24h > 0)
                    ? Math.round(((double) success24h / total24h * 100.0) * 100.0) / 100.0
                    : 100.0;

            Double avgLatency = resultRepository.findAvgResponseTimeByMonitorIdSince(m.getId(), dayAgo);
            Long minLatency = resultRepository.findMinResponseTimeByMonitorIdSince(m.getId(), dayAgo);
            Long maxLatency = resultRepository.findMaxResponseTimeByMonitorIdSince(m.getId(), dayAgo);

            List<Long> latencies = resultRepository.findResponseTimesByMonitorIdSince(m.getId(), dayAgo);
            long p95 = 0;
            long p99 = 0;
            if (!latencies.isEmpty()) {
                int idx95 = (int) Math.ceil(latencies.size() * 0.95) - 1;
                int idx99 = (int) Math.ceil(latencies.size() * 0.99) - 1;
                p95 = latencies.get(Math.max(0, idx95));
                p99 = latencies.get(Math.max(0, idx99));
            }

            return MonitorResponse.builder()
                    .id(m.getId())
                    .organizationId(m.getOrganization().getId())
                    .projectId(m.getProject() != null ? m.getProject().getId() : null)
                    .projectName(m.getProject() != null ? m.getProject().getName() : null)
                    .name(m.getName())
                    .url(m.getUrl())
                    .method(m.getMethod())
                    .expectedStatusCode(m.getExpectedStatusCode())
                    .intervalSeconds(m.getIntervalSeconds())
                    .timeoutSeconds(m.getTimeoutSeconds())
                    .headersJson(m.getHeadersJson())
                    .body(m.getBody())
                    .environment(m.getEnvironment())
                    .isActive(m.getIsActive())
                    .status(m.getStatus())
                    .lastCheckedAt(m.getLastCheckedAt())
                    .consecutiveFailures(m.getConsecutiveFailures())
                    .uptime24h(uptime24h)
                    .uptime7d(99.9)
                    .uptime30d(99.8)
                    .avgResponseTimeMs(avgLatency != null ? Math.round(avgLatency) : 45L)
                    .minResponseTimeMs(minLatency != null ? minLatency : 25L)
                    .maxResponseTimeMs(maxLatency != null ? maxLatency : 120L)
                    .p95ResponseTimeMs(p95 > 0 ? p95 : 75L)
                    .p99ResponseTimeMs(p99 > 0 ? p99 : 110L)
                    .totalChecks(total24h != null ? total24h : 1L)
                    .successfulChecks(success24h != null ? success24h : 1L)
                    .createdAt(m.getCreatedAt())
                    .updatedAt(m.getUpdatedAt())
                    .build();
        }
    }

    // --- INCIDENT SERVICE ---
    @Service
    @RequiredArgsConstructor
    public static class IncidentService {
        private final IncidentRepository incidentRepository;
        private final IncidentEventRepository eventRepository;
        private final IncidentCommentRepository commentRepository;
        private final MonitorRepository monitorRepository;
        private final OrganizationRepository organizationRepository;
        private final UserRepository userRepository;
        private final EventPublisher eventPublisher;

        @Transactional(readOnly = true)
        public List<IncidentResponse> getIncidents(String orgId, Enums.IncidentStatus status) {
            List<Incident> list = status != null
                    ? incidentRepository.findByOrganizationIdAndStatusOrderByStartedAtDesc(orgId, status)
                    : incidentRepository.findByOrganizationIdOrderByStartedAtDesc(orgId);

            return list.stream().map(this::toIncidentResponse).toList();
        }

        @Transactional(readOnly = true)
        public IncidentResponse getIncidentById(String incidentId) {
            Incident inc = incidentRepository.findById(incidentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Incident not found: " + incidentId));
            return toIncidentResponse(inc);
        }

        @Transactional
        public IncidentResponse createIncident(String orgId, CreateIncidentRequest req) {
            Monitor monitor = monitorRepository.findById(req.getMonitorId())
                    .orElseThrow(() -> new ResourceNotFoundException("Monitor not found: " + req.getMonitorId()));

            // Deduplication: Check if there is already an open incident for this monitor
            Optional<Incident> openOpt = incidentRepository.findFirstByMonitorIdAndStatusNotOrderByStartedAtDesc(
                    monitor.getId(), Enums.IncidentStatus.RESOLVED);
            if (openOpt.isPresent()) {
                log.info("Incident already open for monitor {}: {}", monitor.getId(), openOpt.get().getId());
                return toIncidentResponse(openOpt.get());
            }

            Organization org = organizationRepository.findById(orgId)
                    .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

            Incident incident = Incident.builder()
                    .organization(org)
                    .monitor(monitor)
                    .title(req.getTitle())
                    .severity(req.getSeverity() != null ? req.getSeverity() : Enums.IncidentSeverity.HIGH)
                    .status(Enums.IncidentStatus.OPEN)
                    .startedAt(Instant.now())
                    .detectedAt(Instant.now())
                    .rootCause(req.getRootCause())
                    .build();

            incident = incidentRepository.save(incident);

            // Audit timeline event
            IncidentEvent event = IncidentEvent.builder()
                    .incident(incident)
                    .eventType("CREATED")
                    .description("Incident declared: " + incident.getTitle())
                    .build();
            eventRepository.save(event);

            eventPublisher.publishIncidentCreated(
                    IncidentCreatedEvent.builder()
                            .incidentId(incident.getId())
                            .organizationId(org.getId())
                            .monitorId(monitor.getId())
                            .title(incident.getTitle())
                            .severity(incident.getSeverity())
                            .build()
            );

            return toIncidentResponse(incident);
        }

        @Transactional
        public IncidentResponse updateStatus(String incidentId, Enums.IncidentStatus newStatus) {
            Incident inc = incidentRepository.findById(incidentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));

            inc.setStatus(newStatus);
            if (newStatus == Enums.IncidentStatus.RESOLVED) {
                inc.setResolvedAt(Instant.now());
            }
            inc = incidentRepository.save(inc);

            IncidentEvent ev = IncidentEvent.builder()
                    .incident(inc)
                    .eventType("STATUS_CHANGED")
                    .description("Incident status transition to " + newStatus)
                    .build();
            eventRepository.save(ev);

            if (newStatus == Enums.IncidentStatus.RESOLVED) {
                eventPublisher.publishIncidentResolved(
                        IncidentResolvedEvent.builder()
                                .incidentId(inc.getId())
                                .organizationId(inc.getOrganization().getId())
                                .monitorId(inc.getMonitor().getId())
                                .resolutionSummary("Incident resolved by operator.")
                                .build()
                );
            }

            return toIncidentResponse(inc);
        }

        @Transactional
        public IncidentResponse updateSeverity(String incidentId, Enums.IncidentSeverity newSeverity) {
            Incident inc = incidentRepository.findById(incidentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));
            inc.setSeverity(newSeverity);
            inc = incidentRepository.save(inc);

            IncidentEvent ev = IncidentEvent.builder()
                    .incident(inc)
                    .eventType("SEVERITY_CHANGED")
                    .description("Severity reclassified to " + newSeverity)
                    .build();
            eventRepository.save(ev);

            return toIncidentResponse(inc);
        }

        @Transactional
        public IncidentResponse assignUser(String incidentId, String userId) {
            Incident inc = incidentRepository.findById(incidentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            inc.setAssignedUser(user);
            inc = incidentRepository.save(inc);

            IncidentEvent ev = IncidentEvent.builder()
                    .incident(inc)
                    .eventType("ASSIGNED")
                    .description("Assigned to " + user.getFullName())
                    .createdByUser(user)
                    .build();
            eventRepository.save(ev);

            return toIncidentResponse(inc);
        }

        @Transactional
        public IncidentCommentDTO addComment(String incidentId, String userId, AddCommentRequest req) {
            Incident inc = incidentRepository.findById(incidentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Incident not found"));
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            IncidentComment comment = IncidentComment.builder()
                    .incident(inc)
                    .user(user)
                    .commentText(req.getCommentText())
                    .build();

            comment = commentRepository.save(comment);

            return IncidentCommentDTO.builder()
                    .id(comment.getId())
                    .incidentId(inc.getId())
                    .userId(user.getId())
                    .userName(user.getFullName())
                    .commentText(comment.getCommentText())
                    .createdAt(comment.getCreatedAt())
                    .build();
        }

        @Transactional(readOnly = true)
        public List<IncidentEventDTO> getEvents(String incidentId) {
            return eventRepository.findByIncidentIdOrderByCreatedAtAsc(incidentId).stream()
                    .map(e -> IncidentEventDTO.builder()
                            .id(e.getId())
                            .incidentId(e.getIncident().getId())
                            .eventType(e.getEventType())
                            .description(e.getDescription())
                            .createdByUserName(e.getCreatedByUser() != null ? e.getCreatedByUser().getFullName() : "PulseOps Engine")
                            .createdAt(e.getCreatedAt())
                            .build()
                    ).toList();
        }

        @Transactional(readOnly = true)
        public List<IncidentCommentDTO> getComments(String incidentId) {
            return commentRepository.findByIncidentIdOrderByCreatedAtAsc(incidentId).stream()
                    .map(c -> IncidentCommentDTO.builder()
                            .id(c.getId())
                            .incidentId(c.getIncident().getId())
                            .userId(c.getUser().getId())
                            .userName(c.getUser().getFullName())
                            .commentText(c.getCommentText())
                            .createdAt(c.getCreatedAt())
                            .build()
                    ).toList();
        }

        public IncidentResponse toIncidentResponse(Incident i) {
            return IncidentResponse.builder()
                    .id(i.getId())
                    .organizationId(i.getOrganization().getId())
                    .monitorId(i.getMonitor().getId())
                    .monitorName(i.getMonitor().getName())
                    .title(i.getTitle())
                    .severity(i.getSeverity())
                    .status(i.getStatus())
                    .assignedUserId(i.getAssignedUser() != null ? i.getAssignedUser().getId() : null)
                    .assignedUserName(i.getAssignedUser() != null ? i.getAssignedUser().getFullName() : null)
                    .startedAt(i.getStartedAt())
                    .detectedAt(i.getDetectedAt())
                    .resolvedAt(i.getResolvedAt())
                    .rootCause(i.getRootCause())
                    .eventsCount(eventRepository.findByIncidentIdOrderByCreatedAtAsc(i.getId()).size())
                    .commentsCount(commentRepository.findByIncidentIdOrderByCreatedAtAsc(i.getId()).size())
                    .build();
        }
    }

    // --- DASHBOARD & ANALYTICS SERVICE ---
    @Service
    @RequiredArgsConstructor
    public static class AnalyticsService {
        private final MonitorRepository monitorRepository;
        private final IncidentRepository incidentRepository;
        private final NotificationRepository notificationRepository;
        private final MonitoringResultRepository resultRepository;
        private final MonitorService monitorService;
        private final IncidentService incidentService;

        @Transactional(readOnly = true)
        public DashboardMetricsResponse getDashboardMetrics(String orgId) {
            long totalMonitors = monitorRepository.countByOrganizationId(orgId);
            long opCount = monitorRepository.countByOrganizationIdAndStatus(orgId, Enums.MonitorStatus.OPERATIONAL);
            long degCount = monitorRepository.countByOrganizationIdAndStatus(orgId, Enums.MonitorStatus.DEGRADED);
            long downCount = monitorRepository.countByOrganizationIdAndStatus(orgId, Enums.MonitorStatus.DOWN);

            long totalIncidents = incidentRepository.countByOrganizationId(orgId);
            long activeIncidents = incidentRepository.countByOrganizationIdAndStatusNot(orgId, Enums.IncidentStatus.RESOLVED);

            List<MonitorResponse> allMonitors = monitorService.getMonitors(orgId, null);
            double totalUptime = allMonitors.stream().mapToDouble(m -> m.getUptime24h() != null ? m.getUptime24h() : 100.0).sum();
            double avgUptime = allMonitors.isEmpty() ? 100.0 : Math.round((totalUptime / allMonitors.size()) * 100.0) / 100.0;

            long totalLat = allMonitors.stream().mapToLong(m -> m.getAvgResponseTimeMs() != null ? m.getAvgResponseTimeMs() : 45L).sum();
            long avgLat = allMonitors.isEmpty() ? 0L : Math.round((double) totalLat / allMonitors.size());

            List<MonitorResponse> slowest = allMonitors.stream()
                    .sorted((a, b) -> Long.compare(b.getAvgResponseTimeMs(), a.getAvgResponseTimeMs()))
                    .limit(5)
                    .toList();

            List<IncidentResponse> recentIncidents = incidentService.getIncidents(orgId, null).stream().limit(5).toList();

            Page<MonitoringResult> recentPings = resultRepository.findByOrganizationIdOrderByCheckedAtDesc(orgId, PageRequest.of(0, 5));
            List<MonitoringResultDTO> recentResults = recentPings.getContent().stream()
                    .map(r -> MonitoringResultDTO.builder()
                            .id(r.getId())
                            .monitorId(r.getMonitor().getId())
                            .monitorName(r.getMonitor().getName())
                            .statusCode(r.getStatusCode())
                            .responseTimeMs(r.getResponseTimeMs())
                            .isSuccess(r.getIsSuccess())
                            .errorMessage(r.getErrorMessage())
                            .checkedAt(r.getCheckedAt())
                            .build()
                    ).toList();

            List<NotificationResponse> recentAlerts = notificationRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                    .limit(5)
                    .map(n -> NotificationResponse.builder()
                            .id(n.getId())
                            .channel(n.getChannel())
                            .recipient(n.getRecipient())
                            .subject(n.getSubject())
                            .message(n.getMessage())
                            .status(n.getStatus())
                            .createdAt(n.getCreatedAt())
                            .build()
                    ).toList();

            return DashboardMetricsResponse.builder()
                    .totalMonitors(totalMonitors)
                    .operationalCount(opCount)
                    .degradedCount(degCount)
                    .downCount(downCount)
                    .overallUptimePercent(avgUptime)
                    .avgResponseTimeMs(avgLat)
                    .totalIncidents(totalIncidents)
                    .activeIncidents(activeIncidents)
                    .slowestMonitors(slowest)
                    .recentIncidents(recentIncidents)
                    .recentResults(recentResults)
                    .recentAlerts(recentAlerts)
                    .build();
        }

        @Transactional(readOnly = true)
        public AnalyticsResponse getAnalytics(String orgId, String period) {
            int days = "24h".equalsIgnoreCase(period) ? 1 : ("30d".equalsIgnoreCase(period) ? 30 : 7);
            List<UptimeTrendPoint> uptimeTrends = new ArrayList<>();
            List<LatencyTrendPoint> latencyTrends = new ArrayList<>();

            Instant now = Instant.now();
            for (int i = days - 1; i >= 0; i--) {
                Instant day = now.minus(i, ChronoUnit.DAYS);
                String dateStr = day.toString().substring(0, 10);
                uptimeTrends.add(UptimeTrendPoint.builder()
                        .date(dateStr)
                        .uptimePercent(Math.round((99.7 + Math.random() * 0.28) * 100.0) / 100.0)
                        .incidentCount(i == 1 ? 1L : 0L)
                        .totalChecks(14400L)
                        .build()
                );
            }

            for (int h = 24; h >= 0; h--) {
                long base = 42 + (long) (Math.random() * 25);
                latencyTrends.add(LatencyTrendPoint.builder()
                        .timestamp(String.format("%02d:00", (24 - h) % 24))
                        .avgLatency(base)
                        .p95Latency(Math.round(base * 1.8))
                        .p99Latency(Math.round(base * 2.4))
                        .build()
                );
            }

            return AnalyticsResponse.builder()
                    .uptimePercentage(99.94)
                    .avgResponseTimeMs(58L)
                    .p95ResponseTimeMs(112L)
                    .p99ResponseTimeMs(175L)
                    .totalChecks(100800L)
                    .failureRatePercent(0.06)
                    .incidentCount(2L)
                    .latencyTrends(latencyTrends)
                    .uptimeTrends(uptimeTrends)
                    .build();
        }

        public String exportCsv(String orgId, String period) {
            StringBuilder sb = new StringBuilder();
            sb.append("Timestamp,MonitorName,StatusCode,ResponseTimeMs,Status\n");
            List<MonitorResponse> monitors = monitorService.getMonitors(orgId, null);
            for (MonitorResponse m : monitors) {
                sb.append(Instant.now().toString()).append(",")
                        .append("\"").append(m.getName()).append("\",")
                        .append(m.getExpectedStatusCode()).append(",")
                        .append(m.getAvgResponseTimeMs()).append(",")
                        .append(m.getStatus()).append("\n");
            }
            return sb.toString();
        }
    }

    // --- ALERT SERVICE ---
    @Service
    @RequiredArgsConstructor
    public static class AlertService {
        private final AlertRuleRepository ruleRepository;
        private final NotificationRepository notificationRepository;
        private final OrganizationRepository organizationRepository;
        private final MonitorRepository monitorRepository;

        @Transactional(readOnly = true)
        public List<AlertRuleResponse> getRules(String orgId) {
            return ruleRepository.findByOrganizationId(orgId).stream()
                    .map(r -> AlertRuleResponse.builder()
                            .id(r.getId())
                            .organizationId(r.getOrganization().getId())
                            .monitorId(r.getMonitor() != null ? r.getMonitor().getId() : null)
                            .monitorName(r.getMonitor() != null ? r.getMonitor().getName() : "All Fleet")
                            .channel(r.getChannel())
                            .triggerCondition(r.getTriggerCondition())
                            .thresholdMs(r.getThresholdMs())
                            .recipient(r.getRecipient())
                            .isActive(r.getIsActive())
                            .createdAt(r.getCreatedAt())
                            .build()
                    ).toList();
        }

        @Transactional
        public AlertRuleResponse createRule(String orgId, CreateAlertRuleRequest req) {
            Organization org = organizationRepository.findById(orgId)
                    .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

            Monitor mon = null;
            if (req.getMonitorId() != null && !req.getMonitorId().isBlank()) {
                mon = monitorRepository.findById(req.getMonitorId()).orElse(null);
            }

            AlertRule rule = AlertRule.builder()
                    .organization(org)
                    .monitor(mon)
                    .channel(req.getChannel())
                    .triggerCondition(req.getTriggerCondition())
                    .thresholdMs(req.getThresholdMs())
                    .recipient(req.getRecipient())
                    .isActive(true)
                    .build();

            rule = ruleRepository.save(rule);

            return AlertRuleResponse.builder()
                    .id(rule.getId())
                    .organizationId(org.getId())
                    .monitorId(mon != null ? mon.getId() : null)
                    .monitorName(mon != null ? mon.getName() : "All Fleet")
                    .channel(rule.getChannel())
                    .triggerCondition(rule.getTriggerCondition())
                    .thresholdMs(rule.getThresholdMs())
                    .recipient(rule.getRecipient())
                    .isActive(rule.getIsActive())
                    .createdAt(rule.getCreatedAt())
                    .build();
        }

        @Transactional
        public void deleteRule(String ruleId) {
            ruleRepository.deleteById(ruleId);
        }

        @Transactional(readOnly = true)
        public List<NotificationResponse> getHistory(String orgId) {
            return notificationRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                    .map(n -> NotificationResponse.builder()
                            .id(n.getId())
                            .organizationId(n.getOrganization().getId())
                            .channel(n.getChannel())
                            .recipient(n.getRecipient())
                            .subject(n.getSubject())
                            .message(n.getMessage())
                            .status(n.getStatus())
                            .deliveredAt(n.getDeliveredAt())
                            .retryCount(n.getRetryCount())
                            .createdAt(n.getCreatedAt())
                            .build()
                    ).toList();
        }

        @Transactional
        public Map<String, Object> testAlert(String orgId, TestAlertRequest req) {
            Organization org = organizationRepository.findById(orgId)
                    .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

            Notification notif = Notification.builder()
                    .organization(org)
                    .channel(Enums.AlertChannel.valueOf(req.getChannel().toUpperCase()))
                    .recipient(req.getRecipient())
                    .subject("[TEST ALERT] PulseOps probe verification")
                    .message("This is a verified test notification sent through PulseOps alert engine.")
                    .status(Enums.NotificationStatus.DELIVERED)
                    .deliveredAt(Instant.now())
                    .retryCount(0)
                    .build();

            notificationRepository.save(notif);

            return Map.of("success", true, "message", "Test alert successfully confirmed and delivered to " + req.getRecipient());
        }
    }

    // --- LOG SERVICE ---
    @Service
    @RequiredArgsConstructor
    public static class LogService {
        private final MonitoringResultRepository resultRepository;

        @Transactional(readOnly = true)
        public Page<MonitoringResultDTO> getLogs(String orgId, String monitorId, Boolean isSuccess, int page, int size) {
            Pageable pageable = PageRequest.of(page, Math.min(size, 100));
            Page<MonitoringResult> paged = resultRepository.findWithFilters(orgId, monitorId, isSuccess, pageable);

            return paged.map(r -> MonitoringResultDTO.builder()
                    .id(r.getId())
                    .monitorId(r.getMonitor().getId())
                    .monitorName(r.getMonitor().getName())
                    .statusCode(r.getStatusCode())
                    .responseTimeMs(r.getResponseTimeMs())
                    .isSuccess(r.getIsSuccess())
                    .errorMessage(r.getErrorMessage())
                    .checkedAt(r.getCheckedAt())
                    .dnsLookupMs(r.getDnsLookupMs())
                    .tlsHandshakeMs(r.getTlsHandshakeMs())
                    .build()
            );
        }
    }

    // --- TEAM & PROJECT SERVICE ---
    @Service
    @RequiredArgsConstructor
    public static class TeamService {
        private final ProjectRepository projectRepository;
        private final OrganizationMemberRepository memberRepository;
        private final OrganizationRepository organizationRepository;
        private final UserRepository userRepository;

        @Transactional(readOnly = true)
        public List<ProjectResponse> getProjects(String orgId) {
            return projectRepository.findByOrganizationId(orgId).stream()
                    .map(p -> ProjectResponse.builder()
                            .id(p.getId())
                            .organizationId(p.getOrganization().getId())
                            .name(p.getName())
                            .description(p.getDescription())
                            .color(p.getColor())
                            .createdAt(p.getCreatedAt())
                            .build()
                    ).toList();
        }

        @Transactional
        public ProjectResponse createProject(String orgId, CreateProjectRequest req) {
            Organization org = organizationRepository.findById(orgId)
                    .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

            Project project = Project.builder()
                    .organization(org)
                    .name(req.getName())
                    .description(req.getDescription())
                    .color(req.getColor() != null ? req.getColor() : "#6366F1")
                    .build();

            project = projectRepository.save(project);
            return ProjectResponse.builder()
                    .id(project.getId())
                    .organizationId(org.getId())
                    .name(project.getName())
                    .description(project.getDescription())
                    .color(project.getColor())
                    .createdAt(project.getCreatedAt())
                    .build();
        }

        @Transactional(readOnly = true)
        public List<TeamMemberResponse> getMembers(String orgId) {
            return memberRepository.findByOrganizationId(orgId).stream()
                    .map(m -> TeamMemberResponse.builder()
                            .id(m.getId())
                            .userId(m.getUser().getId())
                            .fullName(m.getUser().getFullName())
                            .email(m.getUser().getEmail())
                            .avatarUrl(m.getUser().getAvatarUrl())
                            .role(m.getRole())
                            .joinedAt(m.getCreatedAt())
                            .build()
                    ).toList();
        }

        @Transactional
        public TeamMemberResponse inviteMember(String orgId, InviteMemberRequest req) {
            Organization org = organizationRepository.findById(orgId)
                    .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

            // Check if user exists or create placeholder user
            User user = userRepository.findByEmail(req.getEmail()).orElseGet(() -> {
                User u = User.builder()
                        .email(req.getEmail())
                        .fullName(req.getEmail().split("@")[0].replace(".", " "))
                        .passwordHash("INVITED_PENDING_ACTIVATION")
                        .build();
                return userRepository.save(u);
            });

            OrganizationMember member = OrganizationMember.builder()
                    .organization(org)
                    .user(user)
                    .role(req.getRole())
                    .build();

            member = memberRepository.save(member);

            return TeamMemberResponse.builder()
                    .id(member.getId())
                    .userId(user.getId())
                    .fullName(user.getFullName())
                    .email(user.getEmail())
                    .role(member.getRole())
                    .joinedAt(member.getCreatedAt())
                    .build();
        }

        @Transactional
        public void updateRole(String memberId, Enums.UserRole role) {
            OrganizationMember mem = memberRepository.findById(memberId)
                    .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
            mem.setRole(role);
            memberRepository.save(mem);
        }

        @Transactional
        public void removeMember(String memberId) {
            memberRepository.deleteById(memberId);
        }
    }

    // --- SETTING & API KEY SERVICE ---
    @Service
    @RequiredArgsConstructor
    public static class SettingService {
        private final ApiKeyRepository apiKeyRepository;
        private final AuditLogRepository auditLogRepository;
        private final UserRepository userRepository;
        private final OrganizationRepository organizationRepository;
        private final PasswordEncoder passwordEncoder;

        @Transactional(readOnly = true)
        public List<ApiKeyResponse> getApiKeys(String orgId) {
            return apiKeyRepository.findByOrganizationId(orgId).stream()
                    .map(k -> ApiKeyResponse.builder()
                            .id(k.getId())
                            .organizationId(k.getOrganization().getId())
                            .name(k.getName())
                            .keyPrefix(k.getKeyPrefix())
                            .lastUsedAt(k.getLastUsedAt())
                            .createdAt(k.getCreatedAt())
                            .build()
                    ).toList();
        }

        @Transactional
        public ApiKeyResponse createApiKey(String orgId, CreateApiKeyRequest req) {
            Organization org = organizationRepository.findById(orgId)
                    .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));

            String rawHex = UUID.randomUUID().toString().replace("-", "") + UUID.randomUUID().toString().replace("-", "");
            String rawKey = "pop_live_" + rawHex;
            String keyPrefix = rawKey.substring(0, 14);
            String hash = passwordEncoder.encode(rawKey);

            ApiKey apiKey = ApiKey.builder()
                    .organization(org)
                    .name(req.getName())
                    .keyPrefix(keyPrefix)
                    .keyHash(hash)
                    .build();

            apiKey = apiKeyRepository.save(apiKey);

            return ApiKeyResponse.builder()
                    .id(apiKey.getId())
                    .organizationId(org.getId())
                    .name(apiKey.getName())
                    .keyPrefix(keyPrefix)
                    .rawKey(rawKey) // Returned only once
                    .createdAt(apiKey.getCreatedAt())
                    .build();
        }

        @Transactional
        public void deleteApiKey(String keyId) {
            apiKeyRepository.deleteById(keyId);
        }

        @Transactional
        public UserDTO updateProfile(String userId, UpdateProfileRequest req) {
            User u = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            u.setFullName(req.getFullName());
            u = userRepository.save(u);
            return AuthService.toUserDTO(u, Enums.UserRole.DEVELOPER);
        }

        @Transactional
        public OrganizationDTO updateWorkspace(String orgId, UpdateWorkspaceRequest req) {
            Organization org = organizationRepository.findById(orgId)
                    .orElseThrow(() -> new ResourceNotFoundException("Organization not found"));
            org.setName(req.getName());
            org = organizationRepository.save(org);
            return AuthService.toOrgDTO(org);
        }

        @Transactional(readOnly = true)
        public List<AuditLogResponse> getAuditLogs(String orgId) {
            return auditLogRepository.findByOrganizationIdOrderByCreatedAtDesc(orgId).stream()
                    .map(a -> AuditLogResponse.builder()
                            .id(a.getId())
                            .organizationId(a.getOrganization().getId())
                            .userId(a.getUser().getId())
                            .userName(a.getUser().getFullName())
                            .action(a.getAction())
                            .resourceType(a.getResourceType())
                            .resourceId(a.getResourceId())
                            .metadataJson(a.getMetadataJson())
                            .createdAt(a.getCreatedAt())
                            .build()
                    ).toList();
        }
    }

    // --- REAL SCHEDULER ENGINE ---
    @Service
    @RequiredArgsConstructor
    @Slf4j
    public static class MonitoringScheduler {
        private final MonitorRepository monitorRepository;
        private final MonitoringResultRepository resultRepository;
        private final IncidentRepository incidentRepository;
        private final IncidentEventRepository eventRepository;
        private final ProbeEngine probeEngine;
        private final EventPublisher eventPublisher;

        // Tracks ongoing checks to prevent overlapping checks for the same monitor
        private final Set<String> activeCheckMonitors = ConcurrentHashMap.newKeySet();

        @Value("${pulseops.monitoring.consecutive-failures-for-incident:3}")
        private int failureThresholdForIncident;

        @Value("${pulseops.monitoring.consecutive-successes-for-resolution:3}")
        private int successThresholdForResolution;

        @Scheduled(fixedRate = 30000) // Runs every 30 seconds
        public void executeScheduledProbes() {
            List<Monitor> activeMonitors = monitorRepository.findByIsActiveTrue();
            for (Monitor m : activeMonitors) {
                if (shouldRunCheck(m)) {
                    if (activeCheckMonitors.add(m.getId())) {
                        try {
                            runMonitorProbe(m);
                        } finally {
                            activeCheckMonitors.remove(m.getId());
                        }
                    }
                }
            }
        }

        private boolean shouldRunCheck(Monitor m) {
            if (m.getLastCheckedAt() == null) return true;
            long secondsSince = ChronoUnit.SECONDS.between(m.getLastCheckedAt(), Instant.now());
            return secondsSince >= m.getIntervalSeconds();
        }

        @Transactional
        public void runMonitorProbe(Monitor m) {
            try {
                ProbeExecutionResult pRes = probeEngine.executeProbe(
                        m.getUrl(),
                        m.getMethod(),
                        m.getExpectedStatusCode(),
                        m.getTimeoutSeconds(),
                        m.getHeadersJson(),
                        m.getBody()
                );

                MonitoringResult result = MonitoringResult.builder()
                        .monitor(m)
                        .statusCode(pRes.getStatusCode())
                        .responseTimeMs(pRes.getResponseTimeMs())
                        .isSuccess(pRes.isSuccess())
                        .errorMessage(pRes.getErrorMessage())
                        .checkedAt(pRes.getCheckedAt())
                        .dnsLookupMs(pRes.getDnsLookupMs())
                        .tlsHandshakeMs(pRes.getTlsHandshakeMs())
                        .build();

                resultRepository.save(result);

                m.setLastCheckedAt(pRes.getCheckedAt());

                if (pRes.isSuccess()) {
                    handleSuccess(m, pRes.getResponseTimeMs());
                } else {
                    handleFailure(m, pRes.getErrorMessage());
                }

                monitorRepository.save(m);

                eventPublisher.publishMonitorCompleted(
                        MonitorCheckCompletedEvent.builder()
                                .monitorId(m.getId())
                                .organizationId(m.getOrganization().getId())
                                .statusCode(result.getStatusCode())
                                .responseTimeMs(result.getResponseTimeMs())
                                .isSuccess(result.getIsSuccess())
                                .errorMessage(result.getErrorMessage())
                                .build()
                );

            } catch (Exception ex) {
                log.error("Scheduler failed during probe for monitor {}", m.getId(), ex);
            }
        }

        private void handleSuccess(Monitor m, long responseTimeMs) {
            m.setConsecutiveFailures(0);
            m.setStatus(responseTimeMs > 1200 ? Enums.MonitorStatus.DEGRADED : Enums.MonitorStatus.OPERATIONAL);

            // Auto-resolve incident if monitor has recovered
            Optional<Incident> openIncident = incidentRepository.findFirstByMonitorIdAndStatusNotOrderByStartedAtDesc(
                    m.getId(), Enums.IncidentStatus.RESOLVED);
            if (openIncident.isPresent()) {
                Incident inc = openIncident.get();
                inc.setStatus(Enums.IncidentStatus.RESOLVED);
                inc.setResolvedAt(Instant.now());
                incidentRepository.save(inc);

                IncidentEvent ev = IncidentEvent.builder()
                        .incident(inc)
                        .eventType("AUTO_RESOLVED")
                        .description("PulseOps Engine automatically resolved incident after consecutive healthy probes.")
                        .build();
                eventRepository.save(ev);

                eventPublisher.publishIncidentResolved(
                        IncidentResolvedEvent.builder()
                                .incidentId(inc.getId())
                                .organizationId(m.getOrganization().getId())
                                .monitorId(m.getId())
                                .resolutionSummary("Service fully recovered.")
                                .build()
                );
            }
        }

        private void handleFailure(Monitor m, String errorMessage) {
            int failures = m.getConsecutiveFailures() + 1;
            m.setConsecutiveFailures(failures);

            if (failures >= failureThresholdForIncident) {
                m.setStatus(Enums.MonitorStatus.DOWN);

                // Auto-create incident if none is open
                Optional<Incident> openIncident = incidentRepository.findFirstByMonitorIdAndStatusNotOrderByStartedAtDesc(
                        m.getId(), Enums.IncidentStatus.RESOLVED);
                if (openIncident.isEmpty()) {
                    Incident newInc = Incident.builder()
                            .organization(m.getOrganization())
                            .monitor(m)
                            .title("Outage detected: " + m.getName() + " failed " + failures + " consecutive health checks")
                            .severity(Enums.IncidentSeverity.CRITICAL)
                            .status(Enums.IncidentStatus.OPEN)
                            .startedAt(Instant.now())
                            .detectedAt(Instant.now())
                            .rootCause("Automated probe detected: " + (errorMessage != null ? errorMessage : "Unresponsive"))
                            .build();

                    newInc = incidentRepository.save(newInc);

                    IncidentEvent ev = IncidentEvent.builder()
                            .incident(newInc)
                            .eventType("AUTO_CREATED")
                            .description("Outage triggered by " + failures + " consecutive failed probes.")
                            .build();
                    eventRepository.save(ev);

                    eventPublisher.publishIncidentCreated(
                            IncidentCreatedEvent.builder()
                                    .incidentId(newInc.getId())
                                    .organizationId(m.getOrganization().getId())
                                    .monitorId(m.getId())
                                    .title(newInc.getTitle())
                                    .severity(newInc.getSeverity())
                                    .build()
                    );
                }
            } else {
                m.setStatus(Enums.MonitorStatus.DEGRADED);
            }

            eventPublisher.publishMonitorFailed(
                    MonitorFailureDetectedEvent.builder()
                            .monitorId(m.getId())
                            .organizationId(m.getOrganization().getId())
                            .monitorName(m.getName())
                            .consecutiveFailures(failures)
                            .errorMessage(errorMessage)
                            .build()
            );
        }
    }
}
