import { type ReactNode, type HTMLAttributes, type Ref } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/app/ui';
import { Button, type ButtonProps } from '../buttons/Button';
import { Inbox, type LucideIcon } from 'lucide-react';

const emptyStateVariants = cva('flex flex-col items-center justify-center text-center', {
  variants: {
    size: {
      sm: 'py-8 px-4 gap-3',
      default: 'py-12 px-6 gap-4',
      lg: 'py-16 px-8 gap-5',
      full: 'min-h-[400px] py-16 px-8 gap-5',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

const iconContainerVariants = cva('flex items-center justify-center border', {
  variants: {
    size: {
      sm: 'h-12 w-12 rounded-xl',
      default: 'h-16 w-16 rounded-2xl',
      lg: 'h-16 w-16 rounded-3xl',
      full: 'h-16 w-16 rounded-3xl',
    },
    variant: {
      default: 'bg-surface-container-high border-outline-variant/50',
      primary: 'bg-primary-container border-primary/20',
      secondary: 'bg-secondary-container border-secondary/20',
      muted: 'bg-surface-container border-outline-variant/30',
    },
  },
  defaultVariants: {
    size: 'default',
    variant: 'default',
  },
});

const iconVariants = cva('', {
  variants: {
    size: {
      sm: 'h-5 w-5',
      default: 'h-8 w-8',
      lg: 'h-10 w-10',
      full: 'h-12 w-12',
    },
    variant: {
      default: 'text-on-surface-variant',
      primary: 'text-primary',
      secondary: 'text-secondary',
      muted: 'text-on-surface-variant/70',
    },
  },
  defaultVariants: {
    size: 'default',
    variant: 'default',
  },
});

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: ButtonProps['variant'];
  icon?: ReactNode;
}

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof emptyStateVariants> {
  ref?: Ref<HTMLDivElement>;
  /** Custom icon element (LucideIcon component or ReactNode) */
  icon?: ReactNode | LucideIcon;
  /** Title text - pass pre-translated string */
  title: string;
  /** Description text - pass pre-translated string */
  description?: string;
  /** Icon container variant */
  iconVariant?: 'default' | 'primary' | 'secondary' | 'muted';
  /** Primary action button */
  action?: EmptyStateAction;
  /** Secondary action button */
  secondaryAction?: EmptyStateAction;
  /** Additional content below actions */
  children?: ReactNode;
}

function EmptyState({
  className,
  size,
  icon,
  iconVariant = 'default',
  title,
  description,
  action,
  secondaryAction,
  children,
  ref,
  ...props
}: EmptyStateProps) {
  // Resolve icon - check if it's a LucideIcon component or ReactNode
  const isLucideIcon = typeof icon === 'function';

  // Build the icon element to render
  let iconElement: ReactNode;
  if (isLucideIcon) {
    const IconComponent = icon as LucideIcon;
    iconElement = <IconComponent className={cn(iconVariants({ size, variant: iconVariant }))} />;
  } else if (icon) {
    iconElement = icon;
  } else {
    iconElement = <Inbox className={cn(iconVariants({ size, variant: iconVariant }))} />;
  }

  return (
    <div ref={ref} className={cn(emptyStateVariants({ size }), className)} {...props}>
      {/* Icon */}
      <div className={cn(iconContainerVariants({ size, variant: iconVariant }))}>{iconElement}</div>

      {/* Text */}
      <div className="space-y-1.5 max-w-md">
        <h3
          className={cn('font-semibold text-on-surface', {
            'text-base': size === 'sm',
            'text-lg': size === 'default',
            'text-xl': size === 'lg' || size === 'full',
          })}
        >
          {title}
        </h3>
        {description && (
          <p
            className={cn('text-on-surface-variant', {
              'text-sm': size === 'sm' || size === 'default',
              'text-base': size === 'lg' || size === 'full',
            })}
          >
            {description}
          </p>
        )}
      </div>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-2">
          {secondaryAction && (
            <Button variant={secondaryAction.variant || 'outline'} size={size === 'sm' ? 'sm' : 'default'} onClick={secondaryAction.onClick}>
              {secondaryAction.icon}
              {secondaryAction.label}
            </Button>
          )}
          {action && (
            <Button variant={action.variant || 'filled'} size={size === 'sm' ? 'sm' : 'default'} onClick={action.onClick}>
              {action.icon}
              {action.label}
            </Button>
          )}
        </div>
      )}

      {/* Additional content */}
      {children}
    </div>
  );
}

export { EmptyState };
