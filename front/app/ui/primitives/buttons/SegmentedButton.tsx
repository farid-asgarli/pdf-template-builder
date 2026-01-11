import { type HTMLAttributes, type Ref, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/ui';

/**
 * M3 Expressive SegmentedButton
 * A group of connected buttons for mutually exclusive options
 * Follows M3 design: rounded-full ends, connected segments
 */

const segmentedButtonGroupVariants = cva(
  'inline-flex items-center rounded-full border-2 border-outline-variant/50 bg-surface p-0.5 transition-colors duration-200',
  {
    variants: {
      size: {
        sm: 'h-9',
        default: 'h-11',
        lg: 'h-12',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      size: 'default',
      fullWidth: false,
    },
  }
);

const segmentVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5 font-medium',
    'transition-all duration-200',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-inset',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
  {
    variants: {
      selected: {
        true: 'bg-primary text-on-primary rounded-full',
        false: 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-full',
      },
      size: {
        sm: 'px-3 py-1.5 text-xs h-8',
        default: 'px-4 py-2 text-sm h-10',
        lg: 'px-5 py-2.5 text-sm h-11',
      },
    },
    defaultVariants: {
      selected: false,
      size: 'default',
    },
  }
);

interface SegmentedButtonGroupProps<T extends string>
  extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'>,
    VariantProps<typeof segmentedButtonGroupVariants> {
  /** Current selected value */
  value: T;
  /** Callback when selection changes */
  onChange: (value: T) => void;
  /** Ref for the container */
  ref?: Ref<HTMLDivElement>;
  /** Children segments */
  children: ReactNode;
}

interface SegmentedButtonProps<T extends string> extends Omit<HTMLAttributes<HTMLButtonElement>, 'value'> {
  /** Value for this segment */
  value: T;
  /** Icon to display */
  icon?: ReactNode;
  /** Whether this segment is disabled */
  disabled?: boolean;
}

// Create context for segment group
import { createContext, useContext } from 'react';

interface SegmentedButtonContextValue<T extends string> {
  value: T;
  onChange: (value: T) => void;
  size: 'sm' | 'default' | 'lg';
}

const SegmentedButtonContext = createContext<SegmentedButtonContextValue<string> | null>(null);

function useSegmentedButtonContext() {
  const context = useContext(SegmentedButtonContext);
  if (!context) {
    throw new Error('SegmentedButton must be used within a SegmentedButtonGroup');
  }
  return context;
}

function SegmentedButtonGroup<T extends string>({
  value,
  onChange,
  size = 'default',
  fullWidth = false,
  className,
  children,
  ref,
  ...props
}: SegmentedButtonGroupProps<T>) {
  return (
    <SegmentedButtonContext.Provider value={{ value, onChange: onChange as (v: string) => void, size: size || 'default' }}>
      <div ref={ref} role="group" className={cn(segmentedButtonGroupVariants({ size, fullWidth, className }))} {...props}>
        {children}
      </div>
    </SegmentedButtonContext.Provider>
  );
}

function SegmentedButton<T extends string>({ value, icon, disabled = false, className, children, ...props }: SegmentedButtonProps<T>) {
  const context = useSegmentedButtonContext();
  const isSelected = context.value === value;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      disabled={disabled}
      onClick={() => context.onChange(value)}
      className={cn(segmentVariants({ selected: isSelected, size: context.size, className }))}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

export { SegmentedButtonGroup, SegmentedButton };
export type { SegmentedButtonGroupProps, SegmentedButtonProps };
