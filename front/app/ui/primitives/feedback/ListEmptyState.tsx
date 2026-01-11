import { type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { EmptyState } from './EmptyState';

/**
 * Configuration for creating a list empty state component.
 */
export interface ListEmptyStateConfig {
  /** Icon element to display */
  icon: ReactNode;
  /** Entity name (e.g., 'survey', 'template') - used for default messages */
  entityName: string;
  /** Plural entity name (e.g., 'surveys', 'templates') - defaults to entityName + 's' */
  entityNamePlural?: string;
  /** Custom title when filters are active */
  filteredTitle?: string;
  /** Custom title when no items exist */
  emptyTitle?: string;
  /** Custom description when filters are active */
  filteredDescription?: string;
  /** Custom description when no items exist */
  emptyDescription?: string;
  /** Text for the create action button */
  createActionLabel?: string;
}

/**
 * Props for the ListEmptyState component.
 */
export interface ListEmptyStateProps {
  /** Whether filters/search are currently active */
  hasActiveFilters: boolean;
  /** Callback to clear all filters */
  onClearFilters: () => void;
  /** Callback to create a new item */
  onCreateItem?: () => void;
  /** Optional override for the title */
  title?: string;
  /** Optional override for the description */
  description?: string;
}

/**
 * Creates a pre-configured empty state component for list pages.
 * Returns a component that handles both "no results" and "empty list" states.
 *
 * @example
 * ```tsx
 * const SurveyListEmptyState = createListEmptyState({
 *   icon: <FileText className="h-7 w-7" />,
 *   entityName: 'survey',
 *   emptyDescription: 'Start collecting feedback by creating a new survey',
 * });
 *
 * // Usage
 * <SurveyListEmptyState
 *   hasActiveFilters={hasActiveFilters}
 *   onClearFilters={clearAllFilters}
 *   onCreateItem={() => setCreateDialogOpen(true)}
 * />
 * ```
 */
export function createListEmptyState(config: ListEmptyStateConfig) {
  const {
    icon,
    entityName,
    entityNamePlural = `${entityName}s`,
    filteredTitle,
    emptyTitle,
    filteredDescription,
    emptyDescription,
    createActionLabel,
  } = config;

  const capitalizedName = entityName.charAt(0).toUpperCase() + entityName.slice(1);

  const defaultFilteredTitle = `No ${entityNamePlural} found`;
  const defaultEmptyTitle = `Create your first ${entityName}`;
  const defaultFilteredDescription = 'Try adjusting your filters or search query';
  const defaultEmptyDescription = `Get started by creating a new ${entityName}`;
  const defaultCreateLabel = `Create ${capitalizedName}`;

  /**
   * ListEmptyState component pre-configured for this entity type.
   */
  return function ListEmptyState({ hasActiveFilters, onClearFilters, onCreateItem, title, description }: ListEmptyStateProps) {
    const computedTitle = title ?? (hasActiveFilters ? filteredTitle ?? defaultFilteredTitle : emptyTitle ?? defaultEmptyTitle);

    const computedDescription =
      description ?? (hasActiveFilters ? filteredDescription ?? defaultFilteredDescription : emptyDescription ?? defaultEmptyDescription);

    return (
      <EmptyState
        icon={icon}
        title={computedTitle}
        description={computedDescription}
        iconVariant="primary"
        action={
          hasActiveFilters
            ? {
                label: 'Clear Filters',
                onClick: onClearFilters,
                variant: 'outline',
              }
            : onCreateItem
            ? {
                label: createActionLabel ?? defaultCreateLabel,
                onClick: onCreateItem,
                icon: <Plus className="h-4 w-4" />,
              }
            : undefined
        }
      />
    );
  };
}

/**
 * Props for the inline ListEmptyState component.
 */
export interface InlineListEmptyStateProps extends ListEmptyStateProps {
  /** Icon element to display */
  icon: ReactNode;
  /** Entity name for default messages */
  entityName: string;
  /** Text for the create action button */
  createActionLabel?: string;
}

/**
 * A ready-to-use empty state component for list pages.
 * For simpler cases where you don't need a factory pattern.
 *
 * @example
 * ```tsx
 * <ListEmptyState
 *   icon={<FileText className="h-7 w-7" />}
 *   entityName="survey"
 *   hasActiveFilters={hasActiveFilters}
 *   onClearFilters={clearAllFilters}
 *   onCreateItem={() => setDialogOpen(true)}
 * />
 * ```
 */
export function ListEmptyState({
  icon,
  entityName,
  hasActiveFilters,
  onClearFilters,
  onCreateItem,
  createActionLabel,
  title,
  description,
}: InlineListEmptyStateProps) {
  const capitalizedName = entityName.charAt(0).toUpperCase() + entityName.slice(1);

  const computedTitle = title ?? (hasActiveFilters ? `No ${entityName}s found` : `Create your first ${entityName}`);

  const computedDescription =
    description ?? (hasActiveFilters ? 'Try adjusting your filters or search query' : `Get started by creating a new ${entityName}`);

  return (
    <EmptyState
      icon={icon}
      title={computedTitle}
      description={computedDescription}
      iconVariant="primary"
      action={
        hasActiveFilters
          ? {
              label: 'Clear Filters',
              onClick: onClearFilters,
              variant: 'outline',
            }
          : onCreateItem
          ? {
              label: createActionLabel ?? `Create ${capitalizedName}`,
              onClick: onCreateItem,
              icon: <Plus className="h-4 w-4" />,
            }
          : undefined
      }
    />
  );
}
