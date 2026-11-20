package com.pulseops;

import com.pulseops.dto.DTOs.*;
import com.pulseops.entity.*;
import com.pulseops.exception.Exceptions.BadRequestException;
import com.pulseops.exception.Exceptions.UnauthorizedException;
import com.pulseops.kafka.KafkaComponents.EventPublisher;
import com.pulseops.monitoring.ProbeComponents.ProbeEngine;
import com.pulseops.monitoring.ProbeComponents.ProbeExecutionResult;
import com.pulseops.monitoring.ProbeComponents.SsrfProtectionValidator;
import com.pulseops.repository.*;
import com.pulseops.security.SecurityComponents.JwtTokenProvider;
import com.pulseops.service.Services.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PulseOpsTests {

    @Mock private UserRepository userRepository;
    @Mock private OrganizationRepository organizationRepository;
    @Mock private OrganizationMemberRepository memberRepository;
    @Mock private MonitorRepository monitorRepository;
    @Mock private MonitoringResultRepository resultRepository;
    @Mock private IncidentRepository incidentRepository;
    @Mock private IncidentEventRepository eventRepository;
    @Mock private IncidentCommentRepository commentRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private PasswordEncoder passwordEncoder;
    private JwtTokenProvider tokenProvider = new JwtTokenProvider();
    @Mock private EventPublisher eventPublisher;
    @Mock private ProbeEngine probeEngine;

    private AuthService authService;
    private MonitorService monitorService;
    private IncidentService incidentService;
    private SsrfProtectionValidator ssrfValidator;

    @BeforeEach
    void setUp() {
        tokenProvider = new JwtTokenProvider();
        authService = new AuthService(userRepository, organizationRepository, memberRepository, passwordEncoder, tokenProvider);
        monitorService = new MonitorService(monitorRepository, organizationRepository, projectRepository, resultRepository, probeEngine, eventPublisher);
        incidentService = new IncidentService(incidentRepository, eventRepository, commentRepository, monitorRepository, organizationRepository, userRepository, eventPublisher);
        ssrfValidator = new SsrfProtectionValidator();
    }

    @Test
    @DisplayName("Auth: Successfully register user with BCrypt password and return JWT")
    void testRegisterUser() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Alex Chen")
                .email("alex@pulseops.io")
                .password("securePassword123")
                .organizationName("Acme Ops")
                .build();

        when(userRepository.existsByEmail("alex@pulseops.io")).thenReturn(false);
        when(passwordEncoder.encode("securePassword123")).thenReturn("hashed-bcrypt-value");

        User savedUser = User.builder().id("usr-1").email(req.getEmail()).fullName(req.getFullName()).passwordHash("hashed-bcrypt-value").build();
        when(userRepository.save(any(User.class))).thenReturn(savedUser);

        Organization savedOrg = Organization.builder().id("org-1").name(req.getOrganizationName()).slug("acme-ops").build();
        when(organizationRepository.save(any(Organization.class))).thenReturn(savedOrg);

        AuthResponse resp = authService.register(req);

        assertNotNull(resp);
        assertNotNull(resp.getToken());
        assertTrue(tokenProvider.validateToken(resp.getToken()));
        assertEquals("alex@pulseops.io", resp.getUser().getEmail());
        assertEquals(Enums.UserRole.OWNER, resp.getUser().getRole());
        assertEquals(1, resp.getOrganizations().size());
        assertEquals("Acme Ops", resp.getOrganizations().get(0).getName());
    }

    @Test
    @DisplayName("Auth: Prevent duplicate email registration")
    void testDuplicateEmailRegistration() {
        RegisterRequest req = RegisterRequest.builder()
                .fullName("Alex Chen")
                .email("existing@pulseops.io")
                .password("password123")
                .organizationName("Acme Ops")
                .build();

        when(userRepository.existsByEmail("existing@pulseops.io")).thenReturn(true);

        assertThrows(BadRequestException.class, () -> authService.register(req));
    }

    @Test
    @DisplayName("Auth: Reject login with invalid password")
    void testLoginInvalidPassword() {
        LoginRequest req = LoginRequest.builder()
                .email("alex@pulseops.io")
                .password("wrongPassword")
                .build();

        User user = User.builder().id("usr-1").email("alex@pulseops.io").passwordHash("real-hash").build();
        when(userRepository.findByEmail("alex@pulseops.io")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrongPassword", "real-hash")).thenReturn(false);

        assertThrows(UnauthorizedException.class, () -> authService.login(req));
    }

    @Test
    @DisplayName("SSRF Guard: Block AWS/GCP Cloud Metadata IP (169.254.169.254)")
    void testSsrfBlocksCloudMetadata() {
        assertThrows(BadRequestException.class, () ->
                ssrfValidator.validateUrl("http://169.254.169.254/latest/meta-data/")
        );
        assertThrows(BadRequestException.class, () ->
                ssrfValidator.validateUrl("http://metadata.google.internal/computeMetadata/v1/")
        );
    }

    @Test
    @DisplayName("SSRF Guard: Block unsupported schemes (e.g. file://, ftp://)")
    void testSsrfBlocksUnsupportedSchemes() {
        assertThrows(BadRequestException.class, () -> ssrfValidator.validateUrl("file:///etc/passwd"));
        assertThrows(BadRequestException.class, () -> ssrfValidator.validateUrl("ftp://ftp.example.com"));
    }

    @Test
    @DisplayName("Incident Management: Deduplicate ongoing outage and prevent duplicate open incidents")
    void testIncidentDeduplication() {
        Organization org = Organization.builder().id("org-1").name("Acme").slug("acme").build();
        Monitor mon = Monitor.builder().id("mon-104").organization(org).name("Settlement API").url("https://api.test").build();

        when(monitorRepository.findById("mon-104")).thenReturn(Optional.of(mon));

        // Existing open incident
        Incident existingIncident = Incident.builder()
                .id("inc-existing-99")
                .organization(org)
                .monitor(mon)
                .title("Existing Outage")
                .status(Enums.IncidentStatus.OPEN)
                .startedAt(Instant.now().minusSeconds(120))
                .detectedAt(Instant.now().minusSeconds(120))
                .build();

        when(incidentRepository.findFirstByMonitorIdAndStatusNotOrderByStartedAtDesc("mon-104", Enums.IncidentStatus.RESOLVED))
                .thenReturn(Optional.of(existingIncident));

        CreateIncidentRequest newReq = CreateIncidentRequest.builder()
                .monitorId("mon-104")
                .title("New Duplicate Outage Detected")
                .severity(Enums.IncidentSeverity.CRITICAL)
                .build();

        IncidentResponse response = incidentService.createIncident("org-1", newReq);

        // Verify that the existing incident is returned without persisting a second incident
        assertEquals("inc-existing-99", response.getId());
        verify(incidentRepository, never()).save(argThat(i -> !"inc-existing-99".equals(i.getId())));
    }

    @Test
    @DisplayName("Monitors: Trigger manual health probe and emit Kafka event")
    void testTriggerManualCheck() {
        Organization org = Organization.builder().id("org-1").name("Acme").slug("acme").build();
        Monitor mon = Monitor.builder()
                .id("mon-101")
                .organization(org)
                .name("Auth API")
                .url("https://httpbin.org/status/200")
                .method(Enums.HttpMethod.GET)
                .expectedStatusCode(200)
                .timeoutSeconds(5)
                .status(Enums.MonitorStatus.OPERATIONAL)
                .consecutiveFailures(0)
                .build();

        when(monitorRepository.findById("mon-101")).thenReturn(Optional.of(mon));

        ProbeExecutionResult mockProbe = ProbeExecutionResult.builder()
                .statusCode(200)
                .responseTimeMs(45)
                .isSuccess(true)
                .checkedAt(Instant.now())
                .dnsLookupMs(3)
                .tlsHandshakeMs(8)
                .build();

        when(probeEngine.executeProbe(anyString(), any(), anyInt(), anyInt(), any(), any()))
                .thenReturn(mockProbe);

        MonitoringResult savedRes = MonitoringResult.builder()
                .id("res-1")
                .monitor(mon)
                .statusCode(200)
                .responseTimeMs(45L)
                .isSuccess(true)
                .checkedAt(Instant.now())
                .build();
        when(resultRepository.save(any(MonitoringResult.class))).thenReturn(savedRes);

        MonitoringResultDTO res = monitorService.triggerManualCheck("mon-101");

        assertNotNull(res);
        assertEquals(200, res.getStatusCode());
        assertTrue(res.getIsSuccess());
        assertEquals(45L, res.getResponseTimeMs());
        verify(eventPublisher, times(1)).publishMonitorCompleted(any());
    }
}

