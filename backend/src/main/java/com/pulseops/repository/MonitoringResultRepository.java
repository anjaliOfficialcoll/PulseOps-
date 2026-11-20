package com.pulseops.repository;

import com.pulseops.entity.MonitoringResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface MonitoringResultRepository extends JpaRepository<MonitoringResult, String> {
    List<MonitoringResult> findByMonitorIdOrderByCheckedAtDesc(String monitorId);
    Page<MonitoringResult> findByMonitorIdOrderByCheckedAtDesc(String monitorId, Pageable pageable);

    @Query("SELECT r FROM MonitoringResult r JOIN r.monitor m WHERE m.organization.id = :orgId ORDER BY r.checkedAt DESC")
    Page<MonitoringResult> findByOrganizationIdOrderByCheckedAtDesc(@Param("orgId") String orgId, Pageable pageable);

    @Query("SELECT r FROM MonitoringResult r JOIN r.monitor m WHERE m.organization.id = :orgId AND (:monitorId IS NULL OR m.id = :monitorId) AND (:isSuccess IS NULL OR r.isSuccess = :isSuccess) ORDER BY r.checkedAt DESC")
    Page<MonitoringResult> findWithFilters(@Param("orgId") String orgId, @Param("monitorId") String monitorId, @Param("isSuccess") Boolean isSuccess, Pageable pageable);

    @Query("SELECT AVG(r.responseTimeMs) FROM MonitoringResult r WHERE r.monitor.id = :monitorId AND r.checkedAt >= :since")
    Double findAvgResponseTimeByMonitorIdSince(@Param("monitorId") String monitorId, @Param("since") Instant since);

    @Query("SELECT MIN(r.responseTimeMs) FROM MonitoringResult r WHERE r.monitor.id = :monitorId AND r.checkedAt >= :since")
    Long findMinResponseTimeByMonitorIdSince(@Param("monitorId") String monitorId, @Param("since") Instant since);

    @Query("SELECT MAX(r.responseTimeMs) FROM MonitoringResult r WHERE r.monitor.id = :monitorId AND r.checkedAt >= :since")
    Long findMaxResponseTimeByMonitorIdSince(@Param("monitorId") String monitorId, @Param("since") Instant since);

    @Query("SELECT COUNT(r) FROM MonitoringResult r WHERE r.monitor.id = :monitorId AND r.checkedAt >= :since")
    Long countByMonitorIdSince(@Param("monitorId") String monitorId, @Param("since") Instant since);

    @Query("SELECT COUNT(r) FROM MonitoringResult r WHERE r.monitor.id = :monitorId AND r.isSuccess = true AND r.checkedAt >= :since")
    Long countSuccessfulByMonitorIdSince(@Param("monitorId") String monitorId, @Param("since") Instant since);

    @Query("SELECT r.responseTimeMs FROM MonitoringResult r WHERE r.monitor.id = :monitorId AND r.checkedAt >= :since ORDER BY r.responseTimeMs ASC")
    List<Long> findResponseTimesByMonitorIdSince(@Param("monitorId") String monitorId, @Param("since") Instant since);
}

