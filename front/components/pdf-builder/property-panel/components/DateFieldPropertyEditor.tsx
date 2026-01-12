import { Input, Select, Checkbox, NumberStepper, ColorPicker } from '@/app/ui/primitives';
import { FieldRow } from '@/components/pdf-builder/property-panel/components';
import { FONT_WEIGHT_OPTIONS } from '@/components/pdf-builder/property-panel/constants';
import type { DateFieldProperties } from '@/lib/types/document.types';
import type { PropertyEditorProps } from '@/components/pdf-builder/property-panel/types';

export function DateFieldPropertyEditor({ properties, onChange }: PropertyEditorProps<DateFieldProperties>) {
  const formatOptions = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
    { value: 'DD.MM.YYYY', label: 'DD.MM.YYYY' },
  ];

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
              placeholder="Date label..."
              size="sm"
              variant="filled"
            />
          </div>
          <div>
            <Input
              label="Field Name"
              value={properties.fieldName}
              onChange={(e) => onChange('fieldName', e.target.value)}
              placeholder="date_field"
              size="sm"
              variant="filled"
            />
          </div>
          <div>
            <Select label="Date Format" options={formatOptions} value={properties.format} onChange={(v) => onChange('format', v)} size="sm" />
          </div>
          <div className="pt-2">
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
              value={properties.fontSize || 12}
              onChange={(v) => onChange('fontSize', v)}
              min={6}
              max={72}
              step={1}
              suffix="px"
              size="sm"
              fullWidth
            />
          </FieldRow>
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
          <FieldRow label="Padding">
            <NumberStepper
              value={properties.inputPadding || 4}
              onChange={(v) => onChange('inputPadding', v)}
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
              suffix="px"
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
              suffix="px"
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

      {/* Colors Section */}
      <div className="border-b border-outline-variant/30 pb-3">
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

      {/* Icon Section */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Calendar Icon</h4>
        <div className="space-y-3">
          <div>
            <Checkbox label="Show calendar icon" checked={properties.showIcon !== false} onChange={(e) => onChange('showIcon', e.target.checked)} />
          </div>
          {properties.showIcon !== false && (
            <div>
              <label className="mb-2 block text-sm font-medium text-on-surface">Icon Color</label>
              <ColorPicker
                value={properties.iconColor || '#666666'}
                onChange={(v) => onChange('iconColor', v)}
                showInput
                showPresets
                presetPalette="common"
                size="sm"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
