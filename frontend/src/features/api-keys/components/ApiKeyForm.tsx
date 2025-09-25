import React, { useState, useEffect } from 'react';
import { useForm, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { PasswordInput } from '@/shared/ui/password-input';
import { Separator } from '@/shared/ui/separator';
import { ConnectionTest } from './ConnectionTest';
import type { 
  CreateApiKeyRequest, 
  UpdateApiKeyRequest, 
  ExchangeType,
  TestConnectionResponse 
} from '@/entities/api-keys';
import { API_KEY_CONSTRAINTS, EXCHANGE_CONFIG } from '@/entities/api-keys';

// Define the enum values
const SUPPORTED_EXCHANGES = ['hitbtc', 'binance'] as const;

// Validation schema for API key creation
const createApiKeySchema = z.object({
  name: z
    .string()
    .min(API_KEY_CONSTRAINTS.name.minLength, 'Name is required')
    .max(API_KEY_CONSTRAINTS.name.maxLength, `Name must be ${API_KEY_CONSTRAINTS.name.maxLength} characters or less`),
  exchange: z.enum(SUPPORTED_EXCHANGES, {
    message: 'Please select a valid exchange'
  }),
  api_key: z
    .string()
    .min(API_KEY_CONSTRAINTS.api_key.minLength, `API key must be at least ${API_KEY_CONSTRAINTS.api_key.minLength} characters`)
    .max(API_KEY_CONSTRAINTS.api_key.maxLength, `API key must be ${API_KEY_CONSTRAINTS.api_key.maxLength} characters or less`),
  secret_key: z
    .string()
    .min(API_KEY_CONSTRAINTS.secret_key.minLength, `Secret key must be at least ${API_KEY_CONSTRAINTS.secret_key.minLength} characters`)
    .max(API_KEY_CONSTRAINTS.secret_key.maxLength, `Secret key must be ${API_KEY_CONSTRAINTS.secret_key.maxLength} characters or less`),
  description: z
    .string()
    .max(API_KEY_CONSTRAINTS.description.maxLength, `Description must be ${API_KEY_CONSTRAINTS.description.maxLength} characters or less`)
    .optional(),
});

// Validation schema for API key updates (only name and description)
const updateApiKeySchema = z.object({
  name: z
    .string()
    .min(API_KEY_CONSTRAINTS.name.minLength, 'Name is required')
    .max(API_KEY_CONSTRAINTS.name.maxLength, `Name must be ${API_KEY_CONSTRAINTS.name.maxLength} characters or less`),
  description: z
    .string()
    .max(API_KEY_CONSTRAINTS.description.maxLength, `Description must be ${API_KEY_CONSTRAINTS.description.maxLength} characters or less`)
    .optional(),
});

type CreateFormData = z.infer<typeof createApiKeySchema>;
type UpdateFormData = z.infer<typeof updateApiKeySchema>;

interface ApiKeyFormProps {
  mode: 'create' | 'update';
  initialData?: Partial<CreateFormData>;
  onSubmit: (data: CreateApiKeyRequest | UpdateApiKeyRequest) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

export function ApiKeyForm({
  mode,
  initialData,
  onSubmit,
  isLoading = false,
  onCancel,
}: ApiKeyFormProps) {
  const [connectionTestResult, setConnectionTestResult] = useState<TestConnectionResponse | null>(null);
  const [isConnectionTested, setIsConnectionTested] = useState(false);

  const schema = mode === 'create' ? createApiKeySchema : updateApiKeySchema;
  const isCreateMode = mode === 'create';

  const form = useForm<CreateFormData | UpdateFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      ...(isCreateMode && {
        exchange: initialData?.exchange || undefined,
        api_key: initialData?.api_key || '',
        secret_key: initialData?.secret_key || '',
      }),
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = form;

  const watchedValues = watch();
  const selectedExchange = isCreateMode ? (watchedValues as CreateFormData).exchange : undefined;
  const apiKey = isCreateMode ? (watchedValues as CreateFormData).api_key : '';
  const secretKey = isCreateMode ? (watchedValues as CreateFormData).secret_key : '';

  // Reset connection test when credentials change
  useEffect(() => {
    if (isCreateMode) {
      setConnectionTestResult(null);
      setIsConnectionTested(false);
    }
  }, [apiKey, secretKey, selectedExchange, isCreateMode]);

  const handleConnectionTestResult = (result: TestConnectionResponse) => {
    setConnectionTestResult(result);
    setIsConnectionTested(true);
  };

  const handleFormSubmit = async (data: CreateFormData | UpdateFormData) => {
    // For create mode, require successful connection test
    if (isCreateMode && (!isConnectionTested || !connectionTestResult?.success)) {
      form.setError('root', {
        message: 'Please test the connection successfully before creating the API key.',
      });
      return;
    }

    await onSubmit(data);
  };

  const getExchangeDocumentationUrl = (exchange: ExchangeType) => {
    return EXCHANGE_CONFIG[exchange].documentationUrl;
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">API Key Name *</Label>
          <Input
            id="name"
            {...register('name')}
            placeholder="e.g., Binance Main Account"
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            {...register('description')}
            placeholder="Optional description of this API key"
            disabled={isLoading}
          />
          {errors.description && (
            <p className="text-sm text-red-600 mt-1">{errors.description.message}</p>
          )}
        </div>
      </div>

      {isCreateMode && (
        <>
          <Separator />

          {/* Exchange Selection */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="exchange">Exchange *</Label>
              <Select
                value={selectedExchange}
                onValueChange={(value: ExchangeType) => setValue('exchange', value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exchange" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(EXCHANGE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <span>{config.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({config.features.join(', ')})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(errors as FieldErrors<CreateFormData>).exchange && (
                <p className="text-sm text-red-600 mt-1">{(errors as FieldErrors<CreateFormData>).exchange?.message}</p>
              )}
              {selectedExchange && (
                <p className="text-xs text-muted-foreground mt-1">
                  <a 
                    href={getExchangeDocumentationUrl(selectedExchange)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View {EXCHANGE_CONFIG[selectedExchange].name} API documentation →
                  </a>
                </p>
              )}
            </div>

            {/* API Credentials */}
            <div>
              <Label htmlFor="api_key">API Key *</Label>
              <Input
                id="api_key"
                {...register('api_key')}
                placeholder="Enter your API key"
                disabled={isLoading}
                autoComplete="off"
              />
              {(errors as FieldErrors<CreateFormData>).api_key && (
                <p className="text-sm text-red-600 mt-1">{(errors as FieldErrors<CreateFormData>).api_key?.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="secret_key">Secret Key *</Label>
              <PasswordInput
                id="secret_key"
                {...register('secret_key')}
                placeholder="Enter your secret key"
                disabled={isLoading}
                autoComplete="new-password"
              />
              {(errors as FieldErrors<CreateFormData>).secret_key && (
                <p className="text-sm text-red-600 mt-1">{(errors as FieldErrors<CreateFormData>).secret_key?.message}</p>
              )}
            </div>

            {/* Connection Test */}
            {selectedExchange && apiKey && secretKey && (
              <div className="mt-6">
                <ConnectionTest
                  exchange={selectedExchange}
                  apiKey={apiKey}
                  secretKey={secretKey}
                  variant="inline"
                  disabled={isLoading}
                  onTestResult={handleConnectionTestResult}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Form Actions */}
      <Separator />
      
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        
        <Button 
          type="submit" 
          disabled={
            isLoading || 
            !isValid || 
            (isCreateMode && (!isConnectionTested || !connectionTestResult?.success))
          }
        >
          {isLoading ? 'Saving...' : isCreateMode ? 'Create API Key' : 'Update API Key'}
        </Button>
      </div>

      {/* Form-level errors */}
      {errors.root && (
        <p className="text-sm text-red-600 text-center">{errors.root.message}</p>
      )}

      {/* Security Notice */}
      {isCreateMode && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm text-yellow-800">
            <strong>Security Notice:</strong> Your API credentials are encrypted and stored securely. 
            We never store your actual secret key in plain text. Only grant permissions necessary 
            for trading (usually "Spot Trading" or "Trade" permissions).
          </div>
        </div>
      )}
    </form>
  );
}
