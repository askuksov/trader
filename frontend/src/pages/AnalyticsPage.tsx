import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Detailed performance analysis and reporting
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">Performance charts will be displayed here</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Trading Pair Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">Pair analysis will be displayed here</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
