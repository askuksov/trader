import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Badge } from '@/shared/ui/badge'
import { Link } from 'react-router-dom'
import { routes } from '@/app/router/routes'

const mockApiKeys = [
  {
    id: 1,
    name: 'Binance Main',
    exchange: 'binance',
    status: 'active',
    description: 'Primary trading account',
    created_at: '2024-01-10',
    last_used_at: '2024-01-15',
  },
  {
    id: 2,
    name: 'HitBTC Secondary',
    exchange: 'hitbtc',
    status: 'active',
    description: 'Secondary trading account',
    created_at: '2024-01-12',
    last_used_at: '2024-01-14',
  },
]

function StatusBadge({ status }: { status: string }) {
  const variants = {
    active: 'default',
    inactive: 'outline',
    error: 'destructive',
  } as const

  return (
    <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
      {status}
    </Badge>
  )
}

export default function ApiKeysPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your exchange API keys
          </p>
        </div>
        
        <Button asChild>
          <Link to={routes.apiKeys.create}>Add API Key</Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {mockApiKeys.map((apiKey) => (
          <Card key={apiKey.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                  <p className="text-sm text-muted-foreground capitalize">
                    {apiKey.exchange}
                  </p>
                </div>
                <StatusBadge status={apiKey.status} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{apiKey.description || 'No description'}</p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(apiKey.created_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground">Last Used</p>
                  <p className="font-medium">
                    {apiKey.last_used_at 
                      ? new Date(apiKey.last_used_at).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm">
                  Test Connection
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to={`/api-keys/${apiKey.id}/edit`}>Edit</Link>
                </Button>
                <Button variant="outline" size="sm">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {mockApiKeys.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <p className="text-lg font-medium mb-2">No API keys configured</p>
            <p className="text-muted-foreground mb-4">
              Add your first exchange API key to start trading
            </p>
            <Button asChild>
              <Link to={routes.apiKeys.create}>Add API Key</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
