package com.pulseops.repository;

import com.pulseops.entity.IncidentEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentEventRepository extends JpaRepository<IncidentEvent, String> {
    List<IncidentEvent> findByIncidentIdOrderByCreatedAtAsc(String incidentId);
}

