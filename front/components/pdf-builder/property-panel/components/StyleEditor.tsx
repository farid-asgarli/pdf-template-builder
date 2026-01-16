'use client';

import { RotateCcw } from 'lucide-react';
import { NumberStepper, ColorPicker, Button } from '@/app/ui/primitives';
import { FieldRow } from '@/components/pdf-builder/property-panel/components';
import type { ComponentStyle } from '@/lib/types/document.types';

interface StyleEditorProps {
  style?: ComponentStyle;
  onChange: (styleProp: keyof ComponentStyle, value: unknown) => void;
}

export function StyleEditor({ style, onChange }: StyleEditorProps) {
  const currentStyle: ComponentStyle = {
    backgroundColor: style?.backgroundColor || 'transparent',
    borderColor: style?.borderColor || '#000000',
    borderWidth: style?.borderWidth || 0,
    borderRadius: style?.borderRadius || 0,
    padding: style?.padding || 0,
  };

  const handleResetStyles = () => {
    onChange('backgroundColor', undefined);
    onChange('borderColor', undefined);
    onChange('borderWidth', undefined);
    onChange('borderRadius', undefined);
    onChange('padding', undefined);
  };

  const hasCustomStyles = style?.backgroundColor || style?.borderColor || style?.borderWidth || style?.borderRadius || style?.padding;

  return (
    <div className='space-y-4'>
      <div>
        <label className='mb-2 block text-sm font-medium text-on-surface'>Background</label>
        <ColorPicker
          value={currentStyle.backgroundColor || 'transparent'}
          onChange={(v) => onChange('backgroundColor', v === 'transparent' ? undefined : v)}
          showInput
          showPresets
          presetPalette='common'
          size='sm'
        />
      </div>

      <div>
        <label className='mb-2 block text-sm font-medium text-on-surface'>Border Color</label>
        <ColorPicker
          value={currentStyle.borderColor || '#000000'}
          onChange={(v) => onChange('borderColor', v)}
          showInput
          showPresets
          presetPalette='common'
          size='sm'
        />
      </div>

      <FieldRow label='Border Width'>
        <NumberStepper
          value={currentStyle.borderWidth || 0}
          onChange={(v) => onChange('borderWidth', v === 0 ? undefined : v)}
          min={0}
          max={10}
          step={1}
          suffix='px'
          size='sm'
          fullWidth
        />
      </FieldRow>

      <FieldRow label='Border Radius'>
        <NumberStepper
          value={currentStyle.borderRadius || 0}
          onChange={(v) => onChange('borderRadius', v === 0 ? undefined : v)}
          min={0}
          max={20}
          step={1}
          suffix='px'
          size='sm'
          fullWidth
        />
      </FieldRow>

      <FieldRow label='Padding'>
        <NumberStepper
          value={currentStyle.padding || 0}
          onChange={(v) => onChange('padding', v === 0 ? undefined : v)}
          min={0}
          max={20}
          step={1}
          suffix='mm'
          size='sm'
          fullWidth
        />
      </FieldRow>

      {hasCustomStyles && (
        <Button variant='outline' size='sm' className='w-full gap-2 mt-2' onClick={handleResetStyles}>
          <RotateCcw className='h-4 w-4' />
          Reset Styles
        </Button>
      )}
    </div>
  );
}
