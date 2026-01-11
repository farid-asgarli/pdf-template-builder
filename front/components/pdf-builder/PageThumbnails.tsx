'use client';

import { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Copy, Trash2, FileText, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button, IconButton, Tooltip, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/app/ui/primitives';
import { useDocumentStore } from '@/lib/store/documentStore';
import type { Page } from '@/lib/types/document.types';

interface PageThumbnailsProps {
  onAddPage: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function PageThumbnails({ onAddPage, isCollapsed = false, onToggleCollapse }: PageThumbnailsProps) {
  const { document, currentPageId, setCurrentPage, deletePage, duplicatePage, reorderPages } = useDocumentStore();
  const [deleteConfirmPageId, setDeleteConfirmPageId] = useState<string | null>(null);

  // Sensors for sortable
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (over && active.id !== over.id && document) {
        const oldIndex = document.pages.findIndex((p) => p.id === active.id);
        const newIndex = document.pages.findIndex((p) => p.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
          reorderPages(oldIndex, newIndex);
        }
      }
    },
    [document, reorderPages]
  );

  const handleDeleteClick = useCallback((pageId: string) => {
    setDeleteConfirmPageId(pageId);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteConfirmPageId) {
      deletePage(deleteConfirmPageId);
      setDeleteConfirmPageId(null);
    }
  }, [deleteConfirmPageId, deletePage]);

  const handleCancelDelete = useCallback(() => {
    setDeleteConfirmPageId(null);
  }, []);

  if (!document) return null;

  const pages = document.pages;
  const canDelete = pages.length > 1;

  // Collapsed state - show only toggle button and vertical "Pages" text
  if (isCollapsed) {
    return (
      <aside className="flex w-12 flex-col items-center border-r border-outline-variant/25 bg-surface py-3">
        <Tooltip content="Show pages" side="right">
          <IconButton variant="ghost" size="sm" aria-label="Show pages" onClick={onToggleCollapse} icon={<PanelLeft className="h-4 w-4" />} />
        </Tooltip>
        <div className="mt-4 flex flex-1 flex-col items-center">
          <span
            className="text-xs font-semibold tracking-wider text-on-surface-variant"
            style={{ writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}
          >
            Pages
          </span>
          <span className="mt-2 text-[10px] font-medium text-on-surface-variant/70">({pages.length})</span>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex w-48 flex-col border-r border-outline-variant/25 bg-surface">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant/20 px-3 py-2.5">
        <div>
          <h2 className="text-sm font-semibold text-on-surface">Pages</h2>
          <p className="text-[10px] text-on-surface-variant">
            {pages.length} {pages.length === 1 ? 'page' : 'pages'}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <IconButton variant="filled-tonal" size="sm" aria-label="Add page" onClick={onAddPage} icon={<Plus className="h-4 w-4" />} />
          {onToggleCollapse && (
            <Tooltip content="Hide pages">
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="Hide pages"
                onClick={onToggleCollapse}
                icon={<PanelLeftClose className="h-4 w-4" />}
              />
            </Tooltip>
          )}
        </div>
      </div>

      {/* Page list */}
      <div className="flex-1 overflow-y-auto p-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-1.5">
              {pages.map((page, index) => (
                <SortablePageItem
                  key={page.id}
                  page={page}
                  index={index}
                  isSelected={page.id === currentPageId}
                  canDelete={canDelete}
                  onSelect={setCurrentPage}
                  onDuplicate={duplicatePage}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      {/* Add Page Button at bottom */}
      <div className="border-t border-outline-variant/20 p-2">
        <Button variant="tonal" size="sm" className="w-full" onClick={onAddPage}>
          <Plus className="h-4 w-4" />
          Add Page
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmPageId !== null} onOpenChange={(open) => !open && handleCancelDelete()}>
        <DialogContent size="sm" showClose={false}>
          <DialogHeader>
            <DialogTitle>Delete Page?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this page? All components on this page will be permanently removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete Page
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

interface SortablePageItemProps {
  page: Page;
  index: number;
  isSelected: boolean;
  canDelete: boolean;
  onSelect: (pageId: string) => void;
  onDuplicate: (pageId: string) => void;
  onDelete: (pageId: string) => void;
}

function SortablePageItem({ page, index, isSelected, canDelete, onSelect, onDuplicate, onDelete }: SortablePageItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const componentCount = page.components.length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center gap-2 rounded-xl p-2 transition-all duration-200 ${
        isSelected ? 'bg-primary-container text-on-primary-container' : 'hover:bg-surface-container-high text-on-surface'
      } ${isDragging ? 'shadow-lg ring-2 ring-primary/30' : ''}`}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex cursor-grab items-center justify-center rounded p-0.5 text-on-surface-variant/50 transition-colors hover:bg-surface-container-highest hover:text-on-surface-variant active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5" />
      </div>

      {/* Page thumbnail/icon */}
      <button onClick={() => onSelect(page.id)} className="flex flex-1 items-center gap-2 text-left">
        <div
          className={`flex h-8 w-6 shrink-0 items-center justify-center rounded border ${
            isSelected ? 'border-primary/30 bg-surface' : 'border-outline-variant/30 bg-surface-container-lowest'
          }`}
        >
          <FileText className={`h-3 w-3 ${isSelected ? 'text-primary' : 'text-on-surface-variant/60'}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={`truncate text-xs font-medium ${isSelected ? 'text-on-primary-container' : 'text-on-surface'}`}>Page {index + 1}</p>
          <p className={`text-[10px] ${isSelected ? 'text-on-primary-container/70' : 'text-on-surface-variant'}`}>
            {componentCount} {componentCount === 1 ? 'item' : 'items'}
          </p>
        </div>
      </button>

      {/* Actions (visible on hover or when selected) */}
      <div className={`flex items-center gap-0.5 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
        <IconButton
          variant="ghost"
          size="sm"
          aria-label="Duplicate page"
          onClick={() => onDuplicate(page.id)}
          className="h-6 w-6"
          icon={<Copy className="h-3 w-3" />}
        />
        {canDelete && (
          <IconButton
            variant="ghost"
            size="sm"
            aria-label="Delete page"
            onClick={() => onDelete(page.id)}
            className="h-6 w-6 text-error hover:bg-error/10"
            icon={<Trash2 className="h-3 w-3" />}
          />
        )}
      </div>
    </div>
  );
}
