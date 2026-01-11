import { type TextareaHTMLAttributes, type Ref, useId } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/ui';

const textareaVariants = cva(
  'flex min-h-[120px] w-full bg-transparent text-on-surface ring-offset-surface transition-all duration-200 placeholder:text-on-surface-variant/60 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-none',
  {
    variants: {
      variant: {
        // M3 Expressive: Outlined with thicker border
        outlined:
          'border-2 border-outline-variant rounded-2xl bg-surface focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
        // M3 Expressive: Filled with distinct container
        filled:
          'bg-surface-container-highest border-2 border-transparent rounded-2xl focus-visible:border-primary focus-visible:bg-surface-container-high',
      },
      size: {
        default: 'px-4 py-3 text-base',
        sm: 'px-3 py-2 text-sm',
        lg: 'px-5 py-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'outlined',
      size: 'default',
    },
  }
);

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>, VariantProps<typeof textareaVariants> {
  ref?: Ref<HTMLTextAreaElement>;
  label?: string;
  helperText?: string;
  error?: string;
}

function Textarea({ className, variant, size, label, helperText, error, ref, id, ...props }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id || generatedId;
  const hasError = !!error;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className={cn('block text-sm font-semibold mb-2', hasError ? 'text-error' : 'text-on-surface')}>
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          textareaVariants({ variant, size }),
          hasError && 'border-error focus-visible:border-error focus-visible:ring-error/20',
          className
        )}
        ref={ref}
        {...props}
      />
      {(helperText || error) && <p className={cn('mt-2 text-sm', hasError ? 'text-error' : 'text-on-surface-variant')}>{error || helperText}</p>}
    </div>
  );
}

export { Textarea, textareaVariants };
