// PDF Preview hook for PDF Builder
// Automatically regenerates PDF preview when document changes

import { useEffect, useRef, useCallback, useState } from 'react';
import { useDocumentStore } from '@/lib/store/documentStore';
import { generatePdfPreview, serializeDocumentContent, ApiError } from '@/lib/utils/api';
import { toast } from '@/app/ui/primitives';

/** Preview display modes */
export type PreviewMode = 'side-by-side' | 'dialog' | 'new-tab';

interface UsePdfPreviewOptions {
  /** Delay in milliseconds before regenerating preview (default: 1500ms) */
  debounceMs?: number;
  /** Whether preview is enabled/visible */
  enabled?: boolean;
  /** Callback when preview generation starts */
  onGenerateStart?: () => void;
  /** Callback when preview generation succeeds */
  onGenerateSuccess?: () => void;
  /** Callback when preview generation fails */
  onGenerateError?: (error: Error) => void;
}

interface UsePdfPreviewResult {
  /** URL to the current PDF preview blob */
  previewUrl: string | null;
  /** Whether preview is currently being generated */
  isGenerating: boolean;
  /** Whether the preview panel is visible (side-by-side mode) */
  isPreviewVisible: boolean;
  /** Whether the preview dialog is open */
  isDialogOpen: boolean;
  /** Current preview mode */
  previewMode: PreviewMode;
  /** Set the preview mode */
  setPreviewMode: (mode: PreviewMode) => void;
  /** Show the preview in current mode */
  showPreview: (mode?: PreviewMode) => void;
  /** Hide the preview panel/dialog */
  hidePreview: () => void;
  /** Toggle preview panel visibility */
  togglePreview: () => void;
  /** Open preview in a new browser tab */
  openInNewTab: () => void;
  /** Manually trigger a preview regeneration */
  regeneratePreview: () => Promise<void>;
}

export function usePdfPreview(options: UsePdfPreviewOptions = {}): UsePdfPreviewResult {
  const { debounceMs = 1500, enabled = true, onGenerateStart, onGenerateSuccess, onGenerateError } = options;

  const { document } = useDocumentStore();

  // State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>('side-by-side');

  // Track timeout for debouncing
  const regenerateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track if we're currently generating to prevent concurrent generations
  const isGeneratingRef = useRef(false);

  // Track last generated content to avoid unnecessary regenerations
  const lastGeneratedContentRef = useRef<string | null>(null);

  // Track current blob URL for cleanup
  const currentBlobUrlRef = useRef<string | null>(null);

  // Cleanup blob URL
  const cleanupBlobUrl = useCallback(() => {
    if (currentBlobUrlRef.current) {
      URL.revokeObjectURL(currentBlobUrlRef.current);
      currentBlobUrlRef.current = null;
    }
  }, []);

  // Generate preview function
  const generatePreview = useCallback(
    async (force: boolean = false) => {
      if (!document || isGeneratingRef.current) {
        return;
      }

      const currentContent = serializeDocumentContent(document);

      // Skip if content hasn't actually changed (unless forced)
      if (!force && currentContent === lastGeneratedContentRef.current) {
        return;
      }

      isGeneratingRef.current = true;
      setIsGenerating(true);
      onGenerateStart?.();

      try {
        const pdfBlob = await generatePdfPreview(currentContent);

        // Cleanup previous blob URL
        cleanupBlobUrl();

        // Create new blob URL
        const newUrl = URL.createObjectURL(pdfBlob);
        currentBlobUrlRef.current = newUrl;
        setPreviewUrl(newUrl);

        lastGeneratedContentRef.current = currentContent;
        onGenerateSuccess?.();
      } catch (error) {
        const apiError = error instanceof ApiError ? error : new Error('Failed to generate PDF preview');
        onGenerateError?.(apiError);

        // Show error toast
        toast.error('Preview failed', {
          description: apiError.message,
        });
      } finally {
        isGeneratingRef.current = false;
        setIsGenerating(false);
      }
    },
    [document, cleanupBlobUrl, onGenerateStart, onGenerateSuccess, onGenerateError]
  );

  // Manual regenerate function
  const regeneratePreview = useCallback(async () => {
    if (regenerateTimeoutRef.current) {
      clearTimeout(regenerateTimeoutRef.current);
      regenerateTimeoutRef.current = null;
    }
    await generatePreview(true);
  }, [generatePreview]);

  // Show preview in specified mode
  const showPreview = useCallback(
    async (mode?: PreviewMode) => {
      const targetMode = mode || previewMode;

      if (targetMode === 'new-tab') {
        // For new-tab mode, generate and open immediately in new tab
        await generatePreview(true);
        // Open in new tab after generation completes
        if (currentBlobUrlRef.current) {
          window.open(currentBlobUrlRef.current, '_blank');
        }
        return;
      }

      if (targetMode === 'dialog') {
        setIsDialogOpen(true);
        setIsPreviewVisible(false);
      } else {
        setIsPreviewVisible(true);
        setIsDialogOpen(false);
      }

      // Generate preview immediately when showing
      generatePreview(true);
    },
    [generatePreview, previewMode]
  );

  // Hide preview (panel or dialog)
  const hidePreview = useCallback(() => {
    setIsPreviewVisible(false);
    setIsDialogOpen(false);
  }, []);

  // Toggle preview based on current mode
  const togglePreview = useCallback(() => {
    const isVisible = isPreviewVisible || isDialogOpen;
    if (isVisible) {
      hidePreview();
    } else {
      showPreview();
    }
  }, [isPreviewVisible, isDialogOpen, hidePreview, showPreview]);

  // Open preview in new browser tab
  const openInNewTab = useCallback(async () => {
    // Generate preview if not available
    if (!previewUrl) {
      await generatePreview(true);
    }

    // Wait a tick for the URL to be set
    setTimeout(() => {
      if (currentBlobUrlRef.current) {
        window.open(currentBlobUrlRef.current, '_blank');
      }
    }, 100);
  }, [previewUrl, generatePreview]);

  // Effect to watch for document changes and trigger debounced regeneration
  useEffect(() => {
    const isVisible = isPreviewVisible || isDialogOpen;
    if (!enabled || !isVisible || !document) {
      return;
    }

    // Clear existing timeout
    if (regenerateTimeoutRef.current) {
      clearTimeout(regenerateTimeoutRef.current);
    }

    // Set new timeout
    regenerateTimeoutRef.current = setTimeout(() => {
      generatePreview();
    }, debounceMs);

    // Cleanup
    return () => {
      if (regenerateTimeoutRef.current) {
        clearTimeout(regenerateTimeoutRef.current);
      }
    };
  }, [enabled, isPreviewVisible, isDialogOpen, document, debounceMs, generatePreview]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      cleanupBlobUrl();
      if (regenerateTimeoutRef.current) {
        clearTimeout(regenerateTimeoutRef.current);
      }
    };
  }, [cleanupBlobUrl]);

  return {
    previewUrl,
    isGenerating,
    isPreviewVisible,
    isDialogOpen,
    previewMode,
    setPreviewMode,
    showPreview,
    hidePreview,
    togglePreview,
    openInNewTab,
    regeneratePreview,
  };
}
