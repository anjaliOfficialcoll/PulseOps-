package com.pulseops.repository;

import com.pulseops.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, String> {
    List<AuditLog> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);
    Page<AuditLog> findByOrganizationIdOrderByCreatedAtDesc(String organizationId, Pageable pageable);
}

