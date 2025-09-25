import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { useApiKeyFilters } from '../../../features/api-keys/stores/useApiKeyFilters';
import { EXCHANGE_CONFIG } from '@/entities/api-keys';
import type { ApiKeyStatus, ExchangeType } from '@/entities/api-keys';

const STATUS_OPTIONS: { value: ApiKeyStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'error', label: 'Error' },
];

const EXCHANGE_OPTIONS: { value: ExchangeType; label: string }[] = [
  { value: 'binance', label: EXCHANGE_CONFIG.binance.name },
  { value: 'hitbtc', label: EXCHANGE_CONFIG.hitbtc.name },
];

const SORT_OPTIONS = [
  { value: 'name', label: 'Name' },
  { value: 'created_at', label: 'Created Date' },
  { value: 'last_used_at', label: 'Last Used' },
] as const;

export function ApiKeysFilters() {
  const status = useApiKeyFilters((state) => state.status);
  const exchange = useApiKeyFilters((state) => state.exchange);
  const search = useApiKeyFilters((state) => state.search);
  const sortBy = useApiKeyFilters((state) => state.sortBy);
  const sortOrder = useApiKeyFilters((state) => state.sortOrder);
  
  const setStatus = useApiKeyFilters((state) => state.setStatus);
  const setExchange = useApiKeyFilters((state) => state.setExchange);
  const setSearch = useApiKeyFilters((state) => state.setSearch);
  const setSortBy = useApiKeyFilters((state) => state.setSortBy);
  const setSortOrder = useApiKeyFilters((state) => state.setSortOrder);
  const resetFilters = useApiKeyFilters((state) => state.resetFilters);
  const hasActiveFilters = useApiKeyFilters((state) => state.hasActiveFilters);

  const handleStatusToggle = (statusValue: ApiKeyStatus) => {
    const newStatus = status.includes(statusValue)
      ? status.filter((s) => s !== statusValue)
      : [...status, statusValue];
    setStatus(newStatus);
  };

  const handleExchangeToggle = (exchangeValue: ExchangeType) => {
    const newExchange = exchange.includes(exchangeValue)
      ? exchange.filter((e) => e !== exchangeValue)
      : [...exchange, exchangeValue];
    setExchange(newExchange);
  };

  const activeFilterCount = useApiKeyFilters((state) => state.getFilterCount());

  return (
    <div className="space-y-4">
      {/* Search and main filters row */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search API keys by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
          {search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => setSearch('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filters dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            {STATUS_OPTIONS.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={status.includes(option.value)}
                onCheckedChange={() => handleStatusToggle(option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuLabel>Filter by Exchange</DropdownMenuLabel>
            {EXCHANGE_OPTIONS.map((option) => (
              <DropdownMenuCheckboxItem
                key={option.value}
                checked={exchange.includes(option.value)}
                onCheckedChange={() => handleExchangeToggle(option.value)}
              >
                {option.label}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Sort controls */}
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Desc</SelectItem>
              <SelectItem value="asc">Asc</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active filters display */}
      {hasActiveFilters() && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {status.map((statusValue) => (
            <Badge key={statusValue} variant="secondary" className="text-xs">
              Status: {statusValue}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => handleStatusToggle(statusValue)}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}

          {exchange.map((exchangeValue) => (
            <Badge key={exchangeValue} variant="secondary" className="text-xs">
              Exchange: {EXCHANGE_CONFIG[exchangeValue].name}
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => handleExchangeToggle(exchangeValue)}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          ))}

          {search && (
            <Badge variant="secondary" className="text-xs">
              Search: "{search}"
              <Button
                variant="ghost"
                size="sm"
                className="ml-1 h-3 w-3 p-0 hover:bg-transparent"
                onClick={() => setSearch('')}
              >
                <X className="h-2 w-2" />
              </Button>
            </Badge>
          )}

          <Button variant="ghost" size="sm" onClick={resetFilters} className="text-xs h-6">
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
}
