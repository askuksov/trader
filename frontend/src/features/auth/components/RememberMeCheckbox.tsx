import React, { forwardRef } from 'react';
import { Checkbox } from '@/shared/ui/checkbox';
import { Label } from '@/shared/ui/label';

export interface RememberMeCheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

/**
 * Remember me checkbox with tooltip
 */
const RememberMeCheckbox = forwardRef<HTMLButtonElement, RememberMeCheckboxProps>(
  ({ checked, onCheckedChange, disabled, id = 'remember-me' }, ref) => {
    return (
      <div className="flex items-center space-x-2">
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          ref={ref}
        />
        <Label
          htmlFor={id}
          className="text-sm text-muted-foreground cursor-pointer select-none"
          title="Keep me signed in for 30 days"
        >
          Remember me
        </Label>
      </div>
    );
  }
);

RememberMeCheckbox.displayName = 'RememberMeCheckbox';

export { RememberMeCheckbox };
