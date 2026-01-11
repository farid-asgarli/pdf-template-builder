import { type ReactNode, type Ref, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/ui';

const fabVariants = cva(
  'inline-flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface active:scale-95',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-on-primary hover:bg-primary/90',
        secondary: 'bg-secondary-container text-on-secondary-container hover:bg-secondary-container/80',
        tertiary: 'bg-tertiary-container text-on-tertiary-container hover:bg-tertiary-container/80',
        surface: 'bg-surface-container-high text-primary hover:bg-surface-container-highest',
      },
      size: {
        small: 'h-11 w-11 rounded-xl',
        default: 'h-14 w-14 rounded-2xl',
        large: 'h-20 w-20 rounded-3xl',
        extended: 'h-14 px-5 rounded-full gap-2.5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  }
);

interface FABProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof fabVariants> {
  icon: ReactNode;
  label?: string;
  ref?: Ref<HTMLButtonElement>;
}

function FAB({ className, variant, size, icon, label, ref, ...props }: FABProps) {
  const isExtended = size === 'extended' || !!label;

  return (
    <button ref={ref} className={cn(fabVariants({ variant, size: isExtended ? 'extended' : size, className }))} {...props}>
      <span className={cn('flex items-center justify-center', size === 'large' ? 'h-8 w-8' : 'h-6 w-6')}>{icon}</span>
      {isExtended && label && <span className="font-medium text-sm">{label}</span>}
    </button>
  );
}

export { FAB, fabVariants };
export type { FABProps };
