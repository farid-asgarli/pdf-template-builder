'use client';

import type { Component, TextLabelProperties, TextDecoration, TextDecorationStyle, TextAlign } from '@/lib/types/document.types';
import { CSSProperties, useMemo, useCallback } from 'react';
import { InlineTextEditor } from './InlineTextEditor';

interface TextLabelProps {
  component: Component;
  /** Whether the component is in inline edit mode */
  isEditing?: boolean;
  /** Callback when text is saved from inline editing */
  onTextSave?: (value: string) => void;
  /** Callback when inline editing is cancelled */
  onEditCancel?: () => void;
}

// Maps our font weight values to CSS font weight values
const fontWeightMap: Record<string, number> = {
  thin: 100,
  extralight: 200,
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
  black: 900,
};

// Maps decoration type to CSS text-decoration-line value
const decorationLineMap: Record<TextDecoration, string> = {
  none: 'none',
  underline: 'underline',
  strikethrough: 'line-through',
  overline: 'overline',
};

// Maps decoration style to CSS text-decoration-style value
const decorationStyleMap: Record<TextDecorationStyle, CSSProperties['textDecorationStyle']> = {
  solid: 'solid',
  double: 'double',
  wavy: 'wavy',
  dotted: 'dotted',
  dashed: 'dashed',
};

// Maps text alignment to CSS justify-content for flex container
const alignmentJustifyMap: Record<TextAlign, string> = {
  left: 'flex-start',
  center: 'center',
  right: 'flex-end',
  justify: 'flex-start', // justify uses text-align: justify instead
};

export function TextLabel({ component, isEditing, onTextSave, onEditCancel }: TextLabelProps) {
  const props = component.properties as TextLabelProperties;

  const containerStyle = useMemo<CSSProperties>(() => {
    const textAlign = props.textAlign || 'left';

    return {
      fontFamily: props.fontFamily || 'Inter',
      fontSize: `${props.fontSize || 12}px`,
      fontWeight: fontWeightMap[props.fontWeight] || 400,
      fontStyle: props.italic ? 'italic' : 'normal',
      color: props.color || '#000000',
      backgroundColor: props.backgroundColor || 'transparent',
      textAlign: textAlign,
      justifyContent: alignmentJustifyMap[textAlign] || 'flex-start',
      letterSpacing: props.letterSpacing ? `${props.letterSpacing}em` : 'normal',
      wordSpacing: props.wordSpacing ? `${props.wordSpacing}em` : 'normal',
      lineHeight: props.lineHeight || 1,
      textDecorationLine: decorationLineMap[props.decoration] || 'none',
      textDecorationStyle: props.decoration !== 'none' ? decorationStyleMap[props.decorationStyle] || 'solid' : undefined,
      textDecorationColor: props.decoration !== 'none' ? props.decorationColor || props.color || '#000000' : undefined,
      textDecorationThickness: props.decoration !== 'none' ? `${props.decorationThickness || 1}px` : undefined,
    };
  }, [props]);

  // Handle text save from inline editor
  const handleTextSave = useCallback(
    (value: string) => {
      onTextSave?.(value);
    },
    [onTextSave]
  );

  // Handle edit cancel
  const handleEditCancel = useCallback(() => {
    onEditCancel?.();
  }, [onEditCancel]);

  // If in editing mode, show the inline editor
  if (isEditing && onTextSave && onEditCancel) {
    return (
      <div
        className='flex h-full w-full items-center overflow-visible'
        style={{
          ...containerStyle,
          // Remove pointer-events-none for editing
        }}
      >
        <InlineTextEditor
          value={props.content || ''}
          onSave={handleTextSave}
          onCancel={handleEditCancel}
          multiline={false}
          placeholder='Text Label'
          style={{
            width: '100%',
            fontFamily: 'inherit',
            fontSize: 'inherit',
            fontWeight: 'inherit',
            fontStyle: 'inherit',
            color: 'inherit',
            letterSpacing: 'inherit',
            lineHeight: 'inherit',
            textDecorationLine: 'inherit',
            textDecorationStyle: 'inherit',
            textDecorationColor: 'inherit',
          }}
        />
      </div>
    );
  }

  return (
    <div className='pointer-events-none flex h-full w-full items-center overflow-hidden' style={containerStyle}>
      <span className='truncate'>{props.content || 'Text Label'}</span>
    </div>
  );
}
