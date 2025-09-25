import React, { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Alert, AlertDescription } from '@/shared/ui/alert';
import { Badge } from '@/shared/ui/badge';
import { useApiKeyActions } from '../hooks/useApiKeyActions';
import type { ExchangeType, TestConnectionResponse } from '@/entities/api-keys';

interface ConnectionTestProps {
  exchange: ExchangeType;
  apiKey: string;
  secretKey: string;
  disabled?: boolean;
  variant?: 'button' | 'inline';
  onTestResult?: (result: TestConnectionResponse) => void;
}

export function ConnectionTest({
  exchange,
  apiKey,
  secretKey,
  disabled = false,
  variant = 'button',
  onTestResult,
}: ConnectionTestProps) {
  const { testConnection, isTesting } = useApiKeyActions();
  const [lastResult, setLastResult] = useState<TestConnectionResponse | null>(null);

  const handleTest = async () => {
    if (!apiKey || !secretKey || apiKey.length < 32 || secretKey.length < 32) {
      const errorResult: TestConnectionResponse = {
        success: false,
        message: 'Please provide valid API key and secret key (minimum 32 characters each)',
        error: 'Invalid credentials format',
      };
      setLastResult(errorResult);
      onTestResult?.(errorResult);
      return;
    }

    try {
      const result = await testConnection({
        exchange,
        api_key: apiKey,
        secret_key: secretKey,
      });
      
      setLastResult(result);
      onTestResult?.(result);
    } catch (error) {
      // Error is already handled by useApiKeyActions hook
      const errorResult: TestConnectionResponse = {
        success: false,
        message: 'Connection test failed',
        error: 'Network error or invalid credentials',
      };
      setLastResult(errorResult);
      onTestResult?.(errorResult);
    }
  };

  const getStatusIcon = () => {
    if (isTesting) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    
    if (!lastResult) {
      return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
    
    return lastResult.success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusText = () => {
    if (isTesting) return 'Testing...';
    if (!lastResult) return 'Not tested';
    return lastResult.success ? 'Connected' : 'Failed';
  };

  const getStatusColor = () => {
    if (isTesting) return 'secondary';
    if (!lastResult) return 'outline';
    return lastResult.success ? 'default' : 'destructive';
  };

  if (variant === 'inline') {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">Connection Status</span>
          </div>
          <Badge variant={getStatusColor() as any}>{getStatusText()}</Badge>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleTest}
          disabled={disabled || isTesting || !apiKey || !secretKey}
          className="w-full"
        >
          {isTesting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Test Connection
            </>
          )}
        </Button>

        {lastResult && (
          <Alert variant={lastResult.success ? 'default' : 'destructive'}>
            <AlertDescription className="text-sm">
              {lastResult.message}
              {lastResult.exchange_info && (
                <div className="mt-2 space-y-1">
                  <div>Account: {lastResult.exchange_info.account_type}</div>
                  <div>Permissions: {lastResult.exchange_info.permissions.join(', ')}</div>
                  <div>
                    Rate Limits: {lastResult.exchange_info.rate_limits.requests_per_minute}/min, 
                    {lastResult.exchange_info.rate_limits.orders_per_second}/s
                  </div>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleTest}
      disabled={disabled || isTesting || !apiKey || !secretKey}
    >
      {isTesting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Testing...
        </>
      ) : (
        <>
          {getStatusIcon()}
          <span className="ml-2">Test Connection</span>
        </>
      )}
    </Button>
  );
}

// Separate component for displaying connection status in lists
export function ConnectionStatus({ 
  status, 
  lastTestedAt 
}: { 
  status?: 'success' | 'error' | 'pending';
  lastTestedAt?: string;
}) {
  const getIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'success':
        return 'Connected';
      case 'error':
        return 'Connection Failed';
      case 'pending':
        return 'Testing...';
      default:
        return 'Not Tested';
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getIcon()}
      <div className="text-sm">
        <div className="font-medium">{getStatusText()}</div>
        {lastTestedAt && status && (
          <div className="text-muted-foreground">
            Last tested: {new Date(lastTestedAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
}
