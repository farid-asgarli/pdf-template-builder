// Sortable - Centralized sortable components using @dnd-kit
// Provides reusable drag-and-drop primitives for sortable lists
// Used by: SurveyBuilder questions, Email Editor blocks, etc.

import { createContext, useContext, forwardRef } from 'react';
import type { ReactNode, HTMLAttributes, CSSProperties } from 'react';
import { DndContext, DragOverlay, closestCenter, defaultDropAnimationSideEffects, MeasuringStrategy, useSensors } from '@dnd-kit/core';
import type { UniqueIdentifier, DragStartEvent, DragOverEvent, DragEndEvent, DropAnimation } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/app/ui';

// ============================================================================
// Types
// ============================================================================

/**
 * Return type for sortable list hook implementations.
 * This interface allows any hook that provides these properties to work with SortableList.
 */
export interface SortableListResult<T> {
  /** Configured sensors for DndContext */
  sensors: ReturnType<typeof useSensors>;
  /** Currently dragging item ID */
  activeId: UniqueIdentifier | null;
  /** Currently dragging item */
  activeItem: T | null;
  /** Array of item IDs for SortableContext */
  itemIds: UniqueIdentifier[];
  /** Handler for drag start event */
  handleDragStart: (event: DragStartEvent) => void;
  /** Handler for drag over event (for cross-container support) */
  handleDragOver: (event: DragOverEvent) => void;
  /** Handler for drag end event */
  handleDragEnd: (event: DragEndEvent) => void;
  /** Handler for drag cancel event */
  handleDragCancel: () => void;
  /** Check if an item is being dragged */
  isDragging: (id: UniqueIdentifier) => boolean;
}

export interface SortableListProps<T> {
  /** Return value from useSortableList hook or any hook that provides SortableListResult */
  sortable: SortableListResult<T>;
  /** Children to render inside the sortable context */
  children: ReactNode;
  /** Layout strategy - 'vertical' or 'horizontal' */
  strategy?: 'vertical' | 'horizontal';
  /** Custom drop animation */
  dropAnimation?: DropAnimation | null;
  /** Render function for drag overlay content */
  renderOverlay?: (item: T) => ReactNode;
  /** Whether to use portal for drag overlay */
  usePortal?: boolean;
  /** Accessibility announcement for screen readers */
  announcements?: {
    onDragStart?: (id: UniqueIdentifier) => string;
    onDragOver?: (id: UniqueIdentifier, overId: UniqueIdentifier) => string;
    onDragEnd?: (id: UniqueIdentifier, overId: UniqueIdentifier) => string;
    onDragCancel?: (id: UniqueIdentifier) => string;
  };
}

export interface SortableItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'id'> {
  /** Unique identifier for the sortable item */
  id: UniqueIdentifier;
  /** Whether this item is disabled from sorting */
  disabled?: boolean;
  /** Content to render */
  children: ReactNode;
  /** Additional class names */
  className?: string;
  /** Whether to use transform or translate for positioning */
  useTransform?: boolean;
}

export interface SortableHandleProps extends HTMLAttributes<HTMLDivElement> {
  /** Content to render as the drag handle */
  children: ReactNode;
  /** Additional class names */
  className?: string;
}

// ============================================================================
// Context for Sortable Handle
// ============================================================================

interface SortableItemContextValue {
  attributes: ReturnType<typeof useSortable>['attributes'];
  listeners: ReturnType<typeof useSortable>['listeners'];
  setActivatorNodeRef: (node: HTMLElement | null) => void;
  isDragging: boolean;
}

const SortableItemContext = createContext<SortableItemContextValue | null>(null);

function useSortableItemContext() {
  const context = useContext(SortableItemContext);
  if (!context) {
    throw new Error('SortableHandle must be used within a SortableItem');
  }
  return context;
}

// ============================================================================
// Components
// ============================================================================

const dropAnimationConfig: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.5',
      },
    },
  }),
};

const measuringConfig = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
};

