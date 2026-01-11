'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, PointerSensor, useSensor, useSensors, MouseSensor, TouchSensor } from '@dnd-kit/core';
import { useDocumentStore, useUndoRedo } from '@/lib/store/documentStore';
import { PageLoading, ToastContainer, toast } from '@/app/ui/primitives';
import {
  Toolbar,
  ComponentPalette,
  Canvas,
  PropertyPanel,
  DragOverlayContent,
  PageThumbnails,
  HeaderFooterEditor,
  SaveAsTemplateDialog,
  PdfPreviewPanel,
  PdfPreviewDialog,
  GeneratePdfDialog,
  VariableHistoryPanel,
} from '@/components/pdf-builder';
import { pxToMm, snapToGrid, CANVAS_WIDTH_PX, CANVAS_HEIGHT_PX } from '@/lib/utils/coordinates';
import {
  fetchDocument,
  createDocument,
  updateDocument,
  generatePdf,
  serializeDocumentContent,
  parseDocumentResponse,
  downloadBlob,
  ApiError,
} from '@/lib/utils/api';
import { useAutoSave, usePdfPreview, type PreviewMode } from '@/lib/hooks';
import type { ComponentType, Component } from '@/lib/types/document.types';

interface BuilderViewProps {
  documentId: string;
}

