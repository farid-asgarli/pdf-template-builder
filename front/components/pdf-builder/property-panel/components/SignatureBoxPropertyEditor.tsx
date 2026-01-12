import { Input, Checkbox, NumberStepper, ColorPicker, Select } from '@/app/ui/primitives';
import { FieldRow } from '@/components/pdf-builder/property-panel/components';
import { FONT_WEIGHT_OPTIONS } from '@/components/pdf-builder/property-panel/constants';
import type { SignatureBoxProperties } from '@/lib/types/document.types';
import type { PropertyEditorProps } from '@/components/pdf-builder/property-panel/types';

export function SignatureBoxPropertyEditor({ properties, onChange }: PropertyEditorProps<SignatureBoxProperties>) {
  return (
    <div className="space-y-4">
      {/* Signer Information Section */}
      <div className="border-b border-outline-variant/30 pb-3">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Signer Information</h4>
        <div className="space-y-3">
          <div>
            <Input
              label="Signer Name"
              value={properties.signerName}
              onChange={(e) => onChange('signerName', e.target.value)}
              placeholder="Name of signer..."
              size="sm"
              variant="filled"
            />
          </div>
          <div>
            <Input
              label="Signer Title"
              value={properties.signerTitle || ''}
              onChange={(e) => onChange('signerTitle', e.target.value)}
              placeholder="Title (optional)..."
              size="sm"
              variant="filled"
            />
          </div>
        </div>
      </div>

      {/* Feature Toggles Section */}
      <div className="border-b border-outline-variant/30 pb-3">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Options</h4>
        <div className="space-y-3">
          <Checkbox label="Show signature line" checked={properties.showLine} onChange={(e) => onChange('showLine', e.target.checked)} />
          <Checkbox label="Include date field" checked={properties.dateRequired} onChange={(e) => onChange('dateRequired', e.target.checked)} />
        </div>
      </div>

      {/* Signature Line Styling Section */}
      <div className="border-b border-outline-variant/30 pb-3">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Signature Line</h4>
        <div className="space-y-3">
          <FieldRow label="Thickness">
            <NumberStepper
              value={properties.lineThickness}
              onChange={(v) => onChange('lineThickness', v)}
              min={0.5}
              max={5}
              step={0.5}
              suffix="pt"
              size="sm"
              fullWidth
            />
          </FieldRow>
          <FieldRow label="Area Height">
            <NumberStepper
              value={properties.signatureAreaHeight}
              onChange={(v) => onChange('signatureAreaHeight', v)}
              min={10}
              max={60}
              step={2}
              suffix="pt"
              size="sm"
              fullWidth
            />
          </FieldRow>
          <div>
            <label className="mb-2 block text-sm font-medium text-on-surface">Line Color</label>
            <ColorPicker
              value={properties.lineColor}
              onChange={(v) => onChange('lineColor', v)}
              showInput
              showPresets
              presetPalette="common"
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Signer Name Styling Section */}
      <div className="border-b border-outline-variant/30 pb-3">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Signer Name Style</h4>
        <div className="space-y-3">
          <FieldRow label="Font Size">
            <NumberStepper
              value={properties.signerNameFontSize}
              onChange={(v) => onChange('signerNameFontSize', v)}
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
              value={properties.signerNameFontWeight}
              onChange={(v) => onChange('signerNameFontWeight', v)}
              size="sm"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-on-surface">Name Color</label>
            <ColorPicker
              value={properties.signerNameColor}
              onChange={(v) => onChange('signerNameColor', v)}
              showInput
              showPresets
              presetPalette="common"
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Signer Title Styling Section */}
      <div className="border-b border-outline-variant/30 pb-3">
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Signer Title Style</h4>
        <div className="space-y-3">
          <FieldRow label="Font Size">
            <NumberStepper
              value={properties.signerTitleFontSize}
              onChange={(v) => onChange('signerTitleFontSize', v)}
              min={6}
              max={24}
              step={1}
              suffix="px"
              size="sm"
              fullWidth
            />
          </FieldRow>
          <div>
            <label className="mb-2 block text-sm font-medium text-on-surface">Title Color</label>
            <ColorPicker
              value={properties.signerTitleColor}
              onChange={(v) => onChange('signerTitleColor', v)}
              showInput
              showPresets
              presetPalette="common"
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Date Section Styling */}
      {properties.dateRequired && (
        <div className="border-b border-outline-variant/30 pb-3">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Date Field Style</h4>
          <div className="space-y-3">
            <div>
              <Input
                label="Date Label"
                value={properties.dateLabel}
                onChange={(e) => onChange('dateLabel', e.target.value)}
                placeholder="Date"
                size="sm"
                variant="filled"
              />
            </div>
            <FieldRow label="Line Width">
              <NumberStepper
                value={properties.dateLineWidth}
                onChange={(v) => onChange('dateLineWidth', v)}
                min={20}
                max={120}
                step={5}
                suffix="pt"
                size="sm"
                fullWidth
              />
            </FieldRow>
            <FieldRow label="Label Size">
              <NumberStepper
                value={properties.dateLabelFontSize}
                onChange={(v) => onChange('dateLabelFontSize', v)}
                min={6}
                max={18}
                step={1}
                suffix="px"
                size="sm"
                fullWidth
              />
            </FieldRow>
            <div>
              <label className="mb-2 block text-sm font-medium text-on-surface">Label Color</label>
              <ColorPicker
                value={properties.dateLabelColor}
                onChange={(v) => onChange('dateLabelColor', v)}
                showInput
                showPresets
                presetPalette="common"
                size="sm"
              />
            </div>
          </div>
        </div>
      )}

      {/* Spacing Section */}
      <div>
        <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Spacing</h4>
        <div className="space-y-3">
          <FieldRow label="Element Gap">
            <NumberStepper
              value={properties.spacingBetweenElements}
              onChange={(v) => onChange('spacingBetweenElements', v)}
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
    </div>
  );
}
