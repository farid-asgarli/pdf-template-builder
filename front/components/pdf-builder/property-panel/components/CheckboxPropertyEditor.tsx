import { Input, Checkbox, Select, ColorPicker, NumberStepper } from '@/app/ui/primitives';
import { FieldRow } from '@/components/pdf-builder/property-panel/components/FieldRow';
import { FONT_WEIGHT_OPTIONS } from '@/components/pdf-builder/property-panel/constants';
import { CheckboxProperties } from '@/lib/types/document.types';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function CheckboxPropertyEditor({
  properties,
  onChange,
}: {
  properties: CheckboxProperties;
  onChange: (name: string, value: unknown) => void;
}) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    content: true,
    appearance: true,
    label: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const CHECKBOX_SIZE_OPTIONS = [
    { value: 'small', label: 'Small (10pt)' },
    { value: 'medium', label: 'Medium (14pt)' },
    { value: 'large', label: 'Large (18pt)' },
  ];

  const CHECKMARK_STYLE_OPTIONS = [
    { value: 'check', label: 'Checkmark ✓' },
    { value: 'cross', label: 'Cross ✕' },
    { value: 'circle', label: 'Circle ●' },
  ];

  return (
    <div className="space-y-4">
      {/* Content Section */}
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container/30">
        <button
          className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-surface-container-high/50"
          onClick={() => toggleSection('content')}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Content</span>
          <ChevronDown className={`h-4 w-4 text-on-surface-variant transition-transform ${expandedSections.content ? '' : '-rotate-90'}`} />
        </button>
        {expandedSections.content && (
          <div className="space-y-3 border-t border-outline-variant/20 px-3 py-3">
            <div>
              <Input
                label="Label"
                value={properties.label}
                onChange={(e) => onChange('label', e.target.value)}
                placeholder="Checkbox label..."
                size="sm"
                variant="filled"
              />
            </div>
            <div>
              <Input
                label="Field Name"
                value={properties.fieldName}
                onChange={(e) => onChange('fieldName', e.target.value)}
                placeholder="checkbox_field"
                size="sm"
                variant="filled"
              />
            </div>
            <div className="pt-1">
              <Checkbox label="Default checked" checked={properties.defaultChecked} onChange={(e) => onChange('defaultChecked', e.target.checked)} />
            </div>
          </div>
        )}
      </div>

      {/* Appearance Section */}
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container/30">
        <button
          className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-surface-container-high/50"
          onClick={() => toggleSection('appearance')}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Checkbox Appearance</span>
          <ChevronDown className={`h-4 w-4 text-on-surface-variant transition-transform ${expandedSections.appearance ? '' : '-rotate-90'}`} />
        </button>
        {expandedSections.appearance && (
          <div className="space-y-3 border-t border-outline-variant/20 px-3 py-3">
            <div>
              <Select
                label="Size"
                options={CHECKBOX_SIZE_OPTIONS}
                value={properties.size || 'medium'}
                onChange={(v) => onChange('size', v)}
                size="sm"
              />
            </div>
            <div>
              <Select
                label="Checkmark Style"
                options={CHECKMARK_STYLE_OPTIONS}
                value={properties.checkmarkStyle || 'check'}
                onChange={(v) => onChange('checkmarkStyle', v)}
                size="sm"
              />
            </div>

            <div>
              <ColorPicker
                label="Checked Color"
                value={properties.checkedColor || '#6750a4'}
                onChange={(color) => onChange('checkedColor', color)}
                showInput
                showPresets
                presetPalette="common"
                size="sm"
              />
            </div>

            <div>
              <ColorPicker
                label="Checkmark Color"
                value={properties.checkmarkColor || '#ffffff'}
                onChange={(color) => onChange('checkmarkColor', color)}
                showInput
                showPresets
                presetPalette="common"
                size="sm"
              />
            </div>

            <div>
              <ColorPicker
                label="Unchecked Background"
                value={properties.uncheckedBackgroundColor || '#ffffff'}
                onChange={(color) => onChange('uncheckedBackgroundColor', color)}
                showInput
                showPresets
                presetPalette="common"
                size="sm"
              />
            </div>

            <div>
              <ColorPicker
                label="Border Color"
                value={properties.borderColor || '#79747e'}
                onChange={(color) => onChange('borderColor', color)}
                showInput
                showPresets
                presetPalette="common"
                size="sm"
              />
            </div>

            <FieldRow label="Border Width">
              <NumberStepper
                value={properties.borderWidth ?? 1.5}
                onChange={(v) => onChange('borderWidth', v)}
                min={0}
                max={5}
                step={0.5}
                suffix="pt"
                size="sm"
                fullWidth
              />
            </FieldRow>

            <FieldRow label="Border Radius">
              <NumberStepper
                value={properties.borderRadius ?? 2}
                onChange={(v) => onChange('borderRadius', v)}
                min={0}
                max={10}
                step={1}
                suffix="pt"
                size="sm"
                fullWidth
              />
            </FieldRow>

            <FieldRow label="Spacing">
              <NumberStepper
                value={properties.spacing ?? 6}
                onChange={(v) => onChange('spacing', v)}
                min={0}
                max={20}
                step={1}
                suffix="pt"
                size="sm"
                fullWidth
              />
            </FieldRow>
          </div>
        )}
      </div>

      {/* Label Styling Section */}
      <div className="rounded-xl border border-outline-variant/30 bg-surface-container/30">
        <button
          className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors hover:bg-surface-container-high/50"
          onClick={() => toggleSection('label')}
        >
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Label Styling</span>
          <ChevronDown className={`h-4 w-4 text-on-surface-variant transition-transform ${expandedSections.label ? '' : '-rotate-90'}`} />
        </button>
        {expandedSections.label && (
          <div className="space-y-3 border-t border-outline-variant/20 px-3 py-3">
            <FieldRow label="Font Size">
              <NumberStepper
                value={properties.labelFontSize ?? 11}
                onChange={(v) => onChange('labelFontSize', v)}
                min={8}
                max={24}
                step={1}
                suffix="pt"
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
              <ColorPicker
                label="Label Color"
                value={properties.labelColor || '#1c1b1f'}
                onChange={(color) => onChange('labelColor', color)}
                showInput
                showPresets
                presetPalette="common"
                size="sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
