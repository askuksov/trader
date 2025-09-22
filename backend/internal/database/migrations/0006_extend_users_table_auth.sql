-- +goose Up
-- +goose StatementBegin
-- Extend users table with authentication fields
ALTER TABLE users 
ADD COLUMN password_hash VARCHAR(255) NOT NULL AFTER last_name,
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE AFTER password_hash,
ADD COLUMN last_login_at TIMESTAMP NULL AFTER email_verified,
ADD COLUMN login_attempts INT DEFAULT 0 AFTER last_login_at,
ADD COLUMN locked_until TIMESTAMP NULL AFTER login_attempts;

-- Add indexes for performance
CREATE INDEX idx_users_login_attempts ON users(login_attempts);
CREATE INDEX idx_users_locked_until ON users(locked_until);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Remove added columns
ALTER TABLE users 
DROP COLUMN password_hash,
DROP COLUMN email_verified,
DROP COLUMN last_login_at,
DROP COLUMN login_attempts,
DROP COLUMN locked_until;

-- Drop indexes
DROP INDEX idx_users_login_attempts ON users;
DROP INDEX idx_users_locked_until ON users;
-- +goose StatementEnd
