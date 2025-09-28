import React from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Alert } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';

export interface ErrorAlertProps {
  error: string | null;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Authentication error display component
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  error,
  onDismiss,
  className,
}) => {
  if (!error) return null;

  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <div className="flex-1">
        <strong>Authentication Error</strong>
        <p className="text-sm mt-1">{error}</p>
      </div>
      {onDismiss && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDismiss}
          className="ml-2 h-auto p-1 hover:bg-transparent"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
};
