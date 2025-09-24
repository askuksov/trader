import React from 'react'
import { HistogramData } from 'lightweight-charts'
import TradingChart from './TradingChart'
import { tradingColors } from './chart-themes'

interface VolumeChartProps {
  volumeData: HistogramData[]
  height?: number
  theme?: 'light' | 'dark'
  loading?: boolean
  className?: string
  showMetrics?: boolean
}

export const VolumeChart: React.FC<VolumeChartProps> = ({
  volumeData,
  height = 200,
  theme = 'light',
  loading = false,
  className,
  showMetrics = true,
}) => {
  if (volumeData.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-muted-foreground">
        No volume data available
      </div>
    )
  }

  // Calculate volume metrics
  const totalVolume = volumeData.reduce((sum, point) => sum + (point.value || 0), 0)
  const avgVolume = totalVolume / volumeData.length
  const maxVolume = Math.max(...volumeData.map(point => point.value || 0))
  const minVolume = Math.min(...volumeData.map(point => point.value || 0))

  // Color volume bars (usually green for up, red for down, or neutral)
  const coloredVolumeData = volumeData.map(point => ({
    ...point,
    color: tradingColors.volume.up, // In real implementation, this would be based on price direction
  }))

  return (
    <div className={className}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Trading Volume Analysis</h3>
        {showMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-muted-foreground">Total Volume</div>
              <div className="font-medium">
                {(totalVolume / 1000000).toFixed(2)}M
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-muted-foreground">Avg Volume</div>
              <div className="font-medium">
                {(avgVolume / 1000).toFixed(0)}K
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-muted-foreground">Max Volume</div>
              <div className="font-medium">
                {(maxVolume / 1000).toFixed(0)}K
              </div>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-muted-foreground">Min Volume</div>
              <div className="font-medium">
                {(minVolume / 1000).toFixed(0)}K
              </div>
            </div>
          </div>
        )}
      </div>
      
      <TradingChart
        data={coloredVolumeData}
        seriesType="histogram"
        height={height}
        theme={theme}
        loading={loading}
        className="border rounded-lg"
      />
    </div>
  )
}

export default VolumeChart
