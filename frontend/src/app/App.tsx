import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, useTheme } from './providers/ThemeProvider'
import { TradingChart, ChartContainer } from '@/shared/ui/charts'
import { Button } from '@/shared/ui/button'
import type { CandlestickData } from 'lightweight-charts'

// Generate sample candlestick data for demonstration
function generateSampleData(): CandlestickData[] {
  const data: CandlestickData[] = []
  const baseTime = Math.floor(Date.now() / 1000) - (100 * 24 * 60 * 60) // 100 days ago
  let price = 50000 // Starting price

  for (let i = 0; i < 100; i++) {
    const time = baseTime + (i * 24 * 60 * 60) // Daily candles
    
    // Generate realistic price movement
    const change = (Math.random() - 0.5) * 0.1 // ±5% max change
    const volatility = Math.random() * 0.05 // Up to 2.5% volatility
    
    price = price * (1 + change)
    
    const high = price * (1 + volatility)
    const low = price * (1 - volatility)
    const open = i === 0 ? price : data[i-1].close
    const close = price

    data.push({
      time,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
    })
  }

  return data
}

function ChartDemo() {
  const { theme, setTheme } = useTheme()
  const sampleData = generateSampleData()
  
  // Sample DCA and TP levels
  const dcaLevels = [
    { level: 1, price: 48000 },
    { level: 2, price: 45000 },
    { level: 3, price: 42000 },
  ]
  
  const takeProfitLevels = [
    { level: 1, price: 55000 },
    { level: 2, price: 60000 },
  ]

  const resolvedTheme = theme === 'system' 
    ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    : theme as 'light' | 'dark'

  return (
    <div className="space-y-8">
      {/* Theme Toggle */}
      <div className="flex justify-center gap-2">
        <Button 
          variant={theme === 'light' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setTheme('light')}
        >
          Light
        </Button>
        <Button 
          variant={theme === 'dark' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setTheme('dark')}
        >
          Dark
        </Button>
        <Button 
          variant={theme === 'system' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setTheme('system')}
        >
          System
        </Button>
      </div>

      {/* Basic Candlestick Chart */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Basic Candlestick Chart</h2>
        <TradingChart
          data={sampleData}
          seriesType="candlestick"
          height={400}
          theme={resolvedTheme}
          className="border rounded-lg"
        />
      </div>

      {/* Chart with DCA/TP Levels */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Chart with DCA & Take Profit Levels</h2>
        <p className="text-muted-foreground">
          This chart demonstrates DCA (Dollar Cost Averaging) levels and Take Profit targets
          that would be used in the trading bot interface.
        </p>
        <ChartContainer
          data={sampleData}
          seriesType="candlestick"
          height={500}
          theme={resolvedTheme}
          dcaLevels={dcaLevels}
          takeProfitLevels={takeProfitLevels}
          className="border rounded-lg"
          onChartReady={(chartManager) => {
            console.log('Chart ready with manager:', chartManager)
          }}
        />
      </div>

      {/* Line Chart Example */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Portfolio Performance (Line Chart)</h2>
        <TradingChart
          data={sampleData.map(candle => ({
            time: candle.time,
            value: candle.close,
          }))}
          seriesType="line"
          height={300}
          theme={resolvedTheme}
          className="border rounded-lg"
        />
      </div>

      {/* Multiple Chart Types Grid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Chart Types Demonstration</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Area Chart</h3>
            <TradingChart
              data={sampleData.map(candle => ({
                time: candle.time,
                value: candle.close,
              }))}
              seriesType="area"
              height={250}
              theme={resolvedTheme}
              className="border rounded-lg"
            />
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2">Volume Histogram</h3>
            <TradingChart
              data={sampleData.map((candle, index) => ({
                time: candle.time,
                value: Math.random() * 1000000 + 500000, // Random volume
                color: index % 2 === 0 ? '#26a69a' : '#ef5350',
              }))}
              seriesType="histogram"
              height={250}
              theme={resolvedTheme}
              className="border rounded-lg"
            />
          </div>
        </div>
      </div>

      <div className="text-center text-muted-foreground">
        <p className="text-sm">
          TradingView Lightweight Charts integration is now complete!<br />
          Charts automatically adapt to the selected theme and support real-time updates.
        </p>
      </div>
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <div className="min-h-screen bg-background text-foreground">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">
                Spot Trading Bot
              </h1>
              <p className="text-lg text-muted-foreground mb-2">
                TradingView Lightweight Charts Integration Demo
              </p>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full text-primary-foreground mb-4">
                📈
              </div>
              <p className="text-sm text-muted-foreground">
                TASK-FRONTEND-003 Complete: Professional trading charts with DCA/TP markers
              </p>
            </div>
            
            <ChartDemo />
          </div>
        </div>
      </ThemeProvider>
    </BrowserRouter>
  )
}
