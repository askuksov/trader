import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '@/shared/ui/spinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * Authentication guard component that protects routes
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  fallback,
  redirectTo = '/login',
}) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  console.log('AuthGuard:', { isAuthenticated, loading, requireAuth, pathname: location.pathname });

  // Show loading spinner while authentication is being checked
  if (loading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <Spinner className="h-8 w-8" />
        </div>
      )
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    console.log('AuthGuard: Redirecting to login - user not authenticated');
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location }} 
        replace 
      />
    );
  }

  // If authentication is not required but user is authenticated (login page)
  if (!requireAuth && isAuthenticated) {
    const from = location.state?.from?.pathname || '/';
    console.log('AuthGuard: User authenticated on public page, redirecting to:', from);
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

/**
 * Higher-order component for protecting routes
 */
export const withAuthGuard = (
  Component: React.ComponentType,
  options: Omit<AuthGuardProps, 'children'> = {}
) => {
  return function ProtectedComponent(props: any) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
};
