import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/app/ui';

export type SelectionCardSize = 'sm' | 'md' | 'lg';
export type SelectionCardShape = 'rounded' | 'rounded-xl' | 'rounded-2xl' | 'rounded-3xl';

interface SelectionCardProps {
  /** Whether this card is currently selected */
  isSelected: boolean;
  /** Click handler */
  onClick: () => void;
  /** Whether the card is disabled */
  disabled?: boolean;
  /** Size variant affecting padding and checkmark size */
  size?: SelectionCardSize;
  /** Border radius variant */
  shape?: SelectionCardShape;
  /** Card content */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
  /** Layout direction for flex children */
  layout?: 'vertical' | 'horizontal' | 'horizontal-center';
  /** Gap between children */
  gap?: 1 | 2 | 3 | 4;
  /** Show ring effect when selected */
  showRing?: boolean;
}

const sizeStyles: Record<SelectionCardSize, { padding: string; checkSize: string; checkIconSize: string; checkPosition: string }> = {
  sm: {
    padding: 'p-3',
    checkSize: 'h-4 w-4',
    checkIconSize: 'h-2.5 w-2.5',
    checkPosition: 'top-1.5 right-1.5',
  },
  md: {
    padding: 'p-4',
    checkSize: 'h-5 w-5',
    checkIconSize: 'h-3 w-3',
    checkPosition: 'top-2 right-2',
  },
  lg: {
    padding: 'p-6',
    checkSize: 'h-6 w-6',
    checkIconSize: 'h-4 w-4',
    checkPosition: 'top-3 right-3',
  },
};

const layoutStyles: Record<NonNullable<SelectionCardProps['layout']>, string> = {
  vertical: 'flex-col items-center',
  horizontal: 'flex-row items-center',
  'horizontal-center': 'flex-row items-center justify-center',
};

const gapStyles: Record<NonNullable<SelectionCardProps['gap']>, string> = {
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
};

/**
 * A reusable selection card component for single/multi-select UI patterns.
 * Used in settings sections, distribution dialogs, and other selection interfaces.
 */
export function SelectionCard({
  isSelected,
  onClick,
  disabled = false,
  size = 'md',
  shape = 'rounded-xl',
  children,
  className,
  layout = 'vertical',
  gap = 2,
  showRing = false,
}: SelectionCardProps) {
  const sizeStyle = sizeStyles[size];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'relative flex border-2 transition-all duration-200',
        sizeStyle.padding,
        shape,
        layoutStyles[layout],
        gapStyles[gap],
        isSelected
          ? cn('bg-primary-container/40 border-primary/40', showRing && 'ring-1 ring-primary/20')
          : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {isSelected && (
        <div className={cn('absolute', sizeStyle.checkPosition)}>
          <div className={cn('flex items-center justify-center rounded-full bg-primary', sizeStyle.checkSize)}>
            <Check className={cn('text-on-primary', sizeStyle.checkIconSize)} />
          </div>
        </div>
      )}
      {children}
    </button>
  );
}

/**
 * Container for selection card label/title
 */
interface SelectionCardLabelProps {
  children: React.ReactNode;
  isSelected?: boolean;
  className?: string;
  /** Use monospace font */
  mono?: boolean;
}

export function SelectionCardLabel({ children, isSelected = false, className, mono = false }: SelectionCardLabelProps) {
  return <span className={cn('font-medium', isSelected ? 'text-primary' : 'text-on-surface', mono && 'font-mono', className)}>{children}</span>;
}

/**
 * Container for selection card secondary text/description
 */
interface SelectionCardDescriptionProps {
  children: React.ReactNode;
  className?: string;
  /** Use monospace font */
  mono?: boolean;
}

export function SelectionCardDescription({ children, className, mono = false }: SelectionCardDescriptionProps) {
  return <span className={cn('text-xs text-on-surface-variant', mono && 'font-mono', className)}>{children}</span>;
}

/**
 * Icon container for selection cards - provides consistent styling
 */
interface SelectionCardIconProps {
  children: React.ReactNode;
  isSelected?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const iconSizeStyles = {
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-12 h-12 rounded-xl',
};

export function SelectionCardIcon({ children, isSelected = false, size = 'md', className }: SelectionCardIconProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center transition-colors',
        iconSizeStyles[size],
        isSelected ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-on-surface-variant',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * A group wrapper for selection cards with consistent grid layouts
 */
interface SelectionCardGroupProps {
  children: React.ReactNode;
  /** Number of columns at different breakpoints */
  columns?: {
    default?: 1 | 2 | 3 | 4 | 6;
    sm?: 1 | 2 | 3 | 4 | 6;
    md?: 1 | 2 | 3 | 4 | 6;
    lg?: 1 | 2 | 3 | 4 | 6;
  };
  /** Gap between cards */
  gap?: 2 | 3 | 4;
  className?: string;
}

const columnStyles = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  6: 'grid-cols-6',
};

export function SelectionCardGroup({ children, columns = { default: 2, sm: 3 }, gap = 3, className }: SelectionCardGroupProps) {
  const gapClass = gap === 2 ? 'gap-2' : gap === 3 ? 'gap-3' : 'gap-4';

  return (
    <div
      className={cn(
        'grid',
        gapClass,
        columns.default && columnStyles[columns.default],
        columns.sm && `sm:${columnStyles[columns.sm]}`,
        columns.md && `md:${columnStyles[columns.md]}`,
        columns.lg && `lg:${columnStyles[columns.lg]}`,
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * A labeled field container for selection card groups - adds proper spacing between label and cards
 */
interface SelectionFieldProps {
  /** Field label */
  label: string;
  /** Field description (optional) */
  description?: string;
  children: React.ReactNode;
  /** Add top border for visual separation */
  withBorder?: boolean;
  className?: string;
}

export function SelectionField({ label, description, children, withBorder = false, className }: SelectionFieldProps) {
  return (
    <div className={cn('space-y-4', withBorder && 'pt-5 border-t border-outline-variant/20', className)}>
      <div className="space-y-1">
        <label className="text-sm font-medium text-on-surface">{label}</label>
        {description && <p className="text-xs text-on-surface-variant">{description}</p>}
      </div>
      {children}
    </div>
  );
}
