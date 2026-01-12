import { Input, Select, NumberStepper, Checkbox, ColorPicker } from '@/app/ui/primitives';
import { FieldRow, Section } from '@/components/pdf-builder/property-panel/components';
import type { BarcodeProperties, BarcodeType, BarcodeErrorCorrectionLevel } from '@/lib/types/document.types';
import type { PropertyEditorProps } from '@/components/pdf-builder/property-panel/types';

// Barcode type options grouped by category
const BARCODE_TYPE_OPTIONS: { value: BarcodeType; label: string; group: string }[] = [
  // 1D Product codes
  { value: 'ean-13', label: 'EAN-13 (Retail)', group: '1D Product' },
  { value: 'ean-8', label: 'EAN-8 (Small Products)', group: '1D Product' },
  { value: 'upc-a', label: 'UPC-A (US/Canada)', group: '1D Product' },
  { value: 'upc-e', label: 'UPC-E (Compact)', group: '1D Product' },
  // 1D Industrial codes
  { value: 'code-128', label: 'Code 128 (Shipping)', group: '1D Industrial' },
  { value: 'code-39', label: 'Code 39 (Military/Healthcare)', group: '1D Industrial' },
  { value: 'code-93', label: 'Code 93 (High Density)', group: '1D Industrial' },
  { value: 'codabar', label: 'Codabar (Libraries)', group: '1D Industrial' },
  { value: 'itf', label: 'ITF (Cartons/Shipping)', group: '1D Industrial' },
  // 2D codes
  { value: 'qr-code', label: 'QR Code (Universal)', group: '2D' },
  { value: 'data-matrix', label: 'Data Matrix (Electronics)', group: '2D' },
  { value: 'aztec', label: 'Aztec (Tickets/Boarding)', group: '2D' },
  { value: 'pdf-417', label: 'PDF 417 (IDs/Licenses)', group: '2D' },
];

// Flatten for simple select
const BARCODE_TYPE_SELECT_OPTIONS = BARCODE_TYPE_OPTIONS.map(({ value, label }) => ({
  value,
  label,
}));

const ERROR_CORRECTION_OPTIONS: { value: BarcodeErrorCorrectionLevel; label: string }[] = [
  { value: 'low', label: 'Low (~7% recovery)' },
  { value: 'medium', label: 'Medium (~15% recovery)' },
  { value: 'quartile', label: 'Quartile (~25% recovery)' },
  { value: 'high', label: 'High (~30% recovery)' },
];

/**
 * Checks if the barcode type is a 2D barcode that supports error correction.
 */
function supports2DErrorCorrection(type: BarcodeType): boolean {
  return ['qr-code', 'data-matrix', 'aztec', 'pdf-417'].includes(type);
}

/**
 * Checks if the barcode type is a 1D barcode that can show value text.
 */
function is1DBarcode(type: BarcodeType): boolean {
  return ['ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'code-39', 'code-93', 'codabar', 'itf'].includes(type);
}

/**
 * Gets validation hints for specific barcode types.
 */
function getValueHint(type: BarcodeType): string {
  const hints: Partial<Record<BarcodeType, string>> = {
    'ean-13': 'Requires exactly 12-13 digits',
    'ean-8': 'Requires exactly 7-8 digits',
    'upc-a': 'Requires exactly 11-12 digits',
    'upc-e': 'Requires exactly 6-8 digits',
    'code-128': 'Supports alphanumeric and special characters',
    'code-39': 'Uppercase letters, digits, and - . $ / + % SPACE',
    'code-93': 'Full ASCII support',
    codabar: 'Digits and - $ : / . +',
    itf: 'Digits only, even number of characters',
    'qr-code': 'Supports text, URLs, and Unicode',
    'data-matrix': 'Supports text and binary data',
    aztec: 'Supports text and binary data',
    'pdf-417': 'Supports text, binary, and large data',
  };
  return hints[type] || '';
}

export function BarcodePropertyEditor({ properties, onChange }: PropertyEditorProps<BarcodeProperties>) {
  const is1D = is1DBarcode(properties.barcodeType);
  const supports2D = supports2DErrorCorrection(properties.barcodeType);
  const valueHint = getValueHint(properties.barcodeType);

  return (
    <div className="space-y-4">
      {/* Barcode Content */}
      <Section title="Content" defaultOpen>
        <div className="space-y-3">
          <div>
            <Select
              label="Barcode Type"
              options={BARCODE_TYPE_SELECT_OPTIONS}
              value={properties.barcodeType}
              onChange={(v) => onChange('barcodeType', v)}
              size="sm"
            />
            <p className="mt-1 text-xs text-on-surface-variant">{is1D ? '1D linear barcode' : '2D matrix barcode'}</p>
          </div>

          <div>
            <Input
              label="Value"
              value={properties.value}
              onChange={(e) => onChange('value', e.target.value)}
              placeholder="Enter barcode data..."
              size="sm"
              variant="filled"
            />
            {valueHint && <p className="mt-1 text-xs text-on-surface-variant">{valueHint}</p>}
          </div>

          {/* Variable hint */}
          <p className="text-xs text-on-surface-variant/70">💡 Use {'{{variableName}}'} for dynamic values</p>
        </div>
      </Section>

      {/* Appearance */}
      <Section title="Appearance" defaultOpen>
        <div className="space-y-3">
          <FieldRow label="Foreground">
            <ColorPicker value={properties.foregroundColor} onChange={(color) => onChange('foregroundColor', color)} />
          </FieldRow>

          <FieldRow label="Background">
            <ColorPicker value={properties.backgroundColor} onChange={(color) => onChange('backgroundColor', color)} />
          </FieldRow>

          <FieldRow label="Quiet Zone">
            <NumberStepper value={properties.quietZone} onChange={(v) => onChange('quietZone', v)} min={0} max={20} step={1} size="sm" fullWidth />
          </FieldRow>
          <p className="-mt-2 text-xs text-on-surface-variant">Margin around the barcode (points)</p>
        </div>
      </Section>

      {/* 2D Error Correction */}
      {supports2D && (
        <Section title="Error Correction" defaultOpen={false}>
          <div className="space-y-3">
            <Select
              label="Error Correction Level"
              options={ERROR_CORRECTION_OPTIONS}
              value={properties.errorCorrectionLevel}
              onChange={(v) => onChange('errorCorrectionLevel', v)}
              size="sm"
            />
            <p className="text-xs text-on-surface-variant">Higher levels allow the code to be read even if partially damaged</p>
          </div>
        </Section>
      )}

      {/* 1D Text Display */}
      {is1D && (
        <Section title="Value Display" defaultOpen={false}>
          <div className="space-y-3">
            <Checkbox label="Show Value Below Barcode" checked={properties.showValue} onChange={(e) => onChange('showValue', e.target.checked)} />

            {properties.showValue && (
              <>
                <FieldRow label="Font Size">
                  <NumberStepper
                    value={properties.valueFontSize}
                    onChange={(v) => onChange('valueFontSize', v)}
                    min={6}
                    max={24}
                    step={1}
                    size="sm"
                    fullWidth
                  />
                </FieldRow>

                <div>
                  <Input
                    label="Font Family"
                    value={properties.valueFontFamily}
                    onChange={(e) => onChange('valueFontFamily', e.target.value)}
                    placeholder="Inter"
                    size="sm"
                    variant="filled"
                  />
                </div>
              </>
            )}
          </div>
        </Section>
      )}
    </div>
  );
}
