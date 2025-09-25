import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { useNavigate } from 'react-router-dom'

export default function CreatePositionPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create Position</h1>
          <p className="text-muted-foreground">
            Set up a new DCA trading position
          </p>
        </div>
        
        <Button variant="outline" onClick={() => navigate('/positions')}>
          Back to Positions
        </Button>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Position Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Step 1: Basic Configuration</h3>
                <p className="text-sm text-muted-foreground">
                  Configure API key, trading pair, and initial investment amount
                </p>
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground">Configuration form will be implemented here</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Step 2: DCA Strategy</h3>
                <p className="text-sm text-muted-foreground">
                  Set up DCA levels and take-profit targets
                </p>
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground">Strategy configuration will be implemented here</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-medium">Step 3: Review & Confirm</h3>
                <p className="text-sm text-muted-foreground">
                  Review settings and create the position
                </p>
                <div className="h-32 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground">Review interface will be implemented here</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="flex-1">Create Position</Button>
                <Button variant="outline" onClick={() => navigate('/positions')}>
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
