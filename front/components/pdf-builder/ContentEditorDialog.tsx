'use client';

import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogBody, Button } from '@/app/ui/primitives';
import { Type, FileText, Save, X } from 'lucide-react';
import { VariableTextEditor } from './VariableTextEditor';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface ContentEditorDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback to close the dialog */
  onOpenChange: (open: boolean) => void;
  /** Current content value */
  value: string;
  /** Callback when content is saved */
  onSave: (value: string) => void;
  /** Editor mode: 'single-line' for text labels, 'multi-line' for paragraphs */
  mode?: 'single-line' | 'multi-line';
  /** Title for the dialog */
  title?: string;
  /** Description for the dialog */
  description?: string;
  /** Placeholder text for the editor */
  placeholder?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Dialog for editing text content with variable support.
 * Provides a full-featured Monaco editor experience with ample space
 * for autocomplete, syntax highlighting, and variable insertion.
 */
export function ContentEditorDialog({
  open,
  onOpenChange,
  value,
  onSave,
  mode = 'single-line',
  title,
  description,
  placeholder,
}: ContentEditorDialogProps) {
  const [localValue, setLocalValue] = useState(value);
  const [isDirty, setIsDirty] = useState(false);

  // Sync local value when dialog opens
  useEffect(() => {
    if (open) {
      setLocalValue(value);
      setIsDirty(false);
    }
  }, [open, value]);

  // Handle value change
  const handleChange = useCallback((newValue: string) => {
    setLocalValue(newValue);
    setIsDirty(true);
  }, []);

  // Handle save
  const handleSave = useCallback(() => {
    onSave(localValue);
    onOpenChange(false);
  }, [localValue, onSave, onOpenChange]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Cmd/Ctrl + Enter to save (useful for multi-line mode)
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, handleSave]);

  const isMultiLine = mode === 'multi-line';
  const dialogTitle = title || (isMultiLine ? 'Edit Paragraph' : 'Edit Text');
  const dialogDescription =
    description ||
    (isMultiLine
      ? 'Edit your paragraph content. Use {{variableName}} syntax to insert variables.'
      : 'Edit your text content. Use {{variableName}} syntax to insert variables.');
  const placeholderText = placeholder || (isMultiLine ? 'Enter your paragraph text here...' : 'Enter your text here...');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            {isMultiLine ? <FileText className="h-5 w-5 text-primary" /> : <Type className="h-5 w-5 text-primary" />}
            <DialogTitle>{dialogTitle}</DialogTitle>
          </div>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <DialogBody className="flex-1 min-h-0 py-4">
          <div className="h-full flex flex-col gap-3">
            {/* Editor Container - uses VariableTextEditor with its own toolbar */}
            <div className="flex-1 min-h-0">
              <VariableTextEditor
                value={localValue}
                onChange={handleChange}
                placeholder={placeholderText}
                singleLine={!isMultiLine}
                minHeight={isMultiLine ? 200 : 44}
                maxHeight={isMultiLine ? 400 : 44}
              />
            </div>

            {/* Variable syntax help */}
            <div className="p-3 bg-surface-container/50 rounded-lg border border-outline-variant/20">
              <h4 className="text-xs font-semibold text-on-surface-variant mb-2">Variable Syntax Guide</h4>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                <div className="flex items-center gap-1.5">
                  <code className="text-primary font-mono">{'{{variableName}}'}</code>
                  <span className="text-on-surface-variant">Simple variable</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <code className="text-purple-600 font-mono">{'{{date:MM/DD/YYYY}}'}</code>
                  <span className="text-on-surface-variant">Formatted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <code className="text-emerald-600 font-mono">{'{{pageNumber}}'}</code>
                  <span className="text-on-surface-variant">Built-in</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <code className="text-cyan-600 font-mono">{'{{#each items}}...{{/each}}'}</code>
                  <span className="text-on-surface-variant">Loop</span>
                </div>
              </div>
            </div>

            {/* Keyboard shortcut hint */}
            <div className="flex justify-end">
              <span className="text-xs text-on-surface-variant">
                <kbd className="px-1.5 py-0.5 bg-surface-container rounded font-mono text-[10px]">Ctrl+S</kbd> to save
              </span>
            </div>
          </div>
        </DialogBody>

        <DialogFooter className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-on-surface-variant">{isDirty && <span className="text-amber-600">• Unsaved changes</span>}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <X className="h-4 w-4 mr-1.5" />
              Cancel
            </Button>
            <Button variant="filled" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1.5" />
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
