import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/v1',
  prepareHeaders: (headers) => {
    // Add authentication token if available
    const token = localStorage.getItem('authToken');
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
      // Unauthorized - redirect to login or refresh token
      localStorage.removeItem('authToken');
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
  tagTypes: ['Position', 'ApiKey', 'Strategy', 'Analytics', 'Market'],
  endpoints: () => ({}),
});
