import {
  BarcodePropertyEditor,
  CheckboxPropertyEditor,
  DateFieldPropertyEditor,
  DividerPropertyEditor,
  ImagePropertyEditor,
  ParagraphPropertyEditor,
  PlaceholderPropertyEditor,
  SignatureBoxPropertyEditor,
  TablePropertyEditor,
  TextFieldPropertyEditor,
  TextLabelPropertyEditor,
} from '@/components/pdf-builder/property-panel/components';
import type {
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
import type { PropertyEditorWithBatchProps } from '@/components/pdf-builder/property-panel/types';

interface TypeSpecificPropertiesProps {
  component: Component;
  onChange: PropertyEditorWithBatchProps<unknown>['onChange'];
  onBatchChange: PropertyEditorWithBatchProps<unknown>['onBatchChange'];
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
