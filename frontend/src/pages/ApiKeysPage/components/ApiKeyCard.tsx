import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { CalendarDays, Building, FileText } from 'lucide-react';
import { ApiKeyStatusBadge } from './ApiKeyStatusBadge';
import { ApiKeyActions } from './ApiKeyActions';
import { EXCHANGE_CONFIG } from '@/entities/api-keys';
import type { ApiKey } from '@/entities/api-keys';

interface ApiKeyCardProps {
  apiKey: ApiKey;
  onEdit: (apiKey: ApiKey) => void;
  onDelete: (apiKey: ApiKey) => void;
}

export function ApiKeyCard({ apiKey, onEdit, onDelete }: ApiKeyCardProps) {
  const exchangeConfig = EXCHANGE_CONFIG[apiKey.exchange];

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{apiKey.name}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building className="h-4 w-4" />
              <span>{exchangeConfig.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ApiKeyStatusBadge status={apiKey.status} />
            <ApiKeyActions 
              apiKey={apiKey}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Description */}
        {apiKey.description && (
          <div className="flex items-start gap-2">
            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
            <p className="text-sm text-muted-foreground">{apiKey.description}</p>
          </div>
        )}

        {/* API Key Preview */}
        {apiKey.api_key_preview && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">API Key</p>
            <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
              {apiKey.api_key_preview}
            </code>
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <p className="text-muted-foreground">Created</p>
              <p className="font-medium">
                {new Date(apiKey.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <p className="text-muted-foreground">Last Used</p>
              <p className="font-medium">
                {apiKey.last_used_at 
                  ? new Date(apiKey.last_used_at).toLocaleDateString()
                  : 'Never'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(apiKey)}
            className="flex-1"
          >
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
          >
            Test Connection
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
