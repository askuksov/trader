-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_password_reset_tokens_user (user_id),
    INDEX idx_password_reset_tokens_token (token),
    INDEX idx_password_reset_tokens_expires (expires_at),
    INDEX idx_password_reset_tokens_used (used_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS password_reset_tokens;
-- +goose StatementEnd
