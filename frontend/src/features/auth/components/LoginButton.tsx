import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';

export interface LoginButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  children?: React.ReactNode;
}

/**
 * Login button with loading states
 */
export const LoginButton: React.FC<LoginButtonProps> = ({
  loading = false,
  disabled,
  children = 'Sign In',
  className,
  ...props
}) => {
  return (
    <Button
      type="submit"
      disabled={loading || disabled}
      className={cn('w-full', className)}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        children
      )}
    </Button>
  );
};
