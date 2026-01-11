'use client';

import { HelpCircle, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { Component, PlaceholderProperties } from '@/lib/types/document.types';
import { cn } from '@/app/ui';

interface PlaceholderComponentProps {
  component: Component;
}

type PlaceholderVariant = 'default' | 'error' | 'warning' | 'info';

/**
 * Maps placeholder variant to styling configuration.
 */
function getVariantStyles(variant: PlaceholderVariant) {
  switch (variant) {
    case 'error':
      return {
        border: 'border-error/50',
        background: 'bg-error-container/30',
        textColor: 'text-on-error-container',
        Icon: AlertCircle,
        iconColor: 'text-error',
      };
    case 'warning':
      return {
        border: 'border-warning/50',
        background: 'bg-warning-container/30',
        textColor: 'text-on-warning-container',
        Icon: AlertTriangle,
        iconColor: 'text-warning',
      };
    case 'info':
      return {
        border: 'border-info/50',
        background: 'bg-info-container/30',
        textColor: 'text-on-info-container',
        Icon: Info,
        iconColor: 'text-info',
      };
    default:
      return {
        border: 'border-outline-variant',
        background: 'bg-surface-container-lowest',
        textColor: 'text-on-surface-variant/70',
        Icon: HelpCircle,
        iconColor: 'text-on-surface-variant/50',
      };
  }
}

/**
 * PlaceholderComponent renders a visual placeholder for:
 * - Unknown component types
 * - Missing content states
 * - Development/prototyping visualization
 *
 * Mirrors the QuestPDF Placeholder element behavior in the frontend.
 */
export function PlaceholderComponent({ component }: PlaceholderComponentProps) {
  const props = component.properties as PlaceholderProperties;

  const label = props?.label || 'Unknown';
  const variant = (props?.variant || 'default') as PlaceholderVariant;
  const showIcon = props?.showIcon !== false; // Default to true

  const styles = getVariantStyles(variant);
  const { Icon, border, background, textColor, iconColor } = styles;

  return (
    <div
      className={cn('pointer-events-none flex h-full w-full flex-col items-center justify-center rounded border border-dashed', border, background)}
    >
      {showIcon && <Icon className={cn('mb-1 h-5 w-5', iconColor)} />}
      <span className={cn('text-center text-[10px] leading-tight px-1', textColor)}>{label}</span>
    </div>
  );
}

/**
 * UnknownComponentPlaceholder is used when no renderer exists for a component type.
 * This is a specialized version that displays the unknown type name.
 */
export function UnknownComponentPlaceholder({ typeName }: { typeName: string }) {
  return (
    <div className="pointer-events-none flex h-full w-full flex-col items-center justify-center rounded border border-dashed border-outline-variant bg-surface-container-lowest">
      <HelpCircle className="mb-1 h-5 w-5 text-on-surface-variant/50" />
      <span className="text-center text-[10px] leading-tight px-1 text-on-surface-variant/70">Unknown: {typeName}</span>
    </div>
  );
}
