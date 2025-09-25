import { baseApi } from '@/app/store/baseApi';
import type {
  Position,
  DCALevel,
  TakeProfit,
  PositionFilters,
  CreatePositionRequest,
  UpdatePositionRequest,
  PositionDetailsResponse,
  TransactionHistory,
} from '../types';

export const positionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // List positions with optional filters
    getPositions: builder.query<Position[], PositionFilters | void>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters) {
          if (filters.status.length > 0) {
            filters.status.forEach((s) => params.append('status', s));
          }
          if (filters.tradingPairs.length > 0) {
            filters.tradingPairs.forEach((p) => params.append('trading_pairs', p));
          }
          if (filters.apiKeyIds.length > 0) {
            filters.apiKeyIds.forEach((id) => params.append('api_key_ids', id.toString()));
          }
          if (filters.dateRange) {
            params.append('from_date', filters.dateRange.from.toISOString());
            params.append('to_date', filters.dateRange.to.toISOString());
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
        return `positions?${params.toString()}`;
      },
      providesTags: ['Position'],
    }),

    // Get single position with details
    getPosition: builder.query<PositionDetailsResponse, number>({
      query: (id) => `positions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Position', id }],
    }),

    // Create new position
    createPosition: builder.mutation<Position, CreatePositionRequest>({
      query: (position) => ({
        url: 'positions',
        method: 'POST',
        body: position,
      }),
      invalidatesTags: ['Position'],
    }),

    // Update position (name, description only)
    updatePosition: builder.mutation<Position, { id: number; updates: UpdatePositionRequest }>({
      query: ({ id, updates }) => ({
        url: `positions/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Position', id }],
    }),

    // Pause position
    pausePosition: builder.mutation<Position, number>({
      query: (id) => ({
        url: `positions/${id}/pause`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Position', id }],
    }),

    // Resume position
    resumePosition: builder.mutation<Position, number>({
      query: (id) => ({
        url: `positions/${id}/resume`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Position', id }],
    }),

    // Close position
    closePosition: builder.mutation<Position, number>({
      query: (id) => ({
        url: `positions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Position'],
    }),

    // Get DCA levels for position
    getDCALevels: builder.query<DCALevel[], number>({
      query: (positionId) => `positions/${positionId}/dca-levels`,
      providesTags: (result, error, positionId) => [
        { type: 'Position', id: positionId },
      ],
    }),

    // Get take-profit levels for position
    getTakeProfitLevels: builder.query<TakeProfit[], number>({
      query: (positionId) => `positions/${positionId}/take-profits`,
      providesTags: (result, error, positionId) => [
        { type: 'Position', id: positionId },
      ],
    }),

    // Get transaction history for position
    getTransactionHistory: builder.query<TransactionHistory[], number>({
      query: (positionId) => `positions/${positionId}/history`,
      providesTags: (result, error, positionId) => [
        { type: 'Position', id: positionId },
      ],
    }),
  }),
});

export const {
  useGetPositionsQuery,
  useGetPositionQuery,
  useCreatePositionMutation,
  useUpdatePositionMutation,
  usePausePositionMutation,
  useResumePositionMutation,
  useClosePositionMutation,
  useGetDCALevelsQuery,
  useGetTakeProfitLevelsQuery,
  useGetTransactionHistoryQuery,
} = positionsApi;
