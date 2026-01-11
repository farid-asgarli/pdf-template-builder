import { type HTMLAttributes, type Ref } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/ui';

const badgeVariants = cva('inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-200', {
  variants: {
    variant: {
      // Clean badge styles
      default: 'bg-primary-container/60 text-on-primary-container',
      secondary: 'bg-secondary-container/60 text-on-secondary-container',
      tertiary: 'bg-tertiary-container/60 text-on-tertiary-container',
      error: 'bg-error-container/60 text-on-error-container',
      warning: 'bg-warning-container/60 text-on-warning-container',
      success: 'bg-success-container/60 text-on-success-container',
      outline: 'border border-outline-variant/50 text-on-surface-variant bg-surface-container-lowest',
      info: 'bg-info-container/60 text-on-info-container',
    },
    size: {
      default: 'h-6 min-w-6 px-2.5 text-xs rounded-full',
      sm: 'h-5 min-w-5 px-2 text-[10px] rounded-full',
      lg: 'h-7 min-w-7 px-3 text-sm rounded-full',
      dot: 'h-2.5 w-2.5 rounded-full p-0',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {
  ref?: Ref<HTMLSpanElement>;
}

function Badge({ className, variant, size, ref, children, ...props }: BadgeProps) {
  return (
    <span ref={ref} className={cn(badgeVariants({ variant, size, className }))} {...props}>
      {size !== 'dot' && children}
    </span>
  );
}

export { Badge, badgeVariants };
