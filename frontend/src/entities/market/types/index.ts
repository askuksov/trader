export interface MarketData {
  symbol: string;
  price: number;
  price_change_24h: number;
  price_change_percent_24h: number;
  high_24h: number;
  low_24h: number;
  volume_24h: number;
  quote_volume_24h: number;
  timestamp: number;
}

export interface CandlestickData {
  time: number; // Unix timestamp
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradingPair {
  symbol: string;
  base_asset: string;
  quote_asset: string;
  status: 'TRADING' | 'BREAK' | 'HALT';
  base_precision: number;
  quote_precision: number;
  min_order_size: number;
  max_order_size: number;
  min_price: number;
  max_price: number;
  tick_size: number;
  current_price?: number;
  volume_24h?: number;
  change_24h_percent?: number;
}

export interface MarketStats {
  symbol: string;
  price_change: number;
  price_change_percent: number;
  weighted_avg_price: number;
  prev_close_price: number;
  last_price: number;
  last_qty: number;
  bid_price: number;
  ask_price: number;
  open_price: number;
  high_price: number;
  low_price: number;
  volume: number;
  quote_volume: number;
  open_time: number;
  close_time: number;
  count: number;
}

export interface PriceAlert {
  id: number;
  symbol: string;
  condition: 'above' | 'below' | 'crosses_up' | 'crosses_down';
  target_price: number;
  current_price: number;
  status: 'active' | 'triggered' | 'disabled';
  created_at: string;
  triggered_at?: string;
  message?: string;
}

export interface CreatePriceAlertRequest {
  symbol: string;
  condition: 'above' | 'below' | 'crosses_up' | 'crosses_down';
  target_price: number;
  message?: string;
}

// Chart intervals for candlestick data
export type ChartInterval = 
  | '1m' | '3m' | '5m' | '15m' | '30m'
  | '1h' | '2h' | '4h' | '6h' | '8h' | '12h'
  | '1d' | '3d' | '1w' | '1M';

export const CHART_INTERVALS: Array<{
  value: ChartInterval;
  label: string;
  duration: number; // in milliseconds
}> = [
  { value: '1m', label: '1 minute', duration: 60 * 1000 },
  { value: '3m', label: '3 minutes', duration: 3 * 60 * 1000 },
  { value: '5m', label: '5 minutes', duration: 5 * 60 * 1000 },
  { value: '15m', label: '15 minutes', duration: 15 * 60 * 1000 },
  { value: '30m', label: '30 minutes', duration: 30 * 60 * 1000 },
  { value: '1h', label: '1 hour', duration: 60 * 60 * 1000 },
  { value: '2h', label: '2 hours', duration: 2 * 60 * 60 * 1000 },
  { value: '4h', label: '4 hours', duration: 4 * 60 * 60 * 1000 },
  { value: '6h', label: '6 hours', duration: 6 * 60 * 60 * 1000 },
  { value: '8h', label: '8 hours', duration: 8 * 60 * 60 * 1000 },
  { value: '12h', label: '12 hours', duration: 12 * 60 * 60 * 1000 },
  { value: '1d', label: '1 day', duration: 24 * 60 * 60 * 1000 },
  { value: '3d', label: '3 days', duration: 3 * 24 * 60 * 60 * 1000 },
  { value: '1w', label: '1 week', duration: 7 * 24 * 60 * 60 * 1000 },
  { value: '1M', label: '1 month', duration: 30 * 24 * 60 * 60 * 1000 },
];

// Order book data structure
export interface OrderBookLevel {
  price: number;
  quantity: number;
  total: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  last_update_id: number;
  timestamp: number;
}

// Trade data structure
export interface Trade {
  id: number;
  symbol: string;
  price: number;
  quantity: number;
  time: number;
  is_buyer_maker: boolean;
}

// WebSocket message types for real-time data
export interface MarketDataUpdate {
  type: 'ticker' | 'kline' | 'depth' | 'trade';
  symbol: string;
  data: MarketData | CandlestickData | OrderBook | Trade;
  timestamp: number;
}

// Market overview data
export interface MarketOverview {
  total_market_cap: number;
  total_volume_24h: number;
  bitcoin_dominance: number;
  active_cryptocurrencies: number;
  market_cap_change_percentage_24h: number;
  fear_greed_index?: {
    value: number;
    classification: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  };
}

// Popular trading pairs for quick access
export const POPULAR_PAIRS = [
  'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'DOTUSDT',
  'XRPUSDT', 'LTCUSDT', 'LINKUSDT', 'BCHUSDT', 'XLMUSDT',
  'UNIUSDT', 'VETUSDT', 'EOSUSDT', 'TRXUSDT', 'FILUSDT'
] as const;
