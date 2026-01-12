import { Input, Checkbox, NumberStepper, Select, ColorPicker } from '@/app/ui/primitives';
import { FieldRow } from '@/components/pdf-builder/property-panel/components';
import { FONT_WEIGHT_OPTIONS, FONT_OPTIONS } from '@/components/pdf-builder/property-panel/constants';
import type { TextFieldProperties } from '@/lib/types/document.types';
import type { PropertyEditorProps } from '@/components/pdf-builder/property-panel/types';

export function TextFieldPropertyEditor({ properties, onChange }: PropertyEditorProps<TextFieldProperties>) {
  // Support both new and legacy padding properties
  const paddingVertical = properties.inputPaddingVertical ?? properties.inputPadding ?? 4;
  const paddingHorizontal = properties.inputPaddingHorizontal ?? properties.inputPadding ?? 6;

  return (
    <div className="space-y-4">
      {/* Field Identification Section */}
      <div className="border-b border-outline-variant/30 pb-3">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Field Settings</h4>
        <div className="space-y-3">
          <div>
            <Input
              label="Label"
              value={properties.label}
              onChange={(e) => onChange('label', e.target.value)}
              placeholder="Field label..."
              size="sm"
              variant="filled"
            />
          </div>
          <div>
            <Input
              label="Field Name"
              value={properties.fieldName}
              onChange={(e) => onChange('fieldName', e.target.value)}
              placeholder="field_name"
              size="sm"
              variant="filled"
            />
          </div>
          <div>
            <Input
              label="Placeholder"
              value={properties.placeholder || ''}
              onChange={(e) => onChange('placeholder', e.target.value)}
              placeholder="Placeholder text..."
              size="sm"
              variant="filled"
            />
          </div>
          <div>
            <Checkbox label="Required field" checked={properties.required} onChange={(e) => onChange('required', e.target.checked)} />
          </div>
        </div>
      </div>

      {/* Label Styling Section */}
      <div className="border-b border-outline-variant/30 pb-3">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Label Style</h4>
        <div className="space-y-3">
          <FieldRow label="Font Size">
            <NumberStepper
              value={properties.labelFontSize || 10}
              onChange={(v) => onChange('labelFontSize', v)}
              min={6}
              max={24}
              step={1}
              suffix="px"
              size="sm"
              fullWidth
            />
          </FieldRow>
          <div>
            <Select
              label="Font Weight"
              options={FONT_WEIGHT_OPTIONS}
              value={properties.labelFontWeight || 'normal'}
              onChange={(v) => onChange('labelFontWeight', v)}
              size="sm"
            />
          </div>
          <div>
            <Select
              label="Label Font"
              options={[{ value: '', label: 'Same as Input' }, ...FONT_OPTIONS]}
              value={properties.labelFontFamily || ''}
              onChange={(v) => onChange('labelFontFamily', v || undefined)}
              size="sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-on-surface">Label Color</label>
            <ColorPicker
              value={properties.labelColor || '#666666'}
              onChange={(v) => onChange('labelColor', v)}
              showInput
              showPresets
              presetPalette="common"
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Input Styling Section */}
      <div className="border-b border-outline-variant/30 pb-3">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Input Style</h4>
        <div className="space-y-3">
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
          <FieldRow label="Input Height">
            <NumberStepper
              value={properties.inputHeight || 8}
              onChange={(v) => onChange('inputHeight', v)}
              min={4}
              max={30}
              step={1}
              suffix="mm"
              size="sm"
              fullWidth
            />
          </FieldRow>
          <FieldRow label="Padding V">
            <NumberStepper
              value={paddingVertical}
              onChange={(v) => onChange('inputPaddingVertical', v)}
              min={0}
              max={20}
              step={1}
              suffix="pt"
              size="sm"
              fullWidth
            />
          </FieldRow>
          <FieldRow label="Padding H">
            <NumberStepper
              value={paddingHorizontal}
              onChange={(v) => onChange('inputPaddingHorizontal', v)}
              min={0}
              max={20}
              step={1}
              suffix="pt"
              size="sm"
              fullWidth
            />
          </FieldRow>
        </div>
      </div>

      {/* Border Styling Section */}
      <div className="border-b border-outline-variant/30 pb-3">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Border</h4>
        <div className="space-y-3">
          <FieldRow label="Width">
            <NumberStepper
              value={properties.borderWidth || 1}
              onChange={(v) => onChange('borderWidth', v)}
              min={0}
              max={5}
              step={0.5}
              suffix="pt"
              size="sm"
              fullWidth
            />
          </FieldRow>
          <FieldRow label="Radius">
            <NumberStepper
              value={properties.borderRadius || 0}
              onChange={(v) => onChange('borderRadius', v)}
              min={0}
              max={20}
              step={1}
              suffix="pt"
              size="sm"
              fullWidth
            />
          </FieldRow>
          <div>
            <label className="mb-2 block text-sm font-medium text-on-surface">Border Color</label>
            <ColorPicker
              value={properties.borderColor || '#000000'}
              onChange={(v) => onChange('borderColor', v)}
              showInput
              showPresets
              presetPalette="common"
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Layout Section */}
      <div className="border-b border-outline-variant/30 pb-3">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Layout</h4>
        <div className="space-y-3">
          <FieldRow label="Label Gap">
            <NumberStepper
              value={properties.labelSpacing ?? 2}
              onChange={(v) => onChange('labelSpacing', v)}
              min={0}
              max={20}
              step={1}
              suffix="pt"
              size="sm"
              fullWidth
            />
          </FieldRow>
          <div>
            <Checkbox label="Full width input" checked={properties.fullWidth !== false} onChange={(e) => onChange('fullWidth', e.target.checked)} />
          </div>
        </div>
      </div>

      {/* Colors Section */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Colors</h4>
        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-on-surface">Background</label>
            <ColorPicker
              value={properties.backgroundColor || 'transparent'}
              onChange={(v) => onChange('backgroundColor', v === 'transparent' ? undefined : v)}
              showInput
              showPresets
              presetPalette="common"
              size="sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-on-surface">Placeholder Color</label>
            <ColorPicker
              value={properties.placeholderColor || '#999999'}
              onChange={(v) => onChange('placeholderColor', v)}
              showInput
              showPresets
              presetPalette="common"
              size="sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
