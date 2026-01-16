import { type ButtonHTMLAttributes, type Ref, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/ui';

const iconButtonVariants = cva(
  'inline-flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        // Standard - minimal, shows on hover
        standard:
          'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface focus-visible:ring-primary/30 rounded-full',
        // Filled - solid background
        filled: 'bg-primary text-on-primary hover:bg-primary/90 focus-visible:ring-primary/40 rounded-full',
        // Filled tonal - soft container
        'filled-tonal':
          'bg-primary-container/70 text-on-primary-container hover:bg-primary-container focus-visible:ring-primary/30 rounded-full',
        // Outlined - clean border
        outlined:
          'border-2 border-outline-variant/50 text-on-surface-variant hover:border-outline-variant hover:text-on-surface focus-visible:ring-primary/30 rounded-full',
        // Ghost - completely transparent until hover
        ghost:
          'text-on-surface-variant/70 hover:text-on-surface hover:bg-surface-container-high/50 focus-visible:ring-primary/30 rounded-full',
      },
      size: {
        default: 'h-10 w-10',
        sm: 'h-8 w-8',
        lg: 'h-12 w-12',
        xl: 'h-14 w-14',
      },
    },
    defaultVariants: {
      variant: 'standard',
      size: 'default',
    },
  }
);

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof iconButtonVariants> {
  ref?: Ref<HTMLButtonElement>;
  icon?: ReactNode;
  'aria-label': string;
}

function IconButton({ className, variant, size, ref, icon, children, ...props }: IconButtonProps) {
  return (
    <button ref={ref} className={cn(iconButtonVariants({ variant, size, className }))} {...props}>
      {icon || children}
    </button>
  );
}

export { IconButton, iconButtonVariants };
