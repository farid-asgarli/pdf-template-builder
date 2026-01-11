// Default property values for all component types
// These provide complete property objects with all required fields

import type {
  TextLabelProperties,
  TextFieldProperties,
  SignatureBoxProperties,
  DateFieldProperties,
  CheckboxProperties,
  TableProperties,
  ImageProperties,
  ParagraphProperties,
  DividerProperties,
  PlaceholderProperties,
} from '@/lib/types/document.types';

// ============================================================================
// Default Text Label Properties
// ============================================================================

export const DEFAULT_TEXT_LABEL_PROPERTIES: TextLabelProperties = {
  content: '',
  fontSize: 11,
  fontFamily: 'Inter',
  fontWeight: 'normal',
  italic: false,
  color: '#1a1a1a',
  textAlign: 'left',
  letterSpacing: 0,
  wordSpacing: 0,
  lineHeight: 1.2,
  decoration: 'none',
  decorationStyle: 'solid',
  decorationThickness: 1,
};

export function createTextLabelProperties(overrides: Partial<TextLabelProperties>): TextLabelProperties {
  return { ...DEFAULT_TEXT_LABEL_PROPERTIES, ...overrides };
}

// ============================================================================
// Default Text Field Properties
// ============================================================================

export const DEFAULT_TEXT_FIELD_PROPERTIES: TextFieldProperties = {
  label: '',
  fieldName: '',
  placeholder: '',
  required: false,
  labelFontSize: 10,
  labelColor: '#374151',
  labelFontWeight: 'medium',
  labelFontFamily: 'Inter',
  fontSize: 11,
  fontFamily: 'Inter',
  inputHeight: 10,
  inputPaddingVertical: 4,
  inputPaddingHorizontal: 8,
  borderWidth: 1,
  borderColor: '#d1d5db',
  borderRadius: 4,
  backgroundColor: '#ffffff',
  placeholderColor: '#9ca3af',
  labelSpacing: 4,
  fullWidth: true,
};

export function createTextFieldProperties(overrides: Partial<TextFieldProperties>): TextFieldProperties {
  return { ...DEFAULT_TEXT_FIELD_PROPERTIES, ...overrides };
}

// ============================================================================
// Default Signature Box Properties
// ============================================================================

export const DEFAULT_SIGNATURE_BOX_PROPERTIES: SignatureBoxProperties = {
  signerName: 'Signature',
  signerTitle: '',
  showLine: true,
  dateRequired: true,
  lineThickness: 1,
  lineColor: '#374151',
  signerNameFontSize: 10,
  signerNameColor: '#1a1a1a',
  signerNameFontWeight: 'normal',
  signerTitleFontSize: 9,
  signerTitleColor: '#6b7280',
  dateLineWidth: 60,
  dateLabel: 'Date',
  dateLabelFontSize: 9,
  dateLabelColor: '#6b7280',
  spacingBetweenElements: 8,
  signatureAreaHeight: 20,
};

export function createSignatureBoxProperties(overrides: Partial<SignatureBoxProperties>): SignatureBoxProperties {
  return { ...DEFAULT_SIGNATURE_BOX_PROPERTIES, ...overrides };
}

// ============================================================================
// Default Date Field Properties
// ============================================================================

export const DEFAULT_DATE_FIELD_PROPERTIES: DateFieldProperties = {
  label: '',
  fieldName: '',
  format: 'MM/DD/YYYY',
  required: false,
  labelFontSize: 10,
  labelColor: '#374151',
  labelFontWeight: 'medium',
  fontSize: 11,
  inputHeight: 10,
  inputPadding: 8,
  borderWidth: 1,
  borderColor: '#d1d5db',
  borderRadius: 4,
  backgroundColor: '#ffffff',
  placeholderColor: '#9ca3af',
  showIcon: true,
  iconColor: '#6b7280',
};

export function createDateFieldProperties(overrides: Partial<DateFieldProperties>): DateFieldProperties {
  return { ...DEFAULT_DATE_FIELD_PROPERTIES, ...overrides };
}

// ============================================================================
// Default Checkbox Properties
// ============================================================================

