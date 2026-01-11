import { type HTMLAttributes, type Ref } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, Check } from 'lucide-react';
import { cn } from '@/app/ui';

const chipVariants = cva('inline-flex items-center gap-2 font-medium transition-all duration-200 select-none whitespace-nowrap', {
  variants: {
    variant: {
      // Assist chip - light purple background with purple icon/text
      assist: 'bg-primary-container/40 text-primary border border-transparent hover:bg-primary-container/60',
      // Filter chip - toggleable, default state
      filter: 'bg-surface border border-outline-variant text-on-surface hover:bg-surface-container',
      // Filter selected - filled purple background
      'filter-selected': 'bg-primary-container text-on-primary-container border border-transparent',
      // Input chip - white background with border and close button
      input: 'bg-surface border border-outline-variant text-on-surface hover:bg-surface-container',
      // Suggestion chip - white background with border
      suggestion: 'bg-surface border border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container',
      // Success chip - for status like "Complete"
      success: 'bg-success-container/60 text-on-success-container border border-success/20',
      // Warning chip
      warning: 'bg-warning-container/60 text-on-warning-container border border-warning/20',
      // Error chip
      error: 'bg-error-container/60 text-on-error-container border border-error/20',
    },
    size: {
      default: 'h-10 px-4 rounded-full text-sm',
      sm: 'h-8 px-3 text-xs rounded-full',
      lg: 'h-12 px-5 rounded-full text-base',
    },
  },
  defaultVariants: {
    variant: 'assist',
    size: 'default',
  },
});

interface ChipProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof chipVariants> {
  ref?: Ref<HTMLDivElement>;
  /** Leading icon to display */
  icon?: React.ReactNode;
  /** Callback when remove button is clicked (shows X button) */
  onRemove?: () => void;
  /** Aria label for the remove button */
  removeAriaLabel?: string;
  /** Whether the chip is selected (for filter variant, shows checkmark) */
  selected?: boolean;
  /** Whether to show checkmark icon when selected (default: true for filter variant) */
  showCheckmark?: boolean;
}

function Chip({
  className,
  variant,
  size,
  icon,
  onRemove,
  removeAriaLabel,
  selected,
  showCheckmark = true,
  ref,
  children,
  onClick,
  ...props
}: ChipProps) {
  const isFilterVariant = variant === 'filter';
  const actualVariant = selected && isFilterVariant ? 'filter-selected' : variant;
  const isClickable = !!onClick;

  // Show checkmark for selected filter chips
  const showSelectedCheckmark = selected && isFilterVariant && showCheckmark;
  const displayIcon = showSelectedCheckmark ? <Check className="h-4 w-4" strokeWidth={2.5} /> : icon;

  return (
    <div
      ref={ref}
      className={cn(chipVariants({ variant: actualVariant, size, className }), isClickable && 'cursor-pointer active:scale-[0.98]')}
      onClick={onClick}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
            }
          : undefined
      }
      {...props}
    >
      {displayIcon && <span className="shrink-0 -ml-0.5">{displayIcon}</span>}
      <span className="truncate flex justify-center items-center">{children}</span>
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="shrink-0 p-0.5 rounded-full hover:bg-on-surface/10 -mr-1 transition-colors"
          aria-label={removeAriaLabel || 'Remove'}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export { Chip, chipVariants };
