import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: ReactNode
  requiresAuth?: boolean
}

/**
 * Protected route wrapper that handles authentication
 * TODO: Integrate with actual authentication system
 */
export function ProtectedRoute({ children, requiresAuth = true }: ProtectedRouteProps) {
  const location = useLocation()
  
  // TODO: Replace with actual authentication check
  // For now, we'll assume user is authenticated
  const isAuthenticated = true
  
  if (requiresAuth && !isAuthenticated) {
    // Redirect to login page (to be implemented)
    // Pass current location to return after login
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  
  return <>{children}</>
}
