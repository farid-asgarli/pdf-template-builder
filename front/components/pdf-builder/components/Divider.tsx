'use client';

import type { Component, DividerProperties } from '@/lib/types/document.types';
import { useMemo } from 'react';

interface DividerProps {
  component: Component;
}

/**
 * Converts a dash pattern array to CSS stroke-dasharray format.
 * QuestPDF dash patterns are in points, we scale them for visual preview.
 */
function dashPatternToCSS(pattern?: number[], scale: number = 3): string | undefined {
  if (!pattern || pattern.length === 0) return undefined;
  return pattern.map((v) => v * scale).join(' ');
}

/**
 * Creates a CSS gradient string from an array of colors.
 */
function createGradient(colors: string[], isHorizontal: boolean): string {
  const direction = isHorizontal ? 'to right' : 'to bottom';
  return `linear-gradient(${direction}, ${colors.join(', ')})`;
}

export function Divider({ component }: DividerProps) {
  const props = component.properties as DividerProperties;

  const isHorizontal = props.orientation !== 'vertical';
  const thickness = props.thickness || 1;
  const color = props.color || '#000000';
  const dashPattern = props.dashPattern;
  const gradientColors = props.gradientColors;

  // Determine if we should use SVG (for dash patterns) or simple div (for solid/gradient)
  const hasDashPattern = dashPattern && dashPattern.length >= 2;
  const hasGradient = gradientColors && gradientColors.length >= 2;

  // Use SVG for dash patterns, div for solid/gradient
  const useSVG = hasDashPattern;

  const dashArrayCSS = useMemo(() => dashPatternToCSS(dashPattern), [dashPattern]);

  if (useSVG) {
    // SVG rendering for dash patterns
    return (
      <div className="pointer-events-none flex h-full w-full items-center justify-center">
        <svg
          className={isHorizontal ? 'h-auto w-full' : 'h-full w-auto'}
          style={{
            overflow: 'visible',
            ...(isHorizontal ? { height: Math.max(thickness, 1), minHeight: 1 } : { width: Math.max(thickness, 1), minWidth: 1 }),
          }}
        >
          {isHorizontal ? (
            <line
              x1="0"
              y1={thickness / 2}
              x2="100%"
              y2={thickness / 2}
              stroke={hasGradient ? `url(#gradient-${component.id})` : color}
              strokeWidth={thickness}
              strokeDasharray={dashArrayCSS}
            />
          ) : (
            <line
              x1={thickness / 2}
              y1="0"
              x2={thickness / 2}
              y2="100%"
              stroke={hasGradient ? `url(#gradient-${component.id})` : color}
              strokeWidth={thickness}
              strokeDasharray={dashArrayCSS}
            />
          )}
          {hasGradient && (
            <defs>
              <linearGradient
                id={`gradient-${component.id}`}
                x1="0%"
                y1={isHorizontal ? '0%' : '0%'}
                x2={isHorizontal ? '100%' : '0%'}
                y2={isHorizontal ? '0%' : '100%'}
              >
                {gradientColors!.map((c, i) => (
                  <stop key={i} offset={`${(i / (gradientColors!.length - 1)) * 100}%`} stopColor={c} />
                ))}
              </linearGradient>
            </defs>
          )}
        </svg>
      </div>
    );
  }

  // Simple div rendering for solid lines and gradients without dash patterns
  if (hasGradient) {
    return (
      <div className="pointer-events-none flex h-full w-full items-center justify-center">
        <div
          className={isHorizontal ? 'w-full' : 'h-full'}
          style={{
            [isHorizontal ? 'height' : 'width']: `${thickness}px`,
            background: createGradient(gradientColors!, isHorizontal),
            borderRadius: thickness > 2 ? thickness / 4 : 0,
          }}
        />
      </div>
    );
  }

  // Solid color, no dash pattern
  return (
    <div className="pointer-events-none flex h-full w-full items-center justify-center">
      <div
        className={isHorizontal ? 'w-full' : 'h-full'}
        style={{
          [isHorizontal ? 'height' : 'width']: `${thickness}px`,
          backgroundColor: color,
          borderRadius: thickness > 2 ? thickness / 4 : 0,
        }}
      />
    </div>
  );
}
