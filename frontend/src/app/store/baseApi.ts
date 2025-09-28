import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

// Token storage keys
const ACCESS_TOKEN_KEY = 'trader_access_token';

/**
 * Simple token retrieval function to avoid circular dependencies
 */
function getAccessToken(): string | null {
  try {
    const encrypted = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!encrypted) return null;
    
    // Simple XOR decryption (same as in TokenManager)
    const SECRET = 'trader_app_secret_key';
    const data = atob(encrypted);
    let decrypted = '';
    for (let i = 0; i < data.length; i++) {
      decrypted += String.fromCharCode(
        data.charCodeAt(i) ^ SECRET.charCodeAt(i % SECRET.length)
      );
    }
    
    return decrypted;
  } catch {
    return null;
  }
}

/**
 * Clear tokens function to avoid circular dependencies
 */
function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem('trader_refresh_token');
  localStorage.removeItem('trader_token_expiry');
}

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  prepareHeaders: (headers) => {
    // Add authentication token if available
    const token = getAccessToken();
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithErrorHandling: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await baseQuery(args, api, extraOptions);
  
  if (result.error) {
    // Handle global error states
    if (result.error.status === 401) {
      // Unauthorized - clear tokens and redirect to login
      clearTokens();
      window.location.href = '/login';
    }
    
    if (result.error.status === 500) {
      // Server error - show global error notification
      console.error('Server error:', result.error);
    }
  }
  
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithErrorHandling,
  tagTypes: ['User', 'Position', 'ApiKey', 'Strategy', 'Analytics', 'Market'],
  endpoints: () => ({}),
});
