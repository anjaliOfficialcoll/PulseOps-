package com.pulseops.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "alert_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlertRule {

    @Id
    @Column(length = 64)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "monitor_id")
    private Monitor monitor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private Enums.AlertChannel channel = Enums.AlertChannel.EMAIL;

    @Enumerated(EnumType.STRING)
    @Column(name = "trigger_condition", nullable = false, length = 64)
    private Enums.AlertTriggerCondition triggerCondition;

    @Column(name = "threshold_ms")
    private Integer thresholdMs;

    @Column(nullable = false)
    private String recipient;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (id == null) {
            id = "rule-" + UUID.randomUUID().toString().substring(0, 8);
        }
    }
}

