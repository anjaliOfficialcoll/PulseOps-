package com.pulseops.repository;

import com.pulseops.entity.Enums;
import com.pulseops.entity.Monitor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MonitorRepository extends JpaRepository<Monitor, String> {
    List<Monitor> findByOrganizationId(String organizationId);
    List<Monitor> findByOrganizationIdAndProjectId(String organizationId, String projectId);
    List<Monitor> findByIsActiveTrue();
    List<Monitor> findByIsActiveTrueAndIntervalSeconds(Integer intervalSeconds);
    long countByOrganizationIdAndStatus(String organizationId, Enums.MonitorStatus status);
    long countByOrganizationId(String organizationId);
}

