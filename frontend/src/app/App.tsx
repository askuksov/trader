import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './providers/ThemeProvider'
import { AppRouter } from './router'

/**
 * Main application component
 * Sets up routing, theming, and global providers
 */
export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppRouter />
      </ThemeProvider>
    </BrowserRouter>
  )
}
