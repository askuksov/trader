import { baseApi } from '@/app/store/baseApi';
import type {
  DCAStrategySettings,
  PairSettings,
  StrategyPreset,
  CreatePresetRequest,
  SupportedPair,
} from '../types';

export const strategyApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get global DCA settings
    getDCASettings: builder.query<DCAStrategySettings, void>({
      query: () => 'strategy/dca-settings',
      providesTags: ['Strategy'],
    }),

    // Update global DCA settings
    updateDCASettings: builder.mutation<DCAStrategySettings, DCAStrategySettings>({
      query: (settings) => ({
        url: 'strategy/dca-settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Strategy'],
    }),

    // Get pair-specific settings
    getPairSettings: builder.query<PairSettings[], void>({
      query: () => 'strategy/pair-settings',
      providesTags: ['Strategy'],
    }),

    // Update pair-specific settings
    updatePairSettings: builder.mutation<PairSettings, { pair: string; settings: Partial<PairSettings> }>({
      query: ({ pair, settings }) => ({
        url: `strategy/pair-settings/${pair}`,
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Strategy'],
    }),

    // Get available presets
    getPresets: builder.query<StrategyPreset[], void>({
      query: () => 'strategy/presets',
      providesTags: ['Strategy'],
    }),

    // Create custom preset
    createPreset: builder.mutation<StrategyPreset, CreatePresetRequest>({
      query: (preset) => ({
        url: 'strategy/presets',
        method: 'POST',
        body: preset,
      }),
      invalidatesTags: ['Strategy'],
    }),

    // Delete custom preset
    deletePreset: builder.mutation<void, string>({
      query: (presetId) => ({
        url: `strategy/presets/${presetId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Strategy'],
    }),

    // Get supported trading pairs
    getSupportedPairs: builder.query<SupportedPair[], void>({
      query: () => 'strategy/supported-pairs',
      providesTags: ['Strategy'],
    }),

    // Apply preset to global settings
    applyPreset: builder.mutation<DCAStrategySettings, string>({
      query: (presetId) => ({
        url: `strategy/presets/${presetId}/apply`,
        method: 'POST',
      }),
      invalidatesTags: ['Strategy'],
    }),

    // Export strategy configuration
    exportStrategy: builder.query<Blob, void>({
      query: () => ({
        url: 'strategy/export',
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Import strategy configuration
    importStrategy: builder.mutation<DCAStrategySettings, FormData>({
      query: (formData) => ({
        url: 'strategy/import',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Strategy'],
    }),
  }),
});

export const {
  useGetDCASettingsQuery,
  useUpdateDCASettingsMutation,
  useGetPairSettingsQuery,
  useUpdatePairSettingsMutation,
  useGetPresetsQuery,
  useCreatePresetMutation,
  useDeletePresetMutation,
  useGetSupportedPairsQuery,
  useApplyPresetMutation,
  useExportStrategyQuery,
  useImportStrategyMutation,
} = strategyApi;
