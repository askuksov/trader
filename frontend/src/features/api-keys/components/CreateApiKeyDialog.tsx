import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';
import { ApiKeyForm } from './ApiKeyForm';
import { useApiKeyActions } from '../hooks/useApiKeyActions';
import type { CreateApiKeyRequest } from '@/entities/api-keys';

interface CreateApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateApiKeyDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateApiKeyDialogProps) {
  const { create, isCreating } = useApiKeyActions();

  const handleSubmit = async (data: CreateApiKeyRequest) => {
    try {
      await create(data);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New API Key</DialogTitle>
        </DialogHeader>
        
        <ApiKeyForm
          mode="create"
          onSubmit={handleSubmit}
          isLoading={isCreating}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
