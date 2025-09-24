import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './providers/ThemeProvider'

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <div className="min-h-screen bg-background text-foreground">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold text-center mb-8">
              Spot Trading Bot
            </h1>
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-4">
                Welcome to your DCA trading dashboard
              </p>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary rounded-full text-primary-foreground">
                ✓
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Frontend infrastructure setup complete
              </p>
            </div>
          </div>
        </div>
      </ThemeProvider>
    </BrowserRouter>
  )
}
