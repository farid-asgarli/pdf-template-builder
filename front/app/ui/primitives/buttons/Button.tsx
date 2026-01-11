import { type ButtonHTMLAttributes, type Ref } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/ui';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2.5 whitespace-nowrap font-semibold ring-offset-surface transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        // Filled - solid primary background
        filled: 'bg-primary text-on-primary border-2 border-primary hover:bg-primary/90 hover:border-primary/90 focus-visible:ring-primary/40',
        // Tonal - soft container with primary text
        tonal:
          'bg-primary-container/70 text-on-primary-container border-2 border-primary/15 hover:bg-primary-container hover:border-primary/30 focus-visible:ring-primary/30',
        // Outline - bordered with transparent bg
        outline:
          'border-2 border-outline-variant bg-transparent text-on-surface hover:bg-surface-container hover:border-outline focus-visible:ring-primary/30',
        // Text - minimal, just text
        text: 'text-primary border-2 border-transparent hover:bg-primary/8 focus-visible:ring-primary/30',
        // Elevated - raised appearance
        elevated: 'bg-surface-container-lowest text-primary border-2 border-outline-variant/50 hover:border-primary/40 focus-visible:ring-primary/30',
        // Destructive variants
        destructive: 'bg-error text-on-error border-2 border-error hover:bg-error/90 hover:border-error/90 focus-visible:ring-error/40',
        'destructive-outline': 'border-2 border-error/60 text-error bg-transparent hover:bg-error/8 hover:border-error focus-visible:ring-error/30',
        'destructive-tonal':
          'bg-error-container/70 text-on-error-container border-2 border-error/15 hover:bg-error-container hover:border-error/30 focus-visible:ring-error/30',
      },
      size: {
        default: 'h-11 px-6 py-2.5 text-sm rounded-full',
        sm: 'h-9 px-4 py-2 text-xs rounded-full',
        lg: 'h-12 px-8 py-3 text-base rounded-full',
        xl: 'h-14 px-10 py-3.5 text-lg rounded-full',
        icon: 'h-11 w-11 rounded-full',
        'icon-sm': 'h-9 w-9 rounded-full',
        'icon-lg': 'h-12 w-12 rounded-full',
      },
    },
    defaultVariants: {
      variant: 'filled',
      size: 'default',
    },
  }
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  ref?: Ref<HTMLButtonElement>;
  loading?: boolean;
}

function Button({ className, variant, size, asChild = false, loading = false, ref, children, disabled, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} disabled={disabled || loading} {...props}>
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
