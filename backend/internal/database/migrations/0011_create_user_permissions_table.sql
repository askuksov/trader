-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    allow BOOLEAN NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, permission_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE ON UPDATE CASCADE,
    
    INDEX idx_user_permissions_user (user_id),
    INDEX idx_user_permissions_permission (permission_id),
    INDEX idx_user_permissions_allow (allow)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS user_permissions;
-- +goose StatementEnd
