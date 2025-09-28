import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Alert } from '@/shared/ui/alert';

export interface SuccessMessageProps {
  message: string | null;
  className?: string;
}

/**
 * Success confirmation component
 */
export const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  className,
}) => {
  if (!message) return null;

  return (
    <Alert variant="default" className={className}>
      <CheckCircle className="h-4 w-4 text-green-600" />
      <div>
        <strong>Success</strong>
        <p className="text-sm mt-1">{message}</p>
      </div>
    </Alert>
  );
};
