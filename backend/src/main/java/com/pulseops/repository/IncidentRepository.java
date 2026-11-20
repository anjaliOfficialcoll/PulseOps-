package com.pulseops.repository;

import com.pulseops.entity.Enums;
import com.pulseops.entity.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, String> {
    List<Incident> findByOrganizationIdOrderByStartedAtDesc(String organizationId);
    List<Incident> findByOrganizationIdAndStatusOrderByStartedAtDesc(String organizationId, Enums.IncidentStatus status);
    List<Incident> findByMonitorIdAndStatusNot(String monitorId, Enums.IncidentStatus status);
    long countByOrganizationId(String organizationId);
    long countByOrganizationIdAndStatusNot(String organizationId, Enums.IncidentStatus status);
    Optional<Incident> findFirstByMonitorIdAndStatusNotOrderByStartedAtDesc(String monitorId, Enums.IncidentStatus status);
}

