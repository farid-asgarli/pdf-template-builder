'use client';

import type { Component, ParagraphProperties, TextDecoration, TextDecorationStyle } from '@/lib/types/document.types';
import { CSSProperties, useMemo } from 'react';

interface ParagraphProps {
  component: Component;
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
const decorationStyleMap: Record<TextDecorationStyle, string> = {
  solid: 'solid',
  double: 'double',
  wavy: 'wavy',
  dotted: 'dotted',
  dashed: 'dashed',
};

export function Paragraph({ component }: ParagraphProps) {
  const props = component.properties as ParagraphProperties;

  const containerStyle = useMemo<CSSProperties>(() => {
    const baseStyle: CSSProperties = {
      fontFamily: props.fontFamily || 'Inter',
      fontSize: `${props.fontSize || 11}px`,
      fontWeight: fontWeightMap[props.fontWeight] || 400,
      fontStyle: props.italic ? 'italic' : 'normal',
      color: props.color || '#000000',
      backgroundColor: props.backgroundColor || 'transparent',
      textAlign: props.textAlign || 'left',
      letterSpacing: props.letterSpacing ? `${props.letterSpacing}em` : 'normal',
      wordSpacing: props.wordSpacing ? `${props.wordSpacing}em` : 'normal',
      lineHeight: props.lineHeight || 1.5,
      textDecorationLine: decorationLineMap[props.decoration] || 'none',
      // Paragraph-specific CSS
      textIndent: props.firstLineIndentation ? `${props.firstLineIndentation}px` : undefined,
    };

    // Add decoration styles only if decoration is active
    if (props.decoration && props.decoration !== 'none') {
      baseStyle.textDecorationStyle = (decorationStyleMap[props.decorationStyle] || 'solid') as CSSProperties['textDecorationStyle'];
      baseStyle.textDecorationColor = props.decorationColor || props.color || '#000000';
    }

    // Add line clamping if specified
    if (props.clampLines && props.clampLines > 0) {
      return {
        ...baseStyle,
        display: '-webkit-box',
        WebkitLineClamp: props.clampLines,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
      };
    }

    return baseStyle;
  }, [props]);

  // We can't perfectly represent paragraphSpacing in CSS for a single paragraph,
  // but we can show it via a custom data attribute for awareness
  return (
    <div className="pointer-events-none h-full w-full overflow-hidden" style={containerStyle} data-paragraph-spacing={props.paragraphSpacing}>
      <p className="whitespace-pre-wrap m-0">{props.content || 'Enter your paragraph text here...'}</p>
    </div>
  );
}
