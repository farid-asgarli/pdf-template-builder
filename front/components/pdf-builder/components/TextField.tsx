'use client';

import type { Component, TextFieldProperties, FontWeight } from '@/lib/types/document.types';
import { CSSProperties, useMemo } from 'react';

interface TextFieldProps {
  component: Component;
}

// Maps our font weight values to CSS font weight values
const fontWeightMap: Record<FontWeight, number> = {
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

export function TextField({ component }: TextFieldProps) {
  const props = component.properties as TextFieldProperties;

  // Support both new and legacy padding properties
  const paddingVertical = props.inputPaddingVertical ?? props.inputPadding ?? 4;
  const paddingHorizontal = props.inputPaddingHorizontal ?? props.inputPadding ?? 6;

  const labelStyle = useMemo<CSSProperties>(
    () => ({
      fontFamily: props.labelFontFamily || props.fontFamily || 'Inter',
      fontSize: `${props.labelFontSize || 10}px`,
      fontWeight: fontWeightMap[props.labelFontWeight] || 400,
      color: props.labelColor || '#666666',
    }),
    [props.labelFontFamily, props.fontFamily, props.labelFontSize, props.labelFontWeight, props.labelColor]
  );

  const inputStyle = useMemo<CSSProperties>(
    () => ({
      fontFamily: props.fontFamily || 'Inter',
      fontSize: `${Math.min(props.fontSize || 12, 14)}px`,
      minHeight: `${props.inputHeight || 8}mm`,
      paddingTop: `${paddingVertical}px`,
      paddingBottom: `${paddingVertical}px`,
      paddingLeft: `${paddingHorizontal}px`,
      paddingRight: `${paddingHorizontal}px`,
      borderWidth: `${props.borderWidth || 1}px`,
      borderStyle: 'solid',
      borderColor: props.borderColor || '#000000',
      borderRadius: `${props.borderRadius || 0}px`,
      backgroundColor: props.backgroundColor || 'transparent',
      color: props.placeholderColor || '#999999',
      width: props.fullWidth !== false ? '100%' : 'auto',
    }),
    [
      props.fontFamily,
      props.fontSize,
      props.inputHeight,
      paddingVertical,
      paddingHorizontal,
      props.borderWidth,
      props.borderColor,
      props.borderRadius,
      props.backgroundColor,
      props.placeholderColor,
      props.fullWidth,
    ]
  );

  // Spacing between label and input
  const labelSpacing = props.labelSpacing ?? 2;

  return (
    <div className="pointer-events-none flex h-full w-full flex-col overflow-hidden p-0.5">
      {/* Label */}
      <div
        className="flex shrink-0 items-center gap-0.5 overflow-hidden leading-tight"
        style={{
          ...labelStyle,
          marginBottom: `${labelSpacing}px`,
        }}
      >
        <span className="truncate">{props.label || 'Field Label'}</span>
        {props.required && <span className="shrink-0 text-error">*</span>}
      </div>
      {/* Input representation */}
      <div className="flex min-h-0 flex-1 items-center overflow-hidden" style={inputStyle}>
        <span className="truncate">{props.placeholder || ''}</span>
      </div>
    </div>
  );
}