export function BuilderView({ documentId }: BuilderViewProps) {
  const {
    document,
    isLoading,
    loadDocument,
    currentPageId,
    selectedComponentId,
    isDirty,
    isSaving,
    setLoading,
    setDirty,
    addPage,
    addComponent,
    updateComponent,
    deleteComponent,
    selectComponent,
    getCurrentPage,
  } = useDocumentStore();

  // Undo/Redo functionality
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  const handleUndo = useCallback(() => {
    if (canUndo) {
      undo();
      useDocumentStore.setState({ isDirty: true });
    }
  }, [canUndo, undo]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      redo();
      useDocumentStore.setState({ isDirty: true });
    }
  }, [canRedo, redo]);

  // Track active drag for overlay
  const [activeDrag, setActiveDrag] = useState<{
    type: 'new-component' | 'existing-component';
    componentType?: ComponentType;
    component?: Component;
  } | null>(null);

  // Track PDF generation state
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Track error state
  const [error, setError] = useState<string | null>(null);

  // Header/Footer editor state
  const [headerFooterEditor, setHeaderFooterEditor] = useState<{
    open: boolean;
    mode: 'header' | 'footer';
  }>({ open: false, mode: 'header' });

  // Save as Template dialog state
  const [saveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);

  // Generate PDF dialog state (with variables)
  const [generatePdfDialogOpen, setGeneratePdfDialogOpen] = useState(false);

  // Variable history panel state
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  // Panel collapse states
  const [isPagesCollapsed, setIsPagesCollapsed] = useState(false);
  const [isComponentsCollapsed, setIsComponentsCollapsed] = useState(false);

  // Grid visibility state
  const [showGrid, setShowGrid] = useState(true);

  // Track if document was created (new) vs loaded (existing)
  const isNewDocumentRef = useRef(false);

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required to start drag
      },
    }),
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Auto-save hook
  const { saveNow } = useAutoSave({
    enabled: true,
    debounceMs: 2000,
    onSaveSuccess: () => {
      toast.success('Saved', {
        description: 'Document saved successfully',
      });
    },
  });

  // PDF Preview hook
  const {
    previewUrl,
    isGenerating: isGeneratingPreview,
    isPreviewVisible,
    isDialogOpen,
    previewMode,
    setPreviewMode,
    showPreview,
    hidePreview,
    togglePreview,
    openInNewTab,
    regeneratePreview,
  } = usePdfPreview({
    enabled: true,
    debounceMs: 1500,
  });

  // Load or create document on mount
  useEffect(() => {
    let isMounted = true;

    async function initDocument() {
      setLoading(true);
      setError(null);

      try {
        // Try to fetch existing document
        const response = await fetchDocument(documentId);
        if (isMounted) {
          const parsedDocument = parseDocumentResponse(response);
          loadDocument(parsedDocument);
          isNewDocumentRef.current = false;
        }
      } catch (err) {
        // If document not found (404), create a new one
        if (err instanceof ApiError && err.status === 404) {
          try {
            const newDocResponse = await createDocument('Untitled Document');
            if (isMounted) {
              const parsedDocument = parseDocumentResponse(newDocResponse);
              loadDocument(parsedDocument);
              isNewDocumentRef.current = true;

              toast.success('Document created', {
                description: 'A new document has been created',
              });
            }
          } catch (createErr) {
            if (isMounted) {
              const errorMessage = createErr instanceof Error ? createErr.message : 'Failed to create document';
              setError(errorMessage);
              toast.error('Error', {
                description: errorMessage,
              });
            }
          }
        } else {
          // Other errors
          if (isMounted) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to load document';
            setError(errorMessage);
            toast.error('Error', {
              description: errorMessage,
            });
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    initDocument();

    return () => {
      isMounted = false;
    };
  }, [documentId, loadDocument, setLoading]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle shortcuts if user is typing in an input
      const activeElement = window.document.activeElement;
      const isInputActive =
        activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA' || (activeElement as HTMLElement)?.isContentEditable;

      // Undo: Ctrl+Z / Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl+Shift+Z / Cmd+Shift+Z or Ctrl+Y / Cmd+Y
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Delete selected component with Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedComponentId) {
        if (isInputActive) {
          return;
        }
        e.preventDefault();
        deleteComponent(selectedComponentId);
      }

      // Escape to deselect
      if (e.key === 'Escape' && selectedComponentId) {
        selectComponent(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedComponentId, deleteComponent, selectComponent, handleUndo, handleRedo]);

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const dragData = event.active.data.current;
    if (dragData?.type === 'new-component') {
      setActiveDrag({
        type: 'new-component',
        componentType: dragData.componentType as ComponentType,
      });
    } else if (dragData?.type === 'existing-component') {
      setActiveDrag({
        type: 'existing-component',
        component: dragData.component as Component,
      });
    }
  }, []);

  // Handle drag end - update position or create new component
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over, delta } = event;

      // If not dropped on canvas, ignore
      if (!over || over.id !== 'canvas-drop-zone') {
        return;
      }

      const dragData = active.data.current;

      if (dragData?.type === 'existing-component') {
        // Moving existing component - update its position
        const component = dragData.component;
        const deltaXMm = pxToMm(delta.x);
        const deltaYMm = pxToMm(delta.y);

        const newX = snapToGrid(component.position.x + deltaXMm);
        const newY = snapToGrid(component.position.y + deltaYMm);

        // Ensure component stays within canvas bounds
        const maxX = pxToMm(CANVAS_WIDTH_PX) - component.size.width;
        const maxY = pxToMm(CANVAS_HEIGHT_PX) - component.size.height;

        updateComponent(component.id, {
          position: {
            x: Math.max(0, Math.min(newX, maxX)),
            y: Math.max(0, Math.min(newY, maxY)),
          },
        });
      } else if (dragData?.type === 'new-component') {
        // Dragging new component from palette
        const componentType = dragData.componentType as ComponentType;

        // Get the canvas element to calculate drop position
        const canvasElement = window.document.querySelector('[data-droppable-id="canvas-drop-zone"]');
        if (!canvasElement) return;

        const canvasRect = canvasElement.getBoundingClientRect();

        // Calculate position relative to canvas
        // The pointer position at drop time
        const pointerX = (event.activatorEvent as PointerEvent)?.clientX || 0;
        const pointerY = (event.activatorEvent as PointerEvent)?.clientY || 0;

        // Add the delta to get final position
        const finalX = pointerX + delta.x - canvasRect.left;
        const finalY = pointerY + delta.y - canvasRect.top;

        // Convert to mm and snap to grid
        const positionX = snapToGrid(pxToMm(Math.max(0, finalX)));
        const positionY = snapToGrid(pxToMm(Math.max(0, finalY)));

        addComponent(componentType, { x: positionX, y: positionY });
      }

      // Clear active drag
      setActiveDrag(null);
    },
    [updateComponent, addComponent]
  );

  if (isLoading || !document) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <PageLoading message="Loading document..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-surface">
        <div className="text-error text-lg font-medium">Failed to load document</div>
        <div className="text-on-surface-variant">{error}</div>
        <button onClick={() => window.location.reload()} className="rounded-lg bg-primary px-4 py-2 text-on-primary hover:bg-primary/90">
          Try Again
        </button>
      </div>
    );
  }

  const currentPage = getCurrentPage();
  const selectedComponent = currentPage?.components.find((c) => c.id === selectedComponentId) || null;

  const handleSave = async () => {
    await saveNow();
  };

  const handleGeneratePdf = async () => {
    if (!document) return;

    setIsGeneratingPdf(true);

    try {
      // First save the document to ensure backend has latest version
      if (isDirty) {
        await updateDocument(document.id, {
          title: document.title,
          content: serializeDocumentContent(document),
        });
        setDirty(false);
      }

      // Generate PDF
      const pdfBlob = await generatePdf(document.id);
      downloadBlob(pdfBlob, `${document.title}.pdf`);

      toast.success('PDF generated', {
        description: 'Your PDF has been downloaded',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate PDF';
      toast.error('PDF generation failed', {
        description: errorMessage,
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleAddPage = () => {
    addPage();
  };

  const handleEditHeader = () => {
    setHeaderFooterEditor({ open: true, mode: 'header' });
  };

  const handleEditFooter = () => {
    setHeaderFooterEditor({ open: true, mode: 'footer' });
  };

  const handleSaveAsTemplate = () => {
    setSaveAsTemplateOpen(true);
  };

  const handleSaveAsTemplateSuccess = () => {
    toast.success('Template saved', {
      description: 'Your document has been saved as a template',
    });
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen flex-col bg-surface-container-lowest">
        <Toolbar
          documentTitle={document.title}
          isDirty={isDirty}
          isSaving={isSaving}
          isGeneratingPdf={isGeneratingPdf}
          isPreviewVisible={isPreviewVisible || isDialogOpen}
          isHistoryVisible={isHistoryVisible}
          previewMode={previewMode}
          showGrid={showGrid}
          onSave={handleSave}
          onGeneratePdf={handleGeneratePdf}
          onGenerateWithVariables={() => setGeneratePdfDialogOpen(true)}
          onTogglePreview={togglePreview}
          onToggleHistory={() => setIsHistoryVisible(!isHistoryVisible)}
          onPreviewModeChange={setPreviewMode}
          onToggleGrid={() => setShowGrid(!showGrid)}
          onEditHeader={handleEditHeader}
          onEditFooter={handleEditFooter}
          onSaveAsTemplate={handleSaveAsTemplate}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
        />

        <div className="flex flex-1 overflow-hidden">
          {/* Page Thumbnails - Left sidebar */}
          <PageThumbnails onAddPage={handleAddPage} isCollapsed={isPagesCollapsed} onToggleCollapse={() => setIsPagesCollapsed(!isPagesCollapsed)} />

          {/* Component Palette */}
          <ComponentPalette isCollapsed={isComponentsCollapsed} onToggleCollapse={() => setIsComponentsCollapsed(!isComponentsCollapsed)} />

          {/* Main Canvas */}
          <Canvas
            document={document}
            currentPageId={currentPageId}
            selectedComponentId={selectedComponentId}
            showGrid={showGrid}
            onAddPage={handleAddPage}
            onEditHeader={handleEditHeader}
            onEditFooter={handleEditFooter}
          />

          {/* Property Panel - Right sidebar (only shown when component selected) */}
          <PropertyPanel selectedComponent={selectedComponent} onClose={() => selectComponent(null)} />

          {/* Variable History Panel - Right sidebar */}
          {isHistoryVisible && (
            <VariableHistoryPanel documentId={document.id} documentTitle={document.title} onClose={() => setIsHistoryVisible(false)} />
          )}

          {/* PDF Preview Panel - Side-by-side mode */}
          {isPreviewVisible && (
            <PdfPreviewPanel previewUrl={previewUrl} isGenerating={isGeneratingPreview} onClose={hidePreview} onRefresh={regeneratePreview} />
          )}
        </div>
      </div>

      {/* PDF Preview Dialog - Dialog mode */}
      <PdfPreviewDialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && hidePreview()}
        previewUrl={previewUrl}
        isGenerating={isGeneratingPreview}
        onRefresh={regeneratePreview}
        onOpenInNewTab={openInNewTab}
      />

      {/* Generate PDF Dialog - With variables */}
      <GeneratePdfDialog
        open={generatePdfDialogOpen}
        onOpenChange={setGeneratePdfDialogOpen}
        documentId={document.id}
        documentTitle={document.title}
      />

      {/* Header/Footer Editor Dialog */}
      <HeaderFooterEditor
        open={headerFooterEditor.open}
        onOpenChange={(open) => setHeaderFooterEditor((prev) => ({ ...prev, open }))}
        editMode={headerFooterEditor.mode}
      />

      {/* Save as Template Dialog */}
      <SaveAsTemplateDialog
        open={saveAsTemplateOpen}
        onOpenChange={setSaveAsTemplateOpen}
        document={document}
        onSuccess={handleSaveAsTemplateSuccess}
      />

      {/* Drag Overlay for visual feedback */}
      <DragOverlay dropAnimation={null}>{activeDrag && <DragOverlayContent activeDrag={activeDrag} />}</DragOverlay>

      {/* Toast notifications */}
      <ToastContainer />
    </DndContext>
  );
}
