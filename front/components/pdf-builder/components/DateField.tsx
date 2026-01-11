'use client';

import { Calendar } from 'lucide-react';
import type { Component, DateFieldProperties } from '@/lib/types/document.types';

interface DateFieldProps {
  component: Component;
}

export function DateField({ component }: DateFieldProps) {
  const props = component.properties as DateFieldProperties;

  // Convert font weight to CSS value
  const getLabelFontWeight = (weight: string): number => {
    const weightMap: Record<string, number> = {
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
    return weightMap[weight] || 400;
  };

  return (
    <div className="pointer-events-none flex h-full w-full flex-col overflow-hidden p-0.5">
      {/* Label */}
      <div
        className="mb-0.5 flex shrink-0 items-center gap-0.5 overflow-hidden leading-tight"
        style={{
          fontSize: `${props.labelFontSize || 10}px`,
          color: props.labelColor || '#666666',
          fontWeight: getLabelFontWeight(props.labelFontWeight || 'normal'),
        }}
      >
        <span className="truncate">{props.label || 'Date'}</span>
        {props.required && <span className="shrink-0 text-error">*</span>}
      </div>
      {/* Date input representation */}
      <div
        className="flex min-h-0 flex-1 items-center justify-between overflow-hidden"
        style={{
          borderWidth: `${props.borderWidth || 1}px`,
          borderStyle: 'solid',
          borderColor: props.borderColor || '#000000',
          borderRadius: `${props.borderRadius || 0}px`,
          backgroundColor: props.backgroundColor || 'transparent',
          padding: `${props.inputPadding || 4}px`,
          minHeight: `${props.inputHeight || 8}mm`,
        }}
      >
        <span
          className="truncate"
          style={{
            fontSize: `${props.fontSize || 12}px`,
            color: props.placeholderColor || '#999999',
          }}
        >
          {props.format || 'MM/DD/YYYY'}
        </span>
        {props.showIcon !== false && (
          <Calendar
            className="shrink-0"
            style={{
              width: `${(props.fontSize || 12) + 2}px`,
              height: `${(props.fontSize || 12) + 2}px`,
              color: props.iconColor || '#666666',
            }}
          />
        )}
      </div>
    </div>
  );
}
