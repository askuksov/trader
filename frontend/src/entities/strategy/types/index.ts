export interface DCAStrategySettings {
  // Purchase distribution
  initial_amount_percent: number; // First purchase (30-70%)
  
  // DCA trigger levels  
  dca_levels: Array<{
    trigger_percent: number; // Price drop (-2% to -20%)
    amount_percent: number;  // Purchase amount (5-40%)
  }>;
  
  // Take-profit configuration
  take_profit_levels: Array<{
    trigger_percent: number;  // Price gain (+5% to +50%)
    quantity_percent: number; // Sell quantity (10-50%)
  }>;
  
  // Risk management
  max_positions_per_key: number;     // Concurrent positions (1-10)
  max_amount_per_position: number;   // Maximum investment per position
  stop_loss_percent?: number;        // Emergency stop-loss (-50% to -10%)
  daily_loss_limit?: number;         // Daily loss limit in USD
}

export interface PairSettings {
  pair: string;
  enabled: boolean;
  override_global: boolean;
  custom_settings?: Partial<DCAStrategySettings>;
  max_position_size?: number;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
}

export interface StrategyPreset {
  id: string;
  name: string;
  description: string;
  settings: DCAStrategySettings;
  is_default: boolean;
  is_custom: boolean;
  created_at: string;
  risk_level: 'conservative' | 'balanced' | 'aggressive';
}

export interface CreatePresetRequest {
  name: string;
  description: string;
  settings: DCAStrategySettings;
  risk_level: 'conservative' | 'balanced' | 'aggressive';
}

export interface SupportedPair {
  symbol: string;
  base_currency: string;
  quote_currency: string;
  min_order_size: number;
  max_order_size: number;
  price_precision: number;
  quantity_precision: number;
  status: 'active' | 'inactive';
  last_price?: number;
  volume_24h?: number;
  change_24h_percent?: number;
}

// Strategy validation constraints
export const STRATEGY_CONSTRAINTS = {
  initial_amount_percent: { min: 30, max: 70 },
  dca_levels: {
    maxCount: 10,
    trigger_percent: { min: -50, max: -1 },
    amount_percent: { min: 5, max: 40 },
  },
  take_profit_levels: {
    maxCount: 10,
    trigger_percent: { min: 5, max: 100 },
    quantity_percent: { min: 10, max: 50 },
  },
  max_positions_per_key: { min: 1, max: 10 },
  max_amount_per_position: { min: 10, max: 10000 },
  stop_loss_percent: { min: -50, max: -10 },
  daily_loss_limit: { min: 10, max: 10000 },
} as const;

// Default strategy presets
export const DEFAULT_PRESETS: Omit<StrategyPreset, 'id' | 'created_at' | 'is_custom'>[] = [
  {
    name: 'Conservative',
    description: 'Low-risk strategy with smaller position sizes and conservative DCA levels',
    is_default: true,
    risk_level: 'conservative',
    settings: {
      initial_amount_percent: 50,
      dca_levels: [
        { trigger_percent: -5, amount_percent: 15 },
        { trigger_percent: -10, amount_percent: 20 },
        { trigger_percent: -15, amount_percent: 15 },
      ],
      take_profit_levels: [
        { trigger_percent: 8, quantity_percent: 25 },
        { trigger_percent: 15, quantity_percent: 35 },
        { trigger_percent: 25, quantity_percent: 40 },
      ],
      max_positions_per_key: 3,
      max_amount_per_position: 500,
      stop_loss_percent: -25,
      daily_loss_limit: 100,
    },
  },
  {
    name: 'Balanced',
    description: 'Moderate risk strategy with balanced DCA levels and take-profits',
    is_default: true,
    risk_level: 'balanced',
    settings: {
      initial_amount_percent: 40,
      dca_levels: [
        { trigger_percent: -3, amount_percent: 15 },
        { trigger_percent: -7, amount_percent: 20 },
        { trigger_percent: -12, amount_percent: 15 },
        { trigger_percent: -18, amount_percent: 10 },
      ],
      take_profit_levels: [
        { trigger_percent: 6, quantity_percent: 20 },
        { trigger_percent: 12, quantity_percent: 30 },
        { trigger_percent: 20, quantity_percent: 30 },
        { trigger_percent: 35, quantity_percent: 20 },
      ],
      max_positions_per_key: 5,
      max_amount_per_position: 1000,
      stop_loss_percent: -30,
      daily_loss_limit: 200,
    },
  },
  {
    name: 'Aggressive',
    description: 'High-risk strategy with deeper DCA levels and higher position sizes',
    is_default: true,
    risk_level: 'aggressive',
    settings: {
      initial_amount_percent: 30,
      dca_levels: [
        { trigger_percent: -2, amount_percent: 10 },
        { trigger_percent: -5, amount_percent: 15 },
        { trigger_percent: -10, amount_percent: 20 },
        { trigger_percent: -16, amount_percent: 15 },
        { trigger_percent: -25, amount_percent: 10 },
      ],
      take_profit_levels: [
        { trigger_percent: 5, quantity_percent: 15 },
        { trigger_percent: 10, quantity_percent: 25 },
        { trigger_percent: 18, quantity_percent: 30 },
        { trigger_percent: 30, quantity_percent: 20 },
        { trigger_percent: 50, quantity_percent: 10 },
      ],
      max_positions_per_key: 8,
      max_amount_per_position: 2000,
      stop_loss_percent: -40,
      daily_loss_limit: 500,
    },
  },
];