export const DEFAULT_CHECKBOX_PROPERTIES: CheckboxProperties = {
  label: '',
  fieldName: '',
  defaultChecked: false,
  size: 'medium',
  checkedColor: '#6750a4',
  uncheckedBackgroundColor: '#ffffff',
  borderColor: '#79747e',
  borderWidth: 1.5,
  borderRadius: 2,
  checkmarkStyle: 'check',
  checkmarkColor: '#ffffff',
  labelFontSize: 11,
  labelColor: '#1c1b1f',
  labelFontWeight: 'normal',
  spacing: 6,
};

export function createCheckboxProperties(overrides: Partial<CheckboxProperties>): CheckboxProperties {
  return { ...DEFAULT_CHECKBOX_PROPERTIES, ...overrides };
}

// ============================================================================
// Default Table Properties
// ============================================================================

export const DEFAULT_TABLE_PROPERTIES: TableProperties = {
  columnDefinitions: [
    { type: 'relative', width: 1 },
    { type: 'relative', width: 1 },
    { type: 'relative', width: 1 },
    { type: 'relative', width: 1 },
  ],
  headers: ['Column 1', 'Column 2', 'Column 3', 'Column 4'],
  data: [['', '', '', '']],
  showHeader: true,
  headerBackground: '#f3f4f6',
  headerTextColor: '#1a1a1a',
  headerFontSize: 10,
  headerFontWeight: 'bold',
  headerPaddingVertical: 6,
  headerPaddingHorizontal: 8,
  headerVerticalAlign: 'middle',
  headerBorderBottom: true,
  headerBorderBottomWidth: 1,
  headerBorderBottomColor: '#d1d5db',
  cellTextColor: '#374151',
  cellFontSize: 10,
  cellFontWeight: 'normal',
  cellPaddingVertical: 6,
  cellPaddingHorizontal: 8,
  cellVerticalAlign: 'middle',
  alternateRowColors: false,
  evenRowBackground: '#ffffff',
  oddRowBackground: '#f9fafb',
  borderStyle: 'all',
  borderWidth: 1,
  borderColor: '#d1d5db',
};

export function createTableProperties(overrides: Partial<TableProperties>): TableProperties {
  return { ...DEFAULT_TABLE_PROPERTIES, ...overrides };
}

// ============================================================================
// Default Image Properties
// ============================================================================

export const DEFAULT_IMAGE_PROPERTIES: ImageProperties = {
  src: '',
  alt: 'Image',
  imageType: 'raster',
  fitMode: 'fitArea',
  compressionQuality: 'high',
  rasterDpi: 288,
  useOriginalImage: false,
};

export function createImageProperties(overrides: Partial<ImageProperties>): ImageProperties {
  return { ...DEFAULT_IMAGE_PROPERTIES, ...overrides };
}

// ============================================================================
// Default Paragraph Properties
// ============================================================================

export const DEFAULT_PARAGRAPH_PROPERTIES: ParagraphProperties = {
  content: '',
  fontSize: 11,
  fontFamily: 'Inter',
  fontWeight: 'normal',
  italic: false,
  color: '#374151',
  textAlign: 'left',
  letterSpacing: 0,
  wordSpacing: 0,
  lineHeight: 1.5,
  paragraphSpacing: 8,
  firstLineIndentation: 0,
  decoration: 'none',
  decorationStyle: 'solid',
};

export function createParagraphProperties(overrides: Partial<ParagraphProperties>): ParagraphProperties {
  return { ...DEFAULT_PARAGRAPH_PROPERTIES, ...overrides };
}

// ============================================================================
// Default Divider Properties
// ============================================================================

export const DEFAULT_DIVIDER_PROPERTIES: DividerProperties = {
  orientation: 'horizontal',
  thickness: 1,
  color: '#d1d5db',
};

export function createDividerProperties(overrides: Partial<DividerProperties>): DividerProperties {
  return { ...DEFAULT_DIVIDER_PROPERTIES, ...overrides };
}

// ============================================================================
// Default Placeholder Properties
// ============================================================================

export const DEFAULT_PLACEHOLDER_PROPERTIES: PlaceholderProperties = {
  label: 'Placeholder',
  variant: 'default',
  showIcon: true,
};

export function createPlaceholderProperties(overrides: Partial<PlaceholderProperties>): PlaceholderProperties {
  return { ...DEFAULT_PLACEHOLDER_PROPERTIES, ...overrides };
}
