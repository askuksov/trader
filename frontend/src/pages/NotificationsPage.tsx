import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'

export default function NotificationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">
          Configure your notification preferences
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">Notification preferences will be configured here</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Telegram Integration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 bg-muted rounded-lg flex items-center justify-center">
              <span className="text-muted-foreground">Telegram bot setup will be implemented here</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
