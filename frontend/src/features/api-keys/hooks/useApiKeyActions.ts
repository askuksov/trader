import { useCallback } from 'react';
import {
  useCreateApiKeyMutation,
  useUpdateApiKeyMutation,
  useDeleteApiKeyMutation,
  useTestConnectionMutation,
  useGetApiKeyPositionsQuery,
} from '@/entities/api-keys';
import { useNotificationStore } from '@/shared/lib/stores';
import type {
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  TestConnectionRequest,
} from '@/entities/api-keys';

export function useApiKeyActions() {
  const [createApiKey, createResult] = useCreateApiKeyMutation();
  const [updateApiKey, updateResult] = useUpdateApiKeyMutation();
  const [deleteApiKey, deleteResult] = useDeleteApiKeyMutation();
  const [testConnection, testResult] = useTestConnectionMutation();
  
  const { addNotification } = useNotificationStore();

  // Create API key with success/error notifications
  const handleCreate = useCallback(async (data: CreateApiKeyRequest) => {
    try {
      const result = await createApiKey(data).unwrap();
      addNotification({
        type: 'success',
        title: 'API Key Created',
        message: `API key "${data.name}" has been created successfully.`,
      });
      return result;
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed to Create API Key',
        message: error?.data?.message || 'An unexpected error occurred.',
      });
      throw error;
    }
  }, [createApiKey, addNotification]);

  // Update API key with success/error notifications
  const handleUpdate = useCallback(async (id: number, updates: UpdateApiKeyRequest) => {
    try {
      const result = await updateApiKey({ id, updates }).unwrap();
      addNotification({
        type: 'success',
        title: 'API Key Updated',
        message: `API key has been updated successfully.`,
      });
      return result;
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed to Update API Key',
        message: error?.data?.message || 'An unexpected error occurred.',
      });
      throw error;
    }
  }, [updateApiKey, addNotification]);

  // Delete API key with position validation and notifications
  const handleDelete = useCallback(async (id: number, name: string) => {
    try {
      await deleteApiKey(id).unwrap();
      addNotification({
        type: 'success',
        title: 'API Key Deleted',
        message: `API key "${name}" has been deleted successfully.`,
      });
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Failed to Delete API Key',
        message: error?.data?.message || 'An unexpected error occurred.',
      });
      throw error;
    }
  }, [deleteApiKey, addNotification]);

  // Test connection with detailed feedback
  const handleTestConnection = useCallback(async (data: TestConnectionRequest) => {
    try {
      const result = await testConnection(data).unwrap();
      
      if (result.success) {
        addNotification({
          type: 'success',
          title: 'Connection Successful',
          message: result.message || 'API key connection is working properly.',
        });
      } else {
        addNotification({
          type: 'warning',
          title: 'Connection Failed',
          message: result.error || result.message || 'Failed to connect with the provided credentials.',
        });
      }
      
      return result;
    } catch (error: any) {
      addNotification({
        type: 'error',
        title: 'Connection Test Failed',
        message: error?.data?.message || 'Unable to test connection. Please try again.',
      });
      throw error;
    }
  }, [testConnection, addNotification]);

  return {
    // Actions
    create: handleCreate,
    update: handleUpdate,
    delete: handleDelete,
    testConnection: handleTestConnection,

    // Loading states
    isCreating: createResult.isLoading,
    isUpdating: updateResult.isLoading,
    isDeleting: deleteResult.isLoading,
    isTesting: testResult.isLoading,

    // Results for advanced handling
    createResult,
    updateResult,
    deleteResult,
    testResult,
  };
}

// Hook to check if API key can be safely deleted
export function useApiKeyDeletionValidation(apiKeyId: number) {
  const { data: positions, isLoading, error } = useGetApiKeyPositionsQuery(apiKeyId);
  
  const canDelete = !isLoading && (!positions || positions.length === 0);
  const activePositionsCount = positions ? positions.length : 0;
  
  return {
    canDelete,
    activePositionsCount,
    isLoading,
    error,
    warningMessage: activePositionsCount > 0 
      ? `This API key has ${activePositionsCount} active position(s). Please close all positions before deleting.`
      : undefined,
  };
}
