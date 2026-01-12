'use client';

import { useDroppable } from '@dnd-kit/core';
import { Card } from '@/app/ui/primitives';
import { useDocumentStore } from '@/lib/store/documentStore';
import { CANVAS_WIDTH_PX, CANVAS_HEIGHT_PX, mmToPx } from '@/lib/utils/coordinates';
import { DraggableComponent } from './components/DraggableComponent';
import { HeaderFooterZone } from './components/HeaderFooterZone';
import type { Document, HeaderFooterContent } from '@/lib/types/document.types';

interface CanvasProps {
  document: Document;
  currentPageId: string | null;
  selectedComponentId: string | null;
  showGrid?: boolean;
  zoom?: number;
  onAddPage?: () => void;
  onCanvasClick?: () => void;
  onEditHeader?: () => void;
  onEditFooter?: () => void;
}

// Grid size in mm (10mm squares)
const GRID_SIZE_MM = 10;
const GRID_SIZE_PX = mmToPx(GRID_SIZE_MM);

export function Canvas({ document, currentPageId, selectedComponentId, showGrid = true, zoom = 100, onCanvasClick, onEditHeader, onEditFooter }: CanvasProps) {
  const { selectComponent } = useDocumentStore();

  // Make the canvas droppable
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
    data: {
      type: 'canvas',
    },
  });

  const currentPage = document.pages.find((p) => p.id === currentPageId);
  const components = currentPage?.components || [];
  const currentPageIndex = document.pages.findIndex((p) => p.id === currentPageId);
  const totalPages = document.pages.length;

  // Get header/footer config based on page type
  const getHeaderContent = (): HeaderFooterContent | null => {
    if (!currentPage) return null;
    const headerType = currentPage.headerType;
    if (headerType === 'none') return null;

    switch (headerType) {
      case 'firstPage':
        return document.headerFooter.firstPageHeader || document.headerFooter.defaultHeader;
      case 'compact':
        return document.headerFooter.compactHeader || document.headerFooter.defaultHeader;
      default:
        return document.headerFooter.defaultHeader;
    }
  };

  const getFooterContent = (): HeaderFooterContent | null => {
    if (!currentPage) return null;
    const footerType = currentPage.footerType;
    if (footerType === 'none') return null;

    switch (footerType) {
      case 'firstPage':
        return document.headerFooter.firstPageFooter || document.headerFooter.defaultFooter;
      case 'compact':
        return document.headerFooter.compactFooter || document.headerFooter.defaultFooter;
      default:
        return document.headerFooter.defaultFooter;
    }
  };

  const headerContent = getHeaderContent();
  const footerContent = getFooterContent();
  const headerHeight = headerContent?.height || 0;
  const footerHeight = footerContent?.height || 0;

  // Calculate the content area height (total - header - footer)
  const contentAreaHeight = CANVAS_HEIGHT_PX - mmToPx(headerHeight) - mmToPx(footerHeight);

  // Handle click on canvas background to deselect
  // This works by checking if the click target is the canvas container itself or background areas
  const handleCanvasClick = (e: React.MouseEvent) => {
    // Get the target element
    const target = e.target as HTMLElement;

    // Check if the click is on a component (has data attribute or is inside a draggable component)
    const isClickOnComponent = target.closest('[data-draggable-component]') !== null;

    // Check if the click is on an interactive element within the canvas area
    const isClickOnInteractive = target.closest('button, input, textarea, select, [contenteditable]') !== null;

    // Deselect if clicking on canvas background areas (not on components or interactive elements)
    if (!isClickOnComponent && !isClickOnInteractive) {
      selectComponent(null);
      onCanvasClick?.();
    }
  };

  // Handle component selection
  const handleComponentSelect = (componentId: string) => {
    selectComponent(componentId);
  };

  return (
    <main className='relative flex flex-1 flex-col overflow-hidden bg-surface-container-low' onClick={handleCanvasClick}>
      {/* Page indicator bar - fixed at top */}
      <div className='z-10 flex shrink-0 items-center justify-center border-b border-outline-variant/20 bg-surface px-4 py-2'>
        <span className='text-sm font-medium text-on-surface'>
          Page {currentPageIndex + 1} of {document.pages.length}
        </span>
      </div>

      {/* Canvas container - scrollable */}
      <div className='flex min-h-0 flex-1 items-start justify-center overflow-auto p-8'>
        {/* A4 Canvas - Droppable area */}
        <div
          ref={setNodeRef}
          data-droppable-id='canvas-drop-zone'
          className='relative shrink-0 transition-all duration-200 origin-top'
          style={{
            width: CANVAS_WIDTH_PX,
            height: CANVAS_HEIGHT_PX,
            transform: `scale(${zoom / 100})`,
            // Figma-style drop zone indicator
            boxShadow: isOver ? '0 0 0 2px #0d99ff, 0 4px 20px rgba(13, 153, 255, 0.2)' : '0 1px 3px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.05)',
            borderRadius: 4,
          }}
        >
          <Card variant='elevated' className='h-full w-full overflow-hidden bg-white rounded-md!' padding='none'>
            {/* Page layout: Header → Content → Footer */}
            <div className='flex h-full w-full flex-col'>
              {/* Header Zone */}
              {currentPage && currentPage.headerType !== 'none' && headerContent && (
                <HeaderFooterZone
                  type='header'
                  content={headerContent}
                  headerFooterType={currentPage.headerType}
                  pageNumber={currentPageIndex + 1}
                  totalPages={totalPages}
                  variables={document.variables}
                  onEdit={onEditHeader}
                />
              )}

              {/* Content Area - Droppable zone for components */}
              <div className='relative flex-1' style={{ height: contentAreaHeight }}>
                {/* Grid overlay */}
                {showGrid && (
                  <div className='pointer-events-none absolute inset-0 z-1 opacity-30'>
                    <svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>
                      <defs>
                        <pattern id='grid' width={GRID_SIZE_PX} height={GRID_SIZE_PX} patternUnits='userSpaceOnUse'>
                          <path
                            d={`M ${GRID_SIZE_PX} 0 L 0 0 0 ${GRID_SIZE_PX}`}
                            fill='none'
                            stroke='currentColor'
                            strokeWidth='0.5'
                            className='text-outline-variant'
                          />
                        </pattern>
                      </defs>
                      <rect width='100%' height='100%' fill='url(#grid)' />
                    </svg>
                  </div>
                )}

                {/* Components layer */}
                <div className='absolute inset-0 z-2'>
                  {components.map((component) => (
                    <DraggableComponent
                      key={component.id}
                      component={component}
                      isSelected={component.id === selectedComponentId}
                      onSelect={handleComponentSelect}
                    />
                  ))}
                </div>

                {/* Empty state (only show when no components) */}
                {components.length === 0 && (
                  <div className='pointer-events-none absolute inset-0 z-0 flex items-center justify-center'>
                    <div className='text-center'>
                      <p className='text-sm text-on-surface-variant'>Drag components here</p>
                      <p className='mt-1 text-xs text-on-surface-variant/60'>
                        Page {currentPageIndex + 1} of {totalPages}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Zone */}
              {currentPage && currentPage.footerType !== 'none' && footerContent && (
                <HeaderFooterZone
                  type='footer'
                  content={footerContent}
                  headerFooterType={currentPage.footerType}
                  pageNumber={currentPageIndex + 1}
                  totalPages={totalPages}
                  variables={document.variables}
                  onEdit={onEditFooter}
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
