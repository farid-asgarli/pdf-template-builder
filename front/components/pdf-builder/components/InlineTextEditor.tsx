'use client';

import { useRef, useEffect, useCallback, useState, CSSProperties } from 'react';

export interface InlineTextEditorProps {
  /** Current text value */
  value: string;
  /** Callback when text is saved (blur or Enter for single-line) */
  onSave: (value: string) => void;
  /** Callback when editing is cancelled (Escape) */
  onCancel: () => void;
  /** Whether this is a multi-line editor (textarea behavior) */
  multiline?: boolean;
  /** Placeholder when empty */
  placeholder?: string;
  /** Custom styles to apply to the editor */
  style?: CSSProperties;
  /** Additional class names */
  className?: string;
}

/**
 * Inline text editor component for editing text directly on the canvas.
 * Uses contentEditable for seamless visual editing experience.
 *
 * Features:
 * - Double-click to activate (handled by parent)
 * - Blur or Enter (single-line) to save
 * - Escape to cancel without saving
 * - Maintains cursor position
 * - Supports both single-line and multi-line modes
 */
export function InlineTextEditor({ value, onSave, onCancel, multiline = false, placeholder = '', style, className = '' }: InlineTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [localValue, setLocalValue] = useState(value);
  const isComposingRef = useRef(false);
  const hasChangedRef = useRef(false);

  // Focus and select all text on mount
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    // Set initial content
    editor.textContent = value;

    // Focus the editor
    editor.focus();

    // Select all text
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editor);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, [value]);

  // Handle input changes
  const handleInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const newValue = editor.textContent || '';
    setLocalValue(newValue);
    hasChangedRef.current = newValue !== value;
  }, [value]);

  // Save the current value
  const save = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const newValue = editor.textContent || '';
    if (newValue !== value) {
      onSave(newValue);
    } else {
      onCancel();
    }
  }, [value, onSave, onCancel]);

  // Cancel editing
  const cancel = useCallback(() => {
    onCancel();
  }, [onCancel]);

  // Handle key events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Escape always cancels
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        cancel();
        return;
      }

      // Enter behavior depends on multiline mode
      if (e.key === 'Enter') {
        if (!multiline || (multiline && (e.metaKey || e.ctrlKey))) {
          // Single-line: Enter saves
          // Multi-line: Cmd/Ctrl+Enter saves
          e.preventDefault();
          e.stopPropagation();
          save();
          return;
        }
        // Multi-line: regular Enter adds newline (default behavior)
      }

      // Prevent keyboard shortcuts from propagating during editing
      if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.stopPropagation();
      }
    },
    [multiline, save, cancel]
  );

  // Handle blur
  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      // Don't save if we're in the middle of IME composition
      if (isComposingRef.current) return;

      // Check if the new focus target is within the editor
      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (editorRef.current?.contains(relatedTarget)) return;

      save();
    },
    [save]
  );

  // Handle IME composition
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
    handleInput();
  }, [handleInput]);

  // Prevent drag events during editing
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Handle paste - strip formatting
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');

      // Insert plain text at cursor position
      const selection = window.getSelection();
      if (!selection?.rangeCount) return;

      const range = selection.getRangeAt(0);
      range.deleteContents();

      // For single-line, remove newlines
      const cleanText = multiline ? text : text.replace(/[\r\n]+/g, ' ');
      const textNode = document.createTextNode(cleanText);
      range.insertNode(textNode);

      // Move cursor to end of inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);

      handleInput();
    },
    [multiline, handleInput]
  );

  // Stop click propagation to prevent selection changes
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const isEmpty = !localValue;

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      role='textbox'
      aria-multiline={multiline}
      aria-placeholder={placeholder}
      className={`outline-none cursor-text ${className}`}
      style={{
        ...style,
        minHeight: '1em',
        whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
        wordBreak: 'break-word',
        // Show placeholder via CSS when empty
        ...(isEmpty && placeholder
          ? {
              position: 'relative',
            }
          : {}),
      }}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onDragStart={handleDragStart}
      onPaste={handlePaste}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      data-placeholder={isEmpty ? placeholder : undefined}
    />
  );
}
