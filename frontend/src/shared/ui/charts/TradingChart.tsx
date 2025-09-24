import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  LineData,
  HistogramData,
  SeriesMarker,
  CreatePriceLineOptions,
  MouseEventParams,
  LogicalRange,
  DeepPartial,
  CandlestickSeriesOptions,
  LineSeriesOptions,
  AreaSeriesOptions,
  HistogramSeriesOptions,
  UTCTimestamp,
} from 'lightweight-charts'
import { getChartOptions, tradingColors } from './chart-themes'
import { cn } from '@/shared/lib/utils'

export interface TradingChartProps {
  data: CandlestickData[] | LineData[] | HistogramData[]
  seriesType: 'candlestick' | 'line' | 'area' | 'histogram'
  loading?: boolean
  height?: number
  theme?: 'light' | 'dark'
  markers?: SeriesMarker<UTCTimestamp>[]
  priceLines?: CreatePriceLineOptions[]
  onCrosshairMove?: (param: MouseEventParams) => void
  onTimeRangeMove?: (timeRange: LogicalRange | null) => void
  className?: string
}

export const TradingChart: React.FC<TradingChartProps> = ({
  data,
  seriesType,
  loading = false,
  height = 400,
  theme = 'light',
  markers = [],
  priceLines = [],
  onCrosshairMove,
  onTimeRangeMove,
  className,
}) => {
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<any> | null>(null)
  const [isChartReady, setIsChartReady] = useState(false)

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return

    const chartOptions = getChartOptions(theme)
    chartRef.current = createChart(chartContainerRef.current, {
      ...chartOptions,
      width: chartContainerRef.current.clientWidth,
      height,
    })

    // Create series based on type
    const seriesOptions = getSeriesOptions(seriesType, theme)
    
    if (seriesType === 'candlestick') {
      seriesRef.current = chartRef.current.addCandlestickSeries(seriesOptions as DeepPartial<CandlestickSeriesOptions>)
    } else if (seriesType === 'line') {
      seriesRef.current = chartRef.current.addLineSeries(seriesOptions as DeepPartial<LineSeriesOptions>)
    } else if (seriesType === 'area') {
      seriesRef.current = chartRef.current.addAreaSeries(seriesOptions as DeepPartial<AreaSeriesOptions>)
    } else if (seriesType === 'histogram') {
      seriesRef.current = chartRef.current.addHistogramSeries(seriesOptions as DeepPartial<HistogramSeriesOptions>)
    }

    // Set up event listeners
    if (onCrosshairMove) {
      chartRef.current.subscribeCrosshairMove(onCrosshairMove)
    }

    if (onTimeRangeMove) {
      chartRef.current.timeScale().subscribeVisibleLogicalRangeChange(onTimeRangeMove)
    }

    setIsChartReady(true)

    // Cleanup function
    return () => {
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        seriesRef.current = null
        setIsChartReady(false)
      }
    }
  }, [theme, seriesType, height, onCrosshairMove, onTimeRangeMove])

  // Update data when it changes
  useEffect(() => {
    if (seriesRef.current && data.length > 0 && isChartReady) {
      seriesRef.current.setData(data as any)
    }
  }, [data, isChartReady])

  // Update markers
  useEffect(() => {
    if (seriesRef.current && markers && markers.length > 0 && isChartReady) {
      seriesRef.current.setMarkers(markers)
    }
  }, [markers, isChartReady])

  // Update price lines
  useEffect(() => {
    if (chartRef.current && seriesRef.current && isChartReady && priceLines && priceLines.length > 0) {
      // Note: In a production implementation, you'd want to track and remove specific lines
      // For now, we'll create new price lines when they change
      
      priceLines.forEach(priceLineOptions => {
        if (seriesRef.current) {
          seriesRef.current.createPriceLine(priceLineOptions)
        }
      })
    }
  }, [priceLines, isChartReady])

  // Handle resize
  const handleResize = useCallback(() => {
    if (chartRef.current && chartContainerRef.current) {
      chartRef.current.applyOptions({
        width: chartContainerRef.current.clientWidth,
        height,
      })
    }
  }, [height])

  useEffect(() => {
    const resizeObserver = new ResizeObserver(handleResize)
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current)
    }

    return () => {
      resizeObserver.disconnect()
    }
  }, [handleResize])

  if (loading) {
    return (
      <div 
        className={cn('flex items-center justify-center bg-background border rounded', className)}
        style={{ height }}
      >
        <div className="text-muted-foreground">Loading chart...</div>
      </div>
    )
  }

  return (
    <div 
      ref={chartContainerRef} 
      className={cn('w-full bg-background border rounded', className)}
      style={{ height }}
    />
  )
}

function getSeriesOptions(seriesType: string, theme: 'light' | 'dark') {
  const colors = tradingColors
  
  switch (seriesType) {
    case 'candlestick':
      return {
        upColor: colors.candlestick.upColor,
        downColor: colors.candlestick.downColor,
        borderUpColor: colors.candlestick.borderUpColor,
        borderDownColor: colors.candlestick.borderDownColor,
        wickUpColor: colors.candlestick.wickUpColor,
        wickDownColor: colors.candlestick.wickDownColor,
      }
    case 'line':
      return {
        color: colors.profit,
        lineWidth: 2,
      }
    case 'area':
      return {
        lineColor: colors.profit,
        topColor: colors.profit,
        bottomColor: theme === 'dark' ? '#1a1a1a' : '#ffffff',
        lineWidth: 2,
      }
    case 'histogram':
      return {
        color: colors.neutral,
      }
    default:
      return {}
  }
}

export default TradingChart
