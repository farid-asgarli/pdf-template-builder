import { type InputHTMLAttributes, type Ref, type ReactNode, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/ui';

const inputVariants = cva(
  'flex w-full bg-transparent text-on-surface ring-offset-surface transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-on-surface-variant/40 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        // Outlined - clean border with focus state
        outlined:
          'border-2 border-outline-variant/50 rounded-2xl bg-surface-container-lowest focus-visible:border-primary hover:border-outline-variant',
        // Filled - container background
        filled: 'bg-surface-container border-2 border-transparent rounded-2xl focus-visible:border-primary hover:bg-surface-container-high',
        // Soft - very subtle appearance
        soft: 'bg-surface-container/60 border-2 border-transparent rounded-2xl focus-visible:bg-surface-container focus-visible:border-primary/40',
      },
      size: {
        default: 'h-11 px-4 py-2.5 text-sm',
        sm: 'h-10 px-3.5 py-2 text-sm',
        lg: 'h-12 px-5 py-3 text-base rounded-[1.25rem]',
      },
    },
    defaultVariants: {
      variant: 'outlined',
      size: 'default',
    },
  }
);

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof inputVariants> {
  ref?: Ref<HTMLInputElement>;
  label?: string;
  helperText?: string;
  error?: string;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

function Input({ className, type, variant, size, label, helperText, error, startIcon, endIcon, ref, id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hasError = !!error;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className={cn('block text-sm font-semibold mb-2', hasError ? 'text-error' : 'text-on-surface')}>
          {label}
        </label>
      )}
      <div className="relative">
        {startIcon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">{startIcon}</div>}
        <input
          type={type}
          id={inputId}
          className={cn(
            inputVariants({ variant, size }),
            startIcon && 'pl-11',
            endIcon && 'pr-11',
            hasError && 'border-error focus-visible:border-error',
            className
          )}
          ref={ref}
          {...props}
        />
        {endIcon && <div className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">{endIcon}</div>}
      </div>
      {(helperText || error) && <p className={cn('mt-2 text-sm', hasError ? 'text-error' : 'text-on-surface-variant/70')}>{error || helperText}</p>}
    </div>
  );
}

export { Input, inputVariants };
