-- +goose Up
-- +goose StatementBegin
CREATE TABLE IF NOT EXISTS trading_pairs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    exchange_id BIGINT UNSIGNED NOT NULL,
    base_coin_id BIGINT UNSIGNED NOT NULL,
    quote_coin_id BIGINT UNSIGNED NOT NULL,
    symbol VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    min_order_size DECIMAL(20,8) DEFAULT 0,
    max_order_size DECIMAL(20,8) DEFAULT 0,
    price_precision INT DEFAULT 8,
    quantity_precision INT DEFAULT 8,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    INDEX idx_trading_pairs_deleted_at (deleted_at),
    INDEX idx_exchange_active (exchange_id, is_active),
    UNIQUE INDEX uniq_exchange_symbol (exchange_id, symbol),
    CONSTRAINT fk_trading_pairs_exchange_id 
        FOREIGN KEY (exchange_id) REFERENCES exchanges(id) 
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_trading_pairs_base_coin_id 
        FOREIGN KEY (base_coin_id) REFERENCES coins(id) 
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_trading_pairs_quote_coin_id 
        FOREIGN KEY (quote_coin_id) REFERENCES coins(id) 
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP TABLE IF EXISTS trading_pairs;
-- +goose StatementEnd
