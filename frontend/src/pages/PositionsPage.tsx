import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Link } from 'react-router-dom'
import { routes } from '@/app/router/routes'

const mockPositions = [
  {
    id: 1,
    trading_pair: 'BTC/USDT',
    status: 'active' as const,
    total_invested: 5000,
    current_value: 5450,
    unrealized_pnl: 450,
    unrealized_pnl_percent: 9.0,
    current_price: 54500,
    average_price: 50000,
    created_at: '2024-01-15',
  },
  {
    id: 2,
    trading_pair: 'ETH/USDT',
    status: 'completed' as const,
    total_invested: 3000,
    current_value: 3200,
    unrealized_pnl: 200,
    unrealized_pnl_percent: 6.7,
    current_price: 3200,
    average_price: 3000,
    created_at: '2024-01-10',
  },
  {
    id: 3,
    trading_pair: 'ADA/USDT',
    status: 'paused' as const,
    total_invested: 1500,
    current_value: 1450,
    unrealized_pnl: -50,
    unrealized_pnl_percent: -3.3,
    current_price: 0.48,
    average_price: 0.50,
    created_at: '2024-01-12',
  },
]

function StatusBadge({ status }: { status: string }) {
  const variants = {
    active: 'default',
    completed: 'secondary',
    paused: 'outline',
    error: 'destructive',
  } as const

  return (
    <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
      {status}
    </Badge>
  )
}

function PnLDisplay({ pnl, pnlPercent }: { pnl: number; pnlPercent: number }) {
  const isProfit = pnl >= 0
  const colorClass = isProfit ? 'text-green-600' : 'text-red-600'

  return (
    <div className={`font-medium ${colorClass}`}>
      {isProfit ? '+' : ''}${pnl.toFixed(2)} ({isProfit ? '+' : ''}{pnlPercent.toFixed(1)}%)
    </div>
  )
}

export default function PositionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Positions</h1>
          <p className="text-muted-foreground">
            Manage your DCA trading positions
          </p>
        </div>
        
        <Button asChild>
          <Link to={routes.positions.create}>Create Position</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {mockPositions.map((position) => (
          <Card key={position.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{position.trading_pair}</CardTitle>
                <StatusBadge status={position.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Invested</p>
                  <p className="text-lg font-medium">${position.total_invested.toFixed(2)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Current Value</p>
                  <p className="text-lg font-medium">${position.current_value.toFixed(2)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Unrealized P&L</p>
                  <PnLDisplay 
                    pnl={position.unrealized_pnl} 
                    pnlPercent={position.unrealized_pnl_percent} 
                  />
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Average Price</p>
                  <p className="text-lg font-medium">
                    ${position.average_price.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/positions/${position.id}`}>View Details</Link>
                </Button>
                
                {position.status === 'active' && (
                  <Button variant="outline" size="sm">
                    Pause
                  </Button>
                )}
                
                {position.status === 'paused' && (
                  <Button variant="outline" size="sm">
                    Resume
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockPositions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium mb-2">No positions yet</p>
            <p className="text-muted-foreground mb-4">
              Create your first DCA position to get started
            </p>
            <Button asChild>
              <Link to={routes.positions.create}>Create Position</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
