'use client';

import { Loader2, RefreshCw, ExternalLink, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, IconButton, Tooltip, Button } from '@/app/ui/primitives';

interface PdfPreviewDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** URL to the PDF blob */
  previewUrl: string | null;
  /** Whether preview is currently being generated */
  isGenerating: boolean;
  /** Callback to manually refresh the preview */
  onRefresh?: () => void;
  /** Callback to open preview in new tab */
  onOpenInNewTab?: () => void;
}

export function PdfPreviewDialog({ open, onOpenChange, previewUrl, isGenerating, onRefresh, onOpenInNewTab }: PdfPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="full" showClose={false} className="flex flex-col">
        <DialogHeader className="shrink-0 border-b border-outline-variant/20 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DialogTitle>PDF Preview</DialogTitle>
              {isGenerating && (
                <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Generating...</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
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
              {onOpenInNewTab && previewUrl && (
                <Tooltip content="Open in new tab">
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label="Open in new tab"
                    onClick={onOpenInNewTab}
                    icon={<ExternalLink className="h-4 w-4" />}
                  />
                </Tooltip>
              )}
              <Tooltip content="Close">
                <IconButton
                  variant="ghost"
                  size="sm"
                  aria-label="Close preview"
                  onClick={() => onOpenChange(false)}
                  icon={<X className="h-4 w-4" />}
                />
              </Tooltip>
            </div>
          </div>
        </DialogHeader>

        {/* Preview content */}
        <div className="relative flex-1 overflow-hidden bg-surface-container-low">
          {previewUrl ? (
            <iframe src={`${previewUrl}#toolbar=0&navpanes=0`} className="h-full w-full border-0" title="PDF Preview" />
          ) : (
            <div className="flex h-full items-center justify-center">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="text-base">Generating preview...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-on-surface-variant">
                  <span className="text-base">No preview available</span>
                  {onRefresh && (
                    <Button variant="tonal" size="sm" onClick={onRefresh}>
                      Generate preview
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Loading overlay when regenerating */}
          {isGenerating && previewUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/60 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 rounded-2xl bg-surface-container p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-on-surface-variant">Updating preview...</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
