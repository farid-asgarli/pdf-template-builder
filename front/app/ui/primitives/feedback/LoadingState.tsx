// LoadingState - Standardized loading state wrapper component
// Provides consistent loading patterns across the application

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/app/ui';

export interface LoadingStateProps {
  /** Whether the content is loading */
  isLoading: boolean;
  /** Optional skeleton to show during loading */
  skeleton?: React.ReactNode;
  /** The content to render when not loading */
  children: React.ReactNode;
  /** Fallback text when no skeleton is provided - pass pre-translated string */
  fallbackText?: string;
  /** Additional className for the fallback container */
  fallbackClassName?: string;
}

/**
 * LoadingState wrapper component for consistent loading behavior.
 *
 * Usage:
 * ```tsx
 * <LoadingState isLoading={isLoading} skeleton={<SkeletonCard />}>
 *   <ActualContent />
 * </LoadingState>
 * ```
 */
export function LoadingState({ isLoading, skeleton, children, fallbackText = 'Loading...', fallbackClassName }: LoadingStateProps) {
  if (isLoading) {
    if (skeleton) {
      return <>{skeleton}</>;
    }
    return (
      <div className={cn('flex items-center justify-center py-8', fallbackClassName)}>
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">{fallbackText}</span>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}

export interface PageLoadingProps {
  /** Optional message to display */
  message?: string;
  /** Minimum height for the loading container */
  minHeight?: string;
}

/**
 * Full page loading indicator for page-level loading states.
 *
 * Usage:
 * ```tsx
 * if (isLoading) return <PageLoading message="Loading surveys..." />;
 * ```
 */
export function PageLoading({ message = 'Loading...', minHeight = 'min-h-[400px]' }: PageLoadingProps) {
  return (
    <div className={cn('flex items-center justify-center', minHeight)}>
      <div className="flex flex-col items-center gap-3 text-on-surface-variant">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
}

export interface InlineLoadingProps {
  /** Optional message to display */
  message?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

const spinnerSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

/**
 * Inline loading indicator for buttons, inputs, or inline content.
 *
 * Usage:
 * ```tsx
 * <Button disabled>
 *   <InlineLoading message="Saving..." />
 * </Button>
 * ```
 */
export function InlineLoading({ message, size = 'md' }: InlineLoadingProps) {
  return (
    <span className="inline-flex items-center gap-2 text-on-surface-variant">
      <Loader2 className={cn('animate-spin', spinnerSizes[size])} />
      {message && <span className={textSizes[size]}>{message}</span>}
    </span>
  );
}
