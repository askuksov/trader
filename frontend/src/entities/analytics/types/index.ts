export interface DashboardMetrics {
  // Portfolio metrics
  total_invested: number;
  total_current_value: number;
  total_realized_pnl: number;
  total_unrealized_pnl: number;
  total_pnl_percent: number;
  
  // Position statistics  
  active_positions: number;
  completed_positions: number;
  paused_positions: number;
  average_position_duration: number;
  
  // Performance metrics
  win_rate_percent: number;
  average_profit_per_position: number;
  best_performing_pair: string;
  worst_performing_pair: string;
  sharpe_ratio?: number;
  max_drawdown_percent: number;
}

export interface PerformanceData {
  date: string;
  portfolio_value: number;
  invested_amount: number;
  realized_pnl: number;
  unrealized_pnl: number;
  total_pnl: number;
  roi_percent: number;
  active_positions_count: number;
}

export interface PositionsSummary {
  total_positions: number;
  status_breakdown: {
    active: number;
    completed: number;
    paused: number;
    error: number;
  };
  performance_stats: {
    profitable_positions: number;
    losing_positions: number;
    break_even_positions: number;
    average_duration_days: number;
    median_profit_percent: number;
    largest_profit: number;
    largest_loss: number;
  };
}

export interface PairPerformance {
  trading_pair: string;
  total_positions: number;
  completed_positions: number;
  total_invested: number;
  total_pnl: number;
  pnl_percent: number;
  win_rate: number;
  average_duration_days: number;
  last_trade_date: string | null;
  current_positions: number;
}

export interface ApiKeyPerformance {
  api_key_id: number;
  api_key_name: string;
  exchange: string;
  total_positions: number;
  completed_positions: number;
  total_invested: number;
  total_pnl: number;
  pnl_percent: number;
  win_rate: number;
  average_position_size: number;
  current_positions: number;
}

export interface CompletedPositionData {
  id: number;
  trading_pair: string;
  api_key_name: string;
  total_invested: number;
  final_value: number;
  realized_pnl: number;
  pnl_percent: number;
  duration_days: number;
  completed_at: string;
  dca_levels_used: number;
  take_profits_hit: number;
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  date_range: {
    from: string;
    to: string;
  };
  include_closed_positions: boolean;
  include_transaction_history: boolean;
  include_analytics: boolean;
  filters?: {
    trading_pairs?: string[];
    api_key_ids?: number[];
    min_profit?: number;
    max_loss?: number;
  };
}

// Chart configuration types for analytics
export interface ChartConfig {
  type: 'line' | 'bar' | 'heatmap' | 'scatter' | 'pie' | 'candlestick';
  timeframe: '24h' | '7d' | '30d' | '3m' | '1y' | 'all';
  groupBy: 'hour' | 'day' | 'week' | 'month';
  metrics: PerformanceMetric[];
}

export type PerformanceMetric = 
  | 'portfolio_value'
  | 'invested_amount'
  | 'realized_pnl'
  | 'unrealized_pnl'
  | 'total_pnl'
  | 'roi_percent'
  | 'active_positions'
  | 'completed_positions';

// Risk analysis types
export interface RiskMetrics {
  sharpe_ratio: number;
  sortino_ratio: number;
  max_drawdown_percent: number;
  max_drawdown_duration_days: number;
  volatility: number;
  var_95: number; // Value at Risk 95%
  cvar_95: number; // Conditional Value at Risk 95%
  win_rate: number;
  profit_factor: number;
  average_win: number;
  average_loss: number;
  win_loss_ratio: number;
  kelly_percentage: number;
}

// Performance benchmarking
export interface PerformanceBenchmark {
  period: string;
  strategy_return: number;
  benchmark_return: number; // e.g., BTC buy-and-hold
  alpha: number;
  beta: number;
  correlation: number;
  tracking_error: number;
  information_ratio: number;
}

// Heat map data for pair correlation
export interface PairCorrelation {
  pair1: string;
  pair2: string;
  correlation: number;
  period_days: number;
}
