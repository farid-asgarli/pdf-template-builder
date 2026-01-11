import { BarcodePropertyEditor } from '@/components/pdf-builder/property-panel/components/BarcodePropertyEditor';
import { CheckboxPropertyEditor } from '@/components/pdf-builder/property-panel/components/CheckboxPropertyEditor';
import { DateFieldPropertyEditor } from '@/components/pdf-builder/property-panel/components/DateFieldPropertyEditor';
import { DividerPropertyEditor } from '@/components/pdf-builder/property-panel/components/DividerPropertyEditor';
import { ImagePropertyEditor } from '@/components/pdf-builder/property-panel/components/ImagePropertyEditor';
import { ParagraphPropertyEditor } from '@/components/pdf-builder/property-panel/components/ParagraphPropertyEditor';
import { PlaceholderPropertyEditor } from '@/components/pdf-builder/property-panel/components/PlaceholderPropertyEditor';
import { SignatureBoxPropertyEditor } from '@/components/pdf-builder/property-panel/components/SignatureBoxPropertyEditor';
import { TablePropertyEditor } from '@/components/pdf-builder/property-panel/components/TablePropertyEditor';
import { TextFieldPropertyEditor } from '@/components/pdf-builder/property-panel/components/TextFieldEditor';
import { TextLabelPropertyEditor } from '@/components/pdf-builder/property-panel/components/TextLabelPropertyEditor';
import {
  BarcodeProperties,
  CheckboxProperties,
  Component,
  DateFieldProperties,
  DividerProperties,
  ImageProperties,
  ParagraphProperties,
  PlaceholderProperties,
  SignatureBoxProperties,
  TableProperties,
  TextFieldProperties,
  TextLabelProperties,
} from '@/lib/types/document.types';

interface TypeSpecificPropertiesProps {
  component: Component;
  onChange: (propertyName: string, value: unknown) => void;
  onBatchChange: (updates: Record<string, unknown>) => void;
}

export function TypeSpecificProperties({ component, onChange, onBatchChange }: TypeSpecificPropertiesProps) {
  switch (component.type) {
    case 'text-label':
      return <TextLabelPropertyEditor properties={component.properties as TextLabelProperties} onChange={onChange} />;
    case 'text-field':
      return <TextFieldPropertyEditor properties={component.properties as TextFieldProperties} onChange={onChange} />;
    case 'signature-box':
      return <SignatureBoxPropertyEditor properties={component.properties as SignatureBoxProperties} onChange={onChange} />;
    case 'date-field':
      return <DateFieldPropertyEditor properties={component.properties as DateFieldProperties} onChange={onChange} />;
    case 'checkbox':
      return <CheckboxPropertyEditor properties={component.properties as CheckboxProperties} onChange={onChange} />;
    case 'table':
      return <TablePropertyEditor properties={component.properties as TableProperties} onChange={onChange} onBatchChange={onBatchChange} />;
    case 'image':
      return <ImagePropertyEditor properties={component.properties as ImageProperties} onChange={onChange} />;
    case 'paragraph':
      return <ParagraphPropertyEditor properties={component.properties as ParagraphProperties} onChange={onChange} />;
    case 'divider':
      return <DividerPropertyEditor properties={component.properties as DividerProperties} onChange={onChange} />;
    case 'barcode':
      return <BarcodePropertyEditor properties={component.properties as BarcodeProperties} onChange={onChange} />;
    case 'placeholder':
      return <PlaceholderPropertyEditor properties={component.properties as PlaceholderProperties} onChange={onChange} />;
    default:
      return <p className="text-xs text-on-surface-variant">No properties available for this component type</p>;
  }
}
