// IconContainer - M3 Expressive emphasis-based icon container sizing
// Size communicates importance following Material 3 Expressive hierarchy principles

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/ui';

/**
 * M3 Expressive Emphasis Levels:
 * - inline: 32px - Inline with text, minimal emphasis
 * - standard: 36px - Cards, list items (default)
 * - emphasized: 48px - Stats, section headers, key metrics
 * - hero: 56px - Page heroes, key actions
 * - maximum: 64px - Empty states, error pages, focal points
 * - dramatic: 80px - Full-page states, animations
 */
const iconContainerVariants = cva('flex items-center justify-center shrink-0 transition-all duration-200', {
  variants: {
    emphasis: {
      inline: 'h-8 w-8', // 32px - Inline with text
      standard: 'h-9 w-9', // 36px - Cards, list items
      emphasized: 'h-12 w-12', // 48px - Stats, section headers
      hero: 'h-14 w-14', // 56px - Page heroes
      maximum: 'h-16 w-16', // 64px - Empty states
      dramatic: 'h-20 w-20', // 80px - Full-page states
    },
    shape: {
      circle: 'rounded-full',
      rounded: 'rounded-2xl',
      square: 'rounded-lg',
    },
    variant: {
      default: 'bg-surface-container-high text-on-surface-variant',
      primary: 'bg-primary-container text-on-primary-container',
      secondary: 'bg-secondary-container text-on-secondary-container',
      tertiary: 'bg-tertiary-container text-on-tertiary-container',
      success: 'bg-success-container text-on-success-container',
      warning: 'bg-warning-container text-on-warning-container',
      error: 'bg-error-container text-on-error-container',
      info: 'bg-info-container text-on-info-container',
      muted: 'bg-surface-container text-on-surface-variant/70',
      ghost: 'bg-transparent text-on-surface-variant',
    },
  },
  defaultVariants: {
    emphasis: 'standard',
    shape: 'circle',
    variant: 'default',
  },
});

// Icon size mapping based on container emphasis
const iconSizeMap = {
  inline: 'h-4 w-4',
  standard: 'h-4 w-4',
  emphasized: 'h-5 w-5',
  hero: 'h-6 w-6',
  maximum: 'h-7 w-7',
  dramatic: 'h-8 w-8',
};

export interface IconContainerProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof iconContainerVariants> {
  /** The icon to render inside the container */
  icon?: React.ReactNode;
  /** Whether to auto-size the icon based on emphasis level */
  autoSizeIcon?: boolean;
}

/**
 * IconContainer component for M3 Expressive emphasis-based sizing.
 *
 * Usage examples:
 * ```tsx
 * // Standard - for cards and list items
 * <IconContainer icon={<FileText />} />
 *
 * // Emphasized - for stats and section headers
 * <IconContainer emphasis="emphasized" variant="primary" icon={<Users />} />
 *
 * // Hero - for page headers
 * <IconContainer emphasis="hero" variant="success" icon={<CheckCircle />} />
 *
 * // Maximum - for empty states
 * <IconContainer emphasis="maximum" variant="muted" icon={<Inbox />} />
 * ```
 */
const IconContainer = React.forwardRef<HTMLDivElement, IconContainerProps>(
  ({ className, emphasis, shape, variant, icon, autoSizeIcon = true, children, ...props }, ref) => {
    const iconElement = icon || children;

    // Auto-size icon if enabled and icon is a React element
    const sizedIcon = React.useMemo(() => {
      if (!autoSizeIcon || !React.isValidElement(iconElement)) {
        return iconElement;
      }

      const sizeClass = iconSizeMap[emphasis || 'standard'];
      return React.cloneElement(iconElement as React.ReactElement<{ className?: string }>, {
        className: cn(sizeClass, (iconElement as React.ReactElement<{ className?: string }>).props.className),
      });
    }, [iconElement, emphasis, autoSizeIcon]);

    return (
      <div ref={ref} className={cn(iconContainerVariants({ emphasis, shape, variant }), className)} {...props}>
        {sizedIcon}
      </div>
    );
  }
);
IconContainer.displayName = 'IconContainer';

export { IconContainer, iconContainerVariants };
