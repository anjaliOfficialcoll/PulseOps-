package com.pulseops.kafka;

import com.pulseops.entity.Enums;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.time.Instant;
import java.util.UUID;

@Slf4j
public class KafkaComponents {

    // --- BASE EVENT ---
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static abstract class BaseEvent implements Serializable {
        private String eventId = UUID.randomUUID().toString();
        private String correlationId = UUID.randomUUID().toString();
        private Instant timestamp = Instant.now();
    }

    // --- TOPIC EVENTS ---
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MonitorCheckCompletedEvent extends BaseEvent {
        private String monitorId;
        private String organizationId;
        private int statusCode;
        private long responseTimeMs;
        private boolean isSuccess;
        private String errorMessage;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class MonitorFailureDetectedEvent extends BaseEvent {
        private String monitorId;
        private String organizationId;
        private String monitorName;
        private int consecutiveFailures;
        private String errorMessage;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class IncidentCreatedEvent extends BaseEvent {
        private String incidentId;
        private String organizationId;
        private String monitorId;
        private String title;
        private Enums.IncidentSeverity severity;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class IncidentResolvedEvent extends BaseEvent {
        private String incidentId;
        private String organizationId;
        private String monitorId;
        private String resolutionSummary;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class AlertRequestedEvent extends BaseEvent {
        private String alertRuleId;
        private String organizationId;
        private String incidentId;
        private Enums.AlertChannel channel;
        private String recipient;
        private String subject;
        private String message;
    }

    public interface EventPublisher {
        void publishMonitorCompleted(MonitorCheckCompletedEvent event);
        void publishMonitorFailed(MonitorFailureDetectedEvent event);
        void publishIncidentCreated(IncidentCreatedEvent event);
        void publishIncidentResolved(IncidentResolvedEvent event);
        void publishAlertRequested(AlertRequestedEvent event);
    }

    // --- KAFKA PRODUCER SERVICE (WITH IN-PROCESS FALLBACK) ---
    @Component
    @Slf4j
    public static class KafkaEventPublisher implements EventPublisher {

        @Autowired(required = false)
        private KafkaTemplate<String, Object> kafkaTemplate;

        @Autowired
        private ApplicationEventPublisher applicationEventPublisher;

        public static final String TOPIC_MONITOR_COMPLETED = "pulseops.monitor.completed";
        public static final String TOPIC_MONITOR_FAILED = "pulseops.monitor.failed";
        public static final String TOPIC_INCIDENT_CREATED = "pulseops.incident.created";
        public static final String TOPIC_INCIDENT_RESOLVED = "pulseops.incident.resolved";
        public static final String TOPIC_ALERT_REQUESTED = "pulseops.alert.requested";
        public static final String TOPIC_DEAD_LETTER = "pulseops.events.dlq";

        public void publishMonitorCompleted(MonitorCheckCompletedEvent event) {
            publish(TOPIC_MONITOR_COMPLETED, event.getMonitorId(), event);
        }

        public void publishMonitorFailed(MonitorFailureDetectedEvent event) {
            publish(TOPIC_MONITOR_FAILED, event.getMonitorId(), event);
        }

        public void publishIncidentCreated(IncidentCreatedEvent event) {
            publish(TOPIC_INCIDENT_CREATED, event.getIncidentId(), event);
        }

        public void publishIncidentResolved(IncidentResolvedEvent event) {
            publish(TOPIC_INCIDENT_RESOLVED, event.getIncidentId(), event);
        }

        public void publishAlertRequested(AlertRequestedEvent event) {
            publish(TOPIC_ALERT_REQUESTED, event.getRecipient(), event);
        }

        private void publish(String topic, String key, BaseEvent event) {
            boolean publishedToKafka = false;
            if (kafkaTemplate != null) {
                try {
                    kafkaTemplate.send(topic, key, event);
                    publishedToKafka = true;
                    log.debug("Published event [{}] to Kafka topic [{}] with correlation ID [{}]",
                            event.getClass().getSimpleName(), topic, event.getCorrelationId());
                } catch (Exception e) {
                    log.warn("Kafka broker unreachable for topic [{}]. Routing event through in-process bus.", topic);
                }
            }

            // Always trigger in-process Spring ApplicationEvent as reliable guaranteed fallback
            applicationEventPublisher.publishEvent(event);
        }
    }

    // --- KAFKA CONSUMER SERVICE ---
    @Component
    @Slf4j
    public static class KafkaEventConsumer {

        @KafkaListener(topics = KafkaEventPublisher.TOPIC_MONITOR_FAILED, groupId = "pulseops-alert-engine", autoStartup = "false")
        public void handleMonitorFailure(MonitorFailureDetectedEvent event) {
            log.info("Received Kafka MonitorFailureDetectedEvent: monitorId={}, failures={}, correlationId={}",
                    event.getMonitorId(), event.getConsecutiveFailures(), event.getCorrelationId());
        }

        @KafkaListener(topics = KafkaEventPublisher.TOPIC_INCIDENT_CREATED, groupId = "pulseops-notification-engine", autoStartup = "false")
        public void handleIncidentCreated(IncidentCreatedEvent event) {
            log.info("Received Kafka IncidentCreatedEvent: incidentId={}, title={}, correlationId={}",
                    event.getIncidentId(), event.getTitle(), event.getCorrelationId());
        }
    }
}

