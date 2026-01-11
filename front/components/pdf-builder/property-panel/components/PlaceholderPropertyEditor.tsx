import { Input, Select } from '@/app/ui/primitives';
import { FieldRow } from '@/components/pdf-builder/property-panel/components/FieldRow';
import { Section } from '@/components/pdf-builder/property-panel/components/Section';
import type { PlaceholderProperties, PlaceholderVariant } from '@/lib/types/document.types';

interface PlaceholderPropertyEditorProps {
  properties: PlaceholderProperties;
  onChange: (name: string, value: unknown) => void;
}

const VARIANT_OPTIONS: { value: PlaceholderVariant; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'error', label: 'Error' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
];

/**
 * Property editor for placeholder components.
 * Allows configuration of label text and visual variant.
 */
export function PlaceholderPropertyEditor({ properties, onChange }: PlaceholderPropertyEditorProps) {
  return (
    <Section title="Placeholder Settings">
      <div className="space-y-4">
        <FieldRow label="Label">
          <Input
            value={properties.label || 'Placeholder'}
            onChange={(e) => onChange('label', e.target.value)}
            placeholder="Enter placeholder label..."
            className="w-full"
          />
        </FieldRow>

        <div>
          <Select
            label="Variant"
            value={properties.variant || 'default'}
            onChange={(v) => onChange('variant', v)}
            options={VARIANT_OPTIONS}
            size="sm"
          />
        </div>

        <div className="text-xs text-on-surface-variant/70 leading-relaxed">
          <p className="mb-1">
            <strong>Variants:</strong>
          </p>
          <ul className="list-disc list-inside space-y-0.5 pl-1">
            <li>
              <span className="font-medium">Default</span> — Standard placeholder
            </li>
            <li>
              <span className="font-medium">Error</span> — Red, for error states
            </li>
            <li>
              <span className="font-medium">Warning</span> — Orange, for warnings
            </li>
            <li>
              <span className="font-medium">Info</span> — Blue, informational
            </li>
          </ul>
        </div>
      </div>
    </Section>
  );
}
