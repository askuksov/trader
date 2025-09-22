-- +goose Up
-- +goose StatementBegin
-- Insert default roles
INSERT INTO roles (name, description) VALUES
('super_admin', 'Full system access with all permissions'),
('admin', 'Administrative access for user and system management'),
('trader', 'Trading operations and access to own data'),
('viewer', 'Read-only access to own data');

-- Insert default permissions
INSERT INTO permissions (resource, action, description) VALUES
-- User management
('users', 'create', 'Create new users'),
('users', 'read', 'Read any user data'),
('users', 'update', 'Update any user data'),
('users', 'delete', 'Delete/deactivate users'),
('users', 'read_own', 'Read own user profile'),
('users', 'update_own', 'Update own user profile'),

-- Role and permission management
('roles', 'create', 'Create new roles'),
('roles', 'read', 'Read role data'),
('roles', 'update', 'Update role data'),
('roles', 'delete', 'Delete roles'),
('permissions', 'read', 'Read permission data'),
('permissions', 'manage', 'Manage permissions and role assignments'),

-- API Keys management
('api_keys', 'create', 'Create API keys for any user'),
('api_keys', 'read', 'Read any API key data'),
('api_keys', 'update', 'Update any API key'),
('api_keys', 'delete', 'Delete any API key'),
('api_keys', 'create_own', 'Create own API keys'),
('api_keys', 'read_own', 'Read own API keys'),
('api_keys', 'update_own', 'Update own API keys'),
('api_keys', 'delete_own', 'Delete own API keys'),

-- Positions management
('positions', 'create', 'Create positions for any user'),
('positions', 'read', 'Read any position data'),
('positions', 'update', 'Update any position'),
('positions', 'delete', 'Delete any position'),
('positions', 'create_own', 'Create own positions'),
('positions', 'read_own', 'Read own positions'),
('positions', 'update_own', 'Update own positions'),
('positions', 'delete_own', 'Delete own positions'),

-- Analytics
('analytics', 'read', 'Read all analytics data'),
('analytics', 'read_own', 'Read own analytics data'),

-- System
('system', 'health_check', 'Access system health check'),
('system', 'monitoring', 'Access system monitoring'),

-- Audit logs
('audit_logs', 'read', 'Read audit log data');

-- Assign permissions to super_admin role (all permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'super_admin';

-- Assign permissions to admin role
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'admin' 
AND (
    (p.resource IN ('users', 'roles', 'permissions', 'audit_logs') AND p.action IN ('create', 'read', 'update', 'delete', 'manage'))
    OR (p.resource IN ('api_keys', 'positions', 'analytics') AND p.action LIKE '%own')
    OR (p.resource IN ('api_keys', 'positions') AND p.action LIKE 'create%')
    OR (p.resource = 'system' AND p.action IN ('health_check', 'monitoring'))
);

-- Assign permissions to trader role (own data + create operations)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'trader' 
AND (
    (p.resource IN ('api_keys', 'positions', 'analytics') AND p.action LIKE '%_own')
    OR (p.resource IN ('api_keys', 'positions') AND p.action LIKE 'create%')
    OR (p.resource = 'users' AND p.action IN ('read_own', 'update_own'))
    OR (p.resource = 'system' AND p.action = 'health_check')
);

-- Assign permissions to viewer role (read-only own data)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r 
CROSS JOIN permissions p 
WHERE r.name = 'viewer' 
AND (
    (p.resource IN ('api_keys', 'positions', 'analytics') AND p.action = 'read_own')
    OR (p.resource = 'users' AND p.action IN ('read_own', 'update_own'))
    OR (p.resource = 'system' AND p.action = 'health_check')
);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Clean up role permissions
DELETE FROM role_permissions;

-- Clean up permissions
DELETE FROM permissions;

-- Clean up roles
DELETE FROM roles;
-- +goose StatementEnd
