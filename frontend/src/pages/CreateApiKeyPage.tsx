import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

export default function CreateApiKeyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Add API Key</h1>
        <p className="text-muted-foreground">
          Connect a new exchange API key
        </p>
      </div>
      
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>API Key Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">API key creation form will be implemented here</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
