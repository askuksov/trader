import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type PositionStatus = 'active' | 'completed' | 'paused' | 'error';
export type DateRange = {
  from: Date;
  to: Date;
};

interface FiltersStore {
  positions: {
    status: PositionStatus[];
    tradingPairs: string[];
    apiKeyIds: number[];
    dateRange: DateRange | null;
    search: string;
    sortBy: 'created_at' | 'updated_at' | 'total_invested' | 'unrealized_pnl';
    sortOrder: 'asc' | 'desc';
  };
  apiKeys: {
    status: ('active' | 'inactive' | 'error')[];
    exchange: ('hitbtc' | 'binance')[];
    search: string;
    sortBy: 'name' | 'created_at' | 'last_used_at';
    sortOrder: 'asc' | 'desc';
  };
  setPositionFilter: <K extends keyof FiltersStore['positions']>(
    key: K,
    value: FiltersStore['positions'][K]
  ) => void;
  setApiKeyFilter: <K extends keyof FiltersStore['apiKeys']>(
    key: K,
    value: FiltersStore['apiKeys'][K]
  ) => void;
  resetPositionFilters: () => void;
  resetApiKeyFilters: () => void;
}

const defaultPositionFilters: FiltersStore['positions'] = {
  status: [],
  tradingPairs: [],
  apiKeyIds: [],
  dateRange: null,
  search: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
};

const defaultApiKeyFilters: FiltersStore['apiKeys'] = {
  status: [],
  exchange: [],
  search: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
};

export const useFiltersStore = create<FiltersStore>()(
  devtools(
    persist(
      (set) => ({
        positions: defaultPositionFilters,
        apiKeys: defaultApiKeyFilters,
        setPositionFilter: (key, value) =>
          set((state) => ({
            positions: {
              ...state.positions,
              [key]: value,
            },
          })),
        setApiKeyFilter: (key, value) =>
          set((state) => ({
            apiKeys: {
              ...state.apiKeys,
              [key]: value,
            },
          })),
        resetPositionFilters: () =>
          set((state) => ({
            ...state,
            positions: defaultPositionFilters,
          })),
        resetApiKeyFilters: () =>
          set((state) => ({
            ...state,
            apiKeys: defaultApiKeyFilters,
          })),
      }),
      {
        name: 'filters-store',
        version: 1,
      }
    ),
    {
      name: 'filters-store',
    }
  )
);
