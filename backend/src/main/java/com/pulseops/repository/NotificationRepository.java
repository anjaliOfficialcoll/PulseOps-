package com.pulseops.repository;

import com.pulseops.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, String> {
    List<Notification> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);
    Page<Notification> findByOrganizationIdOrderByCreatedAtDesc(String organizationId, Pageable pageable);
}

