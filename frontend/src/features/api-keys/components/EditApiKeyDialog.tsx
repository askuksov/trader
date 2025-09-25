import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { ApiKeyForm } from './ApiKeyForm';
import { useApiKeyActions } from '../hooks/useApiKeyActions';
import type { ApiKey, UpdateApiKeyRequest } from '@/entities/api-keys';

interface EditApiKeyDialogProps {
  apiKey: ApiKey | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditApiKeyDialog({
  apiKey,
  open,
  onOpenChange,
  onSuccess,
}: EditApiKeyDialogProps) {
  const { update, isUpdating } = useApiKeyActions();

  if (!apiKey) return null;

  const handleSubmit = async (data: UpdateApiKeyRequest) => {
    try {
      await update(apiKey.id, data);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit API Key</DialogTitle>
        </DialogHeader>
        
        <ApiKeyForm
          mode="update"
          initialData={{
            name: apiKey.name,
            description: apiKey.description || '',
          }}
          onSubmit={handleSubmit}
          isLoading={isUpdating}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
