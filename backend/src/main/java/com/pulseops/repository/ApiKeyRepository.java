package com.pulseops.repository;

import com.pulseops.entity.ApiKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApiKeyRepository extends JpaRepository<ApiKey, String> {
    List<ApiKey> findByOrganizationId(String organizationId);
    Optional<ApiKey> findByKeyPrefix(String keyPrefix);
}

