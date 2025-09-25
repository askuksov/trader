import { baseApi } from '@/app/store/baseApi';
import type {
  MarketData,
  CandlestickData,
  TradingPair,
  PriceAlert,
  MarketStats,
  CreatePriceAlertRequest,
} from '../types';

export const marketApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get real-time market data for a symbol
    getMarketData: builder.query<MarketData, string>({
      query: (symbol) => `market/ticker/${symbol}`,
      providesTags: ['Market'],
    }),

    // Get candlestick data for charting
    getCandlestickData: builder.query<CandlestickData[], {
      symbol: string;
      interval: string;
      limit?: number;
      start_time?: number;
      end_time?: number;
    }>({
      query: ({ symbol, interval, limit = 500, start_time, end_time }) => {
        const params = new URLSearchParams({
          interval,
          limit: limit.toString(),
        });
        if (start_time) params.append('start_time', start_time.toString());
        if (end_time) params.append('end_time', end_time.toString());
        return `market/klines/${symbol}?${params.toString()}`;
      },
      providesTags: ['Market'],
    }),

    // Get list of available trading pairs
    getTradingPairs: builder.query<TradingPair[], { search?: string; limit?: number }>({
      query: ({ search, limit = 100 }) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('limit', limit.toString());
        return `market/symbols?${params.toString()}`;
      },
      providesTags: ['Market'],
    }),

    // Get 24h market statistics
    getMarketStats: builder.query<MarketStats[], void>({
      query: () => 'market/24hr-stats',
      providesTags: ['Market'],
    }),

    // Get order book data
    getOrderBook: builder.query<{
      bids: Array<[string, string]>; // [price, quantity]
      asks: Array<[string, string]>;
      last_update_id: number;
    }, { symbol: string; limit?: number }>({
      query: ({ symbol, limit = 20 }) => `market/depth/${symbol}?limit=${limit}`,
      providesTags: ['Market'],
    }),

    // Get recent trades
    getRecentTrades: builder.query<Array<{
      id: number;
      price: string;
      qty: string;
      time: number;
      is_buyer_maker: boolean;
    }>, { symbol: string; limit?: number }>({
      query: ({ symbol, limit = 50 }) => `market/trades/${symbol}?limit=${limit}`,
      providesTags: ['Market'],
    }),

    // Search trading pairs with autocomplete
    searchTradingPairs: builder.query<Array<{
      symbol: string;
      base_asset: string;
      quote_asset: string;
      status: string;
      current_price?: number;
      volume_24h?: number;
    }>, string>({
      query: (query) => `market/search?q=${encodeURIComponent(query)}`,
      providesTags: ['Market'],
    }),

    // Get price alerts for user
    getPriceAlerts: builder.query<PriceAlert[], void>({
      query: () => 'market/alerts',
      providesTags: ['Market'],
    }),

    // Create price alert
    createPriceAlert: builder.mutation<PriceAlert, CreatePriceAlertRequest>({
      query: (alert) => ({
        url: 'market/alerts',
        method: 'POST',
        body: alert,
      }),
      invalidatesTags: ['Market'],
    }),

    // Delete price alert
    deletePriceAlert: builder.mutation<void, number>({
      query: (id) => ({
        url: `market/alerts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Market'],
    }),

    // Get market overview data for dashboard
    getMarketOverview: builder.query<{
      total_market_cap: number;
      total_volume_24h: number;
      bitcoin_dominance: number;
      active_cryptocurrencies: number;
      fear_greed_index?: number;
    }, void>({
      query: () => 'market/overview',
      providesTags: ['Market'],
    }),
  }),
});

export const {
  useGetMarketDataQuery,
  useGetCandlestickDataQuery,
  useGetTradingPairsQuery,
  useGetMarketStatsQuery,
  useGetOrderBookQuery,
  useGetRecentTradesQuery,
  useSearchTradingPairsQuery,
  useGetPriceAlertsQuery,
  useCreatePriceAlertMutation,
  useDeletePriceAlertMutation,
  useGetMarketOverviewQuery,
} = marketApi;
