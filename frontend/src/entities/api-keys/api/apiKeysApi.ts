import { baseApi } from '@/app/store/baseApi';
import type {
  ApiKey,
  ApiKeyFilters,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  TestConnectionRequest,
  TestConnectionResponse,
  ApiKeyBalance,
} from '../types';

export const apiKeysApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // List API keys with optional filters
    getApiKeys: builder.query<ApiKey[], ApiKeyFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters) {
          if (filters.status.length > 0) {
            filters.status.forEach((s) => params.append('status', s));
          }
          if (filters.exchange.length > 0) {
            filters.exchange.forEach((e) => params.append('exchange', e));
          }
          if (filters.search) {
            params.append('search', filters.search);
          }
          if (filters.sortBy) {
            params.append('sort_by', filters.sortBy);
          }
          if (filters.sortOrder) {
            params.append('sort_order', filters.sortOrder);
          }
        }
        return `api-keys?${params.toString()}`;
      },
      providesTags: ['ApiKey'],
    }),

    // Get single API key
    getApiKey: builder.query<ApiKey, number>({
      query: (id) => `api-keys/${id}`,
      providesTags: (result, error, id) => [{ type: 'ApiKey', id }],
    }),

    // Create new API key
    createApiKey: builder.mutation<ApiKey, CreateApiKeyRequest>({
      query: (apiKey) => ({
        url: 'api-keys',
        method: 'POST',
        body: apiKey,
      }),
      invalidatesTags: ['ApiKey'],
    }),

    // Update API key (name and description only)
    updateApiKey: builder.mutation<ApiKey, { id: number; updates: UpdateApiKeyRequest }>({
      query: ({ id, updates }) => ({
        url: `api-keys/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ApiKey', id }],
    }),

    // Delete API key
    deleteApiKey: builder.mutation<void, number>({
      query: (id) => ({
        url: `api-keys/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ApiKey'],
    }),

    // Test API key connection
    testConnection: builder.mutation<TestConnectionResponse, TestConnectionRequest>({
      query: (request) => ({
        url: 'api-keys/test-connection',
        method: 'POST',
        body: request,
      }),
    }),

    // Get API key balances
    getApiKeyBalances: builder.query<ApiKeyBalance[], number>({
      query: (id) => `api-keys/${id}/balances`,
      providesTags: (result, error, id) => [{ type: 'ApiKey', id }],
    }),

    // Get positions associated with API key
    getApiKeyPositions: builder.query<number[], number>({
      query: (id) => `api-keys/${id}/positions`,
      providesTags: (result, error, id) => [{ type: 'ApiKey', id }],
    }),
  }),
});

export const {
  useGetApiKeysQuery,
  useGetApiKeyQuery,
  useCreateApiKeyMutation,
  useUpdateApiKeyMutation,
  useDeleteApiKeyMutation,
  useTestConnectionMutation,
  useGetApiKeyBalancesQuery,
  useGetApiKeyPositionsQuery,
} = apiKeysApi;
