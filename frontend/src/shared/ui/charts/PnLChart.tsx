import React from 'react'
import { LineData, HistogramData } from 'lightweight-charts'
import TradingChart from './TradingChart'
import { tradingColors } from './chart-themes'

interface PnLChartProps {
  pnlData: LineData[]
  chartType?: 'line' | 'histogram'
  height?: number
  theme?: 'light' | 'dark'
  loading?: boolean
  className?: string
  showMetrics?: boolean
}

export const PnLChart: React.FC<PnLChartProps> = ({
  pnlData,
  chartType = 'line',
  height = 300,
  theme = 'light',
  loading = false,
  className,
  showMetrics = true,
}) => {
  if (pnlData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No P&L data available
      </div>
    )
  }

  // Calculate metrics
  const totalPnL = pnlData.reduce((sum, point) => sum + (point.value || 0), 0)
  const positivePoints = pnlData.filter(point => (point.value || 0) > 0)
  const negativePoints = pnlData.filter(point => (point.value || 0) < 0)
  const winRate = pnlData.length > 0 ? (positivePoints.length / pnlData.length) * 100 : 0
  const avgWin = positivePoints.length > 0 
    ? positivePoints.reduce((sum, point) => sum + (point.value || 0), 0) / positivePoints.length 
    : 0
  const avgLoss = negativePoints.length > 0
    ? Math.abs(negativePoints.reduce((sum, point) => sum + (point.value || 0), 0) / negativePoints.length)
    : 0

  // Convert to histogram data if needed
  const chartData = chartType === 'histogram' 
    ? pnlData.map(point => ({
        time: point.time,
        value: point.value || 0,
        color: (point.value || 0) >= 0 ? tradingColors.profit : tradingColors.loss,
      }) as HistogramData)
    : pnlData

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Profit & Loss Analysis</h3>
        {showMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-muted-foreground">Total P&L</div>
              <div className={`font-medium ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${totalPnL.toFixed(2)}
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-muted-foreground">Win Rate</div>
              <div className="font-medium">{winRate.toFixed(1)}%</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-muted-foreground">Avg Win</div>
              <div className="font-medium text-green-600">${avgWin.toFixed(2)}</div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-muted-foreground">Avg Loss</div>
              <div className="font-medium text-red-600">${avgLoss.toFixed(2)}</div>
            </div>
          </div>
        )}
      </div>
      
      <TradingChart
        data={chartData}
        seriesType={chartType}
        height={height}
        theme={theme}
        loading={loading}
        className="border rounded-lg"
      />
    </div>
  )
}

export default PnLChart
