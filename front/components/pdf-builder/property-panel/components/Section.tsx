'use client';

import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SectionProps {
  /** Section title displayed in the header */
  title: string;
  /** Optional icon displayed before the title */
  icon?: ReactNode;
  /** Section content */
  children: ReactNode;
  /** Whether the section is expanded by default */
  defaultOpen?: boolean;
  /**
   * Visual variant of the section
   * - 'card': Wrapped in a rounded card container (default)
   * - 'bordered': Simple bordered style with bottom divider
   * - 'flat': No container styling, just collapsible header
   */
  variant?: 'card' | 'bordered' | 'flat';
  /** Additional className for the root element */
  className?: string;
}

/**
 * Collapsible section component for grouping property editor fields.
 * Provides consistent styling and animation across the property panel.
 */
export function Section({ title, icon, children, defaultOpen = true, variant = 'card', className }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // Variant-specific styles
  const rootStyles = {
    card: 'mx-4 mb-3',
    bordered: 'border-b border-outline/10',
    flat: 'mb-2',
  };

  const buttonStyles = {
    card: 'flex w-full items-center gap-2.5 rounded-2xl px-3.5 py-2.5 transition-all duration-200 hover:bg-surface-container-high/60',
    bordered: 'flex w-full items-center gap-2.5 px-4 py-3 hover:bg-surface-container-high/40 transition-colors',
    flat: 'flex w-full items-center gap-2.5 px-2 py-2 transition-colors hover:bg-surface-container-high/30 rounded-lg',
  };

  const iconContainerStyles = {
    card: 'flex h-7 w-7 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant',
    bordered: 'text-on-surface-variant/70',
    flat: 'text-on-surface-variant',
  };

  const contentContainerStyles = {
    card: 'rounded-2xl bg-surface-container/50 p-3.5',
    bordered: 'px-4 pb-5 pt-1',
    flat: 'px-2 pb-2',
  };

  const contentWrapperStyles = {
    card: `grid transition-all duration-200 ${isOpen ? 'mt-2 grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`,
    bordered: `grid transition-all duration-200 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`,
    flat: `grid transition-all duration-200 ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`,
  };

  const chevronRotation = isOpen ? 'rotate-0' : '-rotate-90';

  return (
    <div className={`${rootStyles[variant]} ${className || ''}`}>
      <button type="button" className={buttonStyles[variant]} onClick={() => setIsOpen(!isOpen)} aria-expanded={isOpen}>
        {icon && <span className={iconContainerStyles[variant]}>{icon}</span>}
        <h3 className="flex-1 text-left text-xs font-semibold uppercase tracking-wider text-on-surface-variant">{title}</h3>
        <ChevronDown className={`h-4 w-4 text-on-surface-variant/50 transition-transform duration-200 ${chevronRotation}`} />
      </button>
      <div className={contentWrapperStyles[variant]}>
        <div className="overflow-hidden">
          <div className={contentContainerStyles[variant]}>{children}</div>
        </div>
      </div>
    </div>
  );
}
