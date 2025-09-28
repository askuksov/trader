import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { userHasRole } from '@/entities/auth';
import { Alert } from '@/shared/ui/alert';
import { AlertCircle } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallback?: React.ReactNode;
  showError?: boolean;
}

/**
 * Role-based access control guard
 */
export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback,
  showError = true,
}) => {
  const { user, isAuthenticated } = useAuth();

  // User must be authenticated
  if (!isAuthenticated || !user) {
    return fallback || null;
  }

  // Check if user has any of the required roles
  const hasRequiredRole = allowedRoles.some(role => userHasRole(user, role));

  if (!hasRequiredRole) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showError) {
      return (
        <Alert variant="destructive" className="m-4">
          <AlertCircle className="h-4 w-4" />
          <div>
            <strong>Access Denied</strong>
            <p>You don't have permission to access this resource.</p>
          </div>
        </Alert>
      );
    }

    return null;
  }

  return <>{children}</>;
};

/**
 * Higher-order component for role-based protection
 */
export const withRoleGuard = (
  Component: React.ComponentType,
  allowedRoles: string[],
  options: Omit<RoleGuardProps, 'children' | 'allowedRoles'> = {}
) => {
  return function RoleProtectedComponent(props: any) {
    return (
      <RoleGuard allowedRoles={allowedRoles} {...options}>
        <Component {...props} />
      </RoleGuard>
    );
  };
};

/**
 * Hook for checking user roles
 */
export const useRoleCheck = () => {
  const { user } = useAuth();

  const hasRole = (role: string) => {
    return user ? userHasRole(user, role) : false;
  };

  const hasAnyRole = (roles: string[]) => {
    return user ? roles.some(role => userHasRole(user, role)) : false;
  };

  const isAdmin = () => {
    return hasRole('admin') || hasRole('super_admin');
  };

  const isSuperAdmin = () => {
    return hasRole('super_admin');
  };

  const isUser = () => {
    return hasRole('user');
  };

  return {
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    isUser,
    currentRoles: user?.roles || [],
    primaryRole: user?.role,
  };
};
