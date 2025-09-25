import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table';
import { Badge } from '@/shared/ui/badge';
import { Building } from 'lucide-react';
import { ApiKeyStatusBadge } from './ApiKeyStatusBadge';
import { ApiKeyActions } from './ApiKeyActions';
import { EXCHANGE_CONFIG } from '@/entities/api-keys';
import type { ApiKey } from '@/entities/api-keys';

interface ApiKeysListProps {
  apiKeys: ApiKey[];
  onEdit: (apiKey: ApiKey) => void;
  onDelete: (apiKey: ApiKey) => void;
}

export function ApiKeysList({ apiKeys, onEdit, onDelete }: ApiKeysListProps) {
  if (apiKeys.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No API keys found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name & Exchange</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>API Key</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Used</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {apiKeys.map((apiKey) => (
            <TableRow key={apiKey.id}>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium">{apiKey.name}</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Building className="h-3 w-3" />
                    <span>{EXCHANGE_CONFIG[apiKey.exchange].name}</span>
                  </div>
                  {apiKey.description && (
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]" 
                         title={apiKey.description}>
                      {apiKey.description}
                    </div>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <ApiKeyStatusBadge status={apiKey.status} />
              </TableCell>

              <TableCell>
                {apiKey.api_key_preview ? (
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {apiKey.api_key_preview}
                  </code>
                ) : (
                  <span className="text-sm text-muted-foreground">Hidden</span>
                )}
              </TableCell>

              <TableCell>
                <div className="text-sm">
                  {new Date(apiKey.created_at).toLocaleDateString()}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(apiKey.created_at).toLocaleTimeString()}
                </div>
              </TableCell>

              <TableCell>
                <div className="text-sm">
                  {apiKey.last_used_at ? (
                    <>
                      <div>{new Date(apiKey.last_used_at).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(apiKey.last_used_at).toLocaleTimeString()}
                      </div>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Never</span>
                  )}
                </div>
              </TableCell>

              <TableCell>
                <ApiKeyActions 
                  apiKey={apiKey}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
