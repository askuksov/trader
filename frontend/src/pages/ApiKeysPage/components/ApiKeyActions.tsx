import React from 'react';
import { MoreHorizontal, Edit2, TestTube, Trash2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { useApiKeyActions } from '../../../features/api-keys/hooks/useApiKeyActions';
import type { ApiKey, TestConnectionRequest } from '@/entities/api-keys';

interface ApiKeyActionsProps {
  apiKey: ApiKey;
  onEdit: (apiKey: ApiKey) => void;
  onDelete: (apiKey: ApiKey) => void;
}

export function ApiKeyActions({ apiKey, onEdit, onDelete }: ApiKeyActionsProps) {
  const { testConnection, isTesting } = useApiKeyActions();

  const handleTestConnection = async () => {
    // Since we don't have the actual credentials stored in the frontend,
    // we'll make a test request using the API key ID
    // The backend will use the stored credentials for testing
    try {
      // This would be a different endpoint that tests using stored credentials
      // For now, we'll just show that the action was triggered
      console.log('Testing connection for API key:', apiKey.id);
    } catch (error) {
      console.error('Connection test failed:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={() => onEdit(apiKey)}>
          <Edit2 className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleTestConnection} disabled={isTesting}>
          <TestTube className="mr-2 h-4 w-4" />
          {isTesting ? 'Testing...' : 'Test Connection'}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => onDelete(apiKey)}
          className="text-red-600 focus:text-red-600 focus:bg-red-50"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
