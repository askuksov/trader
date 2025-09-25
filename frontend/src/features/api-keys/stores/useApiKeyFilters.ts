import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ApiKeyFilters, ApiKeyStatus, ExchangeType } from '@/entities/api-keys';

interface ApiKeyFiltersState extends ApiKeyFilters {
  // Actions
  setStatus: (status: ApiKeyStatus[]) => void;
  setExchange: (exchange: ExchangeType[]) => void;
  setSearch: (search: string) => void;
  setSortBy: (sortBy: ApiKeyFilters['sortBy']) => void;
  setSortOrder: (sortOrder: ApiKeyFilters['sortOrder']) => void;
  resetFilters: () => void;
  
  // Helper methods
  hasActiveFilters: () => boolean;
  getFilterCount: () => number;
}

const defaultFilters: ApiKeyFilters = {
  status: [],
  exchange: [],
  search: '',
  sortBy: 'created_at',
  sortOrder: 'desc',
};

export const useApiKeyFilters = create<ApiKeyFiltersState>()(
  persist(
    (set, get) => ({
      ...defaultFilters,

      // Actions
      setStatus: (status) => set({ status }),
      setExchange: (exchange) => set({ exchange }),
      setSearch: (search) => set({ search }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (sortOrder) => set({ sortOrder }),

      resetFilters: () => set(defaultFilters),

      // Helper methods  
      hasActiveFilters: () => {
        const state = get();
        return (
          state.status.length > 0 ||
          state.exchange.length > 0 ||
          state.search.length > 0
        );
      },

      getFilterCount: () => {
        const state = get();
        let count = 0;
        if (state.status.length > 0) count++;
        if (state.exchange.length > 0) count++;
        if (state.search.length > 0) count++;
        return count;
      },
    }),
    {
      name: 'api-key-filters',
      // Only persist filter values, not methods
      partialize: (state) => ({
        status: state.status,
        exchange: state.exchange,
        search: state.search,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);
