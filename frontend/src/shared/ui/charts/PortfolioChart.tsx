import React from 'react'
import { LineData } from 'lightweight-charts'
import TradingChart from './TradingChart'
import { tradingColors } from './chart-themes'

interface PortfolioChartProps {
  portfolioValue: LineData[]
  invested: LineData[]
  height?: number
  theme?: 'light' | 'dark'
  loading?: boolean
  className?: string
  showPnL?: boolean
}

export const PortfolioChart: React.FC<PortfolioChartProps> = ({
  portfolioValue,
  invested,
  height = 400,
  theme = 'light',
  loading = false,
  className,
  showPnL = true,
}) => {
  if (portfolioValue.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No portfolio data available
      </div>
    )
  }

  // Calculate P&L percentage for the latest value
  const latestValue = portfolioValue[portfolioValue.length - 1]?.value || 0
  const latestInvested = invested[invested.length - 1]?.value || 0
  const pnlPercent = latestInvested > 0 ? ((latestValue - latestInvested) / latestInvested) * 100 : 0
  const isProfitable = pnlPercent > 0

  return (
    <div className={className}>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold">Portfolio Value Over Time</h3>
          {showPnL && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">P&L:</span>
              <span 
                className={`text-sm font-medium ${
                  isProfitable ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {isProfitable ? '+' : ''}{pnlPercent.toFixed(2)}%
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Portfolio Value</span>
            <span className="font-medium">
              ${latestValue.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span>Total Invested</span>
            <span className="font-medium">
              ${latestInvested.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      
      <TradingChart
        data={portfolioValue}
        seriesType="area"
        height={height}
        theme={theme}
        loading={loading}
        className="border rounded-lg"
      />
    </div>
  )
}

export default PortfolioChart
