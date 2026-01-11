import { type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { cn } from '@/app/ui';
import { ChevronRight } from 'lucide-react';

interface ListItemProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  /** Leading element (icon, avatar, etc.) */
  leading?: ReactNode;
  /** Main title text */
  title: string;
  /** Secondary/subtitle text */
  subtitle?: string;
  /** Trailing element (badge, arrow, action) */
  trailing?: ReactNode;
  /** Whether to show a chevron arrow */
  showArrow?: boolean;
  /** Click handler - makes item interactive */
  onPress?: () => void;
  /** Visual variant */
  variant?: 'default' | 'elevated' | 'filled';
  /** Disabled state */
  disabled?: boolean;
  /** Whether this item is part of a joined list (no individual rounding) */
  joined?: boolean;
}

/**
 * Modern list item component inspired by Material 3 and iOS design.
 * Features:
 * - Leading area for avatars/icons
 * - Title and subtitle with proper hierarchy
 * - Trailing area for badges, amounts, arrows
 * - Interactive states with subtle feedback
 */
export function ListItem({
  leading,
  title,
  subtitle,
  trailing,
  showArrow = false,
  onPress,
  variant = 'default',
  disabled = false,
  joined = false,
  className,
  ref,
  ...props
}: ListItemProps) {
  const isInteractive = !!onPress && !disabled;

  const variantStyles = {
    default: 'bg-transparent',
    elevated: 'bg-surface-container-lowest',
    filled: joined ? 'bg-transparent' : 'bg-surface-container',
  };

  return (
    <div
      ref={ref}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={isInteractive ? onPress : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onPress?.();
              }
            }
          : undefined
      }
      className={cn(
        'flex items-center gap-4 px-4 py-3',
        !joined && 'rounded-2xl',
        'transition-colors duration-200',
        variantStyles[variant],
        isInteractive && ['cursor-pointer', 'hover:bg-surface-container-high', 'focus-visible:outline-none focus-visible:bg-surface-container-high'],
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      {...props}
    >
      {/* Leading */}
      {leading && <div className="shrink-0">{leading}</div>}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-on-surface truncate">{title}</p>
        {subtitle && <p className="text-sm text-on-surface-variant truncate mt-0.5">{subtitle}</p>}
      </div>

      {/* Trailing */}
      {trailing && <div className="shrink-0">{trailing}</div>}

      {/* Arrow */}
      {showArrow && <ChevronRight className="h-5 w-5 text-on-surface-variant/50 shrink-0" />}
    </div>
  );
}

/**
 * Icon container for list items with consistent styling.
 */
interface ListItemIconProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'default' | 'lg';
}

export function ListItemIcon({ children, variant = 'default', size = 'default', className, ...props }: ListItemIconProps) {
  const variantStyles = {
    default: 'bg-surface-container text-on-surface-variant',
    primary: 'bg-primary-container/60 text-on-primary-container',
    secondary: 'bg-secondary-container/60 text-on-secondary-container',
    success: 'bg-success-container/60 text-on-success-container',
    warning: 'bg-warning-container/60 text-on-warning-container',
    error: 'bg-error-container/60 text-on-error-container',
  };

  const sizeStyles = {
    sm: 'h-9 w-9 rounded-full',
    default: 'h-11 w-11 rounded-full',
    lg: 'h-14 w-14 rounded-full',
  };

  return (
    <div className={cn('flex items-center justify-center', variantStyles[variant], sizeStyles[size], className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Divider for separating list items.
 */
interface ListDividerProps extends HTMLAttributes<HTMLDivElement> {
  /** Whether to inset from the leading edge (for items with leading content) */
  inset?: boolean;
}

export function ListDivider({ inset = false, className, ...props }: ListDividerProps) {
  return <div className={cn('h-px bg-outline-variant/20', inset && 'ml-[72px]', className)} {...props} />;
}

/**
 * Section header for grouping list items.
 */
interface ListSectionHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
}

export function ListSectionHeader({ title, className, ...props }: ListSectionHeaderProps) {
  return (
    <div className={cn('px-4 py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider', className)} {...props}>
      {title}
    </div>
  );
}
