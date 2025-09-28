import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from '@/widgets/Layout'
import { ProtectedRoute } from './ProtectedRoute'
import { AuthGuard } from '@/features/auth'
import { routes } from './routes'
import { Spinner } from '@/shared/ui/spinner'

// Lazy load all page components for optimal bundle splitting
const DashboardPage = lazy(() => import('@/pages/DashboardPage'))
const PositionsPage = lazy(() => import('@/pages/PositionsPage'))
const CreatePositionPage = lazy(() => import('@/pages/CreatePositionPage'))
const PositionDetailPage = lazy(() => import('@/pages/PositionDetailPage'))
const ApiKeysPage = lazy(() => import('@/pages/ApiKeysPage'))
const CreateApiKeyPage = lazy(() => import('@/pages/CreateApiKeyPage'))
const StrategyPage = lazy(() => import('@/pages/StrategyPage'))
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage'))
const SettingsPage = lazy(() => import('@/pages/SettingsPage'))
const LoginPage = lazy(() => import('@/pages/LoginPage/LoginPage'))

/**
 * Loading fallback component for lazy-loaded routes
 */
function RouteLoading() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-4">
        <Spinner className="h-8 w-8" />
        <p className="text-sm text-muted-foreground">Loading page...</p>
      </div>
    </div>
  )
}

/**
 * 404 Not Found page component
 */
function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      <h1 className="text-4xl font-bold text-muted-foreground mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-4">Page Not Found</h2>
      <p className="text-muted-foreground mb-6">
        The page you're looking for doesn't exist.
      </p>
      <Navigate to={routes.dashboard} replace />
    </div>
  )
}

/**
 * Main application router component
 * Implements React Router v6 with lazy loading and protected routes
 */
export function AppRouter() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={
            <AuthGuard requireAuth={false}>
              <LoginPage />
            </AuthGuard>
          } 
        />

        {/* Protected Routes with Layout */}
        <Route path="/*" element={
          <AppLayout>
            <Routes>
              {/* Dashboard Route */}
              <Route 
                path={routes.dashboard} 
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } 
              />

              {/* Positions Routes */}
              <Route 
                path={routes.positions.list} 
                element={
                  <ProtectedRoute>
                    <PositionsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path={routes.positions.create} 
                element={
                  <ProtectedRoute>
                    <CreatePositionPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path={routes.positions.detail} 
                element={
                  <ProtectedRoute>
                    <PositionDetailPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path={routes.positions.edit} 
                element={
                  <ProtectedRoute>
                    <PositionDetailPage />
                  </ProtectedRoute>
                } 
              />

              {/* API Keys Routes */}
              <Route 
                path={routes.apiKeys.list} 
                element={
                  <ProtectedRoute>
                    <ApiKeysPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path={routes.apiKeys.create} 
                element={
                  <ProtectedRoute>
                    <CreateApiKeyPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path={routes.apiKeys.edit} 
                element={
                  <ProtectedRoute>
                    <CreateApiKeyPage />
                  </ProtectedRoute>
                } 
              />

              {/* Strategy Route */}
              <Route 
                path={routes.strategy} 
                element={
                  <ProtectedRoute>
                    <StrategyPage />
                  </ProtectedRoute>
                } 
              />

              {/* Analytics Route */}
              <Route 
                path={routes.analytics} 
                element={
                  <ProtectedRoute>
                    <AnalyticsPage />
                  </ProtectedRoute>
                } 
              />

              {/* Notifications Route */}
              <Route 
                path={routes.notifications} 
                element={
                  <ProtectedRoute>
                    <NotificationsPage />
                  </ProtectedRoute>
                } 
              />

              {/* Settings Route */}
              <Route 
                path={routes.settings} 
                element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } 
              />

              {/* 404 Fallback Route */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </AppLayout>
        } />
      </Routes>
    </Suspense>
  )
}
