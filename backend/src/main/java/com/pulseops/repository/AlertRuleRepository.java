package com.pulseops.repository;

import com.pulseops.entity.AlertRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlertRuleRepository extends JpaRepository<AlertRule, String> {
    List<AlertRule> findByOrganizationId(String organizationId);
    List<AlertRule> findByOrganizationIdAndIsActiveTrue(String organizationId);
    List<AlertRule> findByMonitorIdAndIsActiveTrue(String monitorId);
}

