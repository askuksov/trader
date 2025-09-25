import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { useApiKeyActions, useApiKeyDeletionValidation } from '../hooks/useApiKeyActions';
import type { ApiKey } from '@/entities/api-keys';

interface DeleteConfirmDialogProps {
  apiKey: ApiKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteConfirmDialog({
  apiKey,
  open,
  onOpenChange,
  onSuccess,
}: DeleteConfirmDialogProps) {
  const { delete: deleteApiKey, isDeleting } = useApiKeyActions();
  const validation = useApiKeyDeletionValidation(apiKey?.id || 0);

  if (!apiKey) return null;

  const handleConfirmDelete = async () => {
    if (!validation.canDelete) return;

    try {
      await deleteApiKey(apiKey.id, apiKey.name);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            Delete API Key
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the API key "{apiKey.name}"? 
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Show warning if API key has active positions */}
        {!validation.canDelete && validation.warningMessage && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{validation.warningMessage}</AlertDescription>
          </Alert>
        )}

        {/* Show additional information about the API key */}
        <div className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Exchange:</span>
            <span className="capitalize font-medium">{apiKey.exchange}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Status:</span>
            <span className="capitalize font-medium">{apiKey.status}</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Created:</span>
            <span className="font-medium">{new Date(apiKey.created_at).toLocaleDateString()}</span>
          </div>
          {apiKey.last_used_at && (
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Last used:</span>
              <span className="font-medium">{new Date(apiKey.last_used_at).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirmDelete}
            disabled={isDeleting || !validation.canDelete}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
          >
            {isDeleting ? 'Deleting...' : 'Delete API Key'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
