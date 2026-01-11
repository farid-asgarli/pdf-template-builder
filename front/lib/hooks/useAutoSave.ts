// Auto-save hook for PDF Builder
// Automatically saves document changes with debouncing

import { useEffect, useRef, useCallback } from 'react';
import { useDocumentStore } from '@/lib/store/documentStore';
import { updateDocument, serializeDocumentContent, ApiError } from '@/lib/utils/api';
import { toast } from '@/app/ui/primitives';

interface UseAutoSaveOptions {
  /** Delay in milliseconds before saving (default: 2000ms) */
  debounceMs?: number;
  /** Whether auto-save is enabled */
  enabled?: boolean;
  /** Callback when save starts */
  onSaveStart?: () => void;
  /** Callback when save succeeds */
  onSaveSuccess?: () => void;
  /** Callback when save fails */
  onSaveError?: (error: Error) => void;
}

export function useAutoSave(options: UseAutoSaveOptions = {}) {
  const { debounceMs = 2000, enabled = true, onSaveStart, onSaveSuccess, onSaveError } = options;

  const { document, isDirty, setDirty, setSaving } = useDocumentStore();

  // Track timeout for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track if we're currently saving to prevent concurrent saves
  const isSavingRef = useRef(false);

  // Track last saved content to avoid unnecessary saves
  const lastSavedContentRef = useRef<string | null>(null);

  // Save function
  const save = useCallback(async () => {
    if (!document || isSavingRef.current) {
      return;
    }

    const currentContent = serializeDocumentContent(document);

    // Skip if content hasn't actually changed
    if (currentContent === lastSavedContentRef.current) {
      return;
    }

    isSavingRef.current = true;
    setSaving(true);
    onSaveStart?.();

    try {
      await updateDocument(document.id, {
        title: document.title,
        content: currentContent,
      });

      lastSavedContentRef.current = currentContent;
      setDirty(false);
      onSaveSuccess?.();
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new Error('Failed to save document');
      onSaveError?.(apiError);

      // Show error toast
      toast.error('Save failed', {
        description: apiError.message,
      });
    } finally {
      isSavingRef.current = false;
      setSaving(false);
    }
  }, [document, setSaving, setDirty, onSaveStart, onSaveSuccess, onSaveError]);

  // Manual save function (bypasses debounce)
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    await save();
  }, [save]);

  // Effect to watch for dirty changes and trigger debounced save
  useEffect(() => {
    if (!enabled || !isDirty || !document) {
      return;
    }

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      save();
    }, debounceMs);

    // Cleanup on unmount or dependency change
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [enabled, isDirty, document, debounceMs, save]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Save before page unload if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return {
    /** Manually trigger save (bypasses debounce) */
    saveNow,
    /** Whether we're currently saving */
    isSaving: isSavingRef.current,
  };
}
