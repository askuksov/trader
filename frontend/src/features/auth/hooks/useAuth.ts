import { useCallback, useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { TokenManager } from '../utils/tokenStorage';
import {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useLazyGetCurrentUserQuery,
} from '@/entities/auth';
import type { LoginCredentials } from '@/entities/auth';

export const useAuth = () => {
  const {
    isAuthenticated,
    user,
    loading,
    error,
    setAuthenticated,
    setUser,
    setLoading,
    setError,
    clearError,
    reset,
  } = useAuthStore();

  const [loginMutation] = useLoginMutation();
  const [logoutMutation] = useLogoutMutation();
  const [refreshTokenMutation] = useRefreshTokenMutation();
  const [getCurrentUser] = useLazyGetCurrentUserQuery();

  /**
   * Refresh access token
   */
  const refreshToken = useCallback(async () => {
    const refreshTokenValue = TokenManager.getRefreshToken();
    
    if (!refreshTokenValue) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await refreshTokenMutation({
        refresh_token: refreshTokenValue,
      }).unwrap();
      
      // Update tokens - response.data contains the actual token data
      TokenManager.updateAccessToken(response.data.access_token, response.data.expires_in);
      
      // If new refresh token provided, update it too
      if (response.data.refresh_token) {
        TokenManager.setTokens(
          response.data.access_token,
          response.data.refresh_token,
          response.data.expires_in
        );
      }
      
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // Clear tokens and reset on refresh failure
      TokenManager.clearTokens();
      reset();
      throw error;
    }
  }, [refreshTokenMutation, reset]);

  /**
   * Initialize authentication on app start
   */
  const initializeAuth = useCallback(async () => {
    setLoading(true);
    
    try {
      const hasTokens = TokenManager.hasTokens();
      
      if (hasTokens) {
        const accessToken = TokenManager.getAccessToken();
        
        if (accessToken) {
          try {
            // Try to get current user
            const result = await getCurrentUser();
            
            if (result.data) {
              setAuthenticated(true);
              setUser(result.data);
              console.log('Auth initialization successful:', result.data);
            } else if (result.error) {
              console.log('Auth verification failed:', result.error);
              // Token invalid, clear storage
              TokenManager.clearTokens();
              reset();
            }
          } catch (apiError) {
            console.warn('Auth API call failed:', apiError);
            // If API is unavailable, try refresh token
            try {
              await refreshToken();
            } catch (refreshError) {
              console.error('Token refresh also failed:', refreshError);
              TokenManager.clearTokens();
              reset();
            }
          }
        } else {
          // Access token expired, try refresh
          await refreshToken();
        }
      } else {
        // No tokens, user is not authenticated
        reset();
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      TokenManager.clearTokens();
      reset();
    } finally {
      setLoading(false);
    }
  }, [setLoading, setAuthenticated, setUser, reset, getCurrentUser, refreshToken]);

  /**
   * Login with credentials
   */
  const login = useCallback(async (credentials: LoginCredentials) => {
    setLoading(true);
    clearError();
    
    try {
      const response = await loginMutation(credentials).unwrap();
      
      // Store tokens - response.data contains the actual auth data
      TokenManager.setTokens(
        response.data.access_token,
        response.data.refresh_token,
        response.data.expires_in
      );
      
      // Update state
      setAuthenticated(true);
      setUser(response.data.user);
      
      console.log('Login successful, user authenticated:', response.data.user);
      
      return response;
    } catch (error: any) {
      const errorMessage = error?.data?.message || 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loginMutation, setLoading, clearError, setAuthenticated, setUser, setError]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    setLoading(true);
    
    try {
      await logoutMutation().unwrap();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear tokens and reset state regardless of API response
      TokenManager.clearTokens();
      reset();
      setLoading(false);
    }
  }, [logoutMutation, setLoading, reset]);

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((role: string) => {
    return user?.role === role;
  }, [user]);

  /**
   * Get user setting
   */
  const getUserSetting = useCallback(<T>(key: keyof NonNullable<typeof user>['settings'], defaultValue: T): T => {
    if (!user || !user.settings) {
      return defaultValue;
    }
    return (user.settings[key] as T) ?? defaultValue;
  }, [user]);

  // Set up automatic token refresh callback
  useEffect(() => {
    TokenManager.setRefreshCallback(async () => { await refreshToken(); });
    
    return () => {
      TokenManager.setRefreshCallback(async () => {});
    };
  }, [refreshToken]);

  // Initialize auth on mount
  useEffect(() => {
    // Only initialize if we're not already authenticated
    if (!isAuthenticated && !loading) {
      initializeAuth();
    }
  }, []); // Remove dependencies to prevent re-initialization

  return {
    // State
    isAuthenticated,
    user,
    loading,
    error,
    
    // Actions
    login,
    logout,
    refreshToken,
    clearError,
    hasRole,
    getUserSetting,
    
    // Utilities
    initializeAuth,
  };
};
