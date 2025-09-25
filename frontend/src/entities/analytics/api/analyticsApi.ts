import { baseApi } from '@/app/store/baseApi';
import type {
  DashboardMetrics,
  PerformanceData,
  PositionsSummary,
  PairPerformance,
  ApiKeyPerformance,
  CompletedPositionData,
  ExportOptions,
} from '../types';

export const analyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Dashboard overview metrics
    getDashboardMetrics: builder.query<DashboardMetrics, void>({
      query: () => 'analytics/overview',
      providesTags: ['Analytics'],
    }),

    // Performance over time
    getPerformanceData: builder.query<PerformanceData[], { timeframe: string; groupBy?: string }>({
      query: ({ timeframe, groupBy = 'day' }) => 
        `analytics/performance?timeframe=${timeframe}&group_by=${groupBy}`,
      providesTags: ['Analytics'],
    }),

    // Position statistics summary
    getPositionsSummary: builder.query<PositionsSummary, void>({
      query: () => 'analytics/positions-summary',
      providesTags: ['Analytics'],
    }),

    // Trading pair performance analysis
    getPairPerformance: builder.query<PairPerformance[], { timeframe?: string }>({
      query: ({ timeframe = '30d' }) => `analytics/pair-performance?timeframe=${timeframe}`,
      providesTags: ['Analytics'],
    }),

    // API key performance comparison
    getApiKeyPerformance: builder.query<ApiKeyPerformance[], { timeframe?: string }>({
      query: ({ timeframe = '30d' }) => `analytics/api-key-performance?timeframe=${timeframe}`,
      providesTags: ['Analytics'],
    }),

    // Historical completed positions
    getCompletedPositions: builder.query<CompletedPositionData[], { 
      limit?: number; 
      offset?: number;
      sort_by?: string;
      sort_order?: 'asc' | 'desc';
    }>({
      query: ({ limit = 50, offset = 0, sort_by = 'completed_at', sort_order = 'desc' }) => 
        `analytics/completed-positions?limit=${limit}&offset=${offset}&sort_by=${sort_by}&sort_order=${sort_order}`,
      providesTags: ['Analytics'],
    }),

    // Export analytics data
    exportAnalytics: builder.mutation<Blob, ExportOptions>({
      query: (options) => ({
        url: 'analytics/export',
        method: 'POST',
        body: options,
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Get profit/loss distribution
    getPnLDistribution: builder.query<{ 
      profit_ranges: Array<{ range: string; count: number; percentage: number }>;
      loss_ranges: Array<{ range: string; count: number; percentage: number }>;
    }, { timeframe?: string }>({
      query: ({ timeframe = '90d' }) => `analytics/pnl-distribution?timeframe=${timeframe}`,
      providesTags: ['Analytics'],
    }),

    // Get monthly returns breakdown
    getMonthlyReturns: builder.query<Array<{
      year: number;
      month: number;
      total_pnl: number;
      profit_positions: number;
      loss_positions: number;
      roi_percent: number;
    }>, void>({
      query: () => 'analytics/monthly-returns',
      providesTags: ['Analytics'],
    }),

    // Get risk metrics
    getRiskMetrics: builder.query<{
      sharpe_ratio: number;
      max_drawdown_percent: number;
      volatility: number;
      var_95: number; // Value at Risk 95%
      win_rate: number;
      profit_factor: number;
      average_win: number;
      average_loss: number;
    }, { timeframe?: string }>({
      query: ({ timeframe = '180d' }) => `analytics/risk-metrics?timeframe=${timeframe}`,
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetDashboardMetricsQuery,
  useGetPerformanceDataQuery,
  useGetPositionsSummaryQuery,
  useGetPairPerformanceQuery,
  useGetApiKeyPerformanceQuery,
  useGetCompletedPositionsQuery,
  useExportAnalyticsMutation,
  useGetPnLDistributionQuery,
  useGetMonthlyReturnsQuery,
  useGetRiskMetricsQuery,
} = analyticsApi;
