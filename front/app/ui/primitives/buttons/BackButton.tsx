// BackButton - Centralized back navigation button
//
// M3 Expressive Design Implementation:
// - Text button variant for lightweight navigation
// - Consistent styling across the app
// - Accessible with tooltip support
//
// Usage:
// - SurveyBuilder header (back to surveys)
// - Translation editor (back to languages list)
// - Any nested navigation context

import { forwardRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button, type ButtonProps } from './Button';
import { Tooltip } from '../display/Tooltip';
import { cn } from '@/app/ui';

export interface BackButtonProps extends Omit<ButtonProps, 'variant' | 'children'> {
  /** Text to display next to the arrow. Defaults to translated "Back" */
  label?: string;
  /** Tooltip content. If not provided, uses label */
  tooltip?: string;
  /** Whether to show only the icon (no text) */
  iconOnly?: boolean;
  /** Hide the tooltip */
  hideTooltip?: boolean;
}

export const BackButton = forwardRef<HTMLButtonElement, BackButtonProps>(
  ({ label = 'Back', tooltip, iconOnly = false, hideTooltip = false, className, size = 'sm', ...props }, ref) => {
    const buttonLabel = label;
    const tooltipContent = tooltip ?? buttonLabel;

    const button = (
      <Button ref={ref} variant="text" size={size} className={cn('rounded-lg', className)} aria-label={iconOnly ? buttonLabel : undefined} {...props}>
        <ArrowLeft className={cn('w-4 h-4', !iconOnly && 'mr-1')} />
        {!iconOnly && buttonLabel}
      </Button>
    );

    if (hideTooltip) {
      return button;
    }

    return <Tooltip content={tooltipContent}>{button}</Tooltip>;
  }
);

BackButton.displayName = 'BackButton';
