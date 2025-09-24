import React, { forwardRef, useRef, useImperativeHandle } from 'react'
import { 
  CandlestickData,
  SeriesMarker,
  CreatePriceLineOptions,
  LineStyle,
  UTCTimestamp 
} from 'lightweight-charts'
import TradingChart, { TradingChartProps } from './TradingChart'
import { dcaMarkerStyle, takeProfitMarkerStyle } from './chart-themes'

export interface ChartDataManager {
  updateCandlestick: (data: CandlestickData) => void
  addMarker: (marker: SeriesMarker<UTCTimestamp>) => void
  setPriceLine: (price: number, color: string, style?: Partial<CreatePriceLineOptions>) => void
  setVisibleRange: (from: number, to: number) => void
  takeScreenshot: () => string
}

interface ChartContainerProps extends Omit<TradingChartProps, 'markers' | 'priceLines'> {
  onChartReady?: (chartManager: ChartDataManager) => void
  dcaLevels?: Array<{ level: number; price: number }>
  takeProfitLevels?: Array<{ level: number; price: number }>
}

export const ChartContainer = forwardRef<ChartDataManager, ChartContainerProps>(
  ({ dcaLevels = [], takeProfitLevels = [], onChartReady, ...chartProps }, ref) => {
    const markersRef = useRef<SeriesMarker<UTCTimestamp>[]>([])
    const priceLinesRef = useRef<CreatePriceLineOptions[]>([])

    // Generate markers for DCA and TP levels
    const generateMarkers = (): SeriesMarker<UTCTimestamp>[] => {
      const markers: SeriesMarker<UTCTimestamp>[] = []
      const currentTime = Math.floor(Date.now() / 1000) as UTCTimestamp

      // Add DCA markers
      dcaLevels.forEach(({ level, price }) => {
        markers.push({
          time: currentTime,
          position: 'belowBar',
          color: dcaMarkerStyle.color,
          shape: 'arrowDown',
          text: `DCA ${level}: $${price.toFixed(4)}`,
        })
      })

      // Add Take Profit markers
      takeProfitLevels.forEach(({ level, price }) => {
        markers.push({
          time: currentTime,
          position: 'aboveBar',
          color: takeProfitMarkerStyle.color,
          shape: 'arrowUp',
          text: `TP ${level}: $${price.toFixed(4)}`,
        })
      })

      return markers
    }

    // Generate price lines for levels
    const generatePriceLines = (): CreatePriceLineOptions[] => {
      const priceLines: CreatePriceLineOptions[] = []

      // Add DCA price lines
      dcaLevels.forEach(({ level, price }) => {
        priceLines.push({
          price,
          color: dcaMarkerStyle.color,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `DCA ${level}`,
        })
      })

      // Add Take Profit price lines
      takeProfitLevels.forEach(({ level, price }) => {
        priceLines.push({
          price,
          color: takeProfitMarkerStyle.color,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title: `TP ${level}`,
        })
      })

      return priceLines
    }

    // Chart data manager implementation
    const chartManager: ChartDataManager = {
      updateCandlestick: (data: CandlestickData) => {
        console.log('Updating candlestick data:', data)
      },
      addMarker: (marker: SeriesMarker<UTCTimestamp>) => {
        markersRef.current.push(marker)
      },
      setPriceLine: (price: number, color: string, style?: Partial<CreatePriceLineOptions>) => {
        const priceLine: CreatePriceLineOptions = {
          price,
          color,
          lineWidth: style?.lineWidth ?? 1,
          lineStyle: style?.lineStyle ?? LineStyle.Solid,
          axisLabelVisible: style?.axisLabelVisible ?? true,
          title: style?.title ?? `${price}`,
        }
        priceLinesRef.current.push(priceLine)
      },
      setVisibleRange: (from: number, to: number) => {
        console.log('Setting visible range:', from, to)
      },
      takeScreenshot: () => {
        console.log('Taking screenshot')
        return 'data:image/png;base64,...'
      },
    }

    // Expose chart manager via ref
    useImperativeHandle(ref, () => chartManager, [])

    // Call onChartReady when component mounts
    React.useEffect(() => {
      if (onChartReady) {
        onChartReady(chartManager)
      }
    }, [onChartReady])

    const markers = generateMarkers()
    const priceLines = generatePriceLines()

    return (
      <TradingChart
        {...chartProps}
        markers={markers}
        priceLines={priceLines}
      />
    )
  }
)

ChartContainer.displayName = 'ChartContainer'

export default ChartContainer
