'use client';

import { useState, useCallback, useRef } from 'react';
import { FileText, Upload, X, FileWarning, CheckCircle2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button, Input } from '@/app/ui/primitives';
import { importFromDocx, isValidDocxFile, parseDocumentResponse } from '@/lib/api';
import type { DocxImportMetadata } from '@/lib/api';
import type { Document } from '@/lib/types/document.types';

interface ImportDocxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (document: Document) => void;
}

type ImportStatus = 'idle' | 'validating' | 'uploading' | 'success' | 'error';

export function ImportDocxDialog({ open, onOpenChange, onSuccess }: ImportDocxDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [status, setStatus] = useState<ImportStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<DocxImportMetadata | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when dialog opens/closes
  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      // Reset all state when closing
      setFile(null);
      setCustomTitle('');
      setStatus('idle');
      setError(null);
      setMetadata(null);
      setIsDragging(false);
    }
    onOpenChange(isOpen);
  }

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setError(null);
      return;
    }

    setStatus('validating');
    const validation = isValidDocxFile(selectedFile);

    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      setFile(null);
      setStatus('error');
      return;
    }

    setFile(selectedFile);
    setError(null);
    setStatus('idle');
    // Set default title from filename
    const defaultTitle = selectedFile.name.replace(/\.docx?$/i, '');
    setCustomTitle(defaultTitle);
  }, []);

  // Handle file input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0] || null;
      handleFileSelect(selectedFile);
    },
    [handleFileSelect]
  );

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  // Handle import
  async function handleImport() {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setStatus('uploading');
    setError(null);

    try {
      const result = await importFromDocx(file, customTitle || undefined);

      if (!result.success || !result.document) {
        setError(result.errorMessage || 'Import failed');
        setStatus('error');
        return;
      }

      setMetadata(result.metadata || null);
      setStatus('success');

      // Parse the response and call onSuccess
      const parsedDocument = parseDocumentResponse(result.document);

      // Short delay to show success state before closing
      setTimeout(() => {
        onSuccess?.(parsedDocument);
        handleOpenChange(false);
      }, 1000);
    } catch (err) {
      console.error('Failed to import DOCX:', err);
      setError(err instanceof Error ? err.message : 'Failed to import file. Please try again.');
      setStatus('error');
    }
  }

  // Clear selected file
  function handleClearFile() {
    setFile(null);
    setCustomTitle('');
    setError(null);
    setStatus('idle');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent size='default'>
        <DialogHeader hero icon={<FileText className='h-6 w-6' />} title='Import from Word' variant='primary'>
          <DialogTitle>Import from Word</DialogTitle>
          <DialogDescription>
            Upload a Word document (.docx) to convert it into an editable document in the builder. Formatting, text, tables, and images will be preserved.
          </DialogDescription>
        </DialogHeader>

        <div className='p-5 space-y-4'>
          {/* Drop zone */}
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-8 transition-all duration-200
              ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : file
                  ? 'border-outline-variant bg-surface-container-lowest'
                  : 'border-outline-variant hover:border-primary hover:bg-surface-container-lowest'
              }
              ${status === 'error' ? 'border-error bg-error-container/20' : ''}
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type='file'
              accept='.docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword'
              onChange={handleInputChange}
              className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
              disabled={status === 'uploading' || status === 'success'}
            />

            {!file ? (
              <div className='flex flex-col items-center text-center'>
                <div className='w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3'>
                  <Upload className='h-6 w-6 text-primary' />
                </div>
                <p className='text-sm font-medium text-on-surface mb-1'>Drop your Word document here</p>
                <p className='text-xs text-on-surface-variant'>or click to browse • .docx files only • Max 50MB</p>
              </div>
            ) : (
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0'>
                  <FileText className='h-6 w-6 text-primary' />
                </div>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium text-on-surface truncate'>{file.name}</p>
                  <p className='text-xs text-on-surface-variant'>{formatFileSize(file.size)}</p>
                </div>
                {status === 'idle' && (
                  <button
                    type='button'
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearFile();
                    }}
                    className='p-2 rounded-lg hover:bg-surface-container-high transition-colors'
                  >
                    <X className='h-4 w-4 text-on-surface-variant' />
                  </button>
                )}
                {status === 'uploading' && <Loader2 className='h-5 w-5 text-primary animate-spin' />}
                {status === 'success' && <CheckCircle2 className='h-5 w-5 text-primary' />}
              </div>
            )}
          </div>

          {/* Custom title input */}
          {file && status !== 'success' && (
            <Input
              label='Document Title'
              placeholder='Enter a title for the imported document'
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              disabled={status === 'uploading'}
            />
          )}

          {/* Error message */}
          {error && (
            <div className='p-3 rounded-xl bg-error-container/50 border border-error/20 flex items-start gap-3'>
              <FileWarning className='h-5 w-5 text-on-error-container shrink-0 mt-0.5' />
              <div>
                <p className='text-sm font-medium text-on-error-container'>Import Error</p>
                <p className='text-sm text-on-error-container/80'>{error}</p>
              </div>
            </div>
          )}

          {/* Success message with metadata */}
          {status === 'success' && metadata && (
            <div className='p-4 rounded-xl bg-primary/5 border border-primary/20'>
              <div className='flex items-center gap-2 mb-3'>
                <CheckCircle2 className='h-5 w-5 text-primary' />
                <p className='text-sm font-medium text-on-surface'>Import Successful!</p>
              </div>

              {/* Primary metrics */}
              <div className='grid grid-cols-5 gap-3 text-center'>
                <div>
                  <p className='text-xl font-bold text-primary'>{metadata.paragraphCount}</p>
                  <p className='text-xs text-on-surface-variant'>Paragraphs</p>
                </div>
                <div>
                  <p className='text-xl font-bold text-primary'>{metadata.tableCount}</p>
                  <p className='text-xs text-on-surface-variant'>Tables</p>
                </div>
                <div>
                  <p className='text-xl font-bold text-primary'>{metadata.imageCount}</p>
                  <p className='text-xs text-on-surface-variant'>Images</p>
                </div>
                <div>
                  <p className='text-xl font-bold text-primary'>{metadata.listCount}</p>
                  <p className='text-xs text-on-surface-variant'>Lists</p>
                </div>
                <div>
                  <p className='text-xl font-bold text-primary'>{metadata.hyperlinkCount}</p>
                  <p className='text-xs text-on-surface-variant'>Links</p>
                </div>
              </div>

              {/* Secondary metrics - Document features */}
              <div className='mt-3 pt-3 border-t border-primary/10'>
                <div className='flex flex-wrap gap-2 text-xs text-on-surface-variant'>
                  {metadata.hasHeaders && <span className='px-2 py-1 rounded-full bg-primary/10 text-primary'>✓ Headers</span>}
                  {metadata.hasFooters && <span className='px-2 py-1 rounded-full bg-primary/10 text-primary'>✓ Footers</span>}
                  {metadata.hasWatermark && <span className='px-2 py-1 rounded-full bg-primary/10 text-primary'>✓ Watermark</span>}
                  {metadata.pageBreakCount > 0 && (
                    <span className='px-2 py-1 rounded-full bg-surface-container'>
                      {metadata.pageBreakCount} Page Break{metadata.pageBreakCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {metadata.sectionCount > 1 && (
                    <span className='px-2 py-1 rounded-full bg-surface-container'>
                      {metadata.sectionCount} Section{metadata.sectionCount !== 1 ? 's' : ''}
                    </span>
                  )}
                  {metadata.mergedCellCount > 0 && (
                    <span className='px-2 py-1 rounded-full bg-surface-container'>
                      {metadata.mergedCellCount} Merged Cell{metadata.mergedCellCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              {/* Tertiary metrics - Advanced elements */}
              {(metadata.textBoxCount > 0 ||
                metadata.footnoteCount > 0 ||
                metadata.endnoteCount > 0 ||
                metadata.bookmarkCount > 0 ||
                metadata.commentCount > 0 ||
                metadata.shapeCount > 0) && (
                <div className='mt-3 pt-3 border-t border-primary/10'>
                  <p className='text-xs text-on-surface-variant mb-2'>Advanced Elements:</p>
                  <div className='flex flex-wrap gap-2 text-xs text-on-surface-variant'>
                    {metadata.textBoxCount > 0 && (
                      <span className='px-2 py-1 rounded-full bg-surface-container'>
                        {metadata.textBoxCount} Text Box{metadata.textBoxCount !== 1 ? 'es' : ''}
                      </span>
                    )}
                    {metadata.shapeCount > 0 && (
                      <span className='px-2 py-1 rounded-full bg-surface-container'>
                        {metadata.shapeCount} Shape{metadata.shapeCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {metadata.footnoteCount > 0 && (
                      <span className='px-2 py-1 rounded-full bg-surface-container'>
                        {metadata.footnoteCount} Footnote{metadata.footnoteCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {metadata.endnoteCount > 0 && (
                      <span className='px-2 py-1 rounded-full bg-surface-container'>
                        {metadata.endnoteCount} Endnote{metadata.endnoteCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {metadata.bookmarkCount > 0 && (
                      <span className='px-2 py-1 rounded-full bg-surface-container'>
                        {metadata.bookmarkCount} Bookmark{metadata.bookmarkCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {metadata.commentCount > 0 && (
                      <span className='px-2 py-1 rounded-full bg-surface-container'>
                        {metadata.commentCount} Comment{metadata.commentCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Professional Content - Equations, Charts, SmartArt */}
              {(metadata.equationCount > 0 || metadata.chartCount > 0 || metadata.smartArtCount > 0 || metadata.embeddedObjectCount > 0) && (
                <div className='mt-3 pt-3 border-t border-primary/10'>
                  <p className='text-xs text-on-surface-variant mb-2'>Professional Content:</p>
                  <div className='flex flex-wrap gap-2 text-xs text-on-surface-variant'>
                    {metadata.equationCount > 0 && (
                      <span className='px-2 py-1 rounded-full bg-tertiary/10 text-tertiary'>
                        {metadata.equationCount} Equation{metadata.equationCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {metadata.chartCount > 0 && (
                      <span className='px-2 py-1 rounded-full bg-tertiary/10 text-tertiary'>
                        {metadata.chartCount} Chart{metadata.chartCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {metadata.smartArtCount > 0 && (
                      <span className='px-2 py-1 rounded-full bg-tertiary/10 text-tertiary'>{metadata.smartArtCount} SmartArt</span>
                    )}
                    {metadata.embeddedObjectCount > 0 && (
                      <span className='px-2 py-1 rounded-full bg-tertiary/10 text-tertiary'>
                        {metadata.embeddedObjectCount} Embedded Object{metadata.embeddedObjectCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Forms & Interactive Elements */}
              {(metadata.formFieldCount > 0 || metadata.contentControlCount > 0) && (
                <div className='mt-3 pt-3 border-t border-primary/10'>
                  <p className='text-xs text-on-surface-variant mb-2'>Form Elements:</p>
                  <div className='flex flex-wrap gap-2 text-xs text-on-surface-variant'>
                    {metadata.formFieldCount > 0 && (
                      <span className='px-2 py-1 rounded-full bg-secondary/10 text-secondary'>
                        {metadata.formFieldCount} Form Field{metadata.formFieldCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {metadata.contentControlCount > 0 && (
                      <span className='px-2 py-1 rounded-full bg-secondary/10 text-secondary'>
                        {metadata.contentControlCount} Content Control{metadata.contentControlCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* References & Navigation */}
              {(metadata.hasTableOfContents || metadata.citationCount > 0 || metadata.bibliographySourceCount > 0) && (
                <div className='mt-3 pt-3 border-t border-primary/10'>
                  <p className='text-xs text-on-surface-variant mb-2'>References:</p>
                  <div className='flex flex-wrap gap-2 text-xs text-on-surface-variant'>
                    {metadata.hasTableOfContents && <span className='px-2 py-1 rounded-full bg-primary/10 text-primary'>✓ Table of Contents</span>}
                    {metadata.citationCount > 0 && (
                      <span className='px-2 py-1 rounded-full bg-surface-container'>
                        {metadata.citationCount} Citation{metadata.citationCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {metadata.bibliographySourceCount > 0 && (
                      <span className='px-2 py-1 rounded-full bg-surface-container'>
                        {metadata.bibliographySourceCount} Bibliography Source{metadata.bibliographySourceCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Document Styles & Theme */}
              {(metadata.styleCount > 0 || metadata.theme || metadata.revisionCount > 0 || metadata.hasCustomXml) && (
                <div className='mt-3 pt-3 border-t border-primary/10'>
                  <p className='text-xs text-on-surface-variant mb-2'>Document Styling:</p>
                  <div className='flex flex-wrap gap-2 text-xs text-on-surface-variant'>
                    {metadata.theme?.name && <span className='px-2 py-1 rounded-full bg-primary/10 text-primary'>Theme: {metadata.theme.name}</span>}
                    {metadata.styleCount > 0 && (
                      <span className='px-2 py-1 rounded-full bg-surface-container'>
                        {metadata.styleCount} Style{metadata.styleCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {metadata.revisionCount > 0 && (
                      <span className='px-2 py-1 rounded-full bg-warning/10 text-warning'>
                        {metadata.revisionCount} Tracked Change{metadata.revisionCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {metadata.hasCustomXml && <span className='px-2 py-1 rounded-full bg-surface-container'>Custom XML Data</span>}
                  </div>
                </div>
              )}

              {/* Document properties */}
              {metadata.documentProperties && (metadata.documentProperties.creator || metadata.documentProperties.words) && (
                <div className='mt-3 pt-3 border-t border-primary/10'>
                  <p className='text-xs text-on-surface-variant mb-2'>Document Info:</p>
                  <div className='flex flex-wrap gap-3 text-xs text-on-surface-variant'>
                    {metadata.documentProperties.creator && (
                      <span>
                        Author: <strong>{metadata.documentProperties.creator}</strong>
                      </span>
                    )}
                    {metadata.documentProperties.words && <span>{metadata.documentProperties.words.toLocaleString()} words</span>}
                    {metadata.documentProperties.pages && (
                      <span>
                        {metadata.documentProperties.pages} page{metadata.documentProperties.pages !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {metadata.warnings && metadata.warnings.length > 0 && (
                <div className='mt-3 pt-3 border-t border-primary/10'>
                  <p className='text-xs text-on-surface-variant'>{metadata.warnings.length} warning(s) during import</p>
                </div>
              )}
            </div>
          )}

          {/* Info box */}
          {!file && !error && (
            <div className='p-3 rounded-xl bg-surface-container-low border border-outline-variant/50'>
              <p className='text-xs text-on-surface-variant mb-2'>
                <strong>Comprehensive DOCX Support:</strong>
              </p>
              <ul className='text-xs text-on-surface-variant space-y-1 ml-3'>
                <li>• Text formatting (bold, italic, underline, strikethrough, colors, fonts)</li>
                <li>• Paragraph spacing, line height, indentation, borders, drop caps</li>
                <li>• Headings, bullet/numbered lists, hyperlinks, bookmarks</li>
                <li>• Tables with merged cells, column widths, cell backgrounds</li>
                <li>• Headers/footers with page numbers, text boxes, shapes</li>
                <li>• Images, watermarks, footnotes, endnotes, comments</li>
                <li>• Math equations, charts, SmartArt diagrams</li>
                <li>• Form fields, content controls, tracked changes</li>
                <li>• Table of contents, citations, bibliography</li>
                <li>• Document themes, styles, embedded objects</li>
              </ul>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => handleOpenChange(false)} disabled={status === 'uploading'}>
            Cancel
          </Button>
          <Button
            type='button'
            variant='filled'
            onClick={handleImport}
            disabled={!file || status === 'uploading' || status === 'success'}
            loading={status === 'uploading'}
          >
            {status === 'success' ? 'Done' : 'Import Document'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
