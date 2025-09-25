import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider, ReduxProvider } from './providers'
import { AppRouter } from './router'

/**
 * Main application component
 * Sets up routing, theming, and global providers
 */
export function App() {
  return (
    <BrowserRouter>
      <ReduxProvider>
        <ThemeProvider>
          <AppRouter />
        </ThemeProvider>
      </ReduxProvider>
    </BrowserRouter>
  )
}
