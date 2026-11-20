-- PulseOps Seed Data (V2)
-- 1. Default Organization
INSERT INTO organizations (id, name, slug, created_at, updated_at)
VALUES ('org-demo', 'Acme Cloud Ops', 'acme-ops', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 2. Default User (password: 'password123')
INSERT INTO users (id, email, password_hash, full_name, avatar_url, created_at, updated_at)
VALUES (
    'usr-demo-001',
    'alex.chen@pulseops.io',
    '$2a$10$ivN.1VY7eXcekjMsOu5izu6rvVLjQT3f2.buRtMS//CPxAbcHNJ5C',
    'Alex Chen',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 3. Org Membership
INSERT INTO organization_members (id, organization_id, user_id, role, created_at)
VALUES ('mem-demo-001', 'org-demo', 'usr-demo-001', 'OWNER', CURRENT_TIMESTAMP);

-- 4. Projects
INSERT INTO projects (id, organization_id, name, description, color, created_at)
VALUES 
('proj-1', 'org-demo', 'Core Infrastructure', 'Primary edge APIs and auth gateways', '#6366F1', CURRENT_TIMESTAMP),
('proj-2', 'org-demo', 'Payments & Billing', 'Stripe, PayPal, and settlement webhooks', '#22C55E', CURRENT_TIMESTAMP),
('proj-3', 'org-demo', 'Search & Catalog', 'Product catalog cache and elastic search endpoints', '#06B6D4', CURRENT_TIMESTAMP);

-- 5. Seed Monitors
INSERT INTO monitors (id, organization_id, project_id, name, url, method, expected_status_code, interval_seconds, timeout_seconds, headers_json, environment, is_active, status, consecutive_failures, created_at, updated_at)
VALUES
('mon-101', 'org-demo', 'proj-1', 'Identity & Auth Gateway', 'https://httpbin.org/status/200', 'GET', 200, 30, 5, '{"Accept":"application/json"}', 'PRODUCTION', TRUE, 'OPERATIONAL', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mon-102', 'org-demo', 'proj-2', 'Stripe Webhook Receiver', 'https://httpbin.org/post', 'POST', 200, 60, 5, '{"Content-Type":"application/json"}', 'PRODUCTION', TRUE, 'OPERATIONAL', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mon-103', 'org-demo', 'proj-3', 'ElasticSearch Cluster Ingest', 'https://httpbin.org/delay/1', 'GET', 200, 60, 5, '{"Accept":"application/json"}', 'PRODUCTION', TRUE, 'DEGRADED', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('mon-104', 'org-demo', 'proj-2', 'Settlement Reconciliation Batch', 'https://httpbin.org/status/504', 'GET', 200, 300, 5, '{"Accept":"application/json"}', 'PRODUCTION', TRUE, 'DOWN', 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 6. Initial Incidents
INSERT INTO incidents (id, organization_id, monitor_id, title, severity, status, assigned_user_id, started_at, detected_at, root_cause, created_at, updated_at)
VALUES (
    'inc-9001',
    'org-demo',
    'mon-104',
    'Settlement API connection timeout (HTTP 504 / Connection refused)',
    'CRITICAL',
    'INVESTIGATING',
    'usr-demo-001',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    'Database connection pool saturation during concurrent ledger reconciliation cycle.',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

INSERT INTO incident_events (id, incident_id, event_type, description, created_by_user_id, created_at)
VALUES
('ev-101', 'inc-9001', 'CREATED', 'Incident auto-created after 4 consecutive failed health checks (HTTP 504 Gateway Timeout).', NULL, CURRENT_TIMESTAMP),
('ev-102', 'inc-9001', 'ASSIGNED', 'Incident assigned to Alex Chen.', 'usr-demo-001', CURRENT_TIMESTAMP);

INSERT INTO alert_rules (id, organization_id, monitor_id, channel, trigger_condition, recipient, is_active, created_at)
VALUES ('rule-101', 'org-demo', 'mon-104', 'EMAIL', 'ON_DOWN', 'oncall-sre@pulseops.io', TRUE, CURRENT_TIMESTAMP);

