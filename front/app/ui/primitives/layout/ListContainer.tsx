import { type ReactNode, type HTMLAttributes, createContext, useContext } from 'react';
import { cn } from '@/app/ui';
import { ViewMode } from '../types';
import { Skeleton } from '../feedback';

/**
 * Context for sharing list container state between compound components.
 */
interface ListContainerContextValue {
  viewMode: ViewMode;
  isLoading: boolean;
  isEmpty: boolean;
  hasError: boolean;
}

const ListContainerContext = createContext<ListContainerContextValue | null>(null);

function useListContainerContext(): ListContainerContextValue {
  const context = useContext(ListContainerContext);
  if (!context) {
    throw new Error('ListContainer compound components must be used within a ListContainer');
  }
  return context;
}

/**
 * Props for the ListContainer component.
 */
interface ListContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Items to display (used to determine if empty) */
  items: unknown[];
  /** Whether data is currently loading */
  isLoading?: boolean;
  /** Whether an error occurred */
  hasError?: boolean;
  /** Current view mode */
  viewMode?: ViewMode;
  /** Children to render */
  children: ReactNode;
}

/**
 * A compound component container for list pages that handles loading, empty,
 * and error states. Use with its sub-components for a consistent list page pattern.
 *
 * @example
 * ```tsx
 * <ListContainer
 *   items={surveys}
 *   isLoading={isLoading}
 *   hasError={isError}
 *   viewMode={viewMode}
 * >
 *   <ListContainer.Loading>
 *     <LoadingSkeleton />
 *   </ListContainer.Loading>
 *
 *   <ListContainer.Error>
 *     <ErrorDisplay onRetry={refetch} />
 *   </ListContainer.Error>
 *
 *   <ListContainer.Empty>
 *     <EmptyState title="No items" />
 *   </ListContainer.Empty>
 *
 *   <ListContainer.Content>
 *     <ItemGrid items={surveys} />
 *   </ListContainer.Content>
 * </ListContainer>
 * ```
 */
function ListContainer({ items, isLoading = false, hasError = false, viewMode = 'grid', children, className, ...props }: ListContainerProps) {
  const isEmpty = !isLoading && !hasError && items.length === 0;

  const contextValue: ListContainerContextValue = {
    viewMode,
    isLoading,
    isEmpty,
    hasError,
  };

  return (
    <ListContainerContext.Provider value={contextValue}>
      <div className={cn('flex-1 overflow-auto', className)} {...props}>
        {children}
      </div>
    </ListContainerContext.Provider>
  );
}

/**
 * Props for content components (Loading, ErrorState, Empty, Content)
 */
interface ListContainerChildProps {
  children: ReactNode;
  className?: string;
}

/**
 * Loading state component - renders when isLoading is true.
 */
function LoadingState({ children, className }: ListContainerChildProps) {
  const { isLoading } = useListContainerContext();

  if (!isLoading) return null;

  return <div className={className}>{children}</div>;
}

/**
 * Error state component - renders when hasError is true.
 */
function ErrorState({ children, className }: ListContainerChildProps) {
  const { isLoading, hasError } = useListContainerContext();

  if (isLoading || !hasError) return null;

  return <div className={className}>{children}</div>;
}

/**
 * Empty state component - renders when items array is empty.
 */
function EmptyContent({ children, className }: ListContainerChildProps) {
  const { isLoading, hasError, isEmpty } = useListContainerContext();

  if (isLoading || hasError || !isEmpty) return null;

  return <div className={className}>{children}</div>;
}

/**
 * Content component - renders when there's data to display.
 */
function DataContent({ children, className }: ListContainerChildProps) {
  const { isLoading, hasError, isEmpty } = useListContainerContext();

  if (isLoading || hasError || isEmpty) return null;

  return <div className={className}>{children}</div>;
}

// Attach sub-components
ListContainer.Loading = LoadingState;
ListContainer.Error = ErrorState;
ListContainer.Empty = EmptyContent;
ListContainer.Content = DataContent;

export { ListContainer };

/**
 * Props for the ListGrid component.
 */
interface ListGridProps<T> extends HTMLAttributes<HTMLDivElement> {
  /** Items to render */
  items: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Key extractor function */
  keyExtractor: (item: T, index: number) => string;
  /** Current view mode */
  viewMode?: ViewMode;
  /** Grid columns configuration */
  gridColumns?: string;
  /** Gap between items */
  gap?: string;
}

/**
 * A grid/list component that renders items in either grid or list layout
 * based on the view mode.
 *
 * @example
 * ```tsx
 * <ListGrid
 *   items={surveys}
 *   renderItem={(survey) => <SurveyCard survey={survey} />}
 *   keyExtractor={(survey) => survey.id}
 *   viewMode={viewMode}
 * />
 * ```
 */
export function ListGrid<T>({
  items,
  renderItem,
  keyExtractor,
  viewMode = 'grid',
  gridColumns = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  gap = 'gap-4',
  className,
  ...props
}: ListGridProps<T>) {
  const gridClass = viewMode === 'grid' ? `grid ${gridColumns}` : 'flex flex-col';

  return (
    <div className={cn(gridClass, gap, className)} {...props}>
      {items.map((item, index) => (
        <div key={keyExtractor(item, index)}>{renderItem(item, index)}</div>
      ))}
    </div>
  );
}

/**
 * Props for the GridSkeleton component.
 */
interface GridSkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of skeleton items to show */
  count?: number;
  /** Current view mode */
  viewMode?: ViewMode;
  /** Height of each skeleton item in grid mode */
  gridHeight?: string;
  /** Height of each skeleton item in list mode */
  listHeight?: string;
  /** Grid columns configuration */
  gridColumns?: string;
}

/**
 * A skeleton loading component for grid/list views.
 *
 * @example
 * ```tsx
 * <ListContainer.Loading>
 *   <GridSkeleton viewMode={viewMode} count={6} />
 * </ListContainer.Loading>
 * ```
 */
export function GridSkeleton({
  count = 6,
  viewMode = 'grid',
  gridHeight = 'h-48',
  listHeight = 'h-20',
  gridColumns = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  className,
  ...props
}: GridSkeletonProps) {
  const gridClass = viewMode === 'grid' ? `grid ${gridColumns}` : 'flex flex-col';
  const itemHeight = viewMode === 'grid' ? gridHeight : listHeight;

  return (
    <div className={cn(gridClass, 'gap-4', className)} {...props}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={cn('rounded-2xl', itemHeight)} />
      ))}
    </div>
  );
}
