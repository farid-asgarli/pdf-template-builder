import { type HTMLAttributes, type Ref } from 'react';
import { cn } from '@/app/ui';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

function Skeleton({ className, ref, ...props }: SkeletonProps) {
  return (
    <div ref={ref} className={cn('animate-pulse rounded-2xl bg-surface-container-highest border border-outline-variant/30', className)} {...props} />
  );
}

// Text skeleton - simulates lines of text
interface SkeletonTextProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
  lines?: number;
}

function SkeletonText({ className, lines = 3, ref, ...props }: SkeletonTextProps) {
  return (
    <div ref={ref} className={cn('space-y-2', className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 && 'w-3/4' // Last line is shorter
          )}
        />
      ))}
    </div>
  );
}

// Avatar skeleton
function SkeletonAvatar({ className, ref, size = 'default', ...props }: SkeletonProps & { size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    default: 'h-10 w-10',
    lg: 'h-14 w-14',
  };
  return <Skeleton ref={ref} className={cn(sizeClasses[size], 'rounded-full', className)} {...props} />;
}

// Card skeleton
function SkeletonCard({ className, ref, ...props }: SkeletonProps) {
  return (
    <div
      ref={ref}
      className={cn('rounded-3xl bg-[var(--color-card-idle)] border border-[var(--color-card-border)] p-6 space-y-4', className)}
      {...props}
    >
      <div className="flex items-center gap-4">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <SkeletonText lines={2} />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

// Table row skeleton
function SkeletonTableRow({ className, ref, columns = 4, ...props }: SkeletonProps & { columns?: number }) {
  return (
    <div ref={ref} className={cn('flex items-center gap-4 py-3', className)} {...props}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" style={{ maxWidth: `${100 / columns}%` }} />
      ))}
    </div>
  );
}

// Survey card skeleton
function SkeletonSurveyCard({ className, ref, ...props }: SkeletonProps) {
  return (
    <div
      ref={ref}
      className={cn('rounded-3xl bg-[var(--color-card-idle)] border border-[var(--color-card-border)] p-5 space-y-4', className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex items-center justify-between pt-2">
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </div>
  );
}

// List item skeleton
function SkeletonListItem({ className, ref, ...props }: SkeletonProps) {
  return (
    <div ref={ref} className={cn('flex items-center gap-4 p-4', className)} {...props}>
      <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20 rounded-full shrink-0" />
    </div>
  );
}

// Stats card skeleton
function SkeletonStatsCard({ className, ref, ...props }: SkeletonProps) {
  return (
    <div ref={ref} className={cn('rounded-3xl bg-[var(--color-card-idle)] border border-[var(--color-card-border)] p-5', className)} {...props}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-10 w-10 rounded-xl" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-8 w-16 mb-1" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

// Page header skeleton
function SkeletonPageHeader({ className, ref, ...props }: SkeletonProps) {
  return (
    <div ref={ref} className={cn('flex items-center justify-between p-6 border-b border-outline-variant/30', className)} {...props}>
      <div className="flex items-center gap-4">
        <Skeleton className="h-12 w-12 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24 rounded-full" />
        <Skeleton className="h-10 w-32 rounded-full" />
      </div>
    </div>
  );
}

// Full page skeleton for dashboard/list pages
interface SkeletonPageProps extends SkeletonProps {
  /** Number of cards/items to show */
  itemCount?: number;
  /** Layout type */
  layout?: 'grid' | 'list';
  /** Whether to show header */
  showHeader?: boolean;
  /** Whether to show filters */
  showFilters?: boolean;
  /** Whether to show stats */
  showStats?: boolean;
}

function SkeletonPage({
  className,
  ref,
  itemCount = 6,
  layout = 'grid',
  showHeader = true,
  showFilters = true,
  showStats = false,
  ...props
}: SkeletonPageProps) {
  return (
    <div ref={ref} className={cn('h-full flex flex-col', className)} {...props}>
      {/* Header */}
      {showHeader && <SkeletonPageHeader />}

      {/* Stats row */}
      {showStats && (
        <div className="p-6 pb-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStatsCard key={i} />
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="p-6 pb-0 flex items-center gap-4">
          <Skeleton className="h-10 w-64 rounded-full" />
          <div className="flex gap-2 ml-auto">
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 p-6">
        {layout === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: itemCount }).map((_, i) => (
              <SkeletonSurveyCard key={i} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-outline-variant/50 divide-y divide-outline-variant/30 overflow-hidden">
            {Array.from({ length: itemCount }).map((_, i) => (
              <SkeletonListItem key={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Form skeleton
function SkeletonForm({ className, ref, fields = 4, ...props }: SkeletonProps & { fields?: number }) {
  return (
    <div ref={ref} className={cn('space-y-6', className)} {...props}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton className="h-11 w-24 rounded-full" />
        <Skeleton className="h-11 w-32 rounded-full" />
      </div>
    </div>
  );
}

// Chart/analytics skeleton
function SkeletonChart({ className, ref, ...props }: SkeletonProps) {
  return (
    <div ref={ref} className={cn('rounded-2xl bg-surface-container-low border border-outline-variant/50 p-5', className)} {...props}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export {
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonCard,
  SkeletonTableRow,
  SkeletonSurveyCard,
  SkeletonListItem,
  SkeletonStatsCard,
  SkeletonPageHeader,
  SkeletonPage,
  SkeletonForm,
  SkeletonChart,
};
