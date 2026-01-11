// Stat - Inline stat display component for consistent metric presentation
// Follows M3 Expressive design patterns for data visualization

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/ui';
import type { LucideIcon } from 'lucide-react';

const statVariants = cva('inline-flex items-center text-on-surface-variant', {
  variants: {
    size: {
      xs: 'gap-0.5 text-xs',
      sm: 'gap-1 text-xs',
      md: 'gap-1.5 text-sm',
      lg: 'gap-2 text-base',
    },
  },
  defaultVariants: {
    size: 'sm',
  },
});

const iconSizeMap = {
  xs: 'h-3 w-3',
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export interface StatProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statVariants> {
  /** Lucide icon component to display */
  icon: LucideIcon;
  /** The value to display */
  value: string | number;
  /** Optional label for accessibility (sr-only) */
  label?: string;
  /** Optional suffix after the value */
  suffix?: string;
}

/**
 * Stat component for displaying inline metrics with icons.
 *
 * Usage:
 * ```tsx
 * <Stat icon={Users} value={42} label="responses" />
 * <Stat icon={FileText} value="10" suffix="questions" size="md" />
 * ```
 */
const Stat = React.forwardRef<HTMLSpanElement, StatProps>(({ className, size, icon: Icon, value, label, suffix, ...props }, ref) => {
  const iconSize = iconSizeMap[size || 'sm'];

  return (
    <span ref={ref} className={cn(statVariants({ size }), className)} {...props}>
      <Icon className={iconSize} />
      <span>{value}</span>
      {suffix && <span>{suffix}</span>}
      {label && <span className="sr-only">{label}</span>}
    </span>
  );
});
Stat.displayName = 'Stat';

export { Stat, statVariants };
