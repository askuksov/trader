import {
  DeepPartial,
  ChartOptions,
  CrosshairMode,
} from 'lightweight-charts'

export const lightChartOptions: DeepPartial<ChartOptions> = {
  layout: {
    background: { color: '#ffffff' },
    textColor: '#333333',
  },
  grid: {
    vertLines: { color: '#f0f0f0' },
    horzLines: { color: '#f0f0f0' },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
  },
  timeScale: {
    borderColor: '#cccccc',
    timeVisible: true,
    secondsVisible: false,
  },
  rightPriceScale: {
    borderColor: '#cccccc',
  },
  leftPriceScale: {
    borderColor: '#cccccc',
    visible: false,
  },
}

export const darkChartOptions: DeepPartial<ChartOptions> = {
  layout: {
    background: { color: '#1a1a1a' },
    textColor: '#ffffff',
  },
  grid: {
    vertLines: { color: '#2a2a2a' },
    horzLines: { color: '#2a2a2a' },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
  },
  timeScale: {
    borderColor: '#555555',
    timeVisible: true,
    secondsVisible: false,
  },
  rightPriceScale: {
    borderColor: '#555555',
  },
  leftPriceScale: {
    borderColor: '#555555',
    visible: false,
  },
}

// DCA/TP marker configurations
export const dcaMarkerStyle = {
  color: '#26a69a',
  labelBackgroundColor: '#26a69a',
  shape: 'arrowDown' as const,
}

export const takeProfitMarkerStyle = {
  color: '#ef5350',
  labelBackgroundColor: '#ef5350',
  shape: 'arrowUp' as const,
}

// Trading-specific color palette
export const tradingColors = {
  profit: '#26a69a', // Green for gains
  loss: '#ef5350', // Red for losses
  neutral: '#78909c', // Gray for neutral
  warning: '#ffa726', // Orange for warnings
  volume: {
    up: '#26a69a',
    down: '#ef5350',
  },
  candlestick: {
    upColor: '#26a69a',
    downColor: '#ef5350',
    borderUpColor: '#26a69a',
    borderDownColor: '#ef5350',
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
  },
} as const

export function getChartOptions(theme: 'light' | 'dark'): DeepPartial<ChartOptions> {
  return theme === 'dark' ? darkChartOptions : lightChartOptions
}
