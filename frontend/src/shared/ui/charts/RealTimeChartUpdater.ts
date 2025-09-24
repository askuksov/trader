import { 
  IChartApi, 
  ISeriesApi, 
  CandlestickData, 
  SeriesMarker,
  LineStyle,
  IPriceLine,
  UTCTimestamp
} from 'lightweight-charts'
import { dcaMarkerStyle, takeProfitMarkerStyle } from './chart-themes'

/**
 * Real-time chart updater for WebSocket integration
 * Manages live price updates and trading level markers
 */
export class RealTimeChartUpdater {
  private chart: IChartApi
  private candlestickSeries: ISeriesApi<'Candlestick'>
  private markers: SeriesMarker<UTCTimestamp>[] = []
  private priceLines: Map<string, IPriceLine> = new Map()

  constructor(
    chart: IChartApi,
    candlestickSeries: ISeriesApi<'Candlestick'>
  ) {
    this.chart = chart
    this.candlestickSeries = candlestickSeries
  }

  /**
   * Update the latest candlestick with new price data
   */
  updatePrice(price: CandlestickData): void {
    try {
      this.candlestickSeries.update(price)
    } catch (error) {
      console.error('Failed to update price:', error)
    }
  }

  /**
   * Add a DCA level marker to the chart
   */
  addDCAMarker(level: number, price: number, candleTime?: UTCTimestamp): void {
    const timestamp = candleTime || (Math.floor(Date.now() / 1000) as UTCTimestamp)
    const marker: SeriesMarker<UTCTimestamp> = {
      time: timestamp,
      position: 'belowBar',
      color: dcaMarkerStyle.color,
      shape: dcaMarkerStyle.shape,
      text: `DCA ${level}: $${price.toFixed(4)}`,
    }

    this.markers.push(marker)
    this.candlestickSeries.setMarkers(this.markers)
  }

  /**
   * Update the take-profit line on the chart
   */
  updateTakeProfitLine(price: number): void {
    // Remove existing TP line if it exists
    const existingLine = this.priceLines.get('takeProfit')
    if (existingLine) {
      this.candlestickSeries.removePriceLine(existingLine)
    }

    // Add new TP line
    const priceLine = this.candlestickSeries.createPriceLine({
      price,
      color: takeProfitMarkerStyle.color,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `TP: ${price.toFixed(4)}`,
    })

    this.priceLines.set('takeProfit', priceLine)
  }

  /**
   * Add a dynamic price line for DCA levels
   */
  addDCALine(level: number, price: number): void {
    const lineKey = `dca_${level}`
    
    // Remove existing line if it exists
    const existingLine = this.priceLines.get(lineKey)
    if (existingLine) {
      this.candlestickSeries.removePriceLine(existingLine)
    }

    // Add new DCA line
    const priceLine = this.candlestickSeries.createPriceLine({
      price,
      color: dcaMarkerStyle.color,
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      axisLabelVisible: true,
      title: `DCA ${level}: ${price.toFixed(4)}`,
    })

    this.priceLines.set(lineKey, priceLine)
  }

  /**
   * Remove a specific price line
   */
  removePriceLine(key: string): void {
    const line = this.priceLines.get(key)
    if (line) {
      this.candlestickSeries.removePriceLine(line)
      this.priceLines.delete(key)
    }
  }

  /**
   * Clear all markers from the chart
   */
  clearMarkers(): void {
    this.markers = []
    this.candlestickSeries.setMarkers([])
  }

  /**
   * Clear all price lines from the chart
   */
  clearPriceLines(): void {
    this.priceLines.forEach(line => {
      this.candlestickSeries.removePriceLine(line)
    })
    this.priceLines.clear()
  }

  /**
   * Set the visible time range of the chart
   */
  setVisibleRange(from: number, to: number): void {
    this.chart.timeScale().setVisibleLogicalRange({
      from,
      to,
    })
  }

  /**
   * Fit the chart content to the visible area
   */
  fitContent(): void {
    this.chart.timeScale().fitContent()
  }

  /**
   * Take a screenshot of the chart
   */
  takeScreenshot(): string {
    try {
      const canvas = this.chart.takeScreenshot()
      return canvas.toDataURL('image/png')
    } catch (error) {
      console.error('Failed to take screenshot:', error)
      return ''
    }
  }

  /**
   * Update multiple candlesticks at once (for initial data load)
   */
  setData(data: CandlestickData[]): void {
    try {
      this.candlestickSeries.setData(data)
    } catch (error) {
      console.error('Failed to set chart data:', error)
    }
  }

  /**
   * Subscribe to price scale changes
   */
  onPriceScaleChange(callback: (priceScale: any) => void): void {
    // Note: This would need to be implemented based on specific requirements
    console.log('Price scale change subscription setup')
    callback(this.chart.priceScale('right'))
  }

  /**
   * Subscribe to crosshair movements for price tracking
   */
  onCrosshairMove(callback: (param: any) => void): void {
    this.chart.subscribeCrosshairMove(callback)
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.clearMarkers()
    this.clearPriceLines()
  }
}

export default RealTimeChartUpdater
