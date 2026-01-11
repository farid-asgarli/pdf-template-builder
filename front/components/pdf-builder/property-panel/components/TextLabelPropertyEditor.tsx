import { Input, NumberStepper, Select, Checkbox, ColorPicker } from '@/app/ui/primitives';
import { FieldRow } from '@/components/pdf-builder/property-panel/components/FieldRow';
import {
  FONT_OPTIONS,
  FONT_WEIGHT_OPTIONS,
  TEXT_ALIGN_FULL_OPTIONS,
  TEXT_DECORATION_OPTIONS,
  TEXT_DECORATION_STYLE_OPTIONS,
} from '@/components/pdf-builder/property-panel/constants';
import { TextLabelProperties } from '@/lib/types/document.types';

export function TextLabelPropertyEditor({
  properties,
  onChange,
}: {
  properties: TextLabelProperties;
  onChange: (name: string, value: unknown) => void;
}) {
  const showDecorationOptions = properties.decoration && properties.decoration !== 'none';

  return (
    <div className="space-y-4">
      {/* Content */}
      <div>
        <Input
          label="Content"
          value={properties.content}
          onChange={(e) => onChange('content', e.target.value)}
          placeholder="Enter text..."
          size="sm"
          variant="filled"
        />
      </div>

      {/* Typography Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Typography</h4>

        <FieldRow label="Font Size">
          <NumberStepper
            value={properties.fontSize}
            onChange={(v) => onChange('fontSize', v)}
            min={6}
            max={72}
            step={1}
            suffix="px"
            size="sm"
            fullWidth
          />
        </FieldRow>

        <div>
          <Select label="Font Family" options={FONT_OPTIONS} value={properties.fontFamily} onChange={(v) => onChange('fontFamily', v)} size="sm" />
        </div>

        <div>
          <Select
            label="Font Weight"
            options={FONT_WEIGHT_OPTIONS}
            value={properties.fontWeight}
            onChange={(v) => onChange('fontWeight', v)}
            size="sm"
          />
        </div>

        <div>
          <Checkbox label="Italic" checked={properties.italic ?? false} onChange={(e) => onChange('italic', e.target.checked)} />
        </div>

        <div>
          <Select
            label="Text Align"
            options={TEXT_ALIGN_FULL_OPTIONS}
            value={properties.textAlign}
            onChange={(v) => onChange('textAlign', v)}
            size="sm"
          />
        </div>
      </div>

      {/* Spacing Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Spacing</h4>

        <FieldRow label="Letter Spacing">
          <NumberStepper
            value={properties.letterSpacing ?? 0}
            onChange={(v) => onChange('letterSpacing', v)}
            min={-0.2}
            max={0.5}
            step={0.01}
            suffix="em"
            size="sm"
            fullWidth
          />
        </FieldRow>

        <FieldRow label="Word Spacing">
          <NumberStepper
            value={properties.wordSpacing ?? 0}
            onChange={(v) => onChange('wordSpacing', v)}
            min={-0.3}
            max={1}
            step={0.05}
            suffix="em"
            size="sm"
            fullWidth
          />
        </FieldRow>

        <FieldRow label="Line Height">
          <NumberStepper
            value={properties.lineHeight ?? 1}
            onChange={(v) => onChange('lineHeight', v)}
            min={0.5}
            max={3}
            step={0.1}
            suffix="×"
            size="sm"
            fullWidth
          />
        </FieldRow>
      </div>

      {/* Colors Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Colors</h4>

        <div>
          <label className="mb-2 block text-sm font-medium text-on-surface">Text Color</label>
          <ColorPicker value={properties.color} onChange={(v) => onChange('color', v)} showInput showPresets presetPalette="common" size="sm" />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-on-surface">Background Color</label>
          <ColorPicker
            value={properties.backgroundColor || ''}
            onChange={(v) => onChange('backgroundColor', v || undefined)}
            showInput
            showPresets
            presetPalette="common"
            size="sm"
          />
          <p className="mt-1 text-xs text-on-surface-variant">Leave empty for transparent</p>
        </div>
      </div>

      {/* Text Decoration Section */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Decoration</h4>

        <div>
          <Select
            label="Decoration"
            options={TEXT_DECORATION_OPTIONS}
            value={properties.decoration ?? 'none'}
            onChange={(v) => onChange('decoration', v)}
            size="sm"
          />
        </div>

        {showDecorationOptions && (
          <>
            <div>
              <Select
                label="Decoration Style"
                options={TEXT_DECORATION_STYLE_OPTIONS}
                value={properties.decorationStyle ?? 'solid'}
                onChange={(v) => onChange('decorationStyle', v)}
                size="sm"
              />
            </div>

            <FieldRow label="Decoration Thickness">
              <NumberStepper
                value={properties.decorationThickness ?? 1}
                onChange={(v) => onChange('decorationThickness', v)}
                min={0.5}
                max={5}
                step={0.5}
                suffix="px"
                size="sm"
                fullWidth
              />
            </FieldRow>

            <div>
              <label className="mb-2 block text-sm font-medium text-on-surface">Decoration Color</label>
              <ColorPicker
                value={properties.decorationColor || properties.color || '#000000'}
                onChange={(v) => onChange('decorationColor', v || undefined)}
                showInput
                showPresets
                presetPalette="common"
                size="sm"
              />
              <p className="mt-1 text-xs text-on-surface-variant">Leave empty to use text color</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
