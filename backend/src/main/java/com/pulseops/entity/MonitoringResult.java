package com.pulseops.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "monitoring_results", indexes = {
    @Index(name = "idx_results_monitor_checked", columnList = "monitor_id, checked_at DESC")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MonitoringResult {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "monitor_id", nullable = false)
    private Monitor monitor;

    @Column(name = "status_code", nullable = false)
    private Integer statusCode;

    @Column(name = "response_time_ms", nullable = false)
    private Long responseTimeMs;

    @Column(name = "is_success", nullable = false)
    private Boolean isSuccess;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "checked_at", nullable = false)
    private Instant checkedAt;

    @Column(name = "dns_lookup_ms")
    private Integer dnsLookupMs;

    @Column(name = "tls_handshake_ms")
    private Integer tlsHandshakeMs;

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = "res-" + UUID.randomUUID().toString().substring(0, 8);
        }
        if (checkedAt == null) {
            checkedAt = Instant.now();
        }
    }
}

