import { baseApi } from '@/app/store/baseApi';
import {
  LoginCredentials,
  AuthResponse,
  TokenRefreshRequest,
  TokenRefreshResponse,
  VerifyTokenResponse,
  LogoutResponse,
  User,
  getUserDisplayName,
  getUserPrimaryRole,
} from '../types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // User login with credentials
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
      transformResponse: (response: AuthResponse) => {
        // Transform the user data to add computed properties
        const userData = response.data.user;
        userData.name = getUserDisplayName(userData);
        userData.role = getUserPrimaryRole(userData);
        userData.settings = userData.settings || {
          theme: 'system',
          language: 'en',
          timezone: 'UTC',
          currency: 'USD',
          notifications: {
            telegram: false,
            in_app: true,
            push: false,
            email: true,
          },
        };
        return response;
      },
    }),

    // User logout and token invalidation
    logout: builder.mutation<LogoutResponse, void>({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),

    // JWT token refresh
    refreshToken: builder.mutation<TokenRefreshResponse, TokenRefreshRequest>({
      query: (request) => ({
        url: '/auth/refresh',
        method: 'POST',
        body: request,
      }),
    }),

    // Current user information
    getCurrentUser: builder.query<User, void>({
      query: () => '/auth/me',
      providesTags: ['User'],
      transformResponse: (response: { data: User }) => {
        // Transform the user data to add computed properties
        const userData = response.data;
        userData.name = getUserDisplayName(userData);
        userData.role = getUserPrimaryRole(userData);
        userData.settings = userData.settings || {
          theme: 'system',
          language: 'en',
          timezone: 'UTC',
          currency: 'USD',
          notifications: {
            telegram: false,
            in_app: true,
            push: false,
            email: true,
          },
        };
        return userData;
      },
    }),

    // Token validation
    verifyToken: builder.mutation<VerifyTokenResponse, { token: string }>({
      query: (request) => ({
        url: '/auth/verify-token',
        method: 'POST',
        body: request,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useLogoutMutation,
  useRefreshTokenMutation,
  useGetCurrentUserQuery,
  useLazyGetCurrentUserQuery,
  useVerifyTokenMutation,
} = authApi;
