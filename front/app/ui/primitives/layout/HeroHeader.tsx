import { type ReactNode, type HTMLAttributes, type Ref } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/app/ui';
import { IconButton } from '../buttons';
import { OverlayHeaderLabels, DEFAULT_OVERLAY_HEADER_LABELS } from '../types';
/**
 * Color variants for the hero/overlay header background
 */
type OverlayHeaderVariant = 'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info';

const variantClasses: Record<OverlayHeaderVariant, { bg: string; iconText: string }> = {
  primary: { bg: 'bg-primary-container/30', iconText: 'text-primary' },
  secondary: { bg: 'bg-secondary-container/30', iconText: 'text-secondary' },
  tertiary: { bg: 'bg-tertiary-container/30', iconText: 'text-tertiary' },
  success: { bg: 'bg-success-container/30', iconText: 'text-success' },
  warning: { bg: 'bg-warning-container/30', iconText: 'text-warning' },
  error: { bg: 'bg-error-container/30', iconText: 'text-error' },
  info: { bg: 'bg-info-container/30', iconText: 'text-info' },
};

interface OverlayHeaderProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  /** The icon to display (required for hero mode) */
  icon?: ReactNode;
  /** The main title */
  title: string;
  /** Optional description text or element */
  description?: ReactNode;
  /** Color variant for hero mode */
  variant?: OverlayHeaderVariant;
  /** Whether to show the close button */
  showClose?: boolean;
  /** Callback when close button is clicked */
  onClose?: () => void;
  /** Optional additional content to render below title (e.g., stats pills) */
  children?: ReactNode;
  /** Labels for i18n - pass pre-translated strings */
  labels?: OverlayHeaderLabels;
}

/**
 * OverlayHeader - A unified header component for Drawers and Dialogs.
 *
 * Renders a hero-style header with colored background, icon, title, description,
 * and optional close button. Used internally by DialogHeader and DrawerHeader
 * when `hero` prop is enabled.
 *
 * @example
 * ```tsx
 * <OverlayHeader
 *   icon={<FileText className="h-7 w-7" />}
 *   title="Response Details"
 *   description="Survey Response"
 *   variant="primary"
 *   showClose
 *   onClose={() => setOpen(false)}
 * >
 *   <div className="flex items-center gap-3 mt-4">
 *     <OverlayHeader.StatsPill icon={<Clock />} value="5m" />
 *   </div>
 * </OverlayHeader>
 * ```
 */
function OverlayHeader({
  icon,
  title,
  description,
  variant = 'primary',
  showClose = false,
  onClose,
  children,
  className,
  ref,
  labels = {},
  ...props
}: OverlayHeaderProps) {
  const mergedLabels = { ...DEFAULT_OVERLAY_HEADER_LABELS, ...labels };
  const { bg, iconText } = variantClasses[variant];

  return (
    <div ref={ref} className={cn(bg, 'px-5 pt-5 pb-5', className)} {...props}>
      <div className="flex items-start gap-4">
        {icon && <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-surface', iconText)}>{icon}</div>}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-on-surface mb-1">{title}</h2>
          {description && <p className="text-sm text-on-surface-variant line-clamp-2">{description}</p>}
        </div>
        {showClose && onClose && (
          <IconButton variant="standard" size="sm" onClick={onClose} aria-label={mergedLabels.close} className="-mr-2 -mt-1">
            <X className="h-5 w-5" />
          </IconButton>
        )}
      </div>
      {children}
    </div>
  );
}

interface OverlayHeaderStatsPillProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  /** Icon to display */
  icon: ReactNode;
  /** Value to display (number or string) */
  value: ReactNode;
  /** Label text */
  label?: string;
}

/**
 * StatsPill - A compact pill for displaying stats in the overlay header.
 */
function OverlayHeaderStatsPill({ icon, value, label, className, ref, ...props }: OverlayHeaderStatsPillProps) {
  return (
    <div ref={ref} className={cn('flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface/80', className)} {...props}>
      <span className="text-primary [&>svg]:h-4 [&>svg]:w-4">{icon}</span>
      <span className="text-sm font-medium text-on-surface">{value}</span>
      {label && <span className="text-sm text-on-surface-variant">{label}</span>}
    </div>
  );
}

interface OverlayHeaderBadgeProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  /** Icon to display */
  icon: ReactNode;
  /** Badge text */
  text: string;
  /** Badge variant */
  variant?: 'success' | 'warning' | 'error' | 'info';
}

const badgeVariantClasses: Record<string, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
};

/**
 * Badge - A compact status badge for the overlay header.
 */
function OverlayHeaderBadge({ icon, text, variant = 'success', className, ref, ...props }: OverlayHeaderBadgeProps) {
  return (
    <div
      ref={ref}
      className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', badgeVariantClasses[variant], className)}
      {...props}
    >
      <span className="[&>svg]:h-3.5 [&>svg]:w-3.5">{icon}</span>
      {text}
    </div>
  );
}

// Attach sub-components
OverlayHeader.StatsPill = OverlayHeaderStatsPill;
OverlayHeader.Badge = OverlayHeaderBadge;

export { OverlayHeader };
export type { OverlayHeaderProps, OverlayHeaderVariant };
