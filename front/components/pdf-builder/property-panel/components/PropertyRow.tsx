'use client';

import type { ReactNode } from 'react';

export interface PropertyRowProps {
  /** The label text displayed on the left side */
  label: string;
  /** Optional hint text displayed below the row */
  hint?: string;
  /** The control/input to display on the right side */
  children: ReactNode;
  /** Optional className for additional styling */
  className?: string;
  /** Width of the control container. Defaults to 'auto' */
  controlWidth?: 'sm' | 'md' | 'lg' | 'auto' | 'full';
}

const CONTROL_WIDTH_CLASSES = {
  sm: 'w-20',
  md: 'w-24',
  lg: 'w-32',
  auto: '',
  full: 'flex-1',
} as const;

/**
 * A consistent row layout for property editors.
 * Displays a label on the left and a control on the right with optional hint text.
 */
export function PropertyRow({ label, hint, children, className, controlWidth = 'auto' }: PropertyRowProps) {
  const widthClass = CONTROL_WIDTH_CLASSES[controlWidth];

  return (
    <div className={`py-1.5 ${className || ''}`}>
      <div className="flex items-center justify-between gap-4">
        <span className="shrink-0 text-sm text-on-surface/90">{label}</span>
        <div className={`shrink-0 ${widthClass}`}>{children}</div>
      </div>
      {hint && <p className="mt-1 text-xs text-on-surface-variant/60">{hint}</p>}
    </div>
  );
}
