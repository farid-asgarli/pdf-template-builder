'use client';

import { useRef, useEffect, useCallback, useState, useMemo, CSSProperties } from 'react';
import { tokenizeTemplate, tokensToHtml, hasTemplateSyntax } from '@/lib/utils/templateHighlighter';
import type { VariableDefinition } from '@/lib/types/variable.types';

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
  /** Variable definitions for syntax highlighting validation */
  variables?: VariableDefinition[];
  /** Whether to use dark mode highlighting */
  darkMode?: boolean;
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
 * - Syntax highlighting for template variables (shown on blur)
 */
export function InlineTextEditor({
  value,
  onSave,
  onCancel,
  multiline = false,
  placeholder = '',
  style,
  className = '',
  variables = [],
  darkMode = false,
}: InlineTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [localValue, setLocalValue] = useState(value);
  const [isFocused, setIsFocused] = useState(true);
  const isComposingRef = useRef(false);
  const initializedRef = useRef(false);

  // Generate highlighted HTML for preview mode (only when not focused)
  const highlightedHtml = useMemo(() => {
    if (isFocused || !hasTemplateSyntax(localValue)) {
      return null;
    }
    const tokens = tokenizeTemplate(localValue, variables);
    return tokensToHtml(tokens, darkMode);
  }, [localValue, variables, darkMode, isFocused]);

  // Initialize content on mount only
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const editor = editorRef.current;
    if (!editor) return;

    // Set initial content
    editor.textContent = value;

    // Focus and select all
    editor.focus();
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
    setLocalValue(editor.textContent || '');
  }, []);

  // Save the current value
  const save = useCallback(() => {
    if (localValue !== value) {
      onSave(localValue);
    } else {
      onCancel();
    }
  }, [localValue, value, onSave, onCancel]);

  // Handle key events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCancel();
        return;
      }

      if (e.key === 'Enter') {
        if (!multiline || (multiline && (e.metaKey || e.ctrlKey))) {
          e.preventDefault();
          e.stopPropagation();
          save();
          return;
        }
      }

      // Stop propagation for editing keys
      if (['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.stopPropagation();
      }
    },
    [multiline, save, onCancel]
  );

  // Handle focus
  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  // Handle blur
  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      if (isComposingRef.current) return;

      const relatedTarget = e.relatedTarget as HTMLElement | null;
      if (editorRef.current?.contains(relatedTarget)) return;

      setIsFocused(false);
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

  // Prevent drag
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Handle paste - strip formatting
  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');

      const selection = window.getSelection();
      if (!selection?.rangeCount) return;

      const range = selection.getRangeAt(0);
      range.deleteContents();

      const cleanText = multiline ? text : text.replace(/[\r\n]+/g, ' ');
      const textNode = document.createTextNode(cleanText);
      range.insertNode(textNode);

      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);

      handleInput();
    },
    [multiline, handleInput]
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  // Click on preview to focus editor
  const handlePreviewClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFocused(true);
    // Focus editor after state update
    setTimeout(() => {
      editorRef.current?.focus();
    }, 0);
  }, []);

  const isEmpty = !localValue;

  const baseStyle: CSSProperties = {
    ...style,
    minHeight: '1em',
    whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
    wordBreak: 'break-word',
    ...(isEmpty && placeholder ? { position: 'relative' as const } : {}),
  };

  // Show highlighted preview when not focused and has template syntax
  if (highlightedHtml && !isFocused) {
    return (
      <div
        className={`outline-none cursor-text ${className}`}
        style={baseStyle}
        onClick={handlePreviewClick}
        onMouseDown={handleMouseDown}
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    );
  }

  // Show plain editor (always when focused, or when no template syntax)
  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline={multiline}
      aria-placeholder={placeholder}
      className={`outline-none cursor-text ${className}`}
      style={baseStyle}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
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
