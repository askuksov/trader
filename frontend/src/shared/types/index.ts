/**
 * Core entity types for the trading application
 */

export interface Position {
  id: number
  trading_pair: string
  status: 'active' | 'completed' | 'paused' | 'error'
  total_invested: number
  total_quantity: number
  average_price: number
  current_price: number
  realized_profit: number
  unrealized_profit: number
  created_at: string
  updated_at: string
}

export interface ApiKey {
  id: number
  name: string
  exchange: 'hitbtc' | 'binance'
  status: 'active' | 'inactive' | 'error'
  description?: string
  created_at: string
  last_used_at: string | null
}

export interface DCALevel {
  id: number
  position_id: number
  level: number
  trigger_price_percent: number
  trigger_price: number
  amount: number
  status: 'pending' | 'triggered' | 'filled' | 'cancelled'
  executed_at: string | null
}

/**
 * UI state types
 */
export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  timestamp: Date
}

export interface DateRange {
  from: Date
  to: Date
}

/**
 * Theme types
 */
export type Theme = 'light' | 'dark' | 'system'

/**
 * Chart data types
 */
export interface ChartDataPoint {
  timestamp: number
  value: number
  label?: string
}

export interface CandlestickData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}
