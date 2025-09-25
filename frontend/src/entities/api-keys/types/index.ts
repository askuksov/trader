export type ExchangeType = 'hitbtc' | 'binance';
export type ApiKeyStatus = 'active' | 'inactive' | 'error';

export interface ApiKey {
  id: number;
  name: string;
  exchange: ExchangeType;
  status: ApiKeyStatus;
  description?: string;
  created_at: string;
  updated_at: string;
  last_used_at: string | null;
  // API credentials are never returned in responses
  api_key_preview?: string; // Masked version like "abc...xyz"
}

export interface CreateApiKeyRequest {
  name: string;
  exchange: ExchangeType;
  api_key: string;
  secret_key: string;
  description?: string;
}

export interface UpdateApiKeyRequest {
  name?: string;
  description?: string;
}

export interface TestConnectionRequest {
  exchange: ExchangeType;
  api_key: string;
  secret_key: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
  exchange_info?: {
    account_type: string;
    permissions: string[];
    rate_limits: {
      requests_per_minute: number;
      orders_per_second: number;
    };
  };
  error?: string;
}

export interface ApiKeyBalance {
  currency: string;
  available: number;
  reserved: number;
  total: number;
  usd_value?: number;
}

export interface ApiKeyFilters {
  status: ApiKeyStatus[];
  exchange: ExchangeType[];
  search: string;
  sortBy: 'name' | 'created_at' | 'last_used_at';
  sortOrder: 'asc' | 'desc';
}

// API key validation rules
export const API_KEY_CONSTRAINTS = {
  name: {
    minLength: 1,
    maxLength: 50,
  },
  api_key: {
    minLength: 32,
    maxLength: 256,
  },
  secret_key: {
    minLength: 32,
    maxLength: 256,
  },
  description: {
    maxLength: 200,
  },
} as const;

// Exchange-specific configuration
export const EXCHANGE_CONFIG = {
  hitbtc: {
    name: 'HitBTC',
    baseUrl: 'https://api.hitbtc.com',
    documentationUrl: 'https://api.hitbtc.com/api/3/rest',
    features: ['spot_trading', 'margin_trading'],
  },
  binance: {
    name: 'Binance',
    baseUrl: 'https://api.binance.com',
    documentationUrl: 'https://binance-docs.github.io/apidocs/spot/en/',
    features: ['spot_trading', 'futures_trading', 'margin_trading'],
  },
} as const;
