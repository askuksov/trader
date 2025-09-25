import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { useNavigate, useParams } from 'react-router-dom'

export default function PositionDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()

  // Mock position data - in real app this would be fetched from API
  const position = {
    id: id,
    trading_pair: 'BTC/USDT',
    status: 'active' as const,
    total_invested: 5000,
    current_value: 5450,
    unrealized_pnl: 450,
    unrealized_pnl_percent: 9.0,
    current_price: 54500,
    average_price: 50000,
    created_at: '2024-01-15T10:30:00Z',
    api_key_name: 'Binance Main',
  }

  const dcaLevels = [
    { level: 1, trigger_price: 47500, status: 'triggered', amount: 1000 },
    { level: 2, trigger_price: 45000, status: 'pending', amount: 1500 },
    { level: 3, trigger_price: 42500, status: 'pending', amount: 2000 },
  ]

  const takeProfitLevels = [
    { level: 1, trigger_price: 55000, status: 'pending', quantity_percent: 25 },
    { level: 2, trigger_price: 60000, status: 'pending', quantity_percent: 50 },
    { level: 3, trigger_price: 65000, status: 'pending', quantity_percent: 100 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{position.trading_pair}</h1>
          <p className="text-muted-foreground">
            Position #{position.id} • Created {new Date(position.created_at).toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Badge>{position.status}</Badge>
          <Button variant="outline" onClick={() => navigate('/positions')}>
            Back to Positions
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${position.total_invested.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${position.current_value.toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unrealized P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +${position.unrealized_pnl.toFixed(2)}
            </div>
            <p className="text-sm text-green-600">
              +{position.unrealized_pnl_percent.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Current Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${position.current_price.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">
              Avg: ${position.average_price.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Price Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Price Chart</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">
                Interactive price chart with DCA/TP markers will be displayed here
              </span>
            </div>
          </CardContent>
        </Card>

        {/* DCA Levels */}
        <Card>
          <CardHeader>
            <CardTitle>DCA Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dcaLevels.map((level) => (
                <div key={level.level} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Level {level.level}</p>
                    <p className="text-sm text-muted-foreground">
                      ${level.trigger_price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${level.amount.toLocaleString()}</p>
                    <Badge 
                      variant={level.status === 'triggered' ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {level.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Take Profit Levels */}
        <Card>
          <CardHeader>
            <CardTitle>Take Profit Levels</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {takeProfitLevels.map((level) => (
                <div key={level.level} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Level {level.level}</p>
                    <p className="text-sm text-muted-foreground">
                      ${level.trigger_price.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{level.quantity_percent}%</p>
                    <Badge variant="outline" className="text-xs">
                      {level.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Position Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Position Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button variant="outline">Pause Position</Button>
            <Button variant="outline">Edit Settings</Button>
            <Button variant="destructive">Close Position</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
