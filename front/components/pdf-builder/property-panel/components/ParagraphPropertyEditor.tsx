'use client';

import { AlignLeft, AlignCenter, AlignRight, AlignJustify, Type, Palette, Pilcrow, Settings2 } from 'lucide-react';
import { NumberStepper, Select, Checkbox, ColorPicker, SegmentedButtonGroup, SegmentedButton } from '@/app/ui/primitives';
import { VariableTextEditor } from '@/components/pdf-builder/VariableTextEditor';
import { FONT_OPTIONS, FONT_WEIGHT_OPTIONS, TEXT_DECORATION_OPTIONS, TEXT_DECORATION_STYLE_OPTIONS } from '@/components/pdf-builder/property-panel/constants';
import { Section, PropertyRow, SectionDivider } from '@/components/pdf-builder/property-panel/components';
import type { ParagraphProperties } from '@/lib/types/document.types';
import type { PropertyEditorProps } from '@/components/pdf-builder/property-panel/types';

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function ParagraphPropertyEditor({ properties, onChange }: PropertyEditorProps<ParagraphProperties>) {
  const showDecorationOptions = properties.decoration && properties.decoration !== 'none';

  return (
    <div className='flex flex-col'>
      {/* Content (Always visible) with Variable Support */}
      <div className='border-b border-outline/10 p-4'>
        <VariableTextEditor
          value={properties.content}
          onChange={(v) => onChange('content', v)}
          placeholder='Enter paragraph text with {{variables}}...'
          minHeight={80}
          maxHeight={200}
        />
      </div>

      {/* Typography Section */}
      <Section icon={<Type className='h-4 w-4' />} title='Typography' variant='bordered'>
        {/* Font Family */}
        <div className='mb-3'>
          <Select options={FONT_OPTIONS} value={properties.fontFamily} onChange={(v) => onChange('fontFamily', v)} size='sm' />
        </div>

        {/* Font Size & Weight */}
        <div className='flex gap-3 mb-3'>
          <div className='w-28'>
            <NumberStepper value={properties.fontSize} onChange={(v) => onChange('fontSize', v)} min={6} max={72} step={1} suffix='px' size='sm' fullWidth />
          </div>
          <div className='flex-1'>
            <Select options={FONT_WEIGHT_OPTIONS} value={properties.fontWeight} onChange={(v) => onChange('fontWeight', v)} size='sm' />
          </div>
        </div>

        {/* Italic checkbox */}
        <div className='mb-4'>
          <Checkbox label='Italic' checked={properties.italic ?? false} onChange={(e) => onChange('italic', e.target.checked)} />
        </div>

        {/* Alignment */}
        <div>
          <div className='mb-2 text-xs text-on-surface-variant'>Alignment</div>
          <SegmentedButtonGroup value={properties.textAlign || 'left'} onChange={(v) => onChange('textAlign', v)} size='sm'>
            <SegmentedButton value='left' icon={<AlignLeft className='h-4 w-4' />} />
            <SegmentedButton value='center' icon={<AlignCenter className='h-4 w-4' />} />
            <SegmentedButton value='right' icon={<AlignRight className='h-4 w-4' />} />
            <SegmentedButton value='justify' icon={<AlignJustify className='h-4 w-4' />} />
          </SegmentedButtonGroup>
        </div>
      </Section>

      {/* Colors Section */}
      <Section icon={<Palette className='h-4 w-4' />} title='Colors' variant='bordered'>
        <PropertyRow label='Text Color'>
          <ColorPicker value={properties.color} onChange={(v) => onChange('color', v)} />
        </PropertyRow>
        <PropertyRow label='Background' hint='Leave empty for transparent'>
          <ColorPicker value={properties.backgroundColor || ''} onChange={(v) => onChange('backgroundColor', v || undefined)} />
        </PropertyRow>
      </Section>

      {/* Paragraph Settings Section */}
      <Section icon={<Pilcrow className='h-4 w-4' />} title='Paragraph' variant='bordered'>
        <PropertyRow label='Line Height' controlWidth='md'>
          <NumberStepper
            value={properties.lineHeight ?? 1.5}
            onChange={(v) => onChange('lineHeight', v)}
            min={0.5}
            max={3}
            step={0.1}
            suffix='×'
            size='sm'
            fullWidth
          />
        </PropertyRow>
        <PropertyRow label='Paragraph Spacing' controlWidth='md'>
          <NumberStepper
            value={properties.paragraphSpacing ?? 10}
            onChange={(v) => onChange('paragraphSpacing', v)}
            min={0}
            max={100}
            step={1}
            suffix='pt'
            size='sm'
            fullWidth
          />
        </PropertyRow>
        <PropertyRow label='First Line Indent' controlWidth='md'>
          <NumberStepper
            value={properties.firstLineIndentation ?? 0}
            onChange={(v) => onChange('firstLineIndentation', v)}
            min={0}
            max={100}
            step={1}
            suffix='pt'
            size='sm'
            fullWidth
          />
        </PropertyRow>
      </Section>

      {/* Advanced Section (Collapsed by default) */}
      <Section icon={<Settings2 className='h-4 w-4' />} title='Advanced' variant='bordered' defaultOpen={false}>
        <div className='mb-2 text-xs font-medium text-on-surface-variant'>Character Spacing</div>
        <div className='rounded-xl bg-surface-container-low/50 p-3 mb-4'>
          <PropertyRow label='Letter Spacing' controlWidth='md'>
            <NumberStepper
              value={properties.letterSpacing ?? 0}
              onChange={(v) => onChange('letterSpacing', v)}
              min={-0.2}
              max={0.5}
              step={0.01}
              suffix='em'
              size='sm'
              fullWidth
            />
          </PropertyRow>
          <PropertyRow label='Word Spacing' controlWidth='md'>
            <NumberStepper
              value={properties.wordSpacing ?? 0}
              onChange={(v) => onChange('wordSpacing', v)}
              min={-0.2}
              max={0.5}
              step={0.01}
              suffix='em'
              size='sm'
              fullWidth
            />
          </PropertyRow>
        </div>

        <PropertyRow label='Line Clamp' hint='0 = no limit. Text exceeding limit shows ellipsis.' controlWidth='md'>
          <NumberStepper
            value={properties.clampLines ?? 0}
            onChange={(v) => onChange('clampLines', v > 0 ? v : undefined)}
            min={0}
            max={50}
            step={1}
            size='sm'
            fullWidth
          />
        </PropertyRow>

        <SectionDivider />

        <div className='mb-2 text-xs font-medium text-on-surface-variant'>Text Decoration</div>
        <div className='rounded-xl bg-surface-container-low/50 p-3'>
          <PropertyRow label='Style' controlWidth='lg'>
            <Select options={TEXT_DECORATION_OPTIONS} value={properties.decoration ?? 'none'} onChange={(v) => onChange('decoration', v)} size='sm' />
          </PropertyRow>

          {showDecorationOptions && (
            <>
              <PropertyRow label='Line Style' controlWidth='lg'>
                <Select
                  options={TEXT_DECORATION_STYLE_OPTIONS}
                  value={properties.decorationStyle ?? 'solid'}
                  onChange={(v) => onChange('decorationStyle', v)}
                  size='sm'
                />
              </PropertyRow>
              <PropertyRow label='Line Color'>
                <ColorPicker
                  value={properties.decorationColor || properties.color || '#000000'}
                  onChange={(v) => onChange('decorationColor', v || undefined)}
                />
              </PropertyRow>
            </>
          )}
        </div>
      </Section>
    </div>
  );
}
