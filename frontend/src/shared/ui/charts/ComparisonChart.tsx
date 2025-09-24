import React from 'react'
import { LineData } from 'lightweight-charts'
import TradingChart from './TradingChart'

interface ComparisonChartProps {
  assets: Array<{
    symbol: string
    data: LineData[]
    color: string
  }>
  height?: number
  theme?: 'light' | 'dark'
  loading?: boolean
  className?: string
}

export const ComparisonChart: React.FC<ComparisonChartProps> = ({
  assets,
  height = 400,
  theme = 'light',
  loading = false,
  className,
}) => {
  // For multi-asset comparison, we'll use the first asset as primary
  // In a real implementation, this would overlay multiple series
  const primaryAsset = assets[0]
  
  if (!primaryAsset || primaryAsset.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No comparison data available
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Asset Performance Comparison</h3>
        <div className="flex flex-wrap gap-4">
          {assets.map((asset) => (
            <div key={asset.symbol} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: asset.color }}
              />
              <span className="text-sm font-medium">{asset.symbol}</span>
            </div>
          ))}
        </div>
      </div>
      <TradingChart
        data={primaryAsset.data}
        seriesType="line"
        height={height}
        theme={theme}
        loading={loading}
        className="border rounded-lg"
      />
    </div>
  )
}

export default ComparisonChart
