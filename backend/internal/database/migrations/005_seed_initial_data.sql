-- +goose Up
-- +goose StatementBegin
-- Insert exchanges
INSERT INTO exchanges (name, code, is_active, api_url, website_url) VALUES
('HitBTC', 'hitbtc', TRUE, 'https://api.hitbtc.com', 'https://hitbtc.com')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    is_active = VALUES(is_active),
    api_url = VALUES(api_url),
    website_url = VALUES(website_url);
-- +goose StatementEnd

-- +goose StatementBegin
-- Insert coins
INSERT INTO coins (symbol, name, is_active, sort_order) VALUES
('BTC', 'Bitcoin', TRUE, 1),
('ETH', 'Ethereum', TRUE, 2),
('USDT', 'Tether', TRUE, 3),
('BNB', 'Binance Coin', TRUE, 4),
('ADA', 'Cardano', TRUE, 5),
('SOL', 'Solana', TRUE, 6),
('XRP', 'Ripple', TRUE, 7),
('DOT', 'Polkadot', TRUE, 8),
('DOGE', 'Dogecoin', TRUE, 9),
('AVAX', 'Avalanche', TRUE, 10)
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    is_active = VALUES(is_active),
    sort_order = VALUES(sort_order);
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- Remove seeded data
DELETE FROM trading_pairs;
DELETE FROM coins WHERE symbol IN ('BTC', 'ETH', 'USDT', 'BNB', 'ADA', 'SOL', 'XRP', 'DOT', 'DOGE', 'AVAX');
DELETE FROM exchanges WHERE code = 'hitbtc';
-- +goose StatementEnd
