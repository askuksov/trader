import type { PositionStatus, DateRange } from '@/shared/lib/stores';

export interface Position {
  id: number;
  trading_pair: string;
  status: PositionStatus;
  total_invested: number;
  total_quantity: number;
  average_price: number;
  current_price: number;
  current_value: number;
  realized_profit: number;
  unrealized_profit: number;
  unrealized_profit_percent: number;
  api_key_id: number;
  api_key_name: string;
  created_at: string;
  updated_at: string;
  name?: string;
  description?: string;
}

export interface DCALevel {
  id: number;
  position_id: number;
  level: number;
  trigger_price_percent: number;
  trigger_price: number;
  amount: number;
  amount_percent: number;
  status: 'pending' | 'triggered' | 'filled' | 'cancelled';
  executed_at: string | null;
  executed_price?: number;
  executed_quantity?: number;
}

export interface TakeProfit {
  id: number;
  position_id: number;
  level: number;
  trigger_price_percent: number;
  trigger_price: number;
  quantity_percent: number;
  quantity: number;
  status: 'pending' | 'triggered' | 'filled' | 'cancelled';
  executed_at: string | null;
  executed_price?: number;
  executed_quantity?: number;
}

export interface TransactionHistory {
  id: number;
  position_id: number;
  type: 'buy' | 'sell' | 'dca' | 'take_profit';
  amount: number;
  price: number;
  quantity: number;
  fee: number;
  total: number;
  status: 'pending' | 'completed' | 'failed';
  transaction_id?: string;
  executed_at: string;
  notes?: string;
}

export interface CreatePositionRequest {
  api_key_id: number;
  trading_pair: string;
  name?: string;
  description?: string;
  deposit_amount: number;
  initial_percent: number;
  dca_levels: Array<{
    trigger_percent: number;
    amount_percent: number;
  }>;
  take_profits: Array<{
    price_percent: number;
    quantity_percent: number;
  }>;
}

export interface UpdatePositionRequest {
  name?: string;
  description?: string;
}

export interface PositionDetailsResponse {
  position: Position;
  dca_levels: DCALevel[];
  take_profits: TakeProfit[];
  recent_transactions: TransactionHistory[];
  performance_metrics: {
    total_fees_paid: number;
    average_buy_price: number;
    highest_profit: number;
    lowest_profit: number;
    duration_days: number;
    roi_percent: number;
  };
}

export interface PositionFilters {
  status: PositionStatus[];
  tradingPairs: string[];
  apiKeyIds: number[];
  dateRange: DateRange | null;
  search: string;
  sortBy: 'created_at' | 'updated_at' | 'total_invested' | 'unrealized_pnl';
  sortOrder: 'asc' | 'desc';
}

// Real-time update types
export interface PositionUpdate {
  position_id: number;
  current_price: number;
  current_value: number;
  unrealized_profit: number;
  unrealized_profit_percent: number;
  dca_level_triggered?: number;
  take_profit_executed?: number;
  timestamp: string;
}

export interface DCALevelTriggered {
  position_id: number;
  level: number;
  trigger_price: number;
  amount: number;
  executed_price: number;
  executed_quantity: number;
  timestamp: string;
}

export interface TakeProfitExecuted {
  position_id: number;
  level: number;
  trigger_price: number;
  quantity: number;
  executed_price: number;
  executed_quantity: number;
  profit: number;
  timestamp: string;
}