/**
 * SortableList - Wrapper component that sets up the DnD context
 *
 * @example
 * ```tsx
 * const sortable = useSortableList({ items, getId, onReorder });
 *
 * return (
 *   <SortableList sortable={sortable} renderOverlay={(item) => <Card>{item.title}</Card>}>
 *     {items.map((item) => (
 *       <SortableItem key={item.id} id={item.id}>
 *         <Card>{item.title}</Card>
 *       </SortableItem>
 *     ))}
 *   </SortableList>
 * );
 * ```
 */
export function SortableList<T>({
  sortable,
  children,
  strategy = 'vertical',
  dropAnimation = dropAnimationConfig,
  renderOverlay,
}: SortableListProps<T>) {
  const { sensors, activeItem, itemIds, handleDragStart, handleDragOver, handleDragEnd, handleDragCancel } = sortable;

  const sortingStrategy = strategy === 'vertical' ? verticalListSortingStrategy : horizontalListSortingStrategy;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      measuring={measuringConfig}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext items={itemIds} strategy={sortingStrategy}>
        {children}
      </SortableContext>
      <DragOverlay dropAnimation={dropAnimation}>{activeItem && renderOverlay ? renderOverlay(activeItem) : null}</DragOverlay>
    </DndContext>
  );
}

/**
 * SortableItem - A sortable item wrapper component
 *
 * @example
 * ```tsx
 * <SortableItem id={item.id}>
 *   <div className="card">
 *     <SortableHandle><GripVertical /></SortableHandle>
 *     <span>{item.title}</span>
 *   </div>
 * </SortableItem>
 * ```
 */
export const SortableItem = forwardRef<HTMLDivElement, SortableItemProps>(function SortableItem(
  { id, disabled = false, children, className, useTransform = true, ...props },
  ref
) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style: CSSProperties = {
    transform: useTransform ? CSS.Transform.toString(transform) : undefined,
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative',
  };

  const contextValue: SortableItemContextValue = {
    attributes,
    listeners,
    setActivatorNodeRef,
    isDragging,
  };

  return (
    <SortableItemContext.Provider value={contextValue}>
      <div
        ref={(node) => {
          setNodeRef(node);
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        style={style}
        className={cn(isDragging && 'opacity-50', className)}
        {...props}
      >
        {children}
      </div>
    </SortableItemContext.Provider>
  );
});

/**
 * SortableItemWithHandle - A sortable item that can only be dragged via handle
 * The entire item is not draggable, only the handle triggers drag
 */
export const SortableItemWithHandle = forwardRef<HTMLDivElement, SortableItemProps>(function SortableItemWithHandle(
  { id, disabled = false, children, className, ...props },
  ref
) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative',
  };

  const contextValue: SortableItemContextValue = {
    attributes,
    listeners,
    setActivatorNodeRef,
    isDragging,
  };

  return (
    <SortableItemContext.Provider value={contextValue}>
      <div
        ref={(node) => {
          setNodeRef(node);
          if (typeof ref === 'function') ref(node);
          else if (ref) ref.current = node;
        }}
        style={style}
        className={cn(isDragging && 'opacity-50', className)}
        {...props}
      >
        {children}
      </div>
    </SortableItemContext.Provider>
  );
});

/**
 * SortableHandle - Drag handle that can be placed anywhere inside SortableItem
 *
 * @example
 * ```tsx
 * <SortableItem id={item.id}>
 *   <SortableHandle className="cursor-grab">
 *     <GripVertical className="w-4 h-4" />
 *   </SortableHandle>
 *   <span>{item.title}</span>
 * </SortableItem>
 * ```
 */
export const SortableHandle = forwardRef<HTMLDivElement, SortableHandleProps>(function SortableHandle({ children, className, ...props }, ref) {
  const { attributes, listeners, setActivatorNodeRef, isDragging } = useSortableItemContext();

  return (
    <div
      ref={(node) => {
        setActivatorNodeRef(node);
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn('touch-none', isDragging ? 'cursor-grabbing' : 'cursor-grab', className)}
      {...attributes}
      {...listeners}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * Hook to access sortable item context from children
 * Useful for conditional styling based on drag state
 */
export function useSortableItemState() {
  const context = useContext(SortableItemContext);
  return {
    isDragging: context?.isDragging ?? false,
  };
}
