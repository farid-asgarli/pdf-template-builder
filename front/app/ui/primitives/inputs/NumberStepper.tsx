import { type InputHTMLAttributes, type Ref } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/ui';
import { Minus, Plus } from 'lucide-react';

/**
 * M3 Expressive NumberStepper
 * A styled number input with increment/decrement buttons
 * Follows M3 design: rounded-2xl, border-2, no shadows
 */

const numberStepperVariants = cva(
  'inline-flex items-center rounded-2xl border-2 border-outline-variant/50 bg-surface transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
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

const stepButtonVariants = cva(
  [
    'flex items-center justify-center shrink-0',
    'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
    'transition-colors duration-200',
    'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent',
    'focus:outline-none focus:bg-surface-container-high',
  ].join(' '),
  {
    variants: {
      position: {
        left: 'rounded-l-[14px] border-r border-outline-variant/30',
        right: 'rounded-r-[14px] border-l border-outline-variant/30',
      },
      size: {
        sm: 'w-8 h-full',
        default: 'w-10 h-full',
        lg: 'w-11 h-full',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

interface NumberStepperProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size' | 'type'>,
    VariantProps<typeof numberStepperVariants> {
  /** Current value */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Suffix text (e.g., "px", "%") */
  suffix?: string;
  /** Label for accessibility */
  label?: string;
  /** Show stepper buttons */
  showButtons?: boolean;
  /** Ref for the input element */
  ref?: Ref<HTMLInputElement>;
}

function NumberStepper({
  value,
  onChange,
  min = 0,
  max = Infinity,
  step = 1,
  suffix,
  label,
  size = 'default',
  fullWidth = false,
  showButtons = true,
  disabled = false,
  className,
  ref,
  ...props
}: NumberStepperProps) {
  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow empty input for editing
    if (inputValue === '') {
      onChange(min);
      return;
    }

    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.min(max, Math.max(min, numValue));
      onChange(clampedValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      handleDecrement();
    }
  };

  const canDecrement = value > min && !disabled;
  const canIncrement = value < max && !disabled;

  return (
    <div className={cn(numberStepperVariants({ size, fullWidth, className }))}>
      {showButtons && (
        <button
          type="button"
          onClick={handleDecrement}
          disabled={!canDecrement}
          className={cn(stepButtonVariants({ position: 'left', size }))}
          aria-label={`Decrease ${label || 'value'}`}
          tabIndex={-1}
        >
          <Minus className={cn(size === 'sm' && 'h-3.5 w-3.5', size === 'default' && 'h-4 w-4', size === 'lg' && 'h-5 w-5')} />
        </button>
      )}

      <div className="flex flex-1 items-center justify-center overflow-hidden">
        <input
          ref={ref}
          type="number"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            'min-w-[2ch] max-w-full flex-1 bg-transparent text-center font-medium tabular-nums text-on-surface',
            'focus:outline-none',
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
            size === 'sm' && 'px-0.5 text-xs',
            size === 'default' && 'px-1 text-sm',
            size === 'lg' && 'px-2 text-base',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          aria-label={label}
          {...props}
        />
        {suffix && (
          <span
            className={cn(
              'shrink-0 text-on-surface-variant',
              size === 'sm' && 'pr-1.5 text-xs',
              size === 'default' && 'pr-2 text-xs',
              size === 'lg' && 'pr-2 text-sm'
            )}
          >
            {suffix}
          </span>
        )}
      </div>

      {showButtons && (
        <button
          type="button"
          onClick={handleIncrement}
          disabled={!canIncrement}
          className={cn(stepButtonVariants({ position: 'right', size }))}
          aria-label={`Increase ${label || 'value'}`}
          tabIndex={-1}
        >
          <Plus className={cn(size === 'sm' && 'h-3.5 w-3.5', size === 'default' && 'h-4 w-4', size === 'lg' && 'h-5 w-5')} />
        </button>
      )}
    </div>
  );
}

export { NumberStepper, numberStepperVariants };
export type { NumberStepperProps };
