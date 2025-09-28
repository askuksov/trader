import { useEffect, useCallback } from 'react';
import { TokenManager } from '../utils/tokenStorage';
import { useAuth } from './useAuth';

interface UseTokenRefreshOptions {
  enableAutoRefresh?: boolean;
  warningThreshold?: number; // minutes before expiry to show warning
  onTokenExpired?: () => void;
  onRefreshSuccess?: () => void;
  onRefreshError?: (error: any) => void;
}

export const useTokenRefresh = (options: UseTokenRefreshOptions = {}) => {
  const {
    enableAutoRefresh = true,
    warningThreshold = 5,
    onTokenExpired,
    onRefreshSuccess,
    onRefreshError,
  } = options;

  const { refreshToken, logout, isAuthenticated } = useAuth();

  /**
   * Check token status and return info
   */
  const getTokenStatus = useCallback(() => {
    if (!isAuthenticated) {
      return { 
        isValid: false, 
        isExpired: true, 
        isNearExpiry: false,
        minutesUntilExpiry: 0 
      };
    }

    const expiresAt = TokenManager.getTokenExpiry();
    const accessToken = TokenManager.getAccessToken();
    
    if (!expiresAt || !accessToken) {
      return { 
        isValid: false, 
        isExpired: true, 
        isNearExpiry: false,
        minutesUntilExpiry: 0 
      };
    }

    const now = Date.now();
    const minutesUntilExpiry = Math.max(0, Math.floor((expiresAt - now) / (1000 * 60)));
    const isExpired = now >= expiresAt;
    const isNearExpiry = !isExpired && minutesUntilExpiry <= warningThreshold;

    return {
      isValid: !isExpired,
      isExpired,
      isNearExpiry,
      minutesUntilExpiry,
    };
  }, [isAuthenticated, warningThreshold]);

  /**
   * Manual token refresh
   */
  const manualRefresh = useCallback(async () => {
    try {
      await refreshToken();
      onRefreshSuccess?.();
    } catch (error) {
      console.error('Manual token refresh failed:', error);
      onRefreshError?.(error);
      throw error;
    }
  }, [refreshToken, onRefreshSuccess, onRefreshError]);

  /**
   * Handle token expiration
   */
  const handleTokenExpiration = useCallback(() => {
    onTokenExpired?.();
    logout();
  }, [onTokenExpired, logout]);

  // Monitor token status
  useEffect(() => {
    if (!isAuthenticated || !enableAutoRefresh) return;

    const checkTokenStatus = () => {
      const status = getTokenStatus();
      
      if (status.isExpired) {
        handleTokenExpiration();
      }
    };

    // Check immediately
    checkTokenStatus();

    // Set up periodic checking every minute
    const interval = setInterval(checkTokenStatus, 60000);

    return () => clearInterval(interval);
  }, [isAuthenticated, enableAutoRefresh, getTokenStatus, handleTokenExpiration]);

  return {
    getTokenStatus,
    manualRefresh,
    handleTokenExpiration,
  };
};
