'use client';

import { Check, X, Circle } from 'lucide-react';
import type { Component, CheckboxProperties } from '@/lib/types/document.types';

// Size presets in pixels (for frontend preview)
const SIZE_PRESETS = {
  small: 12,
  medium: 16,
  large: 20,
} as const;

interface CheckboxProps {
  component: Component;
}

export function Checkbox({ component }: CheckboxProps) {
  const props = component.properties as CheckboxProperties;

  // Get size from preset or default to medium
  const boxSize = SIZE_PRESETS[props.size] || SIZE_PRESETS.medium;
  const iconSize = boxSize * 0.7;

  // Colors with defaults
  const checkedColor = props.checkedColor || '#6750a4';
  const uncheckedBgColor = props.uncheckedBackgroundColor || '#ffffff';
  const borderColor = props.borderColor || '#79747e';
  const checkmarkColor = props.checkmarkColor || '#ffffff';
  const labelColor = props.labelColor || '#1c1b1f';
  const borderWidth = props.borderWidth ?? 1.5;
  const borderRadius = props.borderRadius ?? 2;
  const spacing = props.spacing ?? 6;
  const labelFontSize = props.labelFontSize ?? 11;

  // Get font weight class
  const fontWeightClass =
    {
      thin: 'font-thin',
      extralight: 'font-extralight',
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
      extrabold: 'font-extrabold',
      black: 'font-black',
    }[props.labelFontWeight || 'normal'] || 'font-normal';

  // Render checkmark based on style
  const renderCheckmark = () => {
    const style = props.checkmarkStyle || 'check';

    switch (style) {
      case 'cross':
        return <X style={{ width: iconSize, height: iconSize, color: checkmarkColor }} strokeWidth={2.5} />;
      case 'circle':
        return <Circle style={{ width: iconSize * 0.7, height: iconSize * 0.7, fill: checkmarkColor, color: checkmarkColor }} />;
      default:
        return <Check style={{ width: iconSize, height: iconSize, color: checkmarkColor }} strokeWidth={2.5} />;
    }
  };

  return (
    <div className="pointer-events-none flex h-full w-full items-center" style={{ gap: `${spacing}px` }}>
      {/* Checkbox box */}
      <div
        className="flex shrink-0 items-center justify-center"
        style={{
          width: boxSize,
          height: boxSize,
          backgroundColor: props.defaultChecked ? checkedColor : uncheckedBgColor,
          borderWidth: `${borderWidth}px`,
          borderStyle: 'solid',
          borderColor: props.defaultChecked ? checkedColor : borderColor,
          borderRadius: `${borderRadius}px`,
        }}
      >
        {props.defaultChecked && renderCheckmark()}
      </div>
      {/* Label */}
      <span
        className={`truncate ${fontWeightClass}`}
        style={{
          fontSize: `${labelFontSize}px`,
          color: labelColor,
        }}
      >
        {props.label || 'Checkbox Label'}
      </span>
    </div>
  );
}
