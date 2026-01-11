'use client';

import { X, Loader2, RefreshCw } from 'lucide-react';
import { IconButton, Tooltip } from '@/app/ui/primitives';

interface PdfPreviewPanelProps {
  /** URL to the PDF blob */
  previewUrl: string | null;
  /** Whether preview is currently being generated */
  isGenerating: boolean;
  /** Callback when close button is clicked */
  onClose: () => void;
  /** Callback to manually refresh the preview */
  onRefresh?: () => void;
}

export function PdfPreviewPanel({ previewUrl, isGenerating, onClose, onRefresh }: PdfPreviewPanelProps) {
  return (
    <div className="flex h-full w-125 min-w-100 flex-col border-l border-outline-variant/25 bg-surface-container">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b border-outline-variant/25 px-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-on-surface">PDF Preview</span>
          {isGenerating && (
            <div className="flex items-center gap-1 text-xs text-on-surface-variant">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Generating...</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onRefresh && (
            <Tooltip content="Refresh preview">
              <IconButton
                variant="ghost"
                size="sm"
                aria-label="Refresh preview"
                onClick={onRefresh}
                disabled={isGenerating}
                icon={<RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />}
              />
            </Tooltip>
          )}
          <Tooltip content="Close preview">
            <IconButton variant="ghost" size="sm" aria-label="Close preview" onClick={onClose} icon={<X className="h-4 w-4" />} />
          </Tooltip>
        </div>
      </div>

      {/* Preview content */}
      <div className="relative flex-1 overflow-hidden bg-surface-container-low">
        {previewUrl ? (
          <iframe src={`${previewUrl}#toolbar=0&navpanes=0`} className="h-full w-full border-0" title="PDF Preview" />
        ) : (
          <div className="flex h-full items-center justify-center">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm">Generating preview...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                <span className="text-sm">No preview available</span>
                {onRefresh && (
                  <button onClick={onRefresh} className="text-sm text-primary hover:underline">
                    Generate preview
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Loading overlay when regenerating */}
        {isGenerating && previewUrl && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/50 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2 rounded-lg bg-surface-container p-4 shadow-lg">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm text-on-surface-variant">Updating preview...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
