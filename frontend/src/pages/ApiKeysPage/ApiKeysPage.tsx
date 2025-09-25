import React, { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Spinner } from '@/shared/ui/spinner';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { useGetApiKeysQuery } from '@/entities/api-keys';
import { useApiKeyFilters } from '@/features/api-keys/stores/useApiKeyFilters';
import { CreateApiKeyDialog } from '@/features/api-keys/components/CreateApiKeyDialog';
import { EditApiKeyDialog } from '@/features/api-keys/components/EditApiKeyDialog';
import { DeleteConfirmDialog } from '@/features/api-keys/components/DeleteConfirmDialog';
import { ApiKeysFilters } from './components/ApiKeysFilters';
import { ApiKeysList } from './components/ApiKeysList';
import { ApiKeyCard } from './components/ApiKeyCard';
import type { ApiKey } from '@/entities/api-keys';

export default function ApiKeysPage() {
  const [selectedApiKey, setSelectedApiKey] = useState<ApiKey | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Get individual filter values to avoid object recreation
  const status = useApiKeyFilters((state) => state.status);
  const exchange = useApiKeyFilters((state) => state.exchange);
  const search = useApiKeyFilters((state) => state.search);
  const sortBy = useApiKeyFilters((state) => state.sortBy);
  const sortOrder = useApiKeyFilters((state) => state.sortOrder);
  const resetFilters = useApiKeyFilters((state) => state.resetFilters);

  // Memoize filters object to prevent unnecessary re-renders
  const filters = useMemo(() => ({
    status,
    exchange,
    search,
    sortBy,
    sortOrder,
  }), [status, exchange, search, sortBy, sortOrder]);

  // Fetch API keys with filters
  const { data: apiKeys = [], isLoading, error, refetch } = useGetApiKeysQuery(filters);

  // Filter API keys client-side for search (since search happens instantly)
  const filteredApiKeys = apiKeys.filter((apiKey) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        apiKey.name.toLowerCase().includes(searchLower) ||
        apiKey.description?.toLowerCase().includes(searchLower) ||
        apiKey.exchange.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleEditClick = (apiKey: ApiKey) => {
    setSelectedApiKey(apiKey);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (apiKey: ApiKey) => {
    setSelectedApiKey(apiKey);
    setShowDeleteDialog(true);
  };

  const handleSuccess = () => {
    refetch();
  };

  // Auto-switch to cards view on mobile
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('cards');
      } else {
        setViewMode('table');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground">
            Manage your exchange API keys for automated trading
          </p>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add API Key
        </Button>
      </div>

      {/* Filters */}
      <ApiKeysFilters />

      {/* Content */}
      <div className="space-y-4">
        {isLoading && (
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="flex items-center gap-3">
                <Spinner className="h-6 w-6" />
                <span>Loading API keys...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load API keys. Please try again.
              <Button 
                variant="link" 
                size="sm" 
                className="ml-2 p-0 h-auto"
                onClick={() => refetch()}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && (
          <>
            {filteredApiKeys.length > 0 ? (
              <>
                {/* View toggle for desktop */}
                <div className="hidden md:flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {filteredApiKeys.length} of {apiKeys.length} API keys
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                    >
                      Table
                    </Button>
                    <Button
                      variant={viewMode === 'cards' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('cards')}
                    >
                      Cards
                    </Button>
                  </div>
                </div>

                {/* API Keys List/Cards */}
                {viewMode === 'table' ? (
                  <div className="hidden md:block">
                    <ApiKeysList
                      apiKeys={filteredApiKeys}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                    />
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredApiKeys.map((apiKey) => (
                      <ApiKeyCard
                        key={apiKey.id}
                        apiKey={apiKey}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Empty State */
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  {filters.search || filters.status.length > 0 || filters.exchange.length > 0 ? (
                    /* No results found */
                    <>
                      <p className="text-lg font-medium mb-2">No API keys found</p>
                      <p className="text-muted-foreground mb-4 text-center">
                        No API keys match your current filters. Try adjusting your search or filter criteria.
                      </p>
                      <Button 
                        variant="outline"
                        onClick={resetFilters}
                      >
                        Clear Filters
                      </Button>
                    </>
                  ) : (
                    /* No API keys at all */
                    <>
                      <p className="text-lg font-medium mb-2">No API keys configured</p>
                      <p className="text-muted-foreground mb-4 text-center">
                        Add your first exchange API key to start automated trading with DCA strategies.
                      </p>
                      <Button onClick={() => setShowCreateDialog(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Your First API Key
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Dialogs */}
      <CreateApiKeyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={handleSuccess}
      />

      <EditApiKeyDialog
        apiKey={selectedApiKey}
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open);
          if (!open) setSelectedApiKey(null);
        }}
        onSuccess={handleSuccess}
      />

      <DeleteConfirmDialog
        apiKey={selectedApiKey}
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) setSelectedApiKey(null);
        }}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
