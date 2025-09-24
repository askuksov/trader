// Chart component exports
export { default as TradingChart } from './TradingChart'
export type { TradingChartProps } from './TradingChart'

export { default as ChartContainer } from './ChartContainer'
export type { ChartDataManager } from './ChartContainer'

export { default as ComparisonChart } from './ComparisonChart'
export { default as PortfolioChart } from './PortfolioChart'
export { default as PnLChart } from './PnLChart'
export { default as VolumeChart } from './VolumeChart'

// Theme exports
export {
  lightChartOptions,
  darkChartOptions,
  dcaMarkerStyle,
  takeProfitMarkerStyle,
  tradingColors,
  getChartOptions,
} from './chart-themes'

// Re-export common types from lightweight-charts
export type {
  CandlestickData,
  LineData,
  HistogramData,
  SeriesMarker,
  CreatePriceLineOptions,
  MouseEventParams,
  LogicalRange,
  IChartApi,
  ISeriesApi,
} from 'lightweight-charts'
