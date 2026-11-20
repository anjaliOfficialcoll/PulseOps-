-- PulseOps PostgreSQL Database Schema (V1)
-- 1. Organizations
CREATE TABLE organizations (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Users
CREATE TABLE users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(512),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Organization Members
CREATE TABLE organization_members (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(32) NOT NULL DEFAULT 'DEVELOPER',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_org_member UNIQUE(organization_id, user_id)
);

-- 4. Projects
CREATE TABLE projects (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(32) DEFAULT '#6366F1',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Monitors
CREATE TABLE monitors (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(2048) NOT NULL,
    method VARCHAR(16) NOT NULL DEFAULT 'GET',
    expected_status_code INT NOT NULL DEFAULT 200,
    interval_seconds INT NOT NULL DEFAULT 60,
    timeout_seconds INT NOT NULL DEFAULT 5,
    headers_json TEXT,
    body TEXT,
    environment VARCHAR(32) NOT NULL DEFAULT 'PRODUCTION',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(32) NOT NULL DEFAULT 'OPERATIONAL',
    last_checked_at TIMESTAMP WITH TIME ZONE,
    consecutive_failures INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. Monitoring Results
CREATE TABLE monitoring_results (
    id VARCHAR(64) PRIMARY KEY,
    monitor_id VARCHAR(64) NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    status_code INT NOT NULL,
    response_time_ms BIGINT NOT NULL,
    is_success BOOLEAN NOT NULL,
    error_message TEXT,
    checked_at TIMESTAMP WITH TIME ZONE NOT NULL,
    dns_lookup_ms INT,
    tls_handshake_ms INT
);

-- 7. Incidents
CREATE TABLE incidents (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    monitor_id VARCHAR(64) NOT NULL REFERENCES monitors(id) ON DELETE CASCADE,
    title VARCHAR(512) NOT NULL,
    severity VARCHAR(32) NOT NULL DEFAULT 'HIGH',
    status VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    assigned_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    root_cause TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 8. Incident Events
CREATE TABLE incident_events (
    id VARCHAR(64) PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    event_type VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    created_by_user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 9. Incident Comments
CREATE TABLE incident_comments (
    id VARCHAR(64) PRIMARY KEY,
    incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 10. Alert Rules
CREATE TABLE alert_rules (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    monitor_id VARCHAR(64) REFERENCES monitors(id) ON DELETE CASCADE,
    channel VARCHAR(32) NOT NULL DEFAULT 'EMAIL',
    trigger_condition VARCHAR(64) NOT NULL,
    threshold_ms INT,
    recipient VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 11. Notifications
CREATE TABLE notifications (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    alert_rule_id VARCHAR(64) REFERENCES alert_rules(id) ON DELETE SET NULL,
    incident_id VARCHAR(64) REFERENCES incidents(id) ON DELETE SET NULL,
    channel VARCHAR(32) NOT NULL,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(512) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    delivered_at TIMESTAMP WITH TIME ZONE,
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 12. API Keys
CREATE TABLE api_keys (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    key_prefix VARCHAR(32) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 13. Audit Logs
CREATE TABLE audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    organization_id VARCHAR(64) NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(64) NOT NULL,
    resource_type VARCHAR(64) NOT NULL,
    resource_id VARCHAR(64) NOT NULL,
    metadata_json TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for high-frequency queries
CREATE INDEX idx_monitors_org ON monitors(organization_id);
CREATE INDEX idx_monitors_status ON monitors(status);
CREATE INDEX idx_results_monitor_checked ON monitoring_results(monitor_id, checked_at DESC);
CREATE INDEX idx_incidents_org_status ON incidents(organization_id, status);
CREATE INDEX idx_notifications_org ON notifications(organization_id);
CREATE INDEX idx_audit_logs_org ON audit_logs(organization_id, created_at DESC);

