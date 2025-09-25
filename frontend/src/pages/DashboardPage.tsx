import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor your trading positions and performance
        </p>
      </div>
      
      {/* Test Tailwind Classes */}
      <div className="bg-blue-500 text-white p-4 rounded-lg mb-4">
        <p className="text-sm">🔧 Tailwind Test: If you see blue background, Tailwind is working!</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Invested
            </CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
              Active
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">$12,345</div>
            <p className="text-xs text-muted-foreground">
              +5.1% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Value
            </CardTitle>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
              Live
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">$13,456</div>
            <p className="text-xs text-profit">
              +9.0% unrealized P&L
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Positions
            </CardTitle>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
              Trading
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">8</div>
            <p className="text-xs text-muted-foreground">
              2 completed today
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Win Rate
            </CardTitle>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100">
              Performance
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">72%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex gap-4 mb-6">
        <Button variant="default" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          Primary Button
        </Button>
        <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950">
          Outline Button
        </Button>
        <Button variant="secondary" className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700">
          Secondary
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-7">
        <Card className="col-span-4 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 rounded-t-lg">
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">Portfolio Performance</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg m-4">
              <div className="text-center">
                <div className="text-4xl mb-2">📈</div>
                <p className="font-medium">Portfolio performance chart will be displayed here</p>
                <p className="text-sm mt-2">TradingView Lightweight Charts integration ready</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3 shadow-lg hover:shadow-xl transition-shadow">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-t-lg">
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-4">
              <div className="flex items-center gap-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">Take profit executed</p>
                  <p className="text-xs text-green-600 dark:text-green-400">BTC/USDT - Level 1</p>
                </div>
                <div className="text-xs text-green-500 font-mono">2m ago</div>
              </div>
              
              <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">DCA level triggered</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">ETH/USDT - Level 2</p>
                </div>
                <div className="text-xs text-blue-500 font-mono">5m ago</div>
              </div>
              
              <div className="flex items-center gap-4 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200">Position created</p>
                  <p className="text-xs text-purple-600 dark:text-purple-400">ADA/USDT</p>
                </div>
                <div className="text-xs text-purple-500 font-mono">10m ago</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
