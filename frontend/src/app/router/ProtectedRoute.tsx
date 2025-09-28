import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { AuthGuard } from '@/features/auth'

interface ProtectedRouteProps {
  children: ReactNode
  requiresAuth?: boolean
}

/**
 * Protected route wrapper that handles authentication
 */
export function ProtectedRoute({ children, requiresAuth = true }: ProtectedRouteProps) {
  return (
    <AuthGuard requireAuth={requiresAuth} redirectTo="/login">
      {children}
    </AuthGuard>
  )
}
