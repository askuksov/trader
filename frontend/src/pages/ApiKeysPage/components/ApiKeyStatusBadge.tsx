import React from 'react';
import { Badge } from '@/shared/ui/badge';
import type { ApiKeyStatus } from '@/entities/api-keys';

interface ApiKeyStatusBadgeProps {
  status: ApiKeyStatus;
  className?: string;
}

export function ApiKeyStatusBadge({ status, className }: ApiKeyStatusBadgeProps) {
  const getVariant = (status: ApiKeyStatus) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'error':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: ApiKeyStatus) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'error':
        return 'Error';
      default:
        return status;
    }
  };

  return (
    <Badge variant={getVariant(status)} className={className}>
      {getStatusText(status)}
    </Badge>
  );
}
