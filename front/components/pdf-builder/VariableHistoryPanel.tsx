'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  IconButton,
  Badge,
  Tooltip,
  PageLoading,
  EmptyState,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/app/ui/primitives';
import { toast } from '@/app/ui/primitives/feedback/Toast';
import { History, Download, Trash2, ChevronLeft, ChevronRight, User, FileText, Hash, Eye, Loader2, X } from 'lucide-react';
import type { VariableHistoryRecord } from '@/lib/types/variable.types';
import { fetchDocumentHistory, regenerateFromHistory, deleteHistoryVersion, downloadBlob, ApiError } from '@/lib/utils/api';

interface VariableHistoryPanelProps {
  /** Document ID */
  documentId: string;
  /** Document title for filenames */
  documentTitle: string;
  /** Callback to close the panel */
  onClose?: () => void;
}

/**
 * Panel for viewing and managing variable history.
 * Supports viewing past generations, regenerating PDFs, and deleting records.
 */
export function VariableHistoryPanel({ documentId, documentTitle, onClose }: VariableHistoryPanelProps) {
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<VariableHistoryRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Selected record for detail view
  const [selectedRecord, setSelectedRecord] = useState<VariableHistoryRecord | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<VariableHistoryRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load history
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoading(true);
      try {
        const response = await fetchDocumentHistory(documentId, page, pageSize);
        setRecords(response.records);
        setTotalCount(response.totalCount);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Failed to load history';
        toast.error('Error', { description: message });
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, [documentId, page]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetchDocumentHistory(documentId, page, pageSize);
      setRecords(response.records);
      setTotalCount(response.totalCount);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to load history';
      toast.error('Error', { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = async (record: VariableHistoryRecord) => {
    setIsRegenerating(record.version);
    try {
      const blob = await regenerateFromHistory(documentId, record.version);
      const filename = `${documentTitle || 'document'}_v${record.version}.pdf`;
      downloadBlob(blob, filename);
      toast.success('PDF Regenerated', {
        description: `Version ${record.version} downloaded`,
      });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to regenerate PDF';
      toast.error('Error', { description: message });
    } finally {
      setIsRegenerating(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setIsDeleting(true);
    try {
      await deleteHistoryVersion(documentId, deleteConfirm.version);
      toast.success('Deleted', {
        description: `Version ${deleteConfirm.version} removed from history`,
      });
      setDeleteConfirm(null);
      loadHistory();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Failed to delete history record';
      toast.error('Error', { description: message });
    } finally {
      setIsDeleting(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <aside className="flex w-100 flex-col border-l border-outline-variant/20 bg-surface-container-lowest">
      {/* Panel Header */}
      <div className="flex items-center justify-between bg-surface-container-low px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-on-surface flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Generation History
          </h2>
          <p className="text-xs text-on-surface-variant">
            {totalCount} generation{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        {onClose && (
          <Tooltip content="Close history">
            <IconButton variant="ghost" size="sm" aria-label="Close history" onClick={onClose} icon={<X className="h-4 w-4" />} />
          </Tooltip>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <PageLoading message="Loading history..." />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            icon={<History className="h-8 w-8" />}
            title="No history yet"
            description="Generate a PDF with history tracking enabled to see records here."
          />
        ) : (
          <div className="divide-y divide-outline-variant/10">
            {records.map((record) => (
              <HistoryRecordItem
                key={record.id}
                record={record}
                onView={() => setSelectedRecord(record)}
                onRegenerate={() => handleRegenerate(record)}
                onDelete={() => setDeleteConfirm(record)}
                isRegenerating={isRegenerating === record.version}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-outline-variant/20">
          <Button variant="text" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || isLoading}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-on-surface-variant">
            Page {page} of {totalPages}
          </span>
          <Button variant="text" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || isLoading}>
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Detail Dialog */}
      <HistoryDetailDialog
        record={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        onRegenerate={handleRegenerate}
        isRegenerating={isRegenerating === selectedRecord?.version}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete History Record</DialogTitle>
            <DialogDescription>Are you sure you want to delete version {deleteConfirm?.version}? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="text" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="filled" onClick={handleDelete} disabled={isDeleting} className="bg-error text-on-error hover:bg-error/90">
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

interface HistoryRecordItemProps {
  record: VariableHistoryRecord;
  onView: () => void;
  onRegenerate: () => void;
  onDelete: () => void;
  isRegenerating: boolean;
}

function HistoryRecordItem({ record, onView, onRegenerate, onDelete, isRegenerating }: HistoryRecordItemProps) {
  const formattedDate = new Date(record.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const variableCount = Object.keys(record.variables).length;

  return (
    <div className="px-5 py-4 hover:bg-surface-container-low/50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" size="sm">
              v{record.version}
            </Badge>
            <span className="text-xs text-on-surface-variant">{formattedDate}</span>
          </div>

          {record.generatedBy && (
            <div className="flex items-center gap-1 text-xs text-on-surface-variant mb-1">
              <User className="h-3 w-3" />
              {record.generatedBy}
            </div>
          )}

          {record.notes && <p className="text-sm text-on-surface-variant line-clamp-2">{record.notes}</p>}

          <div className="flex items-center gap-3 mt-2 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Hash className="h-3 w-3" />
              {variableCount} variable{variableCount !== 1 ? 's' : ''}
            </span>
            {record.pdfSizeBytes && (
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {formatFileSize(record.pdfSizeBytes)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Tooltip content="View details">
            <IconButton variant="ghost" size="sm" aria-label="View details" onClick={onView} icon={<Eye className="h-4 w-4" />} />
          </Tooltip>
          <Tooltip content="Regenerate PDF">
            <IconButton
              variant="ghost"
              size="sm"
              aria-label="Regenerate PDF"
              onClick={onRegenerate}
              disabled={isRegenerating}
              icon={isRegenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            />
          </Tooltip>
          <Tooltip content="Delete">
            <IconButton variant="ghost" size="sm" aria-label="Delete" onClick={onDelete} icon={<Trash2 className="h-4 w-4 text-error/70" />} />
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

interface HistoryDetailDialogProps {
  record: VariableHistoryRecord | null;
  onClose: () => void;
  onRegenerate: (record: VariableHistoryRecord) => void;
  isRegenerating: boolean;
}

function HistoryDetailDialog({ record, onClose, onRegenerate, isRegenerating }: HistoryDetailDialogProps) {
  if (!record) return null;

  const formattedDate = new Date(record.createdAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <Dialog open={!!record} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Version {record.version}
          </DialogTitle>
          <DialogDescription>{formattedDate}</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Metadata */}
          <div className="grid grid-cols-2 gap-4">
            {record.generatedBy && (
              <div className="p-3 bg-surface-container rounded-lg">
                <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1">
                  <User className="h-3 w-3" />
                  Generated By
                </div>
                <p className="font-medium text-on-surface">{record.generatedBy}</p>
              </div>
            )}
            {record.pdfSizeBytes && (
              <div className="p-3 bg-surface-container rounded-lg">
                <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-1">
                  <FileText className="h-3 w-3" />
                  File Size
                </div>
                <p className="font-medium text-on-surface">{formatFileSize(record.pdfSizeBytes)}</p>
              </div>
            )}
          </div>

          {record.notes && (
            <div className="p-3 bg-surface-container rounded-lg">
              <div className="text-xs text-on-surface-variant mb-1">Notes</div>
              <p className="text-on-surface">{record.notes}</p>
            </div>
          )}

          {/* Variables */}
          <div>
            <h4 className="text-sm font-medium text-on-surface mb-2">Variables ({Object.keys(record.variables).length})</h4>
            <div className="bg-surface-container rounded-lg overflow-hidden">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-surface-container-high">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium text-on-surface-variant">Variable</th>
                      <th className="text-left px-4 py-2 font-medium text-on-surface-variant">Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {Object.entries(record.variables).map(([key, value]) => (
                      <tr key={key}>
                        <td className="px-4 py-2 font-mono text-xs text-primary">{key}</td>
                        <td className="px-4 py-2 text-on-surface">{formatVariableValue(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="text" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onRegenerate(record)} disabled={isRegenerating}>
            {isRegenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Regenerating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Regenerate PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Format file size in human readable format.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format a variable value for display.
 */
function formatVariableValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
