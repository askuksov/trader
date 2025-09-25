import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

export default function StrategyPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Strategy Configuration</h1>
        <p className="text-muted-foreground">
          Configure your DCA trading strategy parameters
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Global DCA Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground">Strategy configuration interface will be implemented here</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
